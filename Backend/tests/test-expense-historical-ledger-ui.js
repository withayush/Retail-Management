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
  console.log("  PHASE 8 - TASK T50: EXPENSE HISTORICAL LEDGER UI TEST SUITE");
  console.log("================================================================================");

  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/vendoros";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB successfully.\n");

    const runId = Math.floor(Math.random() * 1000000);

    // [TEST 1] Setup Multi-Tenant Stores
    const storeAlpha = await Business.create({
      ownerId: new mongoose.Types.ObjectId(),
      businessName: `Store Alpha Ledger ${runId}`,
      ownerPhone: `91961${runId.toString().padStart(7, "0")}`,
      status: "ACTIVE",
    });

    const storeBeta = await Business.create({
      ownerId: new mongoose.Types.ObjectId(),
      businessName: `Store Beta Ledger ${runId}`,
      ownerPhone: `91962${runId.toString().padStart(7, "0")}`,
      status: "ACTIVE",
    });

    console.log(`[TEST 1] Setup Multi-Tenant Stores: Store Alpha (${storeAlpha._id}), Store Beta (${storeBeta._id}) [PASSED]`);

    // [TEST 2] Setup Categories with Budget Limits for Leakage Testing
    const seeded = await expenseCategoryService.seedDefaults(storeAlpha._id);
    const rentCat = seeded.find((c) => c.categoryName.toLowerCase().includes("rent"));
    const electricityCat = seeded.find((c) => c.categoryName.toLowerCase().includes("electricity"));
    const salaryCat = seeded.find((c) => c.categoryName.toLowerCase().includes("salary"));
    const transportCat = seeded.find((c) => c.categoryName.toLowerCase().includes("transport"));
    const internetCat = seeded.find((c) => c.categoryName.toLowerCase().includes("internet"));

    // Set budget limit on Electricity to test leakage detection (₹5,000 cap)
    await expenseCategoryService.updateCategory(storeAlpha._id, electricityCat._id, {
      budgetLimit: 5000,
    });

    console.log(`[TEST 2] Configured Categories with Monthly Budget Limits (Electricity Cap: ₹5,000) [PASSED]`);

    // [TEST 3] Create Historical October 2026 Expense Records
    const octExpenses = [
      { cat: rentCat, amt: 20000, date: "2026-10-01T10:00:00Z", desc: "Shop Floor Rent", payee: "Landlord Sharma" },
      { cat: electricityCat, amt: 5200, date: "2026-10-02T11:00:00Z", desc: "Sept Power Bill", payee: "State Electricity Board" },
      { cat: transportCat, amt: 3000, date: "2026-10-03T14:30:00Z", desc: "Tempo Logistics", payee: "Ramesh Transport" },
      { cat: salaryCat, amt: 30000, date: "2026-10-05T09:00:00Z", desc: "Staff Monthly Salaries", payee: "Store Employees" },
      { cat: internetCat, amt: 1000, date: "2026-10-08T16:00:00Z", desc: "Fiber Broadband", payee: "Airtel Enterprise" },
      { cat: electricityCat, amt: 2500, date: "2026-10-12T15:00:00Z", desc: "Additional Power Generator", payee: "State Electricity Board" },
    ];

    for (const item of octExpenses) {
      await expenseService.createExpense(
        storeAlpha._id,
        {
          categoryId: item.cat._id.toString(),
          amount: item.amt,
          expenseDate: item.date,
          description: item.desc,
          payee: item.payee,
        },
        { name: "Ayush Store Admin" }
      );
    }

    // Also create 1 September expense to test month filtering isolation
    await expenseService.createExpense(
      storeAlpha._id,
      {
        categoryId: rentCat._id.toString(),
        amount: 20000,
        expenseDate: "2026-09-01T10:00:00Z",
        description: "September Shop Rent",
      }
    );

    console.log(`[TEST 3] Recorded 6 October expenses (Total: ₹61,700) + 1 September expense [PASSED]`);

    // [TEST 4] Robust Month Filtering (querying month=2026-10)
    const octResults = await expenseService.getExpenses(storeAlpha._id, {
      month: "2026-10",
    });

    if (octResults.expenses.length !== 6) {
      throw new Error(`Month filter failed. Expected 6 October expenses, got ${octResults.expenses.length}`);
    }

    const octTotal = octResults.expenses.reduce((sum, e) => sum + e.amount, 0);
    if (octTotal !== 61700) {
      throw new Error(`October total sum mismatch. Expected ₹61,700, got ₹${octTotal}`);
    }
    console.log(`[TEST 4] Robust Month Filtering verified (6 records, Total: ₹${octTotal}) [PASSED]`);

    // [TEST 5] Robust Category Filtering (querying categoryId=Electricity)
    const elecResults = await expenseService.getExpenses(storeAlpha._id, {
      categoryId: electricityCat._id.toString(),
    });

    if (elecResults.expenses.length !== 2) {
      throw new Error(`Category filter failed. Expected 2 electricity expenses, got ${elecResults.expenses.length}`);
    }
    const elecTotal = elecResults.expenses.reduce((sum, e) => sum + e.amount, 0);
    if (elecTotal !== 7700) {
      throw new Error(`Electricity total mismatch. Expected ₹7,700, got ₹${elecTotal}`);
    }
    console.log(`[TEST 5] Robust Category Filtering verified (2 electricity entries, Total: ₹${elecTotal}) [PASSED]`);

    // [TEST 6] Combined Month + Category Filtering (month=2026-10 & categoryId=Electricity)
    const combinedResults = await expenseService.getExpenses(storeAlpha._id, {
      month: "2026-10",
      categoryId: electricityCat._id.toString(),
    });

    if (combinedResults.expenses.length !== 2) {
      throw new Error(`Combined filter failed. Expected 2 matches, got ${combinedResults.expenses.length}`);
    }
    console.log("[TEST 6] Combined Month + Category query verified [PASSED]");

    // [TEST 7] Server-Side Pagination Controls
    const page1Res = await expenseService.getExpenses(storeAlpha._id, {
      month: "2026-10",
      page: 1,
      limit: 3,
    });

    if (
      page1Res.expenses.length !== 3 ||
      page1Res.pagination.totalRecords !== 6 ||
      page1Res.pagination.totalPages !== 2 ||
      page1Res.pagination.hasNextPage !== true
    ) {
      throw new Error(`Pagination metadata mismatch: ${JSON.stringify(page1Res.pagination)}`);
    }

    const page2Res = await expenseService.getExpenses(storeAlpha._id, {
      month: "2026-10",
      page: 2,
      limit: 3,
    });

    if (page2Res.expenses.length !== 3 || page2Res.pagination.hasNextPage !== false) {
      throw new Error("Page 2 pagination failed.");
    }
    console.log("[TEST 7] Server-Side Pagination controls verified (Page 1: 3 items, Page 2: 3 items) [PASSED]");

    // [TEST 8] Visual Expenditure Leakage & Budget Variance Detection
    const summary = await expenseService.getSummary(storeAlpha._id, {
      month: "2026-10",
    });

    const electricityStat = summary.categoryBreakdown.find(
      (c) => c._id.toString() === electricityCat._id.toString()
    );

    if (!electricityStat) {
      throw new Error("Electricity category breakdown missing from summary.");
    }

    if (electricityStat.totalAmount !== 7700 || electricityStat.budgetLimit !== 5000) {
      throw new Error(`Leakage calculation mismatch: total ${electricityStat.totalAmount}, budget ${electricityStat.budgetLimit}`);
    }

    if (electricityStat.isOverBudget !== true || electricityStat.budgetVariance !== 2700) {
      throw new Error(`Over-budget leakage detection failed: expected isOverBudget: true, variance +2700, got ${JSON.stringify(electricityStat)}`);
    }

    console.log("\n[EXPENDITURE LEAKAGE DETECTION]:");
    console.log(`- Category: ${electricityStat.categoryName}`);
    console.log(`- Actual Spent: ₹${electricityStat.totalAmount}`);
    console.log(`- Monthly Budget Cap: ₹${electricityStat.budgetLimit}`);
    console.log(`- Budget Leakage / Variance: +₹${electricityStat.budgetVariance} (OVER BUDGET: ${electricityStat.isOverBudget})`);
    console.log("[TEST 8] Visual expenditure leakage detection verified [PASSED]");

    // [TEST 9] Multi-Tenant Security Isolation
    const betaExpenses = await expenseService.getExpenses(storeBeta._id);
    if (betaExpenses.expenses.length !== 0 || betaExpenses.pagination.totalRecords !== 0) {
      throw new Error("Multi-tenant leak: Store Beta saw Store Alpha's expenses.");
    }
    console.log("[TEST 9] Multi-Tenant Security Isolation Verified (Zero records in Store Beta) [PASSED]");

    console.log("\n================================================================================");
    console.log("  ALL TASK T50 EXPENSE HISTORICAL LEDGER UI TESTS PASSED PERFECTLY!");
    console.log("================================================================================");

    // Clean up test data
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
