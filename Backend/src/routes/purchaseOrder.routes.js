const express = require("express");
const router = express.Router();
const purchaseOrderController = require("../controllers/purchaseOrder.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { businessMiddleware } = require("../middlewares/business.middleware");

const grnController = require("../controllers/grn.controller");

// Protect all Purchase Order endpoints with Authentication and Business Isolation
router.use(authMiddleware);
router.use(businessMiddleware);

const idempotencyMiddleware = require("../middlewares/idempotency.middleware");

// Base Collection Endpoints
router.post("/", idempotencyMiddleware("PURCHASE_ORDER_CREATE"), purchaseOrderController.createPurchaseOrder);
router.get("/", purchaseOrderController.getPurchaseOrders);
router.get("/summary", purchaseOrderController.getPOSummary);
router.get("/number/:poNumber", purchaseOrderController.getPurchaseOrderByNumber);
router.get("/supplier/:supplierId", purchaseOrderController.getSupplierPurchaseOrders);

// Phase 7 - Task T43: Product Purchase History Endpoint
router.get("/items/product/:productId", purchaseOrderController.getProductPurchaseHistory);
router.get("/product/:productId", purchaseOrderController.getProductPurchaseHistory);

// Phase 7 - Task T44: Goods Received Note (GRN) on PO
router.post("/:id/receive", idempotencyMiddleware("PURCHASE_RECEIVE_GRN"), (req, res, next) => {
  req.body.purchaseOrderId = req.params.id;
  return grnController.receiveStock(req, res, next);
});
router.get("/:id/grns", (req, res, next) => {
  req.params.purchaseOrderId = req.params.id;
  return grnController.getGrnsByPoId(req, res, next);
});

// Individual PO Lifecycle Endpoints
router.get("/:id", purchaseOrderController.getPurchaseOrderById);
router.get("/:id/items", purchaseOrderController.getPurchaseOrderItems);
router.put("/:id", purchaseOrderController.updatePurchaseOrder);
router.patch("/:id/status", purchaseOrderController.updatePOStatus);
router.post("/:id/cancel", purchaseOrderController.cancelPurchaseOrder);
router.delete("/:id", purchaseOrderController.cancelPurchaseOrder);

module.exports = router;
