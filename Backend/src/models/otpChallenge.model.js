const mongoose = require("mongoose");

const otpChallengeSchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },

    purpose: {
      type: String,
      enum: ["PHONE_VERIFICATION", "PASSWORD_RESET", "PHONE_CHANGE"],
      required: true,
    },

    codeHash: {
      type: String,
      required: true,
      select: false,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    consumedAt: {
      type: Date,
      default: null,
    },

    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },

    maxAttempts: {
      type: Number,
      default: 5,
      min: 1,
    },

    resendCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastSentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

otpChallengeSchema.index({
  phone: 1,
  purpose: 1,
});

otpChallengeSchema.index({
  accountId: 1,
});

const OtpChallenge = mongoose.model("OtpChallenge", otpChallengeSchema);

module.exports = OtpChallenge;
