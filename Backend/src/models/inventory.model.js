const mongoose = require("mongoose");

/**
 * Phase 3 - Task T15: Inventory Store State Master Model
 * Tracks physical current quantities and reorder thresholds linked to base Product ID.
 */
const inventorySchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    availableStock: {
      type: Number,
      required: true,
      default: 0.0,
      min: [0, "Available stock cannot be negative."],
    },
    reorderLevel: {
      type: Number,
      required: true,
      default: 5.0,
      min: [0, "Reorder level cannot be negative."],
    },
    reservedStock: {
      type: Number,
      default: 0.0,
      min: [0, "Reserved stock cannot be negative."],
    },
    lowStockAlert: {
      type: Boolean,
      default: false,
      index: true,
    },
    lastRestockedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Pre-save hook to calculate lowStockAlert flag
inventorySchema.pre("save", function () {
  this.lowStockAlert = this.availableStock <= this.reorderLevel;
});

// Multi-Tenant Isolation & Seek Indexes:
// 1. Exactly one inventory record per product within a business
inventorySchema.index({ businessId: 1, productId: 1 }, { unique: true });

// 2. Fast low stock & valuation aggregation indexes
inventorySchema.index({ businessId: 1, availableStock: 1 });
inventorySchema.index({ businessId: 1, lowStockAlert: 1, availableStock: 1 });

const Inventory = mongoose.model("Inventory", inventorySchema);

/**
 * Phase 3 - Task T16: Inventory Ledger Schema Model
 * Immutable audit trail capturing every physical stock movement.
 * Architectural Rule: Never overwrite stock directly. All stock movement written as ledger logs.
 */
const inventoryLedgerSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    qtyChange: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
      min: [0, "Balance after cannot be negative."],
    },
    type: {
      type: String,
      required: true,
      enum: ["IN", "OUT", "ADJUST", "OPENING", "RETURN"],
      index: true,
    },
    source: {
      type: String,
      enum: [
        "PURCHASE",
        "GOODS_RECEIPT",
        "SALE",
        "POS_CHECKOUT",
        "DAMAGE",
        "EXPIRED",
        "RETURN_TO_VENDOR",
        "SAMPLE",
        "AUDIT_RECONCILIATION",
        "THEFT_SHRINKAGE",
        "SPILLAGE",
        "FOUND_STOCK",
        "CORRECTION",
        "ADJUSTMENT",
        "MANUAL",
        "RETURN",
        "INITIAL_OPENING",
        "TRANSFER",
        "OTHER",
      ],
      default: "MANUAL",
      index: true,
    },
    supplierName: {
      type: String,
      trim: true,
      default: "",
    },
    unitCost: {
      type: Number,
      min: [0, "Unit cost cannot be negative."],
      default: null,
    },
    referenceNumber: {
      type: String,
      trim: true,
      default: "",
    },
    reason: {
      type: String,
      trim: true,
      default: "",
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      default: null,
      index: true,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      default: null,
      index: true,
    },
    createdByName: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// High-Performance Audit & Timeline Indexes
inventoryLedgerSchema.index({ businessId: 1, productId: 1, createdAt: -1 });
inventoryLedgerSchema.index({ businessId: 1, type: 1, createdAt: -1 });
inventoryLedgerSchema.index({ businessId: 1, source: 1, createdAt: -1 });
inventoryLedgerSchema.index({ businessId: 1, createdBy: 1, createdAt: -1 });
inventoryLedgerSchema.index({ businessId: 1, createdAt: -1 });
inventoryLedgerSchema.index({ businessId: 1, invoiceId: 1 });

const InventoryLedger = mongoose.model("InventoryLedger", inventoryLedgerSchema);

module.exports = {
  Inventory,
  InventoryLedger,
};