import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute, OnboardingRoute } from "./routes/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";

import Register from "./features/auth/Register";
import Login from "./features/auth/Login";
import VerifyOTP from "./features/auth/VerifyOTP";
import BusinessOnboarding from "./features/business/BusinessOnboarding";
import Dashboard from "./features/dashboard/Dashboard";
import ProfilePage from "./features/profile/ProfilePage";
import ProductsPage from "./features/products/ProductsPage";
import InventoryAuditPage from "./features/inventory/InventoryAuditPage";
import CustomersPage from "./features/customers/CustomersPage";
import SuppliersPage from "./features/suppliers/SuppliersPage";
import POSTerminalPage from "./features/pos/POSTerminalPage";
import SalesHistoryPage from "./features/pos/SalesHistoryPage";
import ReconciliationPage from "./features/reconciliation/ReconciliationPage";
import ExpensesPage from "./features/expenses/ExpensesPage";

export default function App() {

  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#18181b",
            color: "#fafafa",
            border: "1px solid #27272a",
            borderRadius: "0.75rem",
            fontSize: "0.875rem",
          },
        }}
      />
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

          {/* Protected Application Routes (with Shared Persistent Layout) */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/inventory" element={<InventoryAuditPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/suppliers" element={<SuppliersPage />} />
            <Route path="/pos" element={<POSTerminalPage />} />

            <Route path="/sales" element={<SalesHistoryPage />} />
            <Route path="/invoices" element={<SalesHistoryPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/expense-categories" element={<ExpensesPage />} />
            <Route path="/reconciliation" element={<ReconciliationPage />} />
          </Route>

          {/* Fallback default redirect */}
          <Route path="/index.html" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}