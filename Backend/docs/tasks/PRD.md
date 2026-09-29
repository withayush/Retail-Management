# VendorOS - Comprehensive Product Requirements Document (PRD) & Technical Specification

> **Project**: VendorOS (Retail Management & Kirana POS Operations System)  
> **Repository**: `https://github.com/withayush/Retail-Management.git`  
> **Status**: Production-Ready Multi-Tenant Architecture (Phase 0 to Phase 7 Implemented & Verified)  
> **Last Updated**: 2026-09-27  

---

## 1. Executive Summary & Vision

**VendorOS** is a modern, high-performance, cloud-first Retail and Kirana Store Operations Platform designed for physical merchant environments and fast-paced cashier checkout lines. It combines sub-millisecond barcode checkout, strict multi-tenant business isolation, immutable double-entry style inventory ledgers, deterministic automated low-stock replenishment queues, partial/split payment settlement engines, complete customer master profiles with an append-only Customer Khata (Udhaar) ledger, real-time materialized outstanding balances, 360° Customer CRM with FIFO debt aging, comprehensive Supplier & Accounts Payable management, formal Purchase Order (PO) workflows, and Goods Received Note (GRN) physical stock receiving.

---

## 2. Core Architectural Principles & Technical Invariants

1. **Strict Multi-Tenant Isolation (`businessId`)**:
   - Every single domain entity (`Category`, `Product`, `Inventory`, `InventoryLedger`, `InventoryAlert`, `Invoice`, `SaleItem`, `Payment`, `Customer`, `CustomerLedger`, `Supplier`, `SupplierLedger`, `PurchaseOrder`, `PurchaseItem`, `GRN`) is strictly anchored to `businessId`.
   - `req.businessId` is derived exclusively by `businessMiddleware` from verified JWT sessions or validated `X-Business-Id` membership checks. Untrusted tenant IDs passed in request bodies are ignored.
2. **Immutable Audit Ledgers & Real-Time Materialized State**:
   - Physical stock is never updated arbitrarily. Every stock delta is written to `InventoryLedger` (`IN`, `OUT`, `ADJUST`, `OPENING`, `RETURN`).
   - Invariant: `Inventory.availableStock === sum(InventoryLedger.qtyChange)`.
   - Customer Udhaar and Supplier Payables are tracked through append-only ledgers (`CustomerLedger`, `SupplierLedger`).
   - Materialized balances (`Customer.currentBalance`, `Supplier.currentBalance`) are synchronously updated alongside ledger rows to guarantee $O(1)$ lookup performance without expensive map-reduce aggregations.
3. **Historical Price Snapshotting**:
   - Master catalog price changes update future default rates. Invoices freeze `soldPrice`, `costPrice`, and `grossProfit` in `SaleItem` records, and Purchase Orders freeze `costPrice` in `PurchaseItem` records at the exact moment of creation.
4. **Zero-Overselling Pre-Flight Checks**:
   - POS Checkout validates `availableStock >= requestedQty` for all cart items before committing transactions. If any line fails, the entire transaction is rolled back with a 400 error.
5. **Non-Destructive Archiving (Soft-Deletes)**:
   - Hard deletes (`deleteOne`) are prohibited on core catalog items, customers, and suppliers. Soft-deletes (`isArchived: true` / `status: 'INACTIVE'`) ensure past invoices, tax filings, and ledger reports remain permanently verifiable.
6. **Keyboard-First Cashier Ergonomics**:
   - POS checkout operations function without mouse dependency using hardware barcode scanners (<50ms burst detection) and global hotkeys (`F2`, `F4`, `F8`, `F9`, `F1`, `Esc`).

---

## 3. Technology Stack & Infrastructure

- **Backend Runtime**: Node.js 20+ (CommonJS modular pattern), Express 5.x
- **Database & ODM**: MongoDB Atlas, Mongoose 8.x
- **Authentication**: JWT (Access 15m + Refresh 7d) in secure HttpOnly cookies + Session collection with Refresh Token Rotation (RTR)
- **Validation**: Zod (Strict schema validation for inputs and query params)
- **Security & Cryptography**: Bcrypt (password hashing, OTP challenges), Helmet, CORS with credential handling
- **Document Generation**: PDFKit (Programmatic GST invoices & thermal printable receipts)
- **Frontend Framework**: React 19, Vite 8
- **Styling & Animation**: Tailwind CSS, Framer Motion, Lucide React icons
- **State & HTTP Client**: React Context API (`AuthContext`), Axios with interceptors, React Hot Toast

---

## 4. Comprehensive Product Phases & Task Breakdown

### Phase 0: Authentication, Security & Account Foundation (T1–T5)
- **T1: Environment & Cloud Connection**: Express 5.x application lifecycle, MongoDB connection pool management, and environment isolation.
- **T2: Multi-Factor Registration**: User registration with Zod validation, bcrypt password hashing, 6-digit cryptographic phone OTP generation, and 10-minute challenge expiry.
- **T3: OTP Verification & Account Activation**: Atomic verification transaction activating user account, auto-provisioning linked `Vendor` profile, and issuing dual JWT tokens in HttpOnly cookies.
- **T4: Session Management & Refresh Token Rotation (RTR)**: Tracks active login sessions in DB with SHA-256 hashed refresh tokens. Stolen or reused refresh token attempts trigger instant revocation of all active sessions.
- **T5: Phone Normalization & Audit Logging**: Canonical `+91XXXXXXXXXX` E.164 phone formatting and security audit trail via `AuthAttempt` logging IP and user agents.

### Phase 1: Business Foundation & Multi-Tenant Isolation (T6)
- **Business Profile Model**: Supports 14+ retail segments (Grocery, Kirana, Supermarket, Electronics, Pharmacy, Apparel, FMCG, etc.), tax modes (GST, Composition, Non-GST), store operating hours, and currency (`INR`).
- **3-Step Onboarding Wizard**: React onboarding flow (`BusinessOnboarding.jsx`) capturing store identity, address/pincode, and operational preferences with step-draft persistence.
- **T6 Tenant Middleware**: Inspects sessions and `X-Business-Id` header, verifies user membership in `BusinessMember`, and injects verified `req.businessId`, `req.business`, and `req.businessRole` (`OWNER`, `MANAGER`, `STAFF`).

### Phase 2: Category & Product Catalog Engine (T7–T14)
- **T7: Category Management**: Scoped unique categories per business (`{ businessId: 1, name: 1 }`) with CRUD endpoints and category modal (`CategoriesModal.jsx`).
- **T8–T10: Product Catalog & Self-SKU Idempotency**:
  - Full product specifications: `sellingPrice`, `costPrice`, `sku`, `barcode`, `unit` (PCS, KG, LTR, etc.), `packSize`, `packagingType`, `minOrderQty`.
  - Self-SKU collision idempotency allowing price/packaging edits without unique key errors.
- **T11: Archival & Soft-Deletion**: Non-destructive archival preserving historical invoice and ledger references.
- **T12–T14: Cursor Pagination & Barcode Search**:
  - Base64 opaque cursor pagination for scalable catalog browsing.
  - Sub-millisecond barcode lookup (`GET /api/products/barcode/:barcode`) and multi-field regex search.

### Phase 3: Inventory Stock & Movement Ledger Engine (T15–T22)
- **T15: Inventory Master**: Tracks `availableStock`, `reorderLevel`, `reservedStock`, and `lowStockAlert` status.
- **T16: Immutable Movement Ledger**: Records every stock change with `type` (`IN`, `OUT`, `ADJUST`, `OPENING`, `RETURN`), `qtyChange`, `balanceAfter`, `source`, and `referenceNumber`.
- **T17: Opening Stock Initialization**: Seeds initial physical store counts creating audited `OPENING` ledger logs.
- **T18: Stock IN (Procurement)**: Records inventory addition with supplier metadata, purchase unit cost, and invoice/PO numbers.
- **T19: Stock OUT (Sales/Damage)**: Atomic stock reduction with strict `INSUFFICIENT_STOCK` (400) pre-flight rejection.
- **T20: Stock Reconciliation / Adjustment**: Reconciles physical counts against system records with audit delta calculations and reason tags.
- **T21: Ledger Statement UI**: Searchable, multi-filtered chronological stock flow statement with 1-click CSV export (`InventoryAuditPage.jsx`).
- **T22: Deterministic Low-Stock Alerts Queue**: Real-time alert generation with severity distinction (`CRITICAL` for OOS, `WARNING` for Low Stock), deduplication guarantee, and replenishment auto-resolution.

### Phase 4: Sales, Billing, Payments & POS Terminal (T23–T30)
- **T23: Sales Transaction & Invoicing Header**: Sequential invoice numbering (`INV-1001`), tax, line discounts, and payment status (`PAID`, `PARTIAL`, `UNPAID`).
- **T24: Sale Item Snapshotting & Gross Profit Engine**: Freezes `soldPrice`, `costPrice`, and `grossProfit` at checkout. Dedicated gross profit analytics (`GET /api/sales/analytics/gross-profit`).
- **T25: Atomic POS Checkout API**: Single orchestrator validating inventory, creating invoice headers, snapshotting line items, deducting inventory, writing ledger logs, and linking payments.
- **T26: Auto Inventory Deductions & Low-Stock Alerts Sync**: Real-time linkage triggering inventory deductions and alert queue updates directly on sale.
- **T27: Invoice PDF Generation & Thermal Receipts**: PDFKit engine generating formatted GST invoices (`GET /api/sales/:id/pdf`) and 80mm/58mm thermal printable receipts (`PrintReceiptModal.jsx`).
- **T28: Payment Recording Entity**: Standalone payment tracking supporting multi-tranche partial settlements, split payment methods (Cash + UPI), and invoice status reconciliation.
- **T29: Customer Credit (Khata) Integration**:
  - Automatic credit ledger debiting when an invoice is sold on Udhaar (`CREDIT` or partial balance).
  - Khata settlement engine (`POST /api/customers/:id/settle`) for recording customer repayments and clearing outstanding balances.
- **T30: Billing Checkout Front Terminal**: Cashier POS interface (`POSTerminalPage.jsx`) with barcode scanner listener (`useBarcodeScanner.js`), keyboard hotkeys (`usePOSKeyboard.js`), quick cart, and payment modals.

### Phase 5: Customer System, Profiles Master & 360 CRM (T31–T36)
- **T31: Customer Schema DB Model & Master Entity**:
  - Demographic fields: Name, Phone, Email, Address, City, State, Pincode, Credit Limit, Status, Notes, Tags.
  - Multi-tenant phone uniqueness: Compound index `{ businessId: 1, phone: 1 }` with partial filter expression ensuring unique phone per business while allowing empty phone numbers.
  - Strict separation of customer demographic profile from financial transaction ledgers.
- **T32: Customer CRUD APIs & Phone Canonicalization Engine**:
  - Full REST CRUD APIs with canonical phone formatting (`+91XXXXXXXXXX`), POS autocomplete search (`GET /api/customers/search`), and soft-delete/restore semantics.
- **T33: Customer Ledger Transaction Log & Sub-Ledger History**:
  - Append-only financial history tracking credit sales (`SALE_CREDIT`) and repayment settlements (`PAYMENT_SETTLEMENT`).
  - Running Balance Formula: `Balance = Previous Balance + Credit - Debit`.
  - Statement UI modal (`CustomerLedgerModal.jsx`) with date filters and invoice linking.
- **T34: Real-Time Outstanding Calculations & Fast Materialized Balance**:
  - Materialized `currentBalance` in `Customer` document updated atomically on every transaction.
  - $O(1)$ single-customer query (`GET /api/customers/:id/outstanding`) and store-wide debtor rankings (`GET /api/customers/outstanding/summary`, `/totals`).
- **T35: Customer Credit Payment History & Repayment Log**:
  - Dedicated transparent query layer for customer repayments (`GET /api/customers/:id/payments`) summarizing `totalAmountPaid`, `totalPaymentsCount`, `averagePaymentAmount`, and `methodBreakdown` ({ CASH, UPI, CARD }).
  - Interactive modal (`CustomerPaymentHistoryModal.jsx`).
- **T36: Customer CRM & 360° Profiling (FIFO Debt Aging)**:
  - Aggregation engine uniting demographics, lifetime sales metrics, visit frequency, average basket size, real-time debt, multi-bucket debt aging (`0-30d`, `31-60d`, `61-90d`, `90+d`), recent sales, and recent repayments (`GET /api/customers/:id/crm-summary`).
  - Interactive UI modal (`CustomerCRMModal.jsx`).

### Phase 6: Supplier & Procurement Management (T37–T41)
- **T37: Supplier Schema DB Model & Master Entity**:
  - Business-scoped Supplier master entity (Company, ContactName, Phone, Email, Address, City, State, Pincode, GSTIN, CurrentBalance, TotalPurchases, TotalOrders, LastPurchaseDate, LastPaymentDate, Status, Notes, Tags).
  - Multi-tenant partial phone index `{ businessId: 1, phone: 1 }`.
  - Clear domain separation: Customer (Money In) vs Supplier (Money Out). Independent master entity.
- **T38: Supplier REST CRUD APIs & Management UI**:
  - REST CRUD endpoints with phone canonicalization, vendor search (`GET /api/suppliers/search`), and KPI summary metrics (`GET /api/suppliers/summary`).
  - UI management page (`SuppliersPage.jsx`), `SupplierStatsCards.jsx`, `SuppliersTable.jsx`, `AddSupplierModal.jsx`, and `EditSupplierModal.jsx`.
- **T39: Supplier Ledger Transaction Log & Accounts Payable Sub-Ledger**:
  - Inverted symmetrical counterpart to Customer Ledger: tracks inventory purchase deliveries vs supplier payment disbursements.
  - Running Balance Formula: `Balance = Previous Balance + Purchase Deliveries (Credit) - Payment Disbursements (Debit)`.
  - Immutable append-only audit trail with settlement modal (`SettleSupplierModal.jsx`) and ledger modal (`SupplierLedgerModal.jsx`).
- **T40: Outstanding Payables Indexer & Cash Allocation Engine**:
  - Materialized index of accounts payable debt owed to suppliers (`Supplier.currentBalance`) backed by `{ businessId: 1, currentBalance: -1 }`.
  - Computes `totalPayableOutstanding`, `suppliersWithPayablesCount`, `highestPayableSupplier`, and `averagePayablePerSupplier`.
  - Interactive Payables Indexer modal (`OutstandingPayablesModal.jsx`).
- **T41: Supplier 360° Management Center UI**:
  - Unified dashboard endpoint (`GET /api/suppliers/:id/summary-360`) assembling supplier profile, lifetime procurement counters, payable balance, recent stock deliveries (5), and recent payout settlements (5).
  - Interactive modal (`Supplier360Modal.jsx`).

### Phase 7: Purchasing, Purchase Orders & Goods Receiving (T42–T44)
- **T42: Purchase Order Schema DB Model & Procurement Header**:
  - Formal Purchase Order (PO) entity tracking sequential order numbers (`PO-1001`), order date, expected delivery date, status (`DRAFT`, `PENDING`, `PARTIAL`, `RECEIVED`, `CANCELLED`), and server-calculated totals.
  - Architectural Invariant: Creating a PO does NOT increase physical stock or create accounts payable debt (Payables and stock changes occur upon goods receipt).
- **T43: Purchase Item Schema DB Model & Line Items Snapshot**:
  - Dedicated line item model (`PurchaseItem`) mirroring sales line items.
  - Freezes negotiated `costPrice` at PO creation. Future changes to catalog product cost prices do not alter historical PO line items.
  - Create Purchase Order modal (`CreatePurchaseOrderModal.jsx`) and PO listing modal (`PurchaseOrdersListModal.jsx`).
- **T44: Goods Received Note (GRN) API & Physical Stock Receiving Engine**:
  - Formal stock receipt confirmation generating sequential Goods Received Notes (`GRN-1001`).
  - Validates deliveries against PO line items, handles partial shipments, prevents unexpected over-deliveries, updates PO status, increments physical inventory stock, and logs audited `InventoryLedger` entries (`type: 'IN'`, `source: 'GOODS_RECEIPT'`).
  - Receiving Modal (`ReceiveGoodsModal.jsx`) with 1-click "Receive All" and receipt history.

---

## 5. Complete Database Models Reference (20 Models)

```
1.  Account          : Authentication identity, email/phone, passwordHash, status
2.  OtpChallenge     : 6-digit phone verification codes, bcrypt hash, 10m expiry
3.  Session          : Active login sessions, SHA-256 refresh token hashes, lastActiveAt
4.  AuthAttempt      : Security login audit logs with IP, userAgent, and failure reasons
5.  Vendor           : Store owner business entity, onboarding draft step state
6.  Business         : Physical store configuration, address, GSTIN, currency, retail segment
7.  BusinessMember   : User-to-Business role mapping (OWNER, MANAGER, STAFF)
8.  Category         : Scoped product categories ({ businessId, name })
9.  Product          : Catalog items, sellingPrice, costPrice, SKU, barcode, unit, packSize
10. Inventory        : Physical available stock, reorder level, alert flags
11. InventoryLedger  : Immutable stock movement audit log (IN, OUT, ADJUST, OPENING, RETURN)
12. InventoryAlert   : Low-stock and out-of-stock notification queue items
13. Invoice          : Sales billing header, sequential INV-1001, subtotal, tax, grandTotal, balanceDue
14. SaleItem         : Frozen checkout line items, unit soldPrice, costPrice, grossProfit
15. Payment          : Multi-tranche payment records against invoices (Cash, UPI, Card, Split)
16. Customer         : Customer CRM profile, credit limit, materialized currentBalance
17. CustomerLedger   : Append-only Khata credit/debit transaction log and running balances
18. Supplier         : Supplier master entity, contact, address, GSTIN, materialized currentBalance
19. SupplierLedger   : Accounts payable transaction log (deliveries vs disbursements)
20. PurchaseOrder    : Procurement order header, sequential PO-1001, status lifecycle
21. PurchaseItem     : Frozen purchase order line items and negotiated cost prices
22. GRN              : Goods Received Notes, sequential GRN-1001, received items, inspection notes
```

---

## 6. Complete API Endpoints Catalog (108+ Endpoints)

### 🔐 Authentication (`/api/auth`)
- `POST /api/auth/register` : User registration
- `POST /api/auth/verify-phone` : Verify 6-digit OTP & provision vendor
- `POST /api/auth/resend-phone-otp` : Resend phone OTP (60s cooldown, max 3)
- `POST /api/auth/login` : Login via Email or Mobile + Password
- `GET  /api/auth/me` : Current authenticated user & vendor profile
- `POST /api/auth/refresh` : Refresh Token Rotation (RTR)
- `POST /api/auth/logout` : Revoke session & clear auth cookies

### 🏬 Business & Onboarding (`/api/business`)
- `GET  /api/business/onboarding/status` : Current onboarding step & draft data
- `POST /api/business/onboarding/step` : Save onboarding step
- `POST /api/business` : Direct 1-shot business creation
- `GET  /api/business/me` : List all businesses belonging to current user
- `GET  /api/business/:id` : Retrieve business profile
- `PUT  /api/business/:id` : Update business settings & store hours
- `GET  /api/business/active/context` : Active store context & permissions

### 🏷️ Categories (`/api/categories`)
- `POST   /api/categories` : Create business category
- `GET    /api/categories` : List store categories
- `GET    /api/categories/:id` : Single category details
- `PUT    /api/categories/:id` : Update category
- `DELETE /api/categories/:id` : Delete category (with product re-assignment guards)

### 📦 Product Catalog (`/api/products`)
- `POST   /api/products` : Create product with auto-inventory provisioning
- `GET    /api/products` : Cursor-paginated product listing
- `GET    /api/products/barcode/:barcode` : Sub-millisecond barcode lookup
- `GET    /api/products/search` : Multi-field regex product search
- `GET    /api/products/:id` : Single product profile
- `PUT    /api/products/:id` : Update product (self-SKU collision safe)
- `POST   /api/products/:id/archive` : Soft-delete archive product
- `POST   /api/products/:id/restore` : Restore archived product
- `DELETE /api/products/:id` : Soft-delete alias

### 📊 Inventory & Movement Ledger (`/api/inventory`)
- `GET  /api/inventory/summary` : Inventory KPI metrics (total items, valuations, alerts)
- `GET  /api/inventory/store-state` : Real-time store stock list
- `GET  /api/inventory/product/:productId` : Single product inventory record
- `PUT  /api/inventory/product/:productId/reorder-level` : Update reorder threshold
- `POST /api/inventory/stock-in` : Stock IN (Procurement receipt)
- `POST /api/inventory/stock-out` : Stock OUT (Manual deduction/damage)
- `POST /api/inventory/stock-out/batch` : Batch Stock OUT for checkout
- `POST /api/inventory/adjust` : Stock reconciliation / count adjustment
- `POST /api/inventory/opening-stock` : Seed initial physical store stock
- `GET  /api/inventory/ledger` : Chronological bank-statement style stock ledger
- `GET  /api/inventory/product/:productId/ledger` : Single product movement history
- `GET  /api/inventory/alerts` : Low-stock and out-of-stock notification queue
- `GET  /api/inventory/alerts/summary` : Alerts KPI counts
- `PUT  /api/inventory/alerts/:id/acknowledge` : Acknowledge low stock alert
- `PUT  /api/inventory/alerts/:id/resolve` : Resolve alert
- `POST /api/inventory/alerts/sync` : Synchronize store stock alerts

### 💳 Sales, Invoicing & POS Billing (`/api/sales`, `/api/payments`)
- `POST /api/sales` : Atomic POS checkout transaction
- `GET  /api/sales` : List sales orders & invoices with date/payment filters
- `GET  /api/sales/:id` : Single invoice details
- `GET  /api/sales/:id/items` : Frozen sale line items
- `GET  /api/sales/:id/pdf` : Download programmatic GST invoice PDF
- `GET  /api/sales/analytics/gross-profit` : Gross profit and margin analytics
- `POST /api/payments` : Record payment against invoice (multi-tranche)
- `GET  /api/payments/invoice/:invoiceId` : Payment installments for invoice
- `GET  /api/payments/:id` : Single payment transaction details
- `GET  /api/payments/business` : Business-wide payment history

### 👥 Customer System & 360 CRM (`/api/customers`)
- `POST   /api/customers` : Create customer profile
- `GET    /api/customers` : Paginated customer directory
- `GET    /api/customers/summary` : Customer KPI totals
- `GET    /api/customers/search` : Fast POS customer search
- `GET    /api/customers/phone/:phone` : Lookup customer by mobile number
- `GET    /api/customers/:id` : Customer demographic profile
- `PUT    /api/customers/:id` : Update customer demographics & credit limits
- `DELETE /api/customers/:id` : Soft-delete / deactivate customer
- `POST   /api/customers/:id/archive` : Archive customer
- `POST   /api/customers/:id/restore` : Reactivate customer
- `GET    /api/customers/:id/ledger` : Khata ledger statement (Udhaar vs Jama)
- `POST   /api/customers/:id/ledger` : Append manual adjustment / opening balance
- `POST   /api/customers/:id/settle` : Settle customer debt (repayment)
- `GET    /api/customers/:id/outstanding` : $O(1)$ real-time balance & credit check
- `GET    /api/customers/outstanding/summary` : Debtor ranking list
- `GET    /api/customers/outstanding/totals` : Store-wide outstanding debt metrics
- `GET    /api/customers/:id/payments` : Chronological repayment history
- `GET    /api/customers/:id/crm-summary` : Single-roundtrip Customer 360° CRM profile & FIFO debt aging

### 🏭 Supplier & Accounts Payable Management (`/api/suppliers`)
- `POST   /api/suppliers` : Create supplier profile
- `GET    /api/suppliers` : Paginated supplier directory
- `GET    /api/suppliers/search` : Autocomplete supplier search
- `GET    /api/suppliers/phone/:phone` : Lookup supplier by mobile number
- `GET    /api/suppliers/summary` : Supplier directory KPIs
- `GET    /api/suppliers/:id` : Single supplier profile
- `PUT    /api/suppliers/:id` : Update supplier profile & GSTIN
- `DELETE /api/suppliers/:id` : Soft-delete supplier
- `POST   /api/suppliers/:id/archive` : Archive supplier
- `POST   /api/suppliers/:id/restore` : Reactivate supplier
- `GET    /api/suppliers/:id/ledger` : Accounts payable ledger statement
- `POST   /api/suppliers/:id/settle` : Disburse payout to supplier
- `POST   /api/suppliers/:id/ledger` : Append manual ledger adjustment
- `POST   /api/suppliers/:id/purchases/credit` : Direct purchase invoice credit entry
- `GET    /api/suppliers/:id/outstanding` : $O(1)$ real-time payable balance check
- `GET    /api/suppliers/payables/summary` : Ranked list of supplier debts
- `GET    /api/suppliers/payables/totals` : Store-wide accounts payable totals
- `GET    /api/suppliers/:id/summary-360` : Unified Supplier 360° overview

### 🛒 Purchase Orders & Procurement (`/api/purchase-orders`)
- `POST   /api/purchase-orders` : Create formal Purchase Order (`PO-1001`)
- `GET    /api/purchase-orders` : Paginated list of purchase orders
- `GET    /api/purchase-orders/summary` : PO KPI totals (Draft, Pending, Received)
- `GET    /api/purchase-orders/number/:poNumber` : Fast lookup by PO number
- `GET    /api/purchase-orders/supplier/:supplierId` : POs for a specific vendor
- `GET    /api/purchase-orders/:id` : Single PO with line items & vendor info
- `PUT    /api/purchase-orders/:id` : Update PO details & recalculate totals
- `PATCH  /api/purchase-orders/:id/status` : Advance PO status lifecycle
- `POST   /api/purchase-orders/:id/cancel` : Cancel purchase order
- `GET    /api/purchase-orders/:id/items` : Line item snapshots for PO
- `GET    /api/purchase-orders/items/product/:productId` : Product purchase cost history

### 📥 Goods Received Notes & Physical Stock Receipts (`/api/purchases`)
- `POST /api/purchases/receive` : Receive physical goods & generate GRN (`GRN-1001`) with automatic stock increment and ledger logs
- `GET  /api/purchases/grn` : Paginated GRN receipt history
- `GET  /api/purchases/grn/:id` : Single GRN inspection with line items
- `GET  /api/purchases/grn/po/:purchaseOrderId` : All GRNs associated with a PO
- `GET  /api/purchases/grn/summary` : Store-wide GRN receipt KPIs

---

## 7. Frontend Architecture & UI Components

### Navigation Structure
- `/register`, `/login`, `/verify-otp` : Public Authentication flows
- `/onboarding` : 3-Step Store Setup Wizard
- `/dashboard` : Store Overview KPIs, Gross Sales, Low Stock Alerts, Top Sellers
- `/products` : Product Catalog, Fast Filter Toolbar, Category Manager
- `/inventory` : Live Stock Matrix, Stock Flow Statement Ledger, Low-Stock Queue
- `/pos` : High-Density POS Checkout Terminal with Barcode & Hotkey Support
- `/sales` (and `/invoices`) : Sales Order History, PDF Invoices, Thermal Receipts
- `/customers` : Customer Master, Udhaar Khata Ledgers, Repayments, 360° CRM
- `/suppliers` : Supplier Master, Purchase Orders, GRN Receiving, Payables Indexer
- `/profile` : User Account & Business Settings

### POS Keyboard Hotkeys Reference
- `F2`  : Focus Product Search Input
- `F4`  : Open Customer Selection / Khata Udhaar Modal
- `F8`  : Clear / Reset Shopping Cart
- `F9`  : Proceed to Checkout / Settle Payment Modal
- `F1`  : Open Hotkeys Guide Modal
- `Esc` : Close Any Active Modal Dialog

---

## 8. Quality Assurance & Automated Test Verification

All backend functionality is backed by automated integration test suites in `Backend/tests/` (100% passing):

1. `test-goods-received-note-api.js` (T44) — GRN physical stock receiving & ledger sync (12/12 Passed)
2. `test-purchase-item-schema-model.js` (T43) — PO line item snapshots & price freezing (9/9 Passed)
3. `test-purchase-order-schema-model.js` (T42) — PO lifecycle and sequential numbering (8/8 Passed)
4. `test-supplier-360-management-center.js` (T41) — Supplier 360° single-roundtrip aggregation (5/5 Passed)
5. `test-supplier-outstanding-payables-indexer.js` (T40) — Payables indexer and cash planning (8/8 Passed)
6. `test-supplier-ledger-transaction-log.js` (T39) — Supplier accounts payable double-entry ledger (11/11 Passed)
7. `test-supplier-crud-apis.js` (T38) — Supplier CRUD, phone canonicalization, soft-deletes (10/10 Passed)
8. `test-supplier-schema-model.js` (T37) — Supplier schema and multi-tenant isolation (8/8 Passed)
9. `test-customer-crm-profiling.js` (T36) — Customer 360° CRM and FIFO debt aging (5/5 Passed)
10. `test-customer-payment-history.js` (T35) — Customer repayment settlement tracking (6/6 Passed)
11. `test-customer-realtime-outstanding.js` (T34) — Real-time materialized balance calculations (7/7 Passed)
12. `test-customer-ledger-transaction-log.js` (T33) — Customer Khata ledger logs (7/7 Passed)
13. `test-customer-crud-apis.js` (T32) — Customer CRUD APIs and phone formatting (8/8 Passed)
14. `test-customer-schema-model.js` (T31) — Customer master schema (7/7 Passed)
15. `test-customer-credit-integration.js` (T29) — POS Udhaar integration & repayments (Passed)
16. `test-payment-recording-entity.js` (T28) — Multi-tranche split payments (Passed)
17. `test-pos-checkout-transaction.js` (T25) — Atomic checkout & inventory deduction (Passed)
18. `test-sale-items-snapshot.js` (T24) — Immutable price snapshotting (Passed)
19. `test-invoice-pdf-generation.js` (T27) — Programmatic PDF generation (Passed)
20. `test-low-stock-notifications.js` (T22) — Deterministic alert queue (Passed)
22. `test-idempotency-engine.js` (T45) — Request deduplication, canonical SHA-256 hashes, collision defense (5/5 Passed)
23. `test-concurrency-inventory.js` (T46) — Concurrency-safe atomic checkouts ($inc + $gte), zero-overselling (3/3 Passed)
24. `test-reconciliation-engine.js` (T51) — Invariant verification, drift detection, cross-system audit (3/3 Passed)

---

## 9. Phase 8: Transaction Integrity & Production Hardening Architecture

VendorOS enforces strict multi-layered consistency guarantees across all financial and inventory boundaries:

1. **Idempotency Layer (T45):**
   - Mandatory / automatic `Idempotency-Key` HTTP header handling via `idempotency.middleware.js`.
   - Dedicated `IdempotencyKey` MongoDB model with SHA-256 canonical request body hashing (`request-hash.js`).
   - Deduplicates retries, replays cached response bodies with identical status codes (`X-Cache: IDEMPOTENCY-HIT`), and blocks payload collision with `409 IDEMPOTENCY_KEY_REUSED`.
   - In-flight concurrent lock protection with `409 CONCURRENT_REQUEST_IN_PROGRESS`.

2. **Concurrency Control Layer (T46):**
   - Stock check and stock decrement occur in a single atomic database operation:
     `Inventory.findOneAndUpdate({ businessId, productId, availableStock: { $gte: qty } }, { $inc: { availableStock: -qty } })`.
   - Multi-terminal parallel checkouts never oversell and never create negative stock balances.

3. **Database Transactions & Atomicity Layer (T47):**
   - Multi-document ACID transactions with session handling via `withTransaction.js` utility.
   - Comprehensive multi-model rollbacks across Invoices, SaleItems, Inventory, InventoryLedgers, Payments, CustomerLedgers, SupplierLedgers, and PurchaseOrders.

4. **Continuous Reconciliation & System Integrity (T51):**
   - Dedicated `/api/reconciliation` suite auditing the core mathematical invariants:
     - `Inventory.availableStock === SUM(InventoryLedger.qtyChange)`
     - `Customer.currentBalance === SUM(CustomerLedger.movements)`
     - `Supplier.currentBalance === SUM(SupplierLedger.movements)`
   - Auto-repair routines to remediate ledger drift.

---

## 10. Next Planned Modules & Roadmap

1. **AI Agent Foundation & Tool Registry** (Phase 9 - AI Copilot for kirana reordering & Khata automation).
2. **Multi-Store Consolidated Analytics & End-of-Day (EOD) Reports** (`/api/reports`).
3. **Digital Receipts Integration** (Automated SMS & WhatsApp receipt delivery).
4. **Supplier Purchase Return / Debit Note Workflow** (Returning damaged physical stock to suppliers).
5. **Barcode Label Generation & Thermal Sticker Printing** for unbarcoded Kirana loose items.