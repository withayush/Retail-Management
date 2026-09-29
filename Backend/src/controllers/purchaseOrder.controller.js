const purchaseOrderService = require("../services/purchaseOrder.service");

/**
 * Phase 7 - Task T42: Purchase Order Controller
 */

// POST /api/purchase-orders
const createPurchaseOrder = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const accountId = req.user?.id || req.user?._id;
    const accountName = req.user?.name || req.user?.email || "Merchant";

    const order = await purchaseOrderService.createPurchaseOrder(
      businessId,
      req.body,
      accountId,
      accountName
    );

    return res.status(201).json({
      success: true,
      message: `Purchase Order ${order.poNumber} created successfully.`,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/purchase-orders
const getPurchaseOrders = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const { supplierId, status, search, startDate, endDate, page, limit } = req.query;

    const result = await purchaseOrderService.getPurchaseOrders(businessId, {
      supplierId,
      status,
      search,
      startDate,
      endDate,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      data: result.orders,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/purchase-orders/summary
const getPOSummary = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const summary = await purchaseOrderService.getPOSummary(businessId);

    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/purchase-orders/:id
const getPurchaseOrderById = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const { id } = req.params;

    const order = await purchaseOrderService.getPurchaseOrderById(businessId, id);

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/purchase-orders/number/:poNumber
const getPurchaseOrderByNumber = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const { poNumber } = req.params;

    const order = await purchaseOrderService.getPurchaseOrderByNumber(businessId, poNumber);

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/purchase-orders/:id
const updatePurchaseOrder = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const { id } = req.params;

    const updatedOrder = await purchaseOrderService.updatePurchaseOrder(businessId, id, req.body);

    return res.status(200).json({
      success: true,
      message: "Purchase Order updated successfully.",
      data: updatedOrder,
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/purchase-orders/:id/status
const updatePOStatus = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const { id } = req.params;

    const updatedOrder = await purchaseOrderService.updatePOStatus(businessId, id, req.body);

    return res.status(200).json({
      success: true,
      message: `Purchase Order status updated to ${updatedOrder.status}.`,
      data: updatedOrder,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/purchase-orders/:id/cancel or DELETE /api/purchase-orders/:id
const cancelPurchaseOrder = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const { id } = req.params;
    const { reason } = req.body || {};

    const cancelledOrder = await purchaseOrderService.cancelPurchaseOrder(businessId, id, reason);

    return res.status(200).json({
      success: true,
      message: `Purchase Order ${cancelledOrder.poNumber} has been cancelled.`,
      data: cancelledOrder,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/purchase-orders/supplier/:supplierId
const getSupplierPurchaseOrders = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const { supplierId } = req.params;
    const { limit } = req.query;

    const orders = await purchaseOrderService.getSupplierPurchaseOrders(businessId, supplierId, limit);

    return res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (err) {
    next(err);
  }
};

// Phase 7 - Task T43: GET /api/purchase-orders/:id/items
const getPurchaseOrderItems = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const { id } = req.params;

    const items = await purchaseOrderService.getPurchaseOrderItems(businessId, id);

    return res.status(200).json({
      success: true,
      data: items,
    });
  } catch (err) {
    next(err);
  }
};

// Phase 7 - Task T43: GET /api/purchase-orders/items/product/:productId
const getProductPurchaseHistory = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const { productId } = req.params;
    const { limit } = req.query;

    const items = await purchaseOrderService.getProductPurchaseHistory(businessId, productId, limit);

    return res.status(200).json({
      success: true,
      data: items,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createPurchaseOrder,
  getPurchaseOrders,
  getPOSummary,
  getPurchaseOrderById,
  getPurchaseOrderByNumber,
  updatePurchaseOrder,
  updatePOStatus,
  cancelPurchaseOrder,
  getSupplierPurchaseOrders,
  getPurchaseOrderItems,
  getProductPurchaseHistory,
};
