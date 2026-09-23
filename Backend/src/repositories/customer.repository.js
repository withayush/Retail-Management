const { Customer } = require("../models/customer.model");

/**
 * Customer Repository Layer
 * Handles customer CRUD, search, and phone lookups.
 */

const createCustomer = async (businessId, customerData) => {
  const { name, phone, email, address, creditLimit = 0, notes = "" } = customerData;

  const existing = await Customer.findOne({ businessId, phone: phone.trim() });
  if (existing) {
    const error = new Error(`A customer with phone number ${phone} already exists.`);
    error.statusCode = 409;
    error.code = "CUSTOMER_ALREADY_EXISTS";
    throw error;
  }

  const customer = await Customer.create({
    businessId,
    name: name.trim(),
    phone: phone.trim(),
    email: email ? email.trim().toLowerCase() : "",
    address: address ? address.trim() : "",
    creditLimit: Number(creditLimit) || 0,
    notes: notes ? notes.trim() : "",
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
    ];
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

const findCustomerById = async (businessId, customerId) => {
  return await Customer.findOne({ _id: customerId, businessId });
};

const findCustomerByPhone = async (businessId, phone) => {
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
  if (updateData.phone) {
    const newPhone = updateData.phone.trim();
    if (newPhone !== customer.phone) {
      const duplicate = await Customer.findOne({ businessId, phone: newPhone, _id: { $ne: customerId } });
      if (duplicate) {
        const error = new Error(`Phone number ${newPhone} is already taken by another customer.`);
        error.statusCode = 409;
        error.code = "PHONE_ALREADY_EXISTS";
        throw error;
      }
      customer.phone = newPhone;
    }
  }
  if (updateData.email !== undefined) customer.email = updateData.email.trim().toLowerCase();
  if (updateData.address !== undefined) customer.address = updateData.address.trim();
  if (updateData.creditLimit !== undefined) customer.creditLimit = Number(updateData.creditLimit) || 0;
  if (updateData.status) customer.status = updateData.status;
  if (updateData.notes !== undefined) customer.notes = updateData.notes.trim();

  return await customer.save();
};

module.exports = {
  createCustomer,
  findCustomers,
  findCustomerById,
  findCustomerByPhone,
  updateCustomer,
};
