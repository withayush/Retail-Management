const mongoose = require("mongoose");
const GoodsReceivedNote = require("../models/grn.model");
const PurchaseOrder = require("../models/purchaseOrder.model");
const Supplier = require("../models/supplier.model");
const counterRepo = require("./counter.repository");

/**
 * Phase 7 - Task T44: Goods Received Note (GRN) Repository
 * Data access and query layer for physical stock receipts.
 */
class GRNRepository {
  /**
   * Generates the next atomic, collision-free sequential GRN number (e.g. GRN-1001, GRN-1002)
   */
  async generateNextGrnNumber(businessId, session = null) {
    return await counterRepo.getNextSequence(businessId, "GRN", {
      prefix: "GRN",
      defaultStart: 1000,
      session,
    });
  }

  /**
   * Create and persist a new Goods Received Note
   */
  async createGrn(grnDoc, session = null) {
    const sessionOpt = session ? { session } : {};
    const [newGrn] = await GoodsReceivedNote.create([grnDoc], sessionOpt);
    return newGrn;
  }

  /**
   * Find single GRN by ID with populated PO, Supplier, and Product references
   */
  async findById(businessId, grnId) {
    const bId = typeof businessId === "string" ? new mongoose.Types.ObjectId(businessId) : businessId;
    const gId = typeof grnId === "string" ? new mongoose.Types.ObjectId(grnId) : grnId;

    return await GoodsReceivedNote.findOne({ _id: gId, businessId: bId })
      .populate("purchaseOrderId", "poNumber orderDate expectedDelivery status costTotal itemsCount totalQuantity")
      .populate("supplierId", "company contactName phone email address gstin currentBalance")
      .populate("items.productId", "name sku barcode category sellingPrice costPrice unit stock")
      .lean();
  }

  /**
   * Find GRN by GRN Number
   */
  async findByGrnNumber(businessId, grnNumber) {
    const bId = typeof businessId === "string" ? new mongoose.Types.ObjectId(businessId) : businessId;
    return await GoodsReceivedNote.findOne({ businessId: bId, grnNumber: grnNumber.trim().toUpperCase() })
      .populate("purchaseOrderId", "poNumber orderDate status costTotal")
      .populate("supplierId", "company contactName phone gstin")
      .lean();
  }

  /**
   * Find paginated list of GRNs with multi-field search and filters
   */
  async findGrns(businessId, { purchaseOrderId, supplierId, status, search, startDate, endDate, page = 1, limit = 20 }) {
    const bId = typeof businessId === "string" ? new mongoose.Types.ObjectId(businessId) : businessId;
    const query = { businessId: bId };

    if (purchaseOrderId && mongoose.Types.ObjectId.isValid(purchaseOrderId)) {
      query.purchaseOrderId = new mongoose.Types.ObjectId(purchaseOrderId);
    }

    if (supplierId && mongoose.Types.ObjectId.isValid(supplierId)) {
      query.supplierId = new mongoose.Types.ObjectId(supplierId);
    }

    if (status && status !== "ALL") {
      query.status = status.toUpperCase();
    }

    if (search && search.trim()) {
      const term = search.trim();
      const regex = new RegExp(term, "i");
      query.$or = [
        { grnNumber: regex },
        { poNumber: regex },
        { supplierCompany: regex },
        { deliveryChallanNumber: regex },
        { invoiceNumber: regex },
        { "items.name": regex },
        { "items.sku": regex },
      ];
    }

    if (startDate || endDate) {
      query.receivedDate = {};
      if (startDate) query.receivedDate.$gte = new Date(startDate);
      if (endDate) query.receivedDate.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const parsedLimit = Number(limit);

    const [grns, total] = await Promise.all([
      GoodsReceivedNote.find(query)
        .sort({ receivedDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .populate("supplierId", "company contactName phone gstin")
        .populate("purchaseOrderId", "poNumber status costTotal")
        .lean(),
      GoodsReceivedNote.countDocuments(query),
    ]);

    return {
      grns,
      pagination: {
        total,
        page: Number(page),
        limit: parsedLimit,
        pages: Math.ceil(total / parsedLimit) || 1,
      },
    };
  }

  /**
   * Find all GRNs associated with a specific Purchase Order
   */
  async findGrnsByPoId(businessId, purchaseOrderId) {
    const bId = typeof businessId === "string" ? new mongoose.Types.ObjectId(businessId) : businessId;
    const poId = typeof purchaseOrderId === "string" ? new mongoose.Types.ObjectId(purchaseOrderId) : purchaseOrderId;

    return await GoodsReceivedNote.find({ businessId: bId, purchaseOrderId: poId })
      .sort({ receivedDate: -1, createdAt: -1 })
      .populate("receivedBy", "fullName email")
      .lean();
  }

  /**
   * Summary KPIs for Goods Received Notes
   */
  async getSummary(businessId) {
    const bId = typeof businessId === "string" ? new mongoose.Types.ObjectId(businessId) : businessId;

    const summary = await GoodsReceivedNote.aggregate([
      { $match: { businessId: bId, status: "COMPLETED" } },
      {
        $group: {
          _id: null,
          totalGrns: { $sum: 1 },
          totalItemsReceived: { $sum: "$totalItemsReceived" },
          totalCostReceived: { $sum: "$totalCostReceived" },
        },
      },
    ]);

    if (!summary || summary.length === 0) {
      return {
        totalGrns: 0,
        totalItemsReceived: 0,
        totalCostReceived: 0,
      };
    }

    const res = summary[0];
    delete res._id;
    return res;
  }
}

module.exports = new GRNRepository();
