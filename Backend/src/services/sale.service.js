const mongoose = require("mongoose");
const saleRepo = require("../repositories/sale.repository");
const inventoryService = require("./inventory.service");

/**
 * Phase 4 - Tasks T23 & T24: Sale & Line Items Service Layer
 * Multi-tenant business logic for sales transactions, line item snapshots, gross profit, and inventory reduction.
 */

const createSale = async (businessId, payload) => {
  if (!mongoose.Types.ObjectId.isValid(businessId)) {
    const error = new Error("Invalid business ID.");
    error.statusCode = 400;
    error.code = "INVALID_BUSINESS_ID";
    throw error;
  }

  // Validate customerId if provided
  if (payload.customerId) {
    if (!mongoose.Types.ObjectId.isValid(payload.customerId)) {
      const error = new Error("Invalid customer ID.");
      error.statusCode = 400;
      error.code = "INVALID_CUSTOMER_ID";
      throw error;
    }
  }

  // Validate items if provided
  if (payload.items && Array.isArray(payload.items)) {
    for (const item of payload.items) {
      if (!item.productId || !mongoose.Types.ObjectId.isValid(item.productId)) {
        const error = new Error("Invalid product ID in sale items.");
        error.statusCode = 400;
        error.code = "INVALID_PRODUCT_ID";
        throw error;
      }
    }
  }

  // Transaction Session Management (Task T25 Atomic POS Checkout)
  let session = null;
  try {
    session = await mongoose.startSession();
  } catch {
    session = null;
  }

  if (session) {
    try {
      let result;
      await session.withTransaction(async () => {
        result = await saleRepo.createSale(businessId, payload, session);
      });
      return result;
    } finally {
      await session.endSession();
    }
  } else {
    return await saleRepo.createSale(businessId, payload, null);
  }
};

const getSales = async (businessId, filters = {}, pagination = {}) => {
  if (!mongoose.Types.ObjectId.isValid(businessId)) {
    const error = new Error("Invalid business ID.");
    error.statusCode = 400;
    error.code = "INVALID_BUSINESS_ID";
    throw error;
  }

  return await saleRepo.findSales(businessId, filters, pagination);
};

const getSalesSummary = async (businessId) => {
  if (!mongoose.Types.ObjectId.isValid(businessId)) {
    const error = new Error("Invalid business ID.");
    error.statusCode = 400;
    error.code = "INVALID_BUSINESS_ID";
    throw error;
  }

  return await saleRepo.getSalesSummary(businessId);
};

const getSaleById = async (businessId, saleId) => {
  if (!mongoose.Types.ObjectId.isValid(businessId) || !mongoose.Types.ObjectId.isValid(saleId)) {
    const error = new Error("Invalid ID format.");
    error.statusCode = 400;
    error.code = "INVALID_ID";
    throw error;
  }

  const sale = await saleRepo.findSaleById(businessId, saleId);
  if (!sale) {
    const error = new Error("Sale transaction not found.");
    error.statusCode = 404;
    error.code = "SALE_NOT_FOUND";
    throw error;
  }

  return sale;
};

const getSaleItems = async (businessId, saleId) => {
  if (!mongoose.Types.ObjectId.isValid(businessId) || !mongoose.Types.ObjectId.isValid(saleId)) {
    const error = new Error("Invalid ID format.");
    error.statusCode = 400;
    error.code = "INVALID_ID";
    throw error;
  }

  return await saleRepo.findSaleItemsBySaleId(businessId, saleId);
};

const getGrossProfitReport = async (businessId, filters = {}) => {
  if (!mongoose.Types.ObjectId.isValid(businessId)) {
    const error = new Error("Invalid business ID.");
    error.statusCode = 400;
    error.code = "INVALID_BUSINESS_ID";
    throw error;
  }

  return await saleRepo.getGrossProfitReport(businessId, filters);
};

const getNextInvoiceNumber = async (businessId) => {
  if (!mongoose.Types.ObjectId.isValid(businessId)) {
    const error = new Error("Invalid business ID.");
    error.statusCode = 400;
    error.code = "INVALID_BUSINESS_ID";
    throw error;
  }

  return await saleRepo.getNextInvoiceNumber(businessId);
};

const updatePaymentStatus = async (businessId, saleId, payload) => {
  if (!mongoose.Types.ObjectId.isValid(businessId) || !mongoose.Types.ObjectId.isValid(saleId)) {
    const error = new Error("Invalid ID format.");
    error.statusCode = 400;
    error.code = "INVALID_ID";
    throw error;
  }

  return await saleRepo.updatePaymentStatus(businessId, saleId, payload);
};

module.exports = {
  createSale,
  getSales,
  getSalesSummary,
  getSaleById,
  getSaleItems,
  getGrossProfitReport,
  getNextInvoiceNumber,
  updatePaymentStatus,
};

