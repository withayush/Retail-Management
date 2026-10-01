import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getMyBusiness } from "../services/business.api";
import { getMe, logoutUser } from "../services/auth.api";
import { setInMemoryToken } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser && storedUser !== "undefined" && storedUser !== "null"
        ? JSON.parse(storedUser)
        : null;
    } catch {
      return null;
    }
  });

  const [hasBusiness, setHasBusiness] = useState(() => {
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

  // Initialize Auth state: validates HttpOnly cookie session via /auth/me
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      // Security: purge any legacy sensitive tokens from localStorage
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");

      try {
        const meRes = await getMe();
        if (isMounted && (meRes?.data?.account || meRes?.data)) {
          const rawAccount = meRes.data.account || meRes.data;
          const accountId = rawAccount._id || rawAccount.id || rawAccount.accountId;
          const accountData = {
            ...rawAccount,
            id: accountId,
            _id: accountId,
            accountId: accountId,
            fullName: rawAccount.fullName || rawAccount.name || "",
            name: rawAccount.fullName || rawAccount.name || "",
          };
          setUser(accountData);
          localStorage.setItem("user", JSON.stringify(accountData));
          await checkUserBusiness();
        }
      } catch (err) {
        // Unauthenticated or expired session
        if (isMounted) {
          localStorage.removeItem("user");
          localStorage.removeItem("businessId");
          localStorage.removeItem("business");
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
        setInMemoryToken(null);
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

  const login = async (userData, accessToken) => {
    // Security: zero storage of JWT credentials in localStorage
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");

    if (accessToken) {
      setInMemoryToken(accessToken);
    }

    let normalizedUser = userData;
    if (userData && typeof userData === "object") {
      const accountId = userData._id || userData.id || userData.accountId;
      normalizedUser = {
        ...userData,
        id: accountId,
        _id: accountId,
        accountId: accountId,
        fullName: userData.fullName || userData.name || "",
        name: userData.fullName || userData.name || "",
      };
      localStorage.setItem("user", JSON.stringify(normalizedUser));
    }

    setUser(normalizedUser);
    const hasBiz = await checkUserBusiness();
    return hasBiz;
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setInMemoryToken(null);
      localStorage.removeItem("user");
      localStorage.removeItem("businessId");
      localStorage.removeItem("business");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
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
