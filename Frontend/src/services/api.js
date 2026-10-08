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
    if (
      businessId &&
      businessId !== "undefined" &&
      businessId !== "null" &&
      businessId.trim() !== ""
    ) {
      config.headers["x-business-id"] = businessId;
    } else {
      if (config.headers) {
        delete config.headers["x-business-id"];
        delete config.headers["x-tenant-id"];
      }
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

// 2. Response Interceptor: Safe HttpOnly Cookie Refresh & loop-immune 401/403 handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Guard against undefined response or network errors
    if (!error.response || !originalRequest) {
      return Promise.reject(error);
    }

    const errStatus = error.response.status;
    const errCode = error.response.data?.code;

    // ── Handle Stale Business Context (Auto-Healing & Clean Auto-Resolve Retry) ──
    const isStaleBusinessError =
      error.response.data?.staleContext ||
      errCode === "NO_ACCESS_TO_BUSINESS" ||
      errCode === "BUSINESS_NOT_FOUND" ||
      (errStatus === 400 && errCode === "INVALID_BUSINESS_ID");

    if (isStaleBusinessError && !originalRequest._businessRetry) {
      originalRequest._businessRetry = true;
      console.warn(`[API] Stale business context detected (${errCode}). Purging stale business ID and auto-resolving...`);

      // 1. Purge stale business from client storage
      localStorage.removeItem("businessId");
      localStorage.removeItem("business");

      // 2. Strip stale tenant headers
      if (originalRequest.headers) {
        delete originalRequest.headers["x-business-id"];
        delete originalRequest.headers["x-tenant-id"];
      }

      // 3. Notify AuthContext to refresh state in the background
      window.dispatchEvent(new Event("business:stale_context"));

      // 4. Retry cleanly without stale header so backend auto-resolves user's active business
      return api(originalRequest);
    }

    // ── Handle BUSINESS_ONBOARDING_REQUIRED (Authenticated user has no business yet) ──
    if (errStatus === 403 && errCode === "BUSINESS_ONBOARDING_REQUIRED") {
      localStorage.removeItem("businessId");
      localStorage.removeItem("business");
      window.dispatchEvent(new Event("business:onboarding_required"));
      if (!isPublicPage() && !window.location.pathname.includes("onboarding")) {
        window.location.replace("/business-onboarding");
      }
      return Promise.reject(error);
    }

    const isAuthRoute =
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/register") ||
      originalRequest.url?.includes("/auth/verify-phone") ||
      originalRequest.url?.includes("/auth/resend-phone-otp") ||
      originalRequest.url?.includes("/auth/refresh");

    // Handle 401 Unauthorized only for protected endpoints (avoid infinite refresh loops)
    if (errStatus === 401 && !originalRequest._retry && !isAuthRoute) {
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
