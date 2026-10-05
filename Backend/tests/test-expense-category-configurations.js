const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Business = require("../src/models/business.model");
const ExpenseCategory = require("../src/models/expenseCategory.model");
const expenseCategoryRepository = require("../src/repositories/expenseCategory.repository");
const expenseCategoryService = require("../src/services/expenseCategory.service");

async function runTests() {
  console.log("================================================================================");
  console.log("  PHASE 8 - TASK T48: EXPENSE CATEGORY CONFIGURATIONS TEST SUITE");
  console.log("================================================================================");

  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/vendoros";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB successfully.\n");

    const runId = Math.floor(Math.random() * 1000000);

    // [TEST 1] Setup Two Multi-Tenant Stores
    const storeAlpha = await Business.create({
      businessName: `Store Alpha Exp ${runId}`,
      ownerPhone: `91981${runId.toString().padStart(7, "0")}`,
      status: "ACTIVE",
    });

    const storeBeta = await Business.create({
      businessName: `Store Beta Exp ${runId}`,
      ownerPhone: `91982${runId.toString().padStart(7, "0")}`,
      status: "ACTIVE",
    });

    console.log(`[TEST 1] Setup Multi-Tenant Stores: Store Alpha (${storeAlpha._id}), Store Beta (${storeBeta._id}) [PASSED]`);

    // [TEST 2] Auto-Seeding System Default Categories for Store Alpha
    const seededCategories = await expenseCategoryService.getCategories(storeAlpha._id);
    if (!seededCategories || seededCategories.length < 5) {
      throw new Error(`Expected at least 5 default categories to be seeded, got ${seededCategories.length}`);
    }

    const rentCat = seededCategories.find((c) => c.categoryName.toLowerCase().includes("rent"));
    const salaryCat = seededCategories.find((c) => c.categoryName.toLowerCase().includes("salary"));
    const utilityCat = seededCategories.find((c) => c.categoryName.toLowerCase().includes("electricity"));

    if (!rentCat || !salaryCat || !utilityCat) {
      throw new Error("Missing essential default categories (Rent, Salary, Electricity) in seeded list.");
    }
    console.log(`[TEST 2] Auto-Seeded ${seededCategories.length} System Default Categories (Rent, Salary, Utilities, etc.) [PASSED]`);

    // [TEST 3] Create Custom Business Expense Category
    const customCategory = await expenseCategoryService.createCategory(storeAlpha._id, {
      categoryName: "Cloud & Software Subscriptions",
      description: "AWS cloud hosting, domain renewals, POS SaaS software",
      icon: "Laptop",
      color: "#0066CC",
      budgetLimit: 15000,
      sortOrder: 10,
    });

    if (
      !customCategory ||
      customCategory.categoryName !== "Cloud & Software Subscriptions" ||
      customCategory.budgetLimit !== 15000 ||
      customCategory.isDefault !== false
    ) {
      throw new Error("Custom expense category creation failed or payload not saved properly.");
    }
    console.log(`[TEST 3] Created Custom Category '${customCategory.categoryName}' with budget limit ₹${customCategory.budgetLimit} [PASSED]`);

    // [TEST 4] INVARIANT: Duplicate Category Name Collision inside Same Business
    let duplicateFailedAsExpected = false;
    try {
      await expenseCategoryService.createCategory(storeAlpha._id, {
        categoryName: "Cloud & Software Subscriptions", // Duplicate
        description: "Another attempt with same name",
      });
    } catch (err) {
      if (err.statusCode === 409 || err.code === "DUPLICATE_CATEGORY_NAME") {
        duplicateFailedAsExpected = true;
      }
    }

    if (!duplicateFailedAsExpected) {
      throw new Error("Invariant violated: Duplicate category name within same store was not rejected with 409.");
    }
    console.log("[TEST 4] INVARIANT: Duplicate category name collision in same store strictly rejected (409) [PASSED]");

    // [TEST 5] MULTI-TENANT ISOLATION: Same Category Name allowed in Different Business (Store Beta)
    const betaCategory = await expenseCategoryService.createCategory(storeBeta._id, {
      categoryName: "Cloud & Software Subscriptions",
      description: "Store Beta cloud expenses",
      icon: "Laptop",
      color: "#BF5AF2",
      budgetLimit: 8000,
    });

    if (!betaCategory || betaCategory.businessId.toString() !== storeBeta._id.toString()) {
      throw new Error("Multi-tenant isolation failed: Store Beta could not create identically named category.");
    }
    console.log("[TEST 5] Multi-Tenant Isolation: Identical category name successfully created in Store Beta [PASSED]");

    // [TEST 6] Search and Filter Categories
    const searchResults = await expenseCategoryService.getCategories(storeAlpha._id, {
      search: "Subscriptions",
    });

    if (searchResults.length !== 1 || searchResults[0].categoryName !== "Cloud & Software Subscriptions") {
      throw new Error(`Search filter failed. Expected 1 match, found ${searchResults.length}`);
    }
    console.log("[TEST 6] Search and filter by keyword verified [PASSED]");

    // [TEST 7] Update Category Metadata & Budget
    const updated = await expenseCategoryService.updateCategory(storeAlpha._id, customCategory._id, {
      categoryName: "Software & IT SaaS",
      description: "Updated software description",
      budgetLimit: 20000,
      color: "#30D158",
    });

    if (updated.categoryName !== "Software & IT SaaS" || updated.budgetLimit !== 20000) {
      throw new Error("Category update failed.");
    }
    console.log(`[TEST 7] Category renamed to '${updated.categoryName}' & budget updated to ₹${updated.budgetLimit} [PASSED]`);

    // [TEST 8] Toggle Category Active / Inactive Status
    const deactivated = await expenseCategoryService.toggleStatus(storeAlpha._id, customCategory._id);
    if (deactivated.isActive !== false) {
      throw new Error("Toggle status to inactive failed.");
    }

    const reactivated = await expenseCategoryService.toggleStatus(storeAlpha._id, customCategory._id);
    if (reactivated.isActive !== true) {
      throw new Error("Toggle status back to active failed.");
    }
    console.log("[TEST 8] Category active/inactive toggle cycle verified [PASSED]");

    // [TEST 9] Soft-Delete / Archival
    const archived = await expenseCategoryService.archiveCategory(storeAlpha._id, customCategory._id);
    if (archived.isArchived !== true || archived.isActive !== false) {
      throw new Error("Archival failed.");
    }

    const listAfterArchival = await expenseCategoryService.getCategories(storeAlpha._id, { status: "ACTIVE" });
    const existsInActive = listAfterArchival.some((c) => c._id.toString() === customCategory._id.toString());
    if (existsInActive) {
      throw new Error("Archived category still appears in active category listings.");
    }
    console.log("[TEST 9] Soft-delete archival verified (omitted from active listings while preserving ID history) [PASSED]");

    // [TEST 10] Restore Archived Category
    const restored = await expenseCategoryService.restoreCategory(storeAlpha._id, customCategory._id);
    if (restored.isArchived !== false || restored.isActive !== true) {
      throw new Error("Restoration of archived category failed.");
    }
    console.log("[TEST 10] Category successfully restored to active operational status [PASSED]");

    // [TEST 11] Summary Metrics Aggregation
    const summary = await expenseCategoryService.getSummary(storeAlpha._id);
    if (
      typeof summary.totalCategories !== "number" ||
      summary.totalCategories < 5 ||
      typeof summary.customCategories !== "number" ||
      summary.customCategories < 1
    ) {
      throw new Error(`Summary metrics mismatch: ${JSON.stringify(summary)}`);
    }

    console.log("\n[SUMMARY METRICS]:");
    console.log(`- Total Categories: ${summary.totalCategories}`);
    console.log(`- Active Categories: ${summary.activeCategories}`);
    console.log(`- Custom Categories: ${summary.customCategories}`);
    console.log(`- System Defaults: ${summary.defaultCategories}`);
    console.log("[TEST 11] Summary KPI metrics aggregated accurately [PASSED]");

    // [TEST 12] Multi-Tenant Security Boundary Isolation
    let storeCrossAccessBlocked = false;
    try {
      // Store Beta trying to update Store Alpha's category
      await expenseCategoryService.updateCategory(storeBeta._id, customCategory._id, {
        categoryName: "Hacked by Store Beta",
      });
    } catch (err) {
      if (err.statusCode === 404) {
        storeCrossAccessBlocked = true;
      }
    }

    if (!storeCrossAccessBlocked) {
      throw new Error("Security breach: Cross-tenant category modification was not blocked.");
    }
    console.log("[TEST 12] Multi-Tenant Security Isolation Verified (Cross-tenant modification rejected) [PASSED]");

    console.log("\n================================================================================");
    console.log("  ALL TASK T48 EXPENSE CATEGORY CONFIGURATIONS TESTS PASSED PERFECTLY!");
    console.log("================================================================================");

    // Clean up test collections
    await ExpenseCategory.deleteMany({ businessId: { $in: [storeAlpha._id, storeBeta._id] } });
    await Business.deleteMany({ _id: { $in: [storeAlpha._id, storeBeta._id] } });

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ TEST SUITE FAILED:", error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

runTests();
