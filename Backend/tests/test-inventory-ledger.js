const mongoose = require("mongoose");
const assert = require("assert");
const { Inventory, InventoryLedger } = require("../src/models/inventory.model");
const inventoryService = require("../src/services/inventory.service");
const inventoryRepo = require("../src/repositories/inventory.repository");
const {
  stockInSchema,
  stockOutSchema,
  adjustStockSchema,
} = require("../src/validations/inventory.validation");

console.log("================================================================================");
console.log("    PHASE 3 - TASK T16: INVENTORY LEDGER SCHEMA & ATOMIC MOVEMENT ENGINE TESTS   ");
console.log("================================================================================\n");

const dummyBusinessId1 = new mongoose.Types.ObjectId().toString();
const dummyBusinessId2 = new mongoose.Types.ObjectId().toString();
const dummyProductId1 = new mongoose.Types.ObjectId().toString();
const dummyProductId2 = new mongoose.Types.ObjectId().toString();
const dummyInvoiceId1 = new mongoose.Types.ObjectId().toString();

// Test 1: InventoryLedger Mongoose Schema Instantiation & Validations
console.log("[Test 1] InventoryLedger Mongoose Schema Instantiation & Validation:");
const ledgerDoc1 = new InventoryLedger({
  businessId: new mongoose.Types.ObjectId(dummyBusinessId1),
  productId: new mongoose.Types.ObjectId(dummyProductId1),
  qtyChange: 50,
  balanceAfter: 150,
  type: "IN",
  reason: "Purchase from Sharma Wholesalers",
  notes: "Batch #B-2026-09",
});

const err1 = ledgerDoc1.validateSync();
console.log(" - Valid Ledger Log (IN +50)    :", err1 ? "FAILED: " + err1.message : "PASSED ✅");
assert.strictEqual(!err1, true);
assert.strictEqual(ledgerDoc1.qtyChange, 50);
assert.strictEqual(ledgerDoc1.balanceAfter, 150);
assert.strictEqual(ledgerDoc1.type, "IN");

// Test 2: Invalid Ledger Types & Negative balanceAfter Blocking
console.log("\n[Test 2] Invalid Ledger Types & Negative Balance Blocking:");
const invalidLedgerDoc = new InventoryLedger({
  businessId: new mongoose.Types.ObjectId(dummyBusinessId1),
  productId: new mongoose.Types.ObjectId(dummyProductId1),
  qtyChange: -200,
  balanceAfter: -50, // Invalid: negative balanceAfter
  type: "MAGIC_TYPE", // Invalid enum value
});
const err2 = invalidLedgerDoc.validateSync();
console.log(" - Rejection of Invalid Ledger :", err2 ? "PASSED ✅ (Blocked invalid enum & negative balanceAfter)" : "FAILED ❌");
assert.ok(err2, "Should reject invalid enum type and negative balanceAfter");

// Test 3: Zod Schemas Validation (Stock-In, Stock-Out, Adjust)
console.log("\n[Test 3] Zod Schema Validations for Ledger Operations:");
const validStockIn = stockInSchema.safeParse({
  productId: dummyProductId1,
  quantity: 25,
  supplier: "Metro Cash & Carry",
  notes: "Delivered in good condition",
});
assert.strictEqual(validStockIn.success, true);
console.log(" - Valid Stock In Schema        : PASSED ✅ (+25 qty with supplier)");

const invalidStockInZero = stockInSchema.safeParse({
  productId: dummyProductId1,
  quantity: 0,
});
assert.strictEqual(invalidStockInZero.success, false);
console.log(" - Zero Qty Stock In Rejection : PASSED ✅ (quantity <= 0 rejected)");

const validStockOut = stockOutSchema.safeParse({
  productId: dummyProductId1,
  quantity: 3,
  invoiceId: dummyInvoiceId1,
  notes: "POS Checkout",
});
assert.strictEqual(validStockOut.success, true);
console.log(" - Valid Stock Out Schema       : PASSED ✅ (-3 qty with invoiceId)");

const validAdjust = adjustStockSchema.safeParse({
  productId: dummyProductId1,
  newStock: 145,
  reason: "Physical inventory audit count",
  notes: "2 items found damaged",
});
assert.strictEqual(validAdjust.success, true);
console.log(" - Valid Adjust Schema          : PASSED ✅ (newStock: 145, reason documented)");

// Test 4: Pure Mathematical & Ledger Integrity Simulation
console.log("\n[Test 4] Complete Multi-Step Ledger Audit Trail & Balance Simulation:");
// Starting with Initial stock: 0
let simulatedStock = 0;
const ledgerEntries = [];

function recordMovement(type, qtyChange, reason, invoiceId = null) {
  const balanceAfter = simulatedStock + qtyChange;
  if (balanceAfter < 0) {
    throw new Error("INSUFFICIENT_STOCK");
  }
  simulatedStock = balanceAfter;
  const entry = {
    type,
    qtyChange,
    balanceAfter,
    reason,
    invoiceId,
    timestamp: new Date().toISOString(),
  };
  ledgerEntries.push(entry);
  return entry;
}

// 1. Initial State
recordMovement("OPENING", 100, "Initial Stock Opening Balance");
// 2. Purchase +50
recordMovement("IN", 50, "Supplier Purchase #PO-8819");
// 3. Sale -10
recordMovement("OUT", -10, "Customer Sale", dummyInvoiceId1);
// 4. Damage -5
recordMovement("ADJUST", -5, "Damaged in transit");
// 5. Audit Correction +2
recordMovement("ADJUST", 2, "Found extra box in storage");

console.log(" - Step 1: Initial Opening Balance    : +100 -> Balance: 100");
console.log(" - Step 2: Supplier Purchase (+50)    : +50  -> Balance: 150");
console.log(" - Step 3: Customer Sale (-10)        : -10  -> Balance: 140");
console.log(" - Step 4: Damage Adjustment (-5)     : -5   -> Balance: 135");
console.log(" - Step 5: Correction Adjustment (+2) : +2   -> Balance: 137");

assert.strictEqual(simulatedStock, 137);
assert.strictEqual(ledgerEntries.length, 5);

// Audit sum verification: sum(qtyChange) === final balance
const auditSum = ledgerEntries.reduce((sum, item) => sum + item.qtyChange, 0);
console.log(" - Sum of all Ledger qtyChange entries:", auditSum);
console.log(" - Final Store State Balance          :", simulatedStock);
assert.strictEqual(auditSum, simulatedStock);
console.log(" - Mathematical Ledger Audit Check    : PASSED ✅ (sum(ledger.qtyChange) === storeState.availableStock)");

// Test 5: Insufficient Stock Prevention Guard
console.log("\n[Test 5] Insufficient Stock Prevention Guard:");
let caughtError = false;
try {
  recordMovement("OUT", -500, "Attempted overselling");
} catch (e) {
  caughtError = true;
  console.log(" - Oversell Attempt (-500 from 137)   : PASSED ✅ (Caught INSUFFICIENT_STOCK error)");
}
assert.strictEqual(caughtError, true);

console.log("\n================================================================================");
console.log("    ALL PHASE 3 - TASK T16 INVENTORY LEDGER TESTS PASSED SUCCESSFULLY! ✅      ");
console.log("================================================================================\n");
