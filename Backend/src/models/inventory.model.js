const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, unique: true },
    availableStock: { type: Number, required: true, default: 0.00 },
    reorderLevel: { type: Number, required: true, default: 5.00 },
  },
  { timestamps: true }
);

inventorySchema.index({ businessId: 1 });
inventorySchema.index({ productId: 1 });

const Inventory = mongoose.model("Inventory", inventorySchema);

const inventoryLedgerSchema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    qtyChange: { type: Number, required: true },
    type: { type: String, required: true, enum: ["IN", "OUT", "ADJUST", "OPENING"] },
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice", default: null },
    referenceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    notes: { type: String, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

inventoryLedgerSchema.index({ businessId: 1, type: 1, productId: 1 });
inventoryLedgerSchema.index({ businessId: 1, createdAt: -1 });
inventoryLedgerSchema.index({ invoiceId: 1 });

const InventoryLedger = mongoose.model("InventoryLedger", inventoryLedgerSchema);

module.exports = {
  Inventory,
  InventoryLedger,
};