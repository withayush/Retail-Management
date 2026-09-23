const { z } = require("zod");

const createCustomerSchema = z.object({
  name: z.string().trim().min(1, "Customer name is required").max(100),
  phone: z.string().trim().min(5, "Valid phone number is required").max(20),
  email: z.string().trim().email("Invalid email format").optional().or(z.literal("")),
  address: z.string().trim().max(500).optional().or(z.literal("")),
  creditLimit: z.number().min(0, "Credit limit cannot be negative").default(0),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

const updateCustomerSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  phone: z.string().trim().min(5).max(20).optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  address: z.string().trim().max(500).optional().or(z.literal("")),
  creditLimit: z.number().min(0).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]).optional(),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

const recordCustomerPaymentSchema = z.object({
  amount: z.number().positive("Payment amount must be greater than 0"),
  method: z.enum(["CASH", "UPI", "CARD", "OTHER"]).default("CASH"),
  referenceId: z.string().trim().max(100).optional().nullable(),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

module.exports = {
  createCustomerSchema,
  updateCustomerSchema,
  recordCustomerPaymentSchema,
};
