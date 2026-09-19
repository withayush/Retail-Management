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

    if (token && token !== "undefined" && token !== "null") {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (businessId && businessId !== "undefined" && businessId !== "null") {
      config.headers["x-business-id"] = businessId;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Helper: Check if current route is already an authentication/public page
const isPublicPage = () => {
  const path = window.location.pathname;
  return (
    path.startsWith("/login") ||
    path.startsWith("/register") ||
    path.startsWith("/verify-otp")
  );
};

// 2. Response Interceptor: Safe Token Refresh & loop-immune 401 handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Guard against undefined response or network errors
    if (!error.response || !originalRequest) {
      return Promise.reject(error);
    }

    const isAuthRoute =
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/register") ||
      originalRequest.url?.includes("/auth/verify-phone") ||
      originalRequest.url?.includes("/auth/resend-phone-otp") ||
      originalRequest.url?.includes("/auth/refresh");

    // Handle 401 Unauthorized only for protected endpoints (avoid infinite refresh loops)
    if (error.response.status === 401 && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refreshToken");

      if (refreshToken && refreshToken !== "undefined" && refreshToken !== "null") {
        try {
          const response = await axios.post(
            `${baseURL}/auth/refresh`,
            { refreshToken },
            { withCredentials: true }
          );

          const { accessToken, refreshToken: newRefreshToken } =
            response.data?.data || response.data || {};

          if (accessToken) {
            localStorage.setItem("accessToken", accessToken);
            if (newRefreshToken) {
              localStorage.setItem("refreshToken", newRefreshToken);
            }

            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.warn("Silent token refresh failed:", refreshError?.message);
        }
      }

      // If refresh is impossible or failed, clean up auth tokens gracefully
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      localStorage.removeItem("businessId");

      // Notify window without destructive page reloads
      window.dispatchEvent(new Event("auth:unauthorized"));

      // Only redirect if user is currently on a protected route (never reload if already on /login)
      if (!isPublicPage()) {
        window.location.replace("/login");
      }
    }

    return Promise.reject(error);
  }
);

export default api;
