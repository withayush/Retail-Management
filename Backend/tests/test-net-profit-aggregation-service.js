const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const netProfitAnalyticsService = require("../src/services/netProfitAnalytics.service");
const Business = require("../src/models/business.model");
const Product = require("../src/models/product.model");
const Invoice = require("../src/models/invoice.model");
const SaleItem = require("../src/models/saleItem.model");
const Expense = require("../src/models/expense.model");
const ExpenseCategory = require("../src/models/expenseCategory.model");
const MonthlyNetProfitSummary = require("../src/models/monthlyNetProfitSummary.model");
const MonthlyGrossProfitSummary = require("../src/models/monthlyGrossProfitSummary.model");
const MonthlyOpExSummary = require("../src/models/monthlyOpExSummary.model");
const MonthlyRevenueSummary = require("../src/models/monthlyRevenueSummary.model");
const MonthlyCogsSummary = require("../src/models/monthlyCogsSummary.model");

async function runTests() {
  console.log("===============================================================================");
  console.log("  PHASE 9 - TASK T56: NET PROFIT AGGREGATION SERVICE TEST SUITE               ");
  console.log("===============================================================================");

  const mongoUri =
    process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/vendoros";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB successfully.\n");

  const runId = Date.now().toString().slice(-6);
  const storeAlphaId = new mongoose.Types.ObjectId();
  const storeBetaId = new mongoose.Types.ObjectId();
  const dummyCatId = new mongoose.Types.ObjectId();
  const accountId = new mongoose.Types.ObjectId();

  try {
    // -------------------------------------------------------------
    // SETUP: Clean up test collections
    // -------------------------------------------------------------
    await Invoice.deleteMany({ businessId: { $in: [storeAlphaId, storeBetaId] } });
    await SaleItem.deleteMany({ businessId: { $in: [storeAlphaId, storeBetaId] } });
    await Product.deleteMany({ businessId: { $in: [storeAlphaId, storeBetaId] } });
    await Expense.deleteMany({ businessId: { $in: [storeAlphaId, storeBetaId] } });
    await ExpenseCategory.deleteMany({ businessId: { $in: [storeAlphaId, storeBetaId] } });
    await MonthlyNetProfitSummary.deleteMany({ businessId: { $in: [storeAlphaId, storeBetaId] } });
    await MonthlyGrossProfitSummary.deleteMany({ businessId: { $in: [storeAlphaId, storeBetaId] } });
    await MonthlyOpExSummary.deleteMany({ businessId: { $in: [storeAlphaId, storeBetaId] } });
    await MonthlyRevenueSummary.deleteMany({ businessId: { $in: [storeAlphaId, storeBetaId] } });
    await MonthlyCogsSummary.deleteMany({ businessId: { $in: [storeAlphaId, storeBetaId] } });

    // -------------------------------------------------------------
    // GROUP 1: SETUP STORES AND PRODUCTS
    // -------------------------------------------------------------
    console.log("--> Group 1: Setting up Multi-Tenant Stores & Catalog Products");
    const prodAlpha = await Product.create({
      businessId: storeAlphaId,
      categoryId: dummyCatId,
      name: "Commercial Pack A",
      sku: `PROD-A-${runId}`,
      sellingPrice: 500,
      costPrice: 300,
      currentStock: 5000,
    });

    console.log("  [PASS] Product created: Cost ₹300, Selling ₹500.");

    // -------------------------------------------------------------
    // GROUP 2: REPRODUCE PROMPT BENCHMARK SCENARIO (OCTOBER 2026)
    // Revenue = ₹5,00,000 (1000 units @ ₹500)
    // COGS    = ₹3,00,000 (1000 units @ ₹300)
    // Gross Profit = ₹2,00,000
    // OpEx    = ₹65,000
    // Net Profit = ₹1,35,000 (27% margin)
    // -------------------------------------------------------------
    console.log("\n--> Group 2: Generating October 2026 Sales & Operating Expenses (Benchmark)");
    const octSaleDate = new Date(Date.UTC(2026, 9, 12, 10, 0, 0)); // 12 Oct 2026

    const octInvoice = await Invoice.create({
      businessId: storeAlphaId,
      invoiceNumber: `INV-OCT-${runId}`,
      customerName: "Bulk Trader",
      subtotal: 500000,
      total: 500000,
      paidAmount: 500000,
      dueAmount: 0,
      paymentStatus: "PAID",
      status: "COMPLETED",
      createdAt: octSaleDate,
    });

    await SaleItem.create({
      businessId: storeAlphaId,
      saleId: octInvoice._id,
      productId: prodAlpha._id,
      name: prodAlpha.name,
      sku: prodAlpha.sku,
      quantity: 1000,
      costPrice: 300, // 1000 * 300 = 300,000 COGS
      soldPrice: 500, // 1000 * 500 = 500,000 Revenue
      totalPrice: 500000,
      createdAt: octSaleDate,
    });

    // Seed Expenses for October: ₹65,000
    const rentExp = await Expense.create({
      businessId: storeAlphaId,
      expenseNumber: `EXP-RENT-${runId}`,
      categoryId: dummyCatId,
      categoryName: "Store Rent",
      amount: 40000,
      taxAmount: 0,
      expenseDate: new Date("2026-10-01T10:00:00.000Z"),
      paymentMethod: "BANK_TRANSFER",
      status: "PAID",
      createdBy: accountId,
    });

    const salaryExp = await Expense.create({
      businessId: storeAlphaId,
      expenseNumber: `EXP-SALARY-${runId}`,
      categoryId: dummyCatId,
      categoryName: "Staff Salaries",
      amount: 25000,
      taxAmount: 0,
      expenseDate: new Date("2026-10-05T10:00:00.000Z"),
      paymentMethod: "BANK_TRANSFER",
      status: "PAID",
      createdBy: accountId,
    });

    console.log("  [PASS] Seeded Revenue: ₹5,00,000, COGS: ₹3,00,000, OpEx: ₹65,000.");

    // -------------------------------------------------------------
    // GROUP 3: VERIFY NET PROFIT FORMULA (OCTOBER 2026)
    // Formula: Net Profit = Gross Profit - OpEx = 200,000 - 65,000 = 135,000
    // Net Margin % = (135,000 / 500,000) * 100 = 27%
    // -------------------------------------------------------------
    console.log("\n--> Group 3: Testing Core Formula: Net Profit = Gross Profit - Operating Expenses");
    const octNetProfitData = await netProfitAnalyticsService.calculatePeriodNetProfit(
      storeAlphaId,
      {
        month: "2026-10",
      }
    );

    console.log("  Revenue:", octNetProfitData.revenue);
    console.log("  COGS:", octNetProfitData.cogs);
    console.log("  Gross Profit:", octNetProfitData.grossProfit);
    console.log("  OpEx:", octNetProfitData.operatingExpenses);
    console.log("  Net Profit:", octNetProfitData.netProfit);
    console.log("  Net Profit Margin %:", octNetProfitData.netProfitMargin);
    console.log("  Status:", octNetProfitData.status);

    if (octNetProfitData.revenue !== 500000) {
      throw new Error(`Expected revenue 500000, got ${octNetProfitData.revenue}`);
    }
    if (octNetProfitData.cogs !== 300000) {
      throw new Error(`Expected cogs 300000, got ${octNetProfitData.cogs}`);
    }
    if (octNetProfitData.grossProfit !== 200000) {
      throw new Error(`Expected grossProfit 200000, got ${octNetProfitData.grossProfit}`);
    }
    if (octNetProfitData.operatingExpenses !== 65000) {
      throw new Error(`Expected operatingExpenses 65000, got ${octNetProfitData.operatingExpenses}`);
    }
    if (octNetProfitData.netProfit !== 135000) {
      throw new Error(`Expected netProfit 135000, got ${octNetProfitData.netProfit}`);
    }
    if (octNetProfitData.netProfitMargin !== 27) {
      throw new Error(`Expected netProfitMargin 27%, got ${octNetProfitData.netProfitMargin}`);
    }
    if (octNetProfitData.status !== "PROFITABLE") {
      throw new Error(`Expected status PROFITABLE, got ${octNetProfitData.status}`);
    }
    console.log("  [PASS] Core Formula matches prompt benchmark: Net Profit = ₹1,35,000 (27%).");

    // -------------------------------------------------------------
    // GROUP 4: LOSS MAKING SCENARIO (Expenses = ₹2,20,000 -> Net Profit = -₹20,000)
    // Matches prompt example: Gross Profit = ₹2,00,000, OpEx = ₹2,20,000 -> Net Profit = -₹20,000
    // -------------------------------------------------------------
    console.log("\n--> Group 4: Testing Loss Making Scenario (OpEx ₹2,20,000 -> Net Loss -₹20,000)");
    const extraLossExp = await Expense.create({
      businessId: storeAlphaId,
      expenseNumber: `EXP-LOSS-${runId}`,
      categoryId: dummyCatId,
      categoryName: "Store Renovation",
      amount: 155000, // 65000 + 155000 = 220000
      taxAmount: 0,
      expenseDate: new Date("2026-10-25T10:00:00.000Z"),
      paymentMethod: "BANK_TRANSFER",
      status: "PAID",
      createdBy: accountId,
    });

    const lossPeriodRes = await netProfitAnalyticsService.calculatePeriodNetProfit(
      storeAlphaId,
      {
        month: "2026-10",
      }
    );

    console.log("  Gross Profit:", lossPeriodRes.grossProfit);
    console.log("  OpEx:", lossPeriodRes.operatingExpenses);
    console.log("  Net Profit:", lossPeriodRes.netProfit);
    console.log("  Status:", lossPeriodRes.status);

    if (lossPeriodRes.operatingExpenses !== 220000) {
      throw new Error(`Expected OpEx 220000, got ${lossPeriodRes.operatingExpenses}`);
    }
    if (lossPeriodRes.netProfit !== -20000) {
      throw new Error(`Expected Net Loss -20000, got ${lossPeriodRes.netProfit}`);
    }
    if (lossPeriodRes.status !== "LOSS_MAKING") {
      throw new Error(`Expected status LOSS_MAKING, got ${lossPeriodRes.status}`);
    }
    console.log("  [PASS] Loss making scenario verified: Net Loss = -₹20,000 (LOSS_MAKING).");

    // Remove extra expense to restore ₹1,35,000 benchmark
    await Expense.deleteOne({ _id: extraLossExp._id });

    // -------------------------------------------------------------
    // GROUP 5: BREAK-EVEN SCENARIO
    // -------------------------------------------------------------
    console.log("\n--> Group 5: Testing Break-Even Scenario (GP = OpEx)");
    const breakEvenExp = await Expense.create({
      businessId: storeAlphaId,
      expenseNumber: `EXP-BE-${runId}`,
      categoryId: dummyCatId,
      categoryName: "Equip Lease",
      amount: 135000, // 65000 + 135000 = 200000 = GP
      taxAmount: 0,
      expenseDate: new Date("2026-10-26T10:00:00.000Z"),
      paymentMethod: "BANK_TRANSFER",
      status: "PAID",
      createdBy: accountId,
    });

    const breakEvenRes = await netProfitAnalyticsService.calculatePeriodNetProfit(
      storeAlphaId,
      {
        month: "2026-10",
      }
    );

    if (breakEvenRes.netProfit !== 0) {
      throw new Error(`Expected Net Profit 0, got ${breakEvenRes.netProfit}`);
    }
    if (breakEvenRes.status !== "BREAK_EVEN") {
      throw new Error(`Expected status BREAK_EVEN, got ${breakEvenRes.status}`);
    }
    console.log("  [PASS] Break-even scenario validated: Net Profit = ₹0 (BREAK_EVEN).");

    await Expense.deleteOne({ _id: breakEvenExp._id });

    // -------------------------------------------------------------
    // GROUP 6: CUSTOM DATE RANGE QUERY (?from=2026-10-01&to=2026-10-31)
    // Matches PRD Ideal Endpoint Specification
    // -------------------------------------------------------------
    console.log("\n--> Group 6: Custom Date Range Query (from=2026-10-01 & to=2026-10-31)");
    const customRangeRes = await netProfitAnalyticsService.calculatePeriodNetProfit(
      storeAlphaId,
      {
        from: "2026-10-01",
        to: "2026-10-31",
      }
    );

    if (customRangeRes.netProfit !== 135000) {
      throw new Error(`Expected Net Profit 135000, got ${customRangeRes.netProfit}`);
    }
    if (customRangeRes.period.from !== "2026-10-01" || customRangeRes.period.to !== "2026-10-31") {
      throw new Error(`Unexpected custom date boundaries: ${customRangeRes.period.from} to ${customRangeRes.period.to}`);
    }
    console.log(`  [PASS] Custom range verified: from ${customRangeRes.period.from} to ${customRangeRes.period.to}, Net Profit: ₹${customRangeRes.netProfit}`);

    // -------------------------------------------------------------
    // GROUP 7: ZERO-REVENUE DIVISION-BY-ZERO SAFETY
    // -------------------------------------------------------------
    console.log("\n--> Group 7: Zero-Revenue Guard (No NaN / Infinity)");
    const zeroRevRes = await netProfitAnalyticsService.calculatePeriodNetProfit(
      storeAlphaId,
      {
        from: "2026-01-01",
        to: "2026-01-31",
      }
    );
    if (Number.isNaN(zeroRevRes.netProfitMargin) || !Number.isFinite(zeroRevRes.netProfitMargin)) {
      throw new Error(`Expected numeric netProfitMargin, got ${zeroRevRes.netProfitMargin}`);
    }
    if (zeroRevRes.netProfitMargin !== 0) {
      throw new Error(`Expected 0% margin on 0 revenue, got ${zeroRevRes.netProfitMargin}%`);
    }
    console.log("  [PASS] Zero-revenue division guard verified: margin is exactly 0%.");

    // -------------------------------------------------------------
    // GROUP 8: COST BREAKDOWN WATERFALL SHARES (% OF REVENUE)
    // -------------------------------------------------------------
    console.log("\n--> Group 8: Cost Breakdown Waterfall Shares");
    const waterfall = customRangeRes.costBreakdown;
    console.log("  COGS Share %:", waterfall.cogsShare);
    console.log("  OpEx Share %:", waterfall.opexShare);
    console.log("  Net Profit Share %:", waterfall.netProfitShare);

    if (waterfall.cogsShare !== 60) {
      throw new Error(`Expected COGS share 60%, got ${waterfall.cogsShare}%`);
    }
    if (waterfall.opexShare !== 13) {
      throw new Error(`Expected OpEx share 13%, got ${waterfall.opexShare}%`);
    }
    if (waterfall.netProfitShare !== 27) {
      throw new Error(`Expected Net Profit share 27%, got ${waterfall.netProfitShare}%`);
    }
    console.log("  [PASS] Waterfall distribution shares verified: 60% COGS + 13% OpEx + 27% Net Profit = 100%.");

    // -------------------------------------------------------------
    // GROUP 9: CALENDAR-MONTH MATERIALIZED CACHING & DAILY LEDGER
    // -------------------------------------------------------------
    console.log("\n--> Group 9: Calendar-Month Materialized Cache in MonthlyNetProfitSummary");
    const cachedOct = await netProfitAnalyticsService.aggregateAndCacheMonth(
      storeAlphaId,
      2026,
      10,
      "MANUAL_RECALCULATE"
    );

    if (!cachedOct._id) {
      throw new Error("Expected saved document with _id.");
    }
    if (cachedOct.netProfit !== 135000) {
      throw new Error(`Expected cached Net Profit 135000, got ${cachedOct.netProfit}`);
    }
    if (!cachedOct.dailyBreakdown || cachedOct.dailyBreakdown.length !== 31) {
      throw new Error(`Expected 31 daily breakdown entries for October, got ${cachedOct.dailyBreakdown?.length}`);
    }
    console.log(`  [PASS] Materialized cache document saved: ${cachedOct._id} with 31 daily ledger items.`);

    // -------------------------------------------------------------
    // GROUP 10: 12-MONTH FISCAL YEAR PROGRESSION
    // -------------------------------------------------------------
    console.log("\n--> Group 10: 12-Month Fiscal Year Progression & Annual Bottom-Line Summary");
    const overview12M = await netProfitAnalyticsService.getMonthlyNetProfitOverview(
      storeAlphaId,
      { year: 2026 }
    );
    if (overview12M.months.length !== 12) {
      throw new Error(`Expected 12 months, got ${overview12M.months.length}`);
    }
    if (overview12M.ytdNetProfit !== 135000) {
      throw new Error(`Expected YTD Net Profit 135000, got ${overview12M.ytdNetProfit}`);
    }
    console.log(`  [PASS] 12-Month progression generated. YTD Net Profit: ₹${overview12M.ytdNetProfit}.`);

    // -------------------------------------------------------------
    // GROUP 11: MULTI-TENANT SECURITY BOUNDARY ISOLATION
    // -------------------------------------------------------------
    console.log("\n--> Group 11: Verifying Strict Multi-Tenant Security Isolation");
    const storeBetaRes = await netProfitAnalyticsService.calculatePeriodNetProfit(
      storeBetaId,
      {
        month: "2026-10",
      }
    );
    if (storeBetaRes.revenue !== 0 || storeBetaRes.netProfit !== 0) {
      throw new Error(`Expected Store Beta Net Profit to be 0, got ${storeBetaRes.netProfit}`);
    }
    console.log("  [PASS] Store Beta completely isolated from Store Alpha records (Net Profit = ₹0).");

    console.log("\n===============================================================================");
    console.log("  ALL 11 TEST GROUPS FOR T56 NET PROFIT SERVICE PASSED SUCCESSFULLY!          ");
    console.log("===============================================================================\n");
  } finally {
    // Cleanup
    await Invoice.deleteMany({ businessId: { $in: [storeAlphaId, storeBetaId] } });
    await SaleItem.deleteMany({ businessId: { $in: [storeAlphaId, storeBetaId] } });
    await Product.deleteMany({ businessId: { $in: [storeAlphaId, storeBetaId] } });
    await Expense.deleteMany({ businessId: { $in: [storeAlphaId, storeBetaId] } });
    await ExpenseCategory.deleteMany({ businessId: { $in: [storeAlphaId, storeBetaId] } });
    await MonthlyNetProfitSummary.deleteMany({ businessId: { $in: [storeAlphaId, storeBetaId] } });
    await MonthlyGrossProfitSummary.deleteMany({ businessId: { $in: [storeAlphaId, storeBetaId] } });
    await MonthlyOpExSummary.deleteMany({ businessId: { $in: [storeAlphaId, storeBetaId] } });
    await MonthlyRevenueSummary.deleteMany({ businessId: { $in: [storeAlphaId, storeBetaId] } });
    await MonthlyCogsSummary.deleteMany({ businessId: { $in: [storeAlphaId, storeBetaId] } });
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

runTests().catch((err) => {
  console.error("Test Suite Failed:", err);
  process.exit(1);
});
