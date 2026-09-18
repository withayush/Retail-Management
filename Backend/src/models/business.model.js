const mongoose = require("mongoose");

const businessSchema = new mongoose.Schema(
  {
    // 1-to-many link: User (Account) -> Business
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
      index: true,
    },

    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      index: true,
    },

    businessName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
      index: true,
    },

    retailSegment: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "Retail/Kirana",
    },

    businessType: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    category: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      trim: true,
    },

    businessEmail: {
      type: String,
      lowercase: true,
      trim: true,
      maxlength: 255,
    },

    businessPhone: {
      type: String,
      trim: true,
      maxlength: 20,
    },

    whatsappNumber: {
      type: String,
      trim: true,
      maxlength: 20,
    },

    addressLine: {
      type: String,
      trim: true,
    },

    city: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    state: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    pincode: {
      type: String,
      trim: true,
      maxlength: 20,
    },

    website: {
      type: String,
      trim: true,
      maxlength: 255,
    },

    logoUrl: {
      type: String,
      trim: true,
    },

    operatingHours: {
      open: { type: String, trim: true, default: "09:00 AM" },
      close: { type: String, trim: true, default: "10:00 PM" },
      days: {
        type: [String],
        default: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
      },
      notes: { type: String, trim: true },
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "ARCHIVED"],
      default: "ACTIVE",
      index: true,
    },
  },
  { timestamps: true }
);

businessSchema.index({ ownerId: 1, createdAt: -1 });

const Business = mongoose.model("Business", businessSchema);

module.exports = Business;
module.exports.Business = Business;