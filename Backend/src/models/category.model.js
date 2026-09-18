const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },
  },
  { timestamps: true }
);

// Multi-Tenant Isolation Rule: Name must be unique within the SAME Business
categorySchema.index({ businessId: 1, name: 1 }, { unique: true });
categorySchema.index({ businessId: 1, createdAt: -1 });

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
module.exports.Category = Category;