const supplierRepo = require("../repositories/supplier.repository");
const supplierLedgerRepo = require("../repositories/supplierLedger.repository");
const { normalizePhone } = require("../utils/phone");
const { createSupplierSchema, updateSupplierSchema } = require("../validations/supplier.validation");

/**
 * Phase 6 - Task T38 & T39: Supplier Service Layer
 * Coordinates supplier master data operations, validation, search, summaries, and ledger transaction logs.
 */

const createSupplier = async (businessId, supplierData) => {
  // Validate input schema with Zod
  const validationResult = createSupplierSchema.safeParse(supplierData);
  if (!validationResult.success) {
    const error = new Error(validationResult.error.errors[0]?.message || "Invalid supplier data.");
    error.statusCode = 400;
    error.code = "VALIDATION_ERROR";
    throw error;
  }

  const payload = { ...validationResult.data };
  if (payload.phone) {
    payload.phone = normalizePhone(payload.phone);
  }
  return await supplierRepo.createSupplier(businessId, payload);
};

const getSuppliers = async (businessId, options) => {
  return await supplierRepo.listSuppliers(businessId, options);
};

const searchSuppliers = async (businessId, queryStr, limit) => {
  return await supplierRepo.searchSuppliers(businessId, queryStr, limit);
};

const getSupplierById = async (businessId, supplierId) => {
  return await supplierRepo.findSupplierById(businessId, supplierId);
};

const getSupplierByPhone = async (businessId, rawPhone) => {
  const canonicalPhone = normalizePhone(rawPhone);
  return await supplierRepo.findSupplierByPhone(businessId, canonicalPhone);
};

const getSupplierSummary = async (businessId) => {
  return await supplierRepo.getSupplierSummary(businessId);
};

const updateSupplier = async (businessId, supplierId, updateData) => {
  const validationResult = updateSupplierSchema.safeParse(updateData);
  if (!validationResult.success) {
    const error = new Error(validationResult.error.errors[0]?.message || "Invalid update data.");
    error.statusCode = 400;
    error.code = "VALIDATION_ERROR";
    throw error;
  }

  const payload = { ...validationResult.data };
  if (payload.phone !== undefined && payload.phone !== null && payload.phone.trim() !== "") {
    payload.phone = normalizePhone(payload.phone);
  }
  return await supplierRepo.updateSupplier(businessId, supplierId, payload);
};

const deleteSupplier = async (businessId, supplierId) => {
  return await supplierRepo.deleteSupplier(businessId, supplierId);
};

const restoreSupplier = async (businessId, supplierId) => {
  return await supplierRepo.restoreSupplier(businessId, supplierId);
};

const { withTransaction } = require("../utils/transaction");

// ── Phase 6 - Task T39: Supplier Ledger Transaction Log Methods ───────────

const getSupplierLedger = async (businessId, supplierId, pagination) => {
  return await supplierLedgerRepo.getSupplierLedger(businessId, supplierId, pagination);
};

const recordPurchaseCredit = async (businessId, creditData) => {
  return await withTransaction(async (session) => {
    return await supplierLedgerRepo.recordPurchaseCredit({ ...creditData, businessId }, session);
  });
};

const recordSupplierPayment = async (businessId, paymentData) => {
  return await withTransaction(async (session) => {
    return await supplierLedgerRepo.recordSupplierPayment({ ...paymentData, businessId }, session);
  });
};

const appendLedgerEntry = async (businessId, entryData) => {
  return await withTransaction(async (session) => {
    return await supplierLedgerRepo.appendLedgerEntry({ ...entryData, businessId }, session);
  });
};

const getSupplierOutstanding = async (businessId, supplierId) => {
  return await supplierLedgerRepo.getSupplierOutstanding(businessId, supplierId);
};

const getBusinessPayablesSummary = async (businessId, limit) => {
  return await supplierLedgerRepo.getBusinessPayablesSummary(businessId, limit);
};

const getBusinessPayablesTotals = async (businessId) => {
  return await supplierLedgerRepo.getBusinessPayablesTotals(businessId);
};

// ── Phase 6 - Task T41: Supplier 360° Management Center Summary ───────────

const getSupplier360Summary = async (businessId, supplierId) => {
  return await supplierRepo.getSupplier360Summary(businessId, supplierId);
};

module.exports = {
  createSupplier,
  getSuppliers,
  searchSuppliers,
  getSupplierById,
  getSupplierByPhone,
  getSupplierSummary,
  updateSupplier,
  deleteSupplier,
  restoreSupplier,
  getSupplierLedger,
  recordPurchaseCredit,
  recordSupplierPayment,
  appendLedgerEntry,
  getSupplierOutstanding,
  getBusinessPayablesSummary,
  getBusinessPayablesTotals,
  getSupplier360Summary,
};


