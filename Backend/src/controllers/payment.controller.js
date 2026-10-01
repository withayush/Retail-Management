const paymentService = require("../services/payment.service");

/**
 * Phase 4 - Task T28: Payment Controller Layer
 */

const recordPayment = async (req, res, next) => {
  try {
    const invoiceId = req.params.invoiceId || req.params.id || req.body.invoiceId;
    const result = await paymentService.recordPayment(req.businessId, {
      ...req.body,
      invoiceId,
      createdBy: req.user?.accountId,
      createdByName: req.account?.fullName || "Staff",
    });

    return res.status(201).json({
      success: true,
      message: `Payment of ₹${result.payment.amount} recorded successfully for Invoice #${result.invoice.invoiceNumber}.`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getPayments = async (req, res, next) => {
  try {
    const { invoiceId, customerId, method, status, startDate, endDate, search, page, limit } = req.query;

    const result = await paymentService.getPayments(
      req.businessId,
      { invoiceId, customerId, method, status, startDate, endDate, search },
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

const getPaymentsByInvoice = async (req, res, next) => {
  try {
    const invoiceId = req.params.invoiceId || req.params.id;
    const payments = await paymentService.getPaymentsByInvoiceId(req.businessId, invoiceId);

    return res.status(200).json({
      success: true,
      data: payments,
      count: payments.length,
    });
  } catch (error) {
    next(error);
  }
};

const getPaymentSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const summary = await paymentService.getPaymentSummary(req.businessId, { startDate, endDate });

    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  recordPayment,
  getPayments,
  getPaymentsByInvoice,
  getPaymentSummary,
};
