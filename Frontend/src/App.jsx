import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute, OnboardingRoute } from "./routes/ProtectedRoute";

import Register from "./features/auth/Register";
import Login from "./features/auth/Login";
import VerifyOTP from "./features/auth/VerifyOTP";
import BusinessOnboarding from "./features/business/BusinessOnboarding";
import Dashboard from "./features/dashboard/Dashboard";
import ProductsPage from "./features/products/ProductsPage";
import InventoryAuditPage from "./features/inventory/InventoryAuditPage";
import CustomersPage from "./features/customers/CustomersPage";
import POSTerminalPage from "./features/pos/POSTerminalPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />

          {/* Onboarding Route */}
          <Route
            path="/business-onboarding"
            element={
              <OnboardingRoute>
                <BusinessOnboarding />
              </OnboardingRoute>
            }
          />
          <Route
            path="/onboarding"
            element={
              <OnboardingRoute>
                <BusinessOnboarding />
              </OnboardingRoute>
            }
          />

          {/* Protected Application Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <ProductsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <InventoryAuditPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers"
            element={
              <ProtectedRoute>
                <CustomersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pos"
            element={
              <ProtectedRoute>
                <POSTerminalPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback default redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}