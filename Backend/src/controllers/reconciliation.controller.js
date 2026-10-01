const reconciliationService = require("../services/reconciliation.service");

/**
 * Reconciliation Controller
 * Provides audit endpoints for Store Managers and System Administrators
 * to inspect database integrity and resolve ledger drift.
 */
class ReconciliationController {
  async getInventoryReconciliation(req, res, next) {
    try {
      const autoFix = req.query.autoFix === "true" || req.body?.autoFix === true;
      const result = await reconciliationService.reconcileInventory(
        req.businessId,
        autoFix,
        req.user?.id || req.user?.accountId || req.user?._id,
        req.user?.fullName || req.user?.name || req.account?.fullName
      );
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getCustomerReconciliation(req, res, next) {
    try {
      const autoFix = req.query.autoFix === "true" || req.body?.autoFix === true;
      const result = await reconciliationService.reconcileCustomers(
        req.businessId,
        autoFix
      );
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getSupplierReconciliation(req, res, next) {
    try {
      const autoFix = req.query.autoFix === "true" || req.body?.autoFix === true;
      const result = await reconciliationService.reconcileSuppliers(
        req.businessId,
        autoFix
      );
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async runFullReconciliation(req, res, next) {
    try {
      const autoFix = req.query.autoFix === "true" || req.body?.autoFix === true;
      const result = await reconciliationService.runFullReconciliation(
        req.businessId,
        autoFix,
        req.user?.id || req.user?.accountId || req.user?._id,
        req.user?.fullName || req.user?.name || req.account?.fullName
      );
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ReconciliationController();
