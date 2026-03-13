import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api';

let accessToken = null;
let authFromRefreshCallback = null;
let onUnauthorizedCallback = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function setAuthFromRefresh(callback) {
  authFromRefreshCallback = callback;
}

export function setOnUnauthorized(callback) {
  onUnauthorizedCallback = callback;
}

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isRefreshRequest =
      originalRequest?.url?.includes('/auth/refresh') ||
      originalRequest?.url?.includes('refresh');
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isRefreshRequest
    ) {
      originalRequest._retry = true;
      try {
        const { data } = await axios.post(
          `${baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        if (data.accessToken) {
          accessToken = data.accessToken;
          if (authFromRefreshCallback) authFromRefreshCallback(data);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshErr) {
        accessToken = null;
        if (onUnauthorizedCallback) onUnauthorizedCallback();
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
