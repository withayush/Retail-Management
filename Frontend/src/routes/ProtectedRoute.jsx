import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated, hasBusiness, loading } = useAuth();
  const storedBusinessId = typeof localStorage !== "undefined" ? localStorage.getItem("businessId") : null;
  const hasValidStoredBusiness = Boolean(
    storedBusinessId &&
    storedBusinessId !== "null" &&
    storedBusinessId !== "undefined" &&
    storedBusinessId.trim() !== ""
  );

  // Eliminate React 18 async state batching race condition:
  // 1. Context state (hasBusiness)
  // 2. Synchronous storage (localStorage.businessId)
  // 3. Navigation transition state (location.state?.onboardingCompleted)
  const effectiveHasBusiness =
    hasBusiness ||
    hasValidStoredBusiness ||
    Boolean(location.state?.onboardingCompleted);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground mt-4">Loading security context...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!effectiveHasBusiness) {
    return <Navigate to="/business-onboarding" replace />;
  }

  return children;
}

export function OnboardingRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated, hasBusiness, loading } = useAuth();
  const storedBusinessId = typeof localStorage !== "undefined" ? localStorage.getItem("businessId") : null;
  const hasValidStoredBusiness = Boolean(
    storedBusinessId &&
    storedBusinessId !== "null" &&
    storedBusinessId !== "undefined" &&
    storedBusinessId.trim() !== ""
  );
  const effectiveHasBusiness = hasBusiness || hasValidStoredBusiness;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground mt-4">Loading security context...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (effectiveHasBusiness) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
