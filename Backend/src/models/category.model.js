import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, trim: true }
}, { timestamps: true });

categorySchema.index({ businessId: 1, name: 1 }, { unique: true });
categorySchema.index({ businessId: 1 });

export const Category = mongoose.model("Category", categorySchema);