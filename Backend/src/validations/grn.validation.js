const { z } = require("zod");

/**
 * Phase 7 - Task T44: Goods Received Note (GRN) Request Validation Schemas (Zod)
 */

const receiveStockItemValidationSchema = z.object({
  productId: z.string().trim().optional().nullable(),
  name: z.string().trim().optional().default(""),
  sku: z.string().trim().optional().default(""),
  receivedQty: z
    .number({ required_error: "Received quantity is required" })
    .min(0, "Received quantity cannot be negative"),
  costPrice: z
    .number()
    .min(0, "Cost price cannot be negative")
    .optional(),
  notes: z.string().trim().optional().default(""),
});

const receiveStockSchema = z.object({
  purchaseOrderId: z
    .string({ required_error: "Purchase Order ID is required" })
    .trim()
    .min(1, "Purchase Order ID is required"),
  receivedDate: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}/))
    .or(z.date())
    .optional(),
  deliveryChallanNumber: z.string().trim().max(100).optional().default(""),
  invoiceNumber: z.string().trim().max(100).optional().default(""),
  notes: z.string().trim().optional().default(""),
  allowOverdelivery: z.boolean().optional().default(false),
  items: z
    .array(receiveStockItemValidationSchema)
    .min(1, "Receipt must contain at least 1 item"),
});

const listGrnQuerySchema = z.object({
  purchaseOrderId: z.string().trim().optional(),
  supplierId: z.string().trim().optional(),
  status: z.enum(["ALL", "COMPLETED", "CANCELLED"]).optional().default("ALL"),
  search: z.string().trim().optional(),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

module.exports = {
  receiveStockItemValidationSchema,
  receiveStockSchema,
  listGrnQuerySchema,
};
