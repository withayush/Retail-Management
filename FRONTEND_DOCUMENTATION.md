# VendorOS Frontend Architecture & Implementation Documentation

This document tracks all frontend features, component structures, state models, reasons for architectural choices, and the impact of each update.

---

## 1. Overview of Frontend Architecture

- **Framework**: React 19 + Vite 8
- **Routing**: React Router v7 (`react-router-dom`)
- **Styling**: Tailwind CSS v3 with dark monochrome design tokens (`bg-background`, `text-foreground`, `border-border`, `bg-card`, etc.)
- **Animations & Modals**: Framer Motion
- **Icons**: Lucide React
- **Notifications**: `react-hot-toast`
- **HTTP Client**: Axios with centralized Request/Response interceptors & token refresh logic

---

## 2. Implemented Features & Component Breakdown

### A. Authentication & Onboarding Layer

#### 1. `Register.jsx` (`Frontend/src/features/auth/Register.jsx`)
- **Purpose**: New user account creation.
- **Why Created**: Collects full name, email, phone number, and password with frontend validation.
- **Why It's Necessary**: Establishes identity in the authentication database before business creation.
- **What It Affects**: Routes to `/verify-otp` upon registration and passes phone number and debug OTP in navigation state.

#### 2. `VerifyOTP.jsx` (`Frontend/src/features/auth/VerifyOTP.jsx`)
- **Purpose**: Verifies 6-digit phone OTP and facilitates OTP resend with cooldown timer.
- **Why Created**: Enforces phone verification security.
- **Why It's Necessary**: Prevents unverified account logins.
- **What It Affects**: Upon verification, redirects user to `/login` or onboarding.

#### 3. `Login.jsx` (`Frontend/src/features/auth/Login.jsx`)
- **Purpose**: User login via email/phone and password.
- **Why Created**: Authenticates credentials, stores access token in memory/localStorage, and starts authenticated session.
- **Why It's Necessary**: Gatekeeper for all protected application views.
- **What It Affects**: Updates `AuthContext`, stores user & vendor objects, and redirects to `/dashboard` or `/business-onboarding`.

#### 4. `BusinessOnboarding.jsx` (`Frontend/src/features/business/BusinessOnboarding.jsx`)
- **Purpose**: Step-by-step business setup wizard.
- **Why Created**: Collects business name, category/type, currency (INR), GSTIN, and business address.
- **Why It's Necessary**: Every product, category, invoice, and customer in VendorOS is strictly multi-tenant and requires a valid `businessId`.
- **What It Affects**: Creates business profile in backend, sets `businessId` in `localStorage`, updates `AuthContext.hasBusiness = true`, and unlocks dashboard.

#### 5. `AuthContext.jsx` & `ProtectedRoute.jsx` (`Frontend/src/context/` & `Frontend/src/routes/`)
- **Purpose**: Central state management for authenticated user, business verification, and route guarding.
- **Why Created**: Prevents unauthorized access to dashboard and routes un-onboarded users directly to onboarding.
- **What It Affects**: Entire routing lifecycle (`/dashboard`, `/products`, `/inventory`, `/customers`, `/pos`).

---

### B. Product Catalog & Inventory Layer (`Frontend/src/features/products/`)

#### 1. `ProductsPage.jsx`
- **Purpose**: Main product management orchestrator.
- **Why Created**: Centralizes product fetching, category management, filter syncing, and modal triggers.
- **Why It's Necessary**: Connects the user interface to backend REST APIs (`/api/products`, `/api/categories`).
- **What It Affects**: Coordinates `ProductHeader`, `ProductStats`, `ProductFilters`, `ProductTable`, `ProductModal`, `ProductForm`, and `ArchiveProductModal`.

#### 2. `ProductHeader.jsx`
- **Purpose**: Page header with breadcrumbs, system badge, and "Add Product" action button.
- **Why Created**: Provides clear navigation hierarchy and primary action access.
- **What It Affects**: Opens the Add Product modal and navigates back to Dashboard.

#### 3. `ProductStats.jsx`
- **Purpose**: Displays 4 live KPI cards:
  1. *Total Products*
  2. *Active In Catalog*
  3. *Categories Count*
  4. *Average Profit Margin (%)*
- **Why Created**: Gives immediate high-level business intelligence on inventory health and margin viability.
- **What It Affects**: Computed in real-time from active products list and backend pagination metadata.

#### 4. `ProductFilters.jsx`
- **Purpose**: Search and filter toolbar.
- **Why Created**: Enables searching by Product Name, SKU, Barcode, filtering by Category, sorting (Newest, Name, Price, Margin), and toggling between Active/All/Archived status.
- **Why It's Necessary**: Enables fast product retrieval in large retail catalogs.
- **What It Affects**: Updates query parameters and triggers debounced backend search.

#### 5. `ProductTable.jsx`
- **Purpose**: High-density product listing table.
- **Why Created**: Displays name, category tag, SKU/Barcode with one-click copy, formatted Cost Price, Selling Price, color-coded Profit Margin chips, status badges, and action buttons (Edit, Archive, Restore).
- **Why It's Necessary**: Central interface for merchants to view and manage all catalog items.
- **What It Affects**: Triggers edit modal, archive modal, copy-to-clipboard toast, and pagination controls.

#### 6. `ProductForm.jsx`
- **Purpose**: Add/Edit product form.
- **Why Created**: Collects Name, Category (with datalist and auto-create support), Packaging Unit, SKU (with auto-generator button), Barcode, Cost Price, Selling Price, and Opening Stock.
- **Why It's Necessary**: Guarantees all backend validation requirements are met without manual friction.
- **What It Affects**: Communicates with `/api/products` (POST / PUT) and `/api/categories` (POST).

#### 7. `ProductModal.jsx` & `ArchiveProductModal.jsx`
- **Purpose**: Reusable animated modal backdrop and safe archival confirmation dialog.
- **Why Created**: Confirms product archival without destructive deletion (preserving historical invoices).
- **What It Affects**: Calls `POST /api/products/:id/archive`.

#### 8. `product.utils.js`
- **Purpose**: Shared formatting and margin calculation utility functions.
- **Functions**: `fmt(number)` (Indian Rupee formatting), `margin(cost, sell)` (percentage calculation), `emptyForm` template, `inputCls` styling tokens.

---

### C. Services & API Communication Layer (`Frontend/src/services/`)

1. **`api.js`**: Axios instance configured with base URL, bearer token interceptor, `x-business-id` multi-tenant header, and silent token refresh logic.
2. **`auth.api.js`**: Endpoints for `registerUser`, `verifyOTP`, `resendOTP`, `loginUser`, `getMe`, `refreshToken`.
3. **`business.api.js`**: Endpoints for `createBusiness`, `getMyBusiness`, `switchBusiness`.
4. **`product.api.js`**: Endpoints for `getProducts`, `getProductById`, `getProductByBarcode`, `createProduct`, `updateProduct`, `archiveProduct`, `restoreProduct`, `deleteProduct`, `getProductCategories`, `createCategory`.
5. **`customer.api.js`**: Endpoints for customer management and ledger tracking.
6. **`inventory.api.js`**: Endpoints for stock adjustments and immutable inventory audit ledger.

---

## 3. Maintenance & Change Impact Guidelines

When modifying any frontend file:
1. **Always maintain Dark Theme tokens** (`bg-background`, `text-foreground`, `border-border`, `bg-card`).
2. **Always test backend schema compatibility** (e.g. check field naming: `sellingPrice` vs `costPrice`).
3. **Verify build before pushing**: Run `npm run build` to catch bundling and syntax errors before deploying to production.
