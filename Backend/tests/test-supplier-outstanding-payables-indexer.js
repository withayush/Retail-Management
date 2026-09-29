const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const { Supplier, SupplierLedger } = require("../src/models/supplier.model");
const Business = require("../src/models/business.model");
const supplierLedgerRepo = require("../src/repositories/supplierLedger.repository");

async function runOutstandingPayablesIndexerTests() {
  console.log("================================================================================");
  console.log("  PHASE 6 - TASK T40: OUTSTANDING PAYABLES INDEXER TEST SUITE");
  console.log("================================================================================");

  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/venderos";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB successfully.\n");

  const runId = Date.now().toString().slice(-6);

  try {
    // 1. Setup Multi-Tenant Business Stores
    const testBizA = await Business.create({
      name: `T40 Store Alpha ${runId}`,
      email: `t40.alpha.${runId}@test.com`,
      phone: `+919844${runId.slice(0, 6)}`,
      currency: "INR",
    });

    const testBizB = await Business.create({
      name: `T40 Store Beta ${runId}`,
      email: `t40.beta.${runId}@test.com`,
      phone: `+919855${runId.slice(0, 6)}`,
      currency: "INR",
    });

    console.log(`[TEST 1] Created Business Tenants:`);
    console.log(`  - Store Alpha ID: ${testBizA._id}`);
    console.log(`  - Store Beta ID:  ${testBizB._id}`);

    // 2. Create Multiple Suppliers for Store Alpha
    const [suppABC, suppXYZ, suppPQR, suppZero] = await Supplier.create([
      {
        businessId: testBizA._id,
        company: `ABC Distributors ${runId}`,
        contactName: "Amit Sharma",
        phone: `+919861${runId.slice(0, 6)}`,
        currentBalance: 0,
        totalPurchases: 0,
      },
      {
        businessId: testBizA._id,
        company: `XYZ Wholesale ${runId}`,
        contactName: "Sunil Verma",
        phone: `+919862${runId.slice(0, 6)}`,
        currentBalance: 0,
        totalPurchases: 0,
      },
      {
        businessId: testBizA._id,
        company: `PQR Suppliers ${runId}`,
        contactName: "Pooja Patel",
        phone: `+919863${runId.slice(0, 6)}`,
        currentBalance: 0,
        totalPurchases: 0,
      },
      {
        businessId: testBizA._id,
        company: `Zero Debt Vendor ${runId}`,
        contactName: "Rakesh Jain",
        phone: `+919864${runId.slice(0, 6)}`,
        currentBalance: 0,
        totalPurchases: 0,
      },
    ]);

    console.log(`\n[TEST 2] Created 4 Suppliers for Store Alpha.`);

    // 3. Populate Purchases & Payments (Building Varied Accounts Payable Debt)
    // ABC: ₹80,000 purchases - ₹50,000 paid = ₹30,000 balance
    await supplierLedgerRepo.recordPurchaseCredit({
      businessId: testBizA._id,
      supplierId: suppABC._id,
      invoiceValue: 80000,
      purchaseInvoiceNumber: "INV-ABC-1",
    });
    await supplierLedgerRepo.recordSupplierPayment({
      businessId: testBizA._id,
      supplierId: suppABC._id,
      amount: 50000,
      paymentMethod: "BANK_TRANSFER",
    });

    // XYZ: ₹45,000 purchases - ₹25,000 paid = ₹20,000 balance
    await supplierLedgerRepo.recordPurchaseCredit({
      businessId: testBizA._id,
      supplierId: suppXYZ._id,
      invoiceValue: 45000,
      purchaseInvoiceNumber: "INV-XYZ-1",
    });
    await supplierLedgerRepo.recordSupplierPayment({
      businessId: testBizA._id,
      supplierId: suppXYZ._id,
      amount: 25000,
      paymentMethod: "UPI",
    });

    // PQR: ₹15,000 purchases - ₹5,000 paid = ₹10,000 balance
    await supplierLedgerRepo.recordPurchaseCredit({
      businessId: testBizA._id,
      supplierId: suppPQR._id,
      invoiceValue: 15000,
      purchaseInvoiceNumber: "INV-PQR-1",
    });
    await supplierLedgerRepo.recordSupplierPayment({
      businessId: testBizA._id,
      supplierId: suppPQR._id,
      amount: 5000,
      paymentMethod: "CASH",
    });

    // Zero Debt: ₹10,000 purchases - ₹10,000 paid = ₹0 balance
    await supplierLedgerRepo.recordPurchaseCredit({
      businessId: testBizA._id,
      supplierId: suppZero._id,
      invoiceValue: 10000,
      purchaseInvoiceNumber: "INV-ZERO-1",
    });
    await supplierLedgerRepo.recordSupplierPayment({
      businessId: testBizA._id,
      supplierId: suppZero._id,
      amount: 10000,
      paymentMethod: "CASH",
    });

    console.log(`\n[TEST 3] Logged Purchases and Payments for All Suppliers.`);

    // 4. Single Supplier Outstanding Lookup (O(1) Materialized Read)
    const singleOutstanding = await supplierLedgerRepo.getSupplierOutstanding(testBizA._id, suppABC._id);
    console.log(`\n[TEST 4] Single Supplier Real-Time Outstanding (T40):`);
    console.log(`  - Supplier: ${singleOutstanding.company}`);
    console.log(`  - Current Balance Owed: ₹${singleOutstanding.currentBalance}`);
    console.log(`  - Has Payable Due: ${singleOutstanding.hasPayableDue}`);
    if (singleOutstanding.currentBalance !== 30000 || !singleOutstanding.hasPayableDue) {
      throw new Error(`Expected ABC balance 30000, got ${singleOutstanding.currentBalance}`);
    }

    // 5. Payables Summary Indexer Ranking (GET /api/suppliers/payables/summary)
    const payablesSummary = await supplierLedgerRepo.getBusinessPayablesSummary(testBizA._id);
    console.log(`\n[TEST 5] Payables Summary Indexer (Sorted Descending):`);
    console.log(`  - Number of Creditors Listed: ${payablesSummary.length} (Excluded zero debt vendors)`);
    payablesSummary.forEach((s, idx) => {
      console.log(`    ${idx + 1}. ${s.company} -> ₹${s.currentBalance}`);
    });

    if (payablesSummary.length !== 3) {
      throw new Error(`Expected 3 creditors in summary indexer, got ${payablesSummary.length}`);
    }
    if (payablesSummary[0].currentBalance !== 30000 || payablesSummary[1].currentBalance !== 20000 || payablesSummary[2].currentBalance !== 10000) {
      throw new Error("Payables summary ranking sorting order is incorrect.");
    }

    // 6. Business-Wide Payables Aggregates & Raw Cash Allocation Totals (GET /api/suppliers/payables/totals)
    const payablesTotals = await supplierLedgerRepo.getBusinessPayablesTotals(testBizA._id);
    console.log(`\n[TEST 6] Business-Wide Payables Aggregate Metrics:`);
    console.log(`  - Total Raw Cash Payable Liability: ₹${payablesTotals.totalPayableOutstanding}`);
    console.log(`  - Creditors Count: ${payablesTotals.suppliersWithPayablesCount}`);
    console.log(`  - Total Registered Suppliers: ${payablesTotals.totalSuppliersCount}`);
    console.log(`  - Average Payable / Creditor: ₹${payablesTotals.averagePayablePerSupplier}`);
    console.log(`  - Highest Payable Supplier: ${payablesTotals.highestPayableSupplier?.company} (₹${payablesTotals.highestPayableSupplier?.currentBalance})`);

    if (payablesTotals.totalPayableOutstanding !== 60000) {
      throw new Error(`Expected total payables 60000, got ${payablesTotals.totalPayableOutstanding}`);
    }
    if (payablesTotals.suppliersWithPayablesCount !== 3) {
      throw new Error(`Expected 3 payable suppliers, got ${payablesTotals.suppliersWithPayablesCount}`);
    }
    if (payablesTotals.averagePayablePerSupplier !== 20000) {
      throw new Error(`Expected average payable 20000, got ${payablesTotals.averagePayablePerSupplier}`);
    }
    if (payablesTotals.highestPayableSupplier?.currentBalance !== 30000) {
      throw new Error(`Expected highest creditor balance 30000, got ${payablesTotals.highestPayableSupplier?.currentBalance}`);
    }

    // 7. Multi-Tenant Isolation
    const storeBTotals = await supplierLedgerRepo.getBusinessPayablesTotals(testBizB._id);
    const storeBSummary = await supplierLedgerRepo.getBusinessPayablesSummary(testBizB._id);
    console.log(`\n[TEST 7] Multi-Tenant Boundary Check (Store Beta):`);
    console.log(`  - Store Beta Total Payables: ₹${storeBTotals.totalPayableOutstanding}`);
    console.log(`  - Store Beta Creditors: ${storeBSummary.length}`);
    if (storeBTotals.totalPayableOutstanding !== 0 || storeBSummary.length !== 0) {
      throw new Error("Tenant isolation failure: Store Beta should have 0 payables.");
    }

    // 8. Dynamic Real-Time Synchronization with T39 Settlement
    // Settle ₹15,000 on ABC Distributors -> ABC balance becomes ₹15,000, Total payables become ₹45,000, XYZ becomes highest creditor (₹20,000)
    await supplierLedgerRepo.recordSupplierPayment({
      businessId: testBizA._id,
      supplierId: suppABC._id,
      amount: 15000,
      paymentMethod: "BANK_TRANSFER",
      referenceId: "RTGS-NEW-SETTLE",
    });

    const refreshedTotals = await supplierLedgerRepo.getBusinessPayablesTotals(testBizA._id);
    const refreshedSummary = await supplierLedgerRepo.getBusinessPayablesSummary(testBizA._id);

    console.log(`\n[TEST 8] Dynamic Real-Time Synchronization after ₹15,000 Settlement:`);
    console.log(`  - New Total Payables: ₹${refreshedTotals.totalPayableOutstanding} (Expected: ₹45,000)`);
    console.log(`  - New Highest Creditor: ${refreshedTotals.highestPayableSupplier?.company} (₹${refreshedTotals.highestPayableSupplier?.currentBalance})`);
    console.log(`  - 1st in Ranking: ${refreshedSummary[0].company} (₹${refreshedSummary[0].currentBalance})`);
    console.log(`  - 2nd in Ranking: ${refreshedSummary[1].company} (₹${refreshedSummary[1].currentBalance})`);

    if (refreshedTotals.totalPayableOutstanding !== 45000) {
      throw new Error(`Expected refreshed total 45000, got ${refreshedTotals.totalPayableOutstanding}`);
    }
    if (refreshedSummary[0].currentBalance !== 20000 || refreshedSummary[1].currentBalance !== 15000) {
      throw new Error("Ranking order did not dynamically adjust to balance updates.");
    }

    console.log("\n================================================================================");
    console.log("  ALL T40 OUTSTANDING PAYABLES INDEXER TESTS PASSED SUCCESSFULLY! (100%)");
    console.log("================================================================================\n");

    // Cleanup
    await SupplierLedger.deleteMany({ businessId: { $in: [testBizA._id, testBizB._id] } });
    await Supplier.deleteMany({ businessId: { $in: [testBizA._id, testBizB._id] } });
    await Business.deleteMany({ _id: { $in: [testBizA._id, testBizB._id] } });
  } catch (err) {
    console.error("\nTEST SUITE FAILED:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runOutstandingPayablesIndexerTests();
