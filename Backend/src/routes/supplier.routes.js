const express = require("express");
const router = express.Router();
const supplierController = require("../controllers/supplier.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { businessMiddleware } = require("../middlewares/business.middleware");

// Protect all supplier routes with Auth and Business Tenant validation
router.use(authMiddleware);
router.use(businessMiddleware);

// Standard Directory CRUD & Rapid Search (T38)
router.post("/", supplierController.createSupplier);
router.get("/", supplierController.getSuppliers);
router.get("/search", supplierController.searchSuppliers);
router.get("/summary", supplierController.getSupplierSummary);
router.get("/phone/:phone", supplierController.getSupplierByPhone);

const idempotencyMiddleware = require("../middlewares/idempotency.middleware");

// Payables summaries (Registered before /:id)
router.get("/payables/summary", supplierController.getBusinessPayablesSummary);
router.get("/payables/totals", supplierController.getBusinessPayablesTotals);

// Phase 6 - Task T39 & T40: Supplier Ledger Transaction Log & Accounts Payable Endpoints
router.get("/:id/ledger", supplierController.getSupplierLedger);
router.post("/:id/ledger", idempotencyMiddleware("SUPPLIER_LEDGER_APPEND"), supplierController.appendLedgerEntry);
router.post("/:id/settle", idempotencyMiddleware("SUPPLIER_SETTLE"), supplierController.recordSupplierPayment);
router.post("/:id/payments", idempotencyMiddleware("SUPPLIER_SETTLE"), supplierController.recordSupplierPayment);
router.post("/:id/purchases/credit", idempotencyMiddleware("SUPPLIER_PURCHASE_CREDIT"), supplierController.recordPurchaseCredit);
router.get("/:id/outstanding", supplierController.getSupplierOutstanding);

// Phase 6 - Task T41: Supplier 360° Management Center Summary
router.get("/:id/summary-360", supplierController.getSupplier360Summary);
router.get("/:id/360", supplierController.getSupplier360Summary);
router.get("/:id/crm-summary", supplierController.getSupplier360Summary);


// Single Supplier Profile, Updates, Archival & Restoration (T37, T38)
router.get("/:id", supplierController.getSupplierById);
router.put("/:id", supplierController.updateSupplier);
router.delete("/:id", supplierController.deleteSupplier);
router.post("/:id/archive", supplierController.archiveSupplier);
router.post("/:id/restore", supplierController.restoreSupplier);

module.exports = router;

