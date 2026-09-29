const mongoose = require("mongoose");
const { Supplier, SupplierLedger } = require("../models/supplier.model");

/**
 * Phase 6 - Task T39: Supplier Ledger Transaction Log Repository
 * 
 * Manages atomic supplier ledger logging, accounts payable debt tracking,
 * inventory delivery receipts vs. supplier payment disbursements, and append-only auditability.
 * 
 * Financial Equation (Inverted Symmetrical Counterpart to Customer T33):
 * - Supplier Delivers Inventory on Credit (+InvoiceValue) -> Business owes Supplier (Payable Increases)
 * - Business Disburses Payment to Supplier (-PaymentAmount) -> Business owes Supplier Less (Payable Decreases)
 * - Authoritative Running Balance = Previous Balance + InvoiceValue - PaymentAmount
 */

/**
 * Routes an inventory delivery / procurement purchase credit into the Supplier Accounts Payable Ledger.
 */
const recordPurchaseCredit = async (creditData, session = null) => {
  const {
    businessId,
    supplierId,
    supplierCompany,
    supplierPhone,
    purchaseId = null,
    purchaseInvoiceNumber = "",
    invoiceValue,
    notes = "",
    idempotencyKey = null,
    createdBy = null,
    createdByName = "",
  } = creditData;

  const sessionOpt = session ? { session } : {};
  const numInvoiceVal = Math.round(Number(invoiceValue) * 100) / 100;

  if (isNaN(numInvoiceVal) || numInvoiceVal <= 0) {
    return { skipped: true, reason: "No invoice value / purchase credit amount to record into supplier ledger." };
  }

  // 1. Resolve Supplier
  let supplier = null;
  if (supplierId) {
    supplier = await Supplier.findOne({ _id: supplierId, businessId }).session(session);
  }
  if (!supplier && supplierPhone) {
    const cleanPhone = supplierPhone.trim();
    supplier = await Supplier.findOne({ phone: cleanPhone, businessId }).session(session);
  }

  // Auto-create supplier if doesn't exist but company provided
  if (!supplier) {
    if (!supplierCompany || !supplierCompany.trim()) {
      const error = new Error("A registered supplier or supplier company name is required for purchase credits.");
      error.statusCode = 400;
      error.code = "SUPPLIER_REQUIRED_FOR_CREDIT";
      throw error;
    }

    const [newSupp] = await Supplier.create(
      [
        {
          businessId,
          company: supplierCompany.trim(),
          phone: supplierPhone ? supplierPhone.trim() : "",
          currentBalance: 0,
          totalPurchases: 0,
          totalOrders: 0,
        },
      ],
      sessionOpt
    );
    supplier = newSupp;
  }

  // 2. Idempotency Guard (Duplicate Protection)
  const resolvedIdempotencyKey = idempotencyKey || (purchaseId ? `${purchaseId.toString()}_PURCHASE_CREDIT` : null);

  let ledgerDoc = await SupplierLedger.findOne({ businessId, supplierId: supplier._id }).session(session);

  if (ledgerDoc && resolvedIdempotencyKey) {
    const existingEntry = ledgerDoc.entries.find(
      (e) =>
        e.idempotencyKey === resolvedIdempotencyKey ||
        (e.purchaseId && purchaseId && e.purchaseId.toString() === purchaseId.toString() && e.entryType === "PURCHASE_CREDIT")
    );
    if (existingEntry) {
      return {
        success: true,
        alreadyProcessed: true,
        supplier,
        ledgerEntry: existingEntry,
        currentBalance: supplier.currentBalance,
      };
    }
  }

  // 3. Create Ledger Document if not exists
  if (!ledgerDoc) {
    const [newLedger] = await SupplierLedger.create(
      [
        {
          businessId,
          supplierId: supplier._id,
          supplierCompany: supplier.company,
          supplierPhone: supplier.phone || "",
          balance: 0,
          entries: [],
        },
      ],
      sessionOpt
    );
    ledgerDoc = newLedger;
  }

  // 4. Calculate authoritative new payable balance
  const currentBal = Number(supplier.currentBalance || 0);
  const potentialBalance = Math.round((currentBal + numInvoiceVal) * 100) / 100;

  // 5. Append Ledger Entry (Phase 6 - Task T39: Append-Only Immutable Transaction Log)
  const resolvedNotes =
    notes?.trim() ||
    `Inventory purchase delivery${purchaseInvoiceNumber ? ` (Bill #${purchaseInvoiceNumber})` : ""}`;

  const ledgerEntry = {
    supplierId: supplier._id,
    purchaseId: purchaseId || null,
    purchaseInvoiceNumber: purchaseInvoiceNumber || "",
    entryType: "PURCHASE_CREDIT",
    invoiceValue: numInvoiceVal,
    paymentAmount: 0,
    balance: potentialBalance,
    balanceSnapshot: potentialBalance,
    notes: resolvedNotes,
    idempotencyKey: resolvedIdempotencyKey,
    createdBy,
    createdByName,
  };

  ledgerDoc.entries.push(ledgerEntry);
  ledgerDoc.balance = potentialBalance;
  ledgerDoc.supplierCompany = supplier.company;
  ledgerDoc.supplierPhone = supplier.phone || "";
  await ledgerDoc.save(sessionOpt);

  // 6. Update Supplier Master State
  supplier.currentBalance = potentialBalance;
  supplier.lastPurchaseDate = new Date();
  supplier.totalOrders = (supplier.totalOrders || 0) + 1;
  supplier.totalPurchases = Math.round(((supplier.totalPurchases || 0) + numInvoiceVal) * 100) / 100;
  await supplier.save(sessionOpt);

  return {
    success: true,
    supplier: {
      id: supplier._id,
      company: supplier.company,
      phone: supplier.phone,
      currentBalance: supplier.currentBalance,
    },
    ledgerEntry: ledgerDoc.entries[ledgerDoc.entries.length - 1],
    newBalance: potentialBalance,
  };
};

/**
 * Record a payment / cash payout made to a supplier, reducing accounts payable debt.
 */
const recordSupplierPayment = async (paymentData, session = null) => {
  const {
    businessId,
    supplierId,
    amount,
    paymentMethod = "CASH",
    referenceId = "",
    notes = "",
    idempotencyKey = null,
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

  const supplier = await Supplier.findOne({ _id: supplierId, businessId }).session(session);
  if (!supplier) {
    const error = new Error("Supplier not found in this business.");
    error.statusCode = 404;
    error.code = "SUPPLIER_NOT_FOUND";
    throw error;
  }

  let ledgerDoc = await SupplierLedger.findOne({ businessId, supplierId: supplier._id }).session(session);
  if (!ledgerDoc) {
    const [newLedger] = await SupplierLedger.create(
      [
        {
          businessId,
          supplierId: supplier._id,
          supplierCompany: supplier.company,
          supplierPhone: supplier.phone || "",
          balance: supplier.currentBalance || 0,
          entries: [],
        },
      ],
      sessionOpt
    );
    ledgerDoc = newLedger;
  }

  // Idempotency check if key provided
  if (idempotencyKey) {
    const existingEntry = ledgerDoc.entries.find((e) => e.idempotencyKey === idempotencyKey);
    if (existingEntry) {
      return {
        success: true,
        alreadyProcessed: true,
        supplier,
        ledgerEntry: existingEntry,
        currentBalance: supplier.currentBalance,
      };
    }
  }

  const currentBal = Number(supplier.currentBalance || 0);
  const newBalance = Math.round(Math.max(0, currentBal - numAmount) * 100) / 100;

  const resolvedNotes =
    notes?.trim() ||
    `Payment disbursement via ${paymentMethod}${referenceId ? ` (Ref: ${referenceId})` : ""}`;

  const ledgerEntry = {
    supplierId: supplier._id,
    purchaseId: null,
    purchaseInvoiceNumber: "",
    entryType: "PAYMENT_MADE",
    invoiceValue: 0,
    paymentAmount: numAmount,
    balance: newBalance,
    balanceSnapshot: newBalance,
    paymentMethod: (paymentMethod || "CASH").toUpperCase(),
    referenceId: referenceId?.trim() || "",
    idempotencyKey: idempotencyKey || null,
    notes: resolvedNotes,
    createdBy,
    createdByName,
  };

  ledgerDoc.entries.push(ledgerEntry);
  ledgerDoc.balance = newBalance;
  await ledgerDoc.save(sessionOpt);

  supplier.currentBalance = newBalance;
  supplier.lastPaymentDate = new Date();
  await supplier.save(sessionOpt);

  return {
    success: true,
    supplier: {
      id: supplier._id,
      company: supplier.company,
      phone: supplier.phone,
      currentBalance: supplier.currentBalance,
    },
    ledgerEntry: ledgerDoc.entries[ledgerDoc.entries.length - 1],
    newBalance,
  };
};

/**
 * Task T39: Append a manual adjustment or opening balance entry (Strict append-only immutability).
 */
const appendLedgerEntry = async (entryData, session = null) => {
  const {
    businessId,
    supplierId,
    entryType = "ADJUSTMENT",
    invoiceValue = 0,
    paymentAmount = 0,
    purchaseId = null,
    purchaseInvoiceNumber = "",
    paymentMethod = "",
    referenceId = "",
    notes = "",
    createdBy = null,
    createdByName = "",
  } = entryData;

  const sessionOpt = session ? { session } : {};
  const numInvoiceVal = Math.round(Math.max(0, Number(invoiceValue) || 0) * 100) / 100;
  const numPaymentAmt = Math.round(Math.max(0, Number(paymentAmount) || 0) * 100) / 100;

  if (numInvoiceVal === 0 && numPaymentAmt === 0) {
    const error = new Error("Either invoiceValue or paymentAmount must be greater than 0.");
    error.statusCode = 400;
    error.code = "INVALID_LEDGER_AMOUNTS";
    throw error;
  }

  const supplier = await Supplier.findOne({ _id: supplierId, businessId }).session(session);
  if (!supplier) {
    const error = new Error("Supplier not found in this business.");
    error.statusCode = 404;
    error.code = "SUPPLIER_NOT_FOUND";
    throw error;
  }

  let ledgerDoc = await SupplierLedger.findOne({ businessId, supplierId: supplier._id }).session(session);
  if (!ledgerDoc) {
    const [newLedger] = await SupplierLedger.create(
      [
        {
          businessId,
          supplierId: supplier._id,
          supplierCompany: supplier.company,
          supplierPhone: supplier.phone || "",
          balance: supplier.currentBalance || 0,
          entries: [],
        },
      ],
      sessionOpt
    );
    ledgerDoc = newLedger;
  }

  const currentBal = Number(supplier.currentBalance || 0);
  const potentialBalance = Math.round(Math.max(0, currentBal + numInvoiceVal - numPaymentAmt) * 100) / 100;

  const ledgerEntry = {
    supplierId: supplier._id,
    purchaseId: purchaseId || null,
    purchaseInvoiceNumber: purchaseInvoiceNumber || "",
    entryType,
    invoiceValue: numInvoiceVal,
    paymentAmount: numPaymentAmt,
    balance: potentialBalance,
    balanceSnapshot: potentialBalance,
    paymentMethod: paymentMethod ? paymentMethod.toUpperCase() : "",
    referenceId: referenceId?.trim() || "",
    notes: notes?.trim() || `Manual ledger entry (${entryType})`,
    createdBy,
    createdByName,
  };

  ledgerDoc.entries.push(ledgerEntry);
  ledgerDoc.balance = potentialBalance;
  await ledgerDoc.save(sessionOpt);

  supplier.currentBalance = potentialBalance;
  if (numInvoiceVal > 0) {
    supplier.lastPurchaseDate = new Date();
    supplier.totalPurchases = Math.round(((supplier.totalPurchases || 0) + numInvoiceVal) * 100) / 100;
  }
  if (numPaymentAmt > 0) {
    supplier.lastPaymentDate = new Date();
  }
  await supplier.save(sessionOpt);

  return {
    success: true,
    supplier: {
      id: supplier._id,
      company: supplier.company,
      phone: supplier.phone,
      currentBalance: supplier.currentBalance,
    },
    ledgerEntry: ledgerDoc.entries[ledgerDoc.entries.length - 1],
    newBalance: potentialBalance,
  };
};

/**
 * Retrieve full supplier ledger history, statement, and financial breakdown.
 */
const getSupplierLedger = async (businessId, supplierId, pagination = { page: 1, limit: 50 }) => {
  const supplier = await Supplier.findOne({ _id: supplierId, businessId });
  if (!supplier) {
    const error = new Error("Supplier not found in this business.");
    error.statusCode = 404;
    error.code = "SUPPLIER_NOT_FOUND";
    throw error;
  }

  const ledgerDoc = await SupplierLedger.findOne({ businessId, supplierId });
  const allEntries = ledgerDoc ? [...ledgerDoc.entries].reverse() : [];

  const page = Math.max(1, parseInt(pagination.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(pagination.limit, 10) || 50));
  const skip = (page - 1) * limit;

  const paginatedEntries = allEntries.slice(skip, skip + limit);

  // Compute summary aggregates
  let totalPurchases = 0; // Total Invoice/Purchases on credit (+Credit to supplier)
  let totalPayments = 0;  // Total Payments Disbursed (-Debit to supplier)

  for (const e of allEntries) {
    totalPurchases += Number(e.invoiceValue || 0);
    totalPayments += Number(e.paymentAmount || 0);
  }

  const formattedEntries = paginatedEntries.map((e) => {
    return {
      _id: e._id,
      supplierId: e.supplierId,
      purchaseId: e.purchaseId || null,
      purchaseInvoiceNumber: e.purchaseInvoiceNumber || "",
      entryType: e.entryType,
      invoiceValue: Number(e.invoiceValue || 0),
      paymentAmount: Number(e.paymentAmount || 0),
      balance: Number(e.balance !== undefined ? e.balance : e.balanceSnapshot || 0),
      balanceSnapshot: Number(e.balanceSnapshot !== undefined ? e.balanceSnapshot : e.balance || 0),
      paymentMethod: e.paymentMethod || "",
      referenceId: e.referenceId || "",
      notes: e.notes || "",
      createdAt: e.createdAt,
      createdByName: e.createdByName || "",
    };
  });

  return {
    supplier: {
      id: supplier._id,
      company: supplier.company,
      contactName: supplier.contactName,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      city: supplier.city,
      state: supplier.state,
      gstin: supplier.gstin,
      currentBalance: supplier.currentBalance,
      totalPurchases: supplier.totalPurchases,
      totalOrders: supplier.totalOrders,
      lastPaymentDate: supplier.lastPaymentDate,
      lastPurchaseDate: supplier.lastPurchaseDate,
      status: supplier.status,
    },
    summary: {
      currentPayableOutstanding: supplier.currentBalance,
      totalPurchasesValue: Math.round(totalPurchases * 100) / 100,
      totalPaymentsMade: Math.round(totalPayments * 100) / 100,
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
 * Phase 6 - Task T40: Outstanding Payables Indexer
 * Get real-time outstanding payable balance for a single supplier.
 */
const getSupplierOutstanding = async (businessId, supplierId) => {
  const supplier = await Supplier.findOne({ _id: supplierId, businessId }).select(
    "company contactName phone email gstin currentBalance lastPaymentDate lastPurchaseDate totalPurchases totalOrders status"
  );
  if (!supplier) {
    const error = new Error("Supplier not found in this business.");
    error.statusCode = 404;
    error.code = "SUPPLIER_NOT_FOUND";
    throw error;
  }

  return {
    supplierId: supplier._id,
    company: supplier.company,
    contactName: supplier.contactName,
    phone: supplier.phone,
    email: supplier.email,
    gstin: supplier.gstin,
    currentBalance: supplier.currentBalance,
    hasPayableDue: supplier.currentBalance > 0,
    lastPaymentDate: supplier.lastPaymentDate,
    lastPurchaseDate: supplier.lastPurchaseDate,
    totalPurchases: supplier.totalPurchases,
    totalOrders: supplier.totalOrders,
    status: supplier.status,
  };
};

/**
 * Phase 6 - Task T40: Outstanding Payables Indexer
 * Get business-wide supplier payables summary ordered by highest debt owed (Precomputed & Indexed).
 */
const getBusinessPayablesSummary = async (businessId, limit = 50) => {
  const lim = Math.max(1, Math.min(200, parseInt(limit, 10) || 50));
  const suppliers = await Supplier.find({
    businessId,
    currentBalance: { $gt: 0 },
  })
    .sort({ currentBalance: -1 })
    .limit(lim)
    .select("company contactName phone email gstin currentBalance totalPurchases totalOrders lastPaymentDate lastPurchaseDate status notes updatedAt")
    .lean();

  return suppliers;
};

/**
 * Phase 6 - Task T40: Outstanding Payables Indexer
 * Get business-wide aggregate payable metrics and cash allocation totals.
 */
const getBusinessPayablesTotals = async (businessId) => {
  const [payableSuppliers, totalSuppliersCount] = await Promise.all([
    Supplier.find({ businessId, currentBalance: { $gt: 0 } })
      .sort({ currentBalance: -1 })
      .select("company phone currentBalance lastPaymentDate lastPurchaseDate")
      .lean(),
    Supplier.countDocuments({ businessId }),
  ]);

  const totalPayable = payableSuppliers.reduce((sum, s) => sum + (s.currentBalance || 0), 0);
  const totalRounded = Math.round(totalPayable * 100) / 100;
  const count = payableSuppliers.length;
  const avg = count > 0 ? Math.round((totalRounded / count) * 100) / 100 : 0;

  const highestCreditor = count > 0 ? {
    id: payableSuppliers[0]._id,
    company: payableSuppliers[0].company,
    phone: payableSuppliers[0].phone,
    currentBalance: payableSuppliers[0].currentBalance,
  } : null;

  return {
    totalPayableOutstanding: totalRounded,
    suppliersWithPayablesCount: count,
    totalSuppliersCount,
    averagePayablePerSupplier: avg,
    highestPayableSupplier: highestCreditor,
  };
};

module.exports = {
  recordPurchaseCredit,
  recordSupplierPayment,
  appendLedgerEntry,
  getSupplierLedger,
  getSupplierOutstanding,
  getBusinessPayablesSummary,
  getBusinessPayablesTotals,
};

