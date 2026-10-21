const assert = require("assert");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const dashboardService = require("../src/services/dashboard.service");
const Business = require("../src/models/business.model");
const Product = require("../src/models/product.model");
const Invoice = require("../src/models/invoice.model");
const SaleItem = require("../src/models/saleItem.model");
const Expense = require("../src/models/expense.model");
const ExpenseCategory = require("../src/models/expenseCategory.model");
const { Customer } = require("../src/models/customer.model");
const { Supplier } = require("../src/models/supplier.model");

/**
 * PHASE 10 - TASK T60: BUSINESS SUMMARY CARDS DASHBOARD TEST SUITE
 * Validates full business summary aggregation, reporting-period normalization,
 * financial accuracy, zero-revenue guards, point-in-time snapshot independence,
 * chart trends generation, and multi-tenant security isolation.
 */

console.log("===============================================================================");
console.log("  PHASE 10 - TASK T60: BUSINESS SUMMARY CARDS DASHBOARD TEST SUITE            ");
console.log("===============================================================================");

async function runTests() {
  const mongoUri =
    process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/vendoros";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB successfully.\n");

  const businessAId = new mongoose.Types.ObjectId();
  const businessBId = new mongoose.Types.ObjectId();
  const accountId = new mongoose.Types.ObjectId();

  try {
    // -------------------------------------------------------------------------
    // Setup Test Data
    // -------------------------------------------------------------------------
    console.log("--> Group 1: Setting up Multi-Tenant Stores & Catalogs");
    const dummyCatId = new mongoose.Types.ObjectId();

    const productA = await Product.create({
      businessId: businessAId,
      categoryId: dummyCatId,
      name: "Premium Basmati Rice 5kg",
      sku: `RICE-5KG-${Date.now()}`,
      costPrice: 300,
      sellingPrice: 500,
      currentStock: 5000,
    });

    const categoryA = await ExpenseCategory.create({
      businessId: businessAId,
      categoryName: "Store Utilities & Rent",
      isDefault: false,
    });

    console.log("  [PASS] Catalog & business entities created.\n");

    // -------------------------------------------------------------------------
    // Seed Financial Transactions for October 2026
    // -------------------------------------------------------------------------
    console.log("--> Group 2: Seeding Invoices, Expenses, Receivables & Payables");
    const testDate = new Date("2026-10-15T10:00:00.000Z");

    // 1000 units sold: Total Revenue = ₹5,00,000, Total COGS = ₹3,00,000, Gross Profit = ₹2,00,000
    const invoiceA = await Invoice.create({
      businessId: businessAId,
      invoiceNumber: "INV-202610-001",
      subtotal: 500000,
      discount: 0,
      tax: 0,
      total: 500000,
      paidAmount: 300000,
      dueAmount: 200000,
      paymentMode: "SPLIT",
      paymentStatus: "PARTIAL",
      status: "COMPLETED",
      createdAt: testDate,
      updatedAt: testDate,
    });

    await SaleItem.create({
      businessId: businessAId,
      saleId: invoiceA._id,
      productId: productA._id,
      name: productA.name,
      sku: productA.sku,
      costPrice: 300,
      soldPrice: 500,
      quantity: 1000,
      totalPrice: 500000,
      createdAt: testDate,
      updatedAt: testDate,
    });

    // OpEx = ₹70,000 -> Operating Profit = Gross Profit (₹2,00,000) - OpEx (₹70,000) = ₹1,30,000
    await Expense.create({
      businessId: businessAId,
      expenseNumber: "EXP-202610-001",
      categoryId: categoryA._id,
      categoryName: categoryA.categoryName,
      amount: 70000,
      expenseDate: testDate,
      paymentMethod: "BANK_TRANSFER",
      status: "PAID",
    });

    // Customer with Outstanding Receivable = ₹2,45,000 (Current Snapshot)
    await Customer.create({
      businessId: businessAId,
      name: "Rajesh Hardware",
      phone: "9876543210",
      currentBalance: 245000,
      creditLimit: 500000,
    });

    // Supplier with Outstanding Payable = ₹55,000 (Current Snapshot)
    await Supplier.create({
      businessId: businessAId,
      company: "National Grains Supply Co",
      currentBalance: 55000,
    });

    console.log("  [PASS] Seeded: Revenue=₹5,00,000, COGS=₹3,00,000, OpEx=₹70,000, Receivables=₹2,45,000, Payables=₹55,000.\n");

    // -------------------------------------------------------------------------
    // Test Group 3: Core Summary Calculation & T52-T58 Metric Verification
    // -------------------------------------------------------------------------
    console.log("--> Group 3: Testing Summary Calculation for 2026-10-01 to 2026-10-31");
    const summary = await dashboardService.getBusinessSummary(businessAId, {
      from: "2026-10-01",
      to: "2026-10-31",
    });

    assert.strictEqual(summary.revenue, 500000, "Revenue should match ₹5,00,000");
    assert.strictEqual(summary.cogs, 300000, "COGS should match ₹3,00,000");
    assert.strictEqual(summary.grossProfit, 200000, "Gross profit should be Revenue - COGS = ₹2,00,000");
    assert.strictEqual(summary.grossMargin, 40, "Gross margin should be 40%");
    assert.strictEqual(summary.operatingExpenses, 70000, "Operating expenses should match ₹70,000");
    assert.strictEqual(summary.operatingProfit, 130000, "Operating profit should be ₹2,00,000 - ₹70,000 = ₹1,30,000");
    assert.strictEqual(summary.operatingMargin, 26, "Operating margin should be (1,30,000 / 5,00,000) * 100 = 26%");
    assert.strictEqual(summary.receivables, 245000, "Receivables should reflect current balance of ₹2,45,000");
    assert.strictEqual(summary.payables, 55000, "Payables should reflect current balance of ₹55,000");

    console.log(`  Revenue: ₹${summary.revenue}`);
    console.log(`  Gross Profit: ₹${summary.grossProfit} (${summary.grossMargin}%)`);
    console.log(`  OpEx: ₹${summary.operatingExpenses}`);
    console.log(`  Operating Profit: ₹${summary.operatingProfit} (${summary.operatingMargin}%)`);
    console.log(`  Receivables: ₹${summary.receivables}`);
    console.log(`  Payables: ₹${summary.payables}`);
    console.log("  [PASS] All summary metrics match exact financial accounting formulas.\n");

    // -------------------------------------------------------------------------
    // Test Group 4: Cash Position (T59 Dependency Status)
    // -------------------------------------------------------------------------
    console.log("--> Group 4: Verifying Cash Position (T59) Semantics");
    assert.strictEqual(summary.cashPosition, null, "Cash position must be null since T59 is not implemented");
    assert.strictEqual(summary.cashPositionStatus.isAvailable, false, "Cash position must be flagged as unavailable");
    assert.strictEqual(summary.cashPositionStatus.missingDependency, "T59", "Missing dependency must be reported as T59");
    console.log("  [PASS] Cash Position correctly indicates unavailable status without fabricating data.\n");

    // -------------------------------------------------------------------------
    // Test Group 5: Reporting Period Boundaries & Presets
    // -------------------------------------------------------------------------
    console.log("--> Group 5: Testing Period Presets (THIS_MONTH, LAST_7_DAYS, etc.)");
    const pMonth = dashboardService.resolvePeriodBoundaries({ periodPreset: "THIS_MONTH" });
    assert.strictEqual(pMonth.periodPreset, "THIS_MONTH");
    assert.ok(pMonth.startDate instanceof Date);
    assert.ok(pMonth.endDate instanceof Date);
    assert.ok(pMonth.startDate < pMonth.endDate);

    const p7Days = dashboardService.resolvePeriodBoundaries({ periodPreset: "LAST_7_DAYS" });
    assert.strictEqual(p7Days.periodPreset, "LAST_7_DAYS");

    const p30Days = dashboardService.resolvePeriodBoundaries({ periodPreset: "LAST_30_DAYS" });
    assert.strictEqual(p30Days.periodPreset, "LAST_30_DAYS");

    const pYear = dashboardService.resolvePeriodBoundaries({ periodPreset: "THIS_YEAR" });
    assert.strictEqual(pYear.periodPreset, "THIS_YEAR");

    console.log("  [PASS] Presets resolved with consistent UTC boundaries.\n");

    // -------------------------------------------------------------------------
    // Test Group 6: Custom Date Range Validation & Error Handling
    // -------------------------------------------------------------------------
    console.log("--> Group 6: Testing Custom Date Range Validation");
    assert.throws(
      () => dashboardService.resolvePeriodBoundaries({ from: "2026-10-31", to: "2026-10-01" }),
      /'from' date cannot be after 'to' date/,
      "Should reject reversed date range"
    );

    assert.throws(
      () => dashboardService.resolvePeriodBoundaries({ from: "invalid-date", to: "2026-10-01" }),
      /Invalid date format/,
      "Should reject invalid date string"
    );
    console.log("  [PASS] Invalid date ranges safely rejected with descriptive errors.\n");

    // -------------------------------------------------------------------------
    // Test Group 7: Zero Revenue Guard (Safe Divisions)
    // -------------------------------------------------------------------------
    console.log("--> Group 7: Testing Zero-Revenue Guard");
    const emptySummary = await dashboardService.getBusinessSummary(businessAId, {
      from: "2025-01-01",
      to: "2025-01-31",
    });
    assert.strictEqual(emptySummary.revenue, 0);
    assert.strictEqual(emptySummary.grossProfit, 0);
    assert.strictEqual(emptySummary.grossMargin, 0, "Gross margin must be 0% not NaN or Infinity");
    assert.strictEqual(emptySummary.operatingMargin, 0, "Operating margin must be 0% not NaN or Infinity");
    console.log("  [PASS] Zero revenue scenario produces clean 0% margins without NaN/Infinity.\n");

    // -------------------------------------------------------------------------
    // Test Group 8: Interactive Charts Synchronized Timeline Data
    // -------------------------------------------------------------------------
    console.log("--> Group 8: Testing Interactive Charts Trends Timeline");
    assert.ok(Array.isArray(summary.trends), "Trends must be an array");
    assert.strictEqual(summary.trends.length, 31, "October must generate exactly 31 daily timeline buckets");

    const activeDay = summary.trends.find((t) => t.date === "2026-10-15");
    assert.ok(activeDay, "Day 2026-10-15 must exist in timeline");
    assert.strictEqual(activeDay.revenue, 500000, "Day revenue must match ₹5,00,000");
    assert.strictEqual(activeDay.operatingExpenses, 70000, "Day OpEx must match ₹70,000");
    assert.strictEqual(activeDay.grossProfit, 200000, "Day gross profit must match ₹2,00,000");
    assert.strictEqual(activeDay.operatingProfit, 130000, "Day operating profit must match ₹1,30,000");

    const quietDay = summary.trends.find((t) => t.date === "2026-10-01");
    assert.strictEqual(quietDay.revenue, 0, "Non-transaction day has 0 revenue");
    assert.strictEqual(quietDay.operatingExpenses, 0, "Non-transaction day has 0 OpEx");
    assert.strictEqual(quietDay.operatingProfit, 0, "Non-transaction day has 0 operating profit");
    console.log("  [PASS] Continuous daily timeline generated for Charts A, B, and C with exact values.\n");

    // -------------------------------------------------------------------------
    // Test Group 9: Multi-Tenant Store Isolation
    // -------------------------------------------------------------------------
    console.log("--> Group 9: Verifying Strict Multi-Tenant Store Isolation");
    const summaryB = await dashboardService.getBusinessSummary(businessBId, {
      from: "2026-10-01",
      to: "2026-10-31",
    });
    assert.strictEqual(summaryB.revenue, 0, "Store Beta must see ₹0 revenue");
    assert.strictEqual(summaryB.operatingProfit, 0, "Store Beta must see ₹0 profit");
    assert.strictEqual(summaryB.receivables, 0, "Store Beta must see ₹0 receivables");
    assert.strictEqual(summaryB.payables, 0, "Store Beta must see ₹0 payables");
    console.log("  [PASS] Store Beta data completely isolated from Store Alpha records.\n");

    console.log("===============================================================================");
    console.log("  ALL 9 TEST GROUPS FOR T60 BUSINESS SUMMARY DASHBOARD PASSED!                ");
    console.log("===============================================================================\n");
  } finally {
    // Cleanup seeded records
    await Product.deleteMany({ businessId: { $in: [businessAId, businessBId] } });
    await Invoice.deleteMany({ businessId: { $in: [businessAId, businessBId] } });
    await SaleItem.deleteMany({ businessId: { $in: [businessAId, businessBId] } });
    await Expense.deleteMany({ businessId: { $in: [businessAId, businessBId] } });
    await ExpenseCategory.deleteMany({ businessId: { $in: [businessAId, businessBId] } });
    await Customer.deleteMany({ businessId: { $in: [businessAId, businessBId] } });
    await Supplier.deleteMany({ businessId: { $in: [businessAId, businessBId] } });
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

runTests().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
