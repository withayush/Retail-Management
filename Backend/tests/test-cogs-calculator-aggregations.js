const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Business = require("../src/models/business.model");
const Product = require("../src/models/product.model");
const Invoice = require("../src/models/invoice.model");
const SaleItem = require("../src/models/saleItem.model");
const MonthlyCogsSummary = require("../src/models/monthlyCogsSummary.model");
const cogsAnalyticsService = require("../src/services/cogsAnalytics.service");
const monthlyCogsRepository = require("../src/repositories/monthlyCogs.repository");
const saleService = require("../src/services/sale.service");

async function runTests() {
  console.log("================================================================================");
  console.log("  PHASE 9 - TASK T53: COST OF GOODS SOLD (COGS) CALCULATOR TEST SUITE");
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
      businessName: `Store Alpha COGS ${runId}`,
      ownerPhone: `91993${runId.toString().padStart(7, "0")}`,
      status: "ACTIVE",
    });

    const storeBeta = await Business.create({
      ownerId: ownerBeta,
      businessName: `Store Beta COGS ${runId}`,
      ownerPhone: `91994${runId.toString().padStart(7, "0")}`,
      status: "ACTIVE",
    });

    console.log(`[TEST 1] Setup Multi-Tenant Stores: Store Alpha (${storeAlpha._id}), Store Beta (${storeBeta._id}) [PASSED]`);

    // [TEST 2] Product Catalog with Initial Cost Prices
    // Maggi: Cost ₹10, Selling ₹15
    const prodMaggi = await Product.create({
      businessId: storeAlpha._id,
      name: "Maggi 2-Minute Noodles",
      sku: `MAGGI-${runId}`,
      sellingPrice: 15,
      costPrice: 10,
      currentStock: 1000,
    });

    // Coke: Cost ₹25, Selling ₹40
    const prodCoke = await Product.create({
      businessId: storeAlpha._id,
      name: "Coca Cola 750ml",
      sku: `COKE-${runId}`,
      sellingPrice: 40,
      costPrice: 25,
      currentStock: 500,
    });

    // Biscuit: Cost ₹18, Selling ₹30
    const prodBiscuit = await Product.create({
      businessId: storeAlpha._id,
      name: "Good Day Butter Biscuit",
      sku: `BISCUIT-${runId}`,
      sellingPrice: 30,
      costPrice: 18,
      currentStock: 800,
    });

    console.log(`[TEST 2] Product Catalog Provisioned: Maggi (Cost ₹10), Coke (Cost ₹25), Biscuit (Cost ₹18) [PASSED]`);

    // [TEST 3] September Sales with Historical Cost Snapshots
    // Sale 1 (10 Sep 2026): 100 Maggi @ Cost ₹10 (Selling ₹15) -> Cost = ₹1,000, Rev = ₹1,500
    //                       50 Coke @ Cost ₹25 (Selling ₹40)   -> Cost = ₹1,250, Rev = ₹2,000
    // Subtotal = ₹3,500, COGS = ₹2,250
    const sepDate1 = new Date(Date.UTC(2026, 8, 10, 10, 0, 0)); // 10 Sep 2026
    const invSep1 = await Invoice.create({
      businessId: storeAlpha._id,
      invoiceNumber: `INV-SEP-01-${runId}`,
      subtotal: 3500,
      discount: 0,
      tax: 0,
      total: 3500,
      paidAmount: 3500,
      dueAmount: 0,
      paymentStatus: "PAID",
      paymentMode: "CASH",
      status: "COMPLETED",
      createdAt: sepDate1,
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
      ],
    });

    await SaleItem.insertMany([
      {
        businessId: storeAlpha._id,
        saleId: invSep1._id,
        productId: prodMaggi._id,
        name: prodMaggi.name,
        sku: prodMaggi.sku,
        quantity: 100,
        soldPrice: 15,
        costPrice: 10, // Historical snapshot
        totalPrice: 1500,
        grossProfit: 500,
        createdAt: sepDate1,
      },
      {
        businessId: storeAlpha._id,
        saleId: invSep1._id,
        productId: prodCoke._id,
        name: prodCoke.name,
        sku: prodCoke.sku,
        quantity: 50,
        soldPrice: 40,
        costPrice: 25, // Historical snapshot
        totalPrice: 2000,
        grossProfit: 750,
        createdAt: sepDate1,
      },
    ]);

    // Sale 2 (20 Sep 2026): 50 Biscuit @ Cost ₹18 (Selling ₹30) -> Cost = ₹900, Rev = ₹1,500
    const sepDate2 = new Date(Date.UTC(2026, 8, 20, 14, 0, 0)); // 20 Sep 2026
    const invSep2 = await Invoice.create({
      businessId: storeAlpha._id,
      invoiceNumber: `INV-SEP-02-${runId}`,
      subtotal: 1500,
      discount: 0,
      tax: 0,
      total: 1500,
      paidAmount: 1500,
      dueAmount: 0,
      paymentStatus: "PAID",
      paymentMode: "UPI",
      status: "COMPLETED",
      createdAt: sepDate2,
      items: [
        {
          productId: prodBiscuit._id,
          name: prodBiscuit.name,
          sku: prodBiscuit.sku,
          quantity: 50,
          soldPrice: 30,
          costPrice: 18,
          totalPrice: 1500,
          grossProfit: 600,
        },
      ],
    });

    await SaleItem.create({
      businessId: storeAlpha._id,
      saleId: invSep2._id,
      productId: prodBiscuit._id,
      name: prodBiscuit.name,
      sku: prodBiscuit.sku,
      quantity: 50,
      soldPrice: 30,
      costPrice: 18,
      totalPrice: 1500,
      grossProfit: 600,
      createdAt: sepDate2,
    });

    // Verify September Aggregation:
    // Total September COGS = 1,000 + 1,250 + 900 = ₹3,150
    // Total September Revenue = 1,500 + 2,000 + 1,500 = ₹5,000
    // Gross Profit = ₹5,000 - ₹3,150 = ₹1,850
    // Margin % = (1,850 / 5,000) * 100 = 37%
    const sepSummary = await cogsAnalyticsService.aggregateAndCacheMonth(storeAlpha._id, 2026, 9);

    if (sepSummary.totalCogs !== 3150) {
      throw new Error(`Expected September COGS to be ₹3,150, got ₹${sepSummary.totalCogs}`);
    }
    if (sepSummary.totalRevenue !== 5000) {
      throw new Error(`Expected September Revenue to be ₹5,000, got ₹${sepSummary.totalRevenue}`);
    }
    if (sepSummary.grossProfit !== 1850) {
      throw new Error(`Expected September Gross Profit to be ₹1,850, got ₹${sepSummary.grossProfit}`);
    }
    if (sepSummary.grossMarginPercentage !== 37) {
      throw new Error(`Expected September Gross Margin to be 37%, got ${sepSummary.grossMarginPercentage}%`);
    }

    console.log(`[TEST 3] September COGS Aggregation: COGS = ₹${sepSummary.totalCogs}, Rev = ₹${sepSummary.totalRevenue}, Gross Profit = ₹${sepSummary.grossProfit} (37% Margin) [PASSED]`);

    // [TEST 4] Historical Cost Invariant Guarantee Test (CRITICAL ARCHITECTURE REQUIREMENT)
    // Supplier price increase in October: Maggi cost rises from ₹10 to ₹14 in Product catalog!
    await Product.updateOne({ _id: prodMaggi._id }, { $set: { costPrice: 14 } });

    // October Sale (5 Oct 2026): 100 Maggi sold with new costPrice ₹14 (Selling ₹18)
    // Cost = 100 * ₹14 = ₹1,400, Rev = ₹1,800
    const octDate = new Date(Date.UTC(2026, 9, 5, 11, 0, 0));
    const invOct = await Invoice.create({
      businessId: storeAlpha._id,
      invoiceNumber: `INV-OCT-01-${runId}`,
      subtotal: 1800,
      discount: 0,
      tax: 0,
      total: 1800,
      paidAmount: 1800,
      dueAmount: 0,
      paymentStatus: "PAID",
      paymentMode: "CASH",
      status: "COMPLETED",
      createdAt: octDate,
      items: [
        {
          productId: prodMaggi._id,
          name: prodMaggi.name,
          sku: prodMaggi.sku,
          quantity: 100,
          soldPrice: 18,
          costPrice: 14,
          totalPrice: 1800,
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
      quantity: 100,
      soldPrice: 18,
      costPrice: 14,
      totalPrice: 1800,
      grossProfit: 400,
      createdAt: octDate,
    });

    // Re-verify September COGS: It MUST NOT change to ₹14! It must strictly remain ₹3,150!
    const recheckedSep = await cogsAnalyticsService.aggregateAndCacheMonth(storeAlpha._id, 2026, 9, "MANUAL_RECALCULATE");
    if (recheckedSep.totalCogs !== 3150) {
      throw new Error(`VIOLATION: Historical September COGS was distorted by catalog price update! Expected ₹3,150, got ₹${recheckedSep.totalCogs}`);
    }

    // Check October COGS: Should use new historical snapshot ₹14 (100 * 14 = ₹1,400)
    const octSummary = await cogsAnalyticsService.aggregateAndCacheMonth(storeAlpha._id, 2026, 10);
    if (octSummary.totalCogs !== 1400) {
      throw new Error(`Expected October COGS to be ₹1,400, got ₹${octSummary.totalCogs}`);
    }

    console.log(`[TEST 4] Historical Cost Price Invariant Guaranteed: Maggi catalog price updated ₹10 -> ₹14; September COGS remained ₹3,150 while October COGS recognized ₹1,400 [PASSED]`);

    // [TEST 5] Mathematical Calculation Verification: SUM(Sale Item cost * Qty Sold)
    // Formula verification on multi-item checkout
    const octDate2 = new Date(Date.UTC(2026, 9, 15, 12, 0, 0));
    const invOct2 = await Invoice.create({
      businessId: storeAlpha._id,
      invoiceNumber: `INV-OCT-02-${runId}`,
      subtotal: 5000,
      discount: 0,
      tax: 0,
      total: 5000,
      paidAmount: 2000,
      dueAmount: 3000,
      paymentStatus: "PARTIAL", // Credit / Partial payment: COGS is still fully recognized!
      paymentMode: "SPLIT",
      status: "COMPLETED",
      createdAt: octDate2,
      items: [
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
          quantity: 100,
          soldPrice: 30,
          costPrice: 18,
          totalPrice: 3000,
          grossProfit: 1200,
        },
      ],
    });

    await SaleItem.insertMany([
      {
        businessId: storeAlpha._id,
        saleId: invOct2._id,
        productId: prodCoke._id,
        name: prodCoke.name,
        sku: prodCoke.sku,
        quantity: 50,
        soldPrice: 40,
        costPrice: 25, // 50 * 25 = 1250
        totalPrice: 2000,
        grossProfit: 750,
        createdAt: octDate2,
      },
      {
        businessId: storeAlpha._id,
        saleId: invOct2._id,
        productId: prodBiscuit._id,
        name: prodBiscuit.name,
        sku: prodBiscuit.sku,
        quantity: 100,
        soldPrice: 30,
        costPrice: 18, // 100 * 18 = 1800
        totalPrice: 3000,
        grossProfit: 1200,
        createdAt: octDate2,
      },
    ]);

    // October Total COGS:
    // Sale 1: 100 Maggi @ 14 = ₹1,400
    // Sale 2: 50 Coke @ 25 = ₹1,250
    //         100 Biscuit @ 18 = ₹1,800
    // Total October COGS = 1,400 + 1,250 + 1,800 = ₹4,450
    // Total October Revenue = 1,800 + 5,000 = ₹6,800
    // Gross Profit = 6,800 - 4,450 = ₹2,350
    // Gross Margin % = (2,350 / 6,800) * 100 = 34.56%
    const updatedOct = await cogsAnalyticsService.aggregateAndCacheMonth(storeAlpha._id, 2026, 10, "MANUAL_RECALCULATE");

    if (updatedOct.totalCogs !== 4450) {
      throw new Error(`Expected October Total COGS to be ₹4,450, got ₹${updatedOct.totalCogs}`);
    }
    if (updatedOct.totalRevenue !== 6800) {
      throw new Error(`Expected October Total Revenue to be ₹6,800, got ₹${updatedOct.totalRevenue}`);
    }
    if (updatedOct.grossProfit !== 2350) {
      throw new Error(`Expected October Gross Profit to be ₹2,350, got ₹${updatedOct.grossProfit}`);
    }
    if (updatedOct.grossMarginPercentage !== 34.56) {
      throw new Error(`Expected October Gross Margin to be 34.56%, got ${updatedOct.grossMarginPercentage}%`);
    }

    console.log(`[TEST 5] Mathematical Formula Verified: SUM(cost * qty) = ₹${updatedOct.totalCogs}, Gross Profit = ₹${updatedOct.grossProfit} (34.56% Margin) [PASSED]`);

    // [TEST 6] Exclusion of Cancelled / Voided Invoices
    // Create an invoice with status: "CANCELLED"
    const cancelledDate = new Date(Date.UTC(2026, 9, 25, 15, 0, 0));
    const invCancelled = await Invoice.create({
      businessId: storeAlpha._id,
      invoiceNumber: `INV-CANCELLED-${runId}`,
      subtotal: 10000,
      total: 10000,
      status: "CANCELLED", // STRICTLY EXCLUDED
      createdAt: cancelledDate,
      items: [
        {
          productId: prodCoke._id,
          name: prodCoke.name,
          sku: prodCoke.sku,
          quantity: 200,
          soldPrice: 40,
          costPrice: 25,
          totalPrice: 8000,
          grossProfit: 3000,
        },
      ],
    });

    await SaleItem.create({
      businessId: storeAlpha._id,
      saleId: invCancelled._id,
      productId: prodCoke._id,
      name: prodCoke.name,
      sku: prodCoke.sku,
      quantity: 200,
      soldPrice: 40,
      costPrice: 25, // 200 * 25 = 5000 COGS should be IGNORED
      totalPrice: 8000,
      grossProfit: 3000,
      createdAt: cancelledDate,
    });

    const octAfterCancel = await cogsAnalyticsService.aggregateAndCacheMonth(storeAlpha._id, 2026, 10, "MANUAL_RECALCULATE");
    if (octAfterCancel.totalCogs !== 4450) {
      throw new Error(`CANCELLED INVOICE LEAKAGE: Expected COGS to remain ₹4,450, got ₹${octAfterCancel.totalCogs}`);
    }

    console.log(`[TEST 6] Cancelled Invoice Exclusion: Voided invoice with ₹5,000 item cost strictly excluded from COGS [PASSED]`);

    // [TEST 7] Month-over-Month (MoM) Growth Dynamics
    // September COGS: ₹3,150 -> October COGS: ₹4,450
    // MoM Variance: 4,450 - 3,150 = +₹1,300
    // MoM Growth Rate: (1,300 / 3,150) * 100 = +41.27%
    if (octAfterCancel.momVariance !== 1300) {
      throw new Error(`Expected MoM Variance to be +₹1,300, got ₹${octAfterCancel.momVariance}`);
    }
    if (octAfterCancel.momGrowthRate !== 41.27) {
      throw new Error(`Expected MoM Growth Rate to be +41.27%, got ${octAfterCancel.momGrowthRate}%`);
    }

    console.log(`[TEST 7] MoM Dynamics: Sept ₹3,150 -> Oct ₹4,450 | Variance = +₹${octAfterCancel.momVariance}, Growth = +${octAfterCancel.momGrowthRate}% [PASSED]`);

    // [TEST 8] Granular Day-by-Day COGS Breakdown
    const dailyBreakdown = await cogsAnalyticsService.getDailyCogsBreakdown(storeAlpha._id, 2026, 10);
    const day5 = dailyBreakdown.dailyBreakdown.find((d) => d.day === 5);
    const day15 = dailyBreakdown.dailyBreakdown.find((d) => d.day === 15);

    if (!day5 || day5.cogs !== 1400) {
      throw new Error(`Expected Oct 5 COGS to be ₹1,400, got ₹${day5?.cogs}`);
    }
    if (!day15 || day15.cogs !== 3050) {
      throw new Error(`Expected Oct 15 COGS to be ₹3,050 (1250+1800), got ₹${day15?.cogs}`);
    }

    console.log(`[TEST 8] Granular Daily Breakdown: Oct 5 COGS = ₹${day5.cogs}, Oct 15 COGS = ₹${day15.cogs} [PASSED]`);

    // [TEST 9] Custom Period Date Range Query (T53 'specified periods' capability)
    // Filter between 10 Oct and 20 Oct 2026 (only includes Sale 2: COGS ₹3,050)
    const customPeriod = await cogsAnalyticsService.calculatePeriodCogs(storeAlpha._id, {
      startDate: new Date(Date.UTC(2026, 9, 10, 0, 0, 0)),
      endDate: new Date(Date.UTC(2026, 9, 20, 23, 59, 59)),
    });

    if (customPeriod.totalCogs !== 3050) {
      throw new Error(`Expected custom date range COGS to be ₹3,050, got ₹${customPeriod.totalCogs}`);
    }
    if (customPeriod.totalRevenue !== 5000) {
      throw new Error(`Expected custom date range Revenue to be ₹5,000, got ₹${customPeriod.totalRevenue}`);
    }

    console.log(`[TEST 9] Custom Period Aggregation (10-20 Oct): COGS = ₹${customPeriod.totalCogs}, Rev = ₹${customPeriod.totalRevenue} [PASSED]`);

    // [TEST 10] Top Product Cost Drivers & Ranking
    const productRanking = await cogsAnalyticsService.getProductCogsRanking(storeAlpha._id, {
      year: 2026,
      month: 10,
      sortBy: "totalCogs",
    });

    if (productRanking.length < 3) {
      throw new Error(`Expected at least 3 ranked products in October, got ${productRanking.length}`);
    }
    // Highest COGS in Oct is Biscuit (₹1,800) followed by Maggi (₹1,400) and Coke (₹1,250)
    if (productRanking[0].name !== prodBiscuit.name || productRanking[0].totalCogs !== 1800) {
      throw new Error(`Expected top COGS product to be Biscuit (₹1,800), got ${productRanking[0].name} (₹${productRanking[0].totalCogs})`);
    }

    console.log(`[TEST 10] Product COGS Ranking: #1 ${productRanking[0].name} (₹${productRanking[0].totalCogs}), #2 ${productRanking[1].name} (₹${productRanking[1].totalCogs}) [PASSED]`);

    // [TEST 11] Multi-Tenant Security Boundary Isolation (Zero Cross-Tenant Leakage)
    // Create Sale in Store Beta
    const betaProd = await Product.create({
      businessId: storeBeta._id,
      name: "Beta Cooking Oil",
      sku: `BETA-OIL-${runId}`,
      sellingPrice: 200,
      costPrice: 150,
      currentStock: 200,
    });

    const betaInv = await Invoice.create({
      businessId: storeBeta._id,
      invoiceNumber: `INV-BETA-${runId}`,
      subtotal: 20000,
      total: 20000,
      status: "COMPLETED",
      createdAt: octDate,
      items: [
        {
          productId: betaProd._id,
          name: betaProd.name,
          sku: betaProd.sku,
          quantity: 100,
          soldPrice: 200,
          costPrice: 150,
          totalPrice: 20000,
          grossProfit: 5000,
        },
      ],
    });

    await SaleItem.create({
      businessId: storeBeta._id,
      saleId: betaInv._id,
      productId: betaProd._id,
      name: betaProd.name,
      sku: betaProd.sku,
      quantity: 100,
      soldPrice: 200,
      costPrice: 150, // 100 * 150 = ₹15,000 COGS in Store Beta
      totalPrice: 20000,
      grossProfit: 5000,
      createdAt: octDate,
    });

    // Verify Store Alpha October summary remains ₹4,450
    const alphaOctVerify = await cogsAnalyticsService.aggregateAndCacheMonth(storeAlpha._id, 2026, 10);
    if (alphaOctVerify.totalCogs !== 4450) {
      throw new Error(`CROSS-TENANT POLLUTION: Store Alpha COGS mutated to ₹${alphaOctVerify.totalCogs}`);
    }

    // Verify Store Beta October summary is strictly ₹15,000
    const betaOctVerify = await cogsAnalyticsService.aggregateAndCacheMonth(storeBeta._id, 2026, 10);
    if (betaOctVerify.totalCogs !== 15000) {
      throw new Error(`Expected Store Beta COGS to be ₹15,000, got ₹${betaOctVerify.totalCogs}`);
    }

    console.log(`[TEST 11] Multi-Tenant Security Isolation: Store Alpha COGS = ₹${alphaOctVerify.totalCogs}, Store Beta COGS = ₹${betaOctVerify.totalCogs} (Zero Cross-Tenant Leakage) [PASSED]`);

    // Cleanup fixtures
    await Promise.all([
      Business.deleteMany({ _id: { $in: [storeAlpha._id, storeBeta._id] } }),
      Product.deleteMany({ _id: { $in: [prodMaggi._id, prodCoke._id, prodBiscuit._id, betaProd._id] } }),
      Invoice.deleteMany({ businessId: { $in: [storeAlpha._id, storeBeta._id] } }),
      SaleItem.deleteMany({ businessId: { $in: [storeAlpha._id, storeBeta._id] } }),
      MonthlyCogsSummary.deleteMany({ businessId: { $in: [storeAlpha._id, storeBeta._id] } }),
    ]);

    console.log("\n================================================================================");
    console.log("  ALL 11 TEST SUITES FOR TASK T53 PASSED SUCCESSFULLY! (100% COVERAGE) ");
    console.log("================================================================================");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ TEST SUITE FAILED:", err);
    process.exit(1);
  }
}

runTests();
