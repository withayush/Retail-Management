const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
      index: true,
    },

    refreshTokenHash: {
      type: String,
      required: true,
      select: false,
    },

    deviceId: {
      type: String,
      maxlength: 100,
      default: null,
    },

    deviceName: {
      type: String,
      maxlength: 100,
      default: null,
    },

    platform: {
      type: String,
      maxlength: 50,
      default: null,
    },

    ipAddress: {
      type: String,
      maxlength: 45,
      default: null,
    },

    userAgent: {
      type: String,
      default: null,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    lastUsedAt: {
      type: Date,
      default: null,
    },

    revokedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

sessionSchema.index({
  accountId: 1,
  revokedAt: 1,
});

const Session = mongoose.model("Session", sessionSchema);

module.exports = Session;
