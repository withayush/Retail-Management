const { z } = require("zod");

const updateReorderLevelSchema = z.object({
  reorderLevel: z
    .number({ required_error: "Reorder level is required." })
    .min(0, "Reorder level cannot be negative."),
});

const stockInSchema = z.object({
  productId: z.string({ required_error: "Product ID is required." }).min(24, "Invalid Product ID format."),
  quantity: z
    .number({ required_error: "Quantity is required." })
    .positive("Stock-in quantity must be greater than 0."),
  source: z
    .enum(["PURCHASE", "GOODS_RECEIPT", "MANUAL", "RETURN", "TRANSFER", "OTHER"])
    .optional()
    .default("PURCHASE"),
  supplier: z.string().trim().optional(),
  supplierName: z.string().trim().optional(),
  unitCost: z.number().min(0, "Unit cost cannot be negative.").optional(),
  referenceNumber: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

const stockOutSchema = z.object({
  productId: z.string({ required_error: "Product ID is required." }).min(24, "Invalid Product ID format."),
  quantity: z
    .number({ required_error: "Quantity is required." })
    .positive("Stock-out quantity must be greater than 0."),
  source: z
    .enum(["SALE", "POS_CHECKOUT", "DAMAGE", "EXPIRED", "RETURN_TO_VENDOR", "SAMPLE", "MANUAL", "OTHER"])
    .optional()
    .default("SALE"),
  invoiceId: z.string().optional().nullable(),
  invoiceNumber: z.string().trim().optional(),
  customerName: z.string().trim().optional(),
  reason: z.string().trim().optional(),
  referenceNumber: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

const batchStockOutSchema = z.object({
  invoiceId: z.string().optional().nullable(),
  invoiceNumber: z.string().trim().optional(),
  source: z
    .enum(["SALE", "POS_CHECKOUT", "DAMAGE", "EXPIRED", "RETURN_TO_VENDOR", "SAMPLE", "MANUAL", "OTHER"])
    .optional()
    .default("POS_CHECKOUT"),
  reason: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(24, "Invalid Product ID format."),
        quantity: z.number().positive("Item quantity must be greater than 0."),
      })
    )
    .min(1, "At least one item is required for batch stock deduction."),
});

const adjustStockSchema = z.object({
  productId: z.string({ required_error: "Product ID is required." }).min(24, "Invalid Product ID format."),
  newStock: z
    .number()
    .min(0, "Stock amount cannot be negative.")
    .optional(),
  physicalCount: z
    .number()
    .min(0, "Physical count cannot be negative.")
    .optional(),
  source: z
    .enum([
      "AUDIT_RECONCILIATION",
      "DAMAGE",
      "EXPIRED",
      "THEFT_SHRINKAGE",
      "SPILLAGE",
      "FOUND_STOCK",
      "CORRECTION",
      "ADJUSTMENT",
      "MANUAL",
      "OTHER",
    ])
    .optional()
    .default("AUDIT_RECONCILIATION"),
  reason: z.string().trim().optional(),
  referenceNumber: z.string().trim().optional(),
  notes: z.string().trim().optional(),
}).refine(
  (data) => data.newStock !== undefined || data.physicalCount !== undefined,
  {
    message: "Either newStock or physicalCount must be provided.",
    path: ["newStock"],
  }
);

const initializeOpeningStockSchema = z.object({
  productId: z.string({ required_error: "Product ID is required." }).min(24, "Invalid Product ID format."),
  openingStock: z
    .number({ required_error: "Opening stock quantity is required." })
    .min(0, "Opening stock cannot be negative."),
  reorderLevel: z
    .number()
    .min(0, "Reorder level cannot be negative.")
    .optional(),
  notes: z.string().trim().optional(),
});

module.exports = {
  updateReorderLevelSchema,
  stockInSchema,
  stockOutSchema,
  batchStockOutSchema,
  adjustStockSchema,
  initializeOpeningStockSchema,
};
