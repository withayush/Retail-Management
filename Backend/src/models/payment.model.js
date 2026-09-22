const mongoose = require("mongoose");

/**
 * Phase 4 - Task T28: Payment Recording Entity
 * Standalone payment ledger records isolating payments from invoices.
 * Supports partial payments, multiple tranches, split checks, and credit tracking.
 */
const paymentSchema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true },
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice", required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null },
    amount: { type: Number, required: true, min: 0.01 },
    method: {
      type: String,
      required: true,
      default: "CASH",
      enum: ["CASH", "UPI", "CARD", "CREDIT", "CREDIT_UDHAR", "SPLIT", "OTHER"],
    },
    referenceId: { type: String, trim: true, maxlength: 100, default: null },
    status: {
      type: String,
      required: true,
      default: "SUCCESS",
      enum: ["SUCCESS", "PENDING", "FAILED", "REFUNDED"],
    },
    notes: { type: String, trim: true, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Account", default: null },
    createdByName: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

paymentSchema.index({ businessId: 1, invoiceId: 1 });
paymentSchema.index({ businessId: 1, createdAt: -1 });
paymentSchema.index({ businessId: 1, method: 1 });
paymentSchema.index({ businessId: 1, customerId: 1 });

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;
module.exports.Payment = Payment;