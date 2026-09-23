const { Customer, CustomerLedger } = require("../models/customer.model");
const Invoice = require("../models/invoice.model");
const mongoose = require("mongoose");

/**
 * Phase 4 - Task T29: Customer Credit Integration Engine Repository
 * Manages atomic ledger logging, credit limits, idempotency guards, and customer balance updates.
 */

/**
 * Routes an unpaid invoice balance into the Customer Outstanding Ledger.
 */
const recordSaleCredit = async (creditData, session = null) => {
  const {
    businessId,
    customerId,
    customerPhone,
    customerName,
    invoiceId,
    invoiceNumber,
    unpaidAmount,
    notes = "",
    createdBy = null,
    createdByName = "",
  } = creditData;

  const sessionOpt = session ? { session } : {};
  const numUnpaid = Math.round(Number(unpaidAmount) * 100) / 100;

  if (isNaN(numUnpaid) || numUnpaid <= 0) {
    return { skipped: true, reason: "No unpaid amount to record into credit ledger." };
  }

  // 1. Resolve Customer
  let customer = null;
  if (customerId) {
    customer = await Customer.findOne({ _id: customerId, businessId }).session(session);
  }
  if (!customer && customerPhone) {
    customer = await Customer.findOne({ phone: customerPhone.trim(), businessId }).session(session);
  }

  // If customer doesn't exist but we have name & phone, auto-create customer record
  if (!customer) {
    if (!customerPhone || !customerPhone.trim()) {
      const error = new Error("A registered customer or customer phone number is required for Credit / Udhaar sales.");
      error.statusCode = 400;
      error.code = "CUSTOMER_REQUIRED_FOR_CREDIT";
      throw error;
    }

    const [newCust] = await Customer.create(
      [
        {
          businessId,
          name: customerName?.trim() || "Walk-in Customer",
          phone: customerPhone.trim(),
          currentBalance: 0,
          creditLimit: 0,
        },
      ],
      sessionOpt
    );
    customer = newCust;
  }

  // 2. Idempotency Guard (Task T29 Duplicate Protection)
  const idempotencyKey = invoiceId ? `${invoiceId.toString()}_SALE_CREDIT` : null;

  let ledgerDoc = await CustomerLedger.findOne({ businessId, customerId: customer._id }).session(session);

  if (ledgerDoc && idempotencyKey) {
    const existingEntry = ledgerDoc.entries.find(
      (e) => e.idempotencyKey === idempotencyKey || (e.invoiceId && e.invoiceId.toString() === invoiceId.toString() && e.entryType === "SALE_CREDIT")
    );
    if (existingEntry) {
      return {
        success: true,
        alreadyProcessed: true,
        customer,
        ledgerEntry: existingEntry,
        currentBalance: customer.currentBalance,
      };
    }
  }

  // 3. Credit Limit Enforcement Guard
  const currentBal = Number(customer.currentBalance || 0);
  const potentialBalance = Math.round((currentBal + numUnpaid) * 100) / 100;

  if (customer.creditLimit > 0 && potentialBalance > customer.creditLimit) {
    const error = new Error(
      `Credit limit exceeded for customer '${customer.name}'. Limit: ₹${customer.creditLimit}, Current Debt: ₹${currentBal}, Requested: ₹${numUnpaid}`
    );
    error.statusCode = 400;
    error.code = "CREDIT_LIMIT_EXCEEDED";
    error.creditLimit = customer.creditLimit;
    error.currentBalance = currentBal;
    error.requestedCredit = numUnpaid;
    throw error;
  }

  // 4. Create Ledger Document if not exists
  if (!ledgerDoc) {
    const [newLedger] = await CustomerLedger.create(
      [
        {
          businessId,
          customerId: customer._id,
          customerName: customer.name,
          customerPhone: customer.phone,
          balance: 0,
          entries: [],
        },
      ],
      sessionOpt
    );
    ledgerDoc = newLedger;
  }

  // 5. Append Ledger Entry
  const resolvedNotes = notes?.trim() || `Credit sale against Invoice #${invoiceNumber || "N/A"}`;
  const ledgerEntry = {
    customerId: customer._id,
    invoiceId: invoiceId || null,
    invoiceNumber: invoiceNumber || "",
    entryType: "SALE_CREDIT",
    debitAmount: numUnpaid,
    creditAmount: 0,
    balanceSnapshot: potentialBalance,
    notes: resolvedNotes,
    idempotencyKey,
    createdBy,
    createdByName,
  };

  ledgerDoc.entries.push(ledgerEntry);
  ledgerDoc.balance = potentialBalance;
  ledgerDoc.customerName = customer.name;
  ledgerDoc.customerPhone = customer.phone;
  await ledgerDoc.save(sessionOpt);

  // 6. Update Customer Master State
  customer.currentBalance = potentialBalance;
  customer.lastPurchaseDate = new Date();
  customer.totalOrders = (customer.totalOrders || 0) + 1;
  customer.totalSpent = Math.round(((customer.totalSpent || 0) + numUnpaid) * 100) / 100;
  await customer.save(sessionOpt);

  return {
    success: true,
    customer: {
      id: customer._id,
      name: customer.name,
      phone: customer.phone,
      currentBalance: customer.currentBalance,
      creditLimit: customer.creditLimit,
    },
    ledgerEntry: ledgerDoc.entries[ledgerDoc.entries.length - 1],
    newBalance: potentialBalance,
  };
};

/**
 * Settle customer outstanding debt with a payment entry.
 */
const recordPaymentSettlement = async (paymentData, session = null) => {
  const {
    businessId,
    customerId,
    amount,
    method = "CASH",
    referenceId = null,
    notes = "",
    createdBy = null,
    createdByName = "",
  } = paymentData;

  const sessionOpt = session ? { session } : {};
  const numAmount = Math.round(Number(amount) * 100) / 100;

  if (isNaN(numAmount) || numAmount <= 0) {
    const error = new Error("Payment amount must be greater than 0.");
    error.statusCode = 400;
    error.code = "INVALID_AMOUNT";
    throw error;
  }

  const customer = await Customer.findOne({ _id: customerId, businessId }).session(session);
  if (!customer) {
    const error = new Error("Customer not found in this business.");
    error.statusCode = 404;
    error.code = "CUSTOMER_NOT_FOUND";
    throw error;
  }

  let ledgerDoc = await CustomerLedger.findOne({ businessId, customerId: customer._id }).session(session);
  if (!ledgerDoc) {
    const [newLedger] = await CustomerLedger.create(
      [
        {
          businessId,
          customerId: customer._id,
          customerName: customer.name,
          customerPhone: customer.phone,
          balance: customer.currentBalance || 0,
          entries: [],
        },
      ],
      sessionOpt
    );
    ledgerDoc = newLedger;
  }

  const currentBal = Number(customer.currentBalance || 0);
  const newBalance = Math.round(Math.max(0, currentBal - numAmount) * 100) / 100;

  const resolvedNotes = notes?.trim() || `Payment received via ${method}${referenceId ? ` (Ref: ${referenceId})` : ""}`;
  const ledgerEntry = {
    customerId: customer._id,
    entryType: "PAYMENT_RECEIVED",
    debitAmount: 0,
    creditAmount: numAmount,
    balanceSnapshot: newBalance,
    notes: resolvedNotes,
    createdBy,
    createdByName,
  };

  ledgerDoc.entries.push(ledgerEntry);
  ledgerDoc.balance = newBalance;
  await ledgerDoc.save(sessionOpt);

  customer.currentBalance = newBalance;
  customer.lastPaymentDate = new Date();
  await customer.save(sessionOpt);

  return {
    success: true,
    customer: {
      id: customer._id,
      name: customer.name,
      phone: customer.phone,
      currentBalance: customer.currentBalance,
    },
    ledgerEntry: ledgerDoc.entries[ledgerDoc.entries.length - 1],
    newBalance,
  };
};

/**
 * Retrieve full customer ledger history and balance statement.
 */
const getCustomerLedger = async (businessId, customerId, pagination = { page: 1, limit: 50 }) => {
  const customer = await Customer.findOne({ _id: customerId, businessId });
  if (!customer) {
    const error = new Error("Customer not found in this business.");
    error.statusCode = 404;
    error.code = "CUSTOMER_NOT_FOUND";
    throw error;
  }

  const ledgerDoc = await CustomerLedger.findOne({ businessId, customerId });
  const allEntries = ledgerDoc ? [...ledgerDoc.entries].reverse() : [];

  const page = Math.max(1, parseInt(pagination.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(pagination.limit, 10) || 50));
  const skip = (page - 1) * limit;

  const paginatedEntries = allEntries.slice(skip, skip + limit);

  // Aggregates
  let totalDebits = 0; // Total credit sales
  let totalCredits = 0; // Total settlements
  for (const e of allEntries) {
    totalDebits += e.debitAmount || 0;
    totalCredits += e.creditAmount || 0;
  }

  return {
    customer: {
      id: customer._id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      currentBalance: customer.currentBalance,
      creditLimit: customer.creditLimit,
      lastPaymentDate: customer.lastPaymentDate,
      lastPurchaseDate: customer.lastPurchaseDate,
    },
    summary: {
      currentOutstanding: customer.currentBalance,
      totalCreditSales: Math.round(totalDebits * 100) / 100,
      totalPaymentsReceived: Math.round(totalCredits * 100) / 100,
      totalTransactions: allEntries.length,
    },
    entries: paginatedEntries,
    pagination: {
      total: allEntries.length,
      page,
      limit,
      totalPages: Math.ceil(allEntries.length / limit) || 1,
    },
  };
};

/**
 * Get real-time outstanding balance for single customer.
 */
const getCustomerOutstanding = async (businessId, customerId) => {
  const customer = await Customer.findOne({ _id: customerId, businessId }).select(
    "name phone currentBalance creditLimit lastPaymentDate lastPurchaseDate"
  );
  if (!customer) {
    const error = new Error("Customer not found in this business.");
    error.statusCode = 404;
    error.code = "CUSTOMER_NOT_FOUND";
    throw error;
  }

  const availableCredit =
    customer.creditLimit > 0
      ? Math.max(0, Math.round((customer.creditLimit - customer.currentBalance) * 100) / 100)
      : null;

  return {
    customerId: customer._id,
    name: customer.name,
    phone: customer.phone,
    currentBalance: customer.currentBalance,
    creditLimit: customer.creditLimit,
    availableCredit,
    isLimitExceeded: customer.creditLimit > 0 && customer.currentBalance > customer.creditLimit,
    lastPaymentDate: customer.lastPaymentDate,
    lastPurchaseDate: customer.lastPurchaseDate,
  };
};

/**
 * Get business-wide outstanding debtor summary ordered by highest debt.
 */
const getBusinessOutstandingSummary = async (businessId, limit = 50) => {
  const customers = await Customer.find({
    businessId,
    currentBalance: { $gt: 0 },
  })
    .sort({ currentBalance: -1 })
    .limit(limit)
    .select("name phone currentBalance creditLimit lastPaymentDate lastPurchaseDate updatedAt");

  return customers;
};

/**
 * Get business-wide aggregate outstanding totals for dashboard widgets.
 */
const getBusinessOutstandingTotals = async (businessId) => {
  const customers = await Customer.find({ businessId, currentBalance: { $gt: 0 } }).select("currentBalance");

  const totalOutstanding = customers.reduce((sum, c) => sum + (c.currentBalance || 0), 0);

  return {
    totalOutstanding: Math.round(totalOutstanding * 100) / 100,
    debtorCustomersCount: customers.length,
  };
};

module.exports = {
  recordSaleCredit,
  recordPaymentSettlement,
  getCustomerLedger,
  getCustomerOutstanding,
  getBusinessOutstandingSummary,
  getBusinessOutstandingTotals,
};
