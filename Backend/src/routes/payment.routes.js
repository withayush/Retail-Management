const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const { businessMiddleware } = require("../middlewares/business.middleware");
const validate = require("../middlewares/validate.middleware");
const {
  recordPaymentSchema,
  getPaymentsFilterSchema,
} = require("../validations/payment.validation");
const {
  recordPayment,
  getPayments,
  getPaymentsByInvoice,
  getPaymentSummary,
} = require("../controllers/payment.controller");

const router = express.Router();

// All payment routes require authentication + T6 Business Context (req.businessId)
router.use(authMiddleware);
router.use(businessMiddleware);

// ============================================
// PAYMENT RECORDING ENDPOINTS (PHASE 4 - TASK T28)
// ============================================
router.post("/", validate(recordPaymentSchema), recordPayment);
router.get("/", validate(getPaymentsFilterSchema, "query"), getPayments);
router.get("/summary", getPaymentSummary);
router.get("/invoice/:invoiceId", getPaymentsByInvoice);

module.exports = router;
