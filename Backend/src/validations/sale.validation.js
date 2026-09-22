const { z } = require("zod");

/**
 * Phase 4 - Task T23: Sale / Invoice Transaction Validation Schemas
 */

const saleItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  name: z.string().trim().optional().default(""),
  sku: z.string().trim().optional().default(""),
  quantity: z.number().positive("Quantity must be greater than 0"),
  unit: z.string().optional().default("pcs"),
  soldPrice: z.number().nonnegative("Sold price must be non-negative"),
  costPrice: z.number().nonnegative("Cost price must be non-negative").optional().default(0),
  totalPrice: z.number().nonnegative("Total price must be non-negative").optional(),
  grossProfit: z.number().optional(),
});

const createSaleSchema = z.object({
  invoiceNumber: z.string().trim().optional(), // Auto-generated if omitted
  customerId: z.string().nullable().optional(),
  customerName: z.string().trim().max(100).optional().default("Walk-in Customer"),
  customerPhone: z.string().trim().max(20).optional().default(""),

  subtotal: z.number().nonnegative("Subtotal must be non-negative"),
  discount: z.number().nonnegative("Discount must be non-negative").optional().default(0),
  tax: z.number().nonnegative("Tax must be non-negative").optional().default(0),
  total: z.number().nonnegative("Total must be non-negative"),

  paidAmount: z.number().nonnegative("Paid amount must be non-negative").optional().default(0),
  paymentStatus: z
    .enum(["PAID", "PENDING", "PARTIAL", "FAILED", "CANCELLED"])
    .optional()
    .default("PAID"),
  paymentMode: z
    .enum(["CASH", "UPI", "CARD", "CREDIT_UDHAR", "SPLIT", "OTHER"])
    .optional()
    .default("CASH"),
  status: z
    .enum(["COMPLETED", "DRAFT", "CANCELLED", "REFUNDED"])
    .optional()
    .default("COMPLETED"),

  notes: z.string().trim().optional().default(""),
  items: z.array(saleItemSchema).optional().default([]),
});

const updatePaymentStatusSchema = z.object({
  paymentStatus: z.enum(["PAID", "PENDING", "PARTIAL", "FAILED", "CANCELLED"]),
  paidAmount: z.number().nonnegative("Paid amount must be non-negative").optional(),
  paymentMode: z
    .enum(["CASH", "UPI", "CARD", "CREDIT_UDHAR", "SPLIT", "OTHER"])
    .optional(),
  notes: z.string().trim().optional(),
});

module.exports = {
  createSaleSchema,
  updatePaymentStatusSchema,
};
