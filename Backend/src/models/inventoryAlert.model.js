import mongoose from "mongoose";

const inventoryAlertSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  alertType: { type: String, required: true, maxlength: 50 },
  severity: { type: String, required: true, default: 'WARNING', enum: ['CRITICAL', 'WARNING', 'INFO'] },
  currentStock: { type: Number, required: true },
  reorderLevel: { type: Number, required: true },
  deficitQty: { type: Number, required: true, default: 0.00 },
  status: { type: String, required: true, default: 'UNREAD', enum: ['UNREAD', 'ACKNOWLEDGED', 'RESOLVED'] },
  message: { type: String, required: true },
  lastTriggeredAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date, default: null }
}, { timestamps: true });

inventoryAlertSchema.index({ businessId: 1, status: 1 });
inventoryAlertSchema.index({ businessId: 1, severity: 1 });
inventoryAlertSchema.index({ productId: 1 });

export const InventoryAlert = mongoose.model("InventoryAlert", inventoryAlertSchema);