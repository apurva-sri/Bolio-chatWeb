import axios from "axios";

const api = axios.create({ baseURL: "/api" });

// Before every request → attach access token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// After every response → if 401, try to silently refresh
api.interceptors.response.use(
  (response) => response, // success → pass through

  async (error) => {
    const original = error.config;

    // Access token expired AND we haven't retried yet
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true; // prevent infinite loop

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        const { data } = await axios.post("/api/auth/refresh", {
          refreshToken,
        });

        // Save the new access token
        localStorage.setItem("accessToken", data.accessToken);

        // Retry the original failed request with the new token
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (refreshError) {
        // Refresh token also expired → force login
        localStorage.clear();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
