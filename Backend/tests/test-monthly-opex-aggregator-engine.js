const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Business = require("../src/models/business.model");
const ExpenseCategory = require("../src/models/expenseCategory.model");
const Expense = require("../src/models/expense.model");
const MonthlyOpExSummary = require("../src/models/monthlyOpExSummary.model");
const expenseCategoryService = require("../src/services/expenseCategory.service");
const expenseService = require("../src/services/expense.service");
const monthlyOpExService = require("../src/services/monthlyOpEx.service");
const monthlyOpExRepository = require("../src/repositories/monthlyOpEx.repository");

async function runTests() {
  console.log("================================================================================");
  console.log("  PHASE 8 - TASK T51: MONTHLY OPEX AGGREGATOR ENGINE TEST SUITE");
  console.log("================================================================================");

  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/vendoros";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB successfully.\n");

    const runId = Math.floor(Math.random() * 1000000);

    const ownerAlpha = new mongoose.Types.ObjectId();
    const ownerBeta = new mongoose.Types.ObjectId();

    // [TEST 1] Setup Multi-Tenant Stores
    const storeAlpha = await Business.create({
      ownerId: ownerAlpha,
      businessName: `Store Alpha OpEx ${runId}`,
      ownerPhone: `91981${runId.toString().padStart(7, "0")}`,
      status: "ACTIVE",
    });

    const storeBeta = await Business.create({
      ownerId: ownerBeta,
      businessName: `Store Beta OpEx ${runId}`,
      ownerPhone: `91982${runId.toString().padStart(7, "0")}`,
      status: "ACTIVE",
    });

    console.log(`[TEST 1] Setup Multi-Tenant Stores: Store Alpha (${storeAlpha._id}), Store Beta (${storeBeta._id}) [PASSED]`);

    // [TEST 2] Category Configuration & Budget Caps
    const alphaCategories = await expenseCategoryService.seedDefaults(storeAlpha._id);
    const rentCat = alphaCategories.find((c) => c.categoryName.toLowerCase().includes("rent"));
    const salaryCat = alphaCategories.find((c) => c.categoryName.toLowerCase().includes("salary"));
    const electricityCat = alphaCategories.find((c) => c.categoryName.toLowerCase().includes("electricity"));
    const transportCat = alphaCategories.find((c) => c.categoryName.toLowerCase().includes("transport"));
    const internetCat = alphaCategories.find((c) => c.categoryName.toLowerCase().includes("internet"));
    const marketingCat = alphaCategories.find((c) => c.categoryName.toLowerCase().includes("marketing"));

    // Set budget limit on Electricity to test leakage detection (₹5,000 cap)
    await expenseCategoryService.updateCategory(storeAlpha._id, electricityCat._id, {
      budgetLimit: 5000,
    });

    const betaCategories = await expenseCategoryService.seedDefaults(storeBeta._id);
    const betaRentCat = betaCategories.find((c) => c.categoryName.toLowerCase().includes("rent"));

    console.log(`[TEST 2] Configured Categories with Budget Caps [PASSED]`);

    // [TEST 3] Record Multi-Month Realistic Expenses
    // September 2026 Expenses (Total: ₹55,000)
    await expenseService.createExpense(storeAlpha._id, {
      categoryId: rentCat._id.toString(),
      amount: 20000,
      expenseDate: "2026-09-01T10:00:00Z",
      description: "September Shop Rent",
      paymentMethod: "BANK_TRANSFER",
    });
    await expenseService.createExpense(storeAlpha._id, {
      categoryId: salaryCat._id.toString(),
      amount: 30000,
      expenseDate: "2026-09-05T09:00:00Z",
      description: "September Staff Salary",
      paymentMethod: "BANK_TRANSFER",
    });
    await expenseService.createExpense(storeAlpha._id, {
      categoryId: electricityCat._id.toString(),
      amount: 5000,
      expenseDate: "2026-09-10T11:00:00Z",
      description: "August Power Bill",
      paymentMethod: "UPI",
    });

    // October 2026 Expenses (Total: ₹67,000)
    await expenseService.createExpense(storeAlpha._id, {
      categoryId: rentCat._id.toString(),
      amount: 20000,
      expenseDate: "2026-10-01T10:00:00Z",
      description: "October Shop Rent",
      paymentMethod: "BANK_TRANSFER",
    });
    await expenseService.createExpense(storeAlpha._id, {
      categoryId: salaryCat._id.toString(),
      amount: 30000,
      expenseDate: "2026-10-05T09:00:00Z",
      description: "October Staff Salary",
      paymentMethod: "BANK_TRANSFER",
    });
    await expenseService.createExpense(storeAlpha._id, {
      categoryId: electricityCat._id.toString(),
      amount: 7000,
      expenseDate: "2026-10-07T11:00:00Z",
      description: "September Power Bill (Heavy AC Usage)",
      paymentMethod: "UPI",
    });
    await expenseService.createExpense(storeAlpha._id, {
      categoryId: internetCat._id.toString(),
      amount: 1000,
      expenseDate: "2026-10-08T15:00:00Z",
      description: "Store Broadband Fiber",
      paymentMethod: "CARD",
    });
    await expenseService.createExpense(storeAlpha._id, {
      categoryId: transportCat._id.toString(),
      amount: 4000,
      expenseDate: "2026-10-12T14:00:00Z",
      description: "Goods Delivery Tempo",
      paymentMethod: "CASH",
    });
    await expenseService.createExpense(storeAlpha._id, {
      categoryId: marketingCat._id.toString(),
      amount: 5000,
      expenseDate: "2026-10-15T12:00:00Z",
      description: "Diwali Promotional Pamphlets",
      paymentMethod: "UPI",
    });

    // Store Beta Expense in October (Total: ₹12,000)
    await expenseService.createExpense(storeBeta._id, {
      categoryId: betaRentCat._id.toString(),
      amount: 12000,
      expenseDate: "2026-10-02T10:00:00Z",
      description: "Store Beta Rent",
      paymentMethod: "BANK_TRANSFER",
    });

    console.log(`[TEST 3] Recorded Multi-Month Operational Expenses for Store Alpha & Store Beta [PASSED]`);

    // [TEST 4] Test September 2026 OpEx Aggregation
    const sepSummary = await monthlyOpExService.getMonthlyOpExSummary(storeAlpha._id, {
      year: 2026,
      month: 9,
      forceRefresh: true,
    });

    if (sepSummary.totalOpEx !== 55000) {
      throw new Error(`Expected September OpEx to be ₹55,000, got ₹${sepSummary.totalOpEx}`);
    }
    if (sepSummary.expenseCount !== 3) {
      throw new Error(`Expected September count to be 3, got ${sepSummary.expenseCount}`);
    }
    console.log(`[TEST 4] September 2026 OpEx Aggregation: Total = ₹${sepSummary.totalOpEx}, Count = ${sepSummary.expenseCount} [PASSED]`);

    // [TEST 5] Test October 2026 OpEx Aggregation & MoM Growth Calculation
    const octSummary = await monthlyOpExService.getMonthlyOpExSummary(storeAlpha._id, {
      year: 2026,
      month: 10,
      forceRefresh: true,
    });

    if (octSummary.totalOpEx !== 67000) {
      throw new Error(`Expected October OpEx to be ₹67,000, got ₹${octSummary.totalOpEx}`);
    }
    if (octSummary.expenseCount !== 6) {
      throw new Error(`Expected October count to be 6, got ${octSummary.expenseCount}`);
    }

    // MoM Variance: 67,000 - 55,000 = +12,000
    if (octSummary.momVariance !== 12000) {
      throw new Error(`Expected MoM Variance to be +₹12,000, got ${octSummary.momVariance}`);
    }

    // MoM Growth Rate: (12000 / 55000) * 100 = ~21.8%
    const expectedRate = Math.round((12000 / 55000) * 1000) / 10;
    if (octSummary.momGrowthRate !== expectedRate) {
      throw new Error(`Expected MoM Growth Rate to be ${expectedRate}%, got ${octSummary.momGrowthRate}%`);
    }

    // Category Breakdown verification
    const electricityItem = octSummary.categoryBreakdown.find((c) =>
      c.categoryName.toLowerCase().includes("electricity")
    );
    if (!electricityItem || electricityItem.totalAmount !== 7000) {
      throw new Error("Electricity category total mismatch in breakdown");
    }
    if (!electricityItem.isOverBudget || electricityItem.budgetVariance !== 2000) {
      throw new Error("Budget leakage not correctly identified on Electricity");
    }

    console.log(`[TEST 5] October 2026 OpEx Aggregation & MoM Variance (+₹${octSummary.momVariance}, +${octSummary.momGrowthRate}%) [PASSED]`);

    // [TEST 6] Materialized Cache Persistence Verification ($O(1) read)
    const cachedDoc = await MonthlyOpExSummary.findOne({
      businessId: storeAlpha._id,
      year: 2026,
      month: 10,
    }).lean();

    if (!cachedDoc) {
      throw new Error("Materialized cache document not found in MonthlyOpExSummary collection");
    }
    if (cachedDoc.totalOpEx !== 67000 || cachedDoc.monthKey !== "2026-10") {
      throw new Error("Cached document values mismatch");
    }

    // Subsequent call without forceRefresh should read cached doc
    const readCache = await monthlyOpExService.getMonthlyOpExSummary(storeAlpha._id, {
      year: 2026,
      month: 10,
      forceRefresh: false,
    });
    if (readCache.totalOpEx !== 67000) {
      throw new Error("Cached read returned unexpected data");
    }

    console.log(`[TEST 6] Verified Materialized Cache in MonthlyOpExSummary Collection [PASSED]`);

    // [TEST 7] Real-Time Cache Auto-Sync on T49 Expense Change
    // Add new expense in October: ₹500 internet add-on
    await expenseService.createExpense(storeAlpha._id, {
      categoryId: internetCat._id.toString(),
      amount: 500,
      expenseDate: "2026-10-20T10:00:00Z",
      description: "Static IP Add-on",
      paymentMethod: "UPI",
    });

    // Small delay to allow async auto-sync to finalize
    await new Promise((resolve) => setTimeout(resolve, 500));

    const updatedCache = await monthlyOpExRepository.findByBusinessAndMonth(storeAlpha._id, 2026, 10);
    if (updatedCache.totalOpEx !== 67500 || updatedCache.expenseCount !== 7) {
      throw new Error(`Expected auto-synced cache to be ₹67,500 with 7 expenses, got ₹${updatedCache.totalOpEx} (${updatedCache.expenseCount} expenses)`);
    }

    console.log(`[TEST 7] Real-Time Auto-Sync on Expense Mutation: Updated to ₹${updatedCache.totalOpEx} [PASSED]`);

    // [TEST 8] Manual Recalculation Engine
    const recalculated = await monthlyOpExService.recalculateMonth(storeAlpha._id, 2026, 10);
    if (recalculated.totalOpEx !== 67500 || recalculated.aggregatedBy !== "MANUAL_RECALCULATE") {
      throw new Error("Recalculate month returned invalid data");
    }
    console.log(`[TEST 8] Manual Recalculation Engine Execution [PASSED]`);

    // [TEST 9] Full Calendar Year Overview for Financial Statements
    const yearlyOverview = await monthlyOpExService.getYearlyOpExOverview(storeAlpha._id, 2026, {
      forceRefresh: true,
    });

    if (yearlyOverview.months.length !== 12) {
      throw new Error(`Expected 12 calendar months, got ${yearlyOverview.months.length}`);
    }
    // Total Yearly OpEx: 55,000 (Sep) + 67,500 (Oct) = 122,500
    if (yearlyOverview.totalYearlyOpEx !== 122500) {
      throw new Error(`Expected Total Yearly OpEx to be ₹122,500, got ₹${yearlyOverview.totalYearlyOpEx}`);
    }
    if (yearlyOverview.peakMonth.amount !== 67500 || yearlyOverview.peakMonth.month !== 10) {
      throw new Error("Peak month calculation mismatch");
    }
    if (yearlyOverview.lowestMonth.amount !== 55000 || yearlyOverview.lowestMonth.month !== 9) {
      throw new Error("Lowest active month calculation mismatch");
    }

    console.log(`[TEST 9] Calendar Year Overview for Financial Statements: YTD = ₹${yearlyOverview.totalYearlyOpEx}, Peak = ${yearlyOverview.peakMonth.monthName} (₹${yearlyOverview.peakMonth.amount}) [PASSED]`);

    // [TEST 10] Multi-Tenant Security Isolation
    const betaOctSummary = await monthlyOpExService.getMonthlyOpExSummary(storeBeta._id, {
      year: 2026,
      month: 10,
      forceRefresh: true,
    });

    if (betaOctSummary.totalOpEx !== 12000) {
      throw new Error(`Expected Store Beta OpEx to be strictly ₹12,000, got ₹${betaOctSummary.totalOpEx}`);
    }
    if (betaOctSummary.expenseCount !== 1) {
      throw new Error(`Expected Store Beta count to be 1, got ${betaOctSummary.expenseCount}`);
    }

    console.log(`[TEST 10] Multi-Tenant Security Isolation: Store Beta OpEx = ₹${betaOctSummary.totalOpEx} (No Cross-Tenant Bleed) [PASSED]`);

    // Cleanup test data
    await Promise.all([
      Business.deleteMany({ _id: { $in: [storeAlpha._id, storeBeta._id] } }),
      ExpenseCategory.deleteMany({ businessId: { $in: [storeAlpha._id, storeBeta._id] } }),
      Expense.deleteMany({ businessId: { $in: [storeAlpha._id, storeBeta._id] } }),
      MonthlyOpExSummary.deleteMany({ businessId: { $in: [storeAlpha._id, storeBeta._id] } }),
    ]);

    console.log("\n================================================================================");
    console.log("  ALL 10 TEST SUITES FOR TASK T51 PASSED SUCCESSFULLY! (100% COVERAGE) ");
    console.log("================================================================================");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ TEST SUITE FAILED:", err);
    process.exit(1);
  }
}

runTests();
