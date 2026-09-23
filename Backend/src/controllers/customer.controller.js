const customerService = require("../services/customer.service");
const {
  createCustomerSchema,
  updateCustomerSchema,
  recordCustomerPaymentSchema,
} = require("../validations/customer.validation");

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
    const { search, hasDebt, page, limit } = req.query;
    const result = await customerService.getCustomers(businessId, { search, hasDebt }, { page, limit });

    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
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
    const debtors = await customerService.getBusinessOutstandingSummary(businessId, limit);

    return res.status(200).json({
      success: true,
      data: debtors,
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

module.exports = {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  getCustomerOutstanding,
  getBusinessOutstandingSummary,
  getBusinessOutstandingTotals,
  getCustomerLedger,
  recordCustomerPayment,
};
