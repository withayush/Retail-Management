const supplierRepo = require("../repositories/supplier.repository");
const { normalizePhone } = require("../utils/phone");

/**
 * Phase 6 - Task T37: Supplier Service Layer
 * Coordinates supplier master data operations, phone normalization, validation, and multi-tenant scoping.
 */

const createSupplier = async (businessId, supplierData) => {
  const payload = { ...supplierData };
  if (payload.phone) {
    payload.phone = normalizePhone(payload.phone);
  }
  return await supplierRepo.createSupplier(businessId, payload);
};

const getSuppliers = async (businessId, options) => {
  return await supplierRepo.listSuppliers(businessId, options);
};

const getSupplierById = async (businessId, supplierId) => {
  return await supplierRepo.findSupplierById(businessId, supplierId);
};

const getSupplierByPhone = async (businessId, rawPhone) => {
  const canonicalPhone = normalizePhone(rawPhone);
  return await supplierRepo.findSupplierByPhone(businessId, canonicalPhone);
};

const updateSupplier = async (businessId, supplierId, updateData) => {
  const payload = { ...updateData };
  if (payload.phone !== undefined && payload.phone !== null && payload.phone.trim() !== "") {
    payload.phone = normalizePhone(payload.phone);
  }
  return await supplierRepo.updateSupplier(businessId, supplierId, payload);
};

const deleteSupplier = async (businessId, supplierId) => {
  return await supplierRepo.deleteSupplier(businessId, supplierId);
};

module.exports = {
  createSupplier,
  getSuppliers,
  getSupplierById,
  getSupplierByPhone,
  updateSupplier,
  deleteSupplier,
};
