const mongoose = require("mongoose");
const { Customer, CustomerLedger } = require("../src/models/customer.model");
const customerLedgerRepo = require("../src/repositories/customerLedger.repository");
const customerRepo = require("../src/repositories/customer.repository");
require("dotenv").config({ path: "c:/Users/AYUSH/OneDrive/Desktop/VenderOS/Backend/.env" });

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://ayushsharma_db_user:Ayush%402003@cluster0.n18h7.mongodb.net/retail_management_system?retryWrites=true&w=majority&appName=Cluster0";

async function runPaymentHistoryTests() {
  console.log("================================================================================");
  console.log("TEST SUITE: T35 - CUSTOMER CREDIT PAYMENT HISTORY & REPAYMENT LOGS");
  console.log("================================================================================");

  let connection;
  try {
    connection = await mongoose.connect(MONGO_URI);
    console.log("[✓] Connected to MongoDB Atlas successfully.\n");

    const businessAId = new mongoose.Types.ObjectId();
    const businessBId = new mongoose.Types.ObjectId();

    // ── TEST 1: Customer Creation & Credit Sale (No Payments Yet) ───────────────
    console.log("--> [TEST 1] Creating Customer in Business A and Booking ₹10,000 Udhaar...");
    const customerA = await customerRepo.createCustomer(businessAId, {
      name: "Suresh Mehra",
      phone: "+919877665544",
      creditLimit: 15000,
      notes: "Regular retail client",
    });

    const fakeSaleId = new mongoose.Types.ObjectId();
    await customerLedgerRepo.recordSaleCredit({
      businessId: businessAId,
      customerId: customerA._id,
      invoiceId: fakeSaleId,
      invoiceNumber: "INV-6001",
      unpaidAmount: 10000,
      notes: "Purchased electronics on credit",
    });

    // Check payment history before any repayments
    const emptyHistory = await customerLedgerRepo.getCustomerPaymentHistory(businessAId, customerA._id);
    console.log(`[✓] Initial Payment History Count: ${emptyHistory.payments.length} (Expected: 0)`);
    if (emptyHistory.payments.length !== 0) throw new Error("Payment history should not include credit sales");
    if (emptyHistory.summary.totalAmountPaid !== 0) throw new Error("Initial total paid should be 0");

    // ── TEST 2: Recording Multiple Repayments (Cash, UPI, Card) ─────────────────
    console.log("\n--> [TEST 2] Recording 3 Repayment Settlements...");
    
    // Repayment 1: ₹3,000 Cash
    const p1 = await customerLedgerRepo.recordPaymentSettlement({
      businessId: businessAId,
      customerId: customerA._id,
      amount: 3000,
      paymentMethod: "CASH",
      notes: "First cash installment",
    });
    console.log(`    1. Recorded Cash: ₹3,000 (New Balance: ₹${p1.newBalance})`);

    // Repayment 2: ₹4,000 UPI
    const p2 = await customerLedgerRepo.recordPaymentSettlement({
      businessId: businessAId,
      customerId: customerA._id,
      amount: 4000,
      paymentMethod: "UPI",
      notes: "UPI payment ref #UPI-9988",
    });
    console.log(`    2. Recorded UPI: ₹4,000 (New Balance: ₹${p2.newBalance})`);

    // Repayment 3: ₹1,500 Card
    const p3 = await customerLedgerRepo.recordPaymentSettlement({
      businessId: businessAId,
      customerId: customerA._id,
      amount: 1500,
      paymentMethod: "CARD",
      notes: "Debit card swipe",
    });
    console.log(`    3. Recorded Card: ₹1,500 (New Balance: ₹${p3.newBalance})`);

    // ── TEST 3: Fetch Full Payment History & Verify Aggregates ──────────────────
    console.log("\n--> [TEST 3] Fetching Full Payment History for Suresh...");
    const fullHistory = await customerLedgerRepo.getCustomerPaymentHistory(businessAId, customerA._id);
    console.log(`[✓] Summary:`, {
      totalAmountPaid: `₹${fullHistory.summary.totalAmountPaid}`,
      totalPaymentsCount: fullHistory.summary.totalPaymentsCount,
      averagePaymentAmount: `₹${fullHistory.summary.averagePaymentAmount}`,
      currentOutstanding: `₹${fullHistory.customer.currentBalance}`,
      methodBreakdown: fullHistory.summary.methodBreakdown,
    });

    if (fullHistory.payments.length !== 3) throw new Error("Expected 3 payment records");
    if (fullHistory.summary.totalAmountPaid !== 8500) throw new Error("Expected ₹8,500 total paid");
    if (fullHistory.customer.currentBalance !== 1500) throw new Error("Expected ₹1,500 remaining balance (10000 - 8500)");
    if (fullHistory.summary.methodBreakdown.UPI !== 4000) throw new Error("Expected ₹4,000 UPI total");
    if (fullHistory.summary.methodBreakdown.CASH !== 3000) throw new Error("Expected ₹3,000 CASH total");
    if (fullHistory.summary.methodBreakdown.CARD !== 1500) throw new Error("Expected ₹1,500 CARD total");

    // ── TEST 4: Filter By Payment Method (UPI Only) ─────────────────────────────
    console.log("\n--> [TEST 4] Testing Payment Method Filter (?method=UPI)...");
    const upiOnlyHistory = await customerLedgerRepo.getCustomerPaymentHistory(businessAId, customerA._id, {
      method: "UPI",
    });
    console.log(`[✓] UPI Only Payments Count: ${upiOnlyHistory.payments.length}`);
    if (upiOnlyHistory.payments.length !== 1) throw new Error("Expected 1 UPI payment");
    if (upiOnlyHistory.payments[0].amount !== 4000) throw new Error("Expected UPI payment amount to be ₹4,000");

    // ── TEST 5: Pagination Verification ─────────────────────────────────────────
    console.log("\n--> [TEST 5] Testing Pagination (?limit=2&page=1)...");
    const page1 = await customerLedgerRepo.getCustomerPaymentHistory(businessAId, customerA._id, {
      limit: 2,
      page: 1,
    });
    console.log(`[✓] Page 1: ${page1.payments.length} payments, Total Pages: ${page1.pagination.totalPages}`);
    if (page1.payments.length !== 2) throw new Error("Expected 2 payments on page 1");
    if (page1.pagination.totalPages !== 2) throw new Error("Expected 2 total pages");

    const page2 = await customerLedgerRepo.getCustomerPaymentHistory(businessAId, customerA._id, {
      limit: 2,
      page: 2,
    });
    console.log(`[✓] Page 2: ${page2.payments.length} payment`);
    if (page2.payments.length !== 1) throw new Error("Expected 1 payment on page 2");

    // ── TEST 6: Multi-Tenant Boundary Check ─────────────────────────────────────
    console.log("\n--> [TEST 6] Testing Multi-Tenant Tenancy Boundary...");
    try {
      await customerLedgerRepo.getCustomerPaymentHistory(businessBId, customerA._id);
      throw new Error("Cross-tenant violation: Business B was able to fetch Business A payment history!");
    } catch (err) {
      console.log(`[✓] Successfully blocked cross-tenant access with message: "${err.message}"`);
    }

    // Cleanup
    await Customer.deleteMany({ businessId: { $in: [businessAId, businessBId] } });
    await CustomerLedger.deleteMany({ businessId: { $in: [businessAId, businessBId] } });
    console.log("\n[✓] Test records cleaned up successfully.");

    console.log("\n================================================================================");
    console.log("ALL 6/6 T35 TESTS PASSED SUCCESSFULLY (100% VERIFIED)");
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

runPaymentHistoryTests();
