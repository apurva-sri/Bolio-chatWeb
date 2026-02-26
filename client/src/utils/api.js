import axios from "axios";

// Fallback to localhost if VITE_ env not injected yet
const BASE_URL =
  import.meta.env?.VITE_API_URL || "http://localhost:5000/api";

const API = axios.create({ baseURL: BASE_URL });

/* ── Attach token to every request ── */
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ── Auto-refresh on 401 "Access token expired" ── */
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

    const shouldRefresh =
      error.response?.status === 401 &&
      error.response?.data?.message === "Access token expired" &&
      !original._retry;

    if (!shouldRefresh) return Promise.reject(error);

    if (isRefreshing) {
      return new Promise((resolve, reject) =>
        failedQueue.push({ resolve, reject }),
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

      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
        refreshToken,
      });

      localStorage.setItem("accessToken",  data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      API.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;
      processQueue(null, data.accessToken);
      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return API(original);
    } catch (err) {
      processQueue(err, null);
      localStorage.clear();
      window.location.href = "/login";
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  },
);

export default API;
