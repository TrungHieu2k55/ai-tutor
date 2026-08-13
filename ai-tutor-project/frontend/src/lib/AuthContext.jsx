import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { authApi } from "~/api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("access_token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem("access_token"));

  const fetchUser = useCallback(async () => {
    try {
      const { data } = await authApi.me();
      setUser(data);
    } catch {
      // Token hết hạn hoặc không hợp lệ
      localStorage.removeItem("access_token");
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token, fetchUser]);

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
    setUser(null);
  }

  function updateUser(userData) {
    if (userData) {
      setUser((prev) => ({ ...prev, ...userData }));
    } else {
      fetchUser();
    }
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        login,
        register,
        logout,
        updateUser,
        fetchUser,
        isAuthenticated: !!token,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {
  return useContext(AuthContext);
}
