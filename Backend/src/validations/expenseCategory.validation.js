const { z } = require("zod");

const createExpenseCategorySchema = z.object({
  categoryName: z
    .string({ required_error: "Expense category name is required." })
    .trim()
    .min(2, "Category name must be at least 2 characters.")
    .max(100, "Category name cannot exceed 100 characters."),

  description: z
    .string()
    .trim()
    .max(500, "Description cannot exceed 500 characters.")
    .optional()
    .default(""),

  icon: z
    .string()
    .trim()
    .max(50, "Icon identifier cannot exceed 50 characters.")
    .optional()
    .default("Tag"),

  color: z
    .string()
    .trim()
    .max(30, "Color value cannot exceed 30 characters.")
    .optional()
    .default("#8E8E93"),

  budgetLimit: z
    .number({ invalid_type_error: "Budget limit must be a valid number." })
    .min(0, "Budget limit cannot be negative.")
    .optional()
    .default(0),

  sortOrder: z
    .number()
    .optional()
    .default(0),

  isActive: z
    .boolean()
    .optional()
    .default(true),
});

const updateExpenseCategorySchema = createExpenseCategorySchema.partial();

module.exports = {
  createExpenseCategorySchema,
  updateExpenseCategorySchema,
};
