import React, { createContext, useContext, useEffect, useState } from "react";
import API from "../utils/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState([]);

  /* ── Rehydrate user + tokens on page refresh ── */
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) setUser(JSON.parse(storedUser));
    } catch {
      localStorage.removeItem("user");
    } finally {
      setLoading(false);
    }
  }, []);

  /* ─────────────────────────────────────────────
     LOGIN
     Stores accessToken + refreshToken separately
     so api.js interceptor can access them easily
  ───────────────────────────────────────────── */
  const login = async (email, password) => {
    const { data } = await API.post("/auth/login", { email, password });

    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);

    // Store user info without tokens
    const { accessToken, refreshToken, ...userOnly } = data;
    localStorage.setItem("user", JSON.stringify(userOnly));
    setUser(userOnly);
  };

  /* ─────────────────────────────────────────────
     REGISTER
  ───────────────────────────────────────────── */
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

  /* ─────────────────────────────────────────────
     LOGOUT
     Revokes refresh token on server, then clears
     everything locally
  ───────────────────────────────────────────── */
  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        await API.post("/auth/logout", { refreshToken });
      }
    } catch {
      // Clear locally even if server call fails
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
