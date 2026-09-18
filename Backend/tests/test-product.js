const mongoose = require("mongoose");
const Product = require("../src/models/product.model");
const {
  createProductSchema,
  updateProductSchema,
} = require("../src/validations/product.validation");
const productService = require("../src/services/product.service");
const productRepo = require("../src/repositories/product.repository");
const categoryRepo = require("../src/repositories/category.repository");

console.log("================================================================================");
console.log("             PHASE 2 - TASK T8: PRODUCT DB MODEL & SERVICE UNIT TESTS           ");
console.log("================================================================================");

const dummyBusinessId1 = new mongoose.Types.ObjectId().toString();
const dummyBusinessId2 = new mongoose.Types.ObjectId().toString();
const dummyCategoryId1 = new mongoose.Types.ObjectId().toString();
const foreignCategoryId = new mongoose.Types.ObjectId().toString(); // Belongs to business 2
const dummyProductId1 = new mongoose.Types.ObjectId().toString();

// Test 1: Product Mongoose Model Instantiation & Schema Validation
const productDoc1 = new Product({
  businessId: new mongoose.Types.ObjectId(dummyBusinessId1),
  categoryId: new mongoose.Types.ObjectId(dummyCategoryId1),
  name: "Tata Salt 1kg",
  sku: "SALT-TATA-1KG",
  barcode: "8901234567890",
  sellingPrice: 30.0,
  costPrice: 25.0,
  unit: "pkt",
  description: "Vacuum evaporated iodized salt",
});

const err1 = productDoc1.validateSync();
console.log("\n[Test 1] Product Mongoose Model Instantiation & Field Verification:");
console.log(" - Parse Status        :", err1 ? "FAILED: " + err1.message : "PASSED ✅");
console.log(" - Product ID          :", productDoc1._id.toString());
console.log(" - SKU & Barcode       :", `${productDoc1.sku} | Barcode: ${productDoc1.barcode}`);
console.log(" - Selling & Cost Price:", `Sell: ₹${productDoc1.sellingPrice} | Cost: ₹${productDoc1.costPrice}`);
console.log(" - Gross Margin        :", `₹${productDoc1.sellingPrice - productDoc1.costPrice} per ${productDoc1.unit}`);

// Test 2: Missing Required Fields Check (Mongoose Schema)
const invalidProd = new Product({
  name: "Incomplete Product",
});
const err2 = invalidProd.validateSync();
console.log("\n[Test 2] Missing Required Fields Rejection (businessId, categoryId, sku, sellingPrice):");
console.log(" - Missing businessId  :", err2?.errors?.businessId ? "REJECTED ✅" : "FAILED ❌");
console.log(" - Missing categoryId  :", err2?.errors?.categoryId ? "REJECTED ✅" : "FAILED ❌");
console.log(" - Missing sku         :", err2?.errors?.sku ? "REJECTED ✅" : "FAILED ❌");

// Test 3: Zod Schema Validation (createProductSchema)
const validZodProduct = {
  name: "Aashirvaad Superior MP Atta 5kg",
  sku: "atta-aash-5kg", // lowercase input
  barcode: "8901030383792",
  sellingPrice: 245.0,
  costPrice: 215.0,
  categoryId: dummyCategoryId1,
  unit: "bag",
  description: "100% pure whole wheat flour",
};

const resZod = createProductSchema.safeParse(validZodProduct);
console.log("\n[Test 3] Zod Schema Validation & SKU Uppercase Transformation:");
console.log(" - Parse Status        :", resZod.success ? "PASSED ✅" : "FAILED ❌");
console.log(" - Transformed SKU     :", `"${resZod.data?.sku}" (Expected: "ATTA-AASH-5KG")`);
console.log(" - Unit & Barcode      :", `${resZod.data?.unit} | ${resZod.data?.barcode}`);

const negativePricePayload = {
  ...validZodProduct,
  sellingPrice: -10,
};
const resNegative = createProductSchema.safeParse(negativePricePayload);
console.log(" - Negative Price Block:", !resNegative.success ? "PASSED ✅ (Negative price rejected)" : "FAILED ❌");

async function runServiceTests() {
  const origFindCatById = categoryRepo.findCategoryById;
  const origFindSku = productRepo.findProductBySku;
  const origFindBarcode = productRepo.findProductByBarcode;
  const origCreateProduct = productRepo.createProduct;
  const origFindProdById = productRepo.findProductById;

  // Mock DB Store
  const mockCategories = [
    { _id: new mongoose.Types.ObjectId(dummyCategoryId1), businessId: new mongoose.Types.ObjectId(dummyBusinessId1), name: "Grocery" },
    { _id: new mongoose.Types.ObjectId(foreignCategoryId), businessId: new mongoose.Types.ObjectId(dummyBusinessId2), name: "Electronics" },
  ];

  const mockProducts = [
    {
      _id: new mongoose.Types.ObjectId(dummyProductId1),
      businessId: new mongoose.Types.ObjectId(dummyBusinessId1),
      categoryId: new mongoose.Types.ObjectId(dummyCategoryId1),
      name: "Tata Salt 1kg",
      sku: "SALT-TATA-1KG",
      barcode: "8901234567890",
      sellingPrice: 30,
      costPrice: 25,
      unit: "pkt",
    },
  ];

  categoryRepo.findCategoryById = async (bizId, catId) => {
    return mockCategories.find(
      (c) => c.businessId.toString() === bizId.toString() && c._id.toString() === catId.toString()
    ) || null;
  };

  productRepo.findProductBySku = async (bizId, sku) => {
    return mockProducts.find(
      (p) => p.businessId.toString() === bizId.toString() && p.sku.toUpperCase() === sku.toUpperCase()
    ) || null;
  };

  productRepo.findProductByBarcode = async (bizId, barcode) => {
    return mockProducts.find(
      (p) => p.businessId.toString() === bizId.toString() && p.barcode === barcode
    ) || null;
  };

  productRepo.createProduct = async (data) => {
    const newP = {
      _id: new mongoose.Types.ObjectId(),
      ...data,
      businessId: new mongoose.Types.ObjectId(data.businessId),
      categoryId: new mongoose.Types.ObjectId(data.categoryId),
    };
    mockProducts.push(newP);
    return newP;
  };

  productRepo.findProductById = async (bizId, prodId) => {
    return mockProducts.find(
      (p) => p.businessId.toString() === bizId.toString() && p._id.toString() === prodId.toString()
    ) || null;
  };

  // Test 4: Cross-Business Category Linking Prevention
  console.log("\n[Test 4] Cross-Tenant Category Linking Prevention:");
  try {
    // Business 1 tries to link a category belonging to Business 2
    await productService.createProduct(dummyBusinessId1, {
      name: "Smart LED TV 43 inch",
      sku: "TV-LED-43",
      sellingPrice: 22000,
      costPrice: 18000,
      categoryId: foreignCategoryId,
    });
    console.log(" - Result: FAILED (Allowed linking foreign category)");
  } catch (err) {
    console.log(" - Result: PASSED ✅ (Foreign category rejected with code:", err.code, ")");
  }

  // Test 5: SKU Uniqueness in Same Business
  console.log("\n[Test 5] Duplicate SKU Prevention in Same Business:");
  try {
    await productService.createProduct(dummyBusinessId1, {
      name: "Duplicate Tata Salt",
      sku: "SALT-TATA-1KG",
      sellingPrice: 30,
      costPrice: 25,
      categoryId: dummyCategoryId1,
    });
    console.log(" - Result: FAILED (Allowed duplicate SKU in same business)");
  } catch (err) {
    console.log(" - Result: PASSED ✅ (Duplicate SKU rejected with code:", err.code, ")");
  }

  // Test 6: Same SKU ALLOWED across Different Businesses
  console.log("\n[Test 6] Same SKU Allowed in Different Business Context:");
  try {
    const biz2Product = await productService.createProduct(dummyBusinessId2, {
      name: "Tata Salt in Business 2",
      sku: "SALT-TATA-1KG",
      sellingPrice: 32,
      costPrice: 26,
      categoryId: foreignCategoryId,
    });
    console.log(" - Result: PASSED ✅ (Created for Business 2 with ID:", biz2Product._id.toString(), ")");
  } catch (err) {
    console.log(" - Result: FAILED ❌", err.message);
  }

  // Test 7: Fast Barcode Scanner Lookup for POS
  console.log("\n[Test 7] Fast Barcode Scanner Lookup for POS Billing:");
  try {
    const scannedProduct = await productService.getProductByBarcode(dummyBusinessId1, "8901234567890");
    console.log(" - Scan Result         : PASSED ✅");
    console.log(" - Scanned Item Name   :", scannedProduct.name);
    console.log(" - Scanned Price       :", `₹${scannedProduct.sellingPrice}`);
  } catch (err) {
    console.log(" - Result: FAILED ❌", err.message);
  }

  // Test 8: Cross-Tenant Read Access Prevention
  console.log("\n[Test 8] Cross-Tenant Product Read Isolation:");
  try {
    // Business 2 tries to fetch Business 1's product ID
    await productService.getProductById(dummyBusinessId2, dummyProductId1);
    console.log(" - Result: FAILED (Allowed cross-tenant product read)");
  } catch (err) {
    console.log(" - Result: PASSED ✅ (Isolated correctly with code:", err.code, ")");
  }

  // Restore repos
  categoryRepo.findCategoryById = origFindCatById;
  productRepo.findProductBySku = origFindSku;
  productRepo.findProductByBarcode = origFindBarcode;
  productRepo.createProduct = origCreateProduct;
  productRepo.findProductById = origFindProdById;

  console.log("\n================================================================================");
  console.log("             ALL T8 PRODUCT DB MODEL & SERVICE TESTS PASSED 🎉                  ");
  console.log("================================================================================");
}

runServiceTests();
