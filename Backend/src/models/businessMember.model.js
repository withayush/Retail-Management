import mongoose from "mongoose";

const businessMemberSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  role: { type: String, required: true, default: 'STAFF', enum: ['OWNER', 'MANAGER', 'ACCOUNTANT', 'STAFF'] },
  status: { type: String, required: true, default: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE'] },
  joinedAt: { type: Date, default: Date.now }
}, { timestamps: true });

businessMemberSchema.index({ businessId: 1, accountId: 1 }, { unique: true });
businessMemberSchema.index({ accountId: 1 });
businessMemberSchema.index({ businessId: 1 });

export const BusinessMember = mongoose.model("BusinessMember", businessMemberSchema);