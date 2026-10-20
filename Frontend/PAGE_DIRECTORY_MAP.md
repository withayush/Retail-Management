# VendorOS — Page & Feature Directory Navigation Map

This document answers the core developer question: **"Konsi page ki file kaha h, aur kaunse components use karti h?"** (Where is each page file located, and what components does it use?)

---

## 🗺️ Master Route-to-File Matrix

| # | Route URL | Screen / Page Name | Primary Page File (`src/pages/`) | Domain Feature Code (`src/features/`) | Key Modals & Components | Associated APIs (`src/services/`) |
|---|---|---|---|---|---|---|
| **1** | `/login` | Merchant Login | [`src/pages/auth/LoginPage.jsx`](file:///c:/Users/AYUSH/OneDrive/Desktop/VenderOS/Frontend/src/pages/auth/LoginPage.jsx) | `src/features/auth/Login.jsx` | `GoogleAuthButton` | `auth.api.js` |
| **2** | `/register` | Owner Registration | [`src/pages/auth/RegisterPage.jsx`](file:///c:/Users/AYUSH/OneDrive/Desktop/VenderOS/Frontend/src/pages/auth/RegisterPage.jsx) | `src/features/auth/Register.jsx` | Phone OTP Input | `auth.api.js` |
| **3** | `/verify-otp` | 6-Digit Phone OTP | [`src/pages/auth/VerifyOTPPage.jsx`](file:///c:/Users/AYUSH/OneDrive/Desktop/VenderOS/Frontend/src/pages/auth/VerifyOTPPage.jsx) | `src/features/auth/VerifyOTP.jsx` | Cryptographic countdown | `auth.api.js` |
| **4** | `/business-onboarding` | 3-Step Store Setup | [`src/pages/onboarding/BusinessOnboardingPage.jsx`](file:///c:/Users/AYUSH/OneDrive/Desktop/VenderOS/Frontend/src/pages/onboarding/BusinessOnboardingPage.jsx) | `src/features/business/BusinessOnboarding.jsx` | Step 1 Details, Step 2 Address/GST, Step 3 Hours | `business.api.js` |
| **5** | `/dashboard` | Store Dashboard | [`src/pages/dashboard/DashboardPage.jsx`](file:///c:/Users/AYUSH/OneDrive/Desktop/VenderOS/Frontend/src/pages/dashboard/DashboardPage.jsx) | `src/features/dashboard/Dashboard.jsx` | `DashboardMetrics`, KPI cards | `analytics.api.js`, `sale.api.js` |
| **6** | `/pos` | POS Billing Terminal | [`src/pages/pos/POSTerminalPage.jsx`](file:///c:/Users/AYUSH/OneDrive/Desktop/VenderOS/Frontend/src/pages/pos/POSTerminalPage.jsx) | `src/features/pos/POSTerminalPage.jsx` | `POSCart`, `POSProductGrid`, `SettlePaymentModal`, `POSCustomerModal` | `sale.api.js`, `product.api.js`, `payment.api.js` |
| **7** | `/sales` / `/invoices` | Sales History & Invoices | [`src/pages/pos/SalesHistoryPage.jsx`](file:///c:/Users/AYUSH/OneDrive/Desktop/VenderOS/Frontend/src/pages/pos/SalesHistoryPage.jsx) | `src/features/pos/SalesHistoryPage.jsx` | `SaleDetailModal`, `POSReceiptModal`, `MonthlyRevenueAggregator`, `MonthlyCogsCalculator`, `MonthlyGrossProfitCalculator` | `sale.api.js` |
| **8** | `/products` | Product Master Catalog | [`src/pages/products/ProductsPage.jsx`](file:///c:/Users/AYUSH/OneDrive/Desktop/VenderOS/Frontend/src/pages/products/ProductsPage.jsx) | `src/features/products/ProductsPage.jsx` | `ProductForm`, `CategoriesModal`, `ArchiveProductModal`, `ProductStats` | `product.api.js`, `category.api.js` |
| **9** | `/inventory` | Inventory Audit & Stock | [`src/pages/inventory/InventoryPage.jsx`](file:///c:/Users/AYUSH/OneDrive/Desktop/VenderOS/Frontend/src/pages/inventory/InventoryPage.jsx) | `src/features/inventory/InventoryAuditPage.jsx` | `StockInModal`, `StockOutModal`, `StockAdjustModal`, `ReorderLevelModal`, `LedgerTable`, `AlertsTable` | `inventory.api.js` |
| **10** | `/customers` | Khata / Udhaar & CRM | [`src/pages/customers/CustomersPage.jsx`](file:///c:/Users/AYUSH/OneDrive/Desktop/VenderOS/Frontend/src/pages/customers/CustomersPage.jsx) | `src/features/customers/CustomersPage.jsx` | `AddCustomerModal`, `EditCustomerModal`, `CustomerCRMModal`, `CustomerLedgerModal`, `CustomerPaymentHistoryModal`, `SettleKhataModal` | `customer.api.js` |
| **11** | `/suppliers` | Supplier Master & Payables | [`src/pages/suppliers/SuppliersPage.jsx`](file:///c:/Users/AYUSH/OneDrive/Desktop/VenderOS/Frontend/src/pages/suppliers/SuppliersPage.jsx) | `src/features/suppliers/SuppliersPage.jsx` | `AddSupplierModal`, `EditSupplierModal`, `Supplier360Modal`, `SupplierLedgerModal`, `SettleSupplierModal`, `OutstandingPayablesModal` | `supplier.api.js` |
| **12** | `/purchases` / `/purchase-orders` | Supplier Purchase Orders | [`src/pages/procurement/PurchaseOrdersPage.jsx`](file:///c:/Users/AYUSH/OneDrive/Desktop/VenderOS/Frontend/src/pages/procurement/PurchaseOrdersPage.jsx) | `src/features/procurement/PurchaseOrdersPage.jsx` | `CreatePurchaseOrderModal`, `PurchaseOrderHistoryModal`, `ReceiveGoodsModal`, `GoodsReceivedNotesModal` | `purchaseOrder.api.js` |
| **13** | `/grn` / `/goods-received` | Goods Received Notes (GRN) | [`src/pages/procurement/GoodsReceivedPage.jsx`](file:///c:/Users/AYUSH/OneDrive/Desktop/VenderOS/Frontend/src/pages/procurement/GoodsReceivedPage.jsx) | `src/features/procurement/GoodsReceivedPage.jsx` | `ReceiveGoodsModal`, `GoodsReceivedNotesModal`, Auto-Stock-In Banner | `purchaseOrder.api.js`, `inventory.api.js` |
| **14** | `/expenses` | OpEx & Cash Burn | [`src/pages/expenses/ExpensesPage.jsx`](file:///c:/Users/AYUSH/OneDrive/Desktop/VenderOS/Frontend/src/pages/expenses/ExpensesPage.jsx) | `src/features/expenses/ExpensesPage.jsx` | `RecordExpenseModal`, `ExpenseCategoriesModal`, `CreateExpenseCategoryModal`, `MonthlyOpExAggregator` | `expense.api.js`, `expenseCategory.api.js` |
| **15** | `/analytics` / `/profit` | Financial P&L Analytics | [`src/pages/analytics/FinancialAnalyticsPage.jsx`](file:///c:/Users/AYUSH/OneDrive/Desktop/VenderOS/Frontend/src/pages/analytics/FinancialAnalyticsPage.jsx) | `src/features/analytics/FinancialAnalyticsPage.jsx` | `NetProfitHeroCards`, `ProfitWaterfallBar`, `ProductProfitMatrix`, `QuarterlyProfitCards`, `ReceivablesConsolidatedCard` | `analytics.api.js` |
| **16** | `/reconciliation` | Ledger Drift Detection | [`src/pages/reconciliation/ReconciliationPage.jsx`](file:///c:/Users/AYUSH/OneDrive/Desktop/VenderOS/Frontend/src/pages/reconciliation/ReconciliationPage.jsx) | `src/features/reconciliation/ReconciliationPage.jsx` | Reconciliation Run, Drift Discrepancy Table, Fix Shortcut | `reconciliation.api.js` |
| **17** | `/profile` | Store & User Settings | [`src/pages/profile/ProfilePage.jsx`](file:///c:/Users/AYUSH/OneDrive/Desktop/VenderOS/Frontend/src/pages/profile/ProfilePage.jsx) | `src/features/profile/ProfilePage.jsx` | Account settings, business profile, password change | `auth.api.js`, `business.api.js` |

---

## 🎯 Architecture Standards

### 1. Where do I find a screen?
Look inside `Frontend/src/pages/<screen-category>/<ScreenName>Page.jsx`.

### 2. Where do I find the screen's sub-components and modals?
Look inside `Frontend/src/features/<screen-category>/components/`.

### 3. Where do I find shared UI buttons, cards, inputs, and shell layout?
- UI Primitives: `Frontend/src/components/ui/`
- Layout Frame: `Frontend/src/components/layout/` (Sidebar, Header, UniversalSearchModal)
- Common: `Frontend/src/components/common/` (PageLoader)

### 4. Where do I find API endpoints?
Look inside `Frontend/src/services/<domain>.api.js`.
