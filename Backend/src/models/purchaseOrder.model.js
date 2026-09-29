const mongoose = require("mongoose");

/**
 * Phase 7 - Task T42: Purchase Order Item Sub-Schema
 * Individual line item within a Purchase Order representing stock items ordered from a supplier.
 */
const purchaseOrderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    name: {
      type: String,
      required: [true, "Product / Item name is required"],
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
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
    unit: {
      type: String,
      trim: true,
      default: "pcs",
    },
    unitCost: {
      type: Number,
      required: [true, "Unit cost is required"],
      min: [0, "Unit cost cannot be negative"],
      default: 0.0,
    },
    totalCost: {
      type: Number,
      required: true,
      min: [0, "Total cost cannot be negative"],
      default: 0.0,
    },
    receivedQuantity: {
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
  { _id: true }
);

/**
 * Phase 7 - Task T42: Purchase Order Schema DB Model (Header Entity)
 * 
 * Formal purchase order / stock request entity sent to a supplier.
 * 
 * Core Architectural Guarantees:
 * 1. PO is an official order request (Commitment), NOT an inventory stock receipt.
 *    - PO creation does NOT increase product stock in Inventory (Stock IN happens upon GRN/Receipt).
 * 2. PO is NOT a financial supplier payable debt.
 *    - PO creation does NOT create ledger liability in SupplierLedger (Payable happens upon invoice delivery).
 * 3. Multi-Tenant Scoping:
 *    - Strictly isolated per `businessId` with compound indexes.
 * 4. Authoritative Server-Side Cost:
 *    - `costTotal` is calculated reliably from items (Σ quantity * unitCost).
 * 
 * Schema: (ID / poNumber, SupplierID, OrderDate, ExpectedDelivery, Status, CostTotal, Items)
 */
const purchaseOrderSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: [true, "Business ID is required"],
      index: true,
    },
    poNumber: {
      type: String,
      required: [true, "PO Number is required"],
      trim: true,
      uppercase: true,
      maxlength: [50, "PO Number cannot exceed 50 characters"],
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
    supplierContact: {
      type: String,
      trim: true,
      maxlength: [100, "Contact name cannot exceed 100 characters"],
      default: "",
    },
    supplierPhone: {
      type: String,
      trim: true,
      maxlength: [20, "Phone cannot exceed 20 characters"],
      default: "",
    },
    orderDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    expectedDelivery: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["DRAFT", "PENDING", "PARTIAL", "RECEIVED", "CANCELLED"],
      default: "PENDING",
      index: true,
    },
    costTotal: {
      type: Number,
      required: true,
      min: [0, "Cost total cannot be negative"],
      default: 0.0,
    },
    itemsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    items: [purchaseOrderItemSchema],
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    shippingAddress: {
      type: String,
      trim: true,
      default: "",
    },
    paymentTerms: {
      type: String,
      trim: true,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      default: null,
    },
    createdByName: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// High-speed multi-tenant unique index: Ensures unique PO Number per business
purchaseOrderSchema.index({ businessId: 1, poNumber: 1 }, { unique: true });

// Compound indexes for fast filtering, supplier lookups, and reporting
purchaseOrderSchema.index({ businessId: 1, supplierId: 1, status: 1 });
purchaseOrderSchema.index({ businessId: 1, status: 1, createdAt: -1 });
purchaseOrderSchema.index({ businessId: 1, orderDate: -1 });
purchaseOrderSchema.index({ businessId: 1, expectedDelivery: 1 });
purchaseOrderSchema.index({ businessId: 1, createdAt: -1 });

// Automatically compute line item totals and order cost total before saving
purchaseOrderSchema.pre("save", function () {
  if (this.items && Array.isArray(this.items)) {
    let computedCostTotal = 0;
    let computedTotalQty = 0;

    this.items.forEach((item) => {
      const qty = Number(item.quantity) || 1;
      const cost = Number(item.unitCost) || 0;
      item.totalCost = Number((qty * cost).toFixed(2));
      computedCostTotal += item.totalCost;
      computedTotalQty += qty;
    });

    this.costTotal = Number(computedCostTotal.toFixed(2));
    this.itemsCount = this.items.length;
    this.totalQuantity = computedTotalQty;
  }
});

const PurchaseOrder = mongoose.model("PurchaseOrder", purchaseOrderSchema);

module.exports = PurchaseOrder;
module.exports.PurchaseOrder = PurchaseOrder;
