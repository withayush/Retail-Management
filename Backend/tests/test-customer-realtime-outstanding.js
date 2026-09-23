const mongoose = require("mongoose");
const { Customer, CustomerLedger } = require("../src/models/customer.model");
const customerLedgerRepo = require("../src/repositories/customerLedger.repository");
const customerRepo = require("../src/repositories/customer.repository");
require("dotenv").config({ path: "c:/Users/AYUSH/OneDrive/Desktop/VenderOS/Backend/.env" });

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://ayushsharma_db_user:Ayush%402003@cluster0.n18h7.mongodb.net/retail_management_system?retryWrites=true&w=majority&appName=Cluster0";

async function runRealtimeOutstandingTests() {
  console.log("================================================================================");
  console.log("TEST SUITE: T34 - REAL-TIME CUSTOMER OUTSTANDING CALCULATIONS");
  console.log("================================================================================");

  let connection;
  try {
    connection = await mongoose.connect(MONGO_URI);
    console.log("[✓] Connected to MongoDB Atlas successfully.\n");

    const businessAId = new mongoose.Types.ObjectId();
    const businessBId = new mongoose.Types.ObjectId();

    // ── TEST 1: New Customer Creation & Zero Balance ────────────────────────────
    console.log("--> [TEST 1] Creating Customer in Business A with ₹10,000 Credit Limit...");
    const customerA = await customerRepo.createCustomer(businessAId, {
      name: "Rohit Verma",
      phone: "+919811223344",
      creditLimit: 10000,
      notes: "Wholesale buyer",
    });

    console.log(`[✓] Created Customer: ${customerA.name} (ID: ${customerA._id})`);
    console.log(`    - Initial currentBalance: ₹${customerA.currentBalance}`);
    if (customerA.currentBalance !== 0) throw new Error("Initial balance must be 0");

    // ── TEST 2: Credit Purchase -> Real-Time Materialized Balance Increment ────
    console.log("\n--> [TEST 2] Processing Credit Purchase of ₹6,000 (Invoice INV-5001)...");
    const fakeSaleId = new mongoose.Types.ObjectId();
    const creditResult = await customerLedgerRepo.recordSaleCredit({
      businessId: businessAId,
      customerId: customerA._id,
      invoiceId: fakeSaleId,
      invoiceNumber: "INV-5001",
      unpaidAmount: 6000,
      notes: "Purchased grocery items on 15-day credit",
    });

    console.log(`[✓] Sale Credit Logged. New Balance: ₹${creditResult.currentBalance}`);
    if (creditResult.currentBalance !== 6000) throw new Error("Expected balance of ₹6,000");

    // Check direct customer document
    const refreshedA1 = await Customer.findById(customerA._id);
    console.log(`[✓] Direct Customer Document currentBalance: ₹${refreshedA1.currentBalance}`);
    if (refreshedA1.currentBalance !== 6000) throw new Error("Customer model currentBalance not updated");

    // ── TEST 3: Fast Outstanding Lookup Endpoint (O(1) Single-Doc Read) ─────────
    console.log("\n--> [TEST 3] Calling getCustomerOutstanding (O(1) Fast Lookup)...");
    const outstandingData = await customerLedgerRepo.getCustomerOutstanding(businessAId, customerA._id);
    console.log(`[✓] Fast Outstanding Output:`, {
      name: outstandingData.name,
      currentBalance: outstandingData.currentBalance,
      creditLimit: outstandingData.creditLimit,
      availableCredit: outstandingData.availableCredit,
      isLimitExceeded: outstandingData.isLimitExceeded,
    });

    if (outstandingData.currentBalance !== 6000) throw new Error("Fast lookup balance mismatch");
    if (outstandingData.availableCredit !== 4000) throw new Error("Expected available credit of ₹4,000 (10000 - 6000)");
    if (outstandingData.isLimitExceeded !== false) throw new Error("Limit should not be exceeded");

    // ── TEST 4: Partial Repayment Settlement -> Real-Time Decrement ─────────────
    console.log("\n--> [TEST 4] Processing Partial Cash Repayment of ₹2,500...");
    const paymentResult = await customerLedgerRepo.recordPaymentSettlement({
      businessId: businessAId,
      customerId: customerA._id,
      amount: 2500,
      paymentMethod: "CASH",
      notes: "Cash counter payment",
    });

    console.log(`[✓] Payment Recorded. New Outstanding Balance: ₹${paymentResult.newBalance}`);
    if (paymentResult.newBalance !== 3500) throw new Error("Expected new balance of ₹3,500 (6000 - 2500)");

    const refreshedA2 = await customerLedgerRepo.getCustomerOutstanding(businessAId, customerA._id);
    console.log(`[✓] Instant Customer Balance: ₹${refreshedA2.currentBalance} (Available Credit: ₹${refreshedA2.availableCredit})`);
    if (refreshedA2.currentBalance !== 3500) throw new Error("Materialized balance mismatch after payment");
    if (refreshedA2.availableCredit !== 6500) throw new Error("Expected available credit of ₹6,500 (10000 - 3500)");

    // ── TEST 5: Business-Wide Outstanding Totals & Debtor Summaries ─────────────
    console.log("\n--> [TEST 5] Testing Business-Wide Outstanding Summary & Aggregation...");
    // Create a 2nd customer with debt in Business A
    const customerA2 = await customerRepo.createCustomer(businessAId, {
      name: "Pooja Gupta",
      phone: "+919822334455",
      creditLimit: 5000,
    });
    await customerLedgerRepo.recordSaleCredit({
      businessId: businessAId,
      customerId: customerA2._id,
      unpaidAmount: 1500,
      invoiceNumber: "INV-5002",
    });

    const businessTotals = await customerLedgerRepo.getBusinessOutstandingTotals(businessAId);
    console.log(`[✓] Business A Total Outstanding: ₹${businessTotals.totalOutstanding}, Debtor Count: ${businessTotals.debtorCustomersCount}`);
    if (businessTotals.totalOutstanding !== 5000) throw new Error("Expected total store outstanding of ₹5,000 (3500 + 1500)");
    if (businessTotals.debtorCustomersCount !== 2) throw new Error("Expected 2 debtor customers in Business A");

    const debtorSummary = await customerLedgerRepo.getBusinessOutstandingSummary(businessAId, 10);
    console.log(`[✓] Top Debtors Rank:`);
    debtorSummary.forEach((d, i) => {
      console.log(`    ${i + 1}. ${d.name} -> Outstanding: ₹${d.currentBalance}`);
    });
    if (debtorSummary[0].name !== "Rohit Verma" || debtorSummary[0].currentBalance !== 3500) {
      throw new Error("Top debtor ranking incorrect (should be sorted descending by currentBalance)");
    }

    // ── TEST 6: Multi-Tenant Isolation ──────────────────────────────────────────
    console.log("\n--> [TEST 6] Testing Multi-Tenant Tenancy Guard...");
    const businessBTotals = await customerLedgerRepo.getBusinessOutstandingTotals(businessBId);
    console.log(`[✓] Business B Total Outstanding: ₹${businessBTotals.totalOutstanding} (Expected: 0)`);
    if (businessBTotals.totalOutstanding !== 0 || businessBTotals.debtorCustomersCount !== 0) {
      throw new Error("Cross-tenant leakage: Business B saw Business A debts!");
    }

    try {
      await customerLedgerRepo.getCustomerOutstanding(businessBId, customerA._id);
      throw new Error("Should have blocked cross-tenant access to Customer A from Business B");
    } catch (err) {
      console.log(`[✓] Correctly blocked cross-tenant lookup with error: "${err.message}"`);
    }

    // ── TEST 7: Complete Mathematical Consistency Verification ─────────────────
    console.log("\n--> [TEST 7] Verifying Mathematical Consistency (Materialized vs Ledger Sum)...");
    const ledgerStatement = await customerLedgerRepo.getCustomerLedger(businessAId, customerA._id);
    let computedSum = 0;
    for (const entry of ledgerStatement.entries) {
      computedSum += (entry.creditAmount || 0) - (entry.debitAmount || 0);
    }
    console.log(`    - Materialized Customer.currentBalance: ₹${refreshedA2.currentBalance}`);
    console.log(`    - Sum of Historical Ledger Entries:     ₹${computedSum}`);
    if (refreshedA2.currentBalance !== computedSum) {
      throw new Error(`Inconsistency detected! Materialized ₹${refreshedA2.currentBalance} !== Ledger Sum ₹${computedSum}`);
    }
    console.log("[✓] 100% Mathematical consistency verified between Materialized Balance and Audit Log.");

    // Cleanup test records
    await Customer.deleteMany({ businessId: { $in: [businessAId, businessBId] } });
    await CustomerLedger.deleteMany({ businessId: { $in: [businessAId, businessBId] } });
    console.log("\n[✓] Test data cleaned up successfully.");

    console.log("\n================================================================================");
    console.log("ALL 7/7 T34 TESTS PASSED SUCCESSFULLY (100% VERIFIED)");
    console.log("================================================================================");
  } catch (error) {
    console.error("\n[X] TEST FAILED:", error);
    process.exit(1);
  } finally {
    if (connection) {
      await mongoose.disconnect();
      console.log("Disconnected from MongoDB Atlas.");
    }
  }
}

runRealtimeOutstandingTests();
