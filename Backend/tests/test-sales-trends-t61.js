const assert = require("assert");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const salesTrendsService = require("../src/services/salesTrends.service");
const Product = require("../src/models/product.model");
const Invoice = require("../src/models/invoice.model");
const SaleItem = require("../src/models/saleItem.model");

/**
 * PHASE 10 - TASK T61: SALES PERFORMANCE CHARTS TEST SUITE
 * Validates hourly, daily, weekly, and monthly sales trend aggregation,
 * distinct order counts, previous-period comparisons, peak/low detection,
 * cancellation filtering, and multi-tenant isolation.
 */

console.log("===============================================================================");
console.log("  PHASE 10 - TASK T61: SALES PERFORMANCE CHARTS TEST SUITE                     ");
console.log("===============================================================================");

async function runTests() {
  const mongoUri =
    process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/vendoros";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB successfully.\n");

  const businessAId = new mongoose.Types.ObjectId();
  const businessBId = new mongoose.Types.ObjectId();
  const dummyCatId = new mongoose.Types.ObjectId();

  try {
    // -------------------------------------------------------------------------
    // Setup Test Data
    // -------------------------------------------------------------------------
    console.log("--> Group 1: Setting up Test Catalog Products");
    const product1 = await Product.create({
      businessId: businessAId,
      categoryId: dummyCatId,
      name: "Organic Honey 500g",
      sku: `HONEY-${Date.now()}`,
      costPrice: 200,
      sellingPrice: 350,
      currentStock: 1000,
    });

    const product2 = await Product.create({
      businessId: businessAId,
      categoryId: dummyCatId,
      name: "Pure Mustard Oil 1L",
      sku: `OIL-${Date.now()}`,
      costPrice: 120,
      sellingPrice: 180,
      currentStock: 1000,
    });
    console.log("  [PASS] Test products created.\n");

    // -------------------------------------------------------------------------
    // Seed Invoices for Store Alpha across multiple days in October 2026
    // -------------------------------------------------------------------------
    console.log("--> Group 2: Seeding Invoices across Multiple Days and Hours");

    // Day 1: 2026-10-19 at 10:00 UTC (Order 1: ₹18,000)
    const inv1 = await Invoice.create({
      businessId: businessAId,
      invoiceNumber: "INV-202610-101",
      subtotal: 18000,
      total: 18000,
      paidAmount: 18000,
      dueAmount: 0,
      status: "COMPLETED",
      createdAt: new Date("2026-10-19T10:15:00.000Z"),
      updatedAt: new Date("2026-10-19T10:15:00.000Z"),
    });
    // Multi-item order: 2 line items under same order (must count as 1 order!)
    await SaleItem.create([
      {
        businessId: businessAId,
        saleId: inv1._id,
        productId: product1._id,
        name: product1.name,
        costPrice: 200,
        soldPrice: 350,
        quantity: 40,
        totalPrice: 14000,
        createdAt: new Date("2026-10-19T10:15:00.000Z"),
      },
      {
        businessId: businessAId,
        saleId: inv1._id,
        productId: product2._id,
        name: product2.name,
        costPrice: 120,
        soldPrice: 180,
        quantity: 22,
        totalPrice: 4000,
        createdAt: new Date("2026-10-19T10:15:00.000Z"),
      },
    ]);

    // Day 2: 2026-10-20 at 14:00 UTC (Order 2: ₹25,000)
    const inv2 = await Invoice.create({
      businessId: businessAId,
      invoiceNumber: "INV-202610-102",
      subtotal: 25000,
      total: 25000,
      paidAmount: 25000,
      dueAmount: 0,
      status: "COMPLETED",
      createdAt: new Date("2026-10-20T14:30:00.000Z"),
      updatedAt: new Date("2026-10-20T14:30:00.000Z"),
    });

    // Day 3: 2026-10-21 at 18:00 UTC (Order 3: ₹31,000)
    const inv3 = await Invoice.create({
      businessId: businessAId,
      invoiceNumber: "INV-202610-103",
      subtotal: 31000,
      total: 31000,
      paidAmount: 31000,
      dueAmount: 0,
      status: "COMPLETED",
      createdAt: new Date("2026-10-21T18:45:00.000Z"),
      updatedAt: new Date("2026-10-21T18:45:00.000Z"),
    });

    // Cancelled Sale on 2026-10-21: ₹50,000 (MUST BE EXCLUDED)
    await Invoice.create({
      businessId: businessAId,
      invoiceNumber: "INV-202610-VOID",
      subtotal: 50000,
      total: 50000,
      status: "CANCELLED",
      createdAt: new Date("2026-10-21T19:00:00.000Z"),
      updatedAt: new Date("2026-10-21T19:00:00.000Z"),
    });

    // Previous Period Sale: 2026-10-16: ₹20,000 (For comparison testing)
    await Invoice.create({
      businessId: businessAId,
      invoiceNumber: "INV-202610-PREV",
      subtotal: 20000,
      total: 20000,
      paidAmount: 20000,
      status: "COMPLETED",
      createdAt: new Date("2026-10-16T12:00:00.000Z"),
      updatedAt: new Date("2026-10-16T12:00:00.000Z"),
    });

    console.log("  [PASS] Seeded 3 active orders (₹18k, ₹25k, ₹31k), 1 cancelled order (₹50k), and 1 previous order (₹20k).\n");

    // -------------------------------------------------------------------------
    // Test Group 3: Daily Sales Analysis & Cancellation Filtering
    // -------------------------------------------------------------------------
    console.log("--> Group 3: Testing Daily Aggregation (groupBy=day, 2026-10-19 to 2026-10-21)");
    const dailyResult = await salesTrendsService.getSalesTrends(businessAId, {
      from: "2026-10-19",
      to: "2026-10-21",
      groupBy: "day",
    });

    assert.strictEqual(dailyResult.groupBy, "day");
    assert.strictEqual(dailyResult.data.length, 3, "Should have exactly 3 daily buckets for Oct 19, 20, 21");

    const d19 = dailyResult.data.find((d) => d.date === "2026-10-19");
    const d20 = dailyResult.data.find((d) => d.date === "2026-10-20");
    const d21 = dailyResult.data.find((d) => d.date === "2026-10-21");

    assert.strictEqual(d19.sales, 18000, "Oct 19 sales must match ₹18,000");
    assert.strictEqual(d19.orderCount, 1, "Oct 19 order count must be 1 (even with multiple line items)");
    assert.strictEqual(d20.sales, 25000, "Oct 20 sales must match ₹25,000");
    assert.strictEqual(d20.orderCount, 1, "Oct 20 order count must be 1");
    assert.strictEqual(d21.sales, 31000, "Oct 21 sales must match ₹31,000 (excluding ₹50,000 cancelled sale)");
    assert.strictEqual(d21.orderCount, 1, "Oct 21 order count must be 1");

    assert.strictEqual(dailyResult.summary.totalSales, 74000, "Total sales should be 18000 + 25000 + 31000 = 74000");
    assert.strictEqual(dailyResult.summary.totalOrders, 3, "Total orders should be 3");
    console.log(`  Total Sales: ₹${dailyResult.summary.totalSales}, Total Orders: ${dailyResult.summary.totalOrders}`);
    console.log("  [PASS] Daily aggregation and cancellation exclusion verified.\n");

    // -------------------------------------------------------------------------
    // Test Group 4: Hourly Breakdown for a Selected Day
    // -------------------------------------------------------------------------
    console.log("--> Group 4: Testing Hourly Breakdown (groupBy=hour, date=2026-10-19)");
    const hourlyResult = await salesTrendsService.getSalesTrends(businessAId, {
      date: "2026-10-19",
      groupBy: "hour",
    });

    assert.strictEqual(hourlyResult.groupBy, "hour");
    assert.strictEqual(hourlyResult.data.length, 24, "Should return all 24 hourly buckets");

    const h10 = hourlyResult.data.find((h) => h.time === "10:00");
    const h08 = hourlyResult.data.find((h) => h.time === "08:00");

    assert.strictEqual(h10.sales, 18000, "10:00 hour bucket should have ₹18,000");
    assert.strictEqual(h10.orderCount, 1, "10:00 hour bucket should have 1 order");
    assert.strictEqual(h08.sales, 0, "Non-transaction hour bucket should be 0");
    assert.strictEqual(h08.orderCount, 0, "Non-transaction hour bucket orderCount should be 0");
    console.log("  [PASS] 24 hourly slots correctly populated with exact transaction amounts.\n");

    // -------------------------------------------------------------------------
    // Test Group 5: Peak & Lowest Period Identification
    // -------------------------------------------------------------------------
    console.log("--> Group 5: Testing Peak and Low Period Identification");
    assert.strictEqual(dailyResult.summary.peakPeriod.date, "2026-10-21", "Peak period should be 2026-10-21 (₹31,000)");
    assert.strictEqual(dailyResult.summary.peakPeriod.sales, 31000);
    assert.strictEqual(dailyResult.summary.lowestPeriod.date, "2026-10-19", "Lowest active period should be 2026-10-19 (₹18,000)");
    assert.strictEqual(dailyResult.summary.lowestPeriod.sales, 18000);
    console.log(`  Peak: ${dailyResult.summary.peakPeriod.date} (₹${dailyResult.summary.peakPeriod.sales})`);
    console.log(`  Lowest: ${dailyResult.summary.lowestPeriod.date} (₹${dailyResult.summary.lowestPeriod.sales})`);
    console.log("  [PASS] Peak and lowest period detection verified.\n");

    // -------------------------------------------------------------------------
    // Test Group 6: Previous-Period Comparison
    // -------------------------------------------------------------------------
    console.log("--> Group 6: Testing Period Comparison Analytics");
    assert.ok(dailyResult.comparison, "Comparison object must exist");
    assert.strictEqual(dailyResult.comparison.previousSales, 20000, "Previous 3-day period sales should be ₹20,000");
    assert.strictEqual(dailyResult.comparison.salesVariance, 54000, "Sales variance should be 74000 - 20000 = 54000");
    assert.strictEqual(dailyResult.comparison.salesGrowthPercentage, 270, "Sales growth % should be (54000 / 20000) * 100 = 270%");
    console.log(`  Current Sales: ₹${dailyResult.summary.totalSales} vs Previous: ₹${dailyResult.comparison.previousSales}`);
    console.log(`  Growth Rate: +${dailyResult.comparison.salesGrowthPercentage}%`);
    console.log("  [PASS] Previous-period comparison logic verified.\n");

    // -------------------------------------------------------------------------
    // Test Group 7: Weekly and Monthly Grouping Modes
    // -------------------------------------------------------------------------
    console.log("--> Group 7: Testing Weekly and Monthly Grouping");
    const weeklyResult = await salesTrendsService.getSalesTrends(businessAId, {
      from: "2026-10-01",
      to: "2026-10-31",
      groupBy: "week",
    });
    assert.strictEqual(weeklyResult.groupBy, "week");
    assert.ok(weeklyResult.data.length > 0, "Weekly data should return week buckets");

    const monthlyResult = await salesTrendsService.getSalesTrends(businessAId, {
      from: "2026-08-01",
      to: "2026-10-31",
      groupBy: "month",
    });
    assert.strictEqual(monthlyResult.groupBy, "month");
    assert.strictEqual(monthlyResult.data.length, 3, "3-month range should return 3 monthly buckets");
    const octMonth = monthlyResult.data.find((m) => m.key === "2026-10");
    assert.strictEqual(octMonth.sales, 94000, "October monthly total must match ₹94,000 (74k + 20k)");
    console.log("  [PASS] Weekly and Monthly grouping modes verified.\n");

    // -------------------------------------------------------------------------
    // Test Group 8: Multi-Tenant Data Isolation
    // -------------------------------------------------------------------------
    console.log("--> Group 8: Verifying Multi-Tenant Data Isolation");
    const betaResult = await salesTrendsService.getSalesTrends(businessBId, {
      from: "2026-10-01",
      to: "2026-10-31",
      groupBy: "day",
    });
    assert.strictEqual(betaResult.summary.totalSales, 0, "Store Beta must see ₹0 sales");
    assert.strictEqual(betaResult.summary.totalOrders, 0, "Store Beta must see 0 orders");
    console.log("  [PASS] Store Beta completely isolated from Store Alpha records.\n");

    console.log("===============================================================================");
    console.log("  ALL 8 TEST GROUPS FOR T61 SALES PERFORMANCE CHARTS PASSED!                  ");
    console.log("===============================================================================\n");
  } finally {
    // Cleanup
    await Product.deleteMany({ businessId: { $in: [businessAId, businessBId] } });
    await Invoice.deleteMany({ businessId: { $in: [businessAId, businessBId] } });
    await SaleItem.deleteMany({ businessId: { $in: [businessAId, businessBId] } });
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

runTests().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
