const mongoose = require("mongoose");
const inventoryRepo = require("../repositories/inventory.repository");
const productRepo = require("../repositories/product.repository");
const alertRepo = require("../repositories/inventoryAlert.repository");

/**
 * Phase 3 - Task T15: Inventory Service Layer
 * Multi-tenant business logic for physical current quantities, reorder levels, and store state.
 */

const getStoreState = async (businessId, filters = {}) => {
  if (!mongoose.Types.ObjectId.isValid(businessId)) {
    const error = new Error("Invalid business ID.");
    error.statusCode = 400;
    error.code = "INVALID_BUSINESS_ID";
    throw error;
  }

  return await inventoryRepo.findInventoryStoreState(businessId, filters);
};

const getInventorySummary = async (businessId) => {
  if (!mongoose.Types.ObjectId.isValid(businessId)) {
    const error = new Error("Invalid business ID.");
    error.statusCode = 400;
    error.code = "INVALID_BUSINESS_ID";
    throw error;
  }

  return await inventoryRepo.getInventorySummary(businessId);
};

const getProductInventory = async (businessId, productId) => {
  if (!mongoose.Types.ObjectId.isValid(businessId) || !mongoose.Types.ObjectId.isValid(productId)) {
    const error = new Error("Invalid ID format.");
    error.statusCode = 400;
    error.code = "INVALID_ID";
    throw error;
  }

  // 1. Verify product belongs to this business
  const product = await productRepo.findProductById(businessId, productId);
  if (!product) {
    const error = new Error("Product not found in this business.");
    error.statusCode = 404;
    error.code = "PRODUCT_NOT_FOUND";
    throw error;
  }

  return await inventoryRepo.getOrCreateInventory(businessId, productId);
};

const updateReorderLevel = async (businessId, productId, payload) => {
  if (!mongoose.Types.ObjectId.isValid(businessId) || !mongoose.Types.ObjectId.isValid(productId)) {
    const error = new Error("Invalid ID format.");
    error.statusCode = 400;
    error.code = "INVALID_ID";
    throw error;
  }

  const product = await productRepo.findProductById(businessId, productId);
  if (!product) {
    const error = new Error("Product not found in this business.");
    error.statusCode = 404;
    error.code = "PRODUCT_NOT_FOUND";
    throw error;
  }

  const reorderLevel = Number(payload.reorderLevel);
  if (isNaN(reorderLevel) || reorderLevel < 0) {
    const error = new Error("Reorder level must be a non-negative number.");
    error.statusCode = 400;
    error.code = "INVALID_REORDER_LEVEL";
    throw error;
  }

  return await inventoryRepo.updateReorderLevel(businessId, productId, reorderLevel);
};

/**
 * Phase 3 - Task T18: Stock IN (Addition) Endpoint
 * Increments physical inventory count and writes detailed transaction logs with source details.
 */
const stockIn = async (businessId, payload) => {
  const {
    productId,
    quantity,
    source = "PURCHASE",
    supplier,
    supplierName,
    unitCost,
    referenceNumber,
    createdBy,
    createdByName,
    notes,
  } = payload;

  if (!mongoose.Types.ObjectId.isValid(businessId) || !mongoose.Types.ObjectId.isValid(productId)) {
    const error = new Error("Invalid ID format.");
    error.statusCode = 400;
    error.code = "INVALID_ID";
    throw error;
  }

  const product = await productRepo.findProductById(businessId, productId);
  if (!product) {
    const error = new Error("Product not found in this business.");
    error.statusCode = 404;
    error.code = "PRODUCT_NOT_FOUND";
    throw error;
  }

  const qty = Number(quantity);
  if (isNaN(qty) || qty <= 0) {
    const error = new Error("Stock-in quantity must be greater than 0.");
    error.statusCode = 400;
    error.code = "INVALID_QUANTITY";
    throw error;
  }

  const resolvedSupplier = (supplierName || supplier || "").trim();
  const resolvedSource = source || "PURCHASE";
  const resolvedRef = (referenceNumber || "").trim();

  let reason = "Stock In";
  if (resolvedSource === "PURCHASE") {
    reason = resolvedSupplier ? `Purchase from ${resolvedSupplier}` : "Stock In / Purchase";
  } else if (resolvedSource === "GOODS_RECEIPT") {
    reason = resolvedRef ? `Goods Receipt #${resolvedRef}` : "Goods Receipt";
  } else if (resolvedSource === "MANUAL") {
    reason = "Manual Stock Addition";
  } else if (resolvedSource === "RETURN") {
    reason = "Customer Return Restock";
  }

  return await inventoryRepo.recordStockMovement({
    businessId,
    productId,
    qtyChange: qty, // Positive signed quantity for Stock-In
    type: "IN",
    source: resolvedSource,
    supplierName: resolvedSupplier,
    unitCost: unitCost !== undefined && !isNaN(Number(unitCost)) ? Number(unitCost) : null,
    referenceNumber: resolvedRef,
    reason,
    createdBy: createdBy || null,
    createdByName: createdByName || "",
    notes: notes?.trim() || "",
  });
};

/**
 * Phase 3 - Task T19: Stock OUT (Reduction) Endpoint
 * Deducts sold or discarded quantities from physical stock and writes audited OUT ledger logs.
 */
const stockOut = async (businessId, payload) => {
  const {
    productId,
    quantity,
    source = "SALE",
    invoiceId,
    invoiceNumber,
    customerName,
    reason,
    referenceNumber,
    createdBy,
    createdByName,
    notes,
  } = payload;

  if (!mongoose.Types.ObjectId.isValid(businessId) || !mongoose.Types.ObjectId.isValid(productId)) {
    const error = new Error("Invalid ID format.");
    error.statusCode = 400;
    error.code = "INVALID_ID";
    throw error;
  }

  const product = await productRepo.findProductById(businessId, productId);
  if (!product) {
    const error = new Error("Product not found in this business.");
    error.statusCode = 404;
    error.code = "PRODUCT_NOT_FOUND";
    throw error;
  }

  const qty = Number(quantity);
  if (isNaN(qty) || qty <= 0) {
    const error = new Error("Stock-out quantity must be greater than 0.");
    error.statusCode = 400;
    error.code = "INVALID_QUANTITY";
    throw error;
  }

  const resolvedSource = source || (invoiceId ? "POS_CHECKOUT" : "SALE");
  const resolvedRef = (referenceNumber || invoiceNumber || "").trim();

  let resolvedReason = reason?.trim();
  if (!resolvedReason) {
    if (resolvedSource === "POS_CHECKOUT" || resolvedSource === "SALE") {
      resolvedReason = resolvedRef ? `Sale Invoice #${resolvedRef}` : "POS Sale Checkout";
    } else if (resolvedSource === "DAMAGE") {
      resolvedReason = "Damaged Goods Write-off";
    } else if (resolvedSource === "EXPIRED") {
      resolvedReason = "Expired Inventory Discard";
    } else if (resolvedSource === "RETURN_TO_VENDOR") {
      resolvedReason = "Returned to Supplier / Vendor";
    } else if (resolvedSource === "SAMPLE") {
      resolvedReason = "Internal Sample / Store Demonstration";
    } else {
      resolvedReason = "Manual Stock Deduction";
    }
  }

  if (customerName?.trim()) {
    resolvedReason += ` (Customer: ${customerName.trim()})`;
  }

  return await inventoryRepo.recordStockMovement({
    businessId,
    productId,
    qtyChange: -Math.abs(qty), // Negative signed quantity for Stock-Out
    type: "OUT",
    source: resolvedSource,
    referenceNumber: resolvedRef,
    reason: resolvedReason,
    invoiceId: invoiceId && mongoose.Types.ObjectId.isValid(invoiceId) ? invoiceId : null,
    createdBy: createdBy || null,
    createdByName: createdByName || "",
    notes: notes?.trim() || "",
  });
};

/**
 * Phase 3 - Task T19: Batch Stock OUT for Automated POS / Invoice Checkout
 */
const batchStockOut = async (businessId, payload) => {
  const { items, invoiceId, invoiceNumber, source = "POS_CHECKOUT", reason, createdBy, createdByName, notes } = payload;

  if (!items || !Array.isArray(items) || items.length === 0) {
    const error = new Error("Items array is required for batch stock deduction.");
    error.statusCode = 400;
    error.code = "INVALID_ITEMS";
    throw error;
  }

  const results = [];
  for (const item of items) {
    const deduction = await stockOut(businessId, {
      productId: item.productId,
      quantity: item.quantity,
      source: source || "POS_CHECKOUT",
      invoiceId,
      invoiceNumber,
      reason: reason || (invoiceNumber ? `POS Sale #${invoiceNumber}` : "POS Checkout Deduction"),
      createdBy,
      createdByName,
      notes: notes || "",
    });
    results.push(deduction);
  }

  return {
    deductions: results,
    totalItemsDeducted: results.length,
  };
};

/**
 * Phase 3 - Task T20: Stock Reconciliation / Adjust API
 * Records adjustments with reason logging (Audits, Damages, Spillages, Discrepancies) to preserve ledger integrity.
 */
const adjustStock = async (businessId, payload) => {
  const {
    productId,
    newStock,
    physicalCount,
    source = "AUDIT_RECONCILIATION",
    referenceNumber,
    reason,
    createdBy,
    createdByName,
    notes,
  } = payload;

  if (!mongoose.Types.ObjectId.isValid(businessId) || !mongoose.Types.ObjectId.isValid(productId)) {
    const error = new Error("Invalid ID format.");
    error.statusCode = 400;
    error.code = "INVALID_ID";
    throw error;
  }

  const product = await productRepo.findProductById(businessId, productId);
  if (!product) {
    const error = new Error("Product not found in this business.");
    error.statusCode = 404;
    error.code = "PRODUCT_NOT_FOUND";
    throw error;
  }

  const rawTarget = newStock !== undefined ? newStock : physicalCount;
  const stockNum = Number(rawTarget);
  if (isNaN(stockNum) || stockNum < 0) {
    const error = new Error("Physical count / new stock must be a non-negative number.");
    error.statusCode = 400;
    error.code = "INVALID_STOCK_AMOUNT";
    throw error;
  }

  const existingInventory = await inventoryRepo.getOrCreateInventory(businessId, productId);
  const previousStock = existingInventory.availableStock || 0;
  const discrepancy = stockNum - previousStock;

  const resolvedSource = source || "AUDIT_RECONCILIATION";
  const resolvedRef = (referenceNumber || "").trim();

  let resolvedReason = reason?.trim();
  if (!resolvedReason) {
    if (resolvedSource === "DAMAGE") {
      resolvedReason = `Damaged Goods Write-off (${discrepancy >= 0 ? "+" : ""}${discrepancy} units)`;
    } else if (resolvedSource === "EXPIRED") {
      resolvedReason = `Expired Inventory Discard (${discrepancy >= 0 ? "+" : ""}${discrepancy} units)`;
    } else if (resolvedSource === "SPILLAGE") {
      resolvedReason = `Spillage / Leakage Loss (${discrepancy >= 0 ? "+" : ""}${discrepancy} units)`;
    } else if (resolvedSource === "THEFT_SHRINKAGE") {
      resolvedReason = `Theft / Shrinkage Discrepancy (${discrepancy >= 0 ? "+" : ""}${discrepancy} units)`;
    } else if (resolvedSource === "FOUND_STOCK") {
      resolvedReason = `Found Unrecorded Stock (+${discrepancy} units)`;
    } else if (resolvedSource === "CORRECTION") {
      resolvedReason = `Count Correction (${discrepancy >= 0 ? "+" : ""}${discrepancy} units)`;
    } else {
      resolvedReason = discrepancy === 0
        ? "Physical Audit: Stock count verified (0 discrepancy)"
        : discrepancy > 0
        ? `Physical Audit: Surplus found (+${discrepancy} units)`
        : `Physical Audit: Shortage discrepancy (${discrepancy} units)`;
    }
  }

  const result = await inventoryRepo.adjustStock(
    businessId,
    productId,
    stockNum,
    {
      source: resolvedSource,
      referenceNumber: resolvedRef,
      reason: resolvedReason,
      createdBy: createdBy || null,
      createdByName: createdByName || "",
      notes: notes?.trim() || "",
    }
  );

  return {
    ...result,
    previousStock,
    newStock: stockNum,
    discrepancy,
  };
};

/**
 * Phase 3 - Task T16: Query Store Inventory Ledger History
 */
const getInventoryLedger = async (businessId, query = {}) => {
  if (!mongoose.Types.ObjectId.isValid(businessId)) {
    const error = new Error("Invalid business ID.");
    error.statusCode = 400;
    error.code = "INVALID_BUSINESS_ID";
    throw error;
  }

  return await inventoryRepo.findLedgerEntries(businessId, query);
};

const getProductLedger = async (businessId, productId, query = {}) => {
  if (!mongoose.Types.ObjectId.isValid(businessId) || !mongoose.Types.ObjectId.isValid(productId)) {
    const error = new Error("Invalid ID format.");
    error.statusCode = 400;
    error.code = "INVALID_ID";
    throw error;
  }

  return await inventoryRepo.findLedgerEntries(businessId, {
    ...query,
    productId,
  });
};

/**
 * Phase 3 - Task T17: Opening Stock Initialization API
 * Explicitly establish starting physical stock balance and record audited OPENING ledger transaction.
 */
const initializeOpeningStock = async (businessId, payload) => {
  const { productId, openingStock, reorderLevel, createdBy, createdByName, notes } = payload;

  if (!mongoose.Types.ObjectId.isValid(businessId) || !mongoose.Types.ObjectId.isValid(productId)) {
    const error = new Error("Invalid ID format.");
    error.statusCode = 400;
    error.code = "INVALID_ID";
    throw error;
  }

  const product = await productRepo.findProductById(businessId, productId);
  if (!product) {
    const error = new Error("Product not found in this business.");
    error.statusCode = 404;
    error.code = "PRODUCT_NOT_FOUND";
    throw error;
  }

  const stockNum = Number(openingStock);
  if (isNaN(stockNum) || stockNum < 0) {
    const error = new Error("Opening stock quantity must be a non-negative number.");
    error.statusCode = 400;
    error.code = "INVALID_OPENING_STOCK";
    throw error;
  }

  // Record audited OPENING movement in ledger
  const result = await inventoryRepo.recordStockMovement({
    businessId,
    productId,
    qtyChange: stockNum,
    type: "OPENING",
    reason: "Opening Stock Initial Balance",
    createdBy: createdBy || null,
    createdByName: createdByName || "",
    notes: notes || "Initialized via Opening Stock API (T17)",
  });

  if (reorderLevel !== undefined && !isNaN(Number(reorderLevel)) && Number(reorderLevel) >= 0) {
    await inventoryRepo.updateReorderLevel(businessId, productId, Number(reorderLevel));
    result.inventory.reorderLevel = Number(reorderLevel);
    result.inventory.lowStockAlert = result.inventory.availableStock <= Number(reorderLevel);
  }

  return result;
};

/**
 * Phase 3 - Task T22: Low-Stock Limit Notifications & Alerts Queue Services
 */
const getInventoryAlerts = async (businessId, filters = {}, pagination = {}) => {
  if (!mongoose.Types.ObjectId.isValid(businessId)) {
    const error = new Error("Invalid business ID.");
    error.statusCode = 400;
    error.code = "INVALID_BUSINESS_ID";
    throw error;
  }

  return await alertRepo.findAlerts(businessId, filters, pagination);
};

const getInventoryAlertsSummary = async (businessId) => {
  if (!mongoose.Types.ObjectId.isValid(businessId)) {
    const error = new Error("Invalid business ID.");
    error.statusCode = 400;
    error.code = "INVALID_BUSINESS_ID";
    throw error;
  }

  return await alertRepo.getAlertsSummary(businessId);
};

const acknowledgeAlert = async (businessId, alertId, accountId = null) => {
  if (!mongoose.Types.ObjectId.isValid(businessId) || !mongoose.Types.ObjectId.isValid(alertId)) {
    const error = new Error("Invalid ID format.");
    error.statusCode = 400;
    error.code = "INVALID_ID";
    throw error;
  }

  return await alertRepo.acknowledgeAlert(businessId, alertId, accountId);
};

const resolveAlert = async (businessId, alertId, accountId = null) => {
  if (!mongoose.Types.ObjectId.isValid(businessId) || !mongoose.Types.ObjectId.isValid(alertId)) {
    const error = new Error("Invalid ID format.");
    error.statusCode = 400;
    error.code = "INVALID_ID";
    throw error;
  }

  return await alertRepo.resolveAlert(businessId, alertId, accountId);
};

const syncAllInventoryAlerts = async (businessId) => {
  if (!mongoose.Types.ObjectId.isValid(businessId)) {
    const error = new Error("Invalid business ID.");
    error.statusCode = 400;
    error.code = "INVALID_BUSINESS_ID";
    throw error;
  }

  return await alertRepo.syncAllInventoryAlerts(businessId);
};

module.exports = {
  getStoreState,
  getInventorySummary,
  getProductInventory,
  updateReorderLevel,
  stockIn,
  stockOut,
  batchStockOut,
  adjustStock,
  getInventoryLedger,
  getProductLedger,
  initializeOpeningStock,
  getInventoryAlerts,
  getInventoryAlertsSummary,
  acknowledgeAlert,
  resolveAlert,
  syncAllInventoryAlerts,
};
