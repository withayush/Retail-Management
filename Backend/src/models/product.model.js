const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    sku: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 100,
    },

    barcode: {
      type: String,
      trim: true,
      default: null,
      maxlength: 100,
    },

    sellingPrice: {
      type: Number,
      required: true,
      min: [0, "Selling price cannot be negative."],
      default: 0.0,
    },

    costPrice: {
      type: Number,
      required: true,
      min: [0, "Cost price cannot be negative."],
      default: 0.0,
    },

    unit: {
      type: String,
      default: "pcs",
      trim: true,
      maxlength: 30,
    },

    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },

    isActive: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Multi-Tenant Isolation Indexes
// 1. SKU must be unique within the same business
productSchema.index({ businessId: 1, sku: 1 }, { unique: true });

// 2. Fast barcode lookup within the same business
productSchema.index({ businessId: 1, barcode: 1 }, { sparse: true });

// 3. Category filtering and creation timestamp sorting
productSchema.index({ businessId: 1, categoryId: 1 });
productSchema.index({ businessId: 1, createdAt: -1 });

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
module.exports.Product = Product;