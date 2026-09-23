const customerRepo = require("../repositories/customer.repository");
const customerLedgerRepo = require("../repositories/customerLedger.repository");
const { normalizePhone } = require("../utils/phone");
const mongoose = require("mongoose");

/**
 * Phase 5 - Task T32: Customer Service Layer
 * Coordinates customer CRUD operations, canonical phone normalization (+91), search, and settlements.
 */

const createCustomer = async (businessId, customerData) => {
  const payload = { ...customerData };
  if (payload.phone) {
    payload.phone = normalizePhone(payload.phone);
  }
  return await customerRepo.createCustomer(businessId, payload);
};

const getCustomers = async (businessId, filters, pagination) => {
  const queryFilters = { ...filters };
  if (queryFilters.phone) {
    queryFilters.phone = normalizePhone(queryFilters.phone);
  }
  return await customerRepo.findCustomers(businessId, queryFilters, pagination);
};

const searchCustomers = async (businessId, queryStr, limit) => {
  return await customerRepo.searchCustomers(businessId, queryStr, limit);
};

const getCustomerById = async (businessId, customerId) => {
  return await customerRepo.findCustomerById(businessId, customerId);
};

const getCustomerByPhone = async (businessId, rawPhone) => {
  const canonicalPhone = normalizePhone(rawPhone);
  return await customerRepo.findCustomerByPhone(businessId, canonicalPhone);
};

const updateCustomer = async (businessId, customerId, updateData) => {
  const payload = { ...updateData };
  if (payload.phone !== undefined && payload.phone !== null && payload.phone.trim() !== "") {
    payload.phone = normalizePhone(payload.phone);
  }
  return await customerRepo.updateCustomer(businessId, customerId, payload);
};

const deleteCustomer = async (businessId, customerId) => {
  return await customerRepo.deleteCustomer(businessId, customerId);
};

const restoreCustomer = async (businessId, customerId) => {
  return await customerRepo.restoreCustomer(businessId, customerId);
};

const getCustomerLedger = async (businessId, customerId, pagination) => {
  return await customerLedgerRepo.getCustomerLedger(businessId, customerId, pagination);
};

const getCustomerOutstanding = async (businessId, customerId) => {
  return await customerLedgerRepo.getCustomerOutstanding(businessId, customerId);
};

const getBusinessOutstandingSummary = async (businessId, limit) => {
  return await customerLedgerRepo.getBusinessOutstandingSummary(businessId, limit);
};

const getBusinessOutstandingTotals = async (businessId) => {
  return await customerLedgerRepo.getBusinessOutstandingTotals(businessId);
};

const recordCustomerPayment = async (businessId, customerId, paymentData, user = {}) => {
  const isOnlineDb = mongoose.connection.readyState === 1;

  if (isOnlineDb) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const result = await customerLedgerRepo.recordPaymentSettlement(
        {
          businessId,
          customerId,
          ...paymentData,
          createdBy: user.id || null,
          createdByName: user.fullName || "Cashier",
        },
        session
      );
      await session.commitTransaction();
      return result;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  return await customerLedgerRepo.recordPaymentSettlement({
    businessId,
    customerId,
    ...paymentData,
    createdBy: user.id || null,
    createdByName: user.fullName || "Cashier",
  });
};

const appendLedgerEntry = async (businessId, customerId, entryData, user = {}) => {
  const isOnlineDb = mongoose.connection.readyState === 1;

  if (isOnlineDb) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const result = await customerLedgerRepo.appendLedgerEntry(
        {
          businessId,
          customerId,
          ...entryData,
          createdBy: user.id || null,
          createdByName: user.fullName || "Merchant",
        },
        session
      );
      await session.commitTransaction();
      return result;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  return await customerLedgerRepo.appendLedgerEntry({
    businessId,
    customerId,
    ...entryData,
    createdBy: user.id || null,
    createdByName: user.fullName || "Merchant",
  });
};

module.exports = {
  createCustomer,
  getCustomers,
  searchCustomers,
  getCustomerById,
  getCustomerByPhone,
  updateCustomer,
  deleteCustomer,
  restoreCustomer,
  getCustomerLedger,
  appendLedgerEntry,
  getCustomerOutstanding,
  getBusinessOutstandingSummary,
  getBusinessOutstandingTotals,
  recordCustomerPayment,
};
