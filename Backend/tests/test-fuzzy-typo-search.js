const assert = require("assert");
const { rankProducts, scoreProduct, stringSimilarity } = require("../src/utils/fuzzySearch");

console.log("================================================================================");
console.log("             TASK T14-EXT: INTELLIGENT FUZZY & TYPO SEARCH TESTS                ");
console.log("================================================================================");

const mockProducts = [
  {
    _id: "prod-1",
    name: "Tata Salt Vacuum Evaporated 1kg",
    sku: "SALT-TATA-1KG",
    barcode: "8901030382910",
    sellingPrice: 28,
  },
  {
    _id: "prod-2",
    name: "Aashirvaad Shudh Chakki Atta 5kg",
    sku: "AATA-AASHIR-5KG",
    barcode: "8901725181234",
    sellingPrice: 245,
  },
  {
    _id: "prod-3",
    name: "Maggi 2-Minute Masala Noodles 70g",
    sku: "NOODLE-MAGGI-70G",
    barcode: "8901058852345",
    sellingPrice: 14,
  },
  {
    _id: "prod-4",
    name: "Daawat Rozana Super Basmati Chawal 1kg",
    sku: "RICE-DAAWAT-1KG",
    barcode: "8901537001234",
    sellingPrice: 110,
  },
  {
    _id: "prod-5",
    name: "Colgate MaxFresh Spicy Fresh Toothpaste 150g",
    sku: "PASTE-COLGATE-150G",
    barcode: "8901314010123",
    sellingPrice: 95,
  },
];

// Test 1: Typo resilience for "chwal" -> Matches Basmati Chawal
console.log("\n[Test 1] Typo search: 'chwal'");
const r1 = rankProducts(mockProducts, "chwal");
assert.ok(r1.length > 0, "Should find Basmati Chawal");
assert.strictEqual(r1[0].name, "Daawat Rozana Super Basmati Chawal 1kg");
console.log(" - Matched:", r1[0].name, "| Score:", r1[0]._searchScore, "| Type:", r1[0]._matchType, "✅");

// Test 2: Typo resilience for "magi" -> Matches Maggi
console.log("\n[Test 2] Typo search: 'magi'");
const r2 = rankProducts(mockProducts, "magi");
assert.ok(r2.length > 0, "Should find Maggi");
assert.strictEqual(r2[0].name, "Maggi 2-Minute Masala Noodles 70g");
console.log(" - Matched:", r2[0].name, "| Score:", r2[0]._searchScore, "| Type:", r2[0]._matchType, "✅");

// Test 3: Typo resilience for "colgat" -> Matches Colgate
console.log("\n[Test 3] Typo search: 'colgat'");
const r3 = rankProducts(mockProducts, "colgat");
assert.ok(r3.length > 0, "Should find Colgate");
assert.strictEqual(r3[0].name, "Colgate MaxFresh Spicy Fresh Toothpaste 150g");
console.log(" - Matched:", r3[0].name, "| Score:", r3[0]._searchScore, "| Type:", r3[0]._matchType, "✅");

// Test 4: Multi-token inverted order: "salt tata" -> Matches "Tata Salt"
console.log("\n[Test 4] Multi-token inverted: 'salt tata'");
const r4 = rankProducts(mockProducts, "salt tata");
assert.ok(r4.length > 0, "Should find Tata Salt");
assert.strictEqual(r4[0].name, "Tata Salt Vacuum Evaporated 1kg");
console.log(" - Matched:", r4[0].name, "| Score:", r4[0]._searchScore, "| Type:", r4[0]._matchType, "✅");

// Test 5: Exact Barcode matching (Score 100)
console.log("\n[Test 5] Exact Barcode: '8901030382910'");
const r5 = rankProducts(mockProducts, "8901030382910");
assert.strictEqual(r5[0]._searchScore, 100);
assert.strictEqual(r5[0]._matchType, "EXACT_BARCODE");
console.log(" - Matched:", r5[0].name, "| Score:", r5[0]._searchScore, "| Type:", r5[0]._matchType, "✅");

console.log("\n================================================================================");
console.log("       ALL FUZZY TYPO & INTELLIGENT SEARCH TESTS PASSED 🎉                      ");
console.log("================================================================================");
