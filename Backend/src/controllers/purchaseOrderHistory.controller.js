const purchaseOrderHistoryRepo = require("../repositories/purchaseOrderHistory.repository");
const { PurchaseOrder } = require("../models/purchaseOrder.model");
const mongoose = require("mongoose");
const { z } = require("zod");

const addManualLogSchema = z.object({
  title: z.string().min(1, "Log title is required").max(200),
  note: z.string().max(1000).optional().default(""),
});

/**
 * Phase 7 - Task T47: Purchase Order Workflow History Controller
 */
class PurchaseOrderHistoryController {
  /**
   * GET /api/purchase-orders/:id/history
   * Get chronological audit history events for a Purchase Order
   */
  async getHistoryByPoId(req, res, next) {
    try {
      const businessId = req.businessId;
      const { id } = req.params;
      const { sortOrder = "asc", eventType } = req.query;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        const err = new Error("Invalid Purchase Order ID format.");
        err.statusCode = 400;
        throw err;
      }

      const events = await purchaseOrderHistoryRepo.getHistoryByPoId(businessId, id, {
        sortOrder,
        eventType,
      });

      return res.status(200).json({
        success: true,
        data: events,
        count: events.length,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/purchase-orders/:id/timeline
   * Get aggregated visual timeline and lead-time KPIs for a Purchase Order
   */
  async getTimelineSummary(req, res, next) {
    try {
      const businessId = req.businessId;
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        const err = new Error("Invalid Purchase Order ID format.");
        err.statusCode = 400;
        throw err;
      }

      const summary = await purchaseOrderHistoryRepo.getTimelineSummary(businessId, id);

      return res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/purchase-orders/suppliers/:supplierId/performance
   * Get supplier delivery performance & lead-time analytics
   */
  async getSupplierPerformance(req, res, next) {
    try {
      const businessId = req.businessId;
      const { supplierId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(supplierId)) {
        const err = new Error("Invalid Supplier ID format.");
        err.statusCode = 400;
        throw err;
      }

      const performance = await purchaseOrderHistoryRepo.getSupplierProcurementPerformance(
        businessId,
        supplierId
      );

      return res.status(200).json({
        success: true,
        data: performance,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/purchase-orders/:id/history/log
   * Append manual operational note to the Purchase Order timeline
   */
  async addManualLog(req, res, next) {
    try {
      const businessId = req.businessId;
      const accountId = req.user ? req.user._id : null;
      const accountName = req.user ? req.user.fullName || req.user.phone || req.user.email : "Merchant";
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        const err = new Error("Invalid Purchase Order ID format.");
        err.statusCode = 400;
        throw err;
      }

      const validated = addManualLogSchema.parse(req.body);

      const po = await PurchaseOrder.findOne({ _id: id, businessId });
      if (!po) {
        const err = new Error("Purchase Order not found");
        err.statusCode = 404;
        throw err;
      }

      const event = await purchaseOrderHistoryRepo.recordEvent({
        businessId,
        purchaseOrderId: po._id,
        poNumber: po.poNumber,
        eventType: "MANUAL_LOG",
        title: validated.title,
        description: validated.note,
        previousStatus: po.status,
        newStatus: po.status,
        details: { note: validated.note },
        performedBy: accountId,
        performedByName: accountName,
      });

      return res.status(201).json({
        success: true,
        message: "Operational note added to Purchase Order timeline.",
        data: event,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PurchaseOrderHistoryController();
