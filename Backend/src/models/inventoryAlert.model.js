const mongoose = require("mongoose");

const inventoryAlertSchema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    alertType: {
      type: String,
      required: true,
      default: "LOW_STOCK",
      enum: ["LOW_STOCK", "OUT_OF_STOCK", "EXPIRY_WARNING", "EXPIRY_CRITICAL"],
    },
    severity: {
      type: String,
      required: true,
      default: "WARNING",
      enum: ["CRITICAL", "WARNING", "INFO"],
    },
    currentStock: { type: Number, required: true },
    reorderLevel: { type: Number, required: true },
    deficitQty: { type: Number, required: true, default: 0.0 },
    status: {
      type: String,
      required: true,
      default: "UNREAD",
      enum: ["UNREAD", "ACKNOWLEDGED", "RESOLVED"],
    },
    message: { type: String, required: true },
    lastTriggeredAt: { type: Date, default: Date.now },
    acknowledgedAt: { type: Date, default: null },
    acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Account", default: null },
    resolvedAt: { type: Date, default: null },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Account", default: null },
  },
  { timestamps: true }
);

// Compound indexes for high-speed multi-tenant queries & deterministic deduplication
inventoryAlertSchema.index({ businessId: 1, productId: 1, alertType: 1, status: 1 });
inventoryAlertSchema.index({ businessId: 1, status: 1, createdAt: -1 });
inventoryAlertSchema.index({ businessId: 1, severity: 1, createdAt: -1 });
inventoryAlertSchema.index({ productId: 1 });

const InventoryAlert = mongoose.model("InventoryAlert", inventoryAlertSchema);

module.exports = InventoryAlert;
module.exports.InventoryAlert = InventoryAlert;