const customerService = require("../services/customer.service");
const {
  createCustomerSchema,
  updateCustomerSchema,
  recordCustomerPaymentSchema,
  appendLedgerEntrySchema,
} = require("../validations/customer.validation");

/**
 * Phase 5 - Task T32: Customer Controller Layer
 */

const createCustomer = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const validatedData = createCustomerSchema.parse(req.body);
    const customer = await customerService.createCustomer(businessId, validatedData);

    return res.status(201).json({
      success: true,
      message: "Customer registered successfully.",
      data: customer,
    });
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: error.errors[0]?.message || "Validation failed",
        errors: error.errors,
      });
    }
    next(error);
  }
};

const getCustomers = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const { search, phone, hasDebt, status, page, limit } = req.query;
    const result = await customerService.getCustomers(
      businessId,
      { search, phone, hasDebt, status },
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

const searchCustomers = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const { q = "", limit = 10 } = req.query;
    const customers = await customerService.searchCustomers(businessId, q, parseInt(limit, 10) || 10);

    return res.status(200).json({
      success: true,
      data: customers,
    });
  } catch (error) {
    next(error);
  }
};

const getCustomerById = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const { id } = req.params;
    const customer = await customerService.getCustomerById(businessId, id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

const getCustomerByPhone = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const { phone } = req.params;
    const customer = await customerService.getCustomerByPhone(businessId, phone);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found with this phone number.",
      });
    }

    return res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

const updateCustomer = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const { id } = req.params;
    const validatedData = updateCustomerSchema.parse(req.body);
    const updated = await customerService.updateCustomer(businessId, id, validatedData);

    return res.status(200).json({
      success: true,
      message: "Customer updated successfully.",
      data: updated,
    });
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: error.errors[0]?.message || "Validation failed",
        errors: error.errors,
      });
    }
    next(error);
  }
};

const deleteCustomer = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const { id } = req.params;
    const deleted = await customerService.deleteCustomer(businessId, id);

    return res.status(200).json({
      success: true,
      message: "Customer archived (deactivated) successfully.",
      data: deleted,
    });
  } catch (error) {
    next(error);
  }
};

const restoreCustomer = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const { id } = req.params;
    const restored = await customerService.restoreCustomer(businessId, id);

    return res.status(200).json({
      success: true,
      message: "Customer restored to active registry successfully.",
      data: restored,
    });
  } catch (error) {
    next(error);
  }
};

const getCustomerOutstanding = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const { id } = req.params;
    const outstanding = await customerService.getCustomerOutstanding(businessId, id);

    return res.status(200).json({
      success: true,
      data: outstanding,
    });
  } catch (error) {
    next(error);
  }
};

const getBusinessOutstandingSummary = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const { limit } = req.query;
    const summary = await customerService.getBusinessOutstandingSummary(businessId, limit);

    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

const getBusinessOutstandingTotals = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const totals = await customerService.getBusinessOutstandingTotals(businessId);

    return res.status(200).json({
      success: true,
      data: totals,
    });
  } catch (error) {
    next(error);
  }
};

const getCustomerLedger = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const { id } = req.params;
    const { page, limit } = req.query;
    const ledger = await customerService.getCustomerLedger(businessId, id, { page, limit });

    return res.status(200).json({
      success: true,
      data: ledger,
    });
  } catch (error) {
    next(error);
  }
};

const recordCustomerPayment = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const { id } = req.params;
    const validatedData = recordCustomerPaymentSchema.parse(req.body);
    const user = { id: req.user?.id, fullName: req.user?.fullName };

    const result = await customerService.recordCustomerPayment(businessId, id, validatedData, user);

    return res.status(200).json({
      success: true,
      message: `Payment of ₹${validatedData.amount} recorded successfully. New balance: ₹${result.newBalance}`,
      data: result,
    });
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: error.errors[0]?.message || "Validation failed",
        errors: error.errors,
      });
    }
    next(error);
  }
};

const appendLedgerEntry = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const { id } = req.params;
    const validatedData = appendLedgerEntrySchema.parse(req.body);
    const user = { id: req.user?.id, fullName: req.user?.fullName };

    const result = await customerService.appendLedgerEntry(businessId, id, validatedData, user);

    return res.status(201).json({
      success: true,
      message: `Ledger entry (${validatedData.entryType}) recorded successfully. New balance: ₹${result.newBalance}`,
      data: result,
    });
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: error.errors[0]?.message || "Validation failed",
        errors: error.errors,
      });
    }
    next(error);
  }
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
  getCustomerOutstanding,
  getBusinessOutstandingSummary,
  getBusinessOutstandingTotals,
  getCustomerLedger,
  recordCustomerPayment,
  appendLedgerEntry,
};
