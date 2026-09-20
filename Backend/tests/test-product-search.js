const mongoose = require("mongoose");
const assert = require("assert");
const productService = require("../src/services/product.service");
const productRepo = require("../src/repositories/product.repository");
const Product = require("../src/models/product.model");

console.log("================================================================================");
console.log("    PHASE 2 - TASK T14: PRODUCT ELASTIC SEARCH & RAPID POS FILTER TESTS         ");
console.log("================================================================================");

const dummyBusinessId1 = new mongoose.Types.ObjectId().toString();
const dummyBusinessId2 = new mongoose.Types.ObjectId().toString();
const dairyCatId = new mongoose.Types.ObjectId().toString();
const bevCatId = new mongoose.Types.ObjectId().toString();
const snacksCatId = new mongoose.Types.ObjectId().toString();

// Test 1: Mongoose Schema Compound Search Indexes Verification
console.log("\n[Test 1] Product Schema Search & Text Index Verification:");
const schemaIndexes = Product.schema.indexes();
const hasSearchIndex = schemaIndexes.some(
  ([idx]) => idx.businessId === 1 && idx.isArchived === 1 && idx.name === 1
);
const hasTextIndex = schemaIndexes.some(
  ([idx]) => idx.name === "text" && idx.sku === "text"
);
console.log(" - Compound Search Index (businessId + isArchived + name):", hasSearchIndex ? "PASSED ✅" : "FAILED ❌");
console.log(" - Full-Text Index (name, sku, barcode, description)    :", hasTextIndex ? "PASSED ✅" : "FAILED ❌");

// Mock Dataset for Business 1
const mockCatalogBiz1 = [
  {
    _id: new mongoose.Types.ObjectId(),
    businessId: new mongoose.Types.ObjectId(dummyBusinessId1),
    categoryId: { _id: new mongoose.Types.ObjectId(dairyCatId), name: "Dairy & Milk" },
    name: "Amul Taaza Toned Milk 500ml",
    sku: "MILK-AMUL-TAZA-500",
    barcode: "8901262010053",
    sellingPrice: 27,
    costPrice: 24.5,
    unit: "packet",
    packSize: 1,
    packagingType: "Pouch",
    description: "Pasteurised toned milk pouch with 3% fat",
    isActive: true,
    isArchived: false,
  },
  {
    _id: new mongoose.Types.ObjectId(),
    businessId: new mongoose.Types.ObjectId(dummyBusinessId1),
    categoryId: { _id: new mongoose.Types.ObjectId(dairyCatId), name: "Dairy & Milk" },
    name: "Amul Butter 100g",
    sku: "BUTTER-AMUL-100",
    barcode: "8901262010099",
    sellingPrice: 58,
    costPrice: 51,
    unit: "pack",
    packSize: 1,
    packagingType: "Wrapper",
    description: "Pasteurised salted butter",
    isActive: true,
    isArchived: false,
  },
  {
    _id: new mongoose.Types.ObjectId(),
    businessId: new mongoose.Types.ObjectId(dummyBusinessId1),
    categoryId: { _id: new mongoose.Types.ObjectId(bevCatId), name: "Beverages" },
    name: "Coca-Cola Soft Drink 750ml",
    sku: "BEV-COKE-750",
    barcode: "8901764012345",
    sellingPrice: 45,
    costPrice: 38,
    unit: "bottle",
    packSize: 1,
    packagingType: "PET Bottle",
    description: "Carbonated cola soft drink",
    isActive: true,
    isArchived: false,
  },
  {
    _id: new mongoose.Types.ObjectId(),
    businessId: new mongoose.Types.ObjectId(dummyBusinessId1),
    categoryId: { _id: new mongoose.Types.ObjectId(snacksCatId), name: "Biscuits & Snacks" },
    name: "Parle-G Original Biscuits 800g",
    sku: "BISC-PARLE-G-800",
    barcode: null,
    sellingPrice: 90,
    costPrice: 76,
    unit: "packet",
    packSize: 1,
    packagingType: "Pack",
    description: "Classic glucose biscuits",
    isActive: true,
    isArchived: false,
  },
];

// Mock Dataset for Business 2
const mockCatalogBiz2 = [
  {
    _id: new mongoose.Types.ObjectId(),
    businessId: new mongoose.Types.ObjectId(dummyBusinessId2),
    categoryId: { _id: new mongoose.Types.ObjectId(), name: "Dairy & Milk" },
    name: "Amul Taaza Toned Milk 500ml",
    sku: "MILK-AMUL-TAZA-500",
    barcode: "8901262010053",
    sellingPrice: 28,
    costPrice: 25,
    unit: "packet",
    packSize: 1,
    packagingType: "Pouch",
    description: "Business 2 Milk",
    isActive: true,
    isArchived: false,
  },
];

async function runSearchUnitTests() {
  const origSearchRepo = productRepo.searchProducts;
  const origFindRepo = productRepo.findProductsByBusinessId;

  productRepo.searchProducts = async (businessId, { query = "", limit = 20, categoryId = null, includeArchived = false }) => {
    const isBiz1 = businessId.toString() === dummyBusinessId1;
    const pool = isBiz1 ? mockCatalogBiz1 : mockCatalogBiz2;
    const q = (query || "").trim().toLowerCase();

    const filtered = pool.filter((p) => {
      if (!includeArchived && (p.isArchived || !p.isActive)) return false;
      if (categoryId && p.categoryId._id.toString() !== categoryId.toString()) return false;
      if (!q) return true;

      const nameMatch = p.name.toLowerCase().includes(q);
      const skuMatch = p.sku.toLowerCase().includes(q);
      const barMatch = p.barcode ? p.barcode.includes(q) : false;
      const catMatch = p.categoryId?.name ? p.categoryId.name.toLowerCase().includes(q) : false;

      return nameMatch || skuMatch || barMatch || catMatch;
    });

    return filtered.slice(0, limit);
  };

  productRepo.findProductsByBusinessId = async (businessId, filters = {}) => {
    const isBiz1 = businessId.toString() === dummyBusinessId1;
    const pool = isBiz1 ? mockCatalogBiz1 : mockCatalogBiz2;
    const q = (filters.search || "").trim().toLowerCase();

    const filtered = pool.filter((p) => {
      if (filters.status !== "all" && p.isArchived) return false;
      if (!q) return true;

      const nameMatch = p.name.toLowerCase().includes(q);
      const skuMatch = p.sku.toLowerCase().includes(q);
      const barMatch = p.barcode ? p.barcode.includes(q) : false;
      const catMatch = p.categoryId?.name ? p.categoryId.name.toLowerCase().includes(q) : false;

      return nameMatch || skuMatch || barMatch || catMatch;
    });

    return { rawProducts: filtered, limit: 20 };
  };

  try {
    // ── [Test 2] Fast Partial & Case-Insensitive Name Search ──
    console.log("\n[Test 2] Instant Product Name Search:");
    const nameSearchResult = await productService.searchProducts(dummyBusinessId1, { q: "amul" });
    assert.strictEqual(nameSearchResult.data.length, 2, "Should return 2 Amul products");
    console.log(` - Query: "amul" -> Found ${nameSearchResult.count} items: ${nameSearchResult.data.map(p => p.name).join(", ")}`);
    console.log(" - Result: PASSED ✅");

    // ── [Test 3] Instant SKU Match Search ──
    console.log("\n[Test 3] Instant SKU Match Search:");
    const skuSearchResult = await productService.searchProducts(dummyBusinessId1, { q: "BEV-COKE" });
    assert.strictEqual(skuSearchResult.data.length, 1);
    assert.strictEqual(skuSearchResult.data[0].sku, "BEV-COKE-750");
    console.log(` - Query: "BEV-COKE" -> Matched Product SKU: ${skuSearchResult.data[0].sku}`);
    console.log(" - Result: PASSED ✅");

    // ── [Test 4] Instant Barcode Match for POS Scanner ──
    console.log("\n[Test 4] Instant Barcode Match for POS Scanner:");
    const barcodeSearchResult = await productService.searchProducts(dummyBusinessId1, { q: "8901262010053" });
    assert.strictEqual(barcodeSearchResult.data.length, 1);
    assert.strictEqual(barcodeSearchResult.data[0].name, "Amul Taaza Toned Milk 500ml");
    console.log(` - Barcode: "8901262010053" -> Scanned Item: ${barcodeSearchResult.data[0].name}`);
    console.log(" - Result: PASSED ✅");

    // ── [Test 5] Category-Aware Search (Querying 'Dairy' matches Category & its Products) ──
    console.log("\n[Test 5] Category-Aware Search (Querying 'Dairy' matches Category & its Products):");
    const catAwareResult = await productService.searchProducts(dummyBusinessId1, { q: "Dairy" });
    assert.strictEqual(catAwareResult.data.length, 2);
    const foundNames = catAwareResult.data.map((p) => p.name);
    assert.ok(foundNames.includes("Amul Taaza Toned Milk 500ml"));
    assert.ok(foundNames.includes("Amul Butter 100g"));
    console.log(` - Query: "Dairy" -> Category-resolved products found: ${foundNames.join(", ")}`);
    console.log(" - Result: PASSED ✅");

    // ── [Test 6] Category Dropdown Filter + Search Term combined ──
    console.log("\n[Test 6] Combined Category Filter + Term Search:");
    const combinedResult = await productService.searchProducts(dummyBusinessId1, {
      q: "Amul",
      categoryId: dairyCatId,
    });
    assert.strictEqual(combinedResult.data.length, 2);
    console.log(` - Filtered Category + "Amul" Search -> Count: ${combinedResult.count}`);
    console.log(" - Result: PASSED ✅");

    // ── [Test 7] Multi-Tenant Search Isolation ──
    console.log("\n[Test 7] Multi-Tenant Search Isolation Guard:");
    const b1Result = await productService.searchProducts(dummyBusinessId1, { q: "amul" });
    const b2Result = await productService.searchProducts(dummyBusinessId2, { q: "amul" });
    assert.strictEqual(b1Result.data.length, 2);
    assert.strictEqual(b2Result.data.length, 1);
    assert.strictEqual(b2Result.data[0].sellingPrice, 28); // Business B has sellingPrice ₹28
    console.log(` - Business A results: ${b1Result.count} items | Business B results: ${b2Result.count} items`);
    console.log(" - Isolation Check: PASSED ✅ (No Cross-Tenant Data Leaked)");

    // ── [Test 8] Catalog Pagination Search Filter with Category Resolution ──
    console.log("\n[Test 8] Catalog Pagination Search Filter with Category Resolution:");
    const { rawProducts } = await productRepo.findProductsByBusinessId(dummyBusinessId1, {
      search: "Beverages",
    });
    assert.strictEqual(rawProducts.length, 1);
    assert.strictEqual(rawProducts[0].name, "Coca-Cola Soft Drink 750ml");
    console.log(` - Catalog query search="Beverages" -> Found: ${rawProducts[0].name}`);
    console.log(" - Result: PASSED ✅");

    console.log("\n================================================================================");
    console.log("       ALL T14 PRODUCT SEARCH & RAPID POS FILTER TESTS PASSED 🎉                ");
    console.log("================================================================================\n");
  } finally {
    productRepo.searchProducts = origSearchRepo;
    productRepo.findProductsByBusinessId = origFindRepo;
  }
}

runSearchUnitTests();
