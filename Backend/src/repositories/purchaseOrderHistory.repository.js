const mongoose = require("mongoose");
const { PurchaseOrderHistory } = require("../models/purchaseOrderHistory.model");
const { PurchaseOrder } = require("../models/purchaseOrder.model");
const { Supplier } = require("../models/supplier.model");

/**
 * Phase 7 - Task T47: Purchase Order Workflow History Repository
 * 
 * Provides append-only event logging, chronological timeline aggregation,
 * cost variance tracking, delayed lead-time calculations, and supplier procurement performance metrics.
 */
class PurchaseOrderHistoryRepository {
  /**
   * Append-only event recorder for Purchase Order lifecycle milestones
   */
  async recordEvent(eventData, session = null) {
    const {
      businessId,
      purchaseOrderId,
      poNumber,
      eventType,
      title,
      description = "",
      previousStatus = null,
      newStatus = null,
      details = {},
      performedBy = null,
      performedByName = "",
    } = eventData;

    if (!businessId || !purchaseOrderId || !poNumber || !eventType || !title) {
      throw new Error("Missing required fields for purchase order history event recording.");
    }

    const bId = typeof businessId === "string" ? new mongoose.Types.ObjectId(businessId) : businessId;
    const poId = typeof purchaseOrderId === "string" ? new mongoose.Types.ObjectId(purchaseOrderId) : purchaseOrderId;

    const historyDoc = new PurchaseOrderHistory({
      businessId: bId,
      purchaseOrderId: poId,
      poNumber: poNumber.trim().toUpperCase(),
      eventType,
      title: title.trim(),
      description: description.trim(),
      previousStatus,
      newStatus,
      details,
      performedBy: performedBy && mongoose.Types.ObjectId.isValid(performedBy) ? new mongoose.Types.ObjectId(performedBy) : null,
      performedByName: (performedByName || "").trim(),
    });

    const sessionOpt = session ? { session } : {};
    return await historyDoc.save(sessionOpt);
  }

  /**
   * Get chronological history events for a specific Purchase Order
   */
  async getHistoryByPoId(businessId, purchaseOrderId, options = {}) {
    const bId = typeof businessId === "string" ? new mongoose.Types.ObjectId(businessId) : businessId;
    const poId = typeof purchaseOrderId === "string" ? new mongoose.Types.ObjectId(purchaseOrderId) : purchaseOrderId;
    const { sortOrder = "asc", eventType } = options;

    const filter = {
      businessId: bId,
      purchaseOrderId: poId,
    };

    if (eventType && eventType !== "ALL") {
      filter.eventType = eventType;
    }

    const sortDirection = sortOrder === "desc" ? -1 : 1;

    return await PurchaseOrderHistory.find(filter)
      .sort({ createdAt: sortDirection })
      .lean();
  }

  /**
   * Get full audit timeline and lead-time analytics for a Purchase Order
   */
  async getTimelineSummary(businessId, purchaseOrderId) {
    const bId = typeof businessId === "string" ? new mongoose.Types.ObjectId(businessId) : businessId;
    const poId = typeof purchaseOrderId === "string" ? new mongoose.Types.ObjectId(purchaseOrderId) : purchaseOrderId;

    const [po, events] = await Promise.all([
      PurchaseOrder.findOne({ _id: poId, businessId: bId })
        .populate("supplierId", "company contactName phone email gstin")
        .lean(),
      this.getHistoryByPoId(bId, poId, { sortOrder: "asc" }),
    ]);

    if (!po) {
      const err = new Error("Purchase Order not found");
      err.statusCode = 404;
      err.code = "PURCHASE_ORDER_NOT_FOUND";
      throw err;
    }

    // Calculate Lead Time & Delay Metrics
    const orderDate = new Date(po.orderDate || po.createdAt);
    const expectedDelivery = po.expectedDelivery ? new Date(po.expectedDelivery) : null;

    // Find receipt events
    const receiptEvents = events.filter(
      (e) => e.eventType === "GRN_CREATED" || e.eventType === "PARTIAL_RECEIPT" || e.eventType === "FULL_RECEIPT"
    );

    const firstReceiptEvent = receiptEvents.length > 0 ? receiptEvents[0] : null;
    const lastReceiptEvent = receiptEvents.length > 0 ? receiptEvents[receiptEvents.length - 1] : null;

    const firstDeliveryDate = firstReceiptEvent ? new Date(firstReceiptEvent.createdAt) : null;
    const finalDeliveryDate = po.status === "RECEIVED" && lastReceiptEvent ? new Date(lastReceiptEvent.createdAt) : null;

    // Lead time in days
    const completionOrCurrentDate = finalDeliveryDate || new Date();
    const totalLeadTimeDays = Math.max(
      0,
      Math.round((completionOrCurrentDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24))
    );

    // Delay calculation against expected delivery
    let delayDays = 0;
    let deliveryStatus = "PENDING";

    if (expectedDelivery) {
      const compareDate = finalDeliveryDate || firstDeliveryDate || (po.status === "RECEIVED" ? new Date(po.updatedAt) : new Date());
      const diffMs = compareDate.getTime() - expectedDelivery.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (po.status === "RECEIVED" || receiptEvents.length > 0) {
        if (diffDays > 0) {
          delayDays = diffDays;
          deliveryStatus = "DELAYED";
        } else if (diffDays < 0) {
          deliveryStatus = "EARLY";
        } else {
          deliveryStatus = "ON_TIME";
        }
      } else {
        // Pending order: check if already overdue
        if (new Date() > expectedDelivery) {
          delayDays = Math.ceil((new Date().getTime() - expectedDelivery.getTime()) / (1000 * 60 * 60 * 24));
          deliveryStatus = "OVERDUE";
        } else {
          deliveryStatus = "ON_SCHEDULE";
        }
      }
    }

    // Cost variance tracking (Extract all COST_CHANGED events)
    const costChangeEvents = events.filter((e) => e.eventType === "COST_CHANGED");
    const costChanges = costChangeEvents.map((e) => ({
      timestamp: e.createdAt,
      costBefore: e.details?.costBefore ?? null,
      costAfter: e.details?.costAfter ?? null,
      diffAmount: e.details?.diffAmount ?? 0,
      reason: e.details?.reason || e.description || "",
      performedByName: e.performedByName || "System",
    }));

    // Calculate total received value across all GRN events
    const totalCostReceived = receiptEvents.reduce(
      (sum, e) => sum + (Number(e.details?.totalCostReceived) || 0),
      0
    );

    const totalItemsReceived = receiptEvents.reduce(
      (sum, e) => sum + (Number(e.details?.totalItemsReceived) || 0),
      0
    );

    return {
      purchaseOrder: {
        _id: po._id,
        poNumber: po.poNumber,
        status: po.status,
        supplierCompany: po.supplierCompany || po.supplierId?.company || "",
        supplierContact: po.supplierContact || po.supplierId?.contactName || "",
        supplierPhone: po.supplierPhone || po.supplierId?.phone || "",
        orderDate,
        expectedDelivery,
        costTotal: po.costTotal,
        totalQuantity: po.totalQuantity,
        itemsCount: po.itemsCount,
        notes: po.notes,
        createdAt: po.createdAt,
        updatedAt: po.updatedAt,
      },
      analytics: {
        totalLeadTimeDays,
        delayDays,
        deliveryStatus,
        expectedDeliveryDate: expectedDelivery,
        firstDeliveryDate,
        finalDeliveryDate,
        totalCostOrdered: po.costTotal,
        totalCostReceived: Number(totalCostReceived.toFixed(2)),
        totalItemsOrdered: po.totalQuantity,
        totalItemsReceived,
        totalGrnsCount: receiptEvents.length,
        hasCostModifications: costChanges.length > 0,
        costChanges,
      },
      events,
      totalEventsCount: events.length,
    };
  }

  /**
   * Aggregates raw supplier performance metrics across all PO histories for a specific vendor
   */
  async getSupplierProcurementPerformance(businessId, supplierId) {
    const bId = typeof businessId === "string" ? new mongoose.Types.ObjectId(businessId) : businessId;
    const sId = typeof supplierId === "string" ? new mongoose.Types.ObjectId(supplierId) : supplierId;

    const supplier = await Supplier.findOne({ _id: sId, businessId: bId }).lean();
    if (!supplier) {
      const err = new Error("Supplier not found for this business");
      err.statusCode = 404;
      err.code = "SUPPLIER_NOT_FOUND";
      throw err;
    }

    const purchaseOrders = await PurchaseOrder.find({ businessId: bId, supplierId: sId }).lean();

    if (purchaseOrders.length === 0) {
      return {
        supplier: {
          _id: supplier._id,
          company: supplier.company,
          phone: supplier.phone,
        },
        metrics: {
          totalOrdersPlaced: 0,
          completedOrdersCount: 0,
          pendingOrdersCount: 0,
          cancelledOrdersCount: 0,
          onTimeDeliveriesCount: 0,
          delayedDeliveriesCount: 0,
          onTimeDeliveryRate: 100,
          averageDelayDays: 0,
          averageLeadTimeDays: 0,
          totalProcurementValue: 0,
        },
      };
    }

    const poIds = purchaseOrders.map((p) => p._id);
    const allEvents = await PurchaseOrderHistory.find({
      businessId: bId,
      purchaseOrderId: { $in: poIds },
    }).lean();

    // Group events by PO ID
    const eventsByPo = new Map();
    allEvents.forEach((ev) => {
      const key = ev.purchaseOrderId.toString();
      if (!eventsByPo.has(key)) eventsByPo.set(key, []);
      eventsByPo.get(key).push(ev);
    });

    let completedOrders = 0;
    let pendingOrders = 0;
    let cancelledOrders = 0;
    let onTimeCount = 0;
    let delayedCount = 0;
    let totalDelayDays = 0;
    let totalLeadTimeDays = 0;
    let evaluatedLeadTimeOrders = 0;
    let totalProcurementValue = 0;

    purchaseOrders.forEach((po) => {
      totalProcurementValue += po.costTotal || 0;

      if (po.status === "RECEIVED") completedOrders++;
      else if (po.status === "CANCELLED") cancelledOrders++;
      else pendingOrders++;

      const poEvents = eventsByPo.get(po._id.toString()) || [];
      const receiptEvents = poEvents.filter(
        (e) => e.eventType === "GRN_CREATED" || e.eventType === "PARTIAL_RECEIPT" || e.eventType === "FULL_RECEIPT"
      );

      if (receiptEvents.length > 0 && po.expectedDelivery) {
        const expected = new Date(po.expectedDelivery);
        const lastReceipt = receiptEvents[receiptEvents.length - 1];
        const actual = new Date(lastReceipt.createdAt);

        const diffDays = Math.ceil((actual.getTime() - expected.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 0) {
          delayedCount++;
          totalDelayDays += diffDays;
        } else {
          onTimeCount++;
        }
      }

      // Lead time calculation
      if (receiptEvents.length > 0) {
        const orderDate = new Date(po.orderDate || po.createdAt);
        const firstReceipt = receiptEvents[0];
        const leadDays = Math.max(
          0,
          Math.round((new Date(firstReceipt.createdAt).getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24))
        );
        totalLeadTimeDays += leadDays;
        evaluatedLeadTimeOrders++;
      }
    });

    const evaluatedDeliveries = onTimeCount + delayedCount;
    const onTimeDeliveryRate =
      evaluatedDeliveries > 0 ? Number(((onTimeCount / evaluatedDeliveries) * 100).toFixed(1)) : 100;
    const averageDelayDays =
      delayedCount > 0 ? Number((totalDelayDays / delayedCount).toFixed(1)) : 0;
    const averageLeadTimeDays =
      evaluatedLeadTimeOrders > 0 ? Number((totalLeadTimeDays / evaluatedLeadTimeOrders).toFixed(1)) : 0;

    return {
      supplier: {
        _id: supplier._id,
        company: supplier.company,
        phone: supplier.phone,
        currentBalance: supplier.currentBalance,
        totalPurchases: supplier.totalPurchases,
      },
      metrics: {
        totalOrdersPlaced: purchaseOrders.length,
        completedOrdersCount: completedOrders,
        pendingOrdersCount: pendingOrders,
        cancelledOrdersCount: cancelledOrders,
        onTimeDeliveriesCount: onTimeCount,
        delayedDeliveriesCount: delayedCount,
        onTimeDeliveryRate,
        averageDelayDays,
        averageLeadTimeDays,
        totalProcurementValue: Number(totalProcurementValue.toFixed(2)),
      },
    };
  }
}

module.exports = new PurchaseOrderHistoryRepository();
