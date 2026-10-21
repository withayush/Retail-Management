import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute, OnboardingRoute } from "./routes/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import PageLoader from "./components/common/PageLoader";
import ErrorBoundary from "./components/common/ErrorBoundary";

// Lazy-loaded page components for route-based code-splitting
const Register = lazy(() => import("./pages/auth/RegisterPage"));
const Login = lazy(() => import("./pages/auth/LoginPage"));
const VerifyOTP = lazy(() => import("./pages/auth/VerifyOTPPage"));
const BusinessOnboarding = lazy(() => import("./pages/onboarding/BusinessOnboardingPage"));
const Dashboard = lazy(() => import("./pages/dashboard/DashboardPage"));
const ProfilePage = lazy(() => import("./pages/profile/ProfilePage"));
const ProductsPage = lazy(() => import("./pages/products/ProductsPage"));
const InventoryAuditPage = lazy(() => import("./pages/inventory/InventoryPage"));
const CustomersPage = lazy(() => import("./pages/customers/CustomersPage"));
const SuppliersPage = lazy(() => import("./pages/suppliers/SuppliersPage"));
const POSTerminalPage = lazy(() => import("./pages/pos/POSTerminalPage"));
const SalesHistoryPage = lazy(() => import("./pages/pos/SalesHistoryPage"));
const ReconciliationPage = lazy(() => import("./pages/reconciliation/ReconciliationPage"));
const ExpensesPage = lazy(() => import("./pages/expenses/ExpensesPage"));
const FinancialAnalyticsPage = lazy(() => import("./pages/analytics/FinancialAnalyticsPage"));
const SalesPerformancePage = lazy(() => import("./pages/analytics/SalesPerformancePage"));
const ProfitAnalyticsPage = lazy(() => import("./pages/analytics/ProfitAnalyticsPage"));
const PurchaseOrdersPage = lazy(() => import("./pages/procurement/PurchaseOrdersPage"));
const GoodsReceivedPage = lazy(() => import("./pages/procurement/GoodsReceivedPage"));

// Quick Test Component to safely demonstrate Error Boundary interception
function ErrorBoundaryCrashDemo() {
  throw new Error("Demonstration: VendorOS Error Boundary successfully intercepted this crash! Blank screen avoided.");
}

export default function App() {
  return (
    <ErrorBoundary>
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
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/verify-otp" element={<VerifyOTP />} />
            <Route path="/test-error" element={<ErrorBoundaryCrashDemo />} />

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
              <Route path="/purchases" element={<PurchaseOrdersPage />} />
              <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
              <Route path="/grn" element={<GoodsReceivedPage />} />
              <Route path="/goods-received" element={<GoodsReceivedPage />} />
              <Route path="/expenses" element={<ExpensesPage />} />
              <Route path="/expense-categories" element={<ExpensesPage />} />
              <Route path="/analytics" element={<FinancialAnalyticsPage />} />
              <Route path="/profit" element={<ProfitAnalyticsPage />} />
              <Route path="/analytics/profit" element={<ProfitAnalyticsPage />} />
              <Route path="/profit-analytics" element={<ProfitAnalyticsPage />} />
              <Route path="/sales-analytics" element={<SalesPerformancePage />} />
              <Route path="/analytics/sales" element={<SalesPerformancePage />} />
              <Route path="/reconciliation" element={<ReconciliationPage />} />
            </Route>

            {/* Fallback default redirect */}
            <Route path="/index.html" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  </ErrorBoundary>
  );
}