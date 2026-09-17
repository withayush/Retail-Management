import mongoose from "mongoose";

const invoiceItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  soldPrice: { type: Number, required: true },
  costPrice: { type: Number, required: true, default: 0.00 },
  totalPrice: { type: Number, required: true }
});

const invoiceSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  invoiceNumber: { type: String, required: true, trim: true, maxlength: 50 },
  customerName: { type: String, trim: true, maxlength: 100 },
  customerPhone: { type: String, trim: true, maxlength: 20 },
  subtotal: { type: Number, required: true, default: 0.00 },
  discountTotal: { type: Number, required: true, default: 0.00 },
  taxTotal: { type: Number, required: true, default: 0.00 },
  grandTotal: { type: Number, required: true, default: 0.00 },
  paymentMode: { type: String, required: true, default: 'CASH', maxlength: 30 },
  paymentStatus: { type: String, required: true, default: 'PAID', enum: ['PAID', 'PENDING', 'CANCELLED'] },
  items: [invoiceItemSchema]
}, { timestamps: true });

invoiceSchema.index({ businessId: 1 });

export const Invoice = mongoose.model("Invoice", invoiceSchema);