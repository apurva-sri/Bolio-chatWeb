import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// ─── Request Interceptor: attach access token ───
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Response Interceptor: silent token refresh on 401 ───
// ─── Response Interceptor: silent token refresh on 401 ───
api.interceptors.response.use(
  (response) => {
    console.log(`[API Success] ${response.config.method.toUpperCase()} ${response.config.url}`, response.data);
    return response;
  },
  async (error) => {
    const original = error.config;
    console.error(`[API Error] ${original?.method?.toUpperCase()} ${original?.url}`, error.response?.data || error.message);

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error("No refresh token");

        const { data } = await axios.post('/api/auth/refresh', { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (refreshError) {
        console.error("[Auth] Session expired, logging out...");
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── AUTH ───
export const loginUser   = (data) => api.post('/auth/login', data);
export const registerUser = (data) => api.post('/auth/register', data);
export const verifyOtp   = (data) => api.post('/auth/verify-otp', data);
export const logoutUser  = (userId) => api.post('/auth/logout', { userId });

// ─── USERS ───
export const searchUsers = (username) => api.get(`/users/search?username=${username}`);

// ─── FRIENDS ───
export const sendFriendRequest   = (receiverId) => api.post('/friends/send-request', { receiverId });
export const acceptFriendRequest = (requestId)  => api.post('/friends/accept-request', { requestId });
export const rejectFriendRequest = (requestId)  => api.post('/friends/reject-request', { requestId });
export const getIncomingRequests = ()            => api.get('/friends/requests');
export const getFriends          = ()            => api.get('/friends/list');

// ─── CHATS ───
export const accessChat  = (userId) => api.post('/chats', { userId });
export const getAllChats  = ()         => api.get('/chats');

// ─── MESSAGES ───
export const sendMessage = (chatId, content) => api.post('/messages/send', { chatId, content });
export const getMessages = (chatId, page = 1) => api.get(`/messages/${chatId}?page=${page}`);

export default api;
