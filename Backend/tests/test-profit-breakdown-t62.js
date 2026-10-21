const assert = require("assert");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const profitBreakdownService = require("../src/services/profitBreakdown.service");
const Product = require("../src/models/product.model");
const Invoice = require("../src/models/invoice.model");
const SaleItem = require("../src/models/saleItem.model");
const Expense = require("../src/models/expense.model");

/**
 * PHASE 10 - TASK T62: PROFIT BREAKDOWN & VISUALIZERS TEST SUITE
 * Validates:
 * 1. Benchmark scenario: Revenue 500k, COGS 350k, Gross Profit 150k, OpEx 70k, Operating Profit 80k.
 * 2. Gross Margin (30%) & Operating Margin (16%) calculation accuracy.
 * 3. Waterfall chart progression structure (cumulative deductions and subtotals).
 * 4. Loss-making scenario (negative operating profit, margins not clamped).
 * 5. Zero-revenue guard (no division by zero).
 * 6. Period-over-period comparison and percentage change calculations.
 * 7. Multi-tenant store isolation.
 * 8. Date boundary validation.
 */

console.log("===============================================================================");
console.log("  PHASE 10 - TASK T62: GROSS / NET PROFIT VISUALIZERS TEST SUITE               ");
console.log("===============================================================================");

async function runTests() {
  const mongoUri =
    process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/vendoros";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB successfully.\n");

  const businessAlphaId = new mongoose.Types.ObjectId();
  const businessBetaId = new mongoose.Types.ObjectId();
  const dummyCatId = new mongoose.Types.ObjectId();

  try {
    // -------------------------------------------------------------------------
    // Setup Test Products
    // -------------------------------------------------------------------------
    console.log("--> Group 1: Setting up Test Catalog Products");
    // Unit Cost = 70, Unit Selling = 100.
    // 5000 units => Revenue = 500,000, COGS = 350,000, Gross Profit = 150,000
    const benchmarkProduct = await Product.create({
      businessId: businessAlphaId,
      categoryId: dummyCatId,
      name: "Benchmark Widget Alpha",
      sku: `BENCH-${Date.now()}`,
      costPrice: 70,
      sellingPrice: 100,
      currentStock: 10000,
    });
    console.log("  [PASS] Test products created successfully.\n");

    // -------------------------------------------------------------------------
    // Group 2: Seed Benchmark Data for Current Period (Oct 2026)
    // -------------------------------------------------------------------------
    console.log("--> Group 2: Seeding Benchmark Financial Data (Oct 2026)");
    const invoiceOct = await Invoice.create({
      businessId: businessAlphaId,
      invoiceNumber: `INV-T62-OCT-${Date.now()}`,
      customer: { name: "Retail Wholesale Hub", phone: "9876543210" },
      totalAmount: 500000,
      subtotal: 500000,
      discount: 0,
      tax: 0,
      status: "COMPLETED",
      paymentMethod: "CASH",
      invoiceDate: new Date("2026-10-15T12:00:00.000Z"),
      createdAt: new Date("2026-10-15T12:00:00.000Z"),
    });

    await SaleItem.create({
      businessId: businessAlphaId,
      saleId: invoiceOct._id,
      productId: benchmarkProduct._id,
      name: benchmarkProduct.name,
      sku: benchmarkProduct.sku,
      quantity: 5000,
      soldPrice: 100,
      costPrice: 70,
      totalPrice: 500000,
      grossProfit: 150000,
      createdAt: new Date("2026-10-15T12:00:00.000Z"),
    });

    const dummyExpCatId = new mongoose.Types.ObjectId();

    // Operating Expenses: 70,000 (Rent 50k, Utilities 20k)
    await Expense.create([
      {
        businessId: businessAlphaId,
        expenseNumber: `EXP-RENT-${Date.now()}`,
        categoryId: dummyExpCatId,
        categoryName: "Rent",
        amount: 50000,
        expenseDate: new Date("2026-10-05T10:00:00.000Z"),
        paymentMethod: "BANK_TRANSFER",
        status: "PAID",
      },
      {
        businessId: businessAlphaId,
        expenseNumber: `EXP-UTIL-${Date.now()}`,
        categoryId: dummyExpCatId,
        categoryName: "Utilities",
        amount: 20000,
        expenseDate: new Date("2026-10-10T10:00:00.000Z"),
        paymentMethod: "UPI",
        status: "PAID",
      },
    ]);
    console.log("  [PASS] Benchmark Oct data seeded: Revenue 500k, COGS 350k, OpEx 70k.\n");

    // -------------------------------------------------------------------------
    // Group 3: Seed Previous Period Data (Sep 2026) for Comparison
    // -------------------------------------------------------------------------
    console.log("--> Group 3: Seeding Previous Period Financial Data (Sep 2026)");
    const invoiceSep = await Invoice.create({
      businessId: businessAlphaId,
      invoiceNumber: `INV-T62-SEP-${Date.now()}`,
      customer: { name: "Retail Wholesale Hub", phone: "9876543210" },
      totalAmount: 400000,
      subtotal: 400000,
      discount: 0,
      tax: 0,
      status: "COMPLETED",
      paymentMethod: "CASH",
      invoiceDate: new Date("2026-09-15T12:00:00.000Z"),
      createdAt: new Date("2026-09-15T12:00:00.000Z"),
    });

    await SaleItem.create({
      businessId: businessAlphaId,
      saleId: invoiceSep._id,
      productId: benchmarkProduct._id,
      name: benchmarkProduct.name,
      sku: benchmarkProduct.sku,
      quantity: 4000,
      soldPrice: 100,
      costPrice: 70,
      totalPrice: 400000,
      grossProfit: 120000,
      createdAt: new Date("2026-09-15T12:00:00.000Z"),
    });

    await Expense.create({
      businessId: businessAlphaId,
      expenseNumber: `EXP-SEP-${Date.now()}`,
      categoryId: dummyExpCatId,
      categoryName: "Rent",
      amount: 60000,
      expenseDate: new Date("2026-09-05T10:00:00.000Z"),
      paymentMethod: "BANK_TRANSFER",
      status: "PAID",
    });
    console.log("  [PASS] Sep data seeded: Revenue 400k, COGS 280k, OpEx 60k.\n");

    // -------------------------------------------------------------------------
    // Test Group 4: Execute Benchmark Verification (Oct 2026)
    // -------------------------------------------------------------------------
    console.log("--> Group 4: Verifying Benchmark Calculations (Revenue 500k, COGS 350k, OpEx 70k)");
    const benchmarkResult = await profitBreakdownService.getProfitBreakdown(businessAlphaId, {
      from: "2026-10-01",
      to: "2026-10-31",
    });

    assert.strictEqual(benchmarkResult.revenue, 500000, "Revenue must be exactly ₹5,00,000");
    assert.strictEqual(benchmarkResult.cogs, 350000, "COGS must be exactly ₹3,50,000");
    assert.strictEqual(benchmarkResult.grossProfit, 150000, "Gross Profit must be exactly ₹1,50,000");
    assert.strictEqual(benchmarkResult.operatingExpenses, 70000, "Operating Expenses must be exactly ₹70,000");
    assert.strictEqual(benchmarkResult.operatingProfit, 80000, "Operating Profit must be exactly ₹80,000");
    assert.strictEqual(benchmarkResult.grossMargin, 30, "Gross Margin must be exactly 30%");
    assert.strictEqual(benchmarkResult.operatingMargin, 16, "Operating Margin must be exactly 16%");
    assert.strictEqual(benchmarkResult.status, "PROFITABLE");
    console.log("  [PASS] Benchmark figures match Section 12 requirements perfectly (30% Gross, 16% Operating).\n");

    // -------------------------------------------------------------------------
    // Test Group 5: Waterfall Chart Dataset Progression
    // -------------------------------------------------------------------------
    console.log("--> Group 5: Verifying Waterfall Chart Progression & Floating Bars");
    const waterfall = benchmarkResult.waterfall;
    assert.strictEqual(waterfall.length, 5, "Waterfall chart must contain 5 sequential steps");

    // Step 1: Revenue (Total)
    assert.strictEqual(waterfall[0].id, "revenue");
    assert.strictEqual(waterfall[0].type, "total");
    assert.strictEqual(waterfall[0].amount, 500000);
    assert.strictEqual(waterfall[0].startLevel, 0);
    assert.strictEqual(waterfall[0].endLevel, 500000);

    // Step 2: COGS (Floating Deduction)
    assert.strictEqual(waterfall[1].id, "cogs");
    assert.strictEqual(waterfall[1].type, "deduction");
    assert.strictEqual(waterfall[1].amount, -350000);
    assert.strictEqual(waterfall[1].startLevel, 500000);
    assert.strictEqual(waterfall[1].endLevel, 150000);
    assert.strictEqual(waterfall[1].base, 150000, "Floating base must equal gross profit level");

    // Step 3: Gross Profit (Subtotal)
    assert.strictEqual(waterfall[2].id, "grossProfit");
    assert.strictEqual(waterfall[2].type, "subtotal");
    assert.strictEqual(waterfall[2].amount, 150000);
    assert.strictEqual(waterfall[2].startLevel, 0);
    assert.strictEqual(waterfall[2].endLevel, 150000);

    // Step 4: OpEx (Floating Deduction)
    assert.strictEqual(waterfall[3].id, "operatingExpenses");
    assert.strictEqual(waterfall[3].type, "deduction");
    assert.strictEqual(waterfall[3].amount, -70000);
    assert.strictEqual(waterfall[3].startLevel, 150000);
    assert.strictEqual(waterfall[3].endLevel, 80000);
    assert.strictEqual(waterfall[3].base, 80000, "Floating base must equal operating profit level");

    // Step 5: Operating Profit (Total)
    assert.strictEqual(waterfall[4].id, "operatingProfit");
    assert.strictEqual(waterfall[4].type, "total");
    assert.strictEqual(waterfall[4].amount, 80000);
    assert.strictEqual(waterfall[4].startLevel, 0);
    assert.strictEqual(waterfall[4].endLevel, 80000);
    console.log("  [PASS] Waterfall progression and floating deductions verified.\n");

    // -------------------------------------------------------------------------
    // Test Group 6: Period-over-Period Comparison Verification
    // -------------------------------------------------------------------------
    console.log("--> Group 6: Verifying Period-over-Period Comparisons");
    assert.ok(benchmarkResult.comparison, "Comparison object must be returned");
    const cmp = benchmarkResult.comparison.metrics;
    assert.strictEqual(cmp.revenue.current, 500000);
    assert.strictEqual(cmp.revenue.previous, 400000);
    assert.strictEqual(cmp.revenue.change, 100000);
    assert.strictEqual(cmp.revenue.changePercent, 25, "500k vs 400k is a +25% revenue increase");

    assert.strictEqual(cmp.grossProfit.current, 150000);
    assert.strictEqual(cmp.grossProfit.previous, 120000); // 400k - 280k = 120k
    assert.strictEqual(cmp.grossProfit.change, 30000);
    assert.strictEqual(cmp.grossProfit.changePercent, 25);

    assert.strictEqual(cmp.operatingExpenses.current, 70000);
    assert.strictEqual(cmp.operatingExpenses.previous, 60000);
    assert.strictEqual(cmp.operatingExpenses.change, 10000);
    assert.strictEqual(cmp.operatingExpenses.changePercent, 16.7);

    assert.strictEqual(cmp.operatingProfit.current, 80000);
    assert.strictEqual(cmp.operatingProfit.previous, 60000); // 120k - 60k = 60k
    assert.strictEqual(cmp.operatingProfit.change, 20000);
    assert.strictEqual(cmp.operatingProfit.changePercent, 33.3);
    console.log("  [PASS] Period-over-period variance metrics verified.\n");

    // -------------------------------------------------------------------------
    // Test Group 7: Loss-Making Scenario (Negative Profit & Unclamped Margin)
    // -------------------------------------------------------------------------
    console.log("--> Group 7: Verifying Loss-Making Scenario (OpEx > Gross Profit)");
    // Add additional heavy marketing expense in Oct: 200,000
    // Gross Profit (150,000) - OpEx (270,000) = Operating Profit (-120,000)
    // Operating Margin = (-120000 / 500000) * 100 = -24%
    const heavyExpense = await Expense.create({
      businessId: businessAlphaId,
      expenseNumber: `EXP-MKT-${Date.now()}`,
      categoryId: dummyExpCatId,
      categoryName: "Marketing",
      amount: 200000,
      expenseDate: new Date("2026-10-20T10:00:00.000Z"),
      paymentMethod: "BANK_TRANSFER",
      status: "PAID",
    });

    const lossResult = await profitBreakdownService.getProfitBreakdown(businessAlphaId, {
      from: "2026-10-01",
      to: "2026-10-31",
    });

    assert.strictEqual(lossResult.operatingExpenses, 270000);
    assert.strictEqual(lossResult.operatingProfit, -120000, "Operating Profit must be -₹1,20,000");
    assert.strictEqual(lossResult.operatingMargin, -24, "Operating Margin must be -24% (unclamped)");
    assert.strictEqual(lossResult.status, "LOSS_MAKING");
    console.log("  [PASS] Loss-making scenario handles negative margins and negative profit correctly.\n");

    // Cleanup heavy expense
    await Expense.deleteOne({ _id: heavyExpense._id });

    // -------------------------------------------------------------------------
    // Test Group 8: Zero Revenue Guard & Empty Period
    // -------------------------------------------------------------------------
    console.log("--> Group 8: Verifying Zero Revenue Guard");
    const zeroResult = await profitBreakdownService.getProfitBreakdown(businessAlphaId, {
      from: "2025-01-01",
      to: "2025-01-31",
    });
    assert.strictEqual(zeroResult.revenue, 0);
    assert.strictEqual(zeroResult.cogs, 0);
    assert.strictEqual(zeroResult.grossProfit, 0);
    assert.strictEqual(zeroResult.operatingExpenses, 0);
    assert.strictEqual(zeroResult.operatingProfit, 0);
    assert.strictEqual(zeroResult.grossMargin, 0, "Zero revenue must result in 0% margin, not NaN");
    assert.strictEqual(zeroResult.operatingMargin, 0, "Zero revenue must result in 0% margin, not NaN");
    assert.strictEqual(zeroResult.status, "BREAK_EVEN");
    console.log("  [PASS] Zero revenue guard verified with no NaN or Infinity.\n");

    // -------------------------------------------------------------------------
    // Test Group 9: Multi-Tenant Store Isolation
    // -------------------------------------------------------------------------
    console.log("--> Group 9: Verifying Multi-Tenant Data Isolation");
    const betaResult = await profitBreakdownService.getProfitBreakdown(businessBetaId, {
      from: "2026-10-01",
      to: "2026-10-31",
    });
    assert.strictEqual(betaResult.revenue, 0, "Store Beta must see ₹0 revenue");
    assert.strictEqual(betaResult.cogs, 0, "Store Beta must see ₹0 cogs");
    assert.strictEqual(betaResult.operatingExpenses, 0, "Store Beta must see ₹0 opex");
    assert.strictEqual(betaResult.operatingProfit, 0, "Store Beta must see ₹0 operating profit");
    console.log("  [PASS] Store Beta data is completely isolated from Store Alpha.\n");

    // -------------------------------------------------------------------------
    // Test Group 10: Date Validation & Boundaries
    // -------------------------------------------------------------------------
    console.log("--> Group 10: Verifying Date Range Validation");
    await assert.rejects(
      async () => {
        await profitBreakdownService.getProfitBreakdown(businessAlphaId, {
          from: "2026-10-31",
          to: "2026-10-01", // Invalid: from > to
        });
      },
      (err) => {
        assert.ok(err.message.includes("'from' date cannot be after 'to' date"));
        return true;
      }
    );
    console.log("  [PASS] Invalid date range properly rejected with validation error.\n");

    console.log("===============================================================================");
    console.log("  ALL 10 TEST GROUPS FOR T62 PROFIT BREAKDOWN & VISUALIZERS PASSED!           ");
    console.log("===============================================================================\n");
  } finally {
    // Cleanup created test records
    await Product.deleteMany({ businessId: { $in: [businessAlphaId, businessBetaId] } });
    await Invoice.deleteMany({ businessId: { $in: [businessAlphaId, businessBetaId] } });
    await SaleItem.deleteMany({ businessId: { $in: [businessAlphaId, businessBetaId] } });
    await Expense.deleteMany({ businessId: { $in: [businessAlphaId, businessBetaId] } });
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

runTests().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
