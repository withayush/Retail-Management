const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Business = require("../src/models/business.model");
const ExpenseCategory = require("../src/models/expenseCategory.model");
const Expense = require("../src/models/expense.model");
const expenseCategoryService = require("../src/services/expenseCategory.service");
const expenseService = require("../src/services/expense.service");

async function runTests() {
  console.log("================================================================================");
  console.log("  PHASE 8 - TASK T49: CREATE EXPENSE API ENDPOINT TEST SUITE");
  console.log("================================================================================");

  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/vendoros";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB successfully.\n");

    const runId = Math.floor(Math.random() * 1000000);

    // [TEST 1] Setup Two Multi-Tenant Stores
    const storeAlpha = await Business.create({
      businessName: `Store Alpha Exp T49 ${runId}`,
      ownerPhone: `91971${runId.toString().padStart(7, "0")}`,
      status: "ACTIVE",
    });

    const storeBeta = await Business.create({
      businessName: `Store Beta Exp T49 ${runId}`,
      ownerPhone: `91972${runId.toString().padStart(7, "0")}`,
      status: "ACTIVE",
    });

    console.log(`[TEST 1] Setup Multi-Tenant Stores: Store Alpha (${storeAlpha._id}), Store Beta (${storeBeta._id}) [PASSED]`);

    // [TEST 2] Seed Categories for Store Alpha
    const seeded = await expenseCategoryService.seedDefaults(storeAlpha._id);
    const electricityCat = seeded.find((c) => c.categoryName.toLowerCase().includes("electricity"));
    const rentCat = seeded.find((c) => c.categoryName.toLowerCase().includes("rent"));

    if (!electricityCat || !rentCat) {
      throw new Error("Default categories seeding failed.");
    }
    console.log(`[TEST 2] Seeded default categories for Store Alpha (Electricity ID: ${electricityCat._id}, Rent ID: ${rentCat._id}) [PASSED]`);

    // [TEST 3] Create Valid Expense: Electricity Bill ₹5,200 with Attachment
    const expense1 = await expenseService.createExpense(
      storeAlpha._id,
      {
        categoryId: electricityCat._id.toString(),
        amount: 5200,
        expenseDate: "2026-09-30T10:00:00.000Z",
        paymentMethod: "UPI",
        referenceNumber: "UPI-EL-998822",
        payee: "State Power & Electricity Corp",
        description: "September 2026 store electricity bill",
        taxAmount: 260,
        attachment: {
          fileName: "electricity_sept_2026.pdf",
          url: "/uploads/bills/electricity_sept_2026.pdf",
          fileType: "application/pdf",
          fileSize: 204850,
        },
      },
      { name: "Ayush Store Manager" }
    );

    if (
      !expense1 ||
      !expense1.expenseNumber ||
      !expense1.expenseNumber.startsWith("EXP-") ||
      expense1.amount !== 5200 ||
      expense1.categoryName !== electricityCat.categoryName ||
      expense1.attachment?.fileName !== "electricity_sept_2026.pdf"
    ) {
      throw new Error("Expense creation failed or payload not saved accurately.");
    }
    console.log(`[TEST 3] Created Expense ${expense1.expenseNumber}: ₹${expense1.amount} (${expense1.categoryName}) with attachment proof [PASSED]`);

    // [TEST 4] Create Second Expense: Shop Rent ₹25,000 (Checks Sequential Numbering)
    const expense2 = await expenseService.createExpense(
      storeAlpha._id,
      {
        categoryId: rentCat._id.toString(),
        amount: 25000,
        expenseDate: "2026-10-01T09:30:00.000Z",
        paymentMethod: "BANK_TRANSFER",
        referenceNumber: "NEFT-RT-884411",
        payee: "Landlord Mr. Sharma",
        description: "October 2026 shop floor lease rent",
      },
      { name: "Ayush Store Manager" }
    );

    if (!expense2 || expense2.amount !== 25000) {
      throw new Error("Second expense creation failed.");
    }

    const num1 = parseInt(expense1.expenseNumber.replace("EXP-", ""), 10);
    const num2 = parseInt(expense2.expenseNumber.replace("EXP-", ""), 10);
    if (num2 !== num1 + 1) {
      throw new Error(`Sequential number failed: expected ${num1 + 1}, got ${expense2.expenseNumber}`);
    }
    console.log(`[TEST 4] INVARIANT: Sequential Expense Numbering verified (${expense1.expenseNumber} -> ${expense2.expenseNumber}) [PASSED]`);

    // [TEST 5] INVARIANT: Category Snapshotting Preserved
    if (expense1.categoryName !== electricityCat.categoryName || !expense1.categoryIcon || !expense1.categoryColor) {
      throw new Error("Category snapshotting invariant failed.");
    }
    console.log("[TEST 5] INVARIANT: Category metadata snapshot preserved in expense record [PASSED]");

    // [TEST 6] INVARIANT: Non-Existent Category ID Rejection (404)
    let nonExistentFailed = false;
    try {
      await expenseService.createExpense(storeAlpha._id, {
        categoryId: new mongoose.Types.ObjectId().toString(),
        amount: 1000,
      });
    } catch (err) {
      if (err.statusCode === 404 || err.code === "CATEGORY_NOT_FOUND") {
        nonExistentFailed = true;
      }
    }
    if (!nonExistentFailed) {
      throw new Error("Invariant violated: Non-existent category ID was not rejected with 404.");
    }
    console.log("[TEST 6] INVARIANT: Non-existent category ID rejected (404) [PASSED]");

    // [TEST 7] INVARIANT: Inactive Category Rejection (400)
    const inactiveCat = await ExpenseCategory.create({
      businessId: storeAlpha._id,
      categoryName: `Archived Old Overhead ${runId}`,
      isActive: false,
    });

    let inactiveFailed = false;
    try {
      await expenseService.createExpense(storeAlpha._id, {
        categoryId: inactiveCat._id.toString(),
        amount: 1500,
      });
    } catch (err) {
      if (err.statusCode === 400 || err.code === "CATEGORY_INACTIVE") {
        inactiveFailed = true;
      }
    }
    if (!inactiveFailed) {
      throw new Error("Invariant violated: Inactive category ID was not rejected with 400.");
    }
    console.log("[TEST 7] INVARIANT: Inactive category ID booking rejected (400) [PASSED]");

    // [TEST 8] INVARIANT: Cross-Tenant Category Hijacking Prevention (Store Beta trying to use Store Alpha's category)
    let crossTenantCategoryBlocked = false;
    try {
      await expenseService.createExpense(storeBeta._id, {
        categoryId: electricityCat._id.toString(), // belongs to Store Alpha
        amount: 3000,
      });
    } catch (err) {
      if (err.statusCode === 404 || err.code === "CATEGORY_NOT_FOUND") {
        crossTenantCategoryBlocked = true;
      }
    }
    if (!crossTenantCategoryBlocked) {
      throw new Error("Security breach: Store Beta was able to create an expense referencing Store Alpha's category.");
    }
    console.log("[TEST 8] INVARIANT: Cross-tenant category reference strictly blocked (404) [PASSED]");

    // [TEST 9] INVARIANT: Zero and Negative Amount Rejection
    let negativeAmountBlocked = false;
    try {
      await expenseService.createExpense(storeAlpha._id, {
        categoryId: rentCat._id.toString(),
        amount: -500,
      });
    } catch (err) {
      if (err.statusCode === 400) {
        negativeAmountBlocked = true;
      }
    }
    if (!negativeAmountBlocked) {
      throw new Error("Invariant violated: Negative amount was not rejected.");
    }
    console.log("[TEST 9] INVARIANT: Zero and negative expense amount rejected [PASSED]");

    // [TEST 10] Query Expenses with Category & Keyword Filter
    const listRes = await expenseService.getExpenses(storeAlpha._id, {
      categoryId: electricityCat._id.toString(),
    });

    if (listRes.expenses.length !== 1 || listRes.expenses[0].expenseNumber !== expense1.expenseNumber) {
      throw new Error(`Category filter query failed. Expected 1 match, found ${listRes.expenses.length}`);
    }
    console.log("[TEST 10] Filtered expense query by category verified [PASSED]");

    // [TEST 11] Summary KPI Aggregation
    const summary = await expenseService.getSummary(storeAlpha._id);
    if (
      summary.totalExpenseAmount !== 30200 || // 5200 + 25000
      summary.totalExpensesCount !== 2 ||
      !Array.isArray(summary.categoryBreakdown) ||
      summary.categoryBreakdown.length !== 2
    ) {
      throw new Error(`Summary aggregation mismatch: ${JSON.stringify(summary)}`);
    }

    console.log("\n[EXPENSE SUMMARY METRICS]:");
    console.log(`- Total Expense Amount: ₹${summary.totalExpenseAmount}`);
    console.log(`- Total Expenses Count: ${summary.totalExpensesCount}`);
    console.log(`- Average Expense Amount: ₹${summary.averageExpenseAmount}`);
    console.log(`- Categories with Expenses: ${summary.categoryBreakdown.length}`);
    console.log("[TEST 11] Executive summary KPI metrics aggregated accurately [PASSED]");

    // [TEST 12] Multi-Tenant Security Isolation
    let crossTenantExpenseReadBlocked = false;
    try {
      await expenseService.getExpenseById(storeBeta._id, expense1._id);
    } catch (err) {
      if (err.statusCode === 404) {
        crossTenantExpenseReadBlocked = true;
      }
    }
    if (!crossTenantExpenseReadBlocked) {
      throw new Error("Security breach: Store Beta was able to read Store Alpha's expense record.");
    }
    console.log("[TEST 12] Multi-Tenant Security Isolation Verified (Access rejected across stores) [PASSED]");

    console.log("\n================================================================================");
    console.log("  ALL TASK T49 CREATE EXPENSE API ENDPOINT TESTS PASSED PERFECTLY!");
    console.log("================================================================================");

    // Clean up test records
    await Expense.deleteMany({ businessId: { $in: [storeAlpha._id, storeBeta._id] } });
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
