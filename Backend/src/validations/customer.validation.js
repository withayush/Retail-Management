const { z } = require("zod");

/**
 * Phase 5 - Task T31: Customer Validation Schemas
 */
const createCustomerSchema = z.object({
  name: z.string().trim().min(1, "Customer name is required").max(100),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  email: z.string().trim().email("Invalid email format").optional().or(z.literal("")),
  address: z.string().trim().max(500).optional().or(z.literal("")),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  state: z.string().trim().max(100).optional().or(z.literal("")),
  pincode: z.string().trim().max(20).optional().or(z.literal("")),
  creditLimit: z.number().min(0, "Credit limit cannot be negative").default(0),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  tags: z.array(z.string().trim()).optional().default([]),
});

const updateCustomerSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  email: z.string().trim().email("Invalid email format").optional().or(z.literal("")),
  address: z.string().trim().max(500).optional().or(z.literal("")),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  state: z.string().trim().max(100).optional().or(z.literal("")),
  pincode: z.string().trim().max(20).optional().or(z.literal("")),
  creditLimit: z.number().min(0).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]).optional(),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  tags: z.array(z.string().trim()).optional(),
});

const recordCustomerPaymentSchema = z.object({
  amount: z.number().positive("Payment amount must be greater than 0"),
  method: z.enum(["CASH", "UPI", "CARD", "OTHER"]).default("CASH"),
  referenceId: z.string().trim().max(100).optional().nullable(),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

const appendLedgerEntrySchema = z.object({
  entryType: z.enum(["SALE_CREDIT", "CREDIT_SALE", "PAYMENT_RECEIVED", "ADJUSTMENT", "REFUND"]).default("ADJUSTMENT"),
  creditAmount: z.number().min(0, "Credit amount cannot be negative").default(0),
  debitAmount: z.number().min(0, "Debit amount cannot be negative").default(0),
  saleId: z.string().trim().optional().nullable(),
  invoiceNumber: z.string().trim().optional().nullable(),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

module.exports = {
  createCustomerSchema,
  updateCustomerSchema,
  recordCustomerPaymentSchema,
  appendLedgerEntrySchema,
};
