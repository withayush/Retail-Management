# VendorOS — Frontend Architecture & Directory Blueprint

> **Platform**: VendorOS (React 19 + Vite 8 + Tailwind CSS + Framer Motion)  
> **Status**: 100% Arranged, Modular Clean Architecture with Standard Barrel Indexes (`index.js`)  
> **Path Aliases**: `@/` maps to `Frontend/src/`

---

## 1. Clean Directory Structure & File Hierarchy

```
Frontend/src/
├── assets/                     # Static brand assets, logos, and vector illustrations
│   ├── logo.png                # Primary high-res logo
│   └── vendoros-logo.png       # Dark-mode optimized vector brand mark
│
├── components/                 # Shared Cross-Cutting UI Components & Primitives
│   ├── common/                 # Global utility components
│   │   ├── PageLoader.jsx      # High-density route-splitting loading skeleton
│   │   └── index.js            # Barrel export
│   │
│   ├── layout/                 # Shell & Application Frame Layout
│   │   ├── AppLayout.jsx       # Persistent responsive container (Sidebar + Header + Outlet)
│   │   ├── Header.jsx          # Top navigation, active store badge, keyboard cheat-sheet
│   │   ├── Sidebar.jsx         # Collapsible desktop/mobile drawer with status badges
│   │   ├── UniversalSearchModal.jsx # Global Spotlight Command Center (Ctrl+K / Cmd+K)
│   │   └── index.js            # Barrel export
│   │
│   ├── ui/                     # Apple/Vercel-Grade Atomic Primitives
│   │   ├── button.jsx          # CVA-powered buttons (default, outline, ghost, destructive, orange)
│   │   ├── card.jsx            # Glassmorphism cards (CardHeader, CardTitle, CardContent, etc.)
│   │   ├── input.jsx           # Accessible styled inputs with focus rings & invalid states
│   │   ├── label.jsx           # Form label primitives
│   │   └── index.js            # Unified atomic UI barrel export
│   │
│   └── index.js                # Master components barrel (export * from common, layout, ui)
│
├── context/                    # React Contexts for Global App State
│   └── AuthContext.jsx         # Authentication, Active Session, Current Business, RTR hooks
│
├── hooks/                      # Centralized Custom React Hooks
│   ├── useBarcodeScanner.js    # Sub-millisecond hardware barcode listener with auto-focus & sound
│   ├── usePOSKeyboard.js       # Keyboard-first cashier ergonomics hotkeys (F2, F4, F8, F9, Esc)
│   └── index.js                # Hooks barrel export
│
├── lib/                        # Core Utilities & Helpers
│   └── utils.js                # Tailwind class merge utility (`clsx` + `twMerge` -> `cn`)
│
├── routes/                     # Application Route Guards & Security Gating
│   ├── ProtectedRoute.jsx      # Authentication & Active Session route gate + Onboarding route gate
│   └── index.js                # Routes barrel export
│
├── services/                   # Data Access Layer & REST API Client
│   ├── api.js                  # Axios client, in-memory token store, silent RTR interceptors
│   ├── analytics.api.js        # Net Profit, OpEx, Gross Profit, Receivables endpoints
│   ├── auth.api.js             # Registration, Phone OTP, Google Auth, Session tokens
│   ├── business.api.js         # Business onboarding, settings, business profiles
│   ├── category.api.js         # Category CRUD endpoints
│   ├── customer.api.js         # Customer CRM, Khata udhaar ledger, debt aging, payments
│   ├── expense.api.js          # Operating expenses (OpEx) logging and period filters
│   ├── expenseCategory.api.js  # Expense categories and budgets
│   ├── inventory.api.js        # Stock ledger, low-stock alerts, reorder points, adjustments
│   ├── payment.api.js          # Multi-tranche payments and split-payment transactions
│   ├── product.api.js          # Product catalog, barcodes, soft-delete, seek pagination
│   ├── purchaseOrder.api.js    # Supplier PO creation, status lifecycle, timeline history
│   ├── reconciliation.api.js   # Cross-system ledger drift detection & auto-reconciliation
│   ├── sale.api.js             # Atomic POS checkout, invoice PDF receipt, sales history
│   ├── supplier.api.js         # Supplier master CRUD, payables, and 360° vendor profile
│   └── index.js                # Master services barrel export (namespaced + direct)
│
├── features/                   # Domain-Driven Feature Modules (Clean Architecture)
│   ├── analytics/              # Financial Analytics & P&L Waterfall
│   │   ├── FinancialAnalyticsPage.jsx
│   │   ├── components/         # Hero cards, Waterfall bar, Matrix, Receivables card
│   │   └── index.js
│   │
│   ├── auth/                   # Authentication & Onboarding
│   │   ├── Login.jsx           # Phone/Password + Google OAuth login
│   │   ├── Register.jsx        # Business owner registration
│   │   ├── VerifyOTP.jsx       # 6-digit cryptographic phone verification
│   │   ├── components/         # GoogleAuthButton
│   │   └── index.js
│   │
│   ├── business/               # Store Onboarding
│   │   ├── BusinessOnboarding.jsx # 3-step draft wizard (Store details, GST, Hours)
│   │   └── index.js
│   │
│   ├── customers/              # Customer Master & Udhaar (Khata)
│   │   ├── CustomersPage.jsx   # Master customer directory
│   │   ├── components/         # CRM Modal, Debt Aging, Khata Ledger, Repayment history
│   │   └── index.js
│   │
│   ├── dashboard/              # Store Owner Overview
│   │   ├── Dashboard.jsx       # Real-time revenue, gross profit, low stock, cashier stats
│   │   ├── components/         # DashboardMetrics
│   │   └── index.js
│   │
│   ├── expenses/               # Store Operational Expenses (OpEx)
│   │   ├── ExpensesPage.jsx    # Cash burn ledger & expense categories
│   │   ├── components/         # RecordExpenseModal, ExpenseCategoriesModal, MonthlyAggregator
│   │   └── index.js
│   │
│   ├── inventory/              # Inventory Stock & Movement Ledger
│   │   ├── InventoryAuditPage.jsx # Stock state, movement ledger, low stock queue
│   │   ├── components/         # StockInModal, StockOutModal, StockAdjustModal, AlertsTable
│   │   ├── utils/              # inventory.utils.js
│   │   └── index.js
│   │
│   ├── pos/                    # Keyboard-First Cashier POS Terminal
│   │   ├── POSTerminalPage.jsx # Sub-millisecond barcode checkout, split payments
│   │   ├── SalesHistoryPage.jsx# Historical invoices, thermal receipts, P&L widgets
│   │   ├── components/         # POSCart, POSProductGrid, SettlePaymentModal, Profit calculators
│   │   ├── hooks/              # useBarcodeScanner, usePOSKeyboard
│   │   ├── utils/              # pos.utils.js
│   │   └── index.js
│   │
│   ├── procurement/            # Supplier Purchasing & Physical Stock Receipts
│   │   ├── PurchaseOrdersPage.jsx # Purchase order lifecycle & approval pipelines
│   │   ├── GoodsReceivedPage.jsx  # GRN receipt verification & variance audits
│   │   ├── components/         # CreatePurchaseOrderModal, ReceiveGoodsModal, GRN notes
│   │   └── index.js
│   │
│   ├── products/               # Product Master Catalog
│   │   ├── ProductsPage.jsx    # Catalog table, SKU/barcode lookup, price edits
│   │   ├── components/         # ProductForm, CategoriesModal, ProductStats, ArchiveModal
│   │   ├── utils/              # product.utils.js
│   │   └── index.js
│   │
│   ├── profile/                # User & Store Profile
│   │   ├── ProfilePage.jsx     # Account security, business profile, password change
│   │   └── index.js
│   │
│   ├── reconciliation/         # Drift Detection & Ledger Audits
│   │   ├── ReconciliationPage.jsx # Cross-system discrepancy detection & 1-click fixes
│   │   └── index.js
│   │
│   ├── suppliers/              # Vendor Management & Accounts Payable
│   │   ├── SuppliersPage.jsx   # Master vendor directory, payables summary
│   │   ├── components/         # Supplier360Modal, SettleSupplierModal, SupplierLedger
│   │   └── index.js
│   │
│   └── index.js                # Master feature barrel export
│
├── App.jsx                     # Central route definitions, lazy code-splitting, layout tree
├── index.css                   # Global Tailwind directives & dark monochrome design tokens
└── main.jsx                    # React 19 root DOM mounting point
```

---

## 2. Standardized Import Conventions

Thanks to clean barrel files (`index.js`), you can now write clean, professional imports:

### UI & Primitives:
```javascript
// Clean single-line import:
import { Button, Card, CardHeader, CardTitle, Input, Label } from "@/components/ui";

// Or from master components:
import { AppLayout, Header, Sidebar, PageLoader, Button, Card } from "@/components";
```

### Services & APIs:
```javascript
// Named imports directly:
import { getProducts, createProduct, getInventoryLedger, createSale } from "@/services";

// Or namespaced by domain:
import { productApi, saleApi, customerApi, inventoryApi } from "@/services";
```

### Hooks:
```javascript
import { useBarcodeScanner, usePOSKeyboard } from "@/hooks";
```

### Features:
```javascript
import { POSTerminalPage, ProductsPage, CustomersPage } from "@/features";
```

---

## 3. Maintenance Guidelines

1. **New UI Component**: Create inside `src/components/ui/<Component>.jsx` and export from `src/components/ui/index.js`.
2. **New Feature Module**: Create folder in `src/features/<feature-name>/` with:
   - `<Feature>Page.jsx`
   - `components/` (and its `index.js`)
   - `index.js` exporting the page and components.
3. **New API Service**: Create in `src/services/<domain>.api.js` and register in `src/services/index.js`.
4. **All paths support `@/`**: Configured in `vite.config.js` to point directly to `src/`.
