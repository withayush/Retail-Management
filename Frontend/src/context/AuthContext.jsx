import { createContext, useContext, useState, useEffect } from "react";
import { getMyBusiness } from "../services/business.api";
import { getMe, logoutUser } from "../services/auth.api";

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

  const [hasBusiness, setHasBusiness] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkUserBusiness = async () => {
    try {
      const response = await getMyBusiness();
      console.log("Business check response:", response);

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
        localStorage.setItem("businessId", businessId.toString());
        return true;
      } else {
        setHasBusiness(false);
        localStorage.removeItem("businessId");
        return false;
      }
    } catch (err) {
      console.log("Business check info (user likely needs onboarding):", err?.response?.data?.message || err.message);
      setHasBusiness(false);
      return false;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = localStorage.getItem("user");
      const token = localStorage.getItem("accessToken");

      if (storedUser && storedUser !== "undefined" && storedUser !== "null") {
        try {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
        } catch {
          setUser(null);
        }
      }

      // If user is authenticated, sync profile and check business
      if (token && token !== "undefined" && token !== "null") {
        try {
          const meRes = await getMe();
          if (meRes?.data?.account || meRes?.data) {
            const accountData = meRes.data.account || meRes.data;
            setUser(accountData);
            localStorage.setItem("user", JSON.stringify(accountData));
          }
        } catch (err) {
          console.log("Sync profile check:", err?.response?.data?.message || err.message);
        }

        await checkUserBusiness();
      } else {
        // If no token exists, but cookies exist, try to fetch user
        try {
          const meRes = await getMe();
          if (meRes?.data?.account || meRes?.data) {
            const accountData = meRes.data.account || meRes.data;
            setUser(accountData);
            localStorage.setItem("user", JSON.stringify(accountData));
            await checkUserBusiness();
          }
        } catch {
          // Unauthenticated state
          setHasBusiness(false);
        }
      }

      setLoading(false);
    };

    initializeAuth();
  }, []);

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
    await checkUserBusiness();
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.clear();
      setUser(null);
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
