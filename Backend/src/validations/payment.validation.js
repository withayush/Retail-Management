const { z } = require("zod");
const mongoose = require("mongoose");

/**
 * Phase 4 - Task T28: Payment Zod Validation Schemas
 */

const isValidObjectId = (val) => mongoose.Types.ObjectId.isValid(val);

const recordPaymentSchema = z.object({
  invoiceId: z
    .string({ required_error: "Invoice ID is required" })
    .refine(isValidObjectId, { message: "Invalid invoice ID format" }),
  amount: z
    .number({ required_error: "Payment amount is required" })
    .positive("Payment amount must be greater than 0"),
  method: z.enum(["CASH", "UPI", "CARD", "CREDIT", "CREDIT_UDHAR", "SPLIT", "OTHER"], {
    errorMap: () => ({ message: "Payment method must be CASH, UPI, CARD, CREDIT, SPLIT, or OTHER" }),
  }),
  referenceId: z
    .string()
    .max(100, "Reference ID cannot exceed 100 characters")
    .optional()
    .nullable(),
  notes: z
    .string()
    .max(500, "Notes cannot exceed 500 characters")
    .optional()
    .default(""),
});

const getPaymentsFilterSchema = z.object({
  invoiceId: z
    .string()
    .refine(isValidObjectId, { message: "Invalid invoice ID format" })
    .optional(),
  customerId: z
    .string()
    .refine(isValidObjectId, { message: "Invalid customer ID format" })
    .optional(),
  method: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

module.exports = {
  recordPaymentSchema,
  getPaymentsFilterSchema,
};
