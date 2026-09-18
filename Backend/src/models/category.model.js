const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

categorySchema.index({ businessId: 1, name: 1 }, { unique: true });
categorySchema.index({ businessId: 1 });

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
module.exports.Category = Category;