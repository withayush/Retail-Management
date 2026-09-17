const mongoose = require("mongoose");


// =========================
// AUTH ATTEMPT
// =========================

const authAttemptSchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      default: null,
    },

    identifier: {
      type: String,
      trim: true,
      maxlength: 255,
    },

    action: {
      type: String,
      required: true,
      maxlength: 50,
    },

    success: {
      type: Boolean,
      required: true,
      default: false,
    },

    reason: {
      type: String,
      trim: true,
      maxlength: 255,
    },

    ipAddress: {
      type: String,
      trim: true,
      maxlength: 45,
    },

    userAgent: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  }
);

authAttemptSchema.index({
  identifier: 1,
  createdAt: -1,
});

authAttemptSchema.index({
  accountId: 1,
});

authAttemptSchema.index({
  ipAddress: 1,
  createdAt: -1,
});

const AuthAttempt = mongoose.model(
  "AuthAttempt",
  authAttemptSchema
);


// =========================
// AUTH EVENT
// =========================

const authEventSchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      default: null,
    },

    eventType: {
      type: String,
      required: true,
      maxlength: 50,
    },

    ipAddress: {
      type: String,
      trim: true,
      maxlength: 45,
    },

    userAgent: {
      type: String,
      trim: true,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  }
);

authEventSchema.index({
  accountId: 1,
  createdAt: -1,
});

authEventSchema.index({
  eventType: 1,
  createdAt: -1,
});

const AuthEvent = mongoose.model(
  "AuthEvent",
  authEventSchema
);


module.exports = {
  AuthAttempt,
  AuthEvent,
};