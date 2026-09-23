# VendorOS Frontend Architecture & Implementation Documentation

This document tracks all frontend features, component structures, custom hooks, state models, architectural choices, and the implementation details of all modules in VendorOS.

---

## 1. Overview of Frontend Architecture

- **Framework**: React 19 + Vite
- **Routing**: React Router v7 (`react-router-dom`)
- **Styling**: Tailwind CSS with dark monochrome palette and design tokens (`bg-background`, `text-foreground`, `border-border`, `bg-card`, etc.)
- **Animations & Modals**: Framer Motion
- **Icons**: Lucide React
- **Notifications**: `react-hot-toast`
- **HTTP Client**: Axios with centralized Request/Response interceptors, bearer tokens, multi-tenant `x-business-id` header injection, and silent token refresh logic

---

## 2. Directory Structure & Module Breakdown

```text
Frontend/src/
├── context/
│   └── AuthContext.jsx                # Global Auth & Business active state
├── hooks/
│   ├── useBarcodeScanner.js           # Sub-millisecond hardware barcode scanner listener
│   └── usePOSKeyboard.js              # Global cashier hotkey management (F2, F4, F8, F9, Esc)
├── routes/
│   ├── AppRoutes.jsx                  # Main route mapping table
│   ├── ProtectedRoute.jsx             # Auth & active session route gate
│   └── OnboardingRoute.jsx            # Business onboarding status gate
├── services/                          # API Communication Clients
│   ├── api.js                         # Base Axios instance with interceptors
│   ├── auth.api.js                    # Auth endpoints (register, login, OTP, me, logout)
│   ├── business.api.js                # Business onboarding, settings, and context
│   ├── category.api.js                # Category CRUD endpoints
│   ├── customer.api.js                # Customer CRM, Khata ledger, and settlements
│   ├── inventory.api.js               # Stock In/Out, adjustments, alerts, and ledgers
│   ├── product.api.js                 # Products CRUD, barcode lookup, search, and archival
│   └── sale.api.js                    # POS checkout, sales history, and gross profit analytics
├── features/
│   ├── auth/                          # Authentication Views
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   └── VerifyOTP.jsx
│   ├── business/                      # Multi-Step Business Onboarding
│   │   └── BusinessOnboarding.jsx
│   ├── dashboard/                     # Vendor Dashboard
│   │   └── DashboardPage.jsx
│   ├── products/                      # Product Catalog Management
│   │   ├── ProductsPage.jsx
│   │   ├── components/
│   │   │   ├── CategoriesModal.jsx
│   │   │   ├── ProductForm.jsx
│   │   │   ├── ProductTable.jsx
│   │   │   ├── ProductFilters.jsx
│   │   │   ├── ProductStats.jsx
│   │   │   ├── ProductHeader.jsx
│   │   │   └── ArchiveProductModal.jsx
│   ├── inventory/                     # Store Stock State & Movement Ledger (T15-T22)
│   │   ├── InventoryAuditPage.jsx
│   │   └── components/
│   │       ├── InventoryTabsNav.jsx
│   │       ├── StoreStateTable.jsx
│   │       ├── InventoryLedgerTable.jsx
│   │       ├── InventoryAlertsTable.jsx
│   │       ├── StockInModal.jsx
│   │       ├── StockOutModal.jsx
│   │       ├── AdjustStockModal.jsx
│   │       └── ReorderModal.jsx
│   ├── pos/                           # POS Cashier Terminal & Billing Screen (T30)
│   │   ├── POSTerminalPage.jsx
│   │   └── components/
│   │       ├── POSHeader.jsx
│   │       ├── POSProductsGrid.jsx
│   │       ├── POSCart.jsx
│   │       ├── POSCustomerModal.jsx
│   │       ├── SettlePaymentModal.jsx
│   │       ├── PrintReceiptModal.jsx
│   │       └── POSKeyboardShortcutsModal.jsx
│   ├── customers/                     # Customer Profiles & Khata (Udhaar) CRM (T29)
│   │   ├── CustomersPage.jsx
│   │   └── components/
│   │       ├── CustomersStatsCards.jsx
│   │       ├── CustomersTable.jsx
│   │       ├── CustomerLedgerModal.jsx
│   │       ├── SettleKhataModal.jsx
│   │       └── AddCustomerModal.jsx
│   └── sales/                         # Invoices & Billing History
│       ├── SalesHistoryPage.jsx
│       └── components/
│           ├── SalesHistoryTable.jsx
│           └── SaleDetailModal.jsx
```

---

## 3. Implemented Modules Detailed Breakdown

### A. POS Billing Checkout Terminal (`Frontend/src/features/pos/`) [T30]
- **Hardware Barcode Scanner Listener (`useBarcodeScanner.js`)**: Auto-detects fast keystroke bursts (< 50ms interval) from USB/Bluetooth handheld barcode scanners and automatically appends matching products to the active cart.
- **Global Cashier Keyboard Hotkeys (`usePOSKeyboard.js`)**:
  - `F2`: Auto-focus product search box
  - `F4`: Open Customer selection / Khata modal
  - `F8`: Reset and clear active cart
  - `F9`: Proceed to payment / Settle modal
  - `F1`: Open shortcuts help cheat sheet
  - `Esc`: Close any open modal dialog
- **Quick Cart (`POSCart.jsx`)**: Real-time computation of subtotal, product-level discounts, GST tax amounts, and grand total.
- **Payment & Settle Modal (`SettlePaymentModal.jsx`)**:
  - Supports `CASH`, `UPI` (with reference ID), `CARD`, and `CREDIT/UDHAAR`.
  - Supports partial payments with automatic live Udhaar debt calculation.
- **Print Receipt Modal (`PrintReceiptModal.jsx`)**: Thermal receipt preview formatted for 80mm/58mm POS receipt printers.

### B. Customer Credit (Khata) & CRM (`Frontend/src/features/customers/`) [T29]
- **KPI Summary (`CustomersStatsCards.jsx`)**: Displays Total Customers, Total Udhaar (₹), and Count of Customers with Pending Dues.
- **Customer Directory (`CustomersTable.jsx`)**: Real-time search, phone numbers, credit limits, and balance indicators with action buttons.
- **Khata Ledger Statement (`CustomerLedgerModal.jsx`)**: Chronological audit trail showing every credit sale (`SALE_CREDIT`) and cash repayment (`PAYMENT_RECEIVED`) with before/after balance snapshots.
- **Settle Khata Modal (`SettleKhataModal.jsx`)**: Quick modal to record customer debt settlements.

### C. Inventory Movement & Store State (`Frontend/src/features/inventory/`) [T15–T22]
- **Store State Tab**: Real-time physical quantities, reorder thresholds, low stock status, and total inventory asset valuation.
- **Movement Ledger Tab**: Bank-statement format showing WHO (actor), WHEN (timestamp), WHY (purchase, sale, damage, audit), and WHAT (product & delta).
- **Alerts Queue Tab**: Deterministic low-stock notifications with 1-click **"Restock Now"** shortcuts.
- **Action Modals**: Stock In, Stock Out (with insufficient stock guard), Physical Reconciliation Adjustment, and Reorder Limits.

### D. Product Catalog Management (`Frontend/src/features/products/`) [T7–T14]
- **Products Page (`ProductsPage.jsx`)**: Real-time multi-field search (Name, SKU, Barcode), category filters, and active/archived status toggles.
- **Product Lifecycle Form (`ProductForm.jsx`)**: Live profit margin (%) calculator, smart SKU generator, packaging specifications, and opening stock seeding.
- **Categories Modal (`CategoriesModal.jsx`)**: Modal to create, edit, search, and delete categories with live product counter badges.
- **Archival Protection (`ArchiveProductModal.jsx`)**: Safe soft-deletion preserving historical invoices and credit ledgers.

---

## 4. API Communication Layer (`Frontend/src/services/`)
- `api.js`: Central Axios instance handling bearer tokens, `x-business-id` header injection, and 401 token refresh interceptors.
- `auth.api.js`: Full authentication and session management.
- `business.api.js`: Store configuration and onboarding wizard APIs.
- `category.api.js`: Category CRUD operations.
- `product.api.js`: Product catalog queries, seek pagination, and barcode lookups.
- `inventory.api.js`: Stock movements, reconciliations, alerts, and audit ledgers.
- `sale.api.js`: POS checkout creation, sales history, line snapshots, and PDF invoice downloads.
- `customer.api.js`: Customer profiles, Khata statements, and debt settlements.

---

## 5. Development & Verification Commands
- Run development server: `npm run dev` (Starts Vite on http://localhost:5173)
- Run production build: `npm run build` (Ensures zero compilation/type errors)
