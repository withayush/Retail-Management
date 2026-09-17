import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  name: { type: String, required: true, trim: true, maxlength: 150 },
  sku: { type: String, trim: true, maxlength: 100 },
  barcode: { type: String, trim: true, maxlength: 100 },
  sellingPrice: { type: Number, required: true, default: 0.00 },
  costPrice: { type: Number, required: true, default: 0.00 },
  unit: { type: String, default: 'pcs', maxlength: 30 },
  isActive: { type: Boolean, required: true, default: true }
}, { timestamps: true });

productSchema.index({ businessId: 1, sku: 1 }, { unique: true, sparse: true });
productSchema.index({ businessId: 1 });
productSchema.index({ categoryId: 1 });

export const Product = mongoose.model("Product", productSchema);