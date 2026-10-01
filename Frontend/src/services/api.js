import axios from "axios";

const rawBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
const baseURL = rawBaseUrl.endsWith("/api") ? rawBaseUrl : `${rawBaseUrl}/api`;

// ── In-Memory Token Store (Security: Zero Token Storage in LocalStorage/XSS Defense) ──
let inMemoryAccessToken = null;

export const setInMemoryToken = (token) => {
  inMemoryAccessToken = token || null;
};

export const getInMemoryToken = () => inMemoryAccessToken;

// Defense-in-depth: Immediately purge any legacy JWT tokens from localStorage to prevent XSS exfiltration
try {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }
} catch {
  // Ignore environments without localStorage access
}

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// 1. Request Interceptor: Attach in-memory token (if present) and x-business-id
api.interceptors.request.use(
  (config) => {
    const businessId = localStorage.getItem("businessId");

    // If an in-memory token is held, attach as Bearer; otherwise browser sends HttpOnly cookie automatically
    if (inMemoryAccessToken && inMemoryAccessToken !== "undefined" && inMemoryAccessToken !== "null") {
      config.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
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

// 2. Response Interceptor: Safe HttpOnly Cookie Refresh & loop-immune 401 handling
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

      try {
        // Attempt silent token refresh via HttpOnly refresh cookie (transmitted via withCredentials)
        const response = await axios.post(
          `${baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { accessToken } = response.data?.data || response.data || {};

        if (accessToken) {
          inMemoryAccessToken = accessToken;
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        // Retry original request (browser will automatically attach refreshed HttpOnly cookie)
        return api(originalRequest);
      } catch (refreshError) {
        console.warn("Silent token refresh failed:", refreshError?.message);
      }

      // If refresh failed or session is invalid, clean up in-memory token and cached state
      inMemoryAccessToken = null;
      localStorage.removeItem("user");
      localStorage.removeItem("businessId");
      localStorage.removeItem("business");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");

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

/**
 * Generates a cryptographically strong UUID v4 Idempotency-Key
 * for client-side transaction deduplication.
 */
export const generateIdempotencyKey = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export default api;
