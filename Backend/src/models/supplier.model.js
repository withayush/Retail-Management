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

module.exports = Supplier;
