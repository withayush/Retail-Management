const { Inventory, InventoryLedger } = require("../models/inventory.model");
const Product = require("../models/product.model");
const Category = require("../models/category.model");
const Invoice = require("../models/invoice.model");
const Account = require("../models/account.model");

/**
 * Inventory Repository Layer
 * Strictly business-scoped queries for Inventory Master Schema and store state.
 */

const getOrCreateInventory = async (
  businessId,
  productId,
  defaultStock = 0,
  defaultReorderLevel = 5,
  session = null
) => {
  const sessionOpt = session ? { session } : {};
  let inventory = await Inventory.findOne({ businessId, productId }).session(session);

  if (!inventory) {
    const [created] = await Inventory.create(
      [
        {
          businessId,
          productId,
          availableStock: defaultStock,
          reorderLevel: defaultReorderLevel,
          lowStockAlert: defaultStock <= defaultReorderLevel,
        },
      ],
      sessionOpt
    );
    inventory = created;
  }

  return inventory;
};

const findInventoryByProductId = async (businessId, productId) => {
  return await Inventory.findOne({ businessId, productId }).populate({
    path: "productId",
    select: "name sku barcode sellingPrice costPrice unit packSize categoryId isActive isArchived",
    populate: { path: "categoryId", select: "name" },
  });
};

const findInventoryStoreState = async (businessId, filters = {}) => {
  // First find active product IDs for this business matching search or category filters
  const productQuery = { businessId, isArchived: false };

  if (filters.categoryId) {
    productQuery.categoryId = filters.categoryId;
  }

  if (filters.search && filters.search.trim()) {
    const term = filters.search.trim();
    const matchingCategories = await Category.find({
      businessId,
      name: { $regex: term, $options: "i" },
    }).select("_id");
    const matchedCategoryIds = matchingCategories.map((c) => c._id);

    const searchConditions = [
      { name: { $regex: term, $options: "i" } },
      { sku: { $regex: term, $options: "i" } },
      { barcode: { $regex: term, $options: "i" } },
    ];

    if (matchedCategoryIds.length > 0) {
      searchConditions.push({ categoryId: { $in: matchedCategoryIds } });
    }

    productQuery.$or = searchConditions;
  }

  const activeProducts = await Product.find(productQuery)
    .select("_id name sku barcode sellingPrice costPrice unit packSize categoryId isActive")
    .populate("categoryId", "name")
    .sort({ createdAt: -1 });

  const productIds = activeProducts.map((p) => p._id);

  // Fetch or build inventory store state for each product
  const inventoryRecords = await Inventory.find({
    businessId,
    productId: { $in: productIds },
  });

  const inventoryMap = new Map();
  for (const inv of inventoryRecords) {
    inventoryMap.set(inv.productId.toString(), inv);
  }

  // Merge products with their inventory state
  const storeState = activeProducts.map((prod) => {
    const inv = inventoryMap.get(prod._id.toString());
    const availableStock = inv ? inv.availableStock : 0;
    const reorderLevel = inv ? inv.reorderLevel : 5;
    const lowStockAlert = availableStock <= reorderLevel;

    let stockStatus = "IN_STOCK";
    if (availableStock <= 0) {
      stockStatus = "OUT_OF_STOCK";
    } else if (availableStock <= reorderLevel) {
      stockStatus = "LOW_STOCK";
    }

    return {
      id: inv ? inv._id : null,
      productId: prod._id,
      name: prod.name,
      sku: prod.sku,
      barcode: prod.barcode || null,
      category: prod.categoryId
        ? { id: prod.categoryId._id, name: prod.categoryId.name }
        : null,
      sellingPrice: prod.sellingPrice,
      costPrice: prod.costPrice,
      unit: prod.unit || "pcs",
      packSize: prod.packSize || 1,
      availableStock,
      reorderLevel,
      lowStockAlert,
      stockStatus,
      valuation: (availableStock * (prod.costPrice || 0)),
      lastRestockedAt: inv?.lastRestockedAt || null,
      updatedAt: inv?.updatedAt || prod.updatedAt,
    };
  });

  // Filter by stockStatus if requested
  if (filters.stockStatus && filters.stockStatus !== "ALL") {
    return storeState.filter(
      (item) => item.stockStatus === filters.stockStatus.toUpperCase()
    );
  }

  return storeState;
};

const getInventorySummary = async (businessId) => {
  const activeProducts = await Product.find({ businessId, isArchived: false }).select(
    "_id costPrice sellingPrice"
  );

  const productIds = activeProducts.map((p) => p._id);
  const costMap = new Map();
  for (const p of activeProducts) {
    costMap.set(p._id.toString(), p.costPrice || 0);
  }

  const inventories = await Inventory.find({
    businessId,
    productId: { $in: productIds },
  });

  const invMap = new Map();
  for (const inv of inventories) {
    invMap.set(inv.productId.toString(), inv);
  }

  let lowStockCount = 0;
  let outOfStockCount = 0;
  let inStockCount = 0;
  let totalStockQuantity = 0;
  let totalValuation = 0;

  for (const prod of activeProducts) {
    const inv = invMap.get(prod._id.toString());
    const stock = inv ? inv.availableStock : 0;
    const reorder = inv ? inv.reorderLevel : 5;
    const cost = costMap.get(prod._id.toString()) || 0;

    totalStockQuantity += stock;
    totalValuation += stock * cost;

    if (stock <= 0) {
      outOfStockCount++;
    } else if (stock <= reorder) {
      lowStockCount++;
    } else {
      inStockCount++;
    }
  }

  return {
    totalProducts: activeProducts.length,
    inStockCount,
    lowStockCount,
    outOfStockCount,
    totalStockQuantity,
    totalValuation: Math.round(totalValuation * 100) / 100,
  };
};

const { evaluateAndSyncProductLowStockAlert } = require("./inventoryAlert.repository");

const updateReorderLevel = async (businessId, productId, reorderLevel, session = null) => {
  const inventory = await getOrCreateInventory(businessId, productId, 0, 5, session);

  inventory.reorderLevel = reorderLevel;
  inventory.lowStockAlert = inventory.availableStock <= reorderLevel;
  const saved = await inventory.save(session ? { session } : {});

  // Trigger deterministic alert rule sync (Phase 3 - Task T22)
  await evaluateAndSyncProductLowStockAlert({
    businessId,
    productId,
    availableStock: inventory.availableStock,
    reorderLevel,
  }).catch((err) => console.error("Error evaluating low stock alert:", err));

  return saved;
};

/**
 * Phase 3 - Task T16: Atomic Stock Movement & Immutable Ledger Recorder
 * Architectural Rule: Never overwrite stock directly. All stock movement written as ledger logs.
 * Enforces atomic concurrency control with $inc and $gte conditions.
 */
const recordStockMovement = async ({
  businessId,
  productId,
  qtyChange,
  type,
  source = "MANUAL",
  supplierName = "",
  unitCost = null,
  referenceNumber = "",
  reason = "",
  invoiceId = null,
  referenceType = "",
  referenceId = null,
  createdBy = null,
  createdByName = "",
  notes = "",
  session = null,
}) => {
  const sessionOpt = session ? { session } : {};
  const numQtyChange = Number(qtyChange);

  // Ensure inventory record exists
  let inventory = await Inventory.findOne({ businessId, productId }).session(session);
  if (!inventory) {
    const [newInv] = await Inventory.create(
      [
        {
          businessId,
          productId,
          availableStock: 0,
          reorderLevel: 5,
          lowStockAlert: true,
        },
      ],
      sessionOpt
    );
    inventory = newInv;
  }

  let updatedInventory = null;

  if (numQtyChange < 0) {
    const deduction = Math.abs(numQtyChange);
    // Atomic concurrency deduction guard: condition + decrement in single DB step
    updatedInventory = await Inventory.findOneAndUpdate(
      {
        businessId,
        productId,
        availableStock: { $gte: deduction },
      },
      {
        $inc: { availableStock: -deduction },
        $set: { updatedAt: new Date() },
      },
      {
        returnDocument: "after",
        ...sessionOpt,
      }
    );

    if (!updatedInventory) {
      const currentStock = inventory.availableStock || 0;
      const error = new Error(
        `Insufficient stock for product. Available: ${currentStock}, Requested deduction: ${deduction}`
      );
      error.statusCode = 400;
      error.code = "INSUFFICIENT_STOCK";
      error.productId = productId;
      error.availableStock = currentStock;
      error.requestedQuantity = deduction;
      throw error;
    }
  } else if (numQtyChange > 0) {
    const addition = Math.abs(numQtyChange);
    updatedInventory = await Inventory.findOneAndUpdate(
      {
        businessId,
        productId,
      },
      {
        $inc: { availableStock: addition },
        $set: {
          lastRestockedAt: new Date(),
          updatedAt: new Date(),
        },
      },
      {
        returnDocument: "after",
        upsert: true,
        ...sessionOpt,
      }
    );
  } else {
    // 0 qty change (adjustment to same value)
    updatedInventory = inventory;
  }

  const newBalance = updatedInventory.availableStock;

  // Re-evaluate low stock alert atomically without full document .save()
  const isLowStock = newBalance <= (updatedInventory.reorderLevel || 5);
  updatedInventory.lowStockAlert = isLowStock;
  await Inventory.updateOne(
    { _id: updatedInventory._id },
    { $set: { lowStockAlert: isLowStock, updatedAt: new Date() } },
    sessionOpt
  );

  // 1. Create Immutable Ledger Log Entry (Who, When, Why, What)
  const [ledgerEntry] = await InventoryLedger.create(
    [
      {
        businessId,
        productId,
        qtyChange: numQtyChange,
        balanceAfter: newBalance,
        type,
        source: source || (type === "IN" ? "PURCHASE" : type === "OPENING" ? "INITIAL_OPENING" : "MANUAL"),
        supplierName: supplierName || "",
        unitCost: unitCost !== null && !isNaN(Number(unitCost)) ? Number(unitCost) : null,
        referenceNumber: referenceNumber || "",
        reason: reason || (type === "IN" ? "Stock In / Purchase" : type === "OUT" ? "Sale / Stock Out" : "Stock Adjustment"),
        invoiceId,
        referenceType: referenceType || (source === "GOODS_RECEIPT" ? "GRN" : ""),
        referenceId,
        createdBy,
        createdByName: createdByName || "",
        notes,
      },
    ],
    sessionOpt
  );

  // 2. Deterministic Alert Queue Engine Hook (Phase 3 - Task T22)
  evaluateAndSyncProductLowStockAlert({
    businessId,
    productId,
    availableStock: newBalance,
    reorderLevel: updatedInventory.reorderLevel,
  }).catch((err) => console.error("Error syncing low-stock alert:", err));

  return {
    inventory: updatedInventory,
    ledgerEntry,
  };
};

/**
 * Phase 3 - Task T20: Stock Reconciliation / Adjust API
 * Records adjustments with reason logging (Audits, Damages, Spillages, Discrepancies) to preserve ledger integrity.
 */
const adjustStock = async (
  businessId,
  productId,
  newAvailableStock,
  options = {}
) => {
  const inventory = await getOrCreateInventory(businessId, productId);
  const currentStock = inventory.availableStock || 0;
  const qtyChange = newAvailableStock - currentStock;

  const notes = typeof options === "string" ? options : (options.notes || "");
  const reason = (typeof options === "object" && options.reason) ? options.reason : "Physical Stock Reconciliation";
  const source = (typeof options === "object" && options.source) ? options.source : "AUDIT_RECONCILIATION";
  const referenceNumber = (typeof options === "object" && options.referenceNumber) ? options.referenceNumber : "";
  const createdBy = (typeof options === "object" && options.createdBy) ? options.createdBy : null;
  const createdByName = (typeof options === "object" && options.createdByName) ? options.createdByName : "";
  const session = (typeof options === "object" && options.session) ? options.session : null;

  return await recordStockMovement({
    businessId,
    productId,
    qtyChange,
    type: "ADJUST",
    source,
    referenceNumber,
    reason,
    createdBy,
    createdByName,
    notes,
    session,
  });
};

/**
 * Phase 3 - Task T21: Query Inventory Ledger Audit Trail & Statement History
 * Supports full Who, When, Why, What filtering across dates, types, sources, products and search terms.
 */
const findLedgerEntries = async (businessId, filters = {}) => {
  const query = { businessId };

  // 1. Filter by specific Product
  if (filters.productId && filters.productId !== "ALL") {
    query.productId = filters.productId;
  }

  // 2. Filter by Movement Type (IN, OUT, ADJUST, OPENING, RETURN)
  if (filters.type && filters.type !== "ALL") {
    query.type = filters.type.toUpperCase();
  }

  // 3. Filter by Source Category
  if (filters.source && filters.source !== "ALL") {
    query.source = filters.source.toUpperCase();
  }

  // 4. Date Range Filtering (createdAt)
  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) {
      const start = new Date(filters.startDate);
      start.setHours(0, 0, 0, 0);
      query.createdAt.$gte = start;
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

  // 5. Text Search (Reference #, Reason, Supplier, Notes)
  if (filters.search && filters.search.trim()) {
    const searchRegex = new RegExp(filters.search.trim(), "i");
    query.$or = [
      { referenceNumber: searchRegex },
      { reason: searchRegex },
      { supplierName: searchRegex },
      { createdByName: searchRegex },
      { notes: searchRegex },
    ];
  }

  const limit = Math.min(Math.max(parseInt(filters.limit, 10) || 30, 1), 200);
  const page = Math.max(parseInt(filters.page, 10) || 1, 1);
  const skip = (page - 1) * limit;

  const total = await InventoryLedger.countDocuments(query);
  const entries = await InventoryLedger.find(query)
    .populate({
      path: "productId",
      select: "name sku barcode unit sellingPrice costPrice categoryId",
      populate: { path: "categoryId", select: "name" },
    })
    .populate("invoiceId", "invoiceNumber grandTotal createdAt")
    .populate("createdBy", "fullName email phone")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // Calculate flow summary for current query filters
  let totalInQty = 0;
  let totalOutQty = 0;
  let totalAdjustQty = 0;

  for (const entry of entries) {
    if (entry.type === "IN" || entry.type === "OPENING") {
      totalInQty += Math.max(entry.qtyChange, 0);
    } else if (entry.type === "OUT") {
      totalOutQty += Math.abs(entry.qtyChange);
    } else if (entry.type === "ADJUST") {
      totalAdjustQty += entry.qtyChange;
    }
  }

  return {
    entries,
    summary: {
      totalEntries: total,
      totalInQty,
      totalOutQty,
      netFlowQty: totalInQty - totalOutQty + totalAdjustQty,
    },
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

/**
 * Phase 4 - Task T26: Auto Inventory Deductions
 * Service-level execution mapping Sale Line Items directly to atomic Stock OUT deductions and audited ledger logs.
 * Enforces T46 Concurrency-Safe Atomic $gte condition + $inc update.
 */
const autoDeductInventoryForSale = async (
  businessId,
  {
    saleId,
    invoiceNumber,
    items = [],
    createdBy = null,
    createdByName = "",
    source = "POS_CHECKOUT",
    notes = "",
  },
  session = null
) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return { deductions: [], ledgerEntries: [] };
  }

  const sessionOpt = session ? { session } : {};
  const productIds = items.map((it) => it.productId).filter(Boolean);

  // 1. Fetch current inventory records
  const dbInventories = await Inventory.find({
    businessId,
    productId: { $in: productIds },
  }).session(session);

  const inventoryMap = new Map();
  for (const inv of dbInventories) {
    inventoryMap.set(inv.productId.toString(), inv);
  }

  // 2. Pre-flight verification (fast check before executing atomic updates)
  for (const item of items) {
    const prodIdStr = (item.productId?._id || item.productId || "").toString();
    const existingInv = inventoryMap.get(prodIdStr);
    const availableStock = existingInv ? existingInv.availableStock : 0;
    const requestedQty = Number(item.quantity || item.qty || 1);

    if (!existingInv || availableStock < requestedQty) {
      const error = new Error(
        `Insufficient stock for '${item.name || "Product"}'. Available: ${availableStock}, Requested: ${requestedQty}`
      );
      error.statusCode = 400;
      error.code = "INSUFFICIENT_STOCK";
      error.productId = item.productId;
      error.productName = item.name;
      error.availableStock = availableStock;
      error.requestedQuantity = requestedQty;
      throw error;
    }
  }

  // 3. Execute atomic concurrency-safe stock reductions and prepare ledger entries
  const deductions = [];
  const ledgerDocs = [];

  for (const item of items) {
    const prodId = item.productId?._id || item.productId;
    const requestedQty = Number(item.quantity || item.qty || 1);

    // Concurrency-Safe Atomic Mongo Update: Condition + Decrement in single DB instruction
    const updatedInv = await Inventory.findOneAndUpdate(
      {
        businessId,
        productId: prodId,
        availableStock: { $gte: requestedQty },
      },
      {
        $inc: { availableStock: -Math.abs(requestedQty) },
        $set: { updatedAt: new Date() },
      },
      {
        returnDocument: "after",
        ...sessionOpt,
      }
    );

    if (!updatedInv) {
      const existingInv = inventoryMap.get((prodId || "").toString());
      const currentStock = existingInv ? existingInv.availableStock : 0;
      const error = new Error(
        `Insufficient stock for '${item.name || "Product"}'. Stock balance changed concurrently during checkout.`
      );
      error.statusCode = 400;
      error.code = "INSUFFICIENT_STOCK";
      error.productId = prodId;
      error.productName = item.name;
      error.availableStock = currentStock;
      error.requestedQuantity = requestedQty;
      throw error;
    }

    // Re-evaluate low-stock status atomically without full document .save()
    const isLow = updatedInv.availableStock <= (updatedInv.reorderLevel || 5);
    updatedInv.lowStockAlert = isLow;
    await Inventory.updateOne(
      { _id: updatedInv._id },
      { $set: { lowStockAlert: isLow, updatedAt: new Date() } },
      sessionOpt
    );

    deductions.push({
      productId: updatedInv.productId,
      previousStock: updatedInv.availableStock + requestedQty,
      newStock: updatedInv.availableStock,
      deductedQuantity: requestedQty,
    });

    ledgerDocs.push({
      businessId,
      productId: updatedInv.productId,
      qtyChange: -Math.abs(requestedQty),
      balanceAfter: updatedInv.availableStock,
      type: "OUT",
      source: source || "POS_CHECKOUT",
      referenceNumber: invoiceNumber || "",
      invoiceId: saleId || null,
      reason: invoiceNumber ? `POS Sale Checkout #${invoiceNumber}` : "POS Sale Checkout",
      createdBy,
      createdByName,
      notes: notes || `Auto-deducted for Invoice ${invoiceNumber || ""}`,
    });
  }

  let createdLedgers = [];
  if (ledgerDocs.length > 0) {
    createdLedgers = await InventoryLedger.insertMany(ledgerDocs, sessionOpt);
  }

  // 4. Trigger low-stock alert evaluation
  const { evaluateAndSyncProductLowStockAlert } = require("./inventoryAlert.repository");
  for (const item of items) {
    const prodIdStr = (item.productId?._id || item.productId || "").toString();
    const existingInv = inventoryMap.get(prodIdStr);
    if (existingInv) {
      evaluateAndSyncProductLowStockAlert({
        businessId,
        productId: existingInv.productId,
        availableStock: existingInv.availableStock,
        reorderLevel: existingInv.reorderLevel,
        productName: item.name,
      }).catch((err) => console.warn(`[AutoDeduct AlertSync] Error:`, err.message));
    }
  }

  return {
    deductions,
    ledgerEntries: createdLedgers,
  };
};

module.exports = {
  getOrCreateInventory,
  findInventoryByProductId,
  findInventoryStoreState,
  getInventorySummary,
  updateReorderLevel,
  recordStockMovement,
  adjustStock,
  findLedgerEntries,
  autoDeductInventoryForSale,
};

