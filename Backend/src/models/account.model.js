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
      lowercase: true,
      trim: true,
      maxlength: 255,
    },

    phone: {
      type: String,
      required: false,
      trim: true,
      maxlength: 20,
      default: undefined,
    },

    passwordHash: {
      type: String,
      required: false,
      select: false,
      default: undefined,
    },

    authProvider: {
      type: String,
      enum: ["LOCAL", "GOOGLE"],
      default: "LOCAL",
    },

    googleId: {
      type: String,
      default: undefined,
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
  {
    unique: true,
    partialFilterExpression: { phone: { $type: "string", $gt: "" } },
  }
);

accountSchema.index(
  { googleId: 1 },
  {
    unique: true,
    partialFilterExpression: { googleId: { $type: "string", $gt: "" } },
  }
);

const Account = mongoose.model("Account", accountSchema);

module.exports = Account;