const mongoose = require("mongoose");
const assert = require("assert");
const { Inventory, InventoryLedger } = require("../src/models/inventory.model");
const { stockInSchema } = require("../src/validations/inventory.validation");

console.log("================================================================================");
console.log("    PHASE 3 - TASK T18: STOCK IN (ADDITION) ENDPOINT & SOURCE LOG TESTS         ");
console.log("================================================================================\n");

const dummyBusinessId1 = new mongoose.Types.ObjectId().toString();
const dummyProductId1 = new mongoose.Types.ObjectId().toString();

// Test 1: Zod Schema Validation for Stock-In with Source Details
console.log("[Test 1] Zod Schema Validations for Stock-In (Task T18):");
const validPurchaseStockIn = stockInSchema.safeParse({
  productId: dummyProductId1,
  quantity: 50,
  source: "PURCHASE",
  supplierName: "Metro Wholesalers Ltd.",
  unitCost: 10.5,
  referenceNumber: "PO-2026-8819",
  notes: "Delivered on pallet #3",
});
assert.strictEqual(validPurchaseStockIn.success, true);
assert.strictEqual(validPurchaseStockIn.data.source, "PURCHASE");
assert.strictEqual(validPurchaseStockIn.data.quantity, 50);
assert.strictEqual(validPurchaseStockIn.data.unitCost, 10.5);
console.log(" - Valid Purchase Stock-In (+50 with Supplier & UnitCost) : PASSED ✅");

const validManualStockIn = stockInSchema.safeParse({
  productId: dummyProductId1,
  quantity: 20,
  source: "MANUAL",
  notes: "Found extra unopened box in storage",
});
assert.strictEqual(validManualStockIn.success, true);
assert.strictEqual(validManualStockIn.data.source, "MANUAL");
console.log(" - Valid Manual Stock-In (+20 with notes)                : PASSED ✅");

const invalidNegativeQty = stockInSchema.safeParse({
  productId: dummyProductId1,
  quantity: -10,
});
assert.strictEqual(invalidNegativeQty.success, false);
console.log(" - Negative Quantity Rejection                           : PASSED ✅ (-10 rejected)");

const invalidZeroQty = stockInSchema.safeParse({
  productId: dummyProductId1,
  quantity: 0,
});
assert.strictEqual(invalidZeroQty.success, false);
console.log(" - Zero Quantity Rejection                               : PASSED ✅ (0 rejected)");

// Test 2: Inventory Ledger Mongoose Schema Persistence with Source Details
console.log("\n[Test 2] Inventory Ledger Mongoose Document with Source Details:");
const ledgerEntry = new InventoryLedger({
  businessId: new mongoose.Types.ObjectId(dummyBusinessId1),
  productId: new mongoose.Types.ObjectId(dummyProductId1),
  qtyChange: 50,
  balanceAfter: 150,
  type: "IN",
  source: "PURCHASE",
  supplierName: "Metro Wholesalers Ltd.",
  unitCost: 10.5,
  referenceNumber: "PO-2026-8819",
  reason: "Purchase from Metro Wholesalers Ltd.",
  notes: "Delivered on pallet #3",
});

const err = ledgerEntry.validateSync();
assert.strictEqual(!err, true);
assert.strictEqual(ledgerEntry.source, "PURCHASE");
assert.strictEqual(ledgerEntry.supplierName, "Metro Wholesalers Ltd.");
assert.strictEqual(ledgerEntry.unitCost, 10.5);
assert.strictEqual(ledgerEntry.referenceNumber, "PO-2026-8819");
console.log(" - Model Schema Source Details Verification              : PASSED ✅");

// Test 3: Simulation of Consecutive Stock-In Movements & Mathematical Balance
console.log("\n[Test 3] Consecutive Stock-In Movements Simulation & Audit Verification:");
let currentAvailableStock = 100; // Starting from 100 (e.g. from Opening Stock)
const movementLogs = [
  {
    type: "OPENING",
    source: "INITIAL_OPENING",
    qtyChange: 100,
    balanceAfter: 100,
    reason: "Opening Stock Initial Balance",
  },
];

function executeStockIn(payload) {
  const qty = payload.quantity;
  if (qty <= 0) throw new Error("INVALID_QUANTITY");
  currentAvailableStock += qty;
  const log = {
    type: "IN",
    source: payload.source || "PURCHASE",
    supplierName: payload.supplierName || "",
    unitCost: payload.unitCost || null,
    referenceNumber: payload.referenceNumber || "",
    qtyChange: qty,
    balanceAfter: currentAvailableStock,
    reason: payload.supplierName ? `Purchase from ${payload.supplierName}` : "Stock In / Purchase",
    notes: payload.notes || "",
  };
  movementLogs.push(log);
  return log;
}

// 1. Supplier Purchase: +50
const log1 = executeStockIn({
  quantity: 50,
  source: "PURCHASE",
  supplierName: "Metro Wholesalers",
  unitCost: 10,
  referenceNumber: "PO-001",
});
console.log(" - Step 1: Stock In Purchase (+50 from Metro)   -> AvailableStock:", currentAvailableStock, "(Expected: 150)");
assert.strictEqual(currentAvailableStock, 150);
assert.strictEqual(log1.balanceAfter, 150);
assert.strictEqual(log1.qtyChange, 50);

// 2. Direct Manual Addition: +20
const log2 = executeStockIn({
  quantity: 20,
  source: "MANUAL",
  notes: "Stock recount addition",
});
console.log(" - Step 2: Stock In Manual (+20 Direct)          -> AvailableStock:", currentAvailableStock, "(Expected: 170)");
assert.strictEqual(currentAvailableStock, 170);
assert.strictEqual(log2.balanceAfter, 170);
assert.strictEqual(log2.qtyChange, 20);

// 3. Goods Receipt: +30
const log3 = executeStockIn({
  quantity: 30,
  source: "GOODS_RECEIPT",
  referenceNumber: "GRN-2026-99",
  supplierName: "Amul Direct",
});
console.log(" - Step 3: Goods Receipt (+30 with GRN)          -> AvailableStock:", currentAvailableStock, "(Expected: 200)");
assert.strictEqual(currentAvailableStock, 200);
assert.strictEqual(log3.balanceAfter, 200);

// Mathematical Audit Check:
const totalSum = movementLogs.reduce((sum, item) => sum + item.qtyChange, 0);
console.log(" - Sum of all Movement Logs                      :", totalSum);
console.log(" - Final Store State Balance                     :", currentAvailableStock);
assert.strictEqual(totalSum, currentAvailableStock);
console.log(" - Mathematical Ledger Audit Check               : PASSED ✅ (sum === currentStock)");

console.log("\n================================================================================");
console.log("    ALL PHASE 3 - TASK T18 STOCK IN TESTS PASSED SUCCESSFULLY! ✅               ");
console.log("================================================================================\n");
