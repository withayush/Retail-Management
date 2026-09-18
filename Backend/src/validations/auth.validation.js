const { z } = require("zod");
const mongoose = require("mongoose");

const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters.")
    .max(100, "Full name must not exceed 100 characters."),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please provide a valid email address.")
    .max(255, "Email must not exceed 255 characters."),

  phone: z
    .string()
    .trim()
    .regex(
      /^(\+91|91)?[6-9]\d{9}$/,
      "Please provide a valid Indian mobile number."
    ),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password must not exceed 128 characters.")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
    .regex(/\d/, "Password must contain at least one number.")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character."
    ),
});

const verifyPhoneSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(
      /^(\+91|91)?[6-9]\d{9}$/,
      "Please provide a valid Indian mobile number."
    ),

  otp: z
    .string()
    .trim()
    .regex(
      /^\d{6}$/,
      "OTP must be exactly 6 digits."
    ),
});


const resendPhoneOtpSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(
      /^(\+91|91)?[6-9]\d{9}$/,
      "Please provide a valid Indian mobile number."
    ),
});

const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "Email or phone is required."),

  password: z
    .string()
    .min(1, "Password is required."),
});

module.exports = {
  registerSchema, 
  verifyPhoneSchema,
  resendPhoneOtpSchema,
  loginSchema
};