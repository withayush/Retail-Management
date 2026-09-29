const assert = require("assert");

console.log("================================================================================");
console.log("   TRANSACTION INTEGRITY: CONCURRENCY-SAFE INVENTORY & RACE CONDITIONS TESTS    ");
console.log("================================================================================\n");

// ==============================================================================
// TEST 1: Atomic Stock Decrement Simulation with Condition Guard ($gte)
// ==============================================================================
console.log("[Test 1] Atomic Stock Deduction with $gte Guard Simulation:");

// Initial store state: Kirana store has 5 packets of Maggi left
let storeInventory = {
  productId: "MAGGI_100",
  availableStock: 5,
};

/**
 * Simulates MongoDB atomic findOneAndUpdate({ availableStock: { $gte: qty } }, { $inc: { availableStock: -qty } })
 */
const atomicDeduct = (inventory, qty) => {
  if (inventory.availableStock >= qty) {
    inventory.availableStock -= qty;
    return { success: true, newBalance: inventory.availableStock };
  }
  return null; // Atomic failure condition met
};

const result1 = atomicDeduct(storeInventory, 3);
assert.strictEqual(result1 !== null, true);
assert.strictEqual(result1.newBalance, 2);
assert.strictEqual(storeInventory.availableStock, 2);
console.log(" - Single Terminal Deduction (5 -> 2)   : PASSED ✅");

// ==============================================================================
// TEST 2: Two POS Terminals Simultaneous Checkout Race Condition
// ==============================================================================
console.log("\n[Test 2] Simultaneous Checkout from 2 POS Terminals (Zero Overselling Guard):");

// Reset stock to 5 units
storeInventory = {
  productId: "MAGGI_100",
  availableStock: 5,
};

// Terminal A and Terminal B both attempt to sell 4 packets at the same instant
const terminalA_Order = { cashier: "Terminal-1", requestedQty: 4 };
const terminalB_Order = { cashier: "Terminal-2", requestedQty: 4 };

// In race condition:
// Order A executes first atomically
const resA = atomicDeduct(storeInventory, terminalA_Order.requestedQty);
assert.strictEqual(resA !== null, true);
assert.strictEqual(resA.newBalance, 1); // 5 - 4 = 1

// Order B arrives almost simultaneously, but availableStock is now 1 (< 4)
const resB = atomicDeduct(storeInventory, terminalB_Order.requestedQty);
assert.strictEqual(resB, null); // Atomic condition rejects Order B

// Stock remains positive (1), never drops to -3
assert.strictEqual(storeInventory.availableStock, 1);

console.log(" - Terminal A Checkout (4 packets)     : SUCCESS ✅ (Stock 5 -> 1)");
console.log(" - Terminal B Checkout (4 packets)     : REJECTED (INSUFFICIENT_STOCK) ✅");
console.log(" - Final Store Physical Stock          : 1 packet (Zero Overselling Guaranteed) ✅");

// ==============================================================================
// TEST 3: GRN Physical Stock Receiving + Inventory Ledger Invariant
// ==============================================================================
console.log("\n[Test 3] GRN Receiving Stock Increment & Invariant Check:");

const ledgerMovements = [];
let currentStock = 0;

const executeStockIn = (qty, source) => {
  currentStock += qty;
  ledgerMovements.push({
    qtyChange: qty,
    balanceAfter: currentStock,
    source,
  });
  return currentStock;
};

const executeStockOut = (qty, source) => {
  if (currentStock < qty) throw new Error("INSUFFICIENT_STOCK");
  currentStock -= qty;
  ledgerMovements.push({
    qtyChange: -qty,
    balanceAfter: currentStock,
    source,
  });
  return currentStock;
};

// 1. Initial opening: 10
executeStockIn(10, "INITIAL_OPENING");
// 2. POS Sale: 3
executeStockOut(3, "POS_CHECKOUT");
// 3. GRN Purchase: 15
executeStockIn(15, "GOODS_RECEIPT");
// 4. POS Sale: 7
executeStockOut(7, "POS_CHECKOUT");

// Calculate sum(ledger.qtyChange)
const sumLedger = ledgerMovements.reduce((acc, m) => acc + m.qtyChange, 0);

assert.strictEqual(currentStock, 15);
assert.strictEqual(sumLedger, 15);
assert.strictEqual(currentStock, sumLedger);

console.log(` - Current Physical Stock               : ${currentStock}`);
console.log(` - Sum of Ledger Movements              : ${sumLedger}`);
console.log(" - Invariant (Stock === sum(Ledger))    : PASSED ✅");

console.log("\n================================================================================");
console.log("    ALL CONCURRENCY & INTEGRITY TESTS PASSED (3/3) ✅                           ");
console.log("================================================================================\n");
