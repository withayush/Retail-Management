const mongoose = require("mongoose");

/**
 * Phase 7 - Task T43: Purchase Item Schema Model
 * 
 * Individual line item record inside a Purchase Order.
 * Captures historical negotiated purchase cost price, ordered quantity, line total,
 * and product snapshot at the order moment.
 * 
 * Symmetrical counterpart to SaleItem (T24):
 * - T24 SaleItem: [ID, SaleID, ProductID, SoldPrice, CostPrice, Quantity] (Selling / Revenue)
 * - T43 PurchaseItem: [ID, PurchaseOrderID, ProductID, CostPrice, Qty] (Procurement / Stock Ordering)
 * 
 * Core Architectural Guarantees:
 * 1. CostPrice Snapshot:
 *    - Negotiated purchase cost is frozen at PO creation. Future changes to catalog product costPrice do NOT alter historical PO line costs.
 * 2. Qty is Ordered Quantity:
 *    - PO line creation does NOT alter inventory stock (Stock IN occurs upon Goods Receipt in future tasks).
 * 3. Multi-Tenant Scoping:
 *    - Strictly scoped to businessId with compound indexes.
 */
const purchaseItemSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: [true, "Business ID is required"],
      index: true,
    },
    purchaseOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PurchaseOrder",
      required: [true, "Purchase Order ID is required"],
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
      index: true,
    },

    // Historical Product Snapshot (frozen at order time)
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [150, "Product name cannot exceed 150 characters"],
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

    // Price & Quantity Snapshot
    costPrice: {
      type: Number,
      required: [true, "Cost price is required"],
      min: [0, "Cost price cannot be negative"],
      default: 0.0,
    },
    qty: {
      type: Number,
      required: [true, "Ordered quantity is required"],
      min: [1, "Ordered quantity must be at least 1"],
    },
    totalCost: {
      type: Number,
      required: true,
      min: [0, "Total cost cannot be negative"],
      default: 0.0,
    },

    // Future Goods Receipt Tracking
    receivedQty: {
      type: Number,
      default: 0,
      min: [0, "Received quantity cannot be negative"],
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

// High-speed multi-tenant and relational indexes
purchaseItemSchema.index({ businessId: 1, purchaseOrderId: 1 });
purchaseItemSchema.index({ businessId: 1, productId: 1, createdAt: -1 });
purchaseItemSchema.index({ businessId: 1, purchaseOrderId: 1, productId: 1 });
purchaseItemSchema.index({ businessId: 1, createdAt: -1 });

// Automatically compute line totalCost before saving
purchaseItemSchema.pre("save", function () {
  const quantity = Number(this.qty) || 1;
  const unitCost = Number(this.costPrice) || 0;
  this.totalCost = Number((quantity * unitCost).toFixed(2));
});

const PurchaseItem = mongoose.model("PurchaseItem", purchaseItemSchema);

module.exports = PurchaseItem;
module.exports.PurchaseItem = PurchaseItem;
