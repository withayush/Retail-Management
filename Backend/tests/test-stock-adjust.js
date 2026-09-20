const mongoose = require("mongoose");
const assert = require("assert");
const { Inventory, InventoryLedger } = require("../src/models/inventory.model");
const { adjustStockSchema } = require("../src/validations/inventory.validation");

console.log("================================================================================");
console.log("    PHASE 3 - TASK T20: STOCK RECONCILIATION / ADJUST API TESTS                ");
console.log("================================================================================\n");

const dummyBusinessId = new mongoose.Types.ObjectId().toString();
const dummyProductId = new mongoose.Types.ObjectId().toString();

// Test 1: Zod Schema Validations for Stock Adjustments (Task T20)
console.log("[Test 1] Zod Schema Validations for Stock Reconciliation (Task T20):");

// 1.1 Valid Physical Count Audit with Discrepancy
const validAuditAdjust = adjustStockSchema.safeParse({
  productId: dummyProductId,
  physicalCount: 95,
  source: "AUDIT_RECONCILIATION",
  referenceNumber: "AUDIT-2026-Q1",
  reason: "Quarterly Store Physical Audit Count",
  notes: "Audited by Store Manager Ramesh",
});
assert.strictEqual(validAuditAdjust.success, true);
assert.strictEqual(validAuditAdjust.data.physicalCount, 95);
assert.strictEqual(validAuditAdjust.data.source, "AUDIT_RECONCILIATION");
console.log(" - Valid Physical Audit Schema (count: 95, source: AUDIT_RECONCILIATION): PASSED ✅");

// 1.2 Valid Damaged / Spillage Write-off Adjustment
const validSpillageAdjust = adjustStockSchema.safeParse({
  productId: dummyProductId,
  newStock: 88,
  source: "SPILLAGE",
  reason: "Broken liquid detergent bottle in aisle 3",
});
assert.strictEqual(validSpillageAdjust.success, true);
assert.strictEqual(validSpillageAdjust.data.newStock, 88);
assert.strictEqual(validSpillageAdjust.data.source, "SPILLAGE");
console.log(" - Valid Spillage / Damage Adjustment Schema (newStock: 88)             : PASSED ✅");

// 1.3 Rejection of Negative Stock
const invalidNegativeStock = adjustStockSchema.safeParse({
  productId: dummyProductId,
  newStock: -10,
});
assert.strictEqual(invalidNegativeStock.success, false);
console.log(" - Negative Stock Rejection                                            : PASSED ✅ (-10 rejected)");

// 1.4 Rejection when neither newStock nor physicalCount is provided
const invalidMissingStock = adjustStockSchema.safeParse({
  productId: dummyProductId,
  reason: "Missing count",
});
assert.strictEqual(invalidMissingStock.success, false);
console.log(" - Missing Target Count Rejection                                      : PASSED ✅ (No count provided rejected)");

// Test 2: Mongoose Schema Document with ADJUST Movement Details
console.log("\n[Test 2] Mongoose Schema Document with ADJUST Movement Details:");
const adjustLedgerEntry = new InventoryLedger({
  businessId: new mongoose.Types.ObjectId(dummyBusinessId),
  productId: new mongoose.Types.ObjectId(dummyProductId),
  qtyChange: -5, // -5 units discrepancy
  balanceAfter: 95,
  type: "ADJUST",
  source: "AUDIT_RECONCILIATION",
  referenceNumber: "AUDIT-BATCH-01",
  reason: "Physical Audit: Shortage discrepancy (-5 units)",
  notes: "Recount verified with inventory lead",
});

const err = adjustLedgerEntry.validateSync();
assert.strictEqual(!err, true);
assert.strictEqual(adjustLedgerEntry.qtyChange, -5);
assert.strictEqual(adjustLedgerEntry.balanceAfter, 95);
assert.strictEqual(adjustLedgerEntry.type, "ADJUST");
assert.strictEqual(adjustLedgerEntry.source, "AUDIT_RECONCILIATION");
console.log(" - Model Schema ADJUST Verification (qtyChange: -5, balanceAfter: 95)  : PASSED ✅");

// Test 3: Downward and Upward Physical Count Adjustments Simulation
console.log("\n[Test 3] Physical Count Discrepancy & Reconciliation Simulation:");
let simulatedCurrentStock = 100;
const ledgerHistory = [
  { type: "OPENING", qtyChange: 100, balanceAfter: 100, reason: "Opening Stock" },
];

function reconcileStock(targetCount, source, reason, refNumber) {
  const discrepancy = targetCount - simulatedCurrentStock;
  simulatedCurrentStock = targetCount;
  const entry = {
    type: "ADJUST",
    source,
    referenceNumber: refNumber || "",
    qtyChange: discrepancy,
    balanceAfter: simulatedCurrentStock,
    reason: reason || `Stock Reconciliation (${discrepancy >= 0 ? "+" : ""}${discrepancy})`,
  };
  ledgerHistory.push(entry);
  return { discrepancy, entry };
}

// 3.1 Downward adjustment due to spillage / breakage (-3)
const downAdj = reconcileStock(97, "SPILLAGE", "Broken oil packet spillage on rack", "SP-001");
assert.strictEqual(downAdj.discrepancy, -3);
assert.strictEqual(simulatedCurrentStock, 97);
console.log(" - Step 1: Downward Spillage (-3 units discrepancy)   -> AvailableStock: 97 (Expected: 97)");

// 3.2 Upward adjustment due to unrecorded found stock (+8)
const upAdj = reconcileStock(105, "FOUND_STOCK", "Found extra box in backroom storage", "FND-002");
assert.strictEqual(upAdj.discrepancy, 8);
assert.strictEqual(simulatedCurrentStock, 105);
console.log(" - Step 2: Upward Found Stock (+8 units surplus)      -> AvailableStock: 105 (Expected: 105)");

// 3.3 Zero discrepancy audit verification (Exact match 105 -> 105)
const zeroAdj = reconcileStock(105, "AUDIT_RECONCILIATION", "Physical count verified with zero delta", "AUD-003");
assert.strictEqual(zeroAdj.discrepancy, 0);
assert.strictEqual(simulatedCurrentStock, 105);
console.log(" - Step 3: Exact Count Match (0 discrepancy)          -> AvailableStock: 105 (Expected: 105)");

// Test 4: Complete Lifecycle with OPENING, IN, OUT, and ADJUST
console.log("\n[Test 4] Complete Lifecycle & Mathematical Ledger Audit Verification:");
// 4.1 Purchase In +20
simulatedCurrentStock += 20;
ledgerHistory.push({ type: "IN", source: "PURCHASE", qtyChange: 20, balanceAfter: simulatedCurrentStock, reason: "Supplier Purchase" });
assert.strictEqual(simulatedCurrentStock, 125);
console.log(" - Step 4: Purchase Stock In (+20 units)              -> AvailableStock: 125 (Expected: 125)");

// 4.2 Sale Out -15
simulatedCurrentStock -= 15;
ledgerHistory.push({ type: "OUT", source: "SALE", qtyChange: -15, balanceAfter: simulatedCurrentStock, reason: "Customer Sale #INV-101" });
assert.strictEqual(simulatedCurrentStock, 110);
console.log(" - Step 5: Sale Stock Out (-15 units)                 -> AvailableStock: 110 (Expected: 110)");

// 4.3 Damaged Items Adjustment (-2)
reconcileStock(108, "DAMAGE", "Damaged goods write-off", "DMG-102");
assert.strictEqual(simulatedCurrentStock, 108);
console.log(" - Step 6: Damage Adjustment (-2 units write-off)     -> AvailableStock: 108 (Expected: 108)");

// Mathematical Audit Check: Sum of all qtyChanges must strictly equal final AvailableStock
const sumOfAllMovements = ledgerHistory.reduce((acc, log) => acc + log.qtyChange, 0);
console.log(" - Total Sum of all Movement Logs (inc. ADJUSTs)      :", sumOfAllMovements);
console.log(" - Final Store State Balance                          :", simulatedCurrentStock);
assert.strictEqual(sumOfAllMovements, simulatedCurrentStock);
console.log(" - Mathematical Audit Equation Check                  : PASSED ✅ (sum(ledger.qtyChange) === availableStock)");

console.log("\n================================================================================");
console.log("    ALL PHASE 3 - TASK T20 STOCK RECONCILIATION TESTS PASSED SUCCESSFULLY! ✅   ");
console.log("================================================================================\n");
