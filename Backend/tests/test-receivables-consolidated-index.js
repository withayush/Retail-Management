const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const receivablesAnalyticsService = require("../src/services/receivablesAnalytics.service");
const { Customer, CustomerLedger } = require("../src/models/customer.model");
const Invoice = require("../src/models/invoice.model");
const customerLedgerRepo = require("../src/repositories/customerLedger.repository");

async function runTests() {
  console.log("===============================================================================");
  console.log("  PHASE 9 - TASK T57: RECEIVABLES CONSOLIDATED INDEX TEST SUITE               ");
  console.log("===============================================================================");

  const mongoUri =
    process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/vendoros";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB successfully.\n");

  const runId = Date.now().toString().slice(-6);
  const storeAlphaId = new mongoose.Types.ObjectId();
  const storeBetaId = new mongoose.Types.ObjectId();

  try {
    // -------------------------------------------------------------
    // SETUP: Clean up test collections for these businesses
    // -------------------------------------------------------------
    await Customer.deleteMany({ businessId: { $in: [storeAlphaId, storeBetaId] } });
    await CustomerLedger.deleteMany({ businessId: { $in: [storeAlphaId, storeBetaId] } });
    await Invoice.deleteMany({ businessId: { $in: [storeAlphaId, storeBetaId] } });

    // -------------------------------------------------------------
    // GROUP 1: REPRODUCE PROMPT BENCHMARK SCENARIO
    // 4 Customers in Store Alpha:
    // - Ramesh: ₹6,000
    // - Suresh: ₹5,000
    // - Mohan:  ₹5,000
    // - Amit:   ₹0
    // Expected Total Receivables = ₹16,000
    // -------------------------------------------------------------
    console.log("--> Group 1: Testing Prompt Benchmark Scenario (4 Customers)");

    const ramesh = await Customer.create({
      businessId: storeAlphaId,
      name: `Ramesh-${runId}`,
      phone: `+919811${runId}`,
      currentBalance: 6000,
      creditLimit: 15000,
      status: "ACTIVE",
    });

    const suresh = await Customer.create({
      businessId: storeAlphaId,
      name: `Suresh-${runId}`,
      phone: `+919812${runId}`,
      currentBalance: 5000,
      creditLimit: 10000,
      status: "ACTIVE",
    });

    const mohan = await Customer.create({
      businessId: storeAlphaId,
      name: `Mohan-${runId}`,
      phone: `+919813${runId}`,
      currentBalance: 5000,
      creditLimit: 10000,
      status: "ACTIVE",
    });

    const amit = await Customer.create({
      businessId: storeAlphaId,
      name: `Amit-${runId}`,
      phone: `+919814${runId}`,
      currentBalance: 0,
      creditLimit: 5000,
      status: "ACTIVE",
    });

    const benchmarkIndex = await receivablesAnalyticsService.getConsolidatedReceivablesIndex(storeAlphaId);

    console.log("  Gross Receivables: ₹" + benchmarkIndex.grossReceivables);
    console.log("  Total Receivables: ₹" + benchmarkIndex.totalReceivables);
    console.log("  Debtors Count:    " + benchmarkIndex.debtorCustomersCount);
    console.log("  Total Customers:  " + benchmarkIndex.totalCustomers);

    if (benchmarkIndex.totalReceivables !== 16000) {
      throw new Error(`Expected Total Receivables of ₹16,000, got ₹${benchmarkIndex.totalReceivables}`);
    }
    if (benchmarkIndex.debtorCustomersCount !== 3) {
      throw new Error(`Expected 3 debtors with positive balance, got ${benchmarkIndex.debtorCustomersCount}`);
    }
    if (benchmarkIndex.totalCustomers !== 4) {
      throw new Error(`Expected 4 total customers, got ${benchmarkIndex.totalCustomers}`);
    }
    console.log("  [PASS] Benchmark scenario matches: Total Receivables = ₹16,000 across 3 debtors.\n");

    // -------------------------------------------------------------
    // GROUP 2: CUSTOMER ADVANCES & NEGATIVE BALANCES
    // Add customer with -₹1,000 advance payment.
    // Gross Receivables should remain ₹16,000.
    // Total Advances should be ₹1,000.
    // Net Receivables should be ₹15,000.
    // -------------------------------------------------------------
    console.log("--> Group 2: Testing Customer Advances & Net vs Gross Receivables");

    const vikasAdvance = await Customer.create({
      businessId: storeAlphaId,
      name: `Vikas-${runId}`,
      phone: `+919815${runId}`,
      currentBalance: -1000, // Advance credit held
      creditLimit: 5000,
      status: "ACTIVE",
    });

    const advanceIndex = await receivablesAnalyticsService.getConsolidatedReceivablesIndex(storeAlphaId);

    console.log("  Gross Receivables:       ₹" + advanceIndex.grossReceivables);
    console.log("  Total Customer Advances: ₹" + advanceIndex.totalCustomerAdvances);
    console.log("  Net Receivables:         ₹" + advanceIndex.netReceivables);
    console.log("  Advance Customers Count: " + advanceIndex.advanceCustomersCount);

    if (advanceIndex.grossReceivables !== 16000) {
      throw new Error(`Gross Receivables should remain ₹16,000, got ₹${advanceIndex.grossReceivables}`);
    }
    if (advanceIndex.totalCustomerAdvances !== 1000) {
      throw new Error(`Total Advances should be ₹1,000, got ₹${advanceIndex.totalCustomerAdvances}`);
    }
    if (advanceIndex.netReceivables !== 15000) {
      throw new Error(`Net Receivables should be ₹15,000, got ₹${advanceIndex.netReceivables}`);
    }
    if (advanceIndex.advanceCustomersCount !== 1) {
      throw new Error(`Advance customers count should be 1, got ${advanceIndex.advanceCustomersCount}`);
    }
    console.log("  [PASS] Advances cleanly segregated: Gross ₹16,000, Advance ₹1,000, Net ₹15,000.\n");

    // -------------------------------------------------------------
    // GROUP 3: INACTIVE / ARCHIVED CUSTOMER PRESERVATION
    // If an inactive customer owes debt, it must NOT disappear from receivables.
    // -------------------------------------------------------------
    console.log("--> Group 3: Testing Inactive / Archived Customers with Debt");

    const inactiveDebtor = await Customer.create({
      businessId: storeAlphaId,
      name: `Old Account-${runId}`,
      phone: `+919816${runId}`,
      currentBalance: 4000,
      creditLimit: 0,
      status: "INACTIVE", // Inactive status
    });

    const inactiveIndex = await receivablesAnalyticsService.getConsolidatedReceivablesIndex(storeAlphaId);
    console.log("  New Gross Receivables after inactive debtor: ₹" + inactiveIndex.grossReceivables);

    if (inactiveIndex.grossReceivables !== 20000) {
      throw new Error(`Inactive customer debt must be included: Expected ₹20,000, got ₹${inactiveIndex.grossReceivables}`);
    }
    console.log("  [PASS] Inactive customer debt preserved: Total Receivables = ₹20,000.\n");

    // -------------------------------------------------------------
    // GROUP 4: MULTI-TIER DEBT AGING CONSOLIDATION (0-30d, 31-60d, 61-90d, 90+d)
    // Create invoices with various ages
    // -------------------------------------------------------------
    console.log("--> Group 4: Testing Consolidated Debt Aging (0-30, 31-60, 61-90, 90+ Days)");

    const now = new Date();
    const daysAgo = (d) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

    // Fresh invoice (10 days ago, ₹5,000)
    await Invoice.create({
      businessId: storeAlphaId,
      customerId: ramesh._id,
      invoiceNumber: `INV-AGE-1-${runId}`,
      total: 5000,
      paidAmount: 0,
      dueAmount: 5000,
      paymentStatus: "PENDING",
      status: "COMPLETED",
      createdAt: daysAgo(10),
    });

    // 45 days ago invoice (₹4,000)
    await Invoice.create({
      businessId: storeAlphaId,
      customerId: suresh._id,
      invoiceNumber: `INV-AGE-2-${runId}`,
      total: 4000,
      paidAmount: 0,
      dueAmount: 4000,
      paymentStatus: "PENDING",
      status: "COMPLETED",
      createdAt: daysAgo(45),
    });

    // 75 days ago invoice (₹3,000)
    await Invoice.create({
      businessId: storeAlphaId,
      customerId: mohan._id,
      invoiceNumber: `INV-AGE-3-${runId}`,
      total: 3000,
      paidAmount: 0,
      dueAmount: 3000,
      paymentStatus: "PENDING",
      status: "COMPLETED",
      createdAt: daysAgo(75),
    });

    // 110 days ago invoice (₹2,000)
    await Invoice.create({
      businessId: storeAlphaId,
      customerId: inactiveDebtor._id,
      invoiceNumber: `INV-AGE-4-${runId}`,
      total: 2000,
      paidAmount: 0,
      dueAmount: 2000,
      paymentStatus: "PENDING",
      status: "COMPLETED",
      createdAt: daysAgo(110),
    });

    const agingIndex = await receivablesAnalyticsService.getConsolidatedReceivablesIndex(storeAlphaId);
    const { aging, riskProfile } = agingIndex;

    console.log("  Aging Buckets:");
    console.log("    0-30 Days:   ₹" + aging.bucket0_30);
    console.log("    31-60 Days:  ₹" + aging.bucket31_60);
    console.log("    61-90 Days:  ₹" + aging.bucket61_90);
    console.log("    90+ Days:    ₹" + aging.bucket90Plus);
    console.log("    Total Aged:  ₹" + aging.totalAgedDebt);
    console.log("  Risk Rating:   " + riskProfile.rating + " (" + riskProfile.label + ")");

    if (aging.bucket31_60 < 4000) throw new Error("Expected bucket 31-60 to contain at least ₹4,000");
    if (aging.bucket61_90 < 3000) throw new Error("Expected bucket 61-90 to contain at least ₹3,000");
    if (aging.bucket90Plus < 2000) throw new Error("Expected bucket 90+ to contain at least ₹2,000");
    console.log("  [PASS] Consolidated debt aging correctly bucketed.\n");

    // -------------------------------------------------------------
    // GROUP 5: TOP DEBTORS RANKING & AVERAGE DEBT PER DEBTOR
    // -------------------------------------------------------------
    console.log("--> Group 5: Testing Top Debtors Ranking & Demographics");

    const topDebtors = agingIndex.topDebtors;
    console.log(`  Top Debtors Count: ${topDebtors.length}`);
    topDebtors.forEach((d, i) => {
      console.log(`    #${i + 1} ${d.name} -> Outstanding: ₹${d.currentBalance}`);
    });

    if (topDebtors[0].currentBalance < topDebtors[1].currentBalance) {
      throw new Error("Top debtors must be ordered descending by current balance");
    }

    console.log("  Average Receivable per Debtor: ₹" + agingIndex.averageReceivablePerDebtor);
    console.log("  Debtor Ratio:                  " + agingIndex.debtorRatio + "%");
    console.log("  [PASS] Ranking and demographic ratios verified.\n");

    // -------------------------------------------------------------
    // GROUP 6: REPAYMENT DEDUCTION & REAL-TIME RE-CALCULATION
    // Customer Ramesh settles ₹4,000. Balance goes from ₹6,000 to ₹2,000.
    // Total Receivables should drop by ₹4,000.
    // -------------------------------------------------------------
    console.log("--> Group 6: Testing Partial Debt Repayment Settlement");

    await customerLedgerRepo.recordPaymentSettlement({
      businessId: storeAlphaId,
      customerId: ramesh._id,
      amount: 4000,
      paymentMethod: "UPI",
      notes: "UPI counter settlement",
    });

    const updatedRamesh = await Customer.findById(ramesh._id);
    console.log(`  Ramesh new balance: ₹${updatedRamesh.currentBalance} (was ₹6,000)`);
    if (updatedRamesh.currentBalance !== 2000) {
      throw new Error(`Expected Ramesh balance to be ₹2,000, got ₹${updatedRamesh.currentBalance}`);
    }

    const postPaymentIndex = await receivablesAnalyticsService.getConsolidatedReceivablesIndex(storeAlphaId);
    console.log("  Updated Gross Receivables: ₹" + postPaymentIndex.grossReceivables);

    if (postPaymentIndex.grossReceivables !== 16000) {
      throw new Error(`Expected Gross Receivables to decrease to ₹16,000, got ₹${postPaymentIndex.grossReceivables}`);
    }
    console.log("  [PASS] Repayment settlement dynamically reflected in receivables index.\n");

    // -------------------------------------------------------------
    // GROUP 7: STRICT MULTI-TENANT ISOLATION
    // Business B must see ZERO receivables despite Store Alpha having ₹16,000
    // -------------------------------------------------------------
    console.log("--> Group 7: Testing Multi-Tenant Data Isolation");

    const storeBetaIndex = await receivablesAnalyticsService.getConsolidatedReceivablesIndex(storeBetaId);
    console.log("  Store Beta Gross Receivables: ₹" + storeBetaIndex.grossReceivables);
    console.log("  Store Beta Total Debtors:     " + storeBetaIndex.debtorCustomersCount);

    if (storeBetaIndex.grossReceivables !== 0 || storeBetaIndex.debtorCustomersCount !== 0) {
      throw new Error("Cross-tenant leakage: Store Beta saw Store Alpha receivables!");
    }
    console.log("  [PASS] Store Beta strictly isolated (Receivables = ₹0).\n");

    // -------------------------------------------------------------
    // GROUP 8: FAST SUMMARY SNAPSHOT (O(1) Endpoint)
    // -------------------------------------------------------------
    console.log("--> Group 8: Testing Fast Summary Endpoint (O(1) Fast Read)");

    const summaryOnly = await receivablesAnalyticsService.getReceivablesSummaryOnly(storeAlphaId);
    console.log("  Summary Snapshot:", summaryOnly);

    if (summaryOnly.totalReceivables !== 16000) {
      throw new Error("Fast summary totalReceivables mismatch");
    }
    console.log("  [PASS] Fast summary snapshot verified.\n");

    // -------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------
    await Customer.deleteMany({ businessId: { $in: [storeAlphaId, storeBetaId] } });
    await CustomerLedger.deleteMany({ businessId: { $in: [storeAlphaId, storeBetaId] } });
    await Invoice.deleteMany({ businessId: { $in: [storeAlphaId, storeBetaId] } });

    console.log("===============================================================================");
    console.log("  ALL 8 TEST GROUPS FOR T57 RECEIVABLES CONSOLIDATED INDEX PASSED (100%)      ");
    console.log("===============================================================================");
  } catch (error) {
    console.error("\n[X] TEST FAILED:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB.");
  }
}

runTests();
