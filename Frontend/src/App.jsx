import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";

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

          {/* Protected Application Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/onboarding" element={<BusinessOnboarding />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/inventory" element={<InventoryAuditPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/pos" element={<POSTerminalPage />} />
          </Route>

          {/* Fallback default redirect */}
          <Route path="*" element={<Navigate to="/register" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}