import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  phone: { type: String, required: true, trim: true, maxlength: 20 },
  email: { type: String, trim: true, lowercase: true, maxlength: 255 },
  address: { type: String, trim: true }
}, { timestamps: true });

customerSchema.index({ businessId: 1, phone: 1 }, { unique: true });
customerSchema.index({ businessId: 1 });

export const Customer = mongoose.model("Customer", customerSchema);

const customerLedgerEntrySchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
  saleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', default: null },
  creditAmount: { type: Number, required: true, default: 0.00 },
  debitAmount: { type: Number, required: true, default: 0.00 },
  balanceSnapshot: { type: Number, required: true },
  entryType: { type: String, required: true, enum: ['CREDIT_SALE', 'PAYMENT_RECEIVED', 'ADJUSTMENT'] },
  notes: { type: String, trim: true }
}, { timestamps: { createdAt: true, updatedAt: false } });

const customerLedgerSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
  customerName: { type: String, required: true, trim: true, maxlength: 100 },
  customerPhone: { type: String, required: true, trim: true, maxlength: 20 },
  balance: { type: Number, required: true, default: 0.00 },
  entries: [customerLedgerEntrySchema]
}, { timestamps: true });

customerLedgerSchema.index({ businessId: 1, customerPhone: 1 }, { unique: true });
customerLedgerSchema.index({ businessId: 1 });
customerLedgerSchema.index({ customerId: 1 });

export const CustomerLedger = mongoose.model("CustomerLedger", customerLedgerSchema);