const supplierService = require("../services/supplier.service");

/**
 * Phase 6 - Task T38: Supplier Controller (REST API endpoints)
 */

// POST /api/suppliers
const createSupplier = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const supplier = await supplierService.createSupplier(businessId, req.body);

    return res.status(201).json({
      success: true,
      message: "Supplier registered successfully.",
      data: supplier,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/suppliers
const getSuppliers = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const { search, phone, status, hasBalance, city, page, limit, sortBy, sortOrder } = req.query;

    const result = await supplierService.getSuppliers(businessId, {
      search,
      phone,
      status,
      hasBalance,
      city,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    return res.status(200).json({
      success: true,
      data: result.suppliers,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/suppliers/search
const searchSuppliers = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const { q, limit } = req.query;

    const suppliers = await supplierService.searchSuppliers(businessId, q, limit);

    return res.status(200).json({
      success: true,
      data: suppliers,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/suppliers/phone/:phone
const getSupplierByPhone = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const supplier = await supplierService.getSupplierByPhone(businessId, req.params.phone);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found with this phone number.",
      });
    }

    return res.status(200).json({
      success: true,
      data: supplier,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/suppliers/summary
const getSupplierSummary = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const summary = await supplierService.getSupplierSummary(businessId);

    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/suppliers/:id
const getSupplierById = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const supplier = await supplierService.getSupplierById(businessId, req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found in this business.",
      });
    }

    return res.status(200).json({
      success: true,
      data: supplier,
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/suppliers/:id
const updateSupplier = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const updated = await supplierService.updateSupplier(businessId, req.params.id, req.body);

    return res.status(200).json({
      success: true,
      message: "Supplier profile updated successfully.",
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/suppliers/:id (Soft-delete / Deactivate)
const deleteSupplier = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const deleted = await supplierService.deleteSupplier(businessId, req.params.id);

    return res.status(200).json({
      success: true,
      message: "Supplier deactivated successfully.",
      data: deleted,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/suppliers/:id/archive
const archiveSupplier = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const archived = await supplierService.deleteSupplier(businessId, req.params.id);

    return res.status(200).json({
      success: true,
      message: "Supplier archived successfully.",
      data: archived,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/suppliers/:id/restore
const restoreSupplier = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const restored = await supplierService.restoreSupplier(businessId, req.params.id);

    return res.status(200).json({
      success: true,
      message: "Supplier restored to active successfully.",
      data: restored,
    });
  } catch (err) {
    next(err);
  }
};

// ── Phase 6 - Task T39: Supplier Ledger Transaction Log Endpoints ─────────

// GET /api/suppliers/:id/ledger
const getSupplierLedger = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const { page, limit } = req.query;

    const result = await supplierService.getSupplierLedger(businessId, req.params.id, { page, limit });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/suppliers/:id/settle (or /payments) - Record Payment Disbursement to Supplier
const recordSupplierPayment = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const supplierId = req.params.id;
    const accountId = req.user?.id || req.user?.accountId || req.user?._id || null;
    const accountName = req.user?.fullName || req.user?.name || req.account?.fullName || "Admin / Cashier";

    const { amount, paymentMethod, referenceId, notes, idempotencyKey } = req.body;

    const result = await supplierService.recordSupplierPayment(businessId, {
      supplierId,
      amount,
      paymentMethod,
      referenceId,
      notes,
      idempotencyKey,
      createdBy: accountId,
      createdByName: accountName,
    });

    return res.status(200).json({
      success: true,
      message: `Payment of ₹${Number(amount || 0).toFixed(2)} recorded successfully.`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/suppliers/:id/ledger - Append manual adjustment or opening balance
const appendLedgerEntry = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const supplierId = req.params.id;
    const accountId = req.user?.id || req.user?.accountId || req.user?._id || null;
    const accountName = req.user?.fullName || req.user?.name || req.account?.fullName || "Admin";

    const {
      entryType,
      invoiceValue,
      paymentAmount,
      purchaseId,
      purchaseInvoiceNumber,
      paymentMethod,
      referenceId,
      notes,
    } = req.body;

    const result = await supplierService.appendLedgerEntry(businessId, {
      supplierId,
      entryType,
      invoiceValue,
      paymentAmount,
      purchaseId,
      purchaseInvoiceNumber,
      paymentMethod,
      referenceId,
      notes,
      createdBy: accountId,
      createdByName: accountName,
    });

    return res.status(201).json({
      success: true,
      message: "Supplier ledger entry appended successfully.",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/suppliers/:id/purchases/credit - Record Inventory Purchase Credit
const recordPurchaseCredit = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const supplierId = req.params.id;
    const accountId = req.user?.id || req.user?.accountId || req.user?._id || null;
    const accountName = req.user?.fullName || req.user?.name || req.account?.fullName || "Inventory Manager";

    const {
      purchaseId,
      purchaseInvoiceNumber,
      invoiceValue,
      notes,
      idempotencyKey,
    } = req.body;

    const result = await supplierService.recordPurchaseCredit(businessId, {
      supplierId,
      purchaseId,
      purchaseInvoiceNumber,
      invoiceValue,
      notes,
      idempotencyKey,
      createdBy: accountId,
      createdByName: accountName,
    });

    return res.status(201).json({
      success: true,
      message: "Purchase credit logged into supplier ledger successfully.",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/suppliers/:id/outstanding - Real-time payable for single supplier
const getSupplierOutstanding = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const result = await supplierService.getSupplierOutstanding(businessId, req.params.id);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/suppliers/payables/summary - Business-wide payables ranking
const getBusinessPayablesSummary = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const { limit } = req.query;
    const result = await supplierService.getBusinessPayablesSummary(businessId, limit);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/suppliers/payables/totals - Business-wide aggregate payable metrics
const getBusinessPayablesTotals = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const result = await supplierService.getBusinessPayablesTotals(businessId);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

// ── Phase 6 - Task T41: Supplier 360° Management Center Summary ───────────

// GET /api/suppliers/:id/summary-360 (or /360, /crm-summary)
const getSupplier360Summary = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const supplierId = req.params.id;

    const summary = await supplierService.getSupplier360Summary(businessId, supplierId);

    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createSupplier,
  getSuppliers,
  searchSuppliers,
  getSupplierByPhone,
  getSupplierSummary,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
  archiveSupplier,
  restoreSupplier,
  getSupplierLedger,
  recordSupplierPayment,
  appendLedgerEntry,
  recordPurchaseCredit,
  getSupplierOutstanding,
  getBusinessPayablesSummary,
  getBusinessPayablesTotals,
  getSupplier360Summary,
};


