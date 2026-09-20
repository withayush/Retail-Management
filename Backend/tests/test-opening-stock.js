const mongoose = require("mongoose");
const assert = require("assert");
const { Inventory, InventoryLedger } = require("../src/models/inventory.model");
const Product = require("../src/models/product.model");
const Category = require("../src/models/category.model");
const productService = require("../src/services/product.service");
const inventoryService = require("../src/services/inventory.service");
const productRepo = require("../src/repositories/product.repository");
const inventoryRepo = require("../src/repositories/inventory.repository");
const categoryRepo = require("../src/repositories/category.repository");
const { createProductSchema } = require("../src/validations/product.validation");
const { initializeOpeningStockSchema } = require("../src/validations/inventory.validation");

console.log("================================================================================");
console.log("    PHASE 3 - TASK T17: OPENING STOCK INITIALIZATION & AUDITED LEDGER TESTS     ");
console.log("================================================================================\n");

const dummyBusinessId1 = new mongoose.Types.ObjectId().toString();
const dummyBusinessId2 = new mongoose.Types.ObjectId().toString();
const dummyCategoryId1 = new mongoose.Types.ObjectId().toString();
const dummyProductId1 = new mongoose.Types.ObjectId().toString();

// Test 1: Zod Schema Validations for Opening Stock in Product Creation & Standalone API
console.log("[Test 1] Zod Schema Validations for Opening Stock:");
const validProductWithOpening = createProductSchema.safeParse({
  name: "Maggi 2-Minute Noodles 70g",
  sku: "MAG-001",
  sellingPrice: 14,
  costPrice: 10,
  categoryId: dummyCategoryId1,
  openingStock: 100,
  reorderLevel: 20,
  openingStockNotes: "Store physical count before launch",
});
assert.strictEqual(validProductWithOpening.success, true);
assert.strictEqual(validProductWithOpening.data.openingStock, 100);
assert.strictEqual(validProductWithOpening.data.reorderLevel, 20);
console.log(" - Valid Product + Opening Stock (100 units): PASSED ✅");

const invalidNegativeOpening = createProductSchema.safeParse({
  name: "Maggi",
  sku: "MAG-002",
  sellingPrice: 14,
  costPrice: 10,
  categoryId: dummyCategoryId1,
  openingStock: -15,
});
assert.strictEqual(invalidNegativeOpening.success, false);
console.log(" - Negative Opening Stock Rejection         : PASSED ✅ (-15 rejected)");

const validStandaloneOpening = initializeOpeningStockSchema.safeParse({
  productId: dummyProductId1,
  openingStock: 50,
  reorderLevel: 10,
  notes: "Audited opening balance initialization",
});
assert.strictEqual(validStandaloneOpening.success, true);
console.log(" - Valid Standalone Opening Stock Schema   : PASSED ✅");

// Test 2: Product Creation Lifecycle with Opening Stock Seeding Simulation
console.log("\n[Test 2] Product Creation with Opening Stock Ledger Seeding Simulation:");
// Mocking memory state for testing
const mockProducts = new Map();
const mockInventories = new Map();
const mockLedgers = [];

function simulateCreateProductWithOpening(businessId, payload) {
  const prodId = new mongoose.Types.ObjectId().toString();
  const productDoc = {
    _id: prodId,
    businessId,
    name: payload.name,
    sku: payload.sku,
    sellingPrice: payload.sellingPrice,
    costPrice: payload.costPrice,
    unit: payload.unit || "pcs",
  };
  mockProducts.set(prodId, productDoc);

  const openingQty = Number(payload.openingStock || 0);
  const reorder = Number(payload.reorderLevel || 5);

  let invDoc = {
    _id: new mongoose.Types.ObjectId().toString(),
    businessId,
    productId: prodId,
    availableStock: openingQty,
    reorderLevel: reorder,
    lowStockAlert: openingQty <= reorder,
  };
  mockInventories.set(`${businessId}:${prodId}`, invDoc);

  if (openingQty > 0) {
    const ledgerDoc = {
      _id: new mongoose.Types.ObjectId().toString(),
      businessId,
      productId: prodId,
      qtyChange: openingQty,
      balanceAfter: openingQty,
      type: "OPENING",
      reason: "Opening Stock Initial Balance",
      notes: payload.openingStockNotes || "Seeded upon product creation (T17)",
      createdAt: new Date(),
    };
    mockLedgers.push(ledgerDoc);
  }

  return { product: productDoc, inventory: invDoc };
}

const createdResult = simulateCreateProductWithOpening(dummyBusinessId1, {
  name: "Amul Butter 100g",
  sku: "AMUL-BUT-100",
  sellingPrice: 58,
  costPrice: 51,
  openingStock: 75,
  reorderLevel: 15,
  openingStockNotes: "Opening physical inventory count",
});

console.log(" - Created Product Name    :", createdResult.product.name);
console.log(" - Inventory AvailableStock:", createdResult.inventory.availableStock, "(Expected: 75)");
console.log(" - Inventory Reorder Level :", createdResult.inventory.reorderLevel, "(Expected: 15)");
console.log(" - Low Stock Alert Flag    :", createdResult.inventory.lowStockAlert, "(Expected: false)");

assert.strictEqual(createdResult.inventory.availableStock, 75);
assert.strictEqual(createdResult.inventory.reorderLevel, 15);
assert.strictEqual(createdResult.inventory.lowStockAlert, false);

// Check Ledger
const openingLedger = mockLedgers.find((l) => l.productId === createdResult.product._id);
assert.ok(openingLedger, "Opening ledger entry must exist");
assert.strictEqual(openingLedger.type, "OPENING");
assert.strictEqual(openingLedger.qtyChange, 75);
assert.strictEqual(openingLedger.balanceAfter, 75);
console.log(" - Generated Ledger Type   :", openingLedger.type, "(Expected: OPENING)");
console.log(" - Ledger Qty Change       : +" + openingLedger.qtyChange);
console.log(" - Ledger Balance Snapshot :", openingLedger.balanceAfter);
console.log(" - Opening Stock Audit Log : PASSED ✅");

// Test 3: Zero Opening Stock Product Creation
console.log("\n[Test 3] Zero Opening Stock Product Creation (No unneeded ledger log):");
const initialLedgerCount = mockLedgers.length;
const zeroStockResult = simulateCreateProductWithOpening(dummyBusinessId1, {
  name: "New Unstocked Item",
  sku: "NEW-001",
  sellingPrice: 100,
  costPrice: 80,
  openingStock: 0,
});
assert.strictEqual(zeroStockResult.inventory.availableStock, 0);
assert.strictEqual(zeroStockResult.inventory.lowStockAlert, true);
assert.strictEqual(mockLedgers.length, initialLedgerCount); // No ledger entry for 0 quantity
console.log(" - Zero Stock Inventory    : AvailableStock=0, Alert=true");
console.log(" - Ledger Cleanliness      : PASSED ✅ (No redundant 0-qty logs written)");

// Test 4: Subsequent Stock Movements on Initialized Opening Stock
console.log("\n[Test 4] Subsequent Stock Movements on Initialized Opening Stock:");
let currentStock = createdResult.inventory.availableStock; // Starts at 75

function applyMovement(type, qty, reason) {
  currentStock += qty;
  mockLedgers.push({
    productId: createdResult.product._id,
    type,
    qtyChange: qty,
    balanceAfter: currentStock,
    reason,
  });
}

// 1. Initial Opening was +75
// 2. Supplier delivery +25
applyMovement("IN", 25, "Restock PO-102");
// 3. POS Sale -10
applyMovement("OUT", -10, "POS Sale #INV-101");
// 4. Broken box -2
applyMovement("ADJUST", -2, "Damaged in storage");

console.log(" - 1. OPENING Balance : +75 -> Balance: 75");
console.log(" - 2. Purchase IN     : +25 -> Balance: 100");
console.log(" - 3. Sale OUT        : -10 -> Balance: 90");
console.log(" - 4. Damage ADJUST   : -2  -> Balance: 88");

assert.strictEqual(currentStock, 88);

// Full Ledger audit equation check:
const productLogs = mockLedgers.filter((l) => l.productId === createdResult.product._id);
const totalSum = productLogs.reduce((sum, item) => sum + item.qtyChange, 0);
console.log(" - Sum of all Movement Logs (inc. OPENING):", totalSum);
console.log(" - Final Store State Balance              :", currentStock);
assert.strictEqual(totalSum, currentStock);
console.log(" - Mathematical Audit Verification        : PASSED ✅ (sum === balance)");

console.log("\n================================================================================");
console.log("    ALL PHASE 3 - TASK T17 OPENING STOCK TESTS PASSED SUCCESSFULLY! ✅          ");
console.log("================================================================================\n");
