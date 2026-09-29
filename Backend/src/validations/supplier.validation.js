const { z } = require("zod");

/**
 * Phase 6 - Task T38: Supplier Request Validation Schemas (Zod)
 */

const createSupplierSchema = z.object({
  company: z
    .string({ required_error: "Supplier company name is required" })
    .trim()
    .min(1, "Supplier company name cannot be empty")
    .max(120, "Supplier company name cannot exceed 120 characters"),
  contactName: z
    .string()
    .trim()
    .max(100, "Contact name cannot exceed 100 characters")
    .optional()
    .default(""),
  phone: z
    .string()
    .trim()
    .max(20, "Phone number cannot exceed 20 characters")
    .optional()
    .default(""),
  email: z
    .string()
    .trim()
    .email("Invalid email address format")
    .max(255, "Email cannot exceed 255 characters")
    .optional()
    .or(z.literal("")),
  address: z.string().trim().optional().default(""),
  city: z.string().trim().optional().default(""),
  state: z.string().trim().optional().default(""),
  pincode: z.string().trim().optional().default(""),
  gstin: z.string().trim().max(20, "GSTIN cannot exceed 20 characters").optional().default(""),
  notes: z.string().trim().optional().default(""),
  tags: z.array(z.string().trim()).optional().default([]),
  status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]).optional().default("ACTIVE"),
});

const updateSupplierSchema = z.object({
  company: z
    .string()
    .trim()
    .min(1, "Company name cannot be empty")
    .max(120, "Company name cannot exceed 120 characters")
    .optional(),
  contactName: z
    .string()
    .trim()
    .max(100, "Contact name cannot exceed 100 characters")
    .optional(),
  phone: z
    .string()
    .trim()
    .max(20, "Phone number cannot exceed 20 characters")
    .optional(),
  email: z
    .string()
    .trim()
    .email("Invalid email address format")
    .max(255, "Email cannot exceed 255 characters")
    .optional()
    .or(z.literal("")),
  address: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  pincode: z.string().trim().optional(),
  gstin: z.string().trim().max(20, "GSTIN cannot exceed 20 characters").optional(),
  notes: z.string().trim().optional(),
  tags: z.array(z.string().trim()).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]).optional(),
});

module.exports = {
  createSupplierSchema,
  updateSupplierSchema,
};
