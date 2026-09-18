const { z } = require("zod");

const createCategorySchema = z.object({
  name: z
    .string({ required_error: "Category name is required." })
    .trim()
    .min(2, "Category name must be at least 2 characters.")
    .max(100, "Category name must not exceed 100 characters."),

  description: z
    .string()
    .trim()
    .max(500, "Description must not exceed 500 characters.")
    .optional()
    .default(""),
});

const updateCategorySchema = createCategorySchema.partial();

module.exports = {
  createCategorySchema,
  updateCategorySchema,
};
