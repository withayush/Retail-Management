const mongoose = require("mongoose");

/**
 * Phase 4 - Task T29 & Phase 5 Foundation: Customer Model
 * Multi-tenant customer directory with real-time outstanding balance tracking and credit limits.
 */
const customerSchema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    email: { type: String, trim: true, lowercase: true, maxlength: 255, default: "" },
    address: { type: String, trim: true, default: "" },
    currentBalance: { type: Number, required: true, default: 0.0 }, // Total outstanding debt owed to store
    creditLimit: { type: Number, required: true, default: 0.0 }, // 0 = unlimited, > 0 = maximum allowed credit
    lastPaymentDate: { type: Date, default: null },
    lastPurchaseDate: { type: Date, default: null },
    totalSpent: { type: Number, default: 0.0 },
    totalOrders: { type: Number, default: 0 },
    status: { type: String, enum: ["ACTIVE", "INACTIVE", "BLOCKED"], default: "ACTIVE" },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);


customerSchema.index({ businessId: 1, phone: 1 }, { unique: true });
customerSchema.index({ businessId: 1, currentBalance: -1 });
customerSchema.index({ businessId: 1, name: 1 });

const Customer = mongoose.model("Customer", customerSchema);

/**
 * Phase 4 - Task T29: Customer Outstanding Ledger Entry
 * Immutable financial ledger transaction recording debits (credit sales) and credits (settlement payments).
 */
const customerLedgerEntrySchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice", default: null },
    invoiceNumber: { type: String, trim: true, default: "" },
    entryType: {
      type: String,
      required: true,
      enum: ["SALE_CREDIT", "CREDIT_SALE", "PAYMENT_RECEIVED", "ADJUSTMENT", "REFUND"],
      default: "SALE_CREDIT",
    },
    debitAmount: { type: Number, required: true, default: 0.0 }, // Debt added (e.g. unpaid invoice amount)
    creditAmount: { type: Number, required: true, default: 0.0 }, // Debt cleared (e.g. cash/UPI settlement)
    balanceSnapshot: { type: Number, required: true }, // Customer's total balance immediately after this entry
    notes: { type: String, trim: true, default: "" },
    idempotencyKey: { type: String, trim: true, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Account", default: null },
    createdByName: { type: String, trim: true, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

/**
 * Phase 4 - Task T29: Customer Ledger Document (1:1 with Customer per Business)
 */
const customerLedgerSchema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    customerName: { type: String, required: true, trim: true, maxlength: 100 },
    customerPhone: { type: String, required: true, trim: true, maxlength: 20 },
    balance: { type: Number, required: true, default: 0.0 },
    entries: [customerLedgerEntrySchema],
  },
  { timestamps: true }
);

customerLedgerSchema.index({ businessId: 1, customerId: 1 }, { unique: true });
customerLedgerSchema.index({ businessId: 1, customerPhone: 1 });
customerLedgerSchema.index({ businessId: 1, balance: -1 });
customerLedgerSchema.index({ "entries.idempotencyKey": 1 });
customerLedgerSchema.index({ "entries.invoiceId": 1 });

const CustomerLedger = mongoose.model("CustomerLedger", customerLedgerSchema);

module.exports = {
  Customer,
  CustomerLedger,
};