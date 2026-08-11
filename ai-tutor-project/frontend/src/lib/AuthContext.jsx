import { createContext, useContext, useState } from "react";
import { authApi } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("access_token"));

  async function login(email, password) {
    const { data } = await authApi.login({ email, password });
    localStorage.setItem("access_token", data.access_token);
    setToken(data.access_token);
  }

  async function register(fullName, email, password) {
    await authApi.register({ full_name: fullName, email, password });
    await login(email, password);
  }

  function logout() {
    localStorage.removeItem("access_token");
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ token, login, register, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
