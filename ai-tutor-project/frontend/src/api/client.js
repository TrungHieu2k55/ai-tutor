import axios from "axios";

const api = axios.create({
  baseURL: "/api", // Vite proxy /api -> http://localhost:8000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authApi = {
  register: (payload) => api.post("/auth/register", payload),
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
  upload: (file, onProgress) => {
    const form = new FormData();
    form.append("file", file);
    return api.post("/documents/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: onProgress,
    });
  },
  delete: (documentId) => api.delete(`/documents/${documentId}`),
};

export const chatApi = {
  ask: (payload) => api.post("/chat/ask", payload),
  getConversations: (documentId) =>
    api.get("/chat/conversations", { params: documentId ? { document_id: documentId } : {} }),
  getMessages: (conversationId) =>
    api.get(`/chat/conversations/${conversationId}/messages`),
  createConversation: (payload) => api.post("/chat/conversations", payload),
  deleteConversation: (conversationId) => api.delete(`/chat/conversations/${conversationId}`),
};

export const adminApi = {
  getStats: () => api.get("/admin/stats"),
  getUsers: () => api.get("/admin/users"),
  createUser: (payload) => api.post("/admin/users", payload),
  updateUser: (userId, payload) => api.put(`/admin/users/${userId}`, payload),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  getAllDocuments: () => api.get("/admin/documents"),
  deleteDocument: (docId) => api.delete(`/admin/documents/${docId}`),
  getRecentQueries: () => api.get("/admin/recent-queries"),
  getAIStats: () => api.get("/admin/ai-stats"),
};

export default api;
