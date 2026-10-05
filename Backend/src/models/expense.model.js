const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: [true, "Business ID is required for multi-tenant isolation."],
      index: true,
    },

    expenseNumber: {
      type: String,
      required: [true, "Expense number is required."],
      trim: true,
      uppercase: true,
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExpenseCategory",
      required: [true, "Expense category ID is required."],
      index: true,
    },

    categoryName: {
      type: String,
      required: [true, "Expense category name snapshot is required."],
      trim: true,
    },

    categoryIcon: {
      type: String,
      trim: true,
      default: "Tag",
    },

    categoryColor: {
      type: String,
      trim: true,
      default: "#8E8E93",
    },

    amount: {
      type: Number,
      required: [true, "Expense amount is required."],
      min: [0.01, "Expense amount must be greater than zero."],
    },

    expenseDate: {
      type: Date,
      required: [true, "Expense date is required."],
      default: Date.now,
      index: true,
    },

    paymentMethod: {
      type: String,
      enum: {
        values: ["CASH", "UPI", "BANK_TRANSFER", "CARD", "CHEQUE", "OTHER"],
        message: "{VALUE} is not a valid payment method.",
      },
      default: "CASH",
    },

    referenceNumber: {
      type: String,
      trim: true,
      default: "",
    },

    payee: {
      type: String,
      trim: true,
      default: "",
    },

    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [1000, "Description cannot exceed 1000 characters."],
    },

    taxAmount: {
      type: Number,
      default: 0,
      min: [0, "Tax amount cannot be negative."],
    },

    attachment: {
      fileName: { type: String, default: "" },
      url: { type: String, default: "" },
      fileType: { type: String, default: "" },
      fileSize: { type: Number, default: 0 },
    },

    status: {
      type: String,
      enum: ["PAID", "PENDING", "CANCELLED"],
      default: "PAID",
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
    },

    createdByName: {
      type: String,
      trim: true,
      default: "",
    },

    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Multi-Tenant Uniqueness & Performance Indexes
expenseSchema.index({ businessId: 1, expenseNumber: 1 }, { unique: true });
expenseSchema.index({ businessId: 1, categoryId: 1, expenseDate: -1 });
expenseSchema.index({ businessId: 1, expenseDate: -1 });
expenseSchema.index({ businessId: 1, isArchived: 1, createdAt: -1 });
expenseSchema.index({ businessId: 1, paymentMethod: 1 });

const Expense = mongoose.model("Expense", expenseSchema);

module.exports = Expense;
module.exports.Expense = Expense;
