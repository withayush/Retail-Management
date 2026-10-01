const mongoose = require("mongoose");

/**
 * Concurrency-Safe Atomic Counter Model
 * Provides high-throughput, race-condition-free sequential numbering
 * strictly scoped to each tenant business.
 */
const counterSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: [true, "Business ID is required"],
      index: true,
    },
    sequenceName: {
      type: String,
      required: [true, "Sequence name is required"],
      trim: true,
      uppercase: true,
    },
    seq: {
      type: Number,
      required: true,
      default: 1000,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Strictly unique per business + sequence name
counterSchema.index({ businessId: 1, sequenceName: 1 }, { unique: true });

const Counter = mongoose.model("Counter", counterSchema);

module.exports = Counter;
module.exports.Counter = Counter;
