const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const { businessMiddleware } = require("../middlewares/business.middleware");
const validate = require("../middlewares/validate.middleware");
const {
  createSaleSchema,
  updatePaymentStatusSchema,
} = require("../validations/sale.validation");
const {
  createSale,
  getSales,
  getSalesSummary,
  getSaleById,
  getSaleItems,
  getGrossProfitReport,
  getNextInvoiceNumber,
  updatePaymentStatus,
  generateInvoicePdf,
  downloadInvoicePdf,
  previewInvoicePdf,
} = require("../controllers/sale.controller");

const router = express.Router();

// All sales routes require authentication + T6 Business Context (req.businessId)
router.use(authMiddleware);
router.use(businessMiddleware);

const idempotencyMiddleware = require("../middlewares/idempotency.middleware");

// ============================================
// SALE TRANSACTION & INVOICING ENDPOINTS (PHASE 4 - TASKS T23, T24 & T25)
// ============================================
router.post("/", idempotencyMiddleware("SALE_CREATE"), validate(createSaleSchema), createSale);
router.get("/", getSales);
router.get("/summary", getSalesSummary);
router.get("/next-invoice-number", getNextInvoiceNumber);
router.get("/analytics/gross-profit", getGrossProfitReport);
router.get("/:id", getSaleById);
router.get("/:id/items", getSaleItems);
router.put("/:id/payment-status", validate(updatePaymentStatusSchema), updatePaymentStatus);

// ============================================
// INVOICE PDF GENERATION ENGINE (PHASE 4 - TASK T27)
// ============================================
router.post("/:id/generate-pdf", generateInvoicePdf);
router.get("/:id/pdf", generateInvoicePdf);
router.get("/:id/download-pdf", downloadInvoicePdf);
router.get("/:id/preview-pdf", previewInvoicePdf);

const {
  recordPayment,
  getPaymentsByInvoice,
} = require("../controllers/payment.controller");

// ============================================
// PAYMENT RECORDING ENTITY (PHASE 4 - TASK T28)
// ============================================
router.get("/:id/payments", getPaymentsByInvoice);
router.post("/:id/payments", idempotencyMiddleware("PAYMENT_CREATE"), recordPayment);

module.exports = router;


