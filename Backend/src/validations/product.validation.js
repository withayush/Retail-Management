const { z } = require("zod");

const createProductSchema = z.object({
  name: z
    .string({ required_error: "Product name is required." })
    .trim()
    .min(2, "Product name must be at least 2 characters.")
    .max(150, "Product name must not exceed 150 characters."),

  sku: z
    .string({ required_error: "SKU is required." })
    .trim()
    .min(2, "SKU must be at least 2 characters.")
    .max(100, "SKU must not exceed 100 characters.")
    .transform((val) => val.toUpperCase()),

  barcode: z
    .string()
    .trim()
    .max(100)
    .optional()
    .nullable()
    .or(z.literal("")),

  sellingPrice: z
    .number({ required_error: "Selling price is required." })
    .min(0, "Selling price cannot be negative."),

  costPrice: z
    .number({ required_error: "Cost price is required." })
    .min(0, "Cost price cannot be negative."),

  categoryId: z
    .string({ required_error: "Category ID is required." })
    .trim()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid Category ID format."),

  unit: z
    .string()
    .trim()
    .max(30)
    .optional()
    .default("pcs"),

  packSize: z
    .number()
    .min(0, "Pack size cannot be negative.")
    .optional()
    .default(1),

  packagingType: z
    .string()
    .trim()
    .max(50)
    .optional()
    .default(""),

  description: z
    .string()
    .trim()
    .max(500)
    .optional()
    .default(""),

  isActive: z
    .boolean()
    .optional()
    .default(true),
});

const updateProductSchema = createProductSchema.partial();

module.exports = {
  createProductSchema,
  updateProductSchema,
};
