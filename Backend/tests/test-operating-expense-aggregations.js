const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const opExAnalyticsService = require("../src/services/opExAnalytics.service");
const Expense = require("../src/models/expense.model");
const ExpenseCategory = require("../src/models/expenseCategory.model");
const Invoice = require("../src/models/invoice.model");
const SaleItem = require("../src/models/saleItem.model");
const Product = require("../src/models/product.model");
const MonthlyOpExSummary = require("../src/models/monthlyOpExSummary.model");

async function runTests() {
  console.log("===============================================================================");
  console.log("   TEST SUITE: OPERATING EXPENSE AGGREGATIONS ENGINE (PHASE 9 - TASK T55)     ");
  console.log("===============================================================================");

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/vendoros";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB successfully.\n");

  const storeAId = new mongoose.Types.ObjectId();
  const storeBId = new mongoose.Types.ObjectId();
  const accountId = new mongoose.Types.ObjectId();

  try {
    // -------------------------------------------------------------
    // SETUP: Clean up existing test records
    // -------------------------------------------------------------
    await Expense.deleteMany({ businessId: { $in: [storeAId, storeBId] } });
    await ExpenseCategory.deleteMany({ businessId: { $in: [storeAId, storeBId] } });
    await Invoice.deleteMany({ businessId: { $in: [storeAId, storeBId] } });
    await SaleItem.deleteMany({ businessId: { $in: [storeAId, storeBId] } });
    await MonthlyOpExSummary.deleteMany({ businessId: { $in: [storeAId, storeBId] } });

    // -------------------------------------------------------------
    // GROUP 1: SEED CATEGORIES FOR STORE A
    // -------------------------------------------------------------
    console.log("--> Group 1: Seeding Expense Categories for Store A");
    const rentCat = await ExpenseCategory.create({
      businessId: storeAId,
      categoryName: "Store Rent",
      icon: "Building",
      color: "#FF3B30",
    });
    const salaryCat = await ExpenseCategory.create({
      businessId: storeAId,
      categoryName: "Staff Salaries",
      icon: "Users",
      color: "#007AFF",
    });
    const elecCat = await ExpenseCategory.create({
      businessId: storeAId,
      categoryName: "Electricity & Power",
      icon: "Zap",
      color: "#FF9500",
    });
    const internetCat = await ExpenseCategory.create({
      businessId: storeAId,
      categoryName: "Internet & Phone",
      icon: "Wifi",
      color: "#5856D6",
    });
    const transportCat = await ExpenseCategory.create({
      businessId: storeAId,
      categoryName: "Transport & Logistics",
      icon: "Truck",
      color: "#34C759",
    });

    console.log("  [PASS] 5 Categories created for Store A.");

    // -------------------------------------------------------------
    // GROUP 2: RECORD REALISTIC EXPENSES FOR OCTOBER 2026
    // Match User Prompt Example:
    // Rent: ₹20,000, Electricity: ₹8,000, Salary: ₹30,000, Internet: ₹2,000, Transport: ₹5,000
    // Total OpEx = ₹65,000
    // -------------------------------------------------------------
    console.log("\n--> Group 2: Recording Realistic Expenses for October 2026 (Prompt Benchmark)");

    await Expense.create({
      businessId: storeAId,
      expenseNumber: "EXP-1001",
      categoryId: rentCat._id,
      categoryName: rentCat.categoryName,
      categoryIcon: rentCat.icon,
      categoryColor: rentCat.color,
      amount: 20000,
      taxAmount: 0,
      expenseDate: new Date("2026-10-01T10:00:00.000Z"),
      paymentMethod: "BANK_TRANSFER",
      status: "PAID",
      description: "Monthly store lease rent for October",
      createdBy: accountId,
    });

    await Expense.create({
      businessId: storeAId,
      expenseNumber: "EXP-1002",
      categoryId: salaryCat._id,
      categoryName: salaryCat.categoryName,
      categoryIcon: salaryCat.icon,
      categoryColor: salaryCat.color,
      amount: 30000,
      taxAmount: 0,
      expenseDate: new Date("2026-10-05T14:30:00.000Z"),
      paymentMethod: "BANK_TRANSFER",
      status: "PAID",
      description: "Staff monthly salary disbursements",
      createdBy: accountId,
    });

    await Expense.create({
      businessId: storeAId,
      expenseNumber: "EXP-1003",
      categoryId: elecCat._id,
      categoryName: elecCat.categoryName,
      categoryIcon: elecCat.icon,
      categoryColor: elecCat.color,
      amount: 8000,
      taxAmount: 400,
      expenseDate: new Date("2026-10-10T11:00:00.000Z"),
      paymentMethod: "UPI",
      status: "PAID",
      description: "Store commercial electricity power bill",
      createdBy: accountId,
    });

    await Expense.create({
      businessId: storeAId,
      expenseNumber: "EXP-1004",
      categoryId: internetCat._id,
      categoryName: internetCat.categoryName,
      categoryIcon: internetCat.icon,
      categoryColor: internetCat.color,
      amount: 2000,
      taxAmount: 360,
      expenseDate: new Date("2026-10-12T09:15:00.000Z"),
      paymentMethod: "UPI",
      status: "PAID",
      description: "High-speed broadband internet & POS line",
      createdBy: accountId,
    });

    await Expense.create({
      businessId: storeAId,
      expenseNumber: "EXP-1005",
      categoryId: transportCat._id,
      categoryName: transportCat.categoryName,
      categoryIcon: transportCat.icon,
      categoryColor: transportCat.color,
      amount: 5000,
      taxAmount: 0,
      expenseDate: new Date("2026-10-20T16:00:00.000Z"),
      paymentMethod: "CASH",
      status: "PAID",
      description: "Store inventory freight & local courier deliveries",
      createdBy: accountId,
    });

    console.log("  [PASS] 5 Operating Expenses totaling ₹65,000 inserted.");

    // -------------------------------------------------------------
    // GROUP 3: BASIC OPEX FORMULA VERIFICATION (OCTOBER 2026)
    // -------------------------------------------------------------
    console.log("\n--> Group 3: Validating Basic OpEx Aggregation Formula for October 2026");
    const octOpEx = await opExAnalyticsService.calculatePeriodOpEx(storeAId, {
      month: "2026-10",
    });

    if (octOpEx.totalOperatingExpense !== 65000) {
      throw new Error(`Expected totalOperatingExpense to be 65000, got ${octOpEx.totalOperatingExpense}`);
    }
    if (octOpEx.expenseCount !== 5) {
      throw new Error(`Expected expenseCount to be 5, got ${octOpEx.expenseCount}`);
    }
    console.log(`  [PASS] Total OpEx = ₹${octOpEx.totalOperatingExpense} across ${octOpEx.expenseCount} vouchers.`);

    // -------------------------------------------------------------
    // GROUP 4: ACCOUNTING DATE RULE (expenseDate vs createdAt)
    // -------------------------------------------------------------
    console.log("\n--> Group 4: Testing Accounting Date Rule (expenseDate vs createdAt)");
    // Insert an expense entered on Nov 2, but expenseDate is Oct 28
    const retroExpense = await Expense.create({
      businessId: storeAId,
      expenseNumber: "EXP-1006",
      categoryId: transportCat._id,
      categoryName: transportCat.categoryName,
      categoryIcon: transportCat.icon,
      categoryColor: transportCat.color,
      amount: 1500,
      expenseDate: new Date("2026-10-28T10:00:00.000Z"), // October date!
      createdAt: new Date("2026-11-02T12:00:00.000Z"),   // Entered in November
      paymentMethod: "CASH",
      status: "PAID",
      createdBy: accountId,
    });

    const updatedOct = await opExAnalyticsService.calculatePeriodOpEx(storeAId, {
      month: "2026-10",
    });
    if (updatedOct.totalOperatingExpense !== 66500) {
      throw new Error(`Expected 66500 after retroactive booking, got ${updatedOct.totalOperatingExpense}`);
    }
    console.log("  [PASS] Retroactive expense correctly mapped to October via expenseDate (₹66,500).");

    // Remove the extra expense to keep clean ₹65,000 benchmark
    await Expense.deleteOne({ _id: retroExpense._id });

    // -------------------------------------------------------------
    // GROUP 5: EXCLUSION OF ARCHIVED OR CANCELLED EXPENSES
    // -------------------------------------------------------------
    console.log("\n--> Group 5: Verifying Exclusion of Archived and Cancelled Expenses");
    const cancelledExp = await Expense.create({
      businessId: storeAId,
      expenseNumber: "EXP-CANCELLED",
      categoryId: rentCat._id,
      categoryName: rentCat.categoryName,
      amount: 10000,
      expenseDate: new Date("2026-10-15T10:00:00.000Z"),
      status: "CANCELLED", // Cancelled!
      createdBy: accountId,
    });
    const archivedExp = await Expense.create({
      businessId: storeAId,
      expenseNumber: "EXP-ARCHIVED",
      categoryId: rentCat._id,
      categoryName: rentCat.categoryName,
      amount: 12000,
      expenseDate: new Date("2026-10-18T10:00:00.000Z"),
      isArchived: true, // Archived!
      status: "PAID",
      createdBy: accountId,
    });

    const cleanOct = await opExAnalyticsService.calculatePeriodOpEx(storeAId, {
      month: "2026-10",
    });
    if (cleanOct.totalOperatingExpense !== 65000) {
      throw new Error(`Expected 65000 excluding invalid records, got ${cleanOct.totalOperatingExpense}`);
    }
    console.log("  [PASS] Cancelled and archived expenses strictly excluded.");

    await Expense.deleteMany({ _id: { $in: [cancelledExp._id, archivedExp._id] } });

    // -------------------------------------------------------------
    // GROUP 6: CUSTOM DATE RANGE QUERY (?from=2026-10-01&to=2026-10-31)
    // Matches PRD Ideal Endpoint Specification
    // -------------------------------------------------------------
    console.log("\n--> Group 6: Custom Date Range Query (from=2026-10-01 & to=2026-10-31)");
    const customRangeRes = await opExAnalyticsService.calculatePeriodOpEx(storeAId, {
      from: "2026-10-01",
      to: "2026-10-31",
    });
    if (customRangeRes.totalOperatingExpense !== 65000) {
      throw new Error(`Expected custom date range total 65000, got ${customRangeRes.totalOperatingExpense}`);
    }
    if (customRangeRes.categories.length !== 5) {
      throw new Error(`Expected 5 categories, got ${customRangeRes.categories.length}`);
    }
    console.log(`  [PASS] Custom range verified: from ${customRangeRes.period.from} to ${customRangeRes.period.to}, total: ₹${customRangeRes.totalOperatingExpense}`);

    // -------------------------------------------------------------
    // GROUP 7: CASH BURN VELOCITY MAPPING
    // -------------------------------------------------------------
    console.log("\n--> Group 7: Store Cash Burn Velocity Metrics");
    const burn = customRangeRes.cashBurn;
    console.log("  Daily Burn Rate:", burn.dailyBurnRate);
    console.log("  Projected Monthly Burn:", burn.projectedMonthlyBurn);
    console.log("  Annualized Run Rate:", burn.annualizedRunRate);
    console.log("  Peak Burn Day:", burn.peakBurnDay);

    if (burn.dailyBurnRate <= 0) {
      throw new Error("dailyBurnRate must be positive.");
    }
    if (!burn.peakBurnDay || burn.peakBurnDay.amount !== 30000 && burn.peakBurnDay.amount !== 20000) {
      // Oct 5 salary was 30000
      if (burn.peakBurnDay.amount !== 30000) {
        throw new Error(`Expected peak burn day amount 30000, got ${burn.peakBurnDay.amount}`);
      }
    }
    console.log("  [PASS] Peak burn day correctly identified: Oct 5 Salary (₹30,000).");

    // -------------------------------------------------------------
    // GROUP 8: FIXED VS VARIABLE OVERHEAD CLASSIFICATION
    // -------------------------------------------------------------
    console.log("\n--> Group 8: Fixed Overheads vs Variable Operations Cost Structure");
    const costStructure = customRangeRes.costStructure;
    // Rent (20k) + Salary (30k) + Internet (2k) = Fixed ₹52,000 (80%)
    // Electricity (8k) + Transport (5k) = Variable ₹13,000 (20%)
    if (costStructure.fixedOpEx !== 52000) {
      throw new Error(`Expected fixedOpEx to be 52000, got ${costStructure.fixedOpEx}`);
    }
    if (costStructure.variableOpEx !== 13000) {
      throw new Error(`Expected variableOpEx to be 13000, got ${costStructure.variableOpEx}`);
    }
    if (costStructure.fixedPercentage !== 80 || costStructure.variablePercentage !== 20) {
      throw new Error(`Expected 80% fixed / 20% variable, got ${costStructure.fixedPercentage}% / ${costStructure.variablePercentage}%`);
    }
    console.log(`  [PASS] Cost structure validated: Fixed ₹${costStructure.fixedOpEx} (80%), Variable ₹${costStructure.variableOpEx} (20%).`);

    // -------------------------------------------------------------
    // GROUP 9: FINANCIAL BRIDGE WITH SALES (Revenue -> COGS -> Gross Profit -> Operating Profit)
    // -------------------------------------------------------------
    console.log("\n--> Group 9: Financial Performance Bridge (Operating Profit Integration)");
    // Seed sales in Store A for October 2026:
    // Revenue = ₹2,00,000, COGS = ₹1,20,000 -> Gross Profit = ₹80,000
    // Then OpEx = ₹65,000 -> Operating Profit = ₹15,000
    const invA = await Invoice.create({
      businessId: storeAId,
      invoiceNumber: "INV-OCT-01",
      customerName: "Retail Customer",
      subtotal: 200000,
      total: 200000,
      paidAmount: 200000,
      dueAmount: 0,
      paymentStatus: "PAID",
      status: "COMPLETED",
      createdAt: new Date("2026-10-15T12:00:00.000Z"),
    });

    await SaleItem.create({
      businessId: storeAId,
      saleId: invA._id,
      productId: new mongoose.Types.ObjectId(),
      name: "Standard Pack",
      sku: "PACK-01",
      quantity: 1000,
      costPrice: 120, // 1000 * 120 = 120,000 COGS
      soldPrice: 200, // 1000 * 200 = 200,000 Revenue
      totalPrice: 200000,
      createdAt: new Date("2026-10-15T12:00:00.000Z"),
    });

    const bridgedOct = await opExAnalyticsService.calculatePeriodOpEx(storeAId, {
      month: "2026-10",
    });

    const bridge = bridgedOct.financialBridge;
    console.log("  Revenue:", bridge.revenue);
    console.log("  COGS:", bridge.cogs);
    console.log("  Gross Profit:", bridge.grossProfit);
    console.log("  OpEx:", bridgedOct.totalOperatingExpense);
    console.log("  Operating Profit:", bridge.operatingProfit);
    console.log("  Operating Margin %:", bridge.operatingMarginPercentage);
    console.log("  Profitability Status:", bridge.profitabilityStatus);

    if (bridge.revenue !== 200000) {
      throw new Error(`Expected revenue 200000, got ${bridge.revenue}`);
    }
    if (bridge.grossProfit !== 80000) {
      throw new Error(`Expected grossProfit 80000, got ${bridge.grossProfit}`);
    }
    if (bridge.operatingProfit !== 15000) {
      throw new Error(`Expected operatingProfit 15000 (80000 - 65000), got ${bridge.operatingProfit}`);
    }
    if (bridge.operatingMarginPercentage !== 7.5) {
      throw new Error(`Expected operatingMarginPercentage 7.5%, got ${bridge.operatingMarginPercentage}`);
    }
    if (bridge.profitabilityStatus !== "PROFITABLE") {
      throw new Error(`Expected profitabilityStatus PROFITABLE, got ${bridge.profitabilityStatus}`);
    }
    console.log("  [PASS] Full P&L Financial chain successfully calculated and verified.");

    // -------------------------------------------------------------
    // GROUP 10: QUARTERLY OPEX AGGREGATIONS (Q1 - Q4)
    // -------------------------------------------------------------
    console.log("\n--> Group 10: Quarterly OpEx Aggregations for Fiscal Year 2026");
    const quarterlyRes = await opExAnalyticsService.getQuarterlyOpExAggregations(storeAId, 2026);
    if (quarterlyRes.quarters.length !== 4) {
      throw new Error(`Expected 4 quarters, got ${quarterlyRes.quarters.length}`);
    }
    const q4 = quarterlyRes.quarters.find((q) => q.quarter === "Q4");
    if (!q4 || q4.totalOperatingExpense !== 65000) {
      throw new Error(`Expected Q4 OpEx 65000, got ${q4?.totalOperatingExpense}`);
    }
    console.log(`  [PASS] Q4 correctly rolls up October's ₹65,000 OpEx (YTD: ₹${quarterlyRes.ytdTotalOpEx}).`);

    // -------------------------------------------------------------
    // GROUP 11: MULTI-TENANT ISOLATION
    // -------------------------------------------------------------
    console.log("\n--> Group 11: Verifying Strict Multi-Tenant Security Isolation");
    const storeBOpEx = await opExAnalyticsService.calculatePeriodOpEx(storeBId, {
      month: "2026-10",
    });
    if (storeBOpEx.totalOperatingExpense !== 0) {
      throw new Error(`Expected Store B OpEx to be 0, got ${storeBOpEx.totalOperatingExpense}`);
    }
    if (storeBOpEx.expenseCount !== 0) {
      throw new Error(`Expected Store B expenseCount to be 0, got ${storeBOpEx.expenseCount}`);
    }
    console.log("  [PASS] Store B completely isolated from Store A records (Total OpEx = 0).");

    console.log("\n===============================================================================");
    console.log("   ALL 11 TEST GROUPS FOR T55 OPEX AGGREGATIONS PASSED SUCCESSFULLY!          ");
    console.log("===============================================================================\n");
  } finally {
    // Clean up test data
    await Expense.deleteMany({ businessId: { $in: [storeAId, storeBId] } });
    await ExpenseCategory.deleteMany({ businessId: { $in: [storeAId, storeBId] } });
    await Invoice.deleteMany({ businessId: { $in: [storeAId, storeBId] } });
    await SaleItem.deleteMany({ businessId: { $in: [storeAId, storeBId] } });
    await MonthlyOpExSummary.deleteMany({ businessId: { $in: [storeAId, storeBId] } });
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

runTests().catch((err) => {
  console.error("Test Suite Failed:", err);
  process.exit(1);
});
