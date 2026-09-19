import axios from "axios";

const rawBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
const baseURL = rawBaseUrl.endsWith("/api") ? rawBaseUrl : `${rawBaseUrl}/api`;

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// 1. Request Interceptor: Attach Access Token and x-business-id to all outgoing requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    const businessId = localStorage.getItem("businessId");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (businessId) {
      config.headers["x-business-id"] = businessId;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Response Interceptor: Handle Token Expiration and Refresh Retries
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle token expiration & retry
    if (
      error.response &&
      error.response.status === 401 &&
      (error.response.data?.code === "TOKEN_EXPIRED" || error.response.data?.code === "INVALID_ACCESS_TOKEN") &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
          throw new Error("No refresh token found");
        }

        const response = await axios.post(
          `${baseURL}/auth/refresh`,
          { refreshToken },
          { withCredentials: true }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data?.data || {};

        if (accessToken) {
          localStorage.setItem("accessToken", accessToken);
          if (newRefreshToken) {
            localStorage.setItem("refreshToken", newRefreshToken);
          }

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/me")
    ) {
      localStorage.clear();
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;
