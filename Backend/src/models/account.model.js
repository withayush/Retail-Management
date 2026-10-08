const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      // unique: true,
      lowercase: true,
      trim: true,
      maxlength: 255,
    },

    phone: {
      type: String,
      required: false,
      trim: true,
      maxlength: 20,
      default: null,
    },

    passwordHash: {
      type: String,
      required: false,
      select: false,
    },

    authProvider: {
      type: String,
      enum: ["LOCAL", "GOOGLE"],
      default: "LOCAL",
    },

    googleId: {
      type: String,
      default: null,
    },

    avatar: {
      type: String,
      default: null,
    },

    phoneVerifiedAt: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: [
        "PENDING_VERIFICATION",
        "ACTIVE",
        "SUSPENDED",
        "BLOCKED",
      ],
      default: "PENDING_VERIFICATION",
      index: true,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

accountSchema.index(
  { email: 1 },
  { unique: true }
);

accountSchema.index(
  { phone: 1 },
  { unique: true, sparse: true }
);

accountSchema.index(
  { googleId: 1 },
  { unique: true, sparse: true }
);

const Account = mongoose.model("Account", accountSchema);

module.exports = Account;