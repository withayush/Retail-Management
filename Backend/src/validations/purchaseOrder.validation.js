const { z } = require("zod");

/**
 * Phase 7 - Task T42: Purchase Order Request Validation Schemas (Zod)
 */

const purchaseOrderItemValidationSchema = z.object({
  productId: z.string().trim().optional().nullable(),
  name: z
    .string({ required_error: "Item name is required" })
    .trim()
    .min(1, "Item name cannot be empty")
    .max(150, "Item name cannot exceed 150 characters"),
  sku: z.string().trim().max(50, "SKU cannot exceed 50 characters").optional().default(""),
  quantity: z
    .number({ required_error: "Quantity is required" })
    .positive("Quantity must be greater than 0"),
  unit: z.string().trim().optional().default("pcs"),
  unitCost: z
    .number({ required_error: "Unit cost is required" })
    .min(0, "Unit cost cannot be negative"),
  notes: z.string().trim().optional().default(""),
});

const createPurchaseOrderSchema = z.object({
  supplierId: z
    .string({ required_error: "Supplier ID is required" })
    .trim()
    .min(1, "Supplier ID is required"),
  poNumber: z
    .string()
    .trim()
    .max(50, "PO Number cannot exceed 50 characters")
    .optional(),
  orderDate: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}/))
    .or(z.date())
    .optional(),
  expectedDelivery: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}/))
    .or(z.date())
    .or(z.literal(""))
    .optional()
    .nullable(),
  status: z
    .enum(["DRAFT", "PENDING", "PARTIAL", "RECEIVED", "CANCELLED"])
    .optional()
    .default("PENDING"),
  items: z
    .array(purchaseOrderItemValidationSchema)
    .min(1, "Purchase Order must contain at least 1 item"),
  notes: z.string().trim().optional().default(""),
  shippingAddress: z.string().trim().optional().default(""),
  paymentTerms: z.string().trim().optional().default(""),
});

const updatePurchaseOrderSchema = z.object({
  supplierId: z.string().trim().min(1).optional(),
  poNumber: z.string().trim().max(50).optional(),
  orderDate: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}/))
    .or(z.date())
    .optional(),
  expectedDelivery: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}/))
    .or(z.date())
    .or(z.literal(""))
    .optional()
    .nullable(),
  status: z.enum(["DRAFT", "PENDING", "PARTIAL", "RECEIVED", "CANCELLED"]).optional(),
  items: z.array(purchaseOrderItemValidationSchema).min(1).optional(),
  notes: z.string().trim().optional(),
  shippingAddress: z.string().trim().optional(),
  paymentTerms: z.string().trim().optional(),
});

const updatePurchaseOrderStatusSchema = z.object({
  status: z.enum(["DRAFT", "PENDING", "PARTIAL", "RECEIVED", "CANCELLED"], {
    required_error: "Valid status is required",
  }),
  notes: z.string().trim().optional(),
});

module.exports = {
  purchaseOrderItemValidationSchema,
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema,
  updatePurchaseOrderStatusSchema,
};
