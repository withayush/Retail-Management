const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customer.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { businessMiddleware } = require("../middlewares/business.middleware");

// Require authentication & multi-tenant business context for all customer routes
router.use(authMiddleware);
router.use(businessMiddleware);

// Customer Directory CRUD & Rapid POS Search (T32)
router.post("/", customerController.createCustomer);
router.get("/", customerController.getCustomers);
router.get("/search", customerController.searchCustomers);

// Outstanding Aggregates (Must be defined before :id route)
router.get("/outstanding/summary", customerController.getBusinessOutstandingSummary);
router.get("/outstanding/totals", customerController.getBusinessOutstandingTotals);

// Specific Customer Details by Phone
router.get("/phone/:phone", customerController.getCustomerByPhone);

// Specific Customer Details, Updates, Archival, Restoration, Ledgers & CRM (T31, T32, T33, T34, T35, T36)
router.get("/:id", customerController.getCustomerById);
router.put("/:id", customerController.updateCustomer);
router.delete("/:id", customerController.deleteCustomer);
router.post("/:id/archive", customerController.deleteCustomer);
router.post("/:id/restore", customerController.restoreCustomer);
router.get("/:id/outstanding", customerController.getCustomerOutstanding);
router.get("/:id/ledger", customerController.getCustomerLedger);
router.post("/:id/ledger", customerController.appendLedgerEntry);
router.get("/:id/payments", customerController.getCustomerPaymentHistory);
router.get("/:id/payment-history", customerController.getCustomerPaymentHistory);
router.get("/:id/crm-summary", customerController.getCustomerCRMSummary);
router.get("/:id/summary", customerController.getCustomerCRMSummary);
router.get("/:id/profile", customerController.getCustomerCRMSummary);
router.get("/:id/360", customerController.getCustomerCRMSummary);
router.post("/:id/pay", customerController.recordCustomerPayment);
router.post("/:id/settle", customerController.recordCustomerPayment);

module.exports = router;
