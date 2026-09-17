import mongoose from "mongoose";

const businessSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, unique: true },
  businessName: { type: String, required: true, trim: true, maxlength: 150 },
  businessType: { type: String, required: true, trim: true, maxlength: 100 },
  category: { type: String, trim: true, maxlength: 100 },
  description: { type: String, trim: true },
  businessEmail: { type: String, lowercase: true, trim: true, maxlength: 255 },
  businessPhone: { type: String, trim: true, maxlength: 20 },
  whatsappNumber: { type: String, trim: true, maxlength: 20 },
  addressLine: { type: String, trim: true },
  city: { type: String, trim: true, maxlength: 100 },
  state: { type: String, trim: true, maxlength: 100 },
  pincode: { type: String, trim: true, maxlength: 20 },
  website: { type: String, trim: true, maxlength: 255 },
  logoUrl: { type: String, trim: true }
}, { timestamps: true });

export const Business = mongoose.model("Business", businessSchema);