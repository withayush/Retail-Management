const mongoose = require("mongoose");

/**
 * Phase 4 - Task T24: Sale Item Schema Model
 * Individual line item record preserving historical selling price, cost price snapshot,
 * line totals, and gross profit at checkout moment.
 */
const saleItemSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
    saleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    // Historical Product Snapshot (frozen at checkout)
    name: {
      type: String,
      trim: true,
      default: "",
    },
    sku: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },
    unit: {
      type: String,
      trim: true,
      default: "pcs",
    },

    // Price & Quantity Snapshot
    soldPrice: {
      type: Number,
      required: true,
      min: [0, "Sold price cannot be negative"],
    },
    costPrice: {
      type: Number,
      required: true,
      min: [0, "Cost price cannot be negative"],
      default: 0.0,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1"],
    },
    totalPrice: {
      type: Number,
      required: true,
      min: [0, "Total price cannot be negative"],
    },

    // Financial Performance Snapshot
    grossProfit: {
      type: Number,
      required: true,
      default: 0.0,
    },
  },
  { timestamps: true }
);

// High-speed multi-tenant and relational queries
saleItemSchema.index({ businessId: 1, saleId: 1 });
saleItemSchema.index({ businessId: 1, productId: 1, createdAt: -1 });
saleItemSchema.index({ businessId: 1, createdAt: -1 });

const SaleItem = mongoose.model("SaleItem", saleItemSchema);

module.exports = SaleItem;
