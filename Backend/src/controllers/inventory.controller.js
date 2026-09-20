const inventoryService = require("../services/inventory.service");

/**
 * Inventory Controller Layer
 * Receives requests after authentication and T6 business context mapping.
 * Uses req.businessId established by businessMiddleware.
 */

const getStoreState = async (req, res, next) => {
  try {
    const storeState = await inventoryService.getStoreState(
      req.businessId,
      req.query
    );

    return res.status(200).json({
      success: true,
      data: storeState,
      count: storeState.length,
    });
  } catch (error) {
    next(error);
  }
};

const getInventorySummary = async (req, res, next) => {
  try {
    const summary = await inventoryService.getInventorySummary(req.businessId);

    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

const getProductInventory = async (req, res, next) => {
  try {
    const inventory = await inventoryService.getProductInventory(
      req.businessId,
      req.params.productId
    );

    return res.status(200).json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    next(error);
  }
};

const updateReorderLevel = async (req, res, next) => {
  try {
    const updated = await inventoryService.updateReorderLevel(
      req.businessId,
      req.params.productId,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Reorder level updated successfully.",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

const adjustStock = async (req, res, next) => {
  try {
    const updated = await inventoryService.adjustStock(
      req.businessId,
      {
        ...req.body,
        createdBy: req.user?.accountId,
        createdByName: req.account?.fullName,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Inventory stock adjusted successfully.",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

const stockIn = async (req, res, next) => {
  try {
    const result = await inventoryService.stockIn(
      req.businessId,
      {
        ...req.body,
        createdBy: req.user?.accountId,
        createdByName: req.account?.fullName,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Stock in recorded successfully in ledger.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const stockOut = async (req, res, next) => {
  try {
    const result = await inventoryService.stockOut(
      req.businessId,
      {
        ...req.body,
        createdBy: req.user?.accountId,
        createdByName: req.account?.fullName,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Stock out recorded successfully in ledger.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const batchStockOut = async (req, res, next) => {
  try {
    const result = await inventoryService.batchStockOut(
      req.businessId,
      {
        ...req.body,
        createdBy: req.user?.accountId,
        createdByName: req.account?.fullName,
      }
    );

    return res.status(200).json({
      success: true,
      message: `Successfully recorded batch stock deductions for ${result.totalItemsDeducted} items.`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getInventoryLedger = async (req, res, next) => {
  try {
    const result = await inventoryService.getInventoryLedger(
      req.businessId,
      req.query
    );

    return res.status(200).json({
      success: true,
      data: result.entries,
      summary: result.summary,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getProductLedger = async (req, res, next) => {
  try {
    const result = await inventoryService.getProductLedger(
      req.businessId,
      req.params.productId,
      req.query
    );

    return res.status(200).json({
      success: true,
      data: result.entries,
      summary: result.summary,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const initializeOpeningStock = async (req, res, next) => {
  try {
    const result = await inventoryService.initializeOpeningStock(
      req.businessId,
      {
        ...req.body,
        createdBy: req.user?.accountId,
        createdByName: req.account?.fullName,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Opening stock initialized and recorded in ledger.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Phase 3 - Task T22: Low-Stock Limit Notifications & Alerts Queue Controllers
 */
const getInventoryAlerts = async (req, res, next) => {
  try {
    const { status, severity, alertType, productId, search, page, limit } = req.query;
    const result = await inventoryService.getInventoryAlerts(
      req.businessId,
      { status, severity, alertType, productId, search },
      { page, limit }
    );

    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getInventoryAlertsSummary = async (req, res, next) => {
  try {
    const summary = await inventoryService.getInventoryAlertsSummary(req.businessId);

    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

const acknowledgeAlert = async (req, res, next) => {
  try {
    const alert = await inventoryService.acknowledgeAlert(
      req.businessId,
      req.params.id,
      req.user?.accountId
    );

    return res.status(200).json({
      success: true,
      message: "Alert marked as acknowledged.",
      data: alert,
    });
  } catch (error) {
    next(error);
  }
};

const resolveAlert = async (req, res, next) => {
  try {
    const alert = await inventoryService.resolveAlert(
      req.businessId,
      req.params.id,
      req.user?.accountId
    );

    return res.status(200).json({
      success: true,
      message: "Alert marked as resolved.",
      data: alert,
    });
  } catch (error) {
    next(error);
  }
};

const syncAllInventoryAlerts = async (req, res, next) => {
  try {
    const result = await inventoryService.syncAllInventoryAlerts(req.businessId);

    return res.status(200).json({
      success: true,
      message: "Inventory alerts synced successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStoreState,
  getInventorySummary,
  getProductInventory,
  updateReorderLevel,
  adjustStock,
  stockIn,
  stockOut,
  batchStockOut,
  getInventoryLedger,
  getProductLedger,
  initializeOpeningStock,
  getInventoryAlerts,
  getInventoryAlertsSummary,
  acknowledgeAlert,
  resolveAlert,
  syncAllInventoryAlerts,
};
