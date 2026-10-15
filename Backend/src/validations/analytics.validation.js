const { z } = require("zod");

/**
 * Phase 9 - Task T56: Net Profit Aggregation Service - Analytics Query Validations
 * Validates all date-range, period, year, month, and quarter inputs before reaching service.
 */

const dateStringSchema = z
  .string()
  .trim()
  .refine(
    (val) => {
      const parsed = Date.parse(val);
      return !isNaN(parsed);
    },
    { message: "Invalid date format. Expected ISO 8601 (e.g. '2026-10-01')." }
  );

const periodNetProfitQuerySchema = z
  .object({
    from: dateStringSchema.optional(),
    to: dateStringSchema.optional(),
    startDate: dateStringSchema.optional(),
    endDate: dateStringSchema.optional(),
    year: z
      .union([z.string(), z.number()])
      .optional()
      .transform((v) => (v !== undefined ? Number(v) : undefined))
      .refine((v) => v === undefined || (v >= 2000 && v <= 2100), {
        message: "Year must be between 2000 and 2100.",
      }),
    month: z
      .union([z.string(), z.number()])
      .optional()
      .transform((v) => (v !== undefined ? String(v) : undefined)),
    quarter: z
      .union([z.string(), z.number()])
      .optional()
      .transform((v) => (v !== undefined ? Number(v) : undefined))
      .refine((v) => v === undefined || (v >= 1 && v <= 4), {
        message: "Quarter must be 1, 2, 3, or 4.",
      }),
    periodType: z.enum(["MONTH", "QUARTER", "YTD", "CUSTOM"]).optional(),
    forceRefresh: z
      .union([z.boolean(), z.string()])
      .optional()
      .transform((v) => v === true || v === "true"),
  })
  .superRefine((data, ctx) => {
    const rawFrom = data.from || data.startDate;
    const rawTo = data.to || data.endDate;
    if (rawFrom && rawTo) {
      const from = new Date(rawFrom);
      const to = new Date(rawTo);
      if (from > to) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "'from' date must not be after 'to' date.",
          path: ["from"],
        });
      }
      const diffDays = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays > 1826) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Reporting period cannot exceed 5 years (1,826 days).",
          path: ["to"],
        });
      }
    }
  });

const monthlyOverviewQuerySchema = z.object({
  year: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v !== undefined ? Number(v) : undefined))
    .refine((v) => v === undefined || (v >= 2000 && v <= 2100), {
      message: "Year must be between 2000 and 2100.",
    }),
  forceRefresh: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((v) => v === true || v === "true"),
});

const quarterlyQuerySchema = z.object({
  year: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v !== undefined ? Number(v) : undefined))
    .refine((v) => v === undefined || (v >= 2000 && v <= 2100), {
      message: "Year must be between 2000 and 2100.",
    }),
});

const dailyLedgerQuerySchema = z.object({
  year: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v !== undefined ? Number(v) : undefined))
    .refine((v) => v === undefined || (v >= 2000 && v <= 2100), {
      message: "Year must be between 2000 and 2100.",
    }),
  month: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v !== undefined ? Number(v) : undefined))
    .refine((v) => v === undefined || (v >= 1 && v <= 12), {
      message: "Month must be between 1 and 12.",
    }),
});

const recalculateBodySchema = z.object({
  year: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v !== undefined ? Number(v) : undefined))
    .refine((v) => v === undefined || (v >= 2000 && v <= 2100), {
      message: "Year must be between 2000 and 2100.",
    }),
  month: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v !== undefined ? Number(v) : undefined))
    .refine((v) => v === undefined || (v >= 1 && v <= 12), {
      message: "Month must be between 1 and 12.",
    }),
});

module.exports = {
  periodNetProfitQuerySchema,
  monthlyOverviewQuerySchema,
  quarterlyQuerySchema,
  dailyLedgerQuerySchema,
  recalculateBodySchema,
};
