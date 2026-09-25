const { Customer, CustomerLedger } = require("../models/customer.model");
const Invoice = require("../models/invoice.model");

/**
 * Phase 5 - Task T31, T32 & T36: Customer Repository Layer
 * Handles business-scoped customer CRUD, canonical phone formatting, search, and 360° CRM analytics.
 */

const createCustomer = async (businessId, customerData) => {
  const {
    name,
    phone = "",
    email = "",
    address = "",
    city = "",
    state = "",
    pincode = "",
    creditLimit = 0,
    notes = "",
    tags = [],
  } = customerData;

  const trimmedPhone = phone ? phone.trim() : "";

  // If phone is provided, verify uniqueness within this specific business
  if (trimmedPhone) {
    const existing = await Customer.findOne({ businessId, phone: trimmedPhone });
    if (existing) {
      const error = new Error(`A customer with phone number ${trimmedPhone} already exists in this business.`);
      error.statusCode = 409;
      error.code = "CUSTOMER_ALREADY_EXISTS";
      throw error;
    }
  }

  const customer = await Customer.create({
    businessId,
    name: name.trim(),
    phone: trimmedPhone,
    email: email ? email.trim().toLowerCase() : "",
    address: address ? address.trim() : "",
    city: city ? city.trim() : "",
    state: state ? state.trim() : "",
    pincode: pincode ? pincode.trim() : "",
    creditLimit: Number(creditLimit) || 0,
    notes: notes ? notes.trim() : "",
    tags: Array.isArray(tags) ? tags.map((t) => String(t).trim()).filter(Boolean) : [],
    status: "ACTIVE",
  });

  return customer;
};

const findCustomers = async (businessId, filters = {}, pagination = { page: 1, limit: 20 }) => {
  const query = { businessId };

  if (filters.search && filters.search.trim()) {
    const term = filters.search.trim();
    query.$or = [
      { name: { $regex: term, $options: "i" } },
      { phone: { $regex: term, $options: "i" } },
      { email: { $regex: term, $options: "i" } },
      { address: { $regex: term, $options: "i" } },
      { city: { $regex: term, $options: "i" } },
    ];
  }

  if (filters.phone && filters.phone.trim()) {
    query.phone = { $regex: filters.phone.trim(), $options: "i" };
  }

  if (filters.status && filters.status !== "ALL") {
    query.status = filters.status;
  } else if (!filters.status) {
    // Default: show active customers unless specified
    query.status = { $ne: "INACTIVE" };
  }

  if (filters.hasDebt === "true" || filters.hasDebt === true) {
    query.currentBalance = { $gt: 0 };
  }

  const page = Math.max(1, parseInt(pagination.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(pagination.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const [customers, total] = await Promise.all([
    Customer.find(query).sort({ currentBalance: -1, createdAt: -1 }).skip(skip).limit(limit),
    Customer.countDocuments(query),
  ]);

  return {
    data: customers,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

const searchCustomers = async (businessId, queryStr = "", limit = 10) => {
  if (!queryStr || !queryStr.trim()) {
    return await Customer.find({ businessId, status: "ACTIVE" })
      .sort({ currentBalance: -1, updatedAt: -1 })
      .limit(limit);
  }

  const term = queryStr.trim();
  return await Customer.find({
    businessId,
    status: "ACTIVE",
    $or: [
      { name: { $regex: term, $options: "i" } },
      { phone: { $regex: term, $options: "i" } },
      { email: { $regex: term, $options: "i" } },
    ],
  })
    .sort({ currentBalance: -1, name: 1 })
    .limit(limit);
};

const findCustomerById = async (businessId, customerId) => {
  return await Customer.findOne({ _id: customerId, businessId });
};

const findCustomerByPhone = async (businessId, phone) => {
  if (!phone || !phone.trim()) return null;
  return await Customer.findOne({ businessId, phone: phone.trim() });
};

const updateCustomer = async (businessId, customerId, updateData) => {
  const customer = await Customer.findOne({ _id: customerId, businessId });
  if (!customer) {
    const error = new Error("Customer not found.");
    error.statusCode = 404;
    error.code = "CUSTOMER_NOT_FOUND";
    throw error;
  }

  if (updateData.name) customer.name = updateData.name.trim();
  if (updateData.phone !== undefined) {
    const newPhone = updateData.phone ? updateData.phone.trim() : "";
    if (newPhone && newPhone !== customer.phone) {
      const duplicate = await Customer.findOne({ businessId, phone: newPhone, _id: { $ne: customerId } });
      if (duplicate) {
        const error = new Error(`Phone number ${newPhone} is already taken by another customer.`);
        error.statusCode = 409;
        error.code = "PHONE_ALREADY_EXISTS";
        throw error;
      }
    }
    customer.phone = newPhone;
  }
  if (updateData.email !== undefined) customer.email = updateData.email.trim().toLowerCase();
  if (updateData.address !== undefined) customer.address = updateData.address.trim();
  if (updateData.city !== undefined) customer.city = updateData.city.trim();
  if (updateData.state !== undefined) customer.state = updateData.state.trim();
  if (updateData.pincode !== undefined) customer.pincode = updateData.pincode.trim();
  if (updateData.creditLimit !== undefined) customer.creditLimit = Number(updateData.creditLimit) || 0;
  if (updateData.status) customer.status = updateData.status;
  if (updateData.notes !== undefined) customer.notes = updateData.notes.trim();
  if (updateData.tags !== undefined && Array.isArray(updateData.tags)) {
    customer.tags = updateData.tags.map((t) => String(t).trim()).filter(Boolean);
  }

  return await customer.save();
};

const deleteCustomer = async (businessId, customerId) => {
  const customer = await Customer.findOne({ _id: customerId, businessId });
  if (!customer) {
    const error = new Error("Customer not found.");
    error.statusCode = 404;
    error.code = "CUSTOMER_NOT_FOUND";
    throw error;
  }

  // Soft-delete: mark customer as INACTIVE to preserve past sales and ledgers
  customer.status = "INACTIVE";
  return await customer.save();
};

const restoreCustomer = async (businessId, customerId) => {
  const customer = await Customer.findOne({ _id: customerId, businessId });
  if (!customer) {
    const error = new Error("Customer not found.");
    error.statusCode = 404;
    error.code = "CUSTOMER_NOT_FOUND";
    throw error;
  }

  customer.status = "ACTIVE";
  return await customer.save();
};

/**
 * Phase 5 - Task T36: Customer 360° CRM & Profiling Aggregator
 * Aggregates complete customer profile, lifetime sales KPIs, visit frequency, average spend,
 * real-time outstanding, aged debt analysis (0-30d, 31-60d, 61-90d, 90+d), recent payments, and recent sales.
 */
const getCustomerCRMSummary = async (businessId, customerId) => {
  const customer = await Customer.findOne({ _id: customerId, businessId });
  if (!customer) {
    const error = new Error("Customer not found in this business.");
    error.statusCode = 404;
    error.code = "CUSTOMER_NOT_FOUND";
    throw error;
  }

  // 1. Sales Statistics & Aggregations
  const salesQuery = {
    businessId,
    customerId: customer._id,
    status: { $ne: "CANCELLED" },
  };

  const [salesAgg, recentSales, unpaidInvoices, ledgerDoc] = await Promise.all([
    Invoice.aggregate([
      { $match: salesQuery },
      {
        $group: {
          _id: null,
          totalSalesAmount: { $sum: "$total" },
          totalVisits: { $sum: 1 },
          firstPurchaseDate: { $min: "$createdAt" },
          lastPurchaseDate: { $max: "$createdAt" },
        },
      },
    ]),
    Invoice.find(salesQuery)
      .sort({ createdAt: -1 })
      .limit(5)
      .select("invoiceNumber total paidAmount dueAmount paymentStatus paymentMode status createdAt items"),
    Invoice.find({
      businessId,
      customerId: customer._id,
      dueAmount: { $gt: 0 },
      status: { $ne: "CANCELLED" },
    }).sort({ createdAt: 1 }), // Oldest first for FIFO aging
    CustomerLedger.findOne({ businessId, customerId: customer._id }),
  ]);

  const salesStats = salesAgg.length > 0 ? salesAgg[0] : {
    totalSalesAmount: 0,
    totalVisits: 0,
    firstPurchaseDate: null,
    lastPurchaseDate: null,
  };

  const totalSalesAmount = Math.round((salesStats.totalSalesAmount || 0) * 100) / 100;
  const totalVisits = salesStats.totalVisits || 0;
  const averageSpend = totalVisits > 0 ? Math.round((totalSalesAmount / totalVisits) * 100) / 100 : 0;

  // 2. Outstanding & Credit Calculations
  const currentBalance = customer.currentBalance || 0;
  const creditLimit = customer.creditLimit || 0;
  const availableCredit =
    creditLimit > 0 ? Math.max(0, Math.round((creditLimit - currentBalance) * 100) / 100) : null;
  const isLimitExceeded = creditLimit > 0 && currentBalance > creditLimit;

  // 3. Debt Aging Calculation (0-30d, 31-60d, 61-90d, 90+d)
  const now = new Date();
  const aging = {
    bucket0_30: 0,
    bucket31_60: 0,
    bucket61_90: 0,
    bucket90Plus: 0,
    totalAgedDebt: 0,
  };

  if (currentBalance > 0) {
    if (unpaidInvoices && unpaidInvoices.length > 0) {
      let remainingBalanceToAge = currentBalance;
      // Evaluate from oldest unpaid invoice to newest
      for (const inv of unpaidInvoices) {
        if (remainingBalanceToAge <= 0) break;
        const due = Math.min(inv.dueAmount, remainingBalanceToAge);
        const ageDays = Math.max(0, Math.floor((now - new Date(inv.createdAt)) / (1000 * 60 * 60 * 24)));

        if (ageDays <= 30) {
          aging.bucket0_30 += due;
        } else if (ageDays <= 60) {
          aging.bucket31_60 += due;
        } else if (ageDays <= 90) {
          aging.bucket61_90 += due;
        } else {
          aging.bucket90Plus += due;
        }
        remainingBalanceToAge -= due;
      }

      // If there's still balance left (e.g. manual adjustments / opening balance), allocate to appropriate bucket
      if (remainingBalanceToAge > 0) {
        const fallbackAge = Math.max(0, Math.floor((now - new Date(customer.createdAt)) / (1000 * 60 * 60 * 24)));
        if (fallbackAge <= 30) {
          aging.bucket0_30 += remainingBalanceToAge;
        } else if (fallbackAge <= 60) {
          aging.bucket31_60 += remainingBalanceToAge;
        } else if (fallbackAge <= 90) {
          aging.bucket61_90 += remainingBalanceToAge;
        } else {
          aging.bucket90Plus += remainingBalanceToAge;
        }
      }
    } else {
      // Balance exists without unpaid invoice records (e.g., Opening Balance or Manual Ledger Adjustment)
      const fallbackAge = Math.max(0, Math.floor((now - new Date(customer.createdAt)) / (1000 * 60 * 60 * 24)));
      if (fallbackAge <= 30) {
        aging.bucket0_30 = currentBalance;
      } else if (fallbackAge <= 60) {
        aging.bucket31_60 = currentBalance;
      } else if (fallbackAge <= 90) {
        aging.bucket61_90 = currentBalance;
      } else {
        aging.bucket90Plus = currentBalance;
      }
    }
  }

  aging.bucket0_30 = Math.round(aging.bucket0_30 * 100) / 100;
  aging.bucket31_60 = Math.round(aging.bucket31_60 * 100) / 100;
  aging.bucket61_90 = Math.round(aging.bucket61_90 * 100) / 100;
  aging.bucket90Plus = Math.round(aging.bucket90Plus * 100) / 100;
  aging.totalAgedDebt =
    Math.round((aging.bucket0_30 + aging.bucket31_60 + aging.bucket61_90 + aging.bucket90Plus) * 100) / 100;

  // 4. Recent Repayments (from Customer Ledger)
  const allEntries = ledgerDoc ? [...ledgerDoc.entries] : [];
  const paymentEntries = allEntries
    .filter(
      (e) =>
        e.entryType === "PAYMENT_SETTLEMENT" ||
        e.entryType === "PAYMENT_RECEIVED" ||
        (e.debitAmount > 0 && e.entryType !== "SALE_CREDIT")
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
    .map((p) => {
      const amt =
        p.debitAmount !== undefined && p.creditAmount !== undefined
          ? p.debitAmount
          : p.entryType === "PAYMENT_RECEIVED"
          ? p.creditAmount
          : p.amount || 0;
      const bal = p.balance !== undefined ? p.balance : p.balanceSnapshot !== undefined ? p.balanceSnapshot : 0;
      return {
        _id: p._id,
        amount: amt,
        paymentMethod: p.paymentMethod || "CASH",
        date: p.createdAt,
        createdAt: p.createdAt,
        balanceAfter: bal,
        reference: p.idempotencyKey || "",
        notes: p.notes || "",
        recordedBy: p.createdByName || "Cashier",
      };
    });

  // 5. Recent Sales Invoices
  const formattedSales = recentSales.map((s) => ({
    _id: s._id,
    invoiceNumber: s.invoiceNumber,
    total: s.total,
    paidAmount: s.paidAmount,
    dueAmount: s.dueAmount,
    paymentStatus: s.paymentStatus,
    paymentMode: s.paymentMode,
    status: s.status,
    createdAt: s.createdAt,
    itemsCount: s.items ? s.items.length : 0,
  }));

  return {
    profile: {
      id: customer._id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      pincode: customer.pincode,
      status: customer.status,
      notes: customer.notes,
      tags: customer.tags,
      creditLimit: customer.creditLimit,
      currentBalance: customer.currentBalance,
      customerSince: customer.createdAt,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      lastPaymentDate: customer.lastPaymentDate,
      lastPurchaseDate: customer.lastPurchaseDate,
    },
    salesMetrics: {
      totalSalesAmount,
      totalVisits,
      averageSpend,
      firstPurchaseDate: salesStats.firstPurchaseDate || null,
      lastPurchaseDate: salesStats.lastPurchaseDate || customer.lastPurchaseDate || null,
    },
    outstanding: {
      currentBalance,
      creditLimit,
      availableCredit,
      isLimitExceeded,
      lastPaymentDate: customer.lastPaymentDate,
      lastPurchaseDate: customer.lastPurchaseDate,
    },
    debtAging: aging,
    recentPayments: paymentEntries,
    recentSales: formattedSales,
  };
};

module.exports = {
  createCustomer,
  findCustomers,
  searchCustomers,
  findCustomerById,
  findCustomerByPhone,
  updateCustomer,
  deleteCustomer,
  restoreCustomer,
  getCustomerCRMSummary,
};
