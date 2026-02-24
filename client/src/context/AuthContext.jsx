import React, { createContext, useContext, useEffect, useState } from "react";
import API from "../utils/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState([]);

  /* ── Rehydrate on refresh ── */
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    } catch {
      localStorage.removeItem("user");
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── LOGIN ── */
  const login = async (email, password) => {
    const { data } = await API.post("/auth/login", { email, password });

    // Store tokens separately so api.js interceptor can read them
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);

    // Store user WITHOUT tokens mixed in
    const { accessToken, refreshToken, ...userOnly } = data;
    localStorage.setItem("user", JSON.stringify(userOnly));
    setUser(userOnly);
  };

  /* ── REGISTER ── */
  const register = async (username, email, password) => {
    const { data } = await API.post("/auth/register", {
      username,
      email,
      password,
    });

    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);

    const { accessToken, refreshToken, ...userOnly } = data;
    localStorage.setItem("user", JSON.stringify(userOnly));
    setUser(userOnly);
  };

  /* ── LOGOUT — revokes refresh token on server ── */
  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        await API.post("/auth/logout", { refreshToken });
      }
    } catch {
      // still clear locally even if server call fails
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        register,
        logout,
        loading,
        onlineUsers,
        setOnlineUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
