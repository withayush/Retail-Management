const mongoose = require("mongoose");

/**
 * Phase 6 - Task T37: Supplier Schema DB Model & Master Entity
 * 
 * Defines the business-scoped Supplier master entity representing distributors, 
 * manufacturers, wholesalers, and stockists from whom the business procures inventory.
 * 
 * Fields:
 * - _id: Unique ObjectId (Primary Key)
 * - businessId: Business tenant reference (Required, Indexed)
 * - company: Supplier / Firm / Company Name (Required, Trimmed, e.g. "ABC Distributors")
 * - contactName: Contact person at supplier firm (Trimmed, e.g. "Amit Sharma")
 * - phone: Mobile / Landline contact number (Trimmed, unique per business if provided)
 * - email: Email address (Trimmed, lowercase, optional)
 * - address: Physical business location / warehouse address
 * - city: City (Optional)
 * - state: State (Optional)
 * - pincode: PIN / Postal Code (Optional)
 * - gstin: Goods and Services Tax Identification Number (Optional, Uppercase)
 * - currentBalance: Real-time payable outstanding balance owed to supplier
 * - totalPurchases: Total historical procurement amount (₹)
 * - totalOrders: Total purchase orders / stock-in receipts count
 * - lastPurchaseDate: Timestamp of most recent purchase / Stock-IN
 * - lastPaymentDate: Timestamp of most recent supplier payment settlement
 * - status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED'
 * - notes: Additional merchant remarks / terms
 * - tags: Classification tags (e.g. ['WHOLESALER', 'FMCG', 'MANUFACTURER'])
 */
const supplierSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: [true, "Business ID is required"],
      index: true,
    },
    company: {
      type: String,
      required: [true, "Supplier company name is required"],
      trim: true,
      maxlength: [120, "Company name cannot exceed 120 characters"],
    },
    contactName: {
      type: String,
      trim: true,
      maxlength: [100, "Contact name cannot exceed 100 characters"],
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [20, "Phone number cannot exceed 20 characters"],
      default: "",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: [255, "Email cannot exceed 255 characters"],
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
    gstin: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: [20, "GSTIN cannot exceed 20 characters"],
      default: "",
    },
    currentBalance: {
      type: Number,
      required: true,
      default: 0.0,
      min: 0,
    },
    totalPurchases: {
      type: Number,
      default: 0.0,
      min: 0,
    },
    totalOrders: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastPurchaseDate: {
      type: Date,
      default: null,
    },
    lastPaymentDate: {
      type: Date,
      default: null,
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

// Compound Multi-Tenant Unique Index: Ensures unique phone per business when phone is provided
supplierSchema.index(
  { businessId: 1, phone: 1 },
  {
    unique: true,
    partialFilterExpression: { phone: { $type: "string", $gt: "" } },
  }
);

// Compound Indexes for fast searching, sorting, and balance tracking
supplierSchema.index({ businessId: 1, company: 1 });
supplierSchema.index({ businessId: 1, currentBalance: -1 });
supplierSchema.index({ businessId: 1, status: 1 });
supplierSchema.index({ businessId: 1, createdAt: -1 });

const Supplier = mongoose.model("Supplier", supplierSchema);

/**
 * Phase 6 - Task T39: Supplier Ledger Transaction Log
 * Double-entry / sub-ledger transaction log recording every procurement credit (+InvoiceValue)
 * and payment disbursement (-PaymentAmount) to track business accounts payable owed to suppliers.
 * 
 * Symmetrical counterpart to Customer Ledger (T33), but inverted financial relationship:
 * - Customer owes Business (Receivable)
 * - Business owes Supplier (Payable)
 * 
 * Formula: Running Balance = Previous Balance + InvoiceValue (Purchase) - PaymentAmount (Disbursement)
 * Schema: (ID, SupplierID, InvoiceValue, PaymentAmount, Balance, PurchaseID, ReferenceID, PaymentMethod, Notes, CreatedAt)
 */
const supplierLedgerEntrySchema = new mongoose.Schema(
  {
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
      index: true,
    },
    purchaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Purchase",
      default: null,
    },
    purchaseInvoiceNumber: {
      type: String,
      trim: true,
      default: "",
    },
    entryType: {
      type: String,
      required: true,
      enum: ["PURCHASE_CREDIT", "PAYMENT_MADE", "OPENING_BALANCE", "ADJUSTMENT", "REFUND"],
      default: "PURCHASE_CREDIT",
    },
    // Purchase / Procurement cost delivered on credit (Increases payable debt)
    invoiceValue: {
      type: Number,
      required: true,
      default: 0.0,
      min: 0,
    },
    // Cash / Bank payout made to supplier (Decreases payable debt)
    paymentAmount: {
      type: Number,
      required: true,
      default: 0.0,
      min: 0,
    },
    // Authoritative running payable balance after this entry
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
    paymentMethod: {
      type: String,
      trim: true,
      uppercase: true,
      enum: ["CASH", "UPI", "BANK_TRANSFER", "CHEQUE", "CARD", "OTHER", ""],
      default: "",
    },
    referenceId: {
      type: String,
      trim: true,
      default: "",
    },
    grnId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GoodsReceivedNote",
      default: null,
    },
    grnNumber: {
      type: String,
      trim: true,
      default: "",
    },
    idempotencyKey: {
      type: String,
      trim: true,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
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
 * Supplier Ledger Document (1:1 with Supplier per Business Tenant)
 */
const supplierLedgerSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
      index: true,
    },
    supplierCompany: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    supplierPhone: {
      type: String,
      trim: true,
      maxlength: 20,
      default: "",
    },
    balance: {
      type: Number,
      required: true,
      default: 0.0,
      min: 0,
    },
    entries: [supplierLedgerEntrySchema],
  },
  { timestamps: true }
);

// Multi-tenant unique index: 1 ledger per supplier per business
supplierLedgerSchema.index({ businessId: 1, supplierId: 1 }, { unique: true });
supplierLedgerSchema.index({ businessId: 1, supplierPhone: 1 });
supplierLedgerSchema.index({ businessId: 1, balance: -1 });
supplierLedgerSchema.index({ "entries.idempotencyKey": 1 });
supplierLedgerSchema.index({ "entries.purchaseId": 1 });
supplierLedgerSchema.index({ "entries.purchaseInvoiceNumber": 1 });

const SupplierLedger = mongoose.model("SupplierLedger", supplierLedgerSchema);

module.exports = {
  Supplier,
  SupplierLedger,
};

