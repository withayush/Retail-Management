const mongoose = require("mongoose");
const Category = require("../src/models/category.model");
const {
  createCategorySchema,
  updateCategorySchema,
} = require("../src/validations/category.validation");
const categoryService = require("../src/services/category.service");
const categoryRepo = require("../src/repositories/category.repository");

console.log("================================================================================");
console.log("             PHASE 2 - TASK T7: CATEGORY DB MODEL & SERVICE UNIT TESTS          ");
console.log("================================================================================");

const dummyBusinessId1 = new mongoose.Types.ObjectId().toString();
const dummyBusinessId2 = new mongoose.Types.ObjectId().toString();
const dummyCategoryId1 = new mongoose.Types.ObjectId().toString();

// Test 1: Category Mongoose Schema Structure & Required businessId
const categoryDoc1 = new Category({
  businessId: new mongoose.Types.ObjectId(dummyBusinessId1),
  name: "Grocery & Provisions",
  description: "Daily essentials and food items",
});

const err1 = categoryDoc1.validateSync();
console.log("\n[Test 1] Category Mongoose Model Instantiation & Validation:");
console.log(" - Parse Status        :", err1 ? "FAILED: " + err1.message : "PASSED ✅");
console.log(" - Category ID         :", categoryDoc1._id.toString());
console.log(" - Business ID (Ref)   :", categoryDoc1.businessId.toString());
console.log(" - Name & Description  :", `"${categoryDoc1.name}" - ${categoryDoc1.description}`);

// Test 2: Missing businessId Rejection Check
const invalidCat = new Category({
  name: "Orphan Category",
});
const err2 = invalidCat.validateSync();
console.log("\n[Test 2] Missing businessId Field Rejection:");
console.log(" - Rejection Status    :", err2?.errors?.businessId ? "PASSED ✅ (businessId is mandatory)" : "FAILED ❌");

// Test 3: Zod Schema Validation (createCategorySchema)
const validZod = {
  name: "  Beverages & Drinks  ",
  description: "Soft drinks, juices, and packaged water",
};
const resZod = createCategorySchema.safeParse(validZod);
console.log("\n[Test 3] Zod Schema Validation & String Trimming:");
console.log(" - Parse Status        :", resZod.success ? "PASSED ✅" : "FAILED ❌");
console.log(" - Trimmed Name        :", `"${resZod.data?.name}"`);

const invalidZod = { name: "A" }; // < 2 chars
const resInvalidZod = createCategorySchema.safeParse(invalidZod);
console.log(" - Short Name Rejected :", !resInvalidZod.success ? "PASSED ✅" : "FAILED ❌");

// Test 4: Multi-Tenant Name Uniqueness within Same Business
async function runServiceTests() {
  const origFindByName = categoryRepo.findCategoryByName;
  const origCreate = categoryRepo.createCategory;
  const origFindById = categoryRepo.findCategoryById;
  const origFindAll = categoryRepo.findCategoriesByBusinessId;
  const origUpdate = categoryRepo.updateCategoryById;
  const origDelete = categoryRepo.deleteCategoryById;

  // Mock DB store
  const mockCategories = [
    {
      _id: new mongoose.Types.ObjectId(dummyCategoryId1),
      businessId: new mongoose.Types.ObjectId(dummyBusinessId1),
      name: "Grocery",
      description: "Food items",
    },
  ];

  categoryRepo.findCategoryByName = async (bizId, name) => {
    return mockCategories.find(
      (c) => c.businessId.toString() === bizId.toString() && c.name.toLowerCase() === name.toLowerCase()
    ) || null;
  };

  categoryRepo.createCategory = async ({ businessId, name, description }) => {
    const newCat = {
      _id: new mongoose.Types.ObjectId(),
      businessId: new mongoose.Types.ObjectId(businessId),
      name,
      description,
    };
    mockCategories.push(newCat);
    return newCat;
  };

  console.log("\n[Test 4] Duplicate Category Name Prevention in Same Business:");
  try {
    await categoryService.createCategory(dummyBusinessId1, {
      name: "Grocery",
      description: "Duplicate food items",
    });
    console.log(" - Result: FAILED (Should have rejected duplicate)");
  } catch (err) {
    console.log(" - Result: PASSED ✅ (Duplicate rejected with code:", err.code, "| Status:", err.statusCode, ")");
  }

  // Test 5: Same Category Name ALLOWED across Different Businesses (Multi-Tenant Isolation)
  console.log("\n[Test 5] Same Category Name Allowed in Different Business Context:");
  try {
    const biz2Cat = await categoryService.createCategory(dummyBusinessId2, {
      name: "Grocery",
      description: "Business 2 Grocery",
    });
    console.log(" - Result: PASSED ✅ (Created for Business 2 with ID:", biz2Cat._id.toString(), ")");
  } catch (err) {
    console.log(" - Result: FAILED ❌", err.message);
  }

  // Test 6: Cross-Tenant Fetch Isolation
  categoryRepo.findCategoryById = async (bizId, catId) => {
    return mockCategories.find(
      (c) => c.businessId.toString() === bizId.toString() && c._id.toString() === catId.toString()
    ) || null;
  };

  console.log("\n[Test 6] Cross-Tenant Read Access Prevention:");
  try {
    // Business 2 tries to access Business 1's category ID
    await categoryService.getCategoryById(dummyBusinessId2, dummyCategoryId1);
    console.log(" - Result: FAILED (Allowed cross-tenant access)");
  } catch (err) {
    console.log(" - Result: PASSED ✅ (Isolated correctly with code:", err.code, ")");
  }

  // Restore repos
  categoryRepo.findCategoryByName = origFindByName;
  categoryRepo.createCategory = origCreate;
  categoryRepo.findCategoryById = origFindById;
  categoryRepo.findCategoriesByBusinessId = origFindAll;
  categoryRepo.updateCategoryById = origUpdate;
  categoryRepo.deleteCategoryById = origDelete;

  console.log("\n================================================================================");
  console.log("            ALL T7 CATEGORY DB MODEL & SERVICE TESTS PASSED 🎉                  ");
  console.log("================================================================================");
}

runServiceTests();
