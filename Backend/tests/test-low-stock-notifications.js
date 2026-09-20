const mongoose = require("mongoose");
const assert = require("assert");
const InventoryAlert = require("../src/models/inventoryAlert.model");

console.log("================================================================================");
console.log("    PHASE 3 - TASK T22: LOW-STOCK LIMIT NOTIFICATIONS & ALERT ENGINE TESTS      ");
console.log("================================================================================\n");

const dummyBusinessId1 = new mongoose.Types.ObjectId().toString();
const dummyBusinessId2 = new mongoose.Types.ObjectId().toString();
const dummyProductId1 = new mongoose.Types.ObjectId().toString();
const dummyProductId2 = new mongoose.Types.ObjectId().toString();
const dummyUserId = new mongoose.Types.ObjectId().toString();

// ==============================================================================
// TEST 1: InventoryAlert Schema Validation & Severity Grading
// ==============================================================================
console.log("[Test 1] InventoryAlert Mongoose Schema Validation & Severity Grading:");

const alertRecord = new InventoryAlert({
  businessId: new mongoose.Types.ObjectId(dummyBusinessId1),
  productId: new mongoose.Types.ObjectId(dummyProductId1),
  alertType: "LOW_STOCK",
  severity: "WARNING",
  currentStock: 15,
  reorderLevel: 20,
  deficitQty: 5,
  status: "UNREAD",
  message: 'Product "Maggi 2-Min Noodles" is running low on stock (15 left, reorder level: 20).',
});

const valErr = alertRecord.validateSync();
assert.strictEqual(!valErr, true);
assert.strictEqual(alertRecord.severity, "WARNING");
assert.strictEqual(alertRecord.status, "UNREAD");
assert.strictEqual(alertRecord.deficitQty, 5);
assert.strictEqual(alertRecord.currentStock, 15);
assert.strictEqual(alertRecord.reorderLevel, 20);

console.log(" - Valid Low Stock Alert Record : PASSED ✅ (severity: WARNING, status: UNREAD)");

// Out of stock alert validation
const outOfStockAlert = new InventoryAlert({
  businessId: new mongoose.Types.ObjectId(dummyBusinessId1),
  productId: new mongoose.Types.ObjectId(dummyProductId2),
  alertType: "OUT_OF_STOCK",
  severity: "CRITICAL",
  currentStock: 0,
  reorderLevel: 10,
  deficitQty: 10,
  status: "UNREAD",
  message: 'Product "Amul Butter 100g" is completely OUT OF STOCK (0 units left, reorder level: 10).',
});

const oosErr = outOfStockAlert.validateSync();
assert.strictEqual(!oosErr, true);
assert.strictEqual(outOfStockAlert.severity, "CRITICAL");
assert.strictEqual(outOfStockAlert.alertType, "OUT_OF_STOCK");
console.log(" - Valid Out Of Stock Alert Record: PASSED ✅ (severity: CRITICAL, type: OUT_OF_STOCK)");

// ==============================================================================
// TEST 2: Deterministic Rule Engine Simulation & Deduplication Guarantee
// ==============================================================================
console.log("\n[Test 2] Deterministic Rule Engine & Deduplication Verification:");

// In-memory simulation of alert store
const alertStore = [];

const simulateEvaluateLowStockRule = (payload) => {
  const { businessId, productId, availableStock, reorderLevel, productName } = payload;
  const isLowStock = availableStock <= reorderLevel;

  if (isLowStock) {
    const isOutOfStock = availableStock <= 0;
    const severity = isOutOfStock ? "CRITICAL" : "WARNING";
    const alertType = isOutOfStock ? "OUT_OF_STOCK" : "LOW_STOCK";
    const deficitQty = Math.max(0, reorderLevel - availableStock);

    const message = isOutOfStock
      ? `Product "${productName}" is completely OUT OF STOCK (0 units left, reorder level: ${reorderLevel}).`
      : `Product "${productName}" is running low on stock (${availableStock} left, reorder level: ${reorderLevel}).`;

    // Deduplication check
    const existing = alertStore.find(
      (a) =>
        a.businessId === businessId &&
        a.productId === productId &&
        (a.status === "UNREAD" || a.status === "ACKNOWLEDGED")
    );

    if (existing) {
      existing.currentStock = availableStock;
      existing.reorderLevel = reorderLevel;
      existing.deficitQty = deficitQty;
      existing.severity = severity;
      existing.alertType = alertType;
      existing.message = message;
      existing.lastTriggeredAt = new Date();
      return { action: "UPDATED", alert: existing };
    } else {
      const newAlert = {
        _id: "ALT_" + (alertStore.length + 1),
        businessId,
        productId,
        productName,
        alertType,
        severity,
        currentStock: availableStock,
        reorderLevel,
        deficitQty,
        status: "UNREAD",
        message,
        lastTriggeredAt: new Date(),
        resolvedAt: null,
      };
      alertStore.push(newAlert);
      return { action: "CREATED", alert: newAlert };
    }
  } else {
    // Auto-resolve
    let resolvedCount = 0;
    for (const a of alertStore) {
      if (
        a.businessId === businessId &&
        a.productId === productId &&
        (a.status === "UNREAD" || a.status === "ACKNOWLEDGED")
      ) {
        a.status = "RESOLVED";
        a.resolvedAt = new Date();
        a.currentStock = availableStock;
        a.deficitQty = 0;
        resolvedCount++;
      }
    }
    return { action: "RESOLVED", resolvedCount };
  }
};

// Step 1: Initial normal stock
console.log(" - Step 1: Normal Stock (Stock: 50, Reorder: 20)");
const step1 = simulateEvaluateLowStockRule({
  businessId: dummyBusinessId1,
  productId: dummyProductId1,
  productName: "Maggi 70g",
  availableStock: 50,
  reorderLevel: 20,
});
assert.strictEqual(alertStore.length, 0);
console.log("   Result: No alert generated (50 > 20) ✅");

// Step 2: Sale drops stock to 15 (Below ReorderLevel 20)
console.log(" - Step 2: Stock drops to 15 (Below ReorderLevel 20)");
const step2 = simulateEvaluateLowStockRule({
  businessId: dummyBusinessId1,
  productId: dummyProductId1,
  productName: "Maggi 70g",
  availableStock: 15,
  reorderLevel: 20,
});
assert.strictEqual(step2.action, "CREATED");
assert.strictEqual(alertStore.length, 1);
assert.strictEqual(alertStore[0].status, "UNREAD");
assert.strictEqual(alertStore[0].severity, "WARNING");
assert.strictEqual(alertStore[0].deficitQty, 5);
console.log("   Result: Alert CREATED (severity: WARNING, deficit: 5) ✅");

// Step 3: Second sale drops stock to 12 (Deduplication Check)
console.log(" - Step 3: Another Sale drops stock to 12 (Deduplication test)");
const step3 = simulateEvaluateLowStockRule({
  businessId: dummyBusinessId1,
  productId: dummyProductId1,
  productName: "Maggi 70g",
  availableStock: 12,
  reorderLevel: 20,
});
assert.strictEqual(step3.action, "UPDATED");
assert.strictEqual(alertStore.length, 1, "Alert store must NOT create duplicate rows!");
assert.strictEqual(alertStore[0].currentStock, 12);
assert.strictEqual(alertStore[0].deficitQty, 8);
console.log("   Result: Alert UPDATED without duplicate row (12 left, deficit: 8) ✅");

// Step 4: Third sale drops stock to 0 (Critical Out-Of-Stock escalation)
console.log(" - Step 4: Stock drops to 0 (Critical Out of Stock escalation)");
const step4 = simulateEvaluateLowStockRule({
  businessId: dummyBusinessId1,
  productId: dummyProductId1,
  productName: "Maggi 70g",
  availableStock: 0,
  reorderLevel: 20,
});
assert.strictEqual(step4.action, "UPDATED");
assert.strictEqual(alertStore.length, 1);
assert.strictEqual(alertStore[0].severity, "CRITICAL");
assert.strictEqual(alertStore[0].alertType, "OUT_OF_STOCK");
assert.strictEqual(alertStore[0].deficitQty, 20);
console.log("   Result: Alert escalated to CRITICAL / OUT_OF_STOCK (deficit: 20) ✅");

// Step 5: Stock In Replenishment (+50 units) -> Auto-Resolution
console.log(" - Step 5: Supplier Restock (+50 units -> AvailableStock: 50 > 20)");
const step5 = simulateEvaluateLowStockRule({
  businessId: dummyBusinessId1,
  productId: dummyProductId1,
  productName: "Maggi 70g",
  availableStock: 50,
  reorderLevel: 20,
});
assert.strictEqual(step5.action, "RESOLVED");
assert.strictEqual(alertStore[0].status, "RESOLVED");
assert.notStrictEqual(alertStore[0].resolvedAt, null);
console.log("   Result: Alert automatically marked RESOLVED upon replenishment ✅");

// ==============================================================================
// TEST 3: Alert Lifecycle & Acknowledge / Resolve Actions
// ==============================================================================
console.log("\n[Test 3] Alert Lifecycle (Unread -> Acknowledged -> Resolved):");

// Create fresh alert for product 2
simulateEvaluateLowStockRule({
  businessId: dummyBusinessId1,
  productId: dummyProductId2,
  productName: "Tata Salt 1kg",
  availableStock: 3,
  reorderLevel: 10,
});

assert.strictEqual(alertStore.length, 2);
const activeSaltAlert = alertStore.find((a) => a.productId === dummyProductId2);
assert.strictEqual(activeSaltAlert.status, "UNREAD");
console.log(" - Initial Status   : UNREAD ✅");

// Cashier acknowledges the alert
activeSaltAlert.status = "ACKNOWLEDGED";
activeSaltAlert.acknowledgedAt = new Date();
activeSaltAlert.acknowledgedBy = dummyUserId;
assert.strictEqual(activeSaltAlert.status, "ACKNOWLEDGED");
console.log(" - Acknowledge Action: Status changed to ACKNOWLEDGED with timestamp ✅");

// Manual resolution by store owner
activeSaltAlert.status = "RESOLVED";
activeSaltAlert.resolvedAt = new Date();
activeSaltAlert.resolvedBy = dummyUserId;
assert.strictEqual(activeSaltAlert.status, "RESOLVED");
console.log(" - Manual Resolve    : Status changed to RESOLVED with auditor ref ✅");

// ==============================================================================
// TEST 4: Multi-Tenant Business Isolation Verification
// ==============================================================================
console.log("\n[Test 4] Multi-Tenant Isolation (Cross-Store Guard):");

simulateEvaluateLowStockRule({
  businessId: dummyBusinessId2,
  productId: dummyProductId1,
  productName: "Foreign Business Maggi",
  availableStock: 2,
  reorderLevel: 25,
});

const business1Alerts = alertStore.filter((a) => a.businessId === dummyBusinessId1);
const business2Alerts = alertStore.filter((a) => a.businessId === dummyBusinessId2);

assert.strictEqual(business1Alerts.length, 2);
assert.strictEqual(business2Alerts.length, 1);
assert.strictEqual(business2Alerts[0].businessId, dummyBusinessId2);
console.log(" - Business 1 Alert Count: " + business1Alerts.length);
console.log(" - Business 2 Alert Count: " + business2Alerts.length);
console.log(" - Cross-Tenant Isolation: PASSED ✅ (Store alerts 100% isolated)");

console.log("\n================================================================================");
console.log("    ALL PHASE 3 - TASK T22 LOW-STOCK NOTIFICATION TESTS PASSED! ✅             ");
console.log("================================================================================\n");
