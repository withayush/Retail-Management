const InventoryAlert = require("../models/inventoryAlert.model");
const { Inventory } = require("../models/inventory.model");
const Product = require("../models/product.model");
const Category = require("../models/category.model");
const Account = require("../models/account.model");

/**
 * Phase 3 - Task T22: Low-Stock Limit Notifications & Deterministic Alerts Queue
 * Pure deterministic business rule engine for stock limit threshold monitoring.
 */

/**
 * Deterministic Engine Core: Evaluates stock vs reorder level for a single product.
 * Rule:
 *  - availableStock <= reorderLevel -> Trigger/Update Low Stock Alert (No duplicate spam)
 *  - availableStock > reorderLevel -> Auto-Resolve any active alert
 */
const evaluateAndSyncProductLowStockAlert = async ({
  businessId,
  productId,
  availableStock,
  reorderLevel,
  productName,
}) => {
  const isLowStock = availableStock <= reorderLevel;

  if (isLowStock) {
    const isOutOfStock = availableStock <= 0;
    const severity = isOutOfStock ? "CRITICAL" : "WARNING";
    const alertType = isOutOfStock ? "OUT_OF_STOCK" : "LOW_STOCK";
    const deficitQty = Math.max(0, reorderLevel - availableStock);

    // Resolve name if not provided
    let pName = productName;
    if (!pName) {
      const prod = await Product.findOne({ _id: productId, businessId }).select("name sku");
      pName = prod ? prod.name : "Product";
    }

    const message = isOutOfStock
      ? `Product "${pName}" is completely OUT OF STOCK (0 units left, reorder level: ${reorderLevel}).`
      : `Product "${pName}" is running low on stock (${availableStock} left, reorder level: ${reorderLevel}).`;

    // Deduplication check: Check for existing active (UNREAD or ACKNOWLEDGED) alert
    let activeAlert = await InventoryAlert.findOne({
      businessId,
      productId,
      status: { $in: ["UNREAD", "ACKNOWLEDGED"] },
    });

    if (activeAlert) {
      // Update existing alert parameters without creating duplicate rows
      activeAlert.currentStock = availableStock;
      activeAlert.reorderLevel = reorderLevel;
      activeAlert.deficitQty = deficitQty;
      activeAlert.severity = severity;
      activeAlert.alertType = alertType;
      activeAlert.message = message;
      activeAlert.lastTriggeredAt = new Date();
      await activeAlert.save();
      return activeAlert;
    } else {
      // Create fresh alert in UNREAD state
      const newAlert = await InventoryAlert.create({
        businessId,
        productId,
        alertType,
        severity,
        currentStock: availableStock,
        reorderLevel,
        deficitQty,
        status: "UNREAD",
        message,
        lastTriggeredAt: new Date(),
      });
      return newAlert;
    }
  } else {
    // Stock has recovered above reorderLevel -> Auto-Resolve active alerts
    const activeAlerts = await InventoryAlert.find({
      businessId,
      productId,
      status: { $in: ["UNREAD", "ACKNOWLEDGED"] },
    });

    if (activeAlerts.length > 0) {
      await InventoryAlert.updateMany(
        {
          businessId,
          productId,
          status: { $in: ["UNREAD", "ACKNOWLEDGED"] },
        },
        {
          $set: {
            status: "RESOLVED",
            resolvedAt: new Date(),
            currentStock: availableStock,
            deficitQty: 0,
          },
        }
      );
    }
    return null;
  }
};

/**
 * Multi-tenant query for Alert Queue with filters and pagination
 */
const findAlerts = async (businessId, filters = {}, pagination = { page: 1, limit: 20 }) => {
  const query = { businessId };

  // Status Filter
  if (filters.status) {
    if (filters.status === "ALL_ACTIVE") {
      query.status = { $in: ["UNREAD", "ACKNOWLEDGED"] };
    } else if (filters.status !== "ALL") {
      query.status = filters.status;
    }
  } else {
    query.status = { $in: ["UNREAD", "ACKNOWLEDGED"] }; // Default to active alerts
  }

  // Severity Filter
  if (filters.severity && filters.severity !== "ALL") {
    query.severity = filters.severity;
  }

  // Alert Type Filter
  if (filters.alertType && filters.alertType !== "ALL") {
    query.alertType = filters.alertType;
  }

  // Product Filter
  if (filters.productId) {
    query.productId = filters.productId;
  }

  // Search by Product name / SKU / Message
  if (filters.search && filters.search.trim()) {
    const term = filters.search.trim();
    const matchingProds = await Product.find({
      businessId,
      $or: [
        { name: { $regex: term, $options: "i" } },
        { sku: { $regex: term, $options: "i" } },
      ],
    }).select("_id");

    const matchedProductIds = matchingProds.map((p) => p._id);
    query.$or = [
      { message: { $regex: term, $options: "i" } },
      { productId: { $in: matchedProductIds } },
    ];
  }

  const page = Math.max(1, parseInt(pagination.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(pagination.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const [alerts, total] = await Promise.all([
    InventoryAlert.find(query)
      .populate({
        path: "productId",
        select: "name sku barcode sellingPrice costPrice unit packSize categoryId",
        populate: { path: "categoryId", select: "name" },
      })
      .populate("acknowledgedBy", "fullName email")
      .populate("resolvedBy", "fullName email")
      .sort({ lastTriggeredAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    InventoryAlert.countDocuments(query),
  ]);

  return {
    data: alerts,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

/**
 * Get summary counters for dashboard/header alert chips
 */
const getAlertsSummary = async (businessId) => {
  const [unreadCount, acknowledgedCount, criticalCount, warningCount, resolvedCount] =
    await Promise.all([
      InventoryAlert.countDocuments({ businessId, status: "UNREAD" }),
      InventoryAlert.countDocuments({ businessId, status: "ACKNOWLEDGED" }),
      InventoryAlert.countDocuments({
        businessId,
        status: { $in: ["UNREAD", "ACKNOWLEDGED"] },
        severity: "CRITICAL",
      }),
      InventoryAlert.countDocuments({
        businessId,
        status: { $in: ["UNREAD", "ACKNOWLEDGED"] },
        severity: "WARNING",
      }),
      InventoryAlert.countDocuments({ businessId, status: "RESOLVED" }),
    ]);

  return {
    totalActive: unreadCount + acknowledgedCount,
    unreadCount,
    acknowledgedCount,
    criticalCount,
    warningCount,
    resolvedCount,
  };
};

/**
 * Acknowledge an active alert
 */
const acknowledgeAlert = async (businessId, alertId, accountId = null) => {
  const alert = await InventoryAlert.findOne({ _id: alertId, businessId });
  if (!alert) {
    const error = new Error("Alert not found in this business.");
    error.statusCode = 404;
    error.code = "ALERT_NOT_FOUND";
    throw error;
  }

  alert.status = "ACKNOWLEDGED";
  alert.acknowledgedAt = new Date();
  if (accountId) alert.acknowledgedBy = accountId;
  return await alert.save();
};

/**
 * Manually resolve an alert
 */
const resolveAlert = async (businessId, alertId, accountId = null) => {
  const alert = await InventoryAlert.findOne({ _id: alertId, businessId });
  if (!alert) {
    const error = new Error("Alert not found in this business.");
    error.statusCode = 404;
    error.code = "ALERT_NOT_FOUND";
    throw error;
  }

  alert.status = "RESOLVED";
  alert.resolvedAt = new Date();
  if (accountId) alert.resolvedBy = accountId;
  return await alert.save();
};

/**
 * Store-wide Sweep: Check and sync alerts for all active inventory products in a business
 */
const syncAllInventoryAlerts = async (businessId) => {
  const activeProducts = await Product.find({ businessId, isArchived: false }).select(
    "_id name"
  );
  const productIds = activeProducts.map((p) => p._id);

  const inventories = await Inventory.find({ businessId, productId: { $in: productIds } });
  const invMap = new Map();
  for (const inv of inventories) {
    invMap.set(inv.productId.toString(), inv);
  }

  const results = [];
  for (const prod of activeProducts) {
    const inv = invMap.get(prod._id.toString());
    const availableStock = inv ? inv.availableStock : 0;
    const reorderLevel = inv ? inv.reorderLevel : 5;

    const alert = await evaluateAndSyncProductLowStockAlert({
      businessId,
      productId: prod._id,
      availableStock,
      reorderLevel,
      productName: prod.name,
    });
    if (alert) results.push(alert);
  }

  return {
    scannedProducts: activeProducts.length,
    activeAlertsCount: results.length,
  };
};

module.exports = {
  evaluateAndSyncProductLowStockAlert,
  findAlerts,
  getAlertsSummary,
  acknowledgeAlert,
  resolveAlert,
  syncAllInventoryAlerts,
};
