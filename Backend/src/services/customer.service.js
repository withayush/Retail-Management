const customerRepo = require("../repositories/customer.repository");
const customerLedgerRepo = require("../repositories/customerLedger.repository");
const mongoose = require("mongoose");

/**
 * Customer Service Layer
 * Coordinates customer operations with transaction session support.
 */

const createCustomer = async (businessId, customerData) => {
  return await customerRepo.createCustomer(businessId, customerData);
};

const getCustomers = async (businessId, filters, pagination) => {
  return await customerRepo.findCustomers(businessId, filters, pagination);
};

const getCustomerById = async (businessId, customerId) => {
  return await customerRepo.findCustomerById(businessId, customerId);
};

const updateCustomer = async (businessId, customerId, updateData) => {
  return await customerRepo.updateCustomer(businessId, customerId, updateData);
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

module.exports = {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  getCustomerLedger,
  getCustomerOutstanding,
  getBusinessOutstandingSummary,
  getBusinessOutstandingTotals,
  recordCustomerPayment,
};
