import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({ children }) {
  const { isAuthenticated, hasBusiness, loading } = useAuth();

  // Debug logs
  console.log("ProtectedRoute - isAuthenticated:", isAuthenticated);
  console.log("ProtectedRoute - hasBusiness:", hasBusiness);
  console.log("ProtectedRoute - loading:", loading);

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

  if (!hasBusiness) {
    console.log("ProtectedRoute - Redirecting to onboarding because hasBusiness is false");
    return <Navigate to="/business-onboarding" replace />;
  }

  return children;
}

export function OnboardingRoute({ children }) {
  const { isAuthenticated, hasBusiness, loading } = useAuth();

  // Debug logs
  console.log("OnboardingRoute - isAuthenticated:", isAuthenticated);
  console.log("OnboardingRoute - hasBusiness:", hasBusiness);
  console.log("OnboardingRoute - loading:", loading);

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

  if (hasBusiness) {
    console.log("OnboardingRoute - Redirecting to dashboard because hasBusiness is true");
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
