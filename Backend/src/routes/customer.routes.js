const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customer.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { businessMiddleware } = require("../middlewares/business.middleware");

// Require authentication & multi-tenant business context for all customer routes
router.use(authMiddleware);
router.use(businessMiddleware);

// Customer Directory CRUD
router.post("/", customerController.createCustomer);
router.get("/", customerController.getCustomers);

// Outstanding Aggregates (Must be defined before :id route)
router.get("/outstanding/summary", customerController.getBusinessOutstandingSummary);
router.get("/outstanding/totals", customerController.getBusinessOutstandingTotals);

// Specific Customer Details & Ledgers
router.get("/:id", customerController.getCustomerById);
router.put("/:id", customerController.updateCustomer);
router.get("/:id/outstanding", customerController.getCustomerOutstanding);
router.get("/:id/ledger", customerController.getCustomerLedger);
router.post("/:id/pay", customerController.recordCustomerPayment);

module.exports = router;
