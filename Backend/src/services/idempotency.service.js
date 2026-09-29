const IdempotencyKey = require("../models/idempotency.model");

/**
 * Idempotency Service
 * Manages request locking, deduplication, hash validation, and cached response persistence.
 */
class IdempotencyService {
  /**
   * Attempts to acquire an execution lock for a state-mutating operation.
   *
   * @param {Object} params
   * @param {string|ObjectId} params.businessId
   * @param {string|ObjectId} params.userId
   * @param {string} params.key - Unique client idempotency key
   * @param {string} params.operation - Logical operation identifier (e.g. "SALE_CREATE")
   * @param {string} params.requestHash - SHA-256 hash of canonicalized request payload
   * @param {number} [params.lockTimeoutMs=60000] - In-flight lock expiry in ms (default 60s)
   * @returns {Promise<{ hit: boolean, acquired?: boolean, status?: number, body?: any }>}
   */
  async acquireLock({
    businessId,
    userId = null,
    key,
    operation,
    requestHash,
    lockTimeoutMs = 60000,
  }) {
    if (!businessId || !key || !operation || !requestHash) {
      return { acquired: true };
    }

    try {
      // 1. Attempt atomic creation of PROCESSING record
      const record = await IdempotencyKey.create({
        businessId,
        userId: userId || null,
        key: key.trim(),
        operation: operation.trim(),
        requestHash,
        status: "PROCESSING",
        processingAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h retention
      });

      return {
        acquired: true,
        recordId: record._id,
      };
    } catch (err) {
      // If error is NOT a duplicate key conflict, rethrow
      if (err.code !== 11000) {
        throw err;
      }

      // 2. Conflict detected - inspect existing record
      const existing = await IdempotencyKey.findOne({
        businessId,
        key: key.trim(),
        operation: operation.trim(),
      });

      if (!existing) {
        // Record was removed in a microsecond race; retry acquisition
        return await this.acquireLock({
          businessId,
          userId,
          key,
          operation,
          requestHash,
          lockTimeoutMs,
        });
      }

      // 3. Payload integrity check: ensure request body hash matches
      if (existing.requestHash !== requestHash) {
        const error = new Error(
          "The provided Idempotency-Key has already been used for a different request payload."
        );
        error.statusCode = 409;
        error.code = "IDEMPOTENCY_KEY_REUSED";
        error.details = {
          key,
          operation,
        };
        throw error;
      }

      // 4. If previously completed, return cached response (HIT)
      if (existing.status === "COMPLETED") {
        return {
          hit: true,
          status: existing.responseStatus || 200,
          body: existing.responseBody,
          completedAt: existing.completedAt,
        };
      }

      // 5. If currently PROCESSING, verify lock freshness
      if (existing.status === "PROCESSING") {
        const lockAge = Date.now() - new Date(existing.processingAt).getTime();

        if (lockAge < lockTimeoutMs) {
          // Genuine concurrent duplicate request in flight
          const error = new Error(
            "A request with this Idempotency-Key is currently being processed. Please wait."
          );
          error.statusCode = 409;
          error.code = "CONCURRENT_REQUEST_IN_PROGRESS";
          throw error;
        }

        // Stale lock detected (prior crash / timeout) -> Take over lock
        existing.processingAt = new Date();
        existing.status = "PROCESSING";
        existing.requestHash = requestHash;
        if (userId) existing.userId = userId;
        await existing.save();

        return {
          acquired: true,
          recovered: true,
          recordId: existing._id,
        };
      }

      // 6. If FAILED previously, allow fresh retry
      if (existing.status === "FAILED") {
        existing.status = "PROCESSING";
        existing.processingAt = new Date();
        existing.requestHash = requestHash;
        if (userId) existing.userId = userId;
        await existing.save();

        return {
          acquired: true,
          retriedAfterFailure: true,
          recordId: existing._id,
        };
      }

      return { acquired: true };
    }
  }

  /**
   * Records a successful business execution and caches the response.
   */
  async completeLock({
    businessId,
    key,
    operation,
    responseStatus = 200,
    responseBody,
  }) {
    if (!businessId || !key || !operation) return null;

    return await IdempotencyKey.findOneAndUpdate(
      {
        businessId,
        key: key.trim(),
        operation: operation.trim(),
      },
      {
        $set: {
          status: "COMPLETED",
          responseStatus,
          responseBody,
          completedAt: new Date(),
        },
      },
      { new: true }
    );
  }

  /**
   * Marks a lock as FAILED on server error or deletes lock on operational abort.
   */
  async failLock({
    businessId,
    key,
    operation,
    errorMessage = "",
    allowImmediateRetry = true,
  }) {
    if (!businessId || !key || !operation) return null;

    if (allowImmediateRetry) {
      // Remove lock document so client can retry immediately without waiting
      return await IdempotencyKey.deleteOne({
        businessId,
        key: key.trim(),
        operation: operation.trim(),
      });
    }

    return await IdempotencyKey.findOneAndUpdate(
      {
        businessId,
        key: key.trim(),
        operation: operation.trim(),
      },
      {
        $set: {
          status: "FAILED",
          responseStatus: 500,
          responseBody: { error: errorMessage },
          completedAt: new Date(),
        },
      }
    );
  }
}

module.exports = new IdempotencyService();
