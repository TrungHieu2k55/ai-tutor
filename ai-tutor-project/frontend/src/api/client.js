import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  headers: {
    "bypass-tunnel-reminder": "true",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh: nếu nhận 401, tự động gọi /auth/refresh lấy token mới rồi retry
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Chỉ xử lý 401 và không phải request refresh/login (tránh loop vô hạn)
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      // Không có refresh token → buộc đăng nhập lại
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.location.href = "/login";
      return Promise.reject(error);
    }

    // Nếu đang refresh, xếp hàng chờ
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await api.post("/auth/refresh", { refresh_token: refreshToken });
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      api.defaults.headers.common.Authorization = `Bearer ${data.access_token}`;
      processQueue(null, data.access_token);
      originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export const authApi = {
  register: (payload) => api.post("/auth/register", payload),
  verifyOtp: (payload) => api.post("/auth/verify-otp", payload),
  resendOtp: (payload) => api.post("/auth/resend-otp", payload),
  forgotPassword: (payload) => api.post("/auth/forgot-password", payload),
  resetPassword: (payload) => api.post("/auth/reset-password", payload),
  login: (payload) => api.post("/auth/login", payload),
  me: () => api.get("/auth/me"),
  updateProfile: (payload) => api.put("/auth/profile", payload),
  uploadAvatar: (file) => {
    const form = new FormData();
    form.append("file", file);
    return api.post("/auth/avatar", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  deleteAvatar: () => api.delete("/auth/avatar"),
  changePassword: (payload) => api.put("/auth/password", payload),
};

export const documentsApi = {
  list: () => api.get("/documents/"),
  getProgress: () => api.get("/documents/progress"),
  upload: (file, onProgress) => {
    const form = new FormData();
    form.append("file", file);
    return api.post("/documents/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: onProgress,
    });
  },
  delete: (documentId) => api.delete(`/documents/${documentId}`),
  getQuizQuestions: (documentId, numQuestions = 15) =>
    api.get(`/documents/${documentId}/quiz-questions`, {
      params: { num_questions: numQuestions },
    }),
  exportQuizDocx: (documentId, questions, fileName) =>
    api.post(
      `/documents/${documentId}/quiz/export`,
      { questions, file_name: fileName },
      { responseType: "blob" }
    ),
  downloadQuiz: (documentId, numQuestions = 15) =>
    api.get(`/documents/${documentId}/quiz`, {
      params: { num_questions: numQuestions },
      responseType: "blob",
    }),
};

export const chatApi = {
  ask: (payload) => api.post("/chat/ask", payload),
  getConversations: (documentId) =>
    api.get("/chat/conversations", { params: documentId ? { document_id: documentId } : {} }),
  getMessages: (conversationId) =>
    api.get(`/chat/conversations/${conversationId}/messages`),
  createConversation: (payload) => api.post("/chat/conversations", payload),
  renameConversation: (conversationId, title) =>
    api.put(`/chat/conversations/${conversationId}`, { title }),
  deleteConversation: (conversationId) => api.delete(`/chat/conversations/${conversationId}`),
};

export const adminApi = {
  getStats: () => api.get("/admin/stats"),
  getUsers: (params) => api.get("/admin/users", { params }),
  createUser: (payload) => api.post("/admin/users", payload),
  updateUser: (userId, payload) => api.put(`/admin/users/${userId}`, payload),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  getAllDocuments: (params) => api.get("/admin/documents", { params }),
  deleteDocument: (docId) => api.delete(`/admin/documents/${docId}`),
  getRecentQueries: () => api.get("/admin/recent-queries"),
  getAIStats: () => api.get("/admin/ai-stats"),
  getSettings: () => api.get("/admin/settings"),
  updateSettings: (payload) => api.put("/admin/settings", payload),
};

export default api;
