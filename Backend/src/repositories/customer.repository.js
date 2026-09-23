const { Customer } = require("../models/customer.model");

/**
 * Phase 5 - Task T31 & T32: Customer Repository Layer
 * Handles business-scoped customer CRUD, canonical phone formatting, search, and soft-delete/restore.
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

module.exports = {
  createCustomer,
  findCustomers,
  searchCustomers,
  findCustomerById,
  findCustomerByPhone,
  updateCustomer,
  deleteCustomer,
  restoreCustomer,
};
