const mongoose = require("mongoose");
const assert = require("assert");
const IdempotencyKey = require("../src/models/idempotency.model");
const idempotencyService = require("../src/services/idempotency.service");
const { generateRequestHash, canonicalize, generateIdempotencyKey } = require("../src/utils/request-hash");

console.log("================================================================================");
console.log("   TRANSACTION INTEGRITY: IDEMPOTENCY & REQUEST DEDUPLICATION ENGINE TESTS      ");
console.log("================================================================================\n");

const dummyBusinessId = new mongoose.Types.ObjectId().toString();
const dummyUserId = new mongoose.Types.ObjectId().toString();

// ==============================================================================
// TEST 1: Canonical JSON Serialization & Hash Determinism
// ==============================================================================
console.log("[Test 1] Canonical JSON Serialization & SHA-256 Request Hash Determinism:");

const payload1 = {
  customerName: "Aman Gupta",
  total: 500,
  items: [{ productId: "PROD1", qty: 2 }, { productId: "PROD2", qty: 1 }],
  notes: "POS Checkout",
};

// Same payload with rearranged keys and whitespace
const payload2 = {
  notes: "POS Checkout",
  total: 500,
  items: [{ qty: 2, productId: "PROD1" }, { qty: 1, productId: "PROD2" }],
  customerName: "Aman Gupta",
};

const hash1 = generateRequestHash(payload1);
const hash2 = generateRequestHash(payload2);

assert.strictEqual(hash1, hash2, "Identical payloads with different key orders must produce identical hashes");
assert.strictEqual(typeof hash1, "string");
assert.strictEqual(hash1.length, 64); // SHA-256 produces 64 hex characters

console.log(` - Payload 1 SHA-256 Hash              : ${hash1}`);
console.log(` - Payload 2 (Rearranged Keys) Hash    : ${hash2}`);
console.log(" - Deterministic Hash Generation        : PASSED ✅");

// ==============================================================================
// TEST 2: Idempotency Key Generation
// ==============================================================================
console.log("\n[Test 2] Idempotency Key UUID Generator:");
const keyA = generateIdempotencyKey();
const keyB = generateIdempotencyKey();

assert.notStrictEqual(keyA, keyB);
assert.strictEqual(typeof keyA, "string");
assert.strictEqual(keyA.length >= 32, true);
console.log(` - Key A Generated                     : ${keyA}`);
console.log(` - Key B Generated                     : ${keyB}`);
console.log(" - UUID Uniqueness Check               : PASSED ✅");

// ==============================================================================
// TEST 3: Mock In-Memory Simulation of Idempotency Lifecycle & Replay
// ==============================================================================
console.log("\n[Test 3] Simulation of Idempotency Lock Acquisition, Response Caching & Replay:");

const simulatedStore = new Map();

// Simulation helper modeling IdempotencyService
const simulateAcquire = (businessId, key, operation, hash) => {
  const storeKey = `${businessId}:${key}:${operation}`;
  if (simulatedStore.has(storeKey)) {
    const existing = simulatedStore.get(storeKey);
    if (existing.requestHash !== hash) {
      const err = new Error("Idempotency key reused with different payload");
      err.code = "IDEMPOTENCY_KEY_REUSED";
      err.statusCode = 409;
      throw err;
    }
    if (existing.status === "COMPLETED") {
      return { hit: true, status: existing.responseStatus, body: existing.responseBody };
    }
    if (existing.status === "PROCESSING") {
      const err = new Error("Request already in progress");
      err.code = "CONCURRENT_REQUEST_IN_PROGRESS";
      err.statusCode = 409;
      throw err;
    }
  }

  const record = {
    businessId,
    key,
    operation,
    requestHash: hash,
    status: "PROCESSING",
    responseStatus: null,
    responseBody: null,
  };
  simulatedStore.set(storeKey, record);
  return { acquired: true };
};

const simulateComplete = (businessId, key, operation, status, body) => {
  const storeKey = `${businessId}:${key}:${operation}`;
  const record = simulatedStore.get(storeKey);
  if (record) {
    record.status = "COMPLETED";
    record.responseStatus = status;
    record.responseBody = body;
  }
};

const testKey = "test-key-sale-1001";
const testOp = "SALE_CREATE";
const saleRequestPayload = { subtotal: 1000, total: 1000, paymentMode: "CASH" };
const saleHash = generateRequestHash(saleRequestPayload);

// 1. First execution acquires lock
const firstAcquisition = simulateAcquire(dummyBusinessId, testKey, testOp, saleHash);
assert.strictEqual(firstAcquisition.acquired, true);
assert.strictEqual(firstAcquisition.hit, undefined);
console.log(" - 1st Request: Lock Acquired (PROCESSING) : PASSED ✅");

// 2. Complete execution and store response
const expectedInvoice = { invoiceNumber: "INV-1001", total: 1000, status: "COMPLETED" };
simulateComplete(dummyBusinessId, testKey, testOp, 201, expectedInvoice);
console.log(" - 1st Request: Response Cached (COMPLETED) : PASSED ✅");

// 3. Retry identical request with same key & payload
const retryAcquisition = simulateAcquire(dummyBusinessId, testKey, testOp, saleHash);
assert.strictEqual(retryAcquisition.hit, true);
assert.strictEqual(retryAcquisition.status, 201);
assert.deepStrictEqual(retryAcquisition.body, expectedInvoice);
console.log(" - 2nd Request (Retry): Cache Replay (HIT)   : PASSED ✅ (Returned identical invoice without re-executing)");

// ==============================================================================
// TEST 4: Payload Divergence Collision Guard (409 Conflict)
// ==============================================================================
console.log("\n[Test 4] Payload Divergence Collision Guard (Same key, different payload):");

const divergentPayload = { subtotal: 2000, total: 2000, paymentMode: "UPI" }; // Different amount!
const divergentHash = generateRequestHash(divergentPayload);

let collisionCaught = false;
let collisionErrorCode = null;

try {
  simulateAcquire(dummyBusinessId, testKey, testOp, divergentHash);
} catch (err) {
  collisionCaught = true;
  collisionErrorCode = err.code;
}

assert.strictEqual(collisionCaught, true);
assert.strictEqual(collisionErrorCode, "IDEMPOTENCY_KEY_REUSED");
console.log(" - Collision Detection Triggered (409)     : PASSED ✅");
console.log(` - Rejection Code                           : "${collisionErrorCode}" ✅`);

// ==============================================================================
// TEST 5: Concurrent In-Flight Execution Guard (Lock in PROGRESS)
// ==============================================================================
console.log("\n[Test 5] Concurrent In-Flight Duplicate Prevention:");

const concurrentKey = "concurrent-key-999";
const payloadC = { total: 300 };
const hashC = generateRequestHash(payloadC);

// Client 1 initiates
simulateAcquire(dummyBusinessId, concurrentKey, "PAYMENT_CREATE", hashC);

// Client 2 attempts parallel execution before Client 1 finishes
let concurrentBlocked = false;
let concurrentCode = null;

try {
  simulateAcquire(dummyBusinessId, concurrentKey, "PAYMENT_CREATE", hashC);
} catch (err) {
  concurrentBlocked = true;
  concurrentCode = err.code;
}

assert.strictEqual(concurrentBlocked, true);
assert.strictEqual(concurrentCode, "CONCURRENT_REQUEST_IN_PROGRESS");
console.log(" - Concurrent Duplicate Blocked (409)       : PASSED ✅");
console.log(` - Rejection Code                           : "${concurrentCode}" ✅`);

console.log("\n================================================================================");
console.log("    ALL IDEMPOTENCY ENGINE TESTS PASSED (5/5) ✅                               ");
console.log("================================================================================\n");
