const assert = require("assert");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const dashboardService = require("../src/services/dashboard.service");
const Product = require("../src/models/product.model");
const { Inventory } = require("../src/models/inventory.model");

/**
 * PHASE 10 - TASK T63: INVENTORY WARNING CENTER TEST SUITE
 * Validates out-of-stock and low-stock detection, priority sorting (OUT first),
 * business isolation, zero reorder level edge cases, archived product exclusions,
 * orphan record resilience, summary counts, and pagination/filtering.
 */

console.log("===============================================================================");
console.log("  PHASE 10 - TASK T63: INVENTORY WARNING CENTER TEST SUITE                     ");
console.log("===============================================================================");

async function runTests() {
  const mongoUri =
    process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/vendoros";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB successfully.\n");

  const businessAId = new mongoose.Types.ObjectId();
  const businessBId = new mongoose.Types.ObjectId();
  const dummyCatId = new mongoose.Types.ObjectId();

  try {
    // -------------------------------------------------------------------------
    // Setup Test Products & Inventory for Business A (Kirana Store Example)
    // -------------------------------------------------------------------------
    console.log("--> Group 1: Setting up Business A Catalog & Inventory State");

    // Product 1: Coca-Cola (Stock: 0, Reorder: 15) -> OUT_OF_STOCK
    const prodCoke = await Product.create({
      businessId: businessAId,
      categoryId: dummyCatId,
      name: "Coca-Cola 500ml",
      sku: `COKE-${Date.now()}`,
      costPrice: 25,
      sellingPrice: 40,
      unit: "bottles",
      isArchived: false,
    });
    await Inventory.create({
      businessId: businessAId,
      productId: prodCoke._id,
      availableStock: 0,
      reorderLevel: 15,
      lowStockAlert: true,
    });

    // Product 2: Maggi Noodles (Stock: 5, Reorder: 20) -> LOW_STOCK
    const prodMaggi = await Product.create({
      businessId: businessAId,
      categoryId: dummyCatId,
      name: "Maggi 2-Minute Noodles",
      sku: `MAGGI-${Date.now()}`,
      costPrice: 10,
      sellingPrice: 14,
      unit: "packs",
      isArchived: false,
    });
    await Inventory.create({
      businessId: businessAId,
      productId: prodMaggi._id,
      availableStock: 5,
      reorderLevel: 20,
      lowStockAlert: true,
    });

    // Product 3: Rice 5kg (Stock: 8, Reorder: 10) -> LOW_STOCK
    const prodRice = await Product.create({
      businessId: businessAId,
      categoryId: dummyCatId,
      name: "Basmati Rice 5kg",
      sku: `RICE-${Date.now()}`,
      costPrice: 280,
      sellingPrice: 350,
      unit: "bags",
      isArchived: false,
    });
    await Inventory.create({
      businessId: businessAId,
      productId: prodRice._id,
      availableStock: 8,
      reorderLevel: 10,
      lowStockAlert: true,
    });

    // Product 4: Sugar 1kg (Stock: 50, Reorder: 10) -> HEALTHY (not in warning)
    const prodSugar = await Product.create({
      businessId: businessAId,
      categoryId: dummyCatId,
      name: "Premium Sugar 1kg",
      sku: `SUGAR-${Date.now()}`,
      costPrice: 38,
      sellingPrice: 45,
      unit: "kg",
      isArchived: false,
    });
    await Inventory.create({
      businessId: businessAId,
      productId: prodSugar._id,
      availableStock: 50,
      reorderLevel: 10,
      lowStockAlert: false,
    });

    // Product 5: Oil 1L (Stock: 3, Reorder: 5) -> LOW_STOCK
    const prodOil = await Product.create({
      businessId: businessAId,
      categoryId: dummyCatId,
      name: "Sunflower Oil 1L",
      sku: `OIL-${Date.now()}`,
      costPrice: 110,
      sellingPrice: 135,
      unit: "pouches",
      isArchived: false,
    });
    await Inventory.create({
      businessId: businessAId,
      productId: prodOil._id,
      availableStock: 3,
      reorderLevel: 5,
      lowStockAlert: true,
    });

    console.log("  [PASS] Business A products and inventory successfully initialized.\n");

    // -------------------------------------------------------------------------
    // Setup Edge Cases for Business A
    // -------------------------------------------------------------------------
    console.log("--> Group 2: Setting up Edge Cases (Reorder = 0, Archived, Orphan)");

    // Edge Case 1: Reorder = 0, Available = 0 -> MUST trigger OUT_OF_STOCK
    const prodZeroReorderOut = await Product.create({
      businessId: businessAId,
      categoryId: dummyCatId,
      name: "Seasonal Gift Box",
      sku: `GIFT-${Date.now()}`,
      costPrice: 200,
      sellingPrice: 350,
      isArchived: false,
    });
    await Inventory.create({
      businessId: businessAId,
      productId: prodZeroReorderOut._id,
      availableStock: 0,
      reorderLevel: 0,
      lowStockAlert: true,
    });

    // Edge Case 2: Reorder = 0, Available = 10 -> MUST be HEALTHY (not in warning)
    const prodZeroReorderHealthy = await Product.create({
      businessId: businessAId,
      categoryId: dummyCatId,
      name: "Specialty Salt",
      sku: `SALT-${Date.now()}`,
      costPrice: 15,
      sellingPrice: 25,
      isArchived: false,
    });
    await Inventory.create({
      businessId: businessAId,
      productId: prodZeroReorderHealthy._id,
      availableStock: 10,
      reorderLevel: 0,
      lowStockAlert: false,
    });

    // Edge Case 3: Archived Product (Stock: 0, Reorder: 10, isArchived: true) -> MUST BE EXCLUDED
    const prodArchived = await Product.create({
      businessId: businessAId,
      categoryId: dummyCatId,
      name: "Discontinued Shampoo",
      sku: `SHAMPOO-DISC-${Date.now()}`,
      costPrice: 60,
      sellingPrice: 100,
      isArchived: true,
    });
    await Inventory.create({
      businessId: businessAId,
      productId: prodArchived._id,
      availableStock: 0,
      reorderLevel: 10,
      lowStockAlert: true,
    });

    // Edge Case 4: Orphan Inventory record (Product deleted/non-existent) -> MUST BE SAFELY IGNORED
    await Inventory.create({
      businessId: businessAId,
      productId: new mongoose.Types.ObjectId(), // Non-existent product ID
      availableStock: 0,
      reorderLevel: 10,
      lowStockAlert: true,
    });

    console.log("  [PASS] Edge cases configured.\n");

    // -------------------------------------------------------------------------
    // Setup Business B (for Multi-Tenant Isolation Test)
    // -------------------------------------------------------------------------
    console.log("--> Group 3: Setting up Business B for Multi-Tenant Isolation");
    const prodBizB = await Product.create({
      businessId: businessBId,
      categoryId: dummyCatId,
      name: "Store B Out Of Stock Product",
      sku: `BIZB-${Date.now()}`,
      costPrice: 50,
      sellingPrice: 80,
      isArchived: false,
    });
    await Inventory.create({
      businessId: businessBId,
      productId: prodBizB._id,
      availableStock: 0,
      reorderLevel: 10,
      lowStockAlert: true,
    });
    console.log("  [PASS] Business B setup complete.\n");

    // =========================================================================
    // EXECUTE & ASSERT TESTS
    // =========================================================================

    // Test 1: Full Query for Business A
    console.log("--> Test 1: Business A Warnings Aggregation");
    const resultA = await dashboardService.getInventoryWarnings(businessAId, { limit: 20 });

    assert(resultA.summary, "Expected summary object in response");
    // Expected warnings for Business A:
    // OUT_OF_STOCK: Coca-Cola (0), Seasonal Gift Box (0) -> total 2
    // LOW_STOCK: Maggi (5/20), Rice 5kg (8/10), Oil 1L (3/5) -> total 3
    // Sugar (50/10) -> Healthy (excluded)
    // Specialty Salt (10/0) -> Healthy (excluded)
    // Discontinued Shampoo -> Archived (excluded)
    // Orphan record -> Excluded
    // Total warnings = 5 (2 OUT_OF_STOCK + 3 LOW_STOCK)
    console.log(`  Summary: outOfStock=${resultA.summary.outOfStock}, lowStock=${resultA.summary.lowStock}, total=${resultA.summary.totalWarnings}`);
    assert.strictEqual(resultA.summary.outOfStock, 2, "Expected 2 out-of-stock items");
    assert.strictEqual(resultA.summary.lowStock, 3, "Expected 3 low-stock items");
    assert.strictEqual(resultA.summary.totalWarnings, 5, "Expected 5 total warnings");
    assert.strictEqual(resultA.items.length, 5, "Expected 5 items returned");
    console.log("  [PASS] Summary counts and item totals match expected values.\n");

    // Test 2: Priority Sorting (OUT_OF_STOCK first, LOW_STOCK next)
    console.log("--> Test 2: Priority Sorting Verification (OUT first, LOW next)");
    const firstTwo = resultA.items.slice(0, 2);
    const lastThree = resultA.items.slice(2);

    assert(
      firstTwo.every((item) => item.status === "OUT_OF_STOCK" && item.availableStock === 0),
      "First items MUST be OUT_OF_STOCK with availableStock = 0"
    );
    assert(
      lastThree.every((item) => item.status === "LOW_STOCK" && item.availableStock > 0),
      "Subsequent items MUST be LOW_STOCK with availableStock > 0"
    );
    console.log("  [PASS] OUT_OF_STOCK items correctly precede LOW_STOCK items.\n");

    // Test 3: Multi-Tenant Isolation
    console.log("--> Test 3: Multi-Tenant Isolation Verification");
    const resultB = await dashboardService.getInventoryWarnings(businessBId);
    assert.strictEqual(resultB.summary.totalWarnings, 1, "Business B must only see 1 warning");
    assert.strictEqual(resultB.items[0].productName, "Store B Out Of Stock Product");

    // Ensure Business A did not include Business B's product
    const bizAProductNames = resultA.items.map((i) => i.productName);
    assert(!bizAProductNames.includes("Store B Out Of Stock Product"), "Business A must NEVER leak Business B's inventory");
    console.log("  [PASS] Multi-tenant isolation verified with zero data leakage.\n");

    // Test 4: Archived & Orphan Product Exclusion
    console.log("--> Test 4: Archived & Orphan Product Exclusion");
    assert(!bizAProductNames.includes("Discontinued Shampoo"), "Archived products MUST be excluded");
    assert.strictEqual(
      resultA.items.some((i) => !i.productName),
      false,
      "Orphan records without products MUST be excluded"
    );
    console.log("  [PASS] Archived and orphan products excluded properly.\n");

    // Test 5: Reorder Level = 0 Edge Case
    console.log("--> Test 5: Reorder Level = 0 Edge Case Verification");
    const giftBox = resultA.items.find((i) => i.productName === "Seasonal Gift Box");
    assert(giftBox, "Seasonal Gift Box with reorderLevel=0 and stock=0 MUST be present");
    assert.strictEqual(giftBox.status, "OUT_OF_STOCK");

    const salt = resultA.items.find((i) => i.productName === "Specialty Salt");
    assert(!salt, "Specialty Salt with reorderLevel=0 and stock=10 MUST be considered healthy and excluded");
    console.log("  [PASS] Reorder level 0 edge cases handled correctly.\n");

    // Test 6: Filter by Status (OUT_OF_STOCK only)
    console.log("--> Test 6: Status Filter Parameter (?status=OUT_OF_STOCK)");
    const filteredOut = await dashboardService.getInventoryWarnings(businessAId, {
      status: "OUT_OF_STOCK",
    });
    // Global summary remains accurate (2 out of stock, 3 low stock, 5 total)
    assert.strictEqual(filteredOut.summary.totalWarnings, 5, "Global summary preserved");
    // But items only contains the OUT_OF_STOCK items
    assert.strictEqual(filteredOut.items.length, 2, "Filtered items count must be 2");
    assert(filteredOut.items.every((i) => i.status === "OUT_OF_STOCK"));
    assert.strictEqual(filteredOut.pagination.total, 2, "Filtered pagination total is 2");
    console.log("  [PASS] Status filtering works correctly.\n");

    // Test 7: Empty State
    console.log("--> Test 7: Empty State (Zero Warnings)");
    const emptyBusinessId = new mongoose.Types.ObjectId();
    const emptyResult = await dashboardService.getInventoryWarnings(emptyBusinessId);
    assert.strictEqual(emptyResult.summary.totalWarnings, 0);
    assert.strictEqual(emptyResult.summary.outOfStock, 0);
    assert.strictEqual(emptyResult.summary.lowStock, 0);
    assert.strictEqual(emptyResult.items.length, 0);
    assert.strictEqual(emptyResult.pagination.total, 0);
    console.log("  [PASS] Empty state returns clean zeros and empty array.\n");

    console.log("===============================================================================");
    console.log("  ALL T63 INVENTORY WARNING CENTER TESTS PASSED SUCCESSFULLY!                 ");
    console.log("===============================================================================");
  } finally {
    // Clean up test collections for created businesses
    await Product.deleteMany({ businessId: { $in: [businessAId, businessBId] } });
    await Inventory.deleteMany({ businessId: { $in: [businessAId, businessBId] } });
    await mongoose.disconnect();
    console.log("Database disconnected and test cleanup finished.");
  }
}

runTests().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});

