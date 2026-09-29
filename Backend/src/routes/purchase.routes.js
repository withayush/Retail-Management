const express = require("express");
const router = express.Router();
const grnController = require("../controllers/grn.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { businessMiddleware } = require("../middlewares/business.middleware");

// Require auth and business tenancy for all purchase/GRN routes
router.use(authMiddleware);
router.use(businessMiddleware);

const idempotencyMiddleware = require("../middlewares/idempotency.middleware");

/**
 * Phase 7 - Task T44: Goods Received Note (GRN) Routes
 */

// 1. Primary GRN Stock Receipt Endpoint (POST /api/purchases/receive)
router.post("/receive", idempotencyMiddleware("PURCHASE_RECEIVE_GRN"), (req, res, next) => grnController.receiveStock(req, res, next));
router.post("/grn", idempotencyMiddleware("PURCHASE_RECEIVE_GRN"), (req, res, next) => grnController.receiveStock(req, res, next));

// 2. Summary KPIs
router.get("/summary", (req, res, next) => grnController.getSummary(req, res, next));
router.get("/grn/summary", (req, res, next) => grnController.getSummary(req, res, next));

// 3. List GRNs
router.get("/grn", (req, res, next) => grnController.getGrns(req, res, next));
router.get("/receipts", (req, res, next) => grnController.getGrns(req, res, next));

// 4. GRNs by Purchase Order ID
router.get("/grn/po/:purchaseOrderId", (req, res, next) => grnController.getGrnsByPoId(req, res, next));
router.get("/po/:purchaseOrderId/grns", (req, res, next) => grnController.getGrnsByPoId(req, res, next));

// 5. Single GRN by ID
router.get("/grn/:id", (req, res, next) => grnController.getGrnById(req, res, next));

module.exports = router;
