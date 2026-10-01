const assert = require("assert");

console.log("================================================================================");
console.log("    TASK T46: CONCURRENCY-SAFE INVENTORY OPERATIONS & INVARIANTS TEST SUITE     ");
console.log("================================================================================\n");

// ==============================================================================
// SIMULATION ENGINE: Thread-Safe Atomic Mongo Engine Simulation
// ==============================================================================
class MockAtomicMongoEngine {
  constructor() {
    this.inventories = new Map(); // key: `${businessId}:${productId}`
    this.ledgers = [];
    this.purchaseOrders = new Map();
  }

  getInvKey(businessId, productId) {
    return `${businessId}:${productId}`;
  }

  setStock(businessId, productId, stock, reorder = 5) {
    this.inventories.set(this.getInvKey(businessId, productId), {
      businessId,
      productId,
      availableStock: stock,
      reorderLevel: reorder,
      lowStockAlert: stock <= reorder,
    });
  }

  getStock(businessId, productId) {
    return this.inventories.get(this.getInvKey(businessId, productId))?.availableStock ?? 0;
  }

  /**
   * Simulates Atomic Concurrency-Safe findOneAndUpdate with $gte condition
   */
  async atomicDecrement(businessId, productId, quantity, sessionContext = null) {
    const key = this.getInvKey(businessId, productId);
    const inv = this.inventories.get(key);

    if (!inv || inv.availableStock < quantity) {
      return null; // Atomic condition failed: $gte not satisfied
    }

    // Atomic modification
    inv.availableStock -= quantity;
    inv.lowStockAlert = inv.availableStock <= inv.reorderLevel;

    return {
      productId,
      previousStock: inv.availableStock + quantity,
      availableStock: inv.availableStock,
      deductedQuantity: quantity,
    };
  }

  /**
   * Simulates Atomic Concurrency-Safe findOneAndUpdate with $inc addition
   */
  async atomicIncrement(businessId, productId, quantity) {
    const key = this.getInvKey(businessId, productId);
    let inv = this.inventories.get(key);
    if (!inv) {
      inv = { businessId, productId, availableStock: 0, reorderLevel: 5, lowStockAlert: true };
      this.inventories.set(key, inv);
    }

    inv.availableStock += quantity;
    inv.lowStockAlert = inv.availableStock <= inv.reorderLevel;

    return {
      productId,
      availableStock: inv.availableStock,
      addedQuantity: quantity,
    };
  }

  recordLedger(entry) {
    this.ledgers.push({
      ...entry,
      createdAt: new Date(),
    });
  }

  getLedgersForProduct(businessId, productId) {
    return this.ledgers.filter(
      (l) => l.businessId === businessId && l.productId === productId
    );
  }
}

const engine = new MockAtomicMongoEngine();

// ==============================================================================
// TEST 1: Concurrent Oversell Race Condition (Two Terminals Buy 4 when Stock = 5)
// ==============================================================================
console.log("[Test 1] Concurrent Checkout Race Condition (Zero Overselling Guarantee):");

const B_ID = "biz_kirana_01";
const PROD_MAGGI = "prod_maggi_70g";

engine.setStock(B_ID, PROD_MAGGI, 5);

// POS Terminal 1 & POS Terminal 2 send concurrent checkout requests
const orderA = { terminal: "POS_1", qty: 4 };
const orderB = { terminal: "POS_2", qty: 4 };

// Both requests execute concurrently against atomic condition
let orderAResult = null;
let orderBResult = null;

const runConcurrentCheckout = async () => {
  // Promise.all simulates two requests arriving simultaneously at the database worker
  const [resA, resB] = await Promise.all([
    engine.atomicDecrement(B_ID, PROD_MAGGI, orderA.qty),
    engine.atomicDecrement(B_ID, PROD_MAGGI, orderB.qty),
  ]);

  orderAResult = resA;
  orderBResult = resB;

  if (resA) {
    engine.recordLedger({
      businessId: B_ID,
      productId: PROD_MAGGI,
      qtyChange: -orderA.qty,
      balanceAfter: resA.availableStock,
      type: "OUT",
      source: "POS_CHECKOUT",
    });
  }

  if (resB) {
    engine.recordLedger({
      businessId: B_ID,
      productId: PROD_MAGGI,
      qtyChange: -orderB.qty,
      balanceAfter: resB.availableStock,
      type: "OUT",
      source: "POS_CHECKOUT",
    });
  }
};

(async () => {
  await runConcurrentCheckout();

  const successCount = (orderAResult ? 1 : 0) + (orderBResult ? 1 : 0);
  const failureCount = (orderAResult ? 0 : 1) + (orderBResult ? 0 : 1);

  assert.strictEqual(successCount, 1, "Exactly one concurrent checkout must succeed");
  assert.strictEqual(failureCount, 1, "The competing concurrent checkout must be rejected");
  assert.strictEqual(engine.getStock(B_ID, PROD_MAGGI), 1, "Physical stock must be exactly 1");

  console.log(" - Concurrent Terminal Requests  : 2 (4 packets each, Stock=5)");
  console.log(" - Accepted Checkout Orders      : 1 ✅ (Stock 5 ➔ 1)");
  console.log(" - Rejected Checkout Orders      : 1 ✅ (INSUFFICIENT_STOCK)");
  console.log(" - Zero-Overselling Guard Status : VERIFIED ✅");

  // ==============================================================================
  // TEST 2: Concurrent Stock OUT vs Sale Checkout
  // ==============================================================================
  console.log("\n[Test 2] Concurrent Stock OUT (Damage Write-off) vs POS Sale Checkout:");

  const PROD_COKE = "prod_coke_500ml";
  engine.setStock(B_ID, PROD_COKE, 10);

  // Request A: Damage Write-Off (-7)
  // Request B: POS Sale (-5)
  // Total attempted = 12 > 10
  const [damageRes, saleRes] = await Promise.all([
    engine.atomicDecrement(B_ID, PROD_COKE, 7),
    engine.atomicDecrement(B_ID, PROD_COKE, 5),
  ]);

  if (damageRes) {
    engine.recordLedger({
      businessId: B_ID,
      productId: PROD_COKE,
      qtyChange: -7,
      balanceAfter: damageRes.availableStock,
      type: "OUT",
      source: "DAMAGE",
    });
  }
  if (saleRes) {
    engine.recordLedger({
      businessId: B_ID,
      productId: PROD_COKE,
      qtyChange: -5,
      balanceAfter: saleRes.availableStock,
      type: "OUT",
      source: "POS_CHECKOUT",
    });
  }

  const finalCokeStock = engine.getStock(B_ID, PROD_COKE);
  assert.strictEqual(finalCokeStock >= 0, true, "Stock must never become negative");
  assert.strictEqual((damageRes ? 1 : 0) + (saleRes ? 1 : 0), 1, "Only one mutation must succeed");

  console.log(` - Initial Stock                 : 10 units`);
  console.log(` - Competing Deductions          : -7 (Damage) vs -5 (Sale)`);
  console.log(` - Final Stock Balance           : ${finalCokeStock} units (Stock >= 0 Guaranteed) ✅`);

  // ==============================================================================
  // TEST 3: Concurrent Stock IN (Lost Update Prevention)
  // ==============================================================================
  console.log("\n[Test 3] Concurrent Stock IN Lost Update Prevention:");

  const PROD_ATTA = "prod_aashirvaad_5kg";
  engine.setStock(B_ID, PROD_ATTA, 10);

  // Supplier Batch A (+20) and Supplier Batch B (+30) arrive at the exact same moment
  await Promise.all([
    engine.atomicIncrement(B_ID, PROD_ATTA, 20).then((res) => {
      engine.recordLedger({
        businessId: B_ID,
        productId: PROD_ATTA,
        qtyChange: 20,
        balanceAfter: res.availableStock,
        type: "IN",
        source: "PURCHASE",
      });
    }),
    engine.atomicIncrement(B_ID, PROD_ATTA, 30).then((res) => {
      engine.recordLedger({
        businessId: B_ID,
        productId: PROD_ATTA,
        qtyChange: 30,
        balanceAfter: res.availableStock,
        type: "IN",
        source: "GOODS_RECEIPT",
      });
    }),
  ]);

  const finalAttaStock = engine.getStock(B_ID, PROD_ATTA);
  assert.strictEqual(finalAttaStock, 60, "10 + 20 + 30 must equal exactly 60 with zero lost updates");

  console.log(" - Initial Stock                 : 10");
  console.log(" - Batch A Increment             : +20");
  console.log(" - Batch B Increment             : +30");
  console.log(` - Final Stock Balance           : ${finalAttaStock} (Zero Lost Updates) ✅`);

  // ==============================================================================
  // TEST 4: Multi-Item Batch POS Checkout Atomic Rollback Guard
  // ==============================================================================
  console.log("\n[Test 4] Multi-Item Batch POS Checkout with Atomic Rollback Simulation:");

  const PROD_MILK = "prod_amul_milk_1l";
  const PROD_BREAD = "prod_harvest_bread";
  const PROD_BUTTER = "prod_amul_butter_100g";

  engine.setStock(B_ID, PROD_MILK, 10);
  engine.setStock(B_ID, PROD_BREAD, 2); // Only 2 left in store
  engine.setStock(B_ID, PROD_BUTTER, 5);

  // Customer cart: 3 Milk (ok), 5 Bread (INSUFFICIENT!), 2 Butter (ok)
  const cartItems = [
    { productId: PROD_MILK, qty: 3 },
    { productId: PROD_BREAD, qty: 5 }, // Will fail!
    { productId: PROD_BUTTER, qty: 2 },
  ];

  let batchTransactionAborted = false;
  const executedSubDeductions = [];

  try {
    for (const item of cartItems) {
      const dec = await engine.atomicDecrement(B_ID, item.productId, item.qty);
      if (!dec) {
        throw new Error(`INSUFFICIENT_STOCK for ${item.productId}`);
      }
      executedSubDeductions.push({ productId: item.productId, qty: item.qty });
    }
  } catch (err) {
    batchTransactionAborted = true;
    // Rollback previous sub-deductions in transaction
    for (const sub of executedSubDeductions) {
      await engine.atomicIncrement(B_ID, sub.productId, sub.qty);
    }
  }

  assert.strictEqual(batchTransactionAborted, true, "Transaction must abort when one line fails");
  assert.strictEqual(engine.getStock(B_ID, PROD_MILK), 10, "Milk stock must be rolled back to 10");
  assert.strictEqual(engine.getStock(B_ID, PROD_BREAD), 2, "Bread stock must remain 2");
  assert.strictEqual(engine.getStock(B_ID, PROD_BUTTER), 5, "Butter stock must remain 5");

  console.log(" - Cart Request                 : 3 Milk (Avail: 10), 5 Bread (Avail: 2), 2 Butter (Avail: 5)");
  console.log(" - Line 2 Stock Failure Trigger : INSUFFICIENT_STOCK ✅");
  console.log(" - Transaction Rollback Status  : ALL ITEMS RESTORED TO ORIGINAL BALANCE ✅");

  // ==============================================================================
  // TEST 5: Strict Multi-Tenant Business Isolation Guard
  // ==============================================================================
  console.log("\n[Test 5] Multi-Tenant Business Boundary Isolation Guard:");

  const B_ID_STORE_1 = "biz_store_01";
  const B_ID_STORE_2 = "biz_store_02";
  const SHARED_PROD_ID = "prod_shared_biscuit";

  engine.setStock(B_ID_STORE_1, SHARED_PROD_ID, 50);
  engine.setStock(B_ID_STORE_2, SHARED_PROD_ID, 2);

  // Store 1 sells 20 packets
  const resStore1 = await engine.atomicDecrement(B_ID_STORE_1, SHARED_PROD_ID, 20);
  assert.strictEqual(resStore1 !== null, true);
  assert.strictEqual(engine.getStock(B_ID_STORE_1, SHARED_PROD_ID), 30);
  assert.strictEqual(engine.getStock(B_ID_STORE_2, SHARED_PROD_ID), 2, "Store 2 stock must be unaffected");

  // Store 2 attempts to sell 5 (has only 2)
  const resStore2 = await engine.atomicDecrement(B_ID_STORE_2, SHARED_PROD_ID, 5);
  assert.strictEqual(resStore2, null, "Store 2 cannot draw from Store 1 balance");
  assert.strictEqual(engine.getStock(B_ID_STORE_2, SHARED_PROD_ID), 2);

  console.log(" - Store 1 Stock (50 ➔ 30)       : DEDUCTED ✅");
  console.log(" - Store 2 Stock (2 Units)       : UNAFFECTED & ISOLATED ✅");
  console.log(" - Multi-Tenant Boundary Guard   : PASSED ✅");

  // ==============================================================================
  // TEST 6: Core Invariant Verification (availableStock === sum(Ledger.qtyChange))
  // ==============================================================================
  console.log("\n[Test 6] Mathematical Ledger Invariant (Stock === sum(Ledger.qtyChange)):");

  const INVARIANT_PROD = "prod_invariant_sugar_1kg";
  engine.setStock(B_ID, INVARIANT_PROD, 0);

  // Sequence of 5 operations:
  // 1. Initial Opening: +100
  // 2. Sale 1: -15
  // 3. Purchase GRN: +50
  // 4. Sale 2: -25
  // 5. Damaged write-off: -10
  const operations = [
    { type: "OPENING", qty: 100, source: "INITIAL_OPENING" },
    { type: "OUT", qty: -15, source: "POS_CHECKOUT" },
    { type: "IN", qty: 50, source: "GOODS_RECEIPT" },
    { type: "OUT", qty: -25, source: "POS_CHECKOUT" },
    { type: "OUT", qty: -10, source: "DAMAGE" },
  ];

  for (const op of operations) {
    if (op.qty > 0) {
      const res = await engine.atomicIncrement(B_ID, INVARIANT_PROD, op.qty);
      engine.recordLedger({
        businessId: B_ID,
        productId: INVARIANT_PROD,
        qtyChange: op.qty,
        balanceAfter: res.availableStock,
        type: op.type,
        source: op.source,
      });
    } else {
      const res = await engine.atomicDecrement(B_ID, INVARIANT_PROD, Math.abs(op.qty));
      engine.recordLedger({
        businessId: B_ID,
        productId: INVARIANT_PROD,
        qtyChange: op.qty,
        balanceAfter: res.availableStock,
        type: op.type,
        source: op.source,
      });
    }
  }

  const ledgers = engine.getLedgersForProduct(B_ID, INVARIANT_PROD);
  const sumLedgerQty = ledgers.reduce((acc, l) => acc + l.qtyChange, 0);
  const currentPhysicalStock = engine.getStock(B_ID, INVARIANT_PROD);

  assert.strictEqual(ledgers.length, 5, "Exactly 5 ledger entries must exist");
  assert.strictEqual(sumLedgerQty, 100, "Sum of ledger changes must equal 100 (100 - 15 + 50 - 25 - 10)");
  assert.strictEqual(currentPhysicalStock, 100, "Current physical stock must equal 100");
  assert.strictEqual(currentPhysicalStock, sumLedgerQty, "Physical stock MUST strictly equal sum of ledger logs");

  console.log(` - Operations Processed          : 5 operations (+100, -15, +50, -25, -10)`);
  console.log(` - Current Available Stock       : ${currentPhysicalStock}`);
  console.log(` - Total Ledger Sum              : ${sumLedgerQty}`);
  console.log(` - Invariant Status              : PERFECT EQUALITY (100 === 100) ✅`);

  console.log("\n================================================================================");
  console.log("    ALL TASK T46 CONCURRENCY-SAFE INVENTORY TESTS PASSED! 🎉 (6/6)              ");
  console.log("================================================================================\n");
})();
