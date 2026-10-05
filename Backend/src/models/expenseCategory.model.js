const mongoose = require("mongoose");

const expenseCategorySchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: [true, "Business ID is required for multi-tenant isolation."],
      index: true,
    },

    categoryName: {
      type: String,
      required: [true, "Expense category name is required."],
      trim: true,
      minlength: [2, "Category name must be at least 2 characters."],
      maxlength: [100, "Category name cannot exceed 100 characters."],
    },

    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [500, "Description cannot exceed 500 characters."],
    },

    icon: {
      type: String,
      trim: true,
      default: "Tag",
      maxlength: [50, "Icon identifier cannot exceed 50 characters."],
    },

    color: {
      type: String,
      trim: true,
      default: "#8E8E93",
      maxlength: [30, "Color value cannot exceed 30 characters."],
    },

    budgetLimit: {
      type: Number,
      default: 0,
      min: [0, "Budget limit cannot be negative."],
    },

    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },

    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Multi-Tenant Uniqueness: Category name must be unique within the same business store
expenseCategorySchema.index({ businessId: 1, categoryName: 1 }, { unique: true });
expenseCategorySchema.index({ businessId: 1, isArchived: 1, isActive: 1, sortOrder: 1 });

const ExpenseCategory = mongoose.model("ExpenseCategory", expenseCategorySchema);

module.exports = ExpenseCategory;
module.exports.ExpenseCategory = ExpenseCategory;
