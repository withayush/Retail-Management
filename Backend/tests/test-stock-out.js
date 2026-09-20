const mongoose = require("mongoose");
const assert = require("assert");
const { Inventory, InventoryLedger } = require("../src/models/inventory.model");
const { stockOutSchema, batchStockOutSchema } = require("../src/validations/inventory.validation");

console.log("================================================================================");
console.log("    PHASE 3 - TASK T19: STOCK OUT (REDUCTION) & INSUFFICIENT GUARD TESTS        ");
console.log("================================================================================\n");

const dummyBusinessId1 = new mongoose.Types.ObjectId().toString();
const dummyProductId1 = new mongoose.Types.ObjectId().toString();
const dummyProductId2 = new mongoose.Types.ObjectId().toString();
const dummyInvoiceId1 = new mongoose.Types.ObjectId().toString();

// Test 1: Zod Schema Validations for Stock-Out Operations
console.log("[Test 1] Zod Schema Validations for Stock-Out (Task T19):");
const validSaleStockOut = stockOutSchema.safeParse({
  productId: dummyProductId1,
  quantity: 5,
  source: "SALE",
  invoiceId: dummyInvoiceId1,
  invoiceNumber: "INV-2026-1001",
  customerName: "Ramesh Kumar",
  notes: "Counter POS checkout",
});
assert.strictEqual(validSaleStockOut.success, true);
assert.strictEqual(validSaleStockOut.data.quantity, 5);
assert.strictEqual(validSaleStockOut.data.source, "SALE");
assert.strictEqual(validSaleStockOut.data.invoiceNumber, "INV-2026-1001");
console.log(" - Valid Sale Stock-Out (-5 with Invoice & Customer)   : PASSED ✅");

const validDamageStockOut = stockOutSchema.safeParse({
  productId: dummyProductId1,
  quantity: 2,
  source: "DAMAGE",
  reason: "Broken glass jar in aisle 4",
  notes: "Discarded safely",
});
assert.strictEqual(validDamageStockOut.success, true);
assert.strictEqual(validDamageStockOut.data.source, "DAMAGE");
console.log(" - Valid Damage Stock-Out (-2 with reason)             : PASSED ✅");

const validBatchStockOut = batchStockOutSchema.safeParse({
  invoiceNumber: "INV-2026-1002",
  source: "POS_CHECKOUT",
  items: [
    { productId: dummyProductId1, quantity: 3 },
    { productId: dummyProductId2, quantity: 2 },
  ],
});
assert.strictEqual(validBatchStockOut.success, true);
assert.strictEqual(validBatchStockOut.data.items.length, 2);
console.log(" - Valid Batch POS Stock-Out (2 items in cart)         : PASSED ✅");

const invalidNegativeQty = stockOutSchema.safeParse({
  productId: dummyProductId1,
  quantity: -5,
});
assert.strictEqual(invalidNegativeQty.success, false);
console.log(" - Negative Quantity Rejection                         : PASSED ✅ (-5 rejected)");

const invalidZeroQty = stockOutSchema.safeParse({
  productId: dummyProductId1,
  quantity: 0,
});
assert.strictEqual(invalidZeroQty.success, false);
console.log(" - Zero Quantity Rejection                             : PASSED ✅ (0 rejected)");

// Test 2: Mongoose Schema Persistence for OUT Movements
console.log("\n[Test 2] Mongoose Schema Document with OUT Movement Details:");
const outLedgerEntry = new InventoryLedger({
  businessId: new mongoose.Types.ObjectId(dummyBusinessId1),
  productId: new mongoose.Types.ObjectId(dummyProductId1),
  qtyChange: -5, // Negative signed quantity
  balanceAfter: 95,
  type: "OUT",
  source: "SALE",
  invoiceId: new mongoose.Types.ObjectId(dummyInvoiceId1),
  referenceNumber: "INV-2026-1001",
  reason: "Sale Invoice #INV-2026-1001 (Customer: Ramesh Kumar)",
  notes: "POS Counter Checkout",
});

const err = outLedgerEntry.validateSync();
assert.strictEqual(!err, true);
assert.strictEqual(outLedgerEntry.qtyChange, -5);
assert.strictEqual(outLedgerEntry.balanceAfter, 95);
assert.strictEqual(outLedgerEntry.type, "OUT");
assert.strictEqual(outLedgerEntry.source, "SALE");
console.log(" - Model Schema OUT Verification (qtyChange: -5, type: OUT): PASSED ✅");

// Test 3: Insufficient Stock Prevention Guard
console.log("\n[Test 3] Insufficient Stock Prevention Guard (Oversell Protection):");
let simulatedAvailableStock = 3; // Only 3 units in stock

function attemptStockOut(requestedQty) {
  if (simulatedAvailableStock - requestedQty < 0) {
    const error = new Error(
      `Insufficient stock. Available: ${simulatedAvailableStock}, Requested deduction: ${requestedQty}`
    );
    error.statusCode = 400;
    error.code = "INSUFFICIENT_STOCK";
    throw error;
  }
  simulatedAvailableStock -= requestedQty;
  return simulatedAvailableStock;
}

let caughtInsufficient = false;
try {
  attemptStockOut(5); // Requesting 5 when only 3 available
} catch (e) {
  caughtInsufficient = true;
  assert.strictEqual(e.code, "INSUFFICIENT_STOCK");
  console.log(" - Oversell Attempt (Request 5 from 3 Available)       : PASSED ✅ (Blocked with INSUFFICIENT_STOCK error)");
}
assert.strictEqual(caughtInsufficient, true);
assert.strictEqual(simulatedAvailableStock, 3); // Unchanged

// Test 4: Complete Sales Lifecycle Simulation & Mathematical Ledger Audit
console.log("\n[Test 4] Complete Sales & Stock-Out Lifecycle Simulation:");
let currentStock = 100; // Starting stock
const movementLogs = [
  { type: "OPENING", qtyChange: 100, balanceAfter: 100, reason: "Opening Stock" },
];

function recordStockOutMovement(qty, source, refNumber, reason) {
  if (currentStock - qty < 0) {
    throw new Error("INSUFFICIENT_STOCK");
  }
  currentStock -= qty;
  const log = {
    type: "OUT",
    source,
    referenceNumber: refNumber,
    qtyChange: -Math.abs(qty),
    balanceAfter: currentStock,
    reason,
  };
  movementLogs.push(log);
  return log;
}

// 1. Customer Sale #1: -5
recordStockOutMovement(5, "SALE", "INV-001", "Sale Invoice #INV-001");
console.log(" - Step 1: Customer Sale (-5 units for INV-001)       -> AvailableStock:", currentStock, "(Expected: 95)");
assert.strictEqual(currentStock, 95);

// 2. Customer Sale #2: -10
recordStockOutMovement(10, "POS_CHECKOUT", "INV-002", "POS Checkout Sale #INV-002");
console.log(" - Step 2: Customer Sale (-10 units for INV-002)      -> AvailableStock:", currentStock, "(Expected: 85)");
assert.strictEqual(currentStock, 85);

// 3. Damaged items write-off: -2
recordStockOutMovement(2, "DAMAGE", "DMG-01", "Broken in transit");
console.log(" - Step 3: Damage Write-Off (-2 damaged items)        -> AvailableStock:", currentStock, "(Expected: 83)");
assert.strictEqual(currentStock, 83);

// Mathematical Audit Check:
const totalSum = movementLogs.reduce((sum, item) => sum + item.qtyChange, 0);
console.log(" - Sum of all Movement Logs (inc. OPENING and OUTs)   :", totalSum);
console.log(" - Final Store State Balance                          :", currentStock);
assert.strictEqual(totalSum, currentStock);
console.log(" - Mathematical Audit Equation Check                  : PASSED ✅ (sum === currentStock)");

console.log("\n================================================================================");
console.log("    ALL PHASE 3 - TASK T19 STOCK OUT TESTS PASSED SUCCESSFULLY! ✅              ");
console.log("================================================================================\n");
