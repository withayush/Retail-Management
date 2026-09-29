const mongoose = require("mongoose");

/**
 * Idempotency Key Model
 * Tracks state-mutating requests to enforce exactly-once execution semantics,
 * replay responses on retries, and prevent concurrent race conditions.
 */
const idempotencySchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      default: null,
    },
    key: {
      type: String,
      required: [true, "Idempotency key is required"],
      trim: true,
      maxlength: 128,
    },
    operation: {
      type: String,
      required: [true, "Operation name is required"],
      trim: true,
      maxlength: 64,
    },
    requestHash: {
      type: String,
      required: [true, "Request payload hash is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["PROCESSING", "COMPLETED", "FAILED"],
      default: "PROCESSING",
      index: true,
    },
    responseStatus: {
      type: Number,
      default: null,
    },
    responseBody: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    processingAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours TTL
    },
  },
  {
    timestamps: true,
  }
);

// Compound Unique Index to isolate keys per business and operation
idempotencySchema.index({ businessId: 1, key: 1, operation: 1 }, { unique: true });

// TTL index to automatically purge expired idempotency records from MongoDB
idempotencySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const IdempotencyKey = mongoose.model("IdempotencyKey", idempotencySchema);

module.exports = IdempotencyKey;
