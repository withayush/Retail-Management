# VendorOS — Project Persistent Memory & Technical Knowledge Base

> **File**: `MEMORY.md`  
> **Last Updated**: 2026-09-23  
> **Status**: Phase 0 to Phase 5 (Tasks T1–T36) Fully Implemented & 100% Tested  
> **Purpose**: Serves as the persistent memory, architectural contract, decision log, and developer reference for future AI agents and engineers working on VendorOS.

---

## 1. Project Overview & Identity

**VendorOS** is a cloud-first, high-density Retail & Kirana Store Operations Platform designed for physical store merchants and POS cashiers. It combines sub-millisecond barcode checkout, multi-tenant store isolation, real-time inventory ledger audits, automated low-stock queues, partial payment settlement engines, customer master profiles, an append-only customer credit (Udhaar / Khata) ledger transaction log, real-time materialized outstanding calculations, customer credit payment history tracking, and a comprehensive 360° Customer CRM & Debt Aging profiling engine.

- **Primary Repository**: `https://github.com/withayush/Retail-Management.git` (Branch: `main`)
- **Backend Server**: Node.js 20+, Express 5.x, MongoDB Atlas (Mongoose ODM), Port `3001`
- **Frontend App**: React 19, Vite 8, Tailwind CSS, Framer Motion, Port `5173`
- **API Base Path**: `http://localhost:3001/api`

---

## 2. Core Architectural Principles (Never Violate)

1. **Multi-Tenant Isolation (`T6`, `T31`, `T32`, `T33`, `T34`, `T35`, `T36`)**:
   - Every single domain entity (`Category`, `Product`, `Inventory`, `InventoryLedger`, `Invoice`, `SaleItem`, `Payment`, `Customer`, `CustomerLedger`) MUST be anchored to `businessId`.
   - `req.businessId` is derived exclusively from `businessMiddleware` via JWT / session or authorized `X-Business-Id` header. Never trust client-supplied tenant IDs in request bodies.
2. **Immutable Audit Ledgers & Real-Time Materialized State (`T16`, `T29`, `T33`, `T34`, `T35`, `T36`)**:
   - Stock counts are NEVER updated directly. Every inventory modification must be recorded as an `InventoryLedger` transaction (`IN`, `OUT`, `ADJUST`, `OPENING`, `RETURN`).
   - Invariant: `Inventory.availableStock === sum(InventoryLedger.qtyChange)`.
   - Customer Udhaar is tracked via chronological `CustomerLedger` entries with before/after balance snapshots (`Balance = Previous Balance + Credit - Debit`).
   - `Customer.currentBalance` acts as the real-time materialized state, maintained atomically alongside ledger entries to enable O(1) single-document lookups and high-speed POS checkouts without heavy ledger aggregation.
   - Customer Repayments (T35) and CRM 360° Profiling (T36) are dedicated aggregation & query layers without mutating data, combining sales behavior, visit frequency, debt aging, and repayment logs into actionable merchant dashboards.
3. **Historical Price Snapshotting (`T24`)**:
   - Master product catalog updates modify future billing defaults. Historical invoices freeze `soldPrice`, `costPrice`, and `grossProfit` inside `SaleItem` records at the moment of checkout and remain 100% immutable.
4. **Zero-Overselling Pre-Flight Checks (`T25`)**:
   - POS Checkout runs a pre-flight validation verifying `availableStock >= requestedQty` for all cart items. If any item is short, the transaction aborts with a 400 error and rolls back all operations.
5. **Non-Destructive Archiving (`T11`, `T31`, `T32`)**:
   - Hard deletes (`deleteOne` / `destroy`) are prohibited on products and customer accounts. Items are soft-deleted / deactivated (`isArchived: true` / `status: 'INACTIVE'`), ensuring past invoices and credit notes remain valid.
6. **Keyboard-First Cashier Ergonomics (`T30`)**:
   - POS terminal operates completely without a mouse via hardware barcode scanners and global function keys (`F2`, `F4`, `F8`, `F9`, `F1`, `Esc`).

---

## 3. Implementation Milestones & Completed Tasks

### Phase 0: Authentication & Security (T1–T5) — [100% DONE]
- Registration with Zod validation, bcrypt hashing, 6-digit phone OTP generation (10m expiry).
- Atomic OTP verification, vendor auto-provisioning, dual JWT issuance (15m Access Token, 7d Refresh Token) in secure HttpOnly cookies.
- Refresh Token Rotation (RTR) with token-reuse/theft detection and session revocation.
- Canonical phone normalization (`+91XXXXXXXXXX`) and `AuthAttempt` security logging.

### Phase 1: Business Foundation & Multi-Tenant Isolation (T6) — [100% DONE]
- Business model supporting 14+ retail segments (Grocery, Supermarket, Kirana, Electronics, Pharmacy, etc.), GST modes, and store operating hours.
- 3-step onboarding wizard (`BusinessOnboarding.jsx`) saving drafts and unlocking modules upon completion.
- `businessMiddleware` verifying store membership and injecting `req.businessId` and `req.businessRole`.

### Phase 2: Category & Product Catalog (T7–T14) — [100% DONE]
- Categories with compound tenant unique indexes (`{ businessId: 1, name: 1 }`) and interactive CRUD modal (`CategoriesModal.jsx`).
- Product catalog with `sellingPrice`, `costPrice`, `sku`, `barcode`, `unit`, `packSize`, and packaging types.
- Self-SKU collision idempotency allowing price/packaging edits without unique key errors.
- Soft-deletion / restore lifecycle preserving historical invoices.
- Base64 opaque cursor seek pagination (`GET /api/products`).
- Sub-millisecond barcode lookup API (`GET /api/products/barcode/:barcode`) and multi-field search.

### Phase 3: Inventory Stock & Movement Ledger (T15–T22) — [100% DONE]
- `Inventory` master tracking physical stock, reorder thresholds, and asset valuations.
- `InventoryLedger` immutable movement audit trail (`type`, `qtyChange`, `balanceAfter`, `source`, `referenceNumber`).
- Opening stock initialization during product creation (`type: 'OPENING'`).
- Stock In (`POST /api/inventory/stock-in`) for procurement with supplier and unit cost.
- Stock Out (`POST /api/inventory/stock-out`, `/batch`) with insufficient stock protection.
- Physical stock reconciliation (`POST /api/inventory/adjust`) with live discrepancy delta calculation.
- Bank-statement-style chronological audit trail (`GET /api/inventory/ledger`) with 1-click CSV export.
- Deterministic low-stock notifications queue (`GET /api/inventory/alerts`) with deduplication and 1-click restock shortcuts.

### Phase 4: Sales, Billing, Payments & POS Terminal (T23–T30) — [100% DONE]
- `Invoice` schema with sequential numbering (`INV-1001`), tax, discounts, and payment status (`PAID`, `PARTIAL`, `UNPAID`).
- `SaleItem` price and cost snapshots guaranteeing immutable gross profit analytics (`GET /api/sales/analytics/gross-profit`).
- Atomic POS Checkout API (`POST /api/sales`) executing pre-flight stock checks, invoice creation, line snapshots, stock deductions, and payment linking.
- Automatic inventory deduction and low-stock alerts sync triggered directly on checkout.
- PDFKit programmatic GST invoice generator (`GET /api/sales/:id/pdf`) and 80mm/58mm thermal printable receipts.
- Standalone `Payment` entity (`POST /api/payments`) supporting multi-tranche partial payments (Cash, UPI, Card, Split) and auto-reconciliation.
- Customer Credit (Khata) engine (`CustomerLedger`) auto-recording `SALE_CREDIT` on Udhaar sales, tracking balances, and settling repayments (`POST /api/customers/:id/settle`).
- Complete React POS billing terminal (`POSTerminalPage.jsx`) with barcode scanner listener (`useBarcodeScanner.js`), global hotkeys (`usePOSKeyboard.js`), quick cart (`POSCart.jsx`), customer modal (`POSCustomerModal.jsx`), and payment settle modal (`SettlePaymentModal.jsx`).

### Phase 5: Customer System, Profiles Master & Transaction Log (T31–T36) — [100% DONE]
- `Customer` master schema (`src/models/customer.model.js`) storing demographic details (Name, Phone, Email, Address, City, State, Pincode, Credit Limit, Status, Notes, Tags).
- Multi-tenant phone uniqueness guarantee: Compound index `{ businessId: 1, phone: 1 }` with partial filter expression ensuring unique phone per business when provided while gracefully handling optional/empty phone numbers.
- Strict separation of customer demographic profile (`Customer`) from financial transaction history (`CustomerLedger`).
- Full demographic frontend modals (`AddCustomerModal.jsx`, `EditCustomerModal.jsx`) in `CustomersPage.jsx` with direct table row edit trigger.
- Complete REST CRUD API suite (`POST /api/customers`, `GET /api/customers`, `GET /api/customers/search`, `GET /api/customers/phone/:phone`, `GET /api/customers/:id`, `PUT /api/customers/:id`, `DELETE /api/customers/:id`, `POST /api/customers/:id/archive`, `POST /api/customers/:id/restore`).
- `CustomerLedger` Transaction Log (T33) tracking sub-ledger debit/credit history:
  * Credit (+) = Goods taken on credit / Udhaar -> increases customer outstanding.
  * Debit (-) = Payment / settlement made -> decreases customer outstanding.
  * Running Balance Snapshot: `Balance = Previous Balance + Credit - Debit`.
  * Append-only immutability (no update/delete of historical logs; adjustments handled via `POST /api/customers/:id/ledger`).
  * Direct historical traceability with `saleId` / `invoiceId` linking.
- Real-Time Outstanding Balance Calculations (T34):
  * Materialized `currentBalance` in `Customer` document updated atomically on every transaction.
  * Fast O(1) single-document endpoint: `GET /api/customers/:id/outstanding` (credit limit, available credit, limit exceeded checks).
  * High-speed debtor ranking and store aggregate metrics: `GET /api/customers/outstanding/summary` and `GET /api/customers/outstanding/totals`.
- Customer Credit Payment History & Repayment Log (T35):
  * Read/query layer specifically for customer repayments/settlements made toward past credit balances (`GET /api/customers/:id/payments`).
  * Summarizes `totalAmountPaid`, `totalPaymentsCount`, `averagePaymentAmount`, and `methodBreakdown` ({ CASH, UPI, CARD }).
  * Supports date range (`from`, `to`) and payment method filtering.
  * Dedicated interactive UI modal (`CustomerPaymentHistoryModal.jsx`) with KPI cards and payment method badges.
- Customer CRM, 360° Profiling & Debt Aging (T36):
  * Aggregation engine uniting demographics, lifetime sales metrics, visit frequency, average spend per order, real-time debt, multi-bucket debt aging (`0-30d`, `31-60d`, `61-90d`, `90+d`), recent sales, and recent repayments (`GET /api/customers/:id/crm-summary`).
  * Dedicated interactive UI modal (`CustomerCRMModal.jsx`) with live 4x KPI cards, visual aging distribution bar, recent activity tabs, and 1-click action shortcuts.
- Interactive statement modal (`CustomerLedgerModal.jsx`) with real-time audit ledger timeline, debit/credit badges, and settlement actions.
- Automated test suites: `Backend/tests/test-customer-schema-model.js` (T31), `Backend/tests/test-customer-crud-apis.js` (T32), `Backend/tests/test-customer-ledger-transaction-log.js` (T33), `Backend/tests/test-customer-realtime-outstanding.js` (T34), `Backend/tests/test-customer-payment-history.js` (T35), and `Backend/tests/test-customer-crm-profiling.js` (T36) (100% passing).

### Phase 6: Supplier & Procurement Management (T37–T42) — [T37 & T38 IMPLEMENTED]
- `Supplier` Master Schema (`src/models/supplier.model.js`) (T37):
  * Defines the business-scoped Supplier master entity representing distributors, manufacturers, wholesalers, and stock vendors from whom the merchant procures inventory.
  * Fields: `_id`, `businessId` (ObjectId, ref: 'Business'), `company` (Required, e.g. "ABC Distributors"), `contactName` (e.g. "Amit Sharma"), `phone` (Canonical e.g. "+91XXXXXXXXXX"), `email`, `address`, `city`, `state`, `pincode`, `gstin`, `currentBalance` (materialized supplier payable outstanding), `totalPurchases`, `totalOrders`, `lastPurchaseDate`, `lastPaymentDate`, `status` ('ACTIVE' | 'INACTIVE' | 'BLOCKED'), `notes`, `tags`.
  * Multi-Tenant Phone Uniqueness: Compound index `{ businessId: 1, phone: 1 }` with `{ unique: true, partialFilterExpression: { phone: { $type: "string", $gt: "" } } }` allowing multiple suppliers with empty phone numbers while preventing duplicate phone numbers within the same store.
  * Clear Domain Separation: `Customer` = whom the business sells to (Money In); `Supplier` = whom the business buys inventory from (Money Out). Independent entity, never embedded inside Product.
- Supplier REST CRUD APIs & Lifecycle Engine (T38):
  * Complete suite of secure REST APIs: `POST /api/suppliers`, `GET /api/suppliers`, `GET /api/suppliers/search`, `GET /api/suppliers/phone/:phone`, `GET /api/suppliers/summary`, `GET /api/suppliers/:id`, `PUT /api/suppliers/:id`, `DELETE /api/suppliers/:id`, `POST /api/suppliers/:id/archive`, `POST /api/suppliers/:id/restore`.
  * Automatic canonical phone normalization (`+91XXXXXXXXXX`) and Zod schema validation.
  * Safe non-destructive soft-delete / archival (`status: 'INACTIVE'`) preserving historic purchase orders and stock-in transactions.
  * Frontend Supplier Management: Dedicated UI page (`SuppliersPage.jsx`) featuring `SupplierStatsCards.jsx` (Total Vendors, Active, Payable Balance, Total Procurements), `SuppliersTable.jsx`, `AddSupplierModal.jsx`, and `EditSupplierModal.jsx`, wired to `/suppliers` sidebar navigation.
  * Automated Test Suites: `Backend/tests/test-supplier-schema-model.js` (T37) and `Backend/tests/test-supplier-crud-apis.js` (T38) (100% passing).


---

## 4. Database Schemas (17 Mongoose Models)

| Model Name | Primary Responsibility | Key Compound Indexes |
|---|---|---|
| `Account` | User credentials & verification status | `{ email: 1 }`, `{ phone: 1 }` |
| `OtpChallenge` | 6-digit cryptographic phone verification codes | `{ phone: 1, expiresAt: 1 }` |
| `Session` | Active login sessions & RTR refresh token hashes | `{ accountId: 1 }`, `{ refreshTokenHash: 1 }` |
| `AuthAttempt` | Security audit trail for login attempts & IPs | `{ ip: 1, createdAt: -1 }` |
| `Vendor` | Vendor owner profile & onboarding step draft state | `{ accountId: 1 }` |
| `Business` | Physical store configuration, address, GST, currency | `{ ownerId: 1 }` |
| `BusinessMember` | User-to-Business role mapping (`OWNER`, `MANAGER`, `STAFF`) | `{ businessId: 1, userId: 1 }` |
| `Category` | Scoped product categories | `{ businessId: 1, name: 1 }` |
| `Product` | Master catalog items, pricing, SKUs, and barcodes | `{ businessId: 1, sku: 1 }`, `{ businessId: 1, barcode: 1 }` |
| `Inventory` | Current physical stock, reorder level, alert flags | `{ businessId: 1, productId: 1 }` |
| `InventoryLedger` | Immutable stock movement audit trail | `{ businessId: 1, productId: 1, createdAt: -1 }`, `{ businessId: 1, type: 1 }` |
| `InventoryAlert` | Deterministic low-stock notifications queue | `{ businessId: 1, productId: 1, status: 1 }` |
| `Invoice` | Sales transaction header & sequential numbering | `{ businessId: 1, invoiceNumber: 1 }`, `{ businessId: 1, createdAt: -1 }` |
| `SaleItem` | Frozen checkout line items & profit snapshots | `{ businessId: 1, saleId: 1 }` |
| `Payment` | Multi-tranche payments against invoices | `{ businessId: 1, invoiceId: 1 }` |
| `Customer` | Customer CRM & credit balance master | `{ businessId: 1, phone: 1 }` (partial), `{ businessId: 1, currentBalance: -1 }` |
| `CustomerLedger` | Immutable Khata debit/credit ledger | `{ businessId: 1, customerId: 1, createdAt: -1 }` |
| `Supplier` | Master supplier / vendor procurement entity | `{ businessId: 1, phone: 1 }` (partial), `{ businessId: 1, company: 1 }`, `{ businessId: 1, currentBalance: -1 }` |

---

## 5. Key Technical Decisions & Past Bug Fixes

1. **Mongoose `returnDocument: "after"` Deprecation**:
   - Updated all repository `findOneAndUpdate` calls to use `{ returnDocument: "after", new: true }` to eliminate Mongoose runtime console warnings.
2. **Middleware Scoping for Routes**:
   - `customer.routes.js`, `payment.routes.js`, and `sale.routes.js` strictly import `businessMiddleware` from `../middlewares/business.middleware` to prevent missing module errors.
3. **API URL Double Prefix Fix**:
   - Fixed endpoint declarations in frontend services so base Axios URL handles `/api` prefix without duplicating `/api/api/...`.
4. **Self-SKU Idempotency Guard (`product.service.js`)**:
   - When updating a product, the SKU collision check verifies whether the matching SKU belongs to a *different* product ID (`_id !== id`), allowing price/packaging edits on existing items without SKU collision errors.
5. **Partial Filter Expression on Customer Phone (`customer.model.js`)**:
   - Used `{ unique: true, partialFilterExpression: { phone: { $type: "string", $gt: "" } } }` so walk-in customers with empty/omitted phone numbers can be created without duplicate index collisions.
6. **Cross-Tenant Category Link Prevention**:
   - During product creation or updates, the service verifies that `categoryId` belongs strictly to `req.businessId`, preventing cross-tenant category linking.
7. **Cross-Origin Production Cookie Configuration**:
   - In production (`NODE_ENV=production`), auth cookies use `sameSite: 'none'` and `secure: true` to support cross-domain cookie transmission between Render frontend and backend domains.

---

## 6. Frontend Architecture & POS Hotkeys Reference

### Custom Hooks
- **`useBarcodeScanner.js`**: Global keydown listener detecting high-frequency bursts (< 50ms) from hardware barcode scanners and automatically adding matching items to the cart.
- **`usePOSKeyboard.js`**: Cashier hotkey manager intercepting function keys without mouse dependency.

### POS Keyboard Hotkeys Cheat Sheet
- `F2`  : Focus Product Search Input
- `F4`  : Open Customer Selection / Khata Udhaar Modal
- `F8`  : Clear / Reset Active Shopping Cart
- `F9`  : Proceed to Checkout / Open Settle Payment Modal
- `F1`  : Open Hotkeys Guide Modal
- `Esc` : Close Any Active Modal Dialog

---

## 7. Automated Test Suites & Verification Commands

All test suites in `Backend/tests/` can be executed directly:
```bash
# 1. Real-Time Customer Outstanding Calculations Test (T34)
node Backend/tests/test-customer-realtime-outstanding.js

# 2. Customer Ledger Transaction Log Test (T33)
node Backend/tests/test-customer-ledger-transaction-log.js

# 3. Customer CRUD APIs & Phone Canonicalization Test (T32)
node Backend/tests/test-customer-crud-apis.js

# 4. Customer Schema Model & Multi-Tenant Isolation Test (T31)
node Backend/tests/test-customer-schema-model.js

# 5. Customer Credit Integration & Khata Test (T29)
node Backend/tests/test-customer-credit-integration.js

# 4. Payment Recording Entity Test (T28)
node Backend/tests/test-payment-recording-entity.js

# 5. POS Checkout Atomic Transaction Test (T25)
node Backend/tests/test-pos-checkout-transaction.js

# 6. Sale Line Items Snapshot Test (T24)
node Backend/tests/test-sale-items-snapshot.js

# 7. Invoice PDF Generation Test (T27)
node Backend/tests/test-invoice-pdf-generation.js

# 8. Low-Stock Alerts Queue Test (T22)
node Backend/tests/test-low-stock-notifications.js

# 9. Inventory Ledger Statement Test (T21)
node Backend/tests/test-inventory-ledger-ui.js

# Frontend Production Build Verification
cd Frontend && npm run build
```

---

## 8. Summary for Future Sprints
- **Next Planned Modules**: Multi-store analytics, daily end-of-day sales reconciliation reports (`/api/reports`), supplier purchase order management, and SMS/WhatsApp digital receipts.
- **Maintain Invariants**: Whenever writing new code, ensure `businessId` tenancy, immutable ledger logs, and zero-overselling guards are strictly preserved.
