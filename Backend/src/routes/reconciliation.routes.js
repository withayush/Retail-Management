const express = require("express");
const router = express.Router();
const reconciliationController = require("../controllers/reconciliation.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { businessMiddleware } = require("../middlewares/business.middleware");

// Require authentication and business tenancy
router.use(authMiddleware);
router.use(businessMiddleware);

/**
 * System Data Integrity & Ledger Reconciliation Endpoints
 */
router.get("/summary", (req, res, next) => reconciliationController.runFullReconciliation(req, res, next));
router.get("/full", (req, res, next) => reconciliationController.runFullReconciliation(req, res, next));
router.post("/run-all", (req, res, next) => reconciliationController.runFullReconciliation(req, res, next));

router.get("/inventory", (req, res, next) => reconciliationController.getInventoryReconciliation(req, res, next));
router.post("/inventory/fix", (req, res, next) => {
  req.query.autoFix = "true";
  return reconciliationController.getInventoryReconciliation(req, res, next);
});

router.get("/customers", (req, res, next) => reconciliationController.getCustomerReconciliation(req, res, next));
router.post("/customers/fix", (req, res, next) => {
  req.query.autoFix = "true";
  return reconciliationController.getCustomerReconciliation(req, res, next);
});

router.get("/suppliers", (req, res, next) => reconciliationController.getSupplierReconciliation(req, res, next));
router.post("/suppliers/fix", (req, res, next) => {
  req.query.autoFix = "true";
  return reconciliationController.getSupplierReconciliation(req, res, next);
});

module.exports = router;
