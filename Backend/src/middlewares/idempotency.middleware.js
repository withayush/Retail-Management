const idempotencyService = require("../services/idempotency.service");
const { generateRequestHash } = require("../utils/request-hash");

/**
 * Express Middleware for Idempotent Request Execution.
 *
 * Intercepts POST/PUT mutations carrying an `Idempotency-Key` or `x-idempotency-key` header.
 * - Replays identical responses for completed requests.
 * - Blocks duplicate in-flight requests.
 * - Detects payload divergence with 409 Conflict.
 * - Transactionally stores response upon successful controller execution.
 *
 * @param {string|Object} options - Operation name string OR configuration object { operation, required }
 */
const idempotencyMiddleware = (options = {}) => {
  const config = typeof options === "string" ? { operation: options, required: false } : options;
  const operationName = config.operation || "GENERAL_MUTATION";
  const isRequired = Boolean(config.required);

  return async (req, res, next) => {
    // Only apply idempotency to state-mutating HTTP methods
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      return next();
    }

    const rawKey =
      req.headers["idempotency-key"] ||
      req.headers["x-idempotency-key"] ||
      req.body?.idempotencyKey;

    if (!rawKey) {
      if (isRequired) {
        return res.status(400).json({
          success: false,
          code: "IDEMPOTENCY_KEY_REQUIRED",
          message: `An 'Idempotency-Key' header is required for ${operationName} operations.`,
        });
      }
      return next();
    }

    const key = String(rawKey).trim();
    if (key.length === 0 || key.length > 128) {
      return res.status(400).json({
        success: false,
        code: "INVALID_IDEMPOTENCY_KEY",
        message: "Idempotency key must be between 1 and 128 characters.",
      });
    }

    const businessId = req.businessId || req.headers["x-business-id"] || req.user?.activeBusinessId;
    const userId = req.user?.id || req.user?.accountId || req.user?._id || null;

    if (!businessId) {
      // If business context is not set yet, proceed and let auth/business middleware handle tenancy
      return next();
    }

    const requestHash = generateRequestHash(req.body);
    req.idempotencyKey = key;

    try {
      const lockResult = await idempotencyService.acquireLock({
        businessId,
        userId,
        key,
        operation: operationName,
        requestHash,
      });

      // 1. If response was already cached from a previous completion, replay it!
      if (lockResult.hit) {
        res.setHeader("X-Cache", "IDEMPOTENCY-HIT");
        res.setHeader("Idempotency-Key", key);
        return res.status(lockResult.status || 200).json(lockResult.body);
      }

      // 2. Intercept response to automatically persist output upon completion
      const originalJson = res.json.bind(res);
      const originalSend = res.send.bind(res);

      let completed = false;

      const recordCompletion = async (body, statusCode) => {
        if (completed) return;
        completed = true;

        if (statusCode < 400 || (statusCode >= 400 && statusCode < 500)) {
          // Normal business response (including 400 validation error snapshots)
          try {
            await idempotencyService.completeLock({
              businessId,
              key,
              operation: operationName,
              responseStatus: statusCode,
              responseBody: body,
            });
          } catch (persistErr) {
            console.warn(`[Idempotency] Failed saving completed response:`, persistErr.message);
          }
        } else {
          // 5xx Server failure: release/fail lock to allow client retry
          try {
            await idempotencyService.failLock({
              businessId,
              key,
              operation: operationName,
              errorMessage: body?.message || "Internal server error during idempotent execution.",
              allowImmediateRetry: true,
            });
          } catch (failErr) {
            console.warn(`[Idempotency] Failed resetting lock:`, failErr.message);
          }
        }
      };

      res.json = function (data) {
        recordCompletion(data, res.statusCode);
        return originalJson(data);
      };

      res.send = function (data) {
        let parsed = data;
        if (typeof data === "string") {
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
        }
        recordCompletion(parsed, res.statusCode);
        return originalSend(data);
      };

      // Set outbound header
      res.setHeader("Idempotency-Key", key);

      next();
    } catch (err) {
      if (err.code === "IDEMPOTENCY_KEY_REUSED" || err.code === "CONCURRENT_REQUEST_IN_PROGRESS") {
        return res.status(err.statusCode || 409).json({
          success: false,
          code: err.code,
          message: err.message,
          ...(err.details && { details: err.details }),
        });
      }
      next(err);
    }
  };
};

module.exports = idempotencyMiddleware;
