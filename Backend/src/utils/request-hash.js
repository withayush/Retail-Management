const crypto = require("crypto");

/**
 * Recursively canonicalizes any JavaScript object, array, or primitive
 * into a deterministic, sorted JSON string.
 */
const canonicalize = (obj) => {
  if (obj === null || obj === undefined) {
    return "null";
  }
  if (typeof obj !== "object") {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return "[" + obj.map((item) => canonicalize(item)).join(",") + "]";
  }
  const keys = Object.keys(obj).sort();
  const pairs = keys.map((key) => `${JSON.stringify(key)}:${canonicalize(obj[key])}`);
  return "{" + pairs.join(",") + "}";
};

/**
 * Computes a SHA-256 hash of the canonicalized request body.
 * Ensures that identical payloads produce identical hashes regardless of key ordering.
 *
 * @param {any} body - The request body or payload
 * @returns {string} - Hex-encoded SHA-256 hash
 */
const generateRequestHash = (body) => {
  const canonicalString = canonicalize(body || {});
  return crypto.createHash("sha256").update(canonicalString).digest("hex");
};

/**
 * Generates a standard cryptographically strong UUID v4 idempotency key.
 */
const generateIdempotencyKey = () => {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return crypto.randomBytes(16).toString("hex");
};

module.exports = {
  canonicalize,
  generateRequestHash,
  generateIdempotencyKey,
};
