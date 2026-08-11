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
};

export const chatApi = {
  ask: (payload) => api.post("/chat/ask", payload),
};

export default api;
