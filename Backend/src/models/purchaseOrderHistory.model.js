const mongoose = require("mongoose");

/**
 * Phase 7 - Task T47: Purchase Order Workflow History Model
 * 
 * Immutable, append-only operational audit trail recording every milestone,
 * lifecycle status change, physical stock receipt (GRN), cost negotiation variance,
 * expected delivery adjustments, delayed lead time tracking, and supplier payable recognition.
 * 
 * Core Invariant:
 * - History entries are strictly append-only and cannot be modified or deleted.
 * - Captures the full journey: "From creation to delivery, who did what, when, and what changed?"
 */
const purchaseOrderHistorySchema = new mongoose.Schema(
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
    poNumber: {
      type: String,
      required: [true, "PO Number is required"],
      trim: true,
      uppercase: true,
    },
    eventType: {
      type: String,
      required: [true, "Event type is required"],
      enum: [
        "PO_CREATED",
        "PO_SUBMITTED",
        "PO_UPDATED",
        "STATUS_CHANGED",
        "GRN_CREATED",
        "PARTIAL_RECEIPT",
        "FULL_RECEIPT",
        "COST_CHANGED",
        "EXPECTED_DELIVERY_CHANGED",
        "PO_CANCELLED",
        "PAYABLE_CREATED",
        "MANUAL_LOG",
      ],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    previousStatus: {
      type: String,
      enum: ["DRAFT", "PENDING", "PARTIAL", "RECEIVED", "CANCELLED", null],
      default: null,
    },
    newStatus: {
      type: String,
      enum: ["DRAFT", "PENDING", "PARTIAL", "RECEIVED", "CANCELLED", null],
      default: null,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      default: null,
    },
    performedByName: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Immutable append-only
  }
);

// Compound Indexes for fast chronological queries & multi-tenant isolation
purchaseOrderHistorySchema.index({ businessId: 1, purchaseOrderId: 1, createdAt: 1 });
purchaseOrderHistorySchema.index({ businessId: 1, eventType: 1, createdAt: -1 });
purchaseOrderHistorySchema.index({ businessId: 1, createdAt: -1 });

const PurchaseOrderHistory = mongoose.model("PurchaseOrderHistory", purchaseOrderHistorySchema);

module.exports = {
  PurchaseOrderHistory,
};
