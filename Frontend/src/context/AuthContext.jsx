import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getMyBusiness } from "../services/business.api";
import { getMe, logoutUser } from "../services/auth.api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token || token === "undefined" || token === "null") return null;
      const storedUser = localStorage.getItem("user");
      return storedUser && storedUser !== "undefined" && storedUser !== "null"
        ? JSON.parse(storedUser)
        : null;
    } catch {
      return null;
    }
  });

  const [hasBusiness, setHasBusiness] = useState(() => {
    const token = localStorage.getItem("accessToken");
    if (!token || token === "undefined" || token === "null") return false;
    const bId = localStorage.getItem("businessId");
    return Boolean(bId && bId !== "undefined" && bId !== "null");
  });

  const [business, setBusiness] = useState(() => {
    try {
      const stored = localStorage.getItem("business");
      return stored && stored !== "undefined" && stored !== "null" ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  const checkUserBusiness = useCallback(async () => {
    try {
      const response = await getMyBusiness();
      const data = response?.data;
      let businessData = null;

      if (Array.isArray(data) && data.length > 0) {
        businessData = data[0];
      } else if (data?.business) {
        businessData = data.business;
      } else if (data?.businesses && data.businesses.length > 0) {
        businessData = data.businesses[0];
      } else if (data && (data._id || data.id || data.businessName || data.business_name)) {
        businessData = data;
      }

      const businessId = businessData?._id || businessData?.id;
      if (businessData && businessId) {
        setHasBusiness(true);
        setBusiness(businessData);
        localStorage.setItem("businessId", businessId.toString());
        localStorage.setItem("business", JSON.stringify(businessData));
        return true;
      } else {
        setHasBusiness(false);
        setBusiness(null);
        localStorage.removeItem("businessId");
        localStorage.removeItem("business");
        return false;
      }
    } catch (err) {
      setHasBusiness(false);
      setBusiness(null);
      localStorage.removeItem("businessId");
      localStorage.removeItem("business");
      return false;
    }
  }, []);

  // Initialize Auth state without triggering speculative 401 loops
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const token = localStorage.getItem("accessToken");
      const storedUser = localStorage.getItem("user");

      if (!token || token === "undefined" || token === "null") {
        if (isMounted) {
          setUser(null);
          setHasBusiness(false);
          setLoading(false);
        }
        return;
      }

      if (storedUser && storedUser !== "undefined" && storedUser !== "null") {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          setUser(null);
        }
      }

      try {
        const meRes = await getMe();
        if (isMounted && (meRes?.data?.account || meRes?.data)) {
          const accountData = meRes.data.account || meRes.data;
          setUser(accountData);
          localStorage.setItem("user", JSON.stringify(accountData));
          await checkUserBusiness();
        }
      } catch (err) {
        console.warn("Auth initialization token check:", err?.response?.data?.message || err.message);
        if (isMounted) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          localStorage.removeItem("businessId");
          setUser(null);
          setHasBusiness(false);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen to unauthorized event from api.js interceptor
    const handleUnauthorized = () => {
      if (isMounted) {
        setUser(null);
        setHasBusiness(false);
        setLoading(false);
      }
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);

    return () => {
      isMounted = false;
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, [checkUserBusiness]);

  const login = async (userData, accessToken, refreshToken) => {
    if (accessToken && accessToken !== "undefined" && accessToken !== "null") {
      localStorage.setItem("accessToken", accessToken);
    }
    if (refreshToken && refreshToken !== "undefined" && refreshToken !== "null") {
      localStorage.setItem("refreshToken", refreshToken);
    }
    if (userData) {
      localStorage.setItem("user", JSON.stringify(userData));
    }

    setUser(userData);
    const hasBiz = await checkUserBusiness();
    return hasBiz;
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.clear();
      setUser(null);
      setBusiness(null);
      setHasBusiness(false);
    }
  };

  const refreshBusinessStatus = async () => {
    const status = await checkUserBusiness();
    return status;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        business,
        isAuthenticated: !!user,
        hasBusiness,
        login,
        logout,
        loading,
        refetchBusiness: checkUserBusiness,
        refreshBusinessStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
