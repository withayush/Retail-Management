const { z } = require("zod");
const { normalizePhone } = require("../utils/phone");

const ALLOWED_RETAIL_SEGMENTS = [
  "Retail/Kirana",
  "Kirana",
  "Retail",
  "General Retail",
  "Grocery",
  "Supermarket",
  "FMCG Retail",
];

const createBusinessSchema = z.object({
  businessName: z
    .string({ required_error: "Business name is required." })
    .trim()
    .min(2, "Business name must be at least 2 characters.")
    .max(150, "Business name must not exceed 150 characters."),

  retailSegment: z
    .string()
    .trim()
    .default("Retail/Kirana")
    .refine(
      (val) =>
        ALLOWED_RETAIL_SEGMENTS.some(
          (seg) => seg.toLowerCase() === val.toLowerCase()
        ),
      {
        message: `Segmentation is restricted initially to Retail/Kirana. Allowed values: ${ALLOWED_RETAIL_SEGMENTS.join(", ")}.`,
      }
    ),

  businessType: z
    .string()
    .trim()
    .max(100)
    .optional(),

  category: z
    .string()
    .trim()
    .max(100)
    .optional(),

  description: z
    .string()
    .trim()
    .max(500)
    .optional(),

  businessEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please provide a valid email address.")
    .max(255)
    .optional()
    .or(z.literal("")),

  businessPhone: z
    .string()
    .trim()
    .transform((val) => (val ? normalizePhone(val) : ""))
    .refine(
      (val) => !val || /^\+91[6-9]\d{9}$/.test(val),
      { message: "Please provide a valid Indian mobile number." }
    )
    .optional()
    .or(z.literal("")),

  whatsappNumber: z
    .string()
    .trim()
    .transform((val) => (val ? normalizePhone(val) : ""))
    .refine(
      (val) => !val || /^\+91[6-9]\d{9}$/.test(val),
      { message: "Please provide a valid Indian WhatsApp number." }
    )
    .optional()
    .or(z.literal("")),

  addressLine: z.string().trim().max(255).optional(),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Pincode must be a valid 6-digit Indian postal code.")
    .optional()
    .or(z.literal("")),
  website: z.string().trim().url("Please provide a valid website URL.").max(255).optional().or(z.literal("")),
  logoUrl: z.string().trim().url("Please provide a valid logo URL.").optional().or(z.literal("")),

  operatingHours: z
    .object({
      open: z.string().trim().max(20).optional(),
      close: z.string().trim().max(20).optional(),
      days: z.array(z.string().trim().max(10)).optional(),
      notes: z.string().trim().max(255).optional(),
    })
    .optional(),

  status: z
    .enum(["ACTIVE", "INACTIVE", "ARCHIVED"])
    .optional(),
});

const updateBusinessSchema = createBusinessSchema.partial();

const onboardingStep1Schema = z.object({
  businessName: z
    .string({ required_error: "Business name is required." })
    .trim()
    .min(2, "Business name must be at least 2 characters.")
    .max(150, "Business name must not exceed 150 characters."),

  retailSegment: z
    .string()
    .trim()
    .default("Retail/Kirana")
    .refine(
      (val) =>
        ALLOWED_RETAIL_SEGMENTS.some(
          (seg) => seg.toLowerCase() === val.toLowerCase()
        ),
      {
        message: `Segmentation is restricted initially to Retail/Kirana. Allowed values: ${ALLOWED_RETAIL_SEGMENTS.join(", ")}.`,
      }
    ),

  businessType: z.string().trim().max(100).optional(),
  category: z.string().trim().max(100).optional(),
});

const onboardingStep2Schema = z.object({
  addressLine: z.string().trim().max(255).optional(),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Pincode must be a valid 6-digit Indian postal code.")
    .optional()
    .or(z.literal("")),
  businessPhone: z
    .string()
    .trim()
    .transform((val) => (val ? normalizePhone(val) : ""))
    .refine(
      (val) => !val || /^\+91[6-9]\d{9}$/.test(val),
      { message: "Please provide a valid Indian mobile number." }
    )
    .optional()
    .or(z.literal("")),
  whatsappNumber: z
    .string()
    .trim()
    .transform((val) => (val ? normalizePhone(val) : ""))
    .refine(
      (val) => !val || /^\+91[6-9]\d{9}$/.test(val),
      { message: "Please provide a valid Indian WhatsApp number." }
    )
    .optional()
    .or(z.literal("")),
  businessEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please provide a valid email address.")
    .max(255)
    .optional()
    .or(z.literal("")),
});

const onboardingStep3Schema = z.object({
  operatingHours: z
    .object({
      open: z.string().trim().max(20).optional(),
      close: z.string().trim().max(20).optional(),
      days: z.array(z.string().trim().max(10)).optional(),
      notes: z.string().trim().max(255).optional(),
    })
    .optional(),
  description: z.string().trim().max(500).optional(),
  website: z.string().trim().url("Please provide a valid website URL.").max(255).optional().or(z.literal("")),
  logoUrl: z.string().trim().url("Please provide a valid logo URL.").optional().or(z.literal("")),
});

const saveOnboardingStepSchema = z.object({
  step: z.number().int().min(1).max(3),
  data: z.record(z.any()),
});

module.exports = {
  ALLOWED_RETAIL_SEGMENTS,
  createBusinessSchema,
  updateBusinessSchema,
  onboardingStep1Schema,
  onboardingStep2Schema,
  onboardingStep3Schema,
  saveOnboardingStepSchema,
};

