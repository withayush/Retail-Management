const mongoose = require("mongoose");
const paymentRepo = require("../repositories/payment.repository");

/**
 * Phase 4 - Task T28: Payment Recording Service Layer
 */

const recordPayment = async (businessId, payload) => {
  if (!mongoose.Types.ObjectId.isValid(businessId)) {
    const error = new Error("Invalid business ID.");
    error.statusCode = 400;
    error.code = "INVALID_BUSINESS_ID";
    throw error;
  }

  // Attempt database transaction
  let session = null;
  let useTransaction = false;

  try {
    session = await mongoose.startSession();
    session.startTransaction();
    useTransaction = true;
  } catch {
    session = null;
    useTransaction = false;
  }

  try {
    const result = await paymentRepo.recordPayment(businessId, payload, session);

    if (useTransaction && session) {
      await session.commitTransaction();
    }

    return result;
  } catch (error) {
    if (useTransaction && session) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

const getPaymentsByInvoiceId = async (businessId, invoiceId) => {
  if (!mongoose.Types.ObjectId.isValid(businessId) || !mongoose.Types.ObjectId.isValid(invoiceId)) {
    const error = new Error("Invalid ID format.");
    error.statusCode = 400;
    error.code = "INVALID_ID";
    throw error;
  }

  return await paymentRepo.findPaymentsByInvoiceId(businessId, invoiceId);
};

const getPayments = async (businessId, filters = {}, pagination = { page: 1, limit: 20 }) => {
  if (!mongoose.Types.ObjectId.isValid(businessId)) {
    const error = new Error("Invalid business ID.");
    error.statusCode = 400;
    error.code = "INVALID_BUSINESS_ID";
    throw error;
  }

  return await paymentRepo.findPayments(businessId, filters, pagination);
};

const getPaymentSummary = async (businessId, filters = {}) => {
  if (!mongoose.Types.ObjectId.isValid(businessId)) {
    const error = new Error("Invalid business ID.");
    error.statusCode = 400;
    error.code = "INVALID_BUSINESS_ID";
    throw error;
  }

  return await paymentRepo.getPaymentSummary(businessId, filters);
};

module.exports = {
  recordPayment,
  getPaymentsByInvoiceId,
  getPayments,
  getPaymentSummary,
};
