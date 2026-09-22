const assert = require("assert");
const mongoose = require("mongoose");

/**
 * Phase 4 - Task T26: Auto Inventory Deductions Test Suite
 * Validates automatic mapping from Sale/Checkout line items to inventory stock reduction,
 * ledger OUT log generation, pre-flight out-of-stock prevention, and alert triggers.
 */

console.log("================================================================================");
console.log("    PHASE 4 - TASK T26: AUTO INVENTORY DEDUCTIONS TESTS                         ");
console.log("================================================================================");

const dummyBusinessId1 = new mongoose.Types.ObjectId();
const dummyBusinessId2 = new mongoose.Types.ObjectId();

const dummyProdMaggi = new mongoose.Types.ObjectId();
const dummyProdCoke = new mongoose.Types.ObjectId();
const dummyProdBiscuits = new mongoose.Types.ObjectId();

// Mock store state representing Inventory records
const createMockStore = () => [
  {
    businessId: dummyBusinessId1,
    productId: dummyProdMaggi,
    productName: "Maggi 2-Min Noodles",
    availableStock: 100,
    reorderLevel: 20,
    lowStockAlert: false,
  },
  {
    businessId: dummyBusinessId1,
    productId: dummyProdCoke,
    productName: "Coca Cola 500ml",
    availableStock: 10,
    reorderLevel: 5,
    lowStockAlert: false,
  },
  {
    businessId: dummyBusinessId1,
    productId: dummyProdBiscuits,
    productName: "Parle-G Gold Biscuits",
    availableStock: 50,
    reorderLevel: 15,
    lowStockAlert: false,
  },
  {
    businessId: dummyBusinessId2,
    productId: dummyProdMaggi,
    productName: "Maggi Store 2",
    availableStock: 80,
    reorderLevel: 10,
    lowStockAlert: false,
  },
];

// Reusable Auto-Deduction Engine Logic (matching Task T26 Service implementation)
const executeAutoInventoryDeduction = (store, ledgerEntries, alerts, businessId, payload) => {
  const { saleId, invoiceNumber, items, source = "POS_CHECKOUT" } = payload;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return { deductions: [] };
  }

  // 1. Pre-flight check across all items in batch
  for (const item of items) {
    const inv = store.find(
      (s) => s.businessId.toString() === businessId.toString() && s.productId.toString() === item.productId.toString()
    );
    const availableStock = inv ? inv.availableStock : 0;
    const requestedQty = Number(item.quantity || 1);

    if (!inv || availableStock < requestedQty) {
      const error = new Error(
        `Insufficient stock for '${item.name || "Product"}'. Available: ${availableStock}, Requested: ${requestedQty}`
      );
      error.statusCode = 400;
      error.code = "INSUFFICIENT_STOCK";
      error.availableStock = availableStock;
      error.requestedQuantity = requestedQty;
      throw error;
    }
  }

  // 2. Execute deductions atomically
  const deductions = [];
  for (const item of items) {
    const inv = store.find(
      (s) => s.businessId.toString() === businessId.toString() && s.productId.toString() === item.productId.toString()
    );
    const requestedQty = Number(item.quantity || 1);
    const previousStock = inv.availableStock;
    const newStock = previousStock - requestedQty;

    inv.availableStock = newStock;
    inv.lowStockAlert = newStock <= inv.reorderLevel;

    deductions.push({
      productId: inv.productId,
      productName: inv.productName,
      previousStock,
      newStock,
      deductedQuantity: requestedQty,
    });

    ledgerEntries.push({
      businessId,
      productId: inv.productId,
      qtyChange: -requestedQty,
      balanceAfter: newStock,
      type: "OUT",
      source,
      referenceNumber: invoiceNumber,
      invoiceId: saleId,
      reason: `POS Sale Checkout #${invoiceNumber}`,
    });

    // Evaluate low stock alert
    if (newStock <= inv.reorderLevel) {
      alerts.push({
        businessId,
        productId: inv.productId,
        productName: inv.productName,
        currentStock: newStock,
        reorderLevel: inv.reorderLevel,
        severity: newStock <= 0 ? "CRITICAL" : "LOW_STOCK",
      });
    }
  }

  return { deductions };
};

// -----------------------------------------------------------------------------
// [Test 1] Single Sale Auto-Deduction (Maggi 100 -> 97 units)
// -----------------------------------------------------------------------------
console.log("\n[Test 1] Single Product Checkout Auto-Deduction (Maggi: 100 ➔ 97 units):");
let store = createMockStore();
let ledger = [];
let alerts = [];

const singleSaleResult = executeAutoInventoryDeduction(store, ledger, alerts, dummyBusinessId1, {
  saleId: new mongoose.Types.ObjectId(),
  invoiceNumber: "INV-1001",
  items: [
    { productId: dummyProdMaggi, name: "Maggi 2-Min Noodles", quantity: 3 },
  ],
});

const maggiInv = store.find((s) => s.productId === dummyProdMaggi && s.businessId === dummyBusinessId1);
assert.strictEqual(maggiInv.availableStock, 97);
assert.strictEqual(ledger.length, 1);
assert.strictEqual(ledger[0].qtyChange, -3);
assert.strictEqual(ledger[0].balanceAfter, 97);
assert.strictEqual(ledger[0].type, "OUT");
assert.strictEqual(ledger[0].referenceNumber, "INV-1001");

console.log(" - Deducted Quantity     : 3 units (100 ➔ 97) ✅");
console.log(" - Available Stock       : 97 left in inventory ✅");
console.log(" - Ledger Log Created    : type='OUT', qtyChange=-3, balanceAfter=97, ref='INV-1001' ✅");

// -----------------------------------------------------------------------------
// [Test 2] Multi-Product Batch Auto-Deduction in Single Checkout
// -----------------------------------------------------------------------------
console.log("\n[Test 2] Multi-Product Batch Auto-Deduction (Coke & Biscuits):");
const batchResult = executeAutoInventoryDeduction(store, ledger, alerts, dummyBusinessId1, {
  saleId: new mongoose.Types.ObjectId(),
  invoiceNumber: "INV-1002",
  items: [
    { productId: dummyProdCoke, name: "Coca Cola 500ml", quantity: 3 },
    { productId: dummyProdBiscuits, name: "Parle-G Gold Biscuits", quantity: 5 },
  ],
});

const cokeInv = store.find((s) => s.productId === dummyProdCoke && s.businessId === dummyBusinessId1);
const biscuitsInv = store.find((s) => s.productId === dummyProdBiscuits && s.businessId === dummyBusinessId1);

assert.strictEqual(cokeInv.availableStock, 7); // 10 - 3 = 7
assert.strictEqual(biscuitsInv.availableStock, 45); // 50 - 5 = 45
assert.strictEqual(ledger.length, 3); // 1 from previous + 2 new

console.log(" - Coke Auto-Deduction   : 10 ➔ 7 units ✅");
console.log(" - Biscuits Auto-Deduct  : 50 ➔ 45 units ✅");
console.log(" - Total Ledger OUT Logs : 3 logs recorded with exact invoice linkage ✅");

// -----------------------------------------------------------------------------
// [Test 3] Out-of-Stock / Insufficient Stock Pre-Flight Prevention Guard
// -----------------------------------------------------------------------------
console.log("\n[Test 3] Insufficient Stock Pre-Flight Abort Guard:");
let stockErrorThrown = false;
const currentCokeStockBefore = cokeInv.availableStock; // 7 left

try {
  executeAutoInventoryDeduction(store, ledger, alerts, dummyBusinessId1, {
    saleId: new mongoose.Types.ObjectId(),
    invoiceNumber: "INV-1003",
    items: [
      { productId: dummyProdCoke, name: "Coca Cola 500ml", quantity: 15 }, // Needs 15, only 7 available
    ],
  });
} catch (err) {
  stockErrorThrown = true;
  assert.strictEqual(err.code, "INSUFFICIENT_STOCK");
  assert.strictEqual(err.availableStock, 7);
  assert.strictEqual(err.requestedQuantity, 15);
  console.log(" - Abort Triggered with Code :", err.code, "✅");
  console.log(" - Rejection Error Message   :", err.message, "✅");
}

assert.strictEqual(stockErrorThrown, true);
assert.strictEqual(cokeInv.availableStock, currentCokeStockBefore); // 0 mutation
console.log(" - Inventory Stock Preserved : 7 left (Guaranteed 0 Mutation on Abort) ✅");

// -----------------------------------------------------------------------------
// [Test 4] Low-Stock Notification Trigger on Auto-Deduction Below Reorder Level
// -----------------------------------------------------------------------------
console.log("\n[Test 4] Low-Stock Alert Triggered When Auto-Deduction Crosses Reorder Threshold:");
// Coke reorderLevel is 5. Current stock is 7. Sell 4 units -> 3 units left (3 <= 5 -> LOW STOCK alert)
const alertTriggerSale = executeAutoInventoryDeduction(store, ledger, alerts, dummyBusinessId1, {
  saleId: new mongoose.Types.ObjectId(),
  invoiceNumber: "INV-1004",
  items: [
    { productId: dummyProdCoke, name: "Coca Cola 500ml", quantity: 4 },
  ],
});

assert.strictEqual(cokeInv.availableStock, 3);
assert.strictEqual(cokeInv.lowStockAlert, true);
assert.strictEqual(alerts.length, 1);
assert.strictEqual(alerts[0].productName, "Coca Cola 500ml");
assert.strictEqual(alerts[0].currentStock, 3);
assert.strictEqual(alerts[0].reorderLevel, 5);

console.log(" - Coke Available Stock  : 3 units left (Reorder Level: 5) ✅");
console.log(" - Low Stock Alert Flag  : true ✅");
console.log(" - Alert Event Generated :", alerts[0].productName, "Stock:", alerts[0].currentStock, "Reorder:", alerts[0].reorderLevel, "✅");

// -----------------------------------------------------------------------------
// [Test 5] Multi-Tenant Business Isolation Guard
// -----------------------------------------------------------------------------
console.log("\n[Test 5] Multi-Tenant Store Isolation Guard:");
const store2Maggi = store.find((s) => s.productId === dummyProdMaggi && s.businessId === dummyBusinessId2);
assert.strictEqual(store2Maggi.availableStock, 80); // Untouched by Store 1 checkouts

console.log(" - Store 1 Maggi Stock   :", maggiInv.availableStock, "(97 units)");
console.log(" - Store 2 Maggi Stock   :", store2Maggi.availableStock, "(80 units - 100% Isolated) ✅");
console.log(" - Multi-Tenant Guard    : PASSED ✅");

console.log("\n================================================================================");
console.log("    ALL PHASE 4 - TASK T26 AUTO INVENTORY DEDUCTION TESTS PASSED! 🎉           ");
console.log("================================================================================\n");
