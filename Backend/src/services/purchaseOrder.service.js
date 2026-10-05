const purchaseOrderRepository = require("../repositories/purchaseOrder.repository");
const {
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema,
  updatePurchaseOrderStatusSchema,
} = require("../validations/purchaseOrder.validation");

/**
 * Phase 7 - Task T42: Purchase Order Service
 * Business logic for Purchase Order processing, multi-tenancy, and lifecycle management.
 */
class PurchaseOrderService {
  /**
   * Create a new Purchase Order
   */
  async createPurchaseOrder(businessId, poData, accountId = null, accountName = "") {
    const validatedData = createPurchaseOrderSchema.parse(poData);
    return await purchaseOrderRepository.create(businessId, validatedData, accountId, accountName);
  }

  /**
   * Get single Purchase Order by ID
   */
  async getPurchaseOrderById(businessId, poId) {
    const po = await purchaseOrderRepository.findById(businessId, poId);
    if (!po) {
      const err = new Error("Purchase Order not found");
      err.statusCode = 404;
      throw err;
    }
    return po;
  }

  /**
   * Get single Purchase Order by PO Number
   */
  async getPurchaseOrderByNumber(businessId, poNumber) {
    const po = await purchaseOrderRepository.findByPoNumber(businessId, poNumber);
    if (!po) {
      const err = new Error(`Purchase Order '${poNumber}' not found`);
      err.statusCode = 404;
      throw err;
    }
    return po;
  }

  /**
   * Get paginated list of Purchase Orders
   */
  async getPurchaseOrders(businessId, filters) {
    return await purchaseOrderRepository.findOrders(businessId, filters);
  }

  /**
   * Update Purchase Order
   */
  async updatePurchaseOrder(businessId, poId, updateData, accountId = null, accountName = "") {
    const validatedData = updatePurchaseOrderSchema.parse(updateData);
    return await purchaseOrderRepository.updateById(businessId, poId, validatedData, accountId, accountName);
  }

  /**
   * Update Purchase Order status
   */
  async updatePOStatus(businessId, poId, statusPayload, accountId = null, accountName = "") {
    const { status, notes } = updatePurchaseOrderStatusSchema.parse(statusPayload);
    return await purchaseOrderRepository.updateStatus(businessId, poId, status, notes, accountId, accountName);
  }

  /**
   * Cancel Purchase Order
   */
  async cancelPurchaseOrder(businessId, poId, reason = "", accountId = null, accountName = "") {
    return await purchaseOrderRepository.cancel(businessId, poId, reason, accountId, accountName);
  }

  /**
   * Get Purchase Order KPIs summary
   */
  async getPOSummary(businessId) {
    return await purchaseOrderRepository.getSummary(businessId);
  }

  /**
   * Get all Purchase Orders for a specific supplier
   */
  async getSupplierPurchaseOrders(businessId, supplierId, limit = 50) {
    return await purchaseOrderRepository.getOrdersBySupplier(businessId, supplierId, limit);
  }

  /**
   * Phase 7 - Task T43: Get all PurchaseItem line records for a Purchase Order
   */
  async getPurchaseOrderItems(businessId, poId) {
    const po = await purchaseOrderRepository.findById(businessId, poId);
    if (!po) {
      const err = new Error("Purchase Order not found");
      err.statusCode = 404;
      throw err;
    }
    return await purchaseOrderRepository.findItemsByOrderId(businessId, poId);
  }

  /**
   * Phase 7 - Task T43: Get historical purchase item price snapshots for a product
   */
  async getProductPurchaseHistory(businessId, productId, limit = 50) {
    return await purchaseOrderRepository.findItemsByProductId(businessId, productId, limit);
  }
}

module.exports = new PurchaseOrderService();
