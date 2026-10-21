const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const payablesAnalyticsService = require("../src/services/payablesAnalytics.service");
const { Supplier, SupplierLedger } = require("../src/models/supplier.model");
const supplierLedgerRepo = require("../src/repositories/supplierLedger.repository");

async function runTests() {
  console.log("===============================================================================");
  console.log("  PHASE 9 - TASK T58: PAYABLES CONSOLIDATED INDEX TEST SUITE                  ");
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
    await Supplier.deleteMany({ businessId: { $in: [storeAlphaId, storeBetaId] } });
    await SupplierLedger.deleteMany({ businessId: { $in: [storeAlphaId, storeBetaId] } });

    // -------------------------------------------------------------
    // GROUP 1: NO SUPPLIERS EXIST
    // Empty store returns 0 payables safely
    // -------------------------------------------------------------
    console.log("--> Group 1: Testing Empty Store (No Suppliers)");
    const emptyIndex = await payablesAnalyticsService.getConsolidatedPayablesIndex(storeAlphaId);
    console.log("  Total Payables: ₹" + emptyIndex.totalPayables);
    console.log("  Suppliers With Outstanding: " + emptyIndex.suppliersWithOutstanding);
    console.log("  Total Suppliers: " + emptyIndex.totalSuppliers);
    if (emptyIndex.totalPayables !== 0 || emptyIndex.suppliersWithOutstanding !== 0 || emptyIndex.totalSuppliers !== 0) {
      throw new Error("Expected zero payables for empty store");
    }
    console.log("  [PASS] Empty store returns zero payables and zero count.\n");

    // -------------------------------------------------------------
    // GROUP 2: REPRODUCE PROMPT BENCHMARK SCENARIO (SECTION 2 & 7)
    // 3 Suppliers in Store Alpha:
    // - Supplier A: ₹50,000 purchases - ₹30,000 payments = ₹20,000 outstanding
    // - Supplier B: ₹40,000 purchases - ₹25,000 payments = ₹15,000 outstanding
    // - Supplier C: ₹30,000 purchases - ₹10,000 payments = ₹20,000 outstanding
    // Plus Supplier Zero: ₹10,000 purchases - ₹10,000 payments = ₹0 outstanding
    // Expected Total Payables = ₹55,000 across 3 suppliers with outstanding balances!
    // -------------------------------------------------------------
    console.log("--> Group 2: Testing Prompt Benchmark Scenario (Section 2 & 7)");

    const suppA = await Supplier.create({
      businessId: storeAlphaId,
      company: `Supplier A-${runId}`,
      contactName: "Aman Gupta",
      phone: `+919871${runId}`,
      currentBalance: 0,
      status: "ACTIVE",
    });

    const suppB = await Supplier.create({
      businessId: storeAlphaId,
      company: `Supplier B-${runId}`,
      contactName: "Bhavin Patel",
      phone: `+919872${runId}`,
      currentBalance: 0,
      status: "ACTIVE",
    });

    const suppC = await Supplier.create({
      businessId: storeAlphaId,
      company: `Supplier C-${runId}`,
      contactName: "Chirag Shah",
      phone: `+919873${runId}`,
      currentBalance: 0,
      status: "ACTIVE",
    });

    const suppZero = await Supplier.create({
      businessId: storeAlphaId,
      company: `Supplier Zero-${runId}`,
      contactName: "Deepak Joshi",
      phone: `+919874${runId}`,
      currentBalance: 0,
      status: "ACTIVE",
    });

    // Supplier A: ₹50,000 credit - ₹30,000 payment = ₹20,000
    await supplierLedgerRepo.recordPurchaseCredit({
      businessId: storeAlphaId,
      supplierId: suppA._id,
      invoiceValue: 50000,
      purchaseInvoiceNumber: `INV-A-${runId}`,
    });
    await supplierLedgerRepo.recordSupplierPayment({
      businessId: storeAlphaId,
      supplierId: suppA._id,
      amount: 30000,
      paymentMethod: "BANK_TRANSFER",
    });

    // Supplier B: ₹40,000 credit - ₹25,000 payment = ₹15,000
    await supplierLedgerRepo.recordPurchaseCredit({
      businessId: storeAlphaId,
      supplierId: suppB._id,
      invoiceValue: 40000,
      purchaseInvoiceNumber: `INV-B-${runId}`,
    });
    await supplierLedgerRepo.recordSupplierPayment({
      businessId: storeAlphaId,
      supplierId: suppB._id,
      amount: 25000,
      paymentMethod: "UPI",
    });

    // Supplier C: ₹30,000 credit - ₹10,000 payment = ₹20,000
    await supplierLedgerRepo.recordPurchaseCredit({
      businessId: storeAlphaId,
      supplierId: suppC._id,
      invoiceValue: 30000,
      purchaseInvoiceNumber: `INV-C-${runId}`,
    });
    await supplierLedgerRepo.recordSupplierPayment({
      businessId: storeAlphaId,
      supplierId: suppC._id,
      amount: 10000,
      paymentMethod: "CASH",
    });

    // Supplier Zero: ₹10,000 credit - ₹10,000 payment = ₹0
    await supplierLedgerRepo.recordPurchaseCredit({
      businessId: storeAlphaId,
      supplierId: suppZero._id,
      invoiceValue: 10000,
      purchaseInvoiceNumber: `INV-Z-${runId}`,
    });
    await supplierLedgerRepo.recordSupplierPayment({
      businessId: storeAlphaId,
      supplierId: suppZero._id,
      amount: 10000,
      paymentMethod: "CASH",
    });

    const benchmarkIndex = await payablesAnalyticsService.getConsolidatedPayablesIndex(storeAlphaId);

    console.log("  Gross Payables: ₹" + benchmarkIndex.grossPayables);
    console.log("  Total Payables: ₹" + benchmarkIndex.totalPayables);
    console.log("  Suppliers With Outstanding: " + benchmarkIndex.suppliersWithOutstanding);
    console.log("  Total Suppliers Count:      " + benchmarkIndex.totalSuppliers);
    console.log("  Zero Balance Suppliers:     " + benchmarkIndex.zeroBalanceSuppliersCount);

    if (benchmarkIndex.totalPayables !== 55000) {
      throw new Error(`Expected Total Payables of ₹55,000, got ₹${benchmarkIndex.totalPayables}`);
    }
    if (benchmarkIndex.suppliersWithOutstanding !== 3) {
      throw new Error(`Expected 3 suppliers with positive balance, got ${benchmarkIndex.suppliersWithOutstanding}`);
    }
    if (benchmarkIndex.totalSuppliers !== 4) {
      throw new Error(`Expected 4 total suppliers, got ${benchmarkIndex.totalSuppliers}`);
    }
    if (benchmarkIndex.zeroBalanceSuppliersCount !== 1) {
      throw new Error(`Expected 1 zero balance supplier, got ${benchmarkIndex.zeroBalanceSuppliersCount}`);
    }
    console.log("  [PASS] Benchmark scenario verified: Total Payables = ₹55,000 across 3 suppliers with positive balance.\n");

    // -------------------------------------------------------------
    // GROUP 3: PARTIAL PAYMENT SETTLEMENT UPDATE (SECTION 7 SCENARIO)
    // Record a valid supplier payment of ₹5,000 on Supplier A (₹20,000 -> ₹15,000)
    // Total payables becomes ₹50,000!
    // -------------------------------------------------------------
    console.log("--> Group 3: Testing Partial Payment Disbursement (₹5,000)");

    await supplierLedgerRepo.recordSupplierPayment({
      businessId: storeAlphaId,
      supplierId: suppA._id,
      amount: 5000,
      paymentMethod: "BANK_TRANSFER",
      referenceId: "RTGS-VERIFY-01",
    });

    const afterPaymentIndex = await payablesAnalyticsService.getConsolidatedPayablesIndex(storeAlphaId);
    console.log("  New Total Payables: ₹" + afterPaymentIndex.totalPayables + " (Expected: ₹50,000)");
    console.log("  Suppliers With Outstanding: " + afterPaymentIndex.suppliersWithOutstanding);

    if (afterPaymentIndex.totalPayables !== 50000) {
      throw new Error(`Expected updated Total Payables of ₹50,000, got ₹${afterPaymentIndex.totalPayables}`);
    }
    if (afterPaymentIndex.suppliersWithOutstanding !== 3) {
      throw new Error(`Expected 3 suppliers with balance, got ${afterPaymentIndex.suppliersWithOutstanding}`);
    }
    console.log("  [PASS] Payment of ₹5,000 reflected immediately: Total Payables = ₹50,000.\n");

    // -------------------------------------------------------------
    // GROUP 4: SUPPLIER ADVANCES & NEGATIVE BALANCES
    // Add supplier with -₹5,000 advance payment.
    // Gross Payables should remain ₹50,000.
    // Total Advances should be ₹5,000.
    // Net Payables should be ₹45,000.
    // -------------------------------------------------------------
    console.log("--> Group 4: Testing Supplier Advances & Net vs Gross Payables");

    const suppAdvance = await Supplier.create({
      businessId: storeAlphaId,
      company: `Advance Vendor-${runId}`,
      contactName: "Gaurav Malhotra",
      phone: `+919875${runId}`,
      currentBalance: -5000, // Advance payout made
      status: "ACTIVE",
    });

    const advanceIndex = await payablesAnalyticsService.getConsolidatedPayablesIndex(storeAlphaId);

    console.log("  Gross Payables:          ₹" + advanceIndex.grossPayables);
    console.log("  Total Supplier Advances: ₹" + advanceIndex.totalSupplierAdvances);
    console.log("  Net Payables:            ₹" + advanceIndex.netPayables);
    console.log("  Advance Suppliers Count: " + advanceIndex.advanceSuppliersCount);

    if (advanceIndex.grossPayables !== 50000) {
      throw new Error(`Gross Payables should remain ₹50,000, got ₹${advanceIndex.grossPayables}`);
    }
    if (advanceIndex.totalSupplierAdvances !== 5000) {
      throw new Error(`Total Advances should be ₹5,000, got ₹${advanceIndex.totalSupplierAdvances}`);
    }
    if (advanceIndex.netPayables !== 45000) {
      throw new Error(`Net Payables should be ₹45,000, got ₹${advanceIndex.netPayables}`);
    }
    if (advanceIndex.advanceSuppliersCount !== 1) {
      throw new Error(`Advance suppliers count should be 1, got ${advanceIndex.advanceSuppliersCount}`);
    }
    console.log("  [PASS] Advances cleanly segregated: Gross ₹50,000, Advance ₹5,000, Net ₹45,000.\n");

    // -------------------------------------------------------------
    // GROUP 5: ARCHIVED / INACTIVE SUPPLIER PRESERVATION
    // If an inactive / archived supplier has outstanding liabilities,
    // they must NOT disappear from consolidated payables.
    // -------------------------------------------------------------
    console.log("--> Group 5: Testing Inactive / Archived Suppliers with Liabilities");

    const archivedSupplier = await Supplier.create({
      businessId: storeAlphaId,
      company: `Archived Vendor With Debt-${runId}`,
      contactName: "Karan Johar",
      phone: `+919876${runId}`,
      currentBalance: 8000,
      status: "INACTIVE", // Archived / Inactive status
    });

    const archivedIndex = await payablesAnalyticsService.getConsolidatedPayablesIndex(storeAlphaId);
    console.log("  Total Payables with Inactive Supplier: ₹" + archivedIndex.totalPayables + " (Expected: ₹58,000)");

    if (archivedIndex.totalPayables !== 58000) {
      throw new Error(`Expected ₹58,000 after inactive vendor added, got ₹${archivedIndex.totalPayables}`);
    }
    console.log("  [PASS] Archived / Inactive supplier debt preserved in consolidated total.\n");

    // -------------------------------------------------------------
    // GROUP 6: CONSOLIDATED PAYABLES AGING & RISK PROFILE
    // Multi-tier aging breakdown (0-30, 31-60, 61-90, 90+ days)
    // -------------------------------------------------------------
    console.log("--> Group 6: Testing Consolidated Payables Aging & Risk Profile");

    const aging = archivedIndex.aging;
    console.log("  Aging Breakdown:");
    console.log("    0-30 Days:   ₹" + aging.bucket0_30 + ` (${aging.shares.share0_30}%)`);
    console.log("    31-60 Days:  ₹" + aging.bucket31_60 + ` (${aging.shares.share31_60}%)`);
    console.log("    61-90 Days:  ₹" + aging.bucket61_90 + ` (${aging.shares.share61_90}%)`);
    console.log("    90+ Days:    ₹" + aging.bucket90Plus + ` (${aging.shares.share90Plus}%)`);
    console.log("    Total Aged:  ₹" + aging.totalAgedDebt);
    console.log("  Risk Rating:   " + archivedIndex.riskProfile.rating + ` (${archivedIndex.riskProfile.label})`);

    if (aging.totalAgedDebt !== 58000) {
      throw new Error(`Total aged debt mismatch: expected 58000, got ${aging.totalAgedDebt}`);
    }
    if (!archivedIndex.riskProfile.rating) {
      throw new Error("Missing risk profile rating");
    }
    console.log("  [PASS] Aging buckets and risk profile successfully generated.\n");

    // -------------------------------------------------------------
    // GROUP 7: TOP CREDITORS RANKING & DEMOGRAPHICS
    // Creditors listed in descending order of currentBalance
    // -------------------------------------------------------------
    console.log("--> Group 7: Testing Top Creditors Ranking");

    const topPayables = archivedIndex.topPayables;
    console.log(`  Top Creditors Count: ${topPayables.length}`);
    topPayables.forEach((p, idx) => {
      console.log(`    #${idx + 1} ${p.company} -> Outstanding: ₹${p.currentBalance}`);
    });

    if (topPayables.length !== 4) {
      throw new Error(`Expected 4 creditors with positive balance, got ${topPayables.length}`);
    }
    if (topPayables[0].currentBalance < topPayables[1].currentBalance) {
      throw new Error("Creditors ranking not sorted in descending order");
    }
    console.log("  Average Payable / Supplier: ₹" + archivedIndex.averagePayablePerSupplier);
    console.log("  Payable Supplier Ratio:     " + archivedIndex.payableSupplierRatio + "%");
    console.log("  [PASS] Creditors ranking and metrics verified.\n");

    // -------------------------------------------------------------
    // GROUP 8: MULTI-TENANT BOUNDARY ISOLATION
    // Store Beta cannot access Store Alpha's supplier payables
    // -------------------------------------------------------------
    console.log("--> Group 8: Testing Multi-Tenant Boundary Isolation");

    const storeBetaIndex = await payablesAnalyticsService.getConsolidatedPayablesIndex(storeBetaId);
    console.log("  Store Beta Total Payables: ₹" + storeBetaIndex.totalPayables);
    console.log("  Store Beta Creditors:      " + storeBetaIndex.suppliersWithOutstanding);

    if (storeBetaIndex.totalPayables !== 0 || storeBetaIndex.suppliersWithOutstanding !== 0) {
      throw new Error("Cross-tenant leakage: Store Beta should have ₹0 payables");
    }
    console.log("  [PASS] Store Beta strictly isolated (Payables = ₹0, Creditors = 0).\n");

    // -------------------------------------------------------------
    // GROUP 9: FAST SUMMARY SNAPSHOT (O(1) FAST PROJECTION)
    // -------------------------------------------------------------
    console.log("--> Group 9: Testing Fast Summary Snapshot Endpoint");

    const summarySnap = await payablesAnalyticsService.getPayablesSummaryOnly(storeAlphaId);
    console.log("  Summary Snapshot:", summarySnap);

    if (summarySnap.totalPayables !== 58000 || summarySnap.suppliersWithOutstanding !== 4) {
      throw new Error("Fast summary snapshot values mismatch");
    }
    console.log("  [PASS] Fast summary snapshot verified.\n");

    console.log("===============================================================================");
    console.log("  ALL 9 TEST GROUPS FOR T58 PAYABLES CONSOLIDATED INDEX PASSED (100%)         ");
    console.log("===============================================================================\n");

    // Clean up test data
    await Supplier.deleteMany({ businessId: { $in: [storeAlphaId, storeBetaId] } });
    await SupplierLedger.deleteMany({ businessId: { $in: [storeAlphaId, storeBetaId] } });
  } catch (err) {
    console.error("\nTEST SUITE FAILED:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

runTests();
