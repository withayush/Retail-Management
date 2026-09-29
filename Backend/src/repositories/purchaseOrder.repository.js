const mongoose = require("mongoose");
const { PurchaseOrder } = require("../models/purchaseOrder.model");
const { PurchaseItem } = require("../models/purchaseItem.model");
const { Supplier } = require("../models/supplier.model");
const { Product } = require("../models/product.model");

/**
 * Phase 7 - Tasks T42 & T43: Purchase Order & Purchase Item Repository
 * High-performance database query and aggregation layer for Purchase Orders and line items.
 */
class PurchaseOrderRepository {
  /**
   * Generates the next sequential human-readable PO number for a business (e.g. PO-1001, PO-1002)
   */
  async generateNextPoNumber(businessId) {
    const bId = typeof businessId === "string" ? new mongoose.Types.ObjectId(businessId) : businessId;
    
    // Find the latest created PO for this business
    const latestPO = await PurchaseOrder.findOne({ businessId: bId })
      .sort({ createdAt: -1 })
      .select("poNumber")
      .lean();

    if (!latestPO || !latestPO.poNumber) {
      return "PO-1001";
    }

    // Match numeric suffix: PO-1001 -> 1001
    const match = latestPO.poNumber.match(/PO-(\d+)/i);
    if (match && match[1]) {
      const nextNum = parseInt(match[1], 10) + 1;
      return `PO-${nextNum}`;
    }

    // Fallback timestamp code
    const count = await PurchaseOrder.countDocuments({ businessId: bId });
    return `PO-${1000 + count + 1}`;
  }

  /**
   * Create a new Purchase Order along with individual PurchaseItem records (T42 & T43)
   */
  async create(businessId, poData, accountId = null, accountName = "") {
    const bId = typeof businessId === "string" ? new mongoose.Types.ObjectId(businessId) : businessId;
    const suppId = typeof poData.supplierId === "string" ? new mongoose.Types.ObjectId(poData.supplierId) : poData.supplierId;

    // Fetch supplier master to snapshot company and contact details
    const supplier = await Supplier.findOne({ _id: suppId, businessId: bId }).lean();
    if (!supplier) {
      const err = new Error("Supplier not found or does not belong to this business");
      err.statusCode = 404;
      throw err;
    }

    let poNumber = poData.poNumber ? poData.poNumber.trim().toUpperCase() : null;
    if (!poNumber) {
      poNumber = await this.generateNextPoNumber(bId);
    } else {
      // Check for duplicate poNumber within business
      const exists = await PurchaseOrder.findOne({ businessId: bId, poNumber }).lean();
      if (exists) {
        const err = new Error(`Purchase Order number '${poNumber}' already exists for this business`);
        err.statusCode = 409;
        throw err;
      }
    }

    // Deduplicate and merge lines if identical productId is provided in the same PO
    const rawItems = poData.items || [];
    const mergedMap = new Map();

    for (const rawItem of rawItems) {
      let productId = null;
      let name = (rawItem.name || "").trim();
      let sku = (rawItem.sku || "").trim().toUpperCase();

      if (rawItem.productId && mongoose.Types.ObjectId.isValid(rawItem.productId)) {
        const pr = await Product.findOne({ _id: rawItem.productId, businessId: bId }).lean();
        if (pr) {
          productId = pr._id;
          if (!name) name = pr.name;
          if (!sku) sku = pr.sku || "";
        }
      }

      const key = productId ? productId.toString() : `name_${name.toLowerCase()}`;
      const qty = Number(rawItem.quantity || rawItem.qty) || 1;
      const unitCost = Number(rawItem.unitCost || rawItem.costPrice) || 0;

      if (mergedMap.has(key)) {
        const existing = mergedMap.get(key);
        existing.quantity += qty;
        // Keep latest unit cost or negotiated price
        existing.unitCost = unitCost;
        existing.totalCost = Number((existing.quantity * existing.unitCost).toFixed(2));
      } else {
        mergedMap.set(key, {
          productId,
          name: name || "Ordered Product",
          sku,
          quantity: qty,
          unit: rawItem.unit || "pcs",
          unitCost,
          totalCost: Number((qty * unitCost).toFixed(2)),
          receivedQuantity: Number(rawItem.receivedQuantity || rawItem.receivedQty) || 0,
          notes: (rawItem.notes || "").trim(),
        });
      }
    }

    const items = Array.from(mergedMap.values());
    const costTotal = items.reduce((acc, curr) => acc + curr.totalCost, 0);
    const totalQuantity = items.reduce((acc, curr) => acc + curr.quantity, 0);

    const newPO = new PurchaseOrder({
      businessId: bId,
      poNumber,
      supplierId: suppId,
      supplierCompany: supplier.company || "",
      supplierContact: supplier.contactName || "",
      supplierPhone: supplier.phone || "",
      orderDate: poData.orderDate ? new Date(poData.orderDate) : new Date(),
      expectedDelivery: poData.expectedDelivery ? new Date(poData.expectedDelivery) : null,
      status: poData.status || "PENDING",
      costTotal: Number(costTotal.toFixed(2)),
      itemsCount: items.length,
      totalQuantity,
      items,
      notes: (poData.notes || "").trim(),
      shippingAddress: (poData.shippingAddress || supplier.address || "").trim(),
      paymentTerms: (poData.paymentTerms || "").trim(),
      createdBy: accountId ? new mongoose.Types.ObjectId(accountId) : null,
      createdByName: accountName || "",
    });

    const savedPO = await newPO.save();

    // Persist individual PurchaseItem documents (Task T43)
    if (items.length > 0) {
      const purchaseItemDocs = items.map((item) => ({
        businessId: bId,
        purchaseOrderId: savedPO._id,
        productId: item.productId,
        name: item.name,
        sku: item.sku,
        unit: item.unit,
        costPrice: item.unitCost,
        qty: item.quantity,
        totalCost: item.totalCost,
        receivedQty: item.receivedQuantity || 0,
        notes: item.notes || "",
      }));

      await PurchaseItem.insertMany(purchaseItemDocs);
    }

    return savedPO;
  }

  /**
   * Find single Purchase Order by ID
   */
  async findById(businessId, poId) {
    const bId = typeof businessId === "string" ? new mongoose.Types.ObjectId(businessId) : businessId;
    const pId = typeof poId === "string" ? new mongoose.Types.ObjectId(poId) : poId;

    return await PurchaseOrder.findOne({ _id: pId, businessId: bId })
      .populate("supplierId", "company contactName phone email address gstin currentBalance")
      .populate("items.productId", "name sku barcode category sellingPrice costPrice stock")
      .lean();
  }

  /**
   * Find Purchase Order by PO Number
   */
  async findByPoNumber(businessId, poNumber) {
    const bId = typeof businessId === "string" ? new mongoose.Types.ObjectId(businessId) : businessId;
    return await PurchaseOrder.findOne({ businessId: bId, poNumber: poNumber.trim().toUpperCase() })
      .populate("supplierId", "company contactName phone email address gstin currentBalance")
      .lean();
  }

  /**
   * Find paginated list of Purchase Orders with multi-filter capability
   */
  async findOrders(businessId, { supplierId, status, search, startDate, endDate, page = 1, limit = 20 }) {
    const bId = typeof businessId === "string" ? new mongoose.Types.ObjectId(businessId) : businessId;
    const query = { businessId: bId };

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
        { poNumber: regex },
        { supplierCompany: regex },
        { supplierContact: regex },
        { supplierPhone: regex },
        { "items.name": regex },
        { "items.sku": regex },
      ];
    }

    if (startDate || endDate) {
      query.orderDate = {};
      if (startDate) query.orderDate.$gte = new Date(startDate);
      if (endDate) query.orderDate.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const parsedLimit = Number(limit);

    const [orders, total] = await Promise.all([
      PurchaseOrder.find(query)
        .sort({ orderDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .populate("supplierId", "company contactName phone gstin")
        .lean(),
      PurchaseOrder.countDocuments(query),
    ]);

    return {
      orders,
      pagination: {
        total,
        page: Number(page),
        limit: parsedLimit,
        pages: Math.ceil(total / parsedLimit) || 1,
      },
    };
  }

  /**
   * Update Purchase Order fields and synchronize PurchaseItem records
   */
  async updateById(businessId, poId, updateData) {
    const bId = typeof businessId === "string" ? new mongoose.Types.ObjectId(businessId) : businessId;
    const pId = typeof poId === "string" ? new mongoose.Types.ObjectId(poId) : poId;

    const po = await PurchaseOrder.findOne({ _id: pId, businessId: bId });
    if (!po) {
      const err = new Error("Purchase Order not found");
      err.statusCode = 404;
      throw err;
    }

    if (po.status === "RECEIVED") {
      const err = new Error("Cannot edit a Purchase Order that has already been fully received");
      err.statusCode = 400;
      throw err;
    }

    if (updateData.supplierId && updateData.supplierId.toString() !== po.supplierId.toString()) {
      const supplier = await Supplier.findOne({ _id: updateData.supplierId, businessId: bId }).lean();
      if (!supplier) {
        const err = new Error("Updated supplier not found for this business");
        err.statusCode = 404;
        throw err;
      }
      po.supplierId = supplier._id;
      po.supplierCompany = supplier.company;
      po.supplierContact = supplier.contactName;
      po.supplierPhone = supplier.phone;
    }

    if (updateData.orderDate) po.orderDate = new Date(updateData.orderDate);
    if (updateData.expectedDelivery !== undefined) {
      po.expectedDelivery = updateData.expectedDelivery ? new Date(updateData.expectedDelivery) : null;
    }
    if (updateData.status) po.status = updateData.status;
    if (updateData.notes !== undefined) po.notes = updateData.notes;
    if (updateData.shippingAddress !== undefined) po.shippingAddress = updateData.shippingAddress;
    if (updateData.paymentTerms !== undefined) po.paymentTerms = updateData.paymentTerms;

    if (updateData.items && Array.isArray(updateData.items)) {
      po.items = updateData.items.map((item) => {
        const qty = Number(item.quantity || item.qty) || 1;
        const unitCost = Number(item.unitCost || item.costPrice) || 0;
        return {
          productId: item.productId && mongoose.Types.ObjectId.isValid(item.productId) 
            ? new mongoose.Types.ObjectId(item.productId) 
            : null,
          name: item.name.trim(),
          sku: (item.sku || "").trim().toUpperCase(),
          quantity: qty,
          unit: item.unit || "pcs",
          unitCost: unitCost,
          totalCost: Number((qty * unitCost).toFixed(2)),
          receivedQuantity: Number(item.receivedQuantity || item.receivedQty) || 0,
          notes: (item.notes || "").trim(),
        };
      });

      // Synchronize PurchaseItem collection (T43)
      await PurchaseItem.deleteMany({ businessId: bId, purchaseOrderId: pId });
      const purchaseItemDocs = po.items.map((item) => ({
        businessId: bId,
        purchaseOrderId: pId,
        productId: item.productId,
        name: item.name,
        sku: item.sku,
        unit: item.unit,
        costPrice: item.unitCost,
        qty: item.quantity,
        totalCost: item.totalCost,
        receivedQty: item.receivedQuantity || 0,
        notes: item.notes || "",
      }));
      await PurchaseItem.insertMany(purchaseItemDocs);
    }

    return await po.save();
  }

  /**
   * Update Purchase Order status
   */
  async updateStatus(businessId, poId, status, notes = "") {
    const bId = typeof businessId === "string" ? new mongoose.Types.ObjectId(businessId) : businessId;
    const pId = typeof poId === "string" ? new mongoose.Types.ObjectId(poId) : poId;

    const po = await PurchaseOrder.findOne({ _id: pId, businessId: bId });
    if (!po) {
      const err = new Error("Purchase Order not found");
      err.statusCode = 404;
      throw err;
    }

    po.status = status;
    if (notes) {
      po.notes = po.notes ? `${po.notes}\n[Status Change to ${status}]: ${notes}` : `[Status Change to ${status}]: ${notes}`;
    }

    return await po.save();
  }

  /**
   * Cancel a Purchase Order
   */
  async cancel(businessId, poId, reason = "") {
    return await this.updateStatus(businessId, poId, "CANCELLED", reason || "Order cancelled by merchant");
  }

  /**
   * Get store-wide Purchase Order KPIs and summary
   */
  async getSummary(businessId) {
    const bId = typeof businessId === "string" ? new mongoose.Types.ObjectId(businessId) : businessId;

    const summary = await PurchaseOrder.aggregate([
      { $match: { businessId: bId } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          draftCount: {
            $sum: { $cond: [{ $eq: ["$status", "DRAFT"] }, 1, 0] },
          },
          pendingCount: {
            $sum: { $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0] },
          },
          partialCount: {
            $sum: { $cond: [{ $eq: ["$status", "PARTIAL"] }, 1, 0] },
          },
          receivedCount: {
            $sum: { $cond: [{ $eq: ["$status", "RECEIVED"] }, 1, 0] },
          },
          cancelledCount: {
            $sum: { $cond: [{ $eq: ["$status", "CANCELLED"] }, 1, 0] },
          },
          totalCostValue: { $sum: "$costTotal" },
          pendingCostValue: {
            $sum: {
              $cond: [{ $in: ["$status", ["PENDING", "PARTIAL", "DRAFT"]] }, "$costTotal", 0],
            },
          },
        },
      },
    ]);

    if (!summary || summary.length === 0) {
      return {
        totalOrders: 0,
        draftCount: 0,
        pendingCount: 0,
        partialCount: 0,
        receivedCount: 0,
        cancelledCount: 0,
        totalCostValue: 0,
        pendingCostValue: 0,
      };
    }

    const res = summary[0];
    delete res._id;
    return res;
  }

  /**
   * Get all orders for a specific supplier
   */
  async getOrdersBySupplier(businessId, supplierId, limit = 50) {
    const bId = typeof businessId === "string" ? new mongoose.Types.ObjectId(businessId) : businessId;
    const sId = typeof supplierId === "string" ? new mongoose.Types.ObjectId(supplierId) : supplierId;

    return await PurchaseOrder.find({ businessId: bId, supplierId: sId })
      .sort({ orderDate: -1, createdAt: -1 })
      .limit(Number(limit))
      .lean();
  }

  /**
   * Phase 7 - Task T43: Find individual PurchaseItem records for a Purchase Order
   */
  async findItemsByOrderId(businessId, poId) {
    const bId = typeof businessId === "string" ? new mongoose.Types.ObjectId(businessId) : businessId;
    const pId = typeof poId === "string" ? new mongoose.Types.ObjectId(poId) : poId;

    return await PurchaseItem.find({ businessId: bId, purchaseOrderId: pId })
      .populate("productId", "name sku barcode category sellingPrice costPrice stock")
      .sort({ createdAt: 1 })
      .lean();
  }

  /**
   * Phase 7 - Task T43: Get historical negotiated purchase costs for a product
   */
  async findItemsByProductId(businessId, productId, limit = 50) {
    const bId = typeof businessId === "string" ? new mongoose.Types.ObjectId(businessId) : businessId;
    const prId = typeof productId === "string" ? new mongoose.Types.ObjectId(productId) : productId;

    return await PurchaseItem.find({ businessId: bId, productId: prId })
      .populate("purchaseOrderId", "poNumber supplierCompany orderDate status")
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();
  }
}

module.exports = new PurchaseOrderRepository();
