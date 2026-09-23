# VendorOS - Product Requirements Document (PRD)

## 1. Executive Summary & Vision
**VendorOS** is a modern, cloud-first Retail and Kirana Store Operations Operating System designed for high-frequency retail workflows. It combines fast barcode-driven POS checkout, real-time inventory ledger tracking, multi-tenant business isolation, automated low-stock queues, multi-tranche payment settlements, customer master profiles, and a customer credit (Udhaar / Khata) ledger.

---

## 2. Core Architectural Principles
1. **Multi-Tenant Data Isolation (T6, T31)**: Every transactional record (`Category`, `Product`, `Inventory`, `InventoryLedger`, `Invoice`, `SaleItem`, `Payment`, `Customer`, `CustomerLedger`) is strictly anchored to `businessId`. Cross-tenant data leakage is prevented at the middleware and repository levels.
2. **Immutable Financial & Inventory Audits (T16, T24, T28, T29)**:
   - Physical stock is never overwritten directly; all movements are recorded as chronological `InventoryLedger` entries.
   - Master catalog price changes never mutate past `SaleItem` price snapshots.
   - Customer Udhaar is tracked via immutable `CustomerLedger` entries with before/after balance snapshots.
3. **Atomic POS Transactions & Rollback Guarantees (T25)**:
   - Pre-flight stock validation ensures zero overselling. If any cart item has insufficient stock, the transaction aborts with a 400 error and rolls back all operations.
4. **Keyboard-First Cashier Experience (T30)**:
   - POS terminal operates seamlessly with hardware barcode scanners and global hotkeys (`F2`, `F4`, `F8`, `F9`, `Esc`).

---

## 3. Product Phases & Task Breakdown

### Phase 0: Authentication, Security & Foundation (T1–T5)
- **T1: Environment & Cloud Database**: Express 5.x, Node.js CommonJS, MongoDB Atlas connection pool, and secure `.env` configuration.
- **T2: Multi-Factor Authentication**: Registration with Zod validation, bcrypt password hashing, 6-digit cryptographic phone OTP generation, and 10-minute expiry.
- **T3: OTP Verification & Account Activation**: Atomic verification, vendor profile auto-provisioning, dual JWT issuance (15m Access Token, 7d Refresh Token) in HttpOnly secure cookies.
- **T4: Session Management & RTR**: Refresh Token Rotation (RTR) with token reuse/theft detection and session revocation.
- **T5: Phone Normalization & Auth Logging**: Canonical `+91` E.164 normalization and audit logging for security compliance (`AuthAttempt`).

### Phase 1: Business Foundation & Multi-Tenant Isolation (T6)
- **Business Profile**: Supports 14+ retail segments (Grocery, Supermarket, Kirana, Electronics, Pharmacy, FMCG, Clothing, etc.), tax modes (GST, Composition, Non-GST), currency ('INR'), and store operating hours.
- **3-Step Onboarding Wizard**: Guides new vendors through store basics, location/pincode, and operational preferences.
- **T6 Tenant Middleware**: Inspects `X-Business-Id` header and session tokens, validates store membership, and injects trusted `req.businessId` into downstream controllers.

### Phase 2: Category & Product Catalog Engine (T7–T14)
- **T7: Category Management**: Scoped unique categories per business (`{ businessId: 1, name: 1 }`) with CRUD endpoints and real-time category filter modals.
- **T8–T10: Product Catalog & Self-SKU Idempotency**:
  - Products with `sellingPrice`, `costPrice`, `sku`, `barcode`, `unit`, `packSize`, and packaging types.
  - Safe editing: Product price updates apply to future sales while keeping historical invoice line items immutable.
- **T11: Archival & Soft-Deletion**: Non-destructive archiving (`isArchived: true`) ensures historical invoices remain valid.
- **T12–T14: Rapid Seek Pagination & Barcode Lookup**:
  - Base64 opaque cursor pagination for smooth infinite lists.
  - Sub-millisecond barcode lookup endpoint (`GET /api/products/barcode/:barcode`) for rapid POS scanning.

### Phase 3: Inventory Stock & Ledger Engine (T15–T22)
- **T15: Inventory Master**: Tracks `availableStock`, `reorderLevel`, `reservedStock`, and `lowStockAlert`.
- **T16: Immutable Movement Ledger**: Records every stock change with `type` (`IN`, `OUT`, `ADJUST`, `OPENING`, `RETURN`), `qtyChange`, `balanceAfter`, and `reason`.
- **T17: Opening Stock Initializer**: Seeds initial physical store counts during product catalog creation.
- **T18: Stock IN (Procurement)**: Logs goods receipts with supplier name, unit purchase cost, and PO/Bill numbers.
- **T19: Stock OUT (Sales & Consumption)**: Deducts stock with pre-flight stock validation, preventing negative balances.
- **T20: Stock Reconciliation / Adjustment**: Reconciles physical counts against system records with audit discrepancy logs.
- **T21: Ledger Statement UI**: Searchable, multi-filtered chronological stock flow statement with 1-click CSV export.
- **T22: Deterministic Low-Stock Alerts Queue**: Automated alert trigger and resolution queue with zero duplicate spamming.

### Phase 4: Sales, Billing, Payments & POS Terminal (T23–T30)
- **T23: Sales Transaction & Invoicing Header**: Sequential invoice numbering (`INV-1001`), tax calculation, discounts, and payment status tracking (`PAID`, `PARTIAL`, `UNPAID`).
- **T24: Sale Item Price Snapshotting**: Freezes unit price and cost price at the moment of sale, guaranteeing immutable historical gross profit analytics (`GET /api/sales/analytics/gross-profit`).
- **T25: Atomic POS Checkout API**: Single transaction orchestrating invoice generation, line item snapshotting, inventory deduction, ledger logging, and payment recording.
- **T26: Automated Inventory & Alerts Integration**: Real-time deduction and alert queue synchronization triggered directly by sales events.
- **T27: Invoice PDF Generation & Thermal Receipts**: PDFKit engine generating GST-compliant invoices and 80mm/58mm thermal printable receipts.
- **T28: Payment Recording Entity**: Standalone payment tracking supporting partial multi-tranche payments and split methods (Cash + UPI).
- **T29: Customer Credit (Khata) Integration**:
  - Automatic credit ledger debiting when an invoice is sold on Udhaar (`CREDIT` or partial balance).
  - Khata settlement engine (`POST /api/customers/:id/settle`) for recording customer repayments and clearing outstanding balances.
- **T30: Billing Checkout Front Terminal**: Full-featured React cashier POS interface with barcode scanner detection, keyboard shortcuts, quick cart, customer selection modal, and payment settlement modal.

### Phase 5: Customer System, Profiles Master & Transaction Log (T31–T34)
- **T31: Customer Schema DB Model & Demographics**:
  - Establishes business-scoped customer master profile entity (Name, Phone, Email, Address, City, State, Pincode, Credit Limit, Status, Notes, Tags).
  - Multi-tenant phone uniqueness: Compound index `{ businessId: 1, phone: 1 }` with partial filter expression prevents duplicate phone numbers within a store while gracefully handling optional/empty phone numbers.
  - Strict separation of customer demographic profile (`Customer`) from financial ledgers (`CustomerLedger`).
  - Safe soft-delete (`DELETE /api/customers/:id`) setting `status: 'INACTIVE'` preserving all historical sales, invoices, and payment ledgers.
- **T32: Customer CRUD APIs & Phone Canonicalization**:
  - Full REST API suite for customer registration, retrieval, updating, search, and lifecycle archiving.
  - Automatic canonical phone normalization (`+91XXXXXXXXXX`) on create and update operations.
  - POS rapid search (`GET /api/customers/search`) and direct phone lookup (`GET /api/customers/phone/:phone`).
  - Frontend management via `CustomersPage.jsx`, `CustomersTable.jsx`, `AddCustomerModal.jsx`, and `EditCustomerModal.jsx`.
- **T33: Customer Ledger Transaction Log & Sub-Ledger History**:
  - Double-entry / sub-ledger transaction log tracking customer debt and payment settlements.
  - Schema: `Customer Ledger Schema (ID, CustomerID, CreditAmount, DebitAmount, Balance, SaleID, Notes, CreatedAt)`.
  - Authoritative Balance Formula: `Balance = Previous Balance + CreditAmount - DebitAmount`.
  - Append-only immutability (no direct updates or deletions of historical ledger rows).
  - Complete invoice traceability linking ledger records directly to `saleId` and originating invoices.
  - Interactive frontend statement modal (`CustomerLedgerModal.jsx`) displaying color-coded debit/credit flows and real-time aggregate summaries.
- **T34: Real-Time Outstanding Calculations & Fast Materialized Balance**:
  - Eliminates heavy, repeated ledger aggregations by maintaining materialized `currentBalance` in `Customer` document.
  - Atomic synchronization: Balance updates happen synchronously in the same transaction as ledger appends.
  - Fast O(1) single-customer query (`GET /api/customers/:id/outstanding`) returning real-time debt, credit limits, and available credit.
  - Store-wide debtor rankings and receivables dashboard aggregation (`GET /api/customers/outstanding/summary`, `/totals`) powered by `{ businessId: 1, currentBalance: -1 }`.

---

## 4. Key Performance Indicators (KPIs)
- **POS Checkout Latency**: < 200ms end-to-end for cart processing, invoice creation, and inventory deduction.
- **Barcode Scan Lookup**: < 50ms sub-millisecond response.
- **Inventory Discrepancy Rate**: 0% mathematical discrepancy (`availableStock === sum(ledger.qtyChange)`).
- **Data Integrity**: 100% preservation of historical prices and ledger balance snapshots.