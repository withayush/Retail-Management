const mongoose = require("mongoose");

/**
 * Phase 5 - Task T31: Customer Schema DB Model & Master Entity
 * Stores customer demographic details and credit limits anchored strictly under a specific business account (Multi-Tenant).
 * 
 * Fields:
 * - _id: Unique ObjectId (Primary Key)
 * - businessId: Business tenant reference (Required, Indexed)
 * - name: Customer full name (Required, Trimmed)
 * - phone: Mobile contact number (Trimmed, unique per business if provided)
 * - email: Email address (Trimmed, lowercase, optional)
 * - address: Physical/delivery address
 * - city: City (Optional)
 * - state: State (Optional)
 * - pincode: PIN/Postal Code (Optional)
 * - currentBalance: Real-time outstanding debt / Udhaar balance
 * - creditLimit: Maximum allowed credit (0 = unlimited)
 * - status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED'
 * - notes: Additional merchant notes
 * - tags: Custom classification tags (e.g. 'WHOLESALE', 'VIP', 'REGULAR')
 */
const customerSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 20,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 255,
      default: "",
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    city: {
      type: String,
      trim: true,
      default: "",
    },
    state: {
      type: String,
      trim: true,
      default: "",
    },
    pincode: {
      type: String,
      trim: true,
      default: "",
    },
    currentBalance: {
      type: Number,
      required: true,
      default: 0.0,
      min: 0,
    },
    creditLimit: {
      type: Number,
      required: true,
      default: 0.0,
      min: 0,
    },
    lastPaymentDate: {
      type: Date,
      default: null,
    },
    lastPurchaseDate: {
      type: Date,
      default: null,
    },
    totalSpent: {
      type: Number,
      default: 0.0,
      min: 0,
    },
    totalOrders: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "BLOCKED"],
      default: "ACTIVE",
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound Multi-Tenant Unique Index: Ensures unique phone per business when phone is non-empty
customerSchema.index(
  { businessId: 1, phone: 1 },
  {
    unique: true,
    partialFilterExpression: { phone: { $type: "string", $gt: "" } },
  }
);

// Compound Indexes for fast queries, balance ranking, and search
customerSchema.index({ businessId: 1, currentBalance: -1 });
customerSchema.index({ businessId: 1, name: 1 });
customerSchema.index({ businessId: 1, createdAt: -1 });
customerSchema.index({ businessId: 1, status: 1 });

const Customer = mongoose.model("Customer", customerSchema);

/**
 * Phase 5 - Task T33: Customer Ledger Transaction Log
 * Double-entry / sub-ledger transaction log recording every credit sale (+CreditAmount) and settlement payment (-DebitAmount).
 * 
 * Schema: (ID, CustomerID, CreditAmount, DebitAmount, Balance, SaleID, Notes, CreatedAt)
 */
const customerLedgerEntrySchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    saleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      default: null,
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      default: null,
    },
    invoiceNumber: {
      type: String,
      trim: true,
      default: "",
    },
    entryType: {
      type: String,
      required: true,
      enum: ["SALE_CREDIT", "CREDIT_SALE", "PAYMENT_RECEIVED", "ADJUSTMENT", "REFUND"],
      default: "SALE_CREDIT",
    },
    paymentMethod: {
      type: String,
      trim: true,
      uppercase: true,
      default: "CASH",
    },
    creditAmount: {
      type: Number,
      required: true,
      default: 0.0,
      min: 0,
    },
    debitAmount: {
      type: Number,
      required: true,
      default: 0.0,
      min: 0,
    },
    balance: {
      type: Number,
      required: true,
      default: 0.0,
      min: 0,
    },
    balanceSnapshot: {
      type: Number,
      required: true,
      default: 0.0,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    idempotencyKey: {
      type: String,
      trim: true,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      default: null,
    },
    createdByName: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

/**
 * Customer Ledger Document (1:1 with Customer per Business)
 */
const customerLedgerSchema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
    customerName: { type: String, required: true, trim: true, maxlength: 100 },
    customerPhone: { type: String, required: true, trim: true, maxlength: 20 },
    balance: { type: Number, required: true, default: 0.0, min: 0 },
    entries: [customerLedgerEntrySchema],
  },
  { timestamps: true }
);

customerLedgerSchema.index({ businessId: 1, customerId: 1 }, { unique: true });
customerLedgerSchema.index({ businessId: 1, customerPhone: 1 });
customerLedgerSchema.index({ businessId: 1, balance: -1 });
customerLedgerSchema.index({ "entries.idempotencyKey": 1 });
customerLedgerSchema.index({ "entries.saleId": 1 });
customerLedgerSchema.index({ "entries.invoiceId": 1 });

const CustomerLedger = mongoose.model("CustomerLedger", customerLedgerSchema);

module.exports = {
  Customer,
  CustomerLedger,
};