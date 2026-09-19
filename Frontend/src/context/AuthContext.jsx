import { createContext, useContext, useState, useEffect } from "react";
import { getMyBusiness } from "../services/business.api";
import { getMe, logoutUser } from "../services/auth.api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [hasBusiness, setHasBusiness] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkUserBusiness = async () => {
    try {
      const response = await getMyBusiness();
      console.log("Business check response:", response);

      const data = response.data;
      // Handle array of businesses or single business object
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
      console.error("Business check error:", err);
      setHasBusiness(false);
      return false;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = localStorage.getItem("user");
      const token = localStorage.getItem("accessToken");

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          setUser(null);
        }
      }

      // Sync user profile from backend
      try {
        const meRes = await getMe();
        if (meRes?.data) {
          setUser(meRes.data);
          localStorage.setItem("user", JSON.stringify(meRes.data));
          await checkUserBusiness();
        }
      } catch {
        if (!token && !storedUser) {
          setUser(null);
          setHasBusiness(false);
        }
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (userData, accessToken, refreshToken) => {
    if (accessToken) localStorage.setItem("accessToken", accessToken);
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
    if (userData) localStorage.setItem("user", JSON.stringify(userData));

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

  // Function to manually refresh business status after onboarding
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
