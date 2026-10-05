const { z } = require("zod");

const createExpenseSchema = z.object({
  categoryId: z
    .string({ required_error: "Expense category ID is required." })
    .trim()
    .min(1, "Expense category ID cannot be empty."),

  amount: z
    .union([z.number(), z.string()], {
      required_error: "Expense amount is required.",
    })
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "Expense amount must be a valid positive number greater than zero.",
    }),

  expenseDate: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: "Invalid date format for expenseDate.",
    }),

  paymentMethod: z
    .enum(["CASH", "UPI", "BANK_TRANSFER", "CARD", "CHEQUE", "OTHER"], {
      errorMap: () => ({ message: "Invalid payment method. Allowed: CASH, UPI, BANK_TRANSFER, CARD, CHEQUE, OTHER." }),
    })
    .optional()
    .nullable()
    .default("CASH"),

  referenceNumber: z
    .string()
    .trim()
    .max(100, "Reference number cannot exceed 100 characters.")
    .optional()
    .nullable()
    .default(""),

  payee: z
    .string()
    .trim()
    .max(200, "Payee name cannot exceed 200 characters.")
    .optional()
    .nullable()
    .default(""),

  description: z
    .string()
    .trim()
    .max(1000, "Description cannot exceed 1000 characters.")
    .optional()
    .nullable()
    .default(""),

  taxAmount: z
    .union([z.number(), z.string()])
    .optional()
    .nullable()
    .transform((val) => (val === null || val === undefined || val === "" ? 0 : Number(val)))
    .refine((val) => !isNaN(val) && val >= 0, {
      message: "Tax amount cannot be negative.",
    })
    .default(0),

  attachment: z
    .object({
      fileName: z.string().optional().nullable().default(""),
      url: z.string().optional().nullable().default(""),
      fileType: z.string().optional().nullable().default(""),
      fileSize: z.number().optional().nullable().default(0),
    })
    .optional()
    .nullable()
    .default({}),

  status: z
    .enum(["PAID", "PENDING", "CANCELLED"])
    .optional()
    .nullable()
    .default("PAID"),
});

const updateExpenseSchema = createExpenseSchema.partial();

module.exports = {
  createExpenseSchema,
  updateExpenseSchema,
};
