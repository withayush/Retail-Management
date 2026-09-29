const mongoose = require("mongoose");

/**
 * Phase 7 - Task T44: Goods Received Note (GRN) Item Sub-Schema
 * Represents physically received stock lines against an official Purchase Order.
 */
const grnItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [150, "Item name cannot exceed 150 characters"],
    },
    sku: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: [50, "SKU cannot exceed 50 characters"],
      default: "",
    },
    unit: {
      type: String,
      trim: true,
      default: "pcs",
    },
    costPrice: {
      type: Number,
      required: true,
      min: [0, "Cost price cannot be negative"],
      default: 0.0,
    },
    orderedQty: {
      type: Number,
      required: true,
      min: [0, "Ordered quantity cannot be negative"],
      default: 0,
    },
    previouslyReceivedQty: {
      type: Number,
      required: true,
      min: [0, "Previously received quantity cannot be negative"],
      default: 0,
    },
    receivedQty: {
      type: Number,
      required: [true, "Received quantity is required"],
      min: [0, "Received quantity cannot be negative"],
      default: 0,
    },
    remainingQty: {
      type: Number,
      required: true,
      min: [0, "Remaining quantity cannot be negative"],
      default: 0,
    },
    variance: {
      type: Number,
      required: true,
      default: 0, // = (previouslyReceivedQty + receivedQty) - orderedQty (0: exact, <0: partial, >0: over-delivery)
    },
    totalCost: {
      type: Number,
      required: true,
      min: [0, "Total cost cannot be negative"],
      default: 0.0, // = receivedQty * costPrice
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: true }
);

/**
 * Phase 7 - Task T44: Goods Received Note (GRN) Master DB Model
 * 
 * Records the physical delivery confirmation of stock against a Purchase Order.
 * 
 * Core Architectural Rules:
 * 1. PO = Order request/commitment (Stock does NOT increase).
 * 2. GRN = Physical stock delivery confirmation (Stock IN increases inventory count).
 * 3. Inventory Stock IN & Immutable Ledger:
 *    - Each physically received item increments `availableStock` on `Inventory`.
 *    - An immutable `InventoryLedger` log with `type: 'IN'` and `source: 'GOODS_RECEIPT'` is persisted.
 * 4. Purchase Order Progression:
 *    - Updates `receivedQuantity` on PO line items (`PurchaseItem`).
 *    - Updates PO status (`PARTIAL` or `RECEIVED` based on total received vs ordered).
 * 5. Multi-Tenant Scoping:
 *    - Strictly scoped to `businessId` with unique sequential numbering (`GRN-1001`, `GRN-1002`).
 */
const grnSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: [true, "Business ID is required"],
      index: true,
    },
    grnNumber: {
      type: String,
      required: [true, "GRN Number is required"],
      trim: true,
      uppercase: true,
      maxlength: [50, "GRN Number cannot exceed 50 characters"],
    },
    purchaseOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PurchaseOrder",
      required: [true, "Purchase Order ID is required"],
      index: true,
    },
    poNumber: {
      type: String,
      required: [true, "PO Number is required"],
      trim: true,
      uppercase: true,
      default: "",
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: [true, "Supplier ID is required"],
      index: true,
    },
    supplierCompany: {
      type: String,
      trim: true,
      maxlength: [120, "Supplier company name cannot exceed 120 characters"],
      default: "",
    },
    receivedDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ["COMPLETED", "CANCELLED"],
      default: "COMPLETED",
      index: true,
    },
    items: [grnItemSchema],
    totalItemsReceived: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Total items received cannot be negative"],
    },
    totalCostReceived: {
      type: Number,
      required: true,
      default: 0.0,
      min: [0, "Total cost received cannot be negative"],
    },
    deliveryChallanNumber: {
      type: String,
      trim: true,
      maxlength: [100, "Challan number cannot exceed 100 characters"],
      default: "",
    },
    invoiceNumber: {
      type: String,
      trim: true,
      maxlength: [100, "Invoice number cannot exceed 100 characters"],
      default: "",
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      default: null,
      index: true,
    },
    receivedByName: {
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
  {
    timestamps: true,
  }
);

// High-speed multi-tenant unique index
grnSchema.index({ businessId: 1, grnNumber: 1 }, { unique: true });

// Relational and query filtering indexes
grnSchema.index({ businessId: 1, purchaseOrderId: 1, createdAt: -1 });
grnSchema.index({ businessId: 1, supplierId: 1, createdAt: -1 });
grnSchema.index({ businessId: 1, receivedDate: -1 });
grnSchema.index({ businessId: 1, status: 1, createdAt: -1 });
grnSchema.index({ businessId: 1, createdAt: -1 });

// Automatically compute totals before saving
grnSchema.pre("save", function () {
  if (this.items && Array.isArray(this.items)) {
    let totalQty = 0;
    let totalCost = 0;

    this.items.forEach((item) => {
      const rQty = Number(item.receivedQty) || 0;
      const cPrice = Number(item.costPrice) || 0;
      item.totalCost = Number((rQty * cPrice).toFixed(2));
      totalQty += rQty;
      totalCost += item.totalCost;
    });

    this.totalItemsReceived = totalQty;
    this.totalCostReceived = Number(totalCost.toFixed(2));
  }
});

const GoodsReceivedNote = mongoose.model("GoodsReceivedNote", grnSchema);

module.exports = GoodsReceivedNote;
module.exports.GoodsReceivedNote = GoodsReceivedNote;
module.exports.GRN = GoodsReceivedNote;
