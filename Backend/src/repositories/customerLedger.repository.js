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

  // 5. Append Ledger Entry (Phase 5 - Task T33: Customer Ledger Transaction Log)
  const resolvedNotes = notes?.trim() || `Credit sale against Invoice #${invoiceNumber || "N/A"}`;
  const ledgerEntry = {
    customerId: customer._id,
    saleId: invoiceId || null,
    invoiceId: invoiceId || null,
    invoiceNumber: invoiceNumber || "",
    entryType: "SALE_CREDIT",
    creditAmount: numUnpaid,
    debitAmount: 0,
    balance: potentialBalance,
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
    saleId: null,
    invoiceId: null,
    invoiceNumber: "",
    entryType: "PAYMENT_RECEIVED",
    creditAmount: 0,
    debitAmount: numAmount,
    balance: newBalance,
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
 * Task T33: Append a manual or adjustment ledger entry (Append-only correction/migration).
 */
const appendLedgerEntry = async (entryData, session = null) => {
  const {
    businessId,
    customerId,
    entryType = "ADJUSTMENT",
    creditAmount = 0,
    debitAmount = 0,
    saleId = null,
    invoiceNumber = "",
    notes = "",
    createdBy = null,
    createdByName = "",
  } = entryData;

  const sessionOpt = session ? { session } : {};
  const numCredit = Math.round(Math.max(0, Number(creditAmount) || 0) * 100) / 100;
  const numDebit = Math.round(Math.max(0, Number(debitAmount) || 0) * 100) / 100;

  if (numCredit === 0 && numDebit === 0) {
    const error = new Error("Either creditAmount or debitAmount must be greater than 0.");
    error.statusCode = 400;
    error.code = "INVALID_LEDGER_AMOUNTS";
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
  const potentialBalance = Math.round(Math.max(0, currentBal + numCredit - numDebit) * 100) / 100;

  if (numCredit > 0 && customer.creditLimit > 0 && potentialBalance > customer.creditLimit) {
    const error = new Error(
      `Credit limit exceeded for customer '${customer.name}'. Limit: ₹${customer.creditLimit}, Current Debt: ₹${currentBal}, Requested: ₹${numCredit}`
    );
    error.statusCode = 400;
    error.code = "CREDIT_LIMIT_EXCEEDED";
    throw error;
  }

  const ledgerEntry = {
    customerId: customer._id,
    saleId: saleId || null,
    invoiceId: saleId || null,
    invoiceNumber: invoiceNumber || "",
    entryType,
    creditAmount: numCredit,
    debitAmount: numDebit,
    balance: potentialBalance,
    balanceSnapshot: potentialBalance,
    notes: notes?.trim() || `Manual ledger entry (${entryType})`,
    createdBy,
    createdByName,
  };

  ledgerDoc.entries.push(ledgerEntry);
  ledgerDoc.balance = potentialBalance;
  await ledgerDoc.save(sessionOpt);

  customer.currentBalance = potentialBalance;
  if (numCredit > 0) customer.lastPurchaseDate = new Date();
  if (numDebit > 0) customer.lastPaymentDate = new Date();
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
    newBalance: potentialBalance,
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

  // Aggregates for Sub-Ledger
  let totalCredits = 0; // Total Udhaar Sales (+Credit)
  let totalDebits = 0;  // Total Repayments (-Debit)
  for (const e of allEntries) {
    const credit = e.creditAmount !== undefined ? e.creditAmount : (e.entryType === "SALE_CREDIT" ? e.debitAmount : 0);
    const debit = e.debitAmount !== undefined && e.creditAmount !== undefined ? e.debitAmount : (e.entryType === "PAYMENT_RECEIVED" ? e.creditAmount : 0);
    totalCredits += credit || 0;
    totalDebits += debit || 0;
  }

  const formattedEntries = paginatedEntries.map((e) => {
    const credit = e.creditAmount !== undefined ? e.creditAmount : (e.entryType === "SALE_CREDIT" ? e.debitAmount : 0);
    const debit = e.debitAmount !== undefined && e.creditAmount !== undefined ? e.debitAmount : (e.entryType === "PAYMENT_RECEIVED" ? e.creditAmount : 0);
    const bal = e.balance !== undefined ? e.balance : (e.balanceSnapshot !== undefined ? e.balanceSnapshot : 0);

    return {
      _id: e._id,
      customerId: e.customerId,
      saleId: e.saleId || e.invoiceId || null,
      invoiceId: e.invoiceId || e.saleId || null,
      invoiceNumber: e.invoiceNumber || "",
      entryType: e.entryType,
      creditAmount: credit,
      debitAmount: debit,
      balance: bal,
      balanceSnapshot: bal,
      notes: e.notes || "",
      createdAt: e.createdAt,
      createdByName: e.createdByName || "",
    };
  });

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
      totalCreditSales: Math.round(totalCredits * 100) / 100,
      totalPaymentsReceived: Math.round(totalDebits * 100) / 100,
      totalTransactions: allEntries.length,
    },
    entries: formattedEntries,
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

/**
 * Phase 5 - Task T35: Customer Credit Payment History
 * Fetches dedicated, chronological history of all credit repayments & settlements made by a customer toward past balances.
 */
const getCustomerPaymentHistory = async (businessId, customerId, filters = {}) => {
  const customer = await Customer.findOne({ _id: customerId, businessId });
  if (!customer) {
    const error = new Error("Customer not found in this business.");
    error.statusCode = 404;
    error.code = "CUSTOMER_NOT_FOUND";
    throw error;
  }

  const ledgerDoc = await CustomerLedger.findOne({ businessId, customerId });
  const allEntries = ledgerDoc ? [...ledgerDoc.entries] : [];

  // Filter strictly to repayment / debit settlement events (T35 scope)
  const paymentEntries = allEntries.filter((e) => {
    if (e.entryType === "PAYMENT_SETTLEMENT" || e.entryType === "PAYMENT_RECEIVED") {
      return true;
    }
    // Also include debit payments that reduce debt if not explicitly typed
    const debit = e.debitAmount !== undefined ? e.debitAmount : (e.entryType === "PAYMENT_RECEIVED" ? e.creditAmount : 0);
    return debit > 0 && e.entryType !== "SALE_CREDIT";
  });

  // Apply optional filters
  let filtered = paymentEntries;

  // Date range filter
  if (filters.from) {
    const fromDate = new Date(filters.from);
    if (!isNaN(fromDate.getTime())) {
      filtered = filtered.filter((p) => new Date(p.createdAt) >= fromDate);
    }
  }
  if (filters.to) {
    const toDate = new Date(filters.to);
    if (!isNaN(toDate.getTime())) {
      // Set to end of day if only date is passed
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((p) => new Date(p.createdAt) <= toDate);
    }
  }

  // Payment method filter (e.g. CASH, UPI, CARD, BANK)
  if (filters.method || filters.paymentMethod) {
    const targetMethod = (filters.method || filters.paymentMethod).toUpperCase();
    filtered = filtered.filter((p) => (p.paymentMethod || "CASH").toUpperCase() === targetMethod);
  }

  // Sort descending (newest repayments first)
  filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Pagination
  const page = Math.max(1, parseInt(filters.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(filters.limit, 10) || 50));
  const skip = (page - 1) * limit;

  const paginated = filtered.slice(skip, skip + limit);

  // Compute aggregated summary metrics
  let totalPaid = 0;
  const methodBreakdown = {};
  for (const p of filtered) {
    const amt = p.debitAmount !== undefined && p.creditAmount !== undefined ? p.debitAmount : (p.entryType === "PAYMENT_RECEIVED" ? p.creditAmount : p.amount || 0);
    totalPaid += amt || 0;
    const mode = (p.paymentMethod || "CASH").toUpperCase();
    methodBreakdown[mode] = Math.round(((methodBreakdown[mode] || 0) + amt) * 100) / 100;
  }
  totalPaid = Math.round(totalPaid * 100) / 100;
  const avgPayment = filtered.length > 0 ? Math.round((totalPaid / filtered.length) * 100) / 100 : 0;

  // Format payment records
  const formattedPayments = paginated.map((p) => {
    const amt = p.debitAmount !== undefined && p.creditAmount !== undefined ? p.debitAmount : (p.entryType === "PAYMENT_RECEIVED" ? p.creditAmount : p.amount || 0);
    const bal = p.balance !== undefined ? p.balance : (p.balanceSnapshot !== undefined ? p.balanceSnapshot : 0);

    return {
      _id: p._id,
      paymentId: p._id,
      amount: amt,
      paymentMethod: p.paymentMethod || "CASH",
      date: p.createdAt,
      createdAt: p.createdAt,
      balanceAfter: bal,
      balanceSnapshot: bal,
      invoiceId: p.saleId || p.invoiceId || null,
      invoiceNumber: p.invoiceNumber || "",
      referenceId: p.idempotencyKey || "",
      notes: p.notes || "",
      recordedBy: p.createdByName || "Cashier",
    };
  });

  return {
    customer: {
      id: customer._id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      currentBalance: customer.currentBalance,
      creditLimit: customer.creditLimit,
      lastPaymentDate: customer.lastPaymentDate,
    },
    summary: {
      totalAmountPaid: totalPaid,
      totalPaymentsCount: filtered.length,
      averagePaymentAmount: avgPayment,
      lastPaymentDate: filtered.length > 0 ? filtered[0].createdAt : customer.lastPaymentDate,
      methodBreakdown,
    },
    payments: formattedPayments,
    pagination: {
      total: filtered.length,
      page,
      limit,
      totalPages: Math.ceil(filtered.length / limit) || 1,
    },
  };
};

module.exports = {
  recordSaleCredit,
  recordPaymentSettlement,
  appendLedgerEntry,
  getCustomerLedger,
  getCustomerOutstanding,
  getBusinessOutstandingSummary,
  getBusinessOutstandingTotals,
  getCustomerPaymentHistory,
};
