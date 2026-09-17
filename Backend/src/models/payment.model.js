import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
  amount: { type: Number, required: true },
  method: { type: String, required: true, default: 'CASH', enum: ['CASH', 'UPI', 'CARD', 'CREDIT'] },
  referenceId: { type: String, trim: true, maxlength: 100 }
}, { timestamps: { createdAt: true, updatedAt: false } });

paymentSchema.index({ businessId: 1 });
paymentSchema.index({ invoiceId: 1 });

export const Payment = mongoose.model("Payment", paymentSchema);