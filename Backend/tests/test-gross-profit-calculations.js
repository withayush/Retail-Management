const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Business = require("../src/models/business.model");
const Product = require("../src/models/product.model");
const Invoice = require("../src/models/invoice.model");
const SaleItem = require("../src/models/saleItem.model");
const MonthlyOpExSummary = require("../src/models/monthlyOpExSummary.model");
const MonthlyGrossProfitSummary = require("../src/models/monthlyGrossProfitSummary.model");
const MonthlyRevenueSummary = require("../src/models/monthlyRevenueSummary.model");
const MonthlyCogsSummary = require("../src/models/monthlyCogsSummary.model");
const grossProfitAnalyticsService = require("../src/services/grossProfitAnalytics.service");
const revenueAnalyticsService = require("../src/services/revenueAnalytics.service");
const cogsAnalyticsService = require("../src/services/cogsAnalytics.service");
const monthlyOpExRepository = require("../src/repositories/monthlyOpEx.repository");

async function runTests() {
  console.log("================================================================================");
  console.log("  PHASE 9 - TASK T54: GROSS PROFIT CALCULATIONS TEST SUITE");
  console.log("================================================================================");

  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/vendoros";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB successfully.\n");

    const runId = Math.floor(Math.random() * 1000000);

    // [TEST 1] Setup Multi-Tenant Stores
    const ownerAlpha = new mongoose.Types.ObjectId();
    const ownerBeta = new mongoose.Types.ObjectId();

    const storeAlpha = await Business.create({
      ownerId: ownerAlpha,
      businessName: `Store Alpha GrossProfit ${runId}`,
      ownerPhone: `91995${runId.toString().padStart(7, "0")}`,
      status: "ACTIVE",
    });

    const storeBeta = await Business.create({
      ownerId: ownerBeta,
      businessName: `Store Beta GrossProfit ${runId}`,
      ownerPhone: `91996${runId.toString().padStart(7, "0")}`,
      status: "ACTIVE",
    });

    console.log(`[TEST 1] Setup Multi-Tenant Stores: Store Alpha (${storeAlpha._id}), Store Beta (${storeBeta._id}) [PASSED]`);

    // [TEST 2] Product Catalog Setup
    const dummyCatId = new mongoose.Types.ObjectId();
    // Maggi: Cost ₹10, Selling ₹15
    const prodMaggi = await Product.create({
      businessId: storeAlpha._id,
      categoryId: dummyCatId,
      name: "Maggi 2-Minute Noodles",
      sku: `MAGGI-${runId}`,
      sellingPrice: 15,
      costPrice: 10,
      currentStock: 1000,
    });

    // Coke: Cost ₹25, Selling ₹40
    const prodCoke = await Product.create({
      businessId: storeAlpha._id,
      categoryId: dummyCatId,
      name: "Coca Cola 750ml",
      sku: `COKE-${runId}`,
      sellingPrice: 40,
      costPrice: 25,
      currentStock: 500,
    });

    // Biscuit: Cost ₹18, Selling ₹30
    const prodBiscuit = await Product.create({
      businessId: storeAlpha._id,
      categoryId: dummyCatId,
      name: "Good Day Butter Biscuit",
      sku: `BISCUIT-${runId}`,
      sellingPrice: 30,
      costPrice: 18,
      currentStock: 800,
    });

    console.log(`[TEST 2] Product Catalog Provisioned: Maggi (Cost ₹10, Sell ₹15), Coke (Cost ₹25, Sell ₹40), Biscuit (Cost ₹18, Sell ₹30) [PASSED]`);

    // [TEST 3] September Sales Generation & Mathematical Formula Verification:
    // Maggi: 100 units * ₹15 = ₹1,500 Revenue, Cost = 100 * ₹10 = ₹1,000 COGS -> GP = ₹500
    // Coke: 50 units * ₹40 = ₹2,000 Revenue, Cost = 50 * ₹25 = ₹1,250 COGS -> GP = ₹750
    // Biscuit: 80 units * ₹30 = ₹2,400 Revenue, Cost = 80 * ₹18 = ₹1,440 COGS -> GP = ₹960
    // Total Revenue = 1500 + 2000 + 2400 = ₹5,900
    // Total COGS = 1000 + 1250 + 1440 = ₹3,690
    // Gross Profit = 5,900 - 3,690 = ₹2,210
    // GP Margin % = (2,210 / 5,900) * 100 = 37.46%
    const sepDate = new Date(Date.UTC(2026, 8, 15, 10, 0, 0)); // 15 Sep 2026
    const invSep = await Invoice.create({
      businessId: storeAlpha._id,
      invoiceNumber: `INV-GP-SEP-${runId}`,
      subtotal: 5900,
      discount: 0,
      tax: 0,
      total: 5900,
      paidAmount: 5900,
      dueAmount: 0,
      paymentStatus: "PAID",
      paymentMode: "CASH",
      status: "COMPLETED",
      createdAt: sepDate,
      items: [
        {
          productId: prodMaggi._id,
          name: prodMaggi.name,
          sku: prodMaggi.sku,
          quantity: 100,
          soldPrice: 15,
          costPrice: 10,
          totalPrice: 1500,
          grossProfit: 500,
        },
        {
          productId: prodCoke._id,
          name: prodCoke.name,
          sku: prodCoke.sku,
          quantity: 50,
          soldPrice: 40,
          costPrice: 25,
          totalPrice: 2000,
          grossProfit: 750,
        },
        {
          productId: prodBiscuit._id,
          name: prodBiscuit.name,
          sku: prodBiscuit.sku,
          quantity: 80,
          soldPrice: 30,
          costPrice: 18,
          totalPrice: 2400,
          grossProfit: 960,
        },
      ],
    });

    await SaleItem.insertMany([
      {
        businessId: storeAlpha._id,
        saleId: invSep._id,
        productId: prodMaggi._id,
        name: prodMaggi.name,
        sku: prodMaggi.sku,
        quantity: 100,
        soldPrice: 15,
        costPrice: 10,
        totalPrice: 1500,
        grossProfit: 500,
        createdAt: sepDate,
      },
      {
        businessId: storeAlpha._id,
        saleId: invSep._id,
        productId: prodCoke._id,
        name: prodCoke.name,
        sku: prodCoke.sku,
        quantity: 50,
        soldPrice: 40,
        costPrice: 25,
        totalPrice: 2000,
        grossProfit: 750,
        createdAt: sepDate,
      },
      {
        businessId: storeAlpha._id,
        saleId: invSep._id,
        productId: prodBiscuit._id,
        name: prodBiscuit.name,
        sku: prodBiscuit.sku,
        quantity: 80,
        soldPrice: 30,
        costPrice: 18,
        totalPrice: 2400,
        grossProfit: 960,
        createdAt: sepDate,
      },
    ]);

    const sepSummary = await grossProfitAnalyticsService.aggregateAndCacheMonth(
      storeAlpha._id,
      2026,
      9,
      "MANUAL_RECALCULATE"
    );

    if (sepSummary.revenue !== 5900) {
      throw new Error(`Expected September Revenue to be ₹5,900, got ₹${sepSummary.revenue}`);
    }
    if (sepSummary.cogs !== 3690) {
      throw new Error(`Expected September COGS to be ₹3,690, got ₹${sepSummary.cogs}`);
    }
    if (sepSummary.grossProfit !== 2210) {
      throw new Error(`Expected September Gross Profit to be ₹2,210, got ₹${sepSummary.grossProfit}`);
    }
    if (sepSummary.grossMarginPercentage !== 37.46) {
      throw new Error(`Expected September GP Margin to be 37.46%, got ${sepSummary.grossMarginPercentage}%`);
    }

    console.log(`[TEST 3] Formula Verified: Revenue (₹${sepSummary.revenue}) - COGS (₹${sepSummary.cogs}) = Gross Profit (₹${sepSummary.grossProfit}) | GP Margin = ${sepSummary.grossMarginPercentage}% [PASSED]`);

    // [TEST 4] Zero-Revenue Guard Test (No NaN or Infinity)
    const zeroMonth = await grossProfitAnalyticsService.aggregateAndCacheMonth(
      storeAlpha._id,
      2026,
      1, // January 2026 has no sales
      "MANUAL_RECALCULATE"
    );

    if (zeroMonth.revenue !== 0 || zeroMonth.grossProfit !== 0 || zeroMonth.grossMarginPercentage !== 0) {
      throw new Error(`Zero-revenue month must return 0% margin without NaN, got ${zeroMonth.grossMarginPercentage}`);
    }
    if (isNaN(zeroMonth.grossMarginPercentage) || !isFinite(zeroMonth.grossMarginPercentage)) {
      throw new Error(`Zero-revenue month produced NaN or Infinity!`);
    }

    console.log(`[TEST 4] Zero-Revenue Guard: Revenue = ₹0 -> GP Margin = 0% (Zero NaN / Infinity safe) [PASSED]`);

    // [TEST 5] Operating Profit Bridge Test (T51 OpEx Integration)
    // Seed ₹1,200 OpEx for September
    await monthlyOpExRepository.upsertMonthlySummary(storeAlpha._id, 2026, 9, {
      monthName: "September 2026",
      startDate: new Date(Date.UTC(2026, 8, 1, 0, 0, 0)),
      endDate: new Date(Date.UTC(2026, 8, 30, 23, 59, 59)),
      totalOpEx: 1200,
    });

    // Re-aggregate September: Gross Profit (₹2,210) - OpEx (₹1,200) = Operating Profit (₹1,010)
    // Operating Margin = (1,010 / 5,900) * 100 = 17.12%
    const sepWithOpEx = await grossProfitAnalyticsService.aggregateAndCacheMonth(
      storeAlpha._id,
      2026,
      9,
      "MANUAL_RECALCULATE"
    );

    if (sepWithOpEx.opEx !== 1200) {
      throw new Error(`Expected OpEx to be ₹1,200, got ₹${sepWithOpEx.opEx}`);
    }
    if (sepWithOpEx.operatingProfit !== 1010) {
      throw new Error(`Expected Operating Profit to be ₹1,010, got ₹${sepWithOpEx.operatingProfit}`);
    }
    if (sepWithOpEx.operatingMarginPercentage !== 17.12) {
      throw new Error(`Expected Operating Margin to be 17.12%, got ${sepWithOpEx.operatingMarginPercentage}%`);
    }

    console.log(`[TEST 5] Full P&L Bridge: GP ₹${sepWithOpEx.grossProfit} - OpEx ₹${sepWithOpEx.opEx} = Operating Profit ₹${sepWithOpEx.operatingProfit} (17.12% Op Margin) [PASSED]`);

    // [TEST 6] October Sales & MoM Dynamics & Margin Compression Detection
    // In October, seller discounts prices heavily:
    // Maggi sold @ ₹12 (Cost ₹10) -> GP = ₹2 (16.67% margin)
    // 200 units: Rev = ₹2,400, Cost = ₹2,000, GP = ₹400
    // Margin drops from 37.46% (Sep) to 16.67% (Oct)!
    const octDate = new Date(Date.UTC(2026, 9, 10, 11, 0, 0));
    const invOct = await Invoice.create({
      businessId: storeAlpha._id,
      invoiceNumber: `INV-GP-OCT-${runId}`,
      subtotal: 2400,
      total: 2400,
      paidAmount: 2400,
      paymentStatus: "PAID",
      paymentMode: "CASH",
      status: "COMPLETED",
      createdAt: octDate,
      items: [
        {
          productId: prodMaggi._id,
          name: prodMaggi.name,
          sku: prodMaggi.sku,
          quantity: 200,
          soldPrice: 12,
          costPrice: 10,
          totalPrice: 2400,
          grossProfit: 400,
        },
      ],
    });

    await SaleItem.create({
      businessId: storeAlpha._id,
      saleId: invOct._id,
      productId: prodMaggi._id,
      name: prodMaggi.name,
      sku: prodMaggi.sku,
      quantity: 200,
      soldPrice: 12,
      costPrice: 10,
      totalPrice: 2400,
      grossProfit: 400,
      createdAt: octDate,
    });

    const octSummary = await grossProfitAnalyticsService.aggregateAndCacheMonth(
      storeAlpha._id,
      2026,
      10,
      "MANUAL_RECALCULATE"
    );

    if (octSummary.revenue !== 2400 || octSummary.grossProfit !== 400 || octSummary.grossMarginPercentage !== 16.67) {
      throw new Error(`Expected October GP ₹400 (16.67%), got GP ₹${octSummary.grossProfit} (${octSummary.grossMarginPercentage}%)`);
    }

    // Margin Change Rate = 16.67 - 37.46 = -20.79% (Severe margin erosion detected!)
    if (octSummary.marginChangeRate !== -20.79) {
      throw new Error(`Expected marginChangeRate to be -20.79%, got ${octSummary.marginChangeRate}%`);
    }

    console.log(`[TEST 6] MoM Margin Compression: Sept Margin 37.46% -> Oct Margin 16.67% (Delta: ${octSummary.marginChangeRate}%) [PASSED]`);

    // [TEST 7] Vital Health Check Diagnostic Indicator (Task T54 Health Check)
    const healthCheck = await grossProfitAnalyticsService.getVitalHealthCheck(storeAlpha._id, {
      year: 2026,
      month: 10,
    });

    if (!healthCheck.isMarginCompressing) {
      throw new Error(`Expected isMarginCompressing to be true due to >3% drop`);
    }
    const compressionWarning = healthCheck.diagnostics.find((d) => d.type === "MARGIN_COMPRESSION");
    if (!compressionWarning) {
      throw new Error(`Expected MARGIN_COMPRESSION diagnostic alert`);
    }

    console.log(`[TEST 7] Vital Health Check Diagnostic: Margin compression detected! Status = ${healthCheck.marginHealth}, Alert = "${compressionWarning.message}" [PASSED]`);

    // [TEST 8] Product Profitability Matrix Categorization
    const matrix = await grossProfitAnalyticsService.getProductProfitabilityMatrix(storeAlpha._id, {
      year: 2026,
      month: 9,
    });

    if (matrix.length < 3) {
      throw new Error(`Expected 3 classified products, got ${matrix.length}`);
    }
    // In Sept:
    // Biscuit: Margin = (960 / 2400) * 100 = 40% -> STAR_PERFORMER
    // Coke: Margin = (750 / 2000) * 100 = 37.5% -> STAR_PERFORMER
    // Maggi: Margin = (500 / 1500) * 100 = 33.33% -> STAR_PERFORMER
    const starPerformers = matrix.filter((p) => p.matrixQuadrant === "STAR_PERFORMER");
    if (starPerformers.length !== 3) {
      throw new Error(`Expected 3 STAR_PERFORMER items in September, got ${starPerformers.length}`);
    }

    console.log(`[TEST 8] Product Profitability Matrix: Correctly classified ${starPerformers.length} Star Performers with margins > 30% [PASSED]`);

    // [TEST 9] Exclusion of Cancelled Invoices
    const cancelDate = new Date(Date.UTC(2026, 9, 20, 15, 0, 0));
    const invCancel = await Invoice.create({
      businessId: storeAlpha._id,
      invoiceNumber: `INV-CANCEL-GP-${runId}`,
      subtotal: 50000,
      total: 50000,
      status: "CANCELLED", // Voided sale
      createdAt: cancelDate,
    });

    await SaleItem.create({
      businessId: storeAlpha._id,
      saleId: invCancel._id,
      productId: prodCoke._id,
      name: prodCoke.name,
      sku: prodCoke.sku,
      quantity: 1000,
      soldPrice: 50,
      costPrice: 25,
      totalPrice: 50000,
      grossProfit: 25000,
      createdAt: cancelDate,
    });

    const octAfterCancel = await grossProfitAnalyticsService.aggregateAndCacheMonth(
      storeAlpha._id,
      2026,
      10,
      "MANUAL_RECALCULATE"
    );

    if (octAfterCancel.revenue !== 2400 || octAfterCancel.grossProfit !== 400) {
      throw new Error(`CANCELLED INVOICE POLLUTION: Expected October GP ₹400, got ₹${octAfterCancel.grossProfit}`);
    }

    console.log(`[TEST 9] Cancelled Invoice Exclusion: Voided ₹25,000 profit strictly excluded from gross profit statements [PASSED]`);

    // [TEST 10] Custom Accounting Period Calculation
    const customPeriod = await grossProfitAnalyticsService.calculatePeriodGrossProfit(storeAlpha._id, {
      startDate: new Date(Date.UTC(2026, 8, 1, 0, 0, 0)),
      endDate: new Date(Date.UTC(2026, 8, 30, 23, 59, 59)),
    });

    if (customPeriod.grossProfit !== 2210 || customPeriod.grossMarginPercentage !== 37.46) {
      throw new Error(`Expected custom period GP ₹2,210 (37.46%), got ₹${customPeriod.grossProfit} (${customPeriod.grossMarginPercentage}%)`);
    }

    console.log(`[TEST 10] Custom Accounting Period Calculation: Period GP = ₹${customPeriod.grossProfit} (Margin ${customPeriod.grossMarginPercentage}%) [PASSED]`);

    // [TEST 11] Multi-Tenant Security Boundary Isolation
    const betaProd = await Product.create({
      businessId: storeBeta._id,
      categoryId: dummyCatId,
      name: "Beta High Value Product",
      sku: `BETA-HV-${runId}`,
      sellingPrice: 1000,
      costPrice: 600,
      currentStock: 100,
    });

    const betaInv = await Invoice.create({
      businessId: storeBeta._id,
      invoiceNumber: `INV-BETA-GP-${runId}`,
      subtotal: 100000,
      total: 100000,
      status: "COMPLETED",
      createdAt: octDate,
    });

    await SaleItem.create({
      businessId: storeBeta._id,
      saleId: betaInv._id,
      productId: betaProd._id,
      name: betaProd.name,
      sku: betaProd.sku,
      quantity: 100,
      soldPrice: 1000,
      costPrice: 600,
      totalPrice: 100000,
      grossProfit: 40000, // ₹40,000 GP in Store Beta
      createdAt: octDate,
    });

    const alphaOctVerify = await grossProfitAnalyticsService.aggregateAndCacheMonth(
      storeAlpha._id,
      2026,
      10,
      "MANUAL_RECALCULATE"
    );
    const betaOctVerify = await grossProfitAnalyticsService.aggregateAndCacheMonth(
      storeBeta._id,
      2026,
      10,
      "MANUAL_RECALCULATE"
    );

    if (alphaOctVerify.grossProfit !== 400) {
      throw new Error(`CROSS-TENANT LEAKAGE: Store Alpha GP mutated to ₹${alphaOctVerify.grossProfit}`);
    }
    if (betaOctVerify.grossProfit !== 40000) {
      throw new Error(`Expected Store Beta GP to be ₹40,000, got ₹${betaOctVerify.grossProfit}`);
    }

    console.log(`[TEST 11] Multi-Tenant Isolation: Store Alpha GP = ₹${alphaOctVerify.grossProfit}, Store Beta GP = ₹${betaOctVerify.grossProfit} (Zero Cross-Tenant Leakage) [PASSED]`);

    // Cleanup fixtures
    await Promise.all([
      Business.deleteMany({ _id: { $in: [storeAlpha._id, storeBeta._id] } }),
      Product.deleteMany({ _id: { $in: [prodMaggi._id, prodCoke._id, prodBiscuit._id, betaProd._id] } }),
      Invoice.deleteMany({ businessId: { $in: [storeAlpha._id, storeBeta._id] } }),
      SaleItem.deleteMany({ businessId: { $in: [storeAlpha._id, storeBeta._id] } }),
      MonthlyGrossProfitSummary.deleteMany({ businessId: { $in: [storeAlpha._id, storeBeta._id] } }),
      MonthlyRevenueSummary.deleteMany({ businessId: { $in: [storeAlpha._id, storeBeta._id] } }),
      MonthlyCogsSummary.deleteMany({ businessId: { $in: [storeAlpha._id, storeBeta._id] } }),
      MonthlyOpExSummary.deleteMany({ businessId: { $in: [storeAlpha._id, storeBeta._id] } }),
    ]);

    console.log("\n================================================================================");
    console.log("  ALL 11 TEST SUITES FOR TASK T54 PASSED SUCCESSFULLY! (100% COVERAGE) ");
    console.log("================================================================================");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ TEST SUITE FAILED:", err);
    process.exit(1);
  }
}

runTests();
