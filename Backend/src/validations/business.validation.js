const { z } = require("zod");

const createBusinessSchema = z.object({
  businessName: z
    .string()
    .trim()
    .min(2, "Business name must be at least 2 characters.")
    .max(150, "Business name must not exceed 150 characters."),

  retailSegment: z
    .string()
    .trim()
    .max(100, "Retail segment must not exceed 100 characters.")
    .default("General Retail"),

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
    .regex(/^(\+91|91)?[6-9]\d{9}$/, "Please provide a valid Indian mobile number.")
    .optional()
    .or(z.literal("")),

  whatsappNumber: z
    .string()
    .trim()
    .regex(/^(\+91|91)?[6-9]\d{9}$/, "Please provide a valid Indian WhatsApp number.")
    .optional()
    .or(z.literal("")),

  addressLine: z.string().trim().max(255).optional(),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  pincode: z.string().trim().max(20).optional(),
  website: z.string().trim().url("Please provide a valid website URL.").max(255).optional().or(z.literal("")),
  logoUrl: z.string().trim().url("Please provide a valid logo URL.").optional().or(z.literal("")),
});

const updateBusinessSchema = createBusinessSchema.partial();

module.exports = {
  createBusinessSchema,
  updateBusinessSchema,
};
