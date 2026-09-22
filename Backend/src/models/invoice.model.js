const mongoose = require("mongoose");

const invoiceItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name: { type: String, trim: true, default: "" },
  sku: { type: String, trim: true, uppercase: true, default: "" },
  quantity: { type: Number, required: true, min: 1 },
  unit: { type: String, default: "pcs" },
  soldPrice: { type: Number, required: true, min: 0 },
  costPrice: { type: Number, default: 0.0, min: 0 },
  totalPrice: { type: Number, required: true, min: 0 },
  grossProfit: { type: Number, default: 0.0 },
});

/**
 * Phase 4 - Task T23: Sale Transaction Schema Model
 * Primary business transactional record (Invoice Header).
 * Connects customers, products, stock movements (T19), and payment finances.
 */
const invoiceSchema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true },
    invoiceNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 50,
    },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null },
    customerName: { type: String, trim: true, maxlength: 100, default: "Walk-in Customer" },
    customerPhone: { type: String, trim: true, maxlength: 20, default: "" },

    // Financial Amounts
    subtotal: { type: Number, required: true, min: 0, default: 0.0 },
    discount: { type: Number, min: 0, default: 0.0 },
    tax: { type: Number, min: 0, default: 0.0 },
    total: { type: Number, required: true, min: 0, default: 0.0 },

    // Payment Tracking
    paidAmount: { type: Number, min: 0, default: 0.0 },
    dueAmount: { type: Number, min: 0, default: 0.0 },
    paymentStatus: {
      type: String,
      required: true,
      default: "PAID",
      enum: ["PAID", "PENDING", "PARTIAL", "FAILED", "CANCELLED"],
    },
    paymentMode: {
      type: String,
      required: true,
      default: "CASH",
      enum: ["CASH", "UPI", "CARD", "CREDIT_UDHAR", "SPLIT", "OTHER"],
    },
    status: {
      type: String,
      required: true,
      default: "COMPLETED",
      enum: ["COMPLETED", "DRAFT", "CANCELLED", "REFUNDED"],
    },

    // Audit Metadata
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Account", default: null },
    createdByName: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, default: "" },

    // PDF Generation & Storage Reference (Phase 4 - Task T27)
    invoicePdfUrl: { type: String, trim: true, default: null },
    pdfFileKey: { type: String, trim: true, default: null },
    pdfGeneratedAt: { type: Date, default: null },

    // Line items (linked / embedded)
    items: [invoiceItemSchema],
  },
  { timestamps: true }
);

// High-speed multi-tenant indexes & uniqueness guarantee per business
invoiceSchema.index({ businessId: 1, invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ businessId: 1, paymentStatus: 1, createdAt: -1 });
invoiceSchema.index({ businessId: 1, customerId: 1 });
invoiceSchema.index({ businessId: 1, createdAt: -1 });

const Invoice = mongoose.model("Invoice", invoiceSchema);
const SaleItem = require("./saleItem.model");

module.exports = Invoice;
module.exports.Invoice = Invoice;
module.exports.Sale = Invoice; // Alias for Task T23
module.exports.SaleItem = SaleItem; // Task T24