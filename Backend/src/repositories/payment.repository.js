const Payment = require("../models/payment.model");
const Invoice = require("../models/invoice.model");
const Customer = require("../models/customer.model");
const mongoose = require("mongoose");

/**
 * Phase 4 - Task T28: Payment Recording Repository Layer
 * Manages atomic payment entries, multi-tranche reconciliations, and invoice status updates.
 */

const recordPayment = async (businessId, paymentData, session = null) => {
  const {
    invoiceId,
    amount,
    method = "CASH",
    referenceId = null,
    notes = "",
    status = "SUCCESS",
    createdBy = null,
    createdByName = "",
  } = paymentData;

  const sessionOpt = session ? { session } : {};

  // 1. Verify that Invoice exists for this business
  const invoice = await Invoice.findOne({ _id: invoiceId, businessId }).session(session);
  if (!invoice) {
    const error = new Error("Invoice not found in this business.");
    error.statusCode = 404;
    error.code = "INVOICE_NOT_FOUND";
    throw error;
  }

  if (invoice.status === "CANCELLED") {
    const error = new Error("Cannot record payment for a cancelled invoice.");
    error.statusCode = 400;
    error.code = "INVOICE_CANCELLED";
    throw error;
  }

  const numAmount = Math.round(Number(amount) * 100) / 100;
  if (isNaN(numAmount) || numAmount <= 0) {
    const error = new Error("Payment amount must be greater than 0.");
    error.statusCode = 400;
    error.code = "INVALID_AMOUNT";
    throw error;
  }

  // 2. Create the Payment record (T28)
  const [createdPayment] = await Payment.create(
    [
      {
        businessId,
        invoiceId: invoice._id,
        customerId: invoice.customerId || null,
        amount: numAmount,
        method,
        referenceId: referenceId?.trim() || null,
        status,
        notes: notes?.trim() || "",
        createdBy,
        createdByName,
      },
    ],
    sessionOpt
  );

  // 3. Reconcile all payments for this invoice
  // Non-credit successful payments count towards paidAmount
  const allPayments = await Payment.find({
    businessId,
    invoiceId: invoice._id,
    status: "SUCCESS",
    method: { $nin: ["CREDIT", "CREDIT_UDHAR"] },
  }).session(session);

  const totalCollected = allPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const roundedPaid = Math.round(totalCollected * 100) / 100;
  const roundedDue = Math.max(0, Math.round((invoice.total - roundedPaid) * 100) / 100);

  let newPaymentStatus = "PENDING";
  if (roundedPaid >= invoice.total) {
    newPaymentStatus = "PAID";
  } else if (roundedPaid > 0) {
    newPaymentStatus = "PARTIAL";
  }

  // Update Invoice state
  invoice.paidAmount = roundedPaid;
  invoice.dueAmount = roundedDue;
  invoice.paymentStatus = newPaymentStatus;
  await invoice.save(sessionOpt);

  // 4. Update Customer Udhar/Balance if linked to a registered customer
  if (invoice.customerId && method !== "CREDIT" && method !== "CREDIT_UDHAR") {
    try {
      await Customer.findOneAndUpdate(
        { _id: invoice.customerId, businessId },
        {
          $inc: { currentBalance: -numAmount },
          $set: { lastPaymentDate: new Date() },
        },
        sessionOpt
      );
    } catch (custErr) {
      console.warn("[CustomerBalanceSync] Warning updating customer balance:", custErr.message);
    }
  }

  return {
    payment: createdPayment,
    invoice: {
      id: invoice._id,
      invoiceNumber: invoice.invoiceNumber,
      total: invoice.total,
      paidAmount: invoice.paidAmount,
      dueAmount: invoice.dueAmount,
      paymentStatus: invoice.paymentStatus,
    },
  };
};

const findPaymentsByInvoiceId = async (businessId, invoiceId) => {
  return await Payment.find({ businessId, invoiceId })
    .populate("createdBy", "fullName email")
    .sort({ createdAt: 1 });
};

const findPayments = async (businessId, filters = {}, pagination = { page: 1, limit: 20 }) => {
  const query = { businessId };

  if (filters.invoiceId) {
    query.invoiceId = filters.invoiceId;
  }

  if (filters.customerId) {
    query.customerId = filters.customerId;
  }

  if (filters.method && filters.method !== "ALL") {
    query.method = filters.method.toUpperCase();
  }

  if (filters.status && filters.status !== "ALL") {
    query.status = filters.status.toUpperCase();
  }

  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
    if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
  }

  if (filters.search && filters.search.trim()) {
    const term = filters.search.trim();
    query.$or = [
      { referenceId: { $regex: term, $options: "i" } },
      { notes: { $regex: term, $options: "i" } },
      { createdByName: { $regex: term, $options: "i" } },
    ];
  }

  const page = Math.max(1, parseInt(pagination.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(pagination.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const [payments, total] = await Promise.all([
    Payment.find(query)
      .populate("invoiceId", "invoiceNumber total paidAmount dueAmount customerName")
      .populate("customerId", "name phone currentBalance")
      .populate("createdBy", "fullName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Payment.countDocuments(query),
  ]);

  return {
    data: payments,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

const getPaymentSummary = async (businessId, filters = {}) => {
  const query = { businessId, status: "SUCCESS" };

  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
    if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
  }

  const payments = await Payment.find(query);

  let totalCollected = 0;
  let cashTotal = 0;
  let upiTotal = 0;
  let cardTotal = 0;
  let creditTotal = 0;
  let otherTotal = 0;

  for (const p of payments) {
    const amt = p.amount || 0;
    if (p.method === "CASH") cashTotal += amt;
    else if (p.method === "UPI") upiTotal += amt;
    else if (p.method === "CARD") cardTotal += amt;
    else if (p.method === "CREDIT" || p.method === "CREDIT_UDHAR") creditTotal += amt;
    else otherTotal += amt;

    if (p.method !== "CREDIT" && p.method !== "CREDIT_UDHAR") {
      totalCollected += amt;
    }
  }

  return {
    totalCollected: Math.round(totalCollected * 100) / 100,
    cashTotal: Math.round(cashTotal * 100) / 100,
    upiTotal: Math.round(upiTotal * 100) / 100,
    cardTotal: Math.round(cardTotal * 100) / 100,
    creditTotal: Math.round(creditTotal * 100) / 100,
    otherTotal: Math.round(otherTotal * 100) / 100,
    totalTransactions: payments.length,
  };
};

module.exports = {
  recordPayment,
  findPaymentsByInvoiceId,
  findPayments,
  getPaymentSummary,
};
