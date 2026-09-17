const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
      unique: true,
      index: true,
    },

    status: {
      type: String,
      enum: [
        "ACTIVE",
        "SUSPENDED",
        "BLOCKED",
      ],
      default: "ACTIVE",
    },

    onboardingStatus: {
      type: String,
      enum: [
        "NOT_STARTED",
        "IN_PROGRESS",
        "COMPLETED",
      ],
      default: "NOT_STARTED",
    },
  },
  {
    timestamps: true,
  }
);

const Vendor = mongoose.model("Vendor", vendorSchema);

module.exports = Vendor;