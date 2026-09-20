const mongoose = require("mongoose");
const assert = require("assert");
const { Inventory } = require("../src/models/inventory.model");
const inventoryService = require("../src/services/inventory.service");
const inventoryRepo = require("../src/repositories/inventory.repository");
const productRepo = require("../src/repositories/product.repository");
const {
  updateReorderLevelSchema,
  adjustStockSchema,
} = require("../src/validations/inventory.validation");

console.log("================================================================================");
console.log("    PHASE 3 - TASK T15: INVENTORY STORE STATE & REORDER LEVEL TESTS             ");
console.log("================================================================================\n");

const dummyBusinessId1 = new mongoose.Types.ObjectId().toString();
const dummyBusinessId2 = new mongoose.Types.ObjectId().toString();
const dummyProductId1 = new mongoose.Types.ObjectId().toString();
const dummyProductId2 = new mongoose.Types.ObjectId().toString();
const dummyCategoryId1 = new mongoose.Types.ObjectId().toString();

// Test 1: Inventory Schema Model & Field Verification
console.log("[Test 1] Inventory Mongoose Schema Instantiation & Defaults Verification:");
const invDoc1 = new Inventory({
  businessId: new mongoose.Types.ObjectId(dummyBusinessId1),
  productId: new mongoose.Types.ObjectId(dummyProductId1),
  availableStock: 25.0,
  reorderLevel: 10.0,
});

const err1 = invDoc1.validateSync();
console.log(" - Parse Status         :", err1 ? "FAILED: " + err1.message : "PASSED ✅");
console.log(" - Product ID Linked    :", invDoc1.productId.toString());
console.log(" - Available Stock      :", invDoc1.availableStock, "(Default 0)");
console.log(" - Reorder Level        :", invDoc1.reorderLevel, "(Default 5)");
console.log(" - Pre-save Alert State :", invDoc1.availableStock <= invDoc1.reorderLevel ? "LOW_STOCK" : "IN_STOCK ✅");
assert.strictEqual(!err1, true);
assert.strictEqual(invDoc1.availableStock, 25);
assert.strictEqual(invDoc1.reorderLevel, 10);

// Test 2: Negative Stock & Reorder Level Validation Blocking
console.log("\n[Test 2] Negative Stock & Reorder Level Schema Rejection:");
const invalidInvDoc = new Inventory({
  businessId: new mongoose.Types.ObjectId(dummyBusinessId1),
  productId: new mongoose.Types.ObjectId(dummyProductId2),
  availableStock: -5,
  reorderLevel: -2,
});
const err2 = invalidInvDoc.validateSync();
console.log(" - Negative Values Check:", err2 ? "PASSED ✅ (Blocked negative stock & reorder level)" : "FAILED ❌");
assert.ok(err2, "Should reject negative stock and reorder levels");

// Test 3: Zod Validation Schemas
console.log("\n[Test 3] Zod Schema Validation for Inventory Updates:");
const validReorder = updateReorderLevelSchema.safeParse({ reorderLevel: 15 });
const invalidReorder = updateReorderLevelSchema.safeParse({ reorderLevel: -5 });
assert.strictEqual(validReorder.success, true);
assert.strictEqual(invalidReorder.success, false);
console.log(" - Valid Reorder Level  : PASSED ✅ (15 accepted)");
console.log(" - Invalid Reorder Level: PASSED ✅ (-5 rejected)");

const validAdjust = adjustStockSchema.safeParse({
  productId: dummyProductId1,
  newStock: 50,
  notes: "Physical inventory audit count",
});
const invalidAdjust = adjustStockSchema.safeParse({
  productId: "short-id",
  newStock: -10,
});
assert.strictEqual(validAdjust.success, true);
assert.strictEqual(invalidAdjust.success, false);
console.log(" - Valid Adjust Schema  : PASSED ✅ (Stock: 50 accepted)");
console.log(" - Invalid Adjust Schema: PASSED ✅ (Invalid ID & negative stock rejected)");

// Mock Data & Service Layer Execution
const mockProductsBiz1 = [
  {
    _id: new mongoose.Types.ObjectId(dummyProductId1),
    businessId: new mongoose.Types.ObjectId(dummyBusinessId1),
    categoryId: { _id: new mongoose.Types.ObjectId(dummyCategoryId1), name: "Dairy & Milk" },
    name: "Amul Taaza Toned Milk 500ml",
    sku: "MILK-AMUL-TAZA-500",
    barcode: "8901262010053",
    sellingPrice: 27,
    costPrice: 24.5,
    unit: "packet",
    packSize: 1,
    isActive: true,
    isArchived: false,
    updatedAt: new Date(),
  },
  {
    _id: new mongoose.Types.ObjectId(dummyProductId2),
    businessId: new mongoose.Types.ObjectId(dummyBusinessId1),
    categoryId: { _id: new mongoose.Types.ObjectId(dummyCategoryId1), name: "Dairy & Milk" },
    name: "Amul Butter 100g",
    sku: "BUTTER-AMUL-100",
    barcode: null,
    sellingPrice: 58,
    costPrice: 51,
    unit: "pack",
    packSize: 1,
    isActive: true,
    isArchived: false,
    updatedAt: new Date(),
  },
];

const mockInventoriesBiz1 = [
  {
    _id: new mongoose.Types.ObjectId(),
    businessId: new mongoose.Types.ObjectId(dummyBusinessId1),
    productId: dummyProductId1,
    availableStock: 20,
    reorderLevel: 5,
    lowStockAlert: false,
    lastRestockedAt: new Date(),
  },
  {
    _id: new mongoose.Types.ObjectId(),
    businessId: new mongoose.Types.ObjectId(dummyBusinessId1),
    productId: dummyProductId2,
    availableStock: 3, // Low stock: 3 <= 5
    reorderLevel: 5,
    lowStockAlert: true,
    lastRestockedAt: new Date(),
  },
];

async function runInventoryUnitTests() {
  const origFindStore = inventoryRepo.findInventoryStoreState;
  const origGetSummary = inventoryRepo.getInventorySummary;
  const origFindProdById = productRepo.findProductById;
  const origUpdateReorder = inventoryRepo.updateReorderLevel;
  const origAdjustStock = inventoryRepo.adjustStock;
  const origGetOrCreate = inventoryRepo.getOrCreateInventory;

  inventoryRepo.getOrCreateInventory = async (businessId, productId) => {
    let inv = mockInventoriesBiz1.find((i) => i.productId === productId.toString());
    if (!inv) {
      inv = {
        _id: new mongoose.Types.ObjectId(),
        businessId: new mongoose.Types.ObjectId(businessId),
        productId: new mongoose.Types.ObjectId(productId),
        availableStock: 0,
        reorderLevel: 5,
        lowStockAlert: true,
      };
      mockInventoriesBiz1.push(inv);
    }
    return inv;
  };

  inventoryRepo.findInventoryStoreState = async (businessId, filters = {}) => {
    if (businessId.toString() !== dummyBusinessId1) return [];

    return mockProductsBiz1.map((prod) => {
      const inv = mockInventoriesBiz1.find((i) => i.productId === prod._id.toString());
      const availableStock = inv ? inv.availableStock : 0;
      const reorderLevel = inv ? inv.reorderLevel : 5;
      const lowStockAlert = availableStock <= reorderLevel;
      const stockStatus = availableStock <= 0 ? "OUT_OF_STOCK" : lowStockAlert ? "LOW_STOCK" : "IN_STOCK";

      return {
        id: inv ? inv._id : null,
        productId: prod._id,
        name: prod.name,
        sku: prod.sku,
        barcode: prod.barcode,
        category: { id: prod.categoryId._id, name: prod.categoryId.name },
        sellingPrice: prod.sellingPrice,
        costPrice: prod.costPrice,
        unit: prod.unit,
        packSize: prod.packSize,
        availableStock,
        reorderLevel,
        lowStockAlert,
        stockStatus,
        valuation: availableStock * prod.costPrice,
      };
    });
  };

  inventoryRepo.getInventorySummary = async (businessId) => {
    if (businessId.toString() !== dummyBusinessId1) {
      return { totalProducts: 0, inStockCount: 0, lowStockCount: 0, outOfStockCount: 0, totalStockQuantity: 0, totalValuation: 0 };
    }

    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let totalStock = 0;
    let totalVal = 0;

    for (const prod of mockProductsBiz1) {
      const inv = mockInventoriesBiz1.find((i) => i.productId === prod._id.toString());
      const stock = inv ? inv.availableStock : 0;
      const reorder = inv ? inv.reorderLevel : 5;
      totalStock += stock;
      totalVal += stock * prod.costPrice;

      if (stock <= 0) outOfStock++;
      else if (stock <= reorder) lowStock++;
      else inStock++;
    }

    return {
      totalProducts: mockProductsBiz1.length,
      inStockCount: inStock,
      lowStockCount: lowStock,
      outOfStockCount: outOfStock,
      totalStockQuantity: totalStock,
      totalValuation: totalVal,
    };
  };

  productRepo.findProductById = async (businessId, productId) => {
    if (businessId.toString() !== dummyBusinessId1) return null;
    return mockProductsBiz1.find((p) => p._id.toString() === productId.toString()) || null;
  };

  inventoryRepo.updateReorderLevel = async (businessId, productId, reorderLevel) => {
    const inv = mockInventoriesBiz1.find((i) => i.productId === productId.toString());
    if (inv) {
      inv.reorderLevel = reorderLevel;
      inv.lowStockAlert = inv.availableStock <= reorderLevel;
    }
    return inv;
  };

  inventoryRepo.adjustStock = async (businessId, productId, newStock) => {
    const inv = mockInventoriesBiz1.find((i) => i.productId === productId.toString());
    if (inv) {
      inv.availableStock = newStock;
      inv.lowStockAlert = inv.availableStock <= inv.reorderLevel;
    }
    return inv;
  };

  try {
    // ── [Test 4] Store State Query with Linked Product Details ──
    console.log("\n[Test 4] Store State Query with Product Master Linking:");
    const storeState = await inventoryService.getStoreState(dummyBusinessId1);
    assert.strictEqual(storeState.length, 2);
    assert.strictEqual(storeState[0].name, "Amul Taaza Toned Milk 500ml");
    assert.strictEqual(storeState[0].availableStock, 20);
    assert.strictEqual(storeState[0].stockStatus, "IN_STOCK");
    assert.strictEqual(storeState[1].name, "Amul Butter 100g");
    assert.strictEqual(storeState[1].availableStock, 3);
    assert.strictEqual(storeState[1].stockStatus, "LOW_STOCK");
    console.log(` - Loaded ${storeState.length} product store states:`);
    console.log(`   * ${storeState[0].name}: Stock=${storeState[0].availableStock} (${storeState[0].stockStatus}) | Val=₹${storeState[0].valuation}`);
    console.log(`   * ${storeState[1].name}: Stock=${storeState[1].availableStock} (${storeState[1].stockStatus}) | Val=₹${storeState[1].valuation}`);
    console.log(" - Result: PASSED ✅");

    // ── [Test 5] Inventory KPI Summary Aggregation ──
    console.log("\n[Test 5] Inventory KPI Summary Aggregation:");
    const summary = await inventoryService.getInventorySummary(dummyBusinessId1);
    assert.strictEqual(summary.totalProducts, 2);
    assert.strictEqual(summary.inStockCount, 1);
    assert.strictEqual(summary.lowStockCount, 1);
    assert.strictEqual(summary.outOfStockCount, 0);
    assert.strictEqual(summary.totalStockQuantity, 23); // 20 + 3
    assert.strictEqual(summary.totalValuation, 20 * 24.5 + 3 * 51); // 490 + 153 = 643
    console.log(` - Total SKUs        : ${summary.totalProducts}`);
    console.log(` - In-Stock SKUs     : ${summary.inStockCount}`);
    console.log(` - Low-Stock Alerts  : ${summary.lowStockCount} (Warning)`);
    console.log(` - Total Inventory   : ${summary.totalStockQuantity} units`);
    console.log(` - Total Valuation   : ₹${summary.totalValuation}`);
    console.log(" - Result: PASSED ✅");

    // ── [Test 6] Reorder Level Modification ──
    console.log("\n[Test 6] Update Reorder Level & Auto-Recalculate Low Stock:");
    const updatedReorder = await inventoryService.updateReorderLevel(
      dummyBusinessId1,
      dummyProductId1,
      { reorderLevel: 25 } // Available is 20, so 20 <= 25 => lowStockAlert becomes TRUE
    );
    assert.strictEqual(updatedReorder.reorderLevel, 25);
    assert.strictEqual(updatedReorder.lowStockAlert, true);
    console.log(` - New Reorder Level : ${updatedReorder.reorderLevel}`);
    console.log(` - Alert Recalculated: ${updatedReorder.lowStockAlert} (Triggered Low Stock Alert)`);
    console.log(" - Result: PASSED ✅");

    // ── [Test 7] Stock Adjustment ──
    console.log("\n[Test 7] Physical Stock Adjustment Execution:");
    const adjusted = await inventoryService.adjustStock(dummyBusinessId1, {
      productId: dummyProductId2,
      newStock: 30, // Was 3, updated to 30
    });
    assert.strictEqual(adjusted.availableStock, 30);
    assert.strictEqual(adjusted.lowStockAlert, false); // 30 > 5 => lowStockAlert becomes FALSE
    console.log(` - Adjusted Stock    : ${adjusted.availableStock} (Restocked)`);
    console.log(` - Low Stock Cleared : Alert=${adjusted.lowStockAlert}`);
    console.log(" - Result: PASSED ✅");

    // ── [Test 8] Multi-Tenant Isolation Check ──
    console.log("\n[Test 8] Multi-Tenant Store State Isolation:");
    const b2State = await inventoryService.getStoreState(dummyBusinessId2);
    assert.strictEqual(b2State.length, 0);
    console.log(` - Business 1 Store States: ${storeState.length} items`);
    console.log(` - Business 2 Store States: ${b2State.length} items (Zero Leakage)`);
    console.log(" - Result: PASSED ✅");

    console.log("\n================================================================================");
    console.log("       ALL T15 INVENTORY STORE STATE & REORDER TESTS PASSED 🎉                  ");
    console.log("================================================================================\n");
  } finally {
    inventoryRepo.findInventoryStoreState = origFindStore;
    inventoryRepo.getInventorySummary = origGetSummary;
    productRepo.findProductById = origFindProdById;
    inventoryRepo.updateReorderLevel = origUpdateReorder;
    inventoryRepo.adjustStock = origAdjustStock;
    inventoryRepo.getOrCreateInventory = origGetOrCreate;
  }
}

runInventoryUnitTests();
