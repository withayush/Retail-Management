# VendorOS — Project Persistent Memory & Technical Knowledge Base

> **File**: `MEMORY.md`  
> **Last Updated**: 2026-09-23  
> **Status**: Phase 0 to Phase 4 (Tasks T1–T30) Fully Implemented & 100% Tested  
> **Purpose**: Serves as the persistent memory, architectural contract, decision log, and developer reference for future AI agents and engineers working on VendorOS.

---

## 1. Project Overview & Identity

**VendorOS** is a cloud-first, high-density Retail & Kirana Store Operations Platform designed for physical store merchants and POS cashiers. It combines sub-millisecond barcode checkout, multi-tenant store isolation, real-time inventory ledger audits, automated low-stock queues, partial payment settlement engines, and a customer credit (Udhaar / Khata) ledger.

- **Primary Repository**: `https://github.com/withayush/Retail-Management.git` (Branch: `main`)
- **Backend Server**: Node.js 20+, Express 5.x, MongoDB Atlas (Mongoose ODM), Port `3001`
- **Frontend App**: React 19, Vite 8, Tailwind CSS, Framer Motion, Port `5173`
- **API Base Path**: `http://localhost:3001/api`

---

## 2. Core Architectural Principles (Never Violate)

1. **Multi-Tenant Isolation (`T6`)**:
   - Every single domain entity (`Category`, `Product`, `Inventory`, `InventoryLedger`, `Invoice`, `SaleItem`, `Payment`, `Customer`, `CustomerLedger`) MUST be anchored to `businessId`.
   - `req.businessId` is derived exclusively from `businessMiddleware` via JWT / session or authorized `X-Business-Id` header. Never trust client-supplied tenant IDs in request bodies.
2. **Immutable Audit Ledgers (`T16`, `T29`)**:
   - Stock counts are NEVER updated directly. Every inventory modification must be recorded as an `InventoryLedger` transaction (`IN`, `OUT`, `ADJUST`, `OPENING`, `RETURN`).
   - Invariant: `Inventory.availableStock === sum(InventoryLedger.qtyChange)`.
   - Customer Udhaar is tracked via chronological `CustomerLedger` entries with before/after balance snapshots.
3. **Historical Price Snapshotting (`T24`)**:
   - Master product catalog updates modify future billing defaults. Historical invoices freeze `soldPrice`, `costPrice`, and `grossProfit` inside `SaleItem` records at the moment of checkout and remain 100% immutable.
4. **Zero-Overselling Pre-Flight Checks (`T25`)**:
   - POS Checkout runs a pre-flight validation verifying `availableStock >= requestedQty` for all cart items. If any item is short, the transaction aborts with a 400 error and rolls back all operations.
5. **Non-Destructive Archiving (`T11`)**:
   - Hard deletes (`deleteOne` / `destroy`) are prohibited on products. Products are soft-deleted (`isArchived: true`), ensuring past invoices and credit notes remain valid.
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

### Phase 4: Sales, Billing, Payments & Khata (T23–T30) — [100% DONE]
- `Invoice` schema with sequential numbering (`INV-1001`), tax, discounts, and payment status (`PAID`, `PARTIAL`, `UNPAID`).
- `SaleItem` price and cost snapshots guaranteeing immutable gross profit analytics (`GET /api/sales/analytics/gross-profit`).
- Atomic POS Checkout API (`POST /api/sales`) executing pre-flight stock checks, invoice creation, line snapshots, stock deductions, and payment linking.
- Automatic inventory deduction and low-stock alerts sync triggered directly on checkout.
- PDFKit programmatic GST invoice generator (`GET /api/sales/:id/pdf`) and 80mm/58mm thermal printable receipts.
- Standalone `Payment` entity (`POST /api/payments`) supporting multi-tranche partial payments (Cash, UPI, Card, Split) and auto-reconciliation.
- Customer Credit (Khata) engine (`CustomerLedger`) auto-recording `SALE_CREDIT` on Udhaar sales, tracking balances, and settling repayments (`POST /api/customers/:id/settle`).
- Complete React POS billing terminal (`POSTerminalPage.jsx`) with barcode scanner listener (`useBarcodeScanner.js`), global hotkeys (`usePOSKeyboard.js`), quick cart (`POSCart.jsx`), customer modal (`POSCustomerModal.jsx`), and payment settle modal (`SettlePaymentModal.jsx`).

---

## 4. Database Schemas (16 Mongoose Models)

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
| `Customer` | Customer CRM & credit balance master | `{ businessId: 1, phone: 1 }` |
| `CustomerLedger` | Immutable Khata debit/credit ledger | `{ businessId: 1, customerId: 1, createdAt: -1 }` |

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
5. **Cross-Tenant Category Link Prevention**:
   - During product creation or updates, the service verifies that `categoryId` belongs strictly to `req.businessId`, preventing cross-tenant category linking.
6. **Cross-Origin Production Cookie Configuration**:
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
# 1. Low-Stock Alerts Queue Test
node Backend/tests/test-low-stock-notifications.js

# 2. Inventory Ledger Statement Test
node Backend/tests/test-inventory-ledger-ui.js

# 3. Sale Line Items Snapshot Test
node Backend/tests/test-sale-items-snapshot.js

# 4. POS Checkout Atomic Transaction Test
node Backend/tests/test-pos-checkout-transaction.js

# 5. Invoice PDF Generation Test
node Backend/tests/test-invoice-pdf-generation.js

# 6. Payment Recording Entity Test
node Backend/tests/test-payment-recording-entity.js

# 7. Customer Credit Integration & Khata Test
node Backend/tests/test-customer-credit-integration.js

# Frontend Production Build Verification
cd Frontend && npm run build
```

---

## 8. Summary for Future Sprints
- **Next Planned Modules**: Multi-store analytics, daily end-of-day sales reconciliation reports (`/api/reports`), supplier purchase order management, and SMS/WhatsApp digital receipts.
- **Maintain Invariants**: Whenever writing new code, ensure `businessId` tenancy, immutable ledger logs, and zero-overselling guards are strictly preserved.
