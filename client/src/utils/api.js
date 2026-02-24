// client/src/utils/api.js
import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

/* ── Attach token to EVERY request ──
   Handles both old system (user.token) and new system (accessToken key)
   so you don't get locked out on first deploy                          */
API.interceptors.request.use((config) => {
  // New system: token stored separately
  const accessToken = localStorage.getItem("accessToken");
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
  }

  // Old system fallback: token was inside user object
  try {
    const userRaw = localStorage.getItem("user");
    if (userRaw) {
      const parsed = JSON.parse(userRaw);
      if (parsed?.token) {
        config.headers.Authorization = `Bearer ${parsed.token}`;
      }
    }
  } catch { /* ignore parse errors */ }

  return config;
});

/* ── Auto-refresh access token on 401 ── */
let isRefreshing = false;
let failedQueue  = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

API.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    // Only attempt refresh when server specifically says token expired
    const shouldRefresh =
      error.response?.status === 401 &&
      error.response?.data?.message === "Access token expired" &&
      !original._retry;

    if (!shouldRefresh) return Promise.reject(error);

    if (isRefreshing) {
      return new Promise((resolve, reject) =>
        failedQueue.push({ resolve, reject })
      ).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return API(original);
      });
    }

    original._retry = true;
    isRefreshing    = true;

    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) throw new Error("No refresh token");

      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/auth/refresh`,
        { refreshToken }
      );

      localStorage.setItem("accessToken",  data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      API.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;
      processQueue(null, data.accessToken);

      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return API(original);
    } catch (err) {
      processQueue(err, null);
      // Refresh failed — clear everything and redirect to login
      localStorage.clear();
      window.location.href = "/login";
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);

export default API;
