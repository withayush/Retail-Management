const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const { Supplier, SupplierLedger } = require("../src/models/supplier.model");
const Business = require("../src/models/business.model");
const supplierLedgerRepo = require("../src/repositories/supplierLedger.repository");
const supplierService = require("../src/services/supplier.service");

async function runSupplierLedgerTests() {
  console.log("================================================================================");
  console.log("  PHASE 6 - TASK T39: SUPPLIER LEDGER TRANSACTION LOG TEST SUITE");
  console.log("================================================================================");

  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/venderos";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB successfully.\n");

  const runId = Date.now().toString().slice(-6);

  try {
    // 1. Setup Mock Business Tenants
    const testBiz1 = await Business.create({
      name: `T39 Biz Alpha ${runId}`,
      email: `t39.alpha.${runId}@test.com`,
      phone: `+919811${runId.slice(0, 6)}`,
      currency: "INR",
    });

    const testBiz2 = await Business.create({
      name: `T39 Biz Beta ${runId}`,
      email: `t39.beta.${runId}@test.com`,
      phone: `+919822${runId.slice(0, 6)}`,
      currency: "INR",
    });

    console.log(`[TEST 1] Setup Multi-Tenant Businesses:`);
    console.log(`  - Business Alpha: ${testBiz1._id}`);
    console.log(`  - Business Beta:  ${testBiz2._id}`);

    // 2. Create Supplier for Business Alpha
    const [supplierAlpha] = await Supplier.create([
      {
        businessId: testBiz1._id,
        company: `ABC Distributors ${runId}`,
        contactName: "Amit Sharma",
        phone: `+919833${runId.slice(0, 6)}`,
        email: `abc.${runId}@distributors.com`,
        currentBalance: 0,
        totalPurchases: 0,
      },
    ]);

    console.log(`\n[TEST 2] Created Supplier: ${supplierAlpha.company} (ID: ${supplierAlpha._id})`);
    console.log(`  Initial Balance: ₹${supplierAlpha.currentBalance}`);

    // 3. Record First Inventory Purchase Credit (₹50,000)
    const mockPurchaseId1 = new mongoose.Types.ObjectId();
    const creditRes1 = await supplierLedgerRepo.recordPurchaseCredit({
      businessId: testBiz1._id,
      supplierId: supplierAlpha._id,
      purchaseId: mockPurchaseId1,
      purchaseInvoiceNumber: "INV-2026-001",
      invoiceValue: 50000,
      notes: "100 Maggi + 100 Coke + 50 Biscuits",
      createdByName: "Store Manager",
    });

    console.log(`\n[TEST 3] Logged Purchase Credit #1: ₹50,000`);
    console.log(`  - Returned New Balance: ₹${creditRes1.newBalance}`);
    console.log(`  - Ledger Entry Type: ${creditRes1.ledgerEntry.entryType}`);
    console.log(`  - Entry Invoice Value: ₹${creditRes1.ledgerEntry.invoiceValue}`);
    console.log(`  - Entry Balance Snapshot: ₹${creditRes1.ledgerEntry.balance}`);
    if (creditRes1.newBalance !== 50000) {
      throw new Error(`Expected balance 50000, got ${creditRes1.newBalance}`);
    }

    // 4. Test Idempotency Guard (Duplicate Purchase Recording)
    const dupRes = await supplierLedgerRepo.recordPurchaseCredit({
      businessId: testBiz1._id,
      supplierId: supplierAlpha._id,
      purchaseId: mockPurchaseId1,
      purchaseInvoiceNumber: "INV-2026-001",
      invoiceValue: 50000,
      notes: "Duplicate attempt",
    });

    console.log(`\n[TEST 4] Tested Idempotency Guard:`);
    console.log(`  - Already Processed Flag: ${dupRes.alreadyProcessed}`);
    console.log(`  - Current Balance Maintained: ₹${dupRes.currentBalance}`);
    if (!dupRes.alreadyProcessed || dupRes.currentBalance !== 50000) {
      throw new Error("Idempotency guard failed for purchase credit.");
    }

    // 5. Record Payment Disbursement (₹20,000 via UPI)
    const payRes1 = await supplierLedgerRepo.recordSupplierPayment({
      businessId: testBiz1._id,
      supplierId: supplierAlpha._id,
      amount: 20000,
      paymentMethod: "UPI",
      referenceId: "UPI-AXIS-998877",
      notes: "Part payment via GPay",
      createdByName: "Cashier",
    });

    console.log(`\n[TEST 5] Logged Payment Disbursement #1: ₹20,000 (UPI)`);
    console.log(`  - Returned New Balance: ₹${payRes1.newBalance}`);
    console.log(`  - Ledger Entry Type: ${payRes1.ledgerEntry.entryType}`);
    console.log(`  - Entry Payment Amount: ₹${payRes1.ledgerEntry.paymentAmount}`);
    console.log(`  - Entry Balance Snapshot: ₹${payRes1.ledgerEntry.balance}`);
    if (payRes1.newBalance !== 30000) {
      throw new Error(`Expected balance 30000, got ${payRes1.newBalance}`);
    }

    // 6. Record Second Purchase Credit (₹20,000)
    const mockPurchaseId2 = new mongoose.Types.ObjectId();
    const creditRes2 = await supplierLedgerRepo.recordPurchaseCredit({
      businessId: testBiz1._id,
      supplierId: supplierAlpha._id,
      purchaseId: mockPurchaseId2,
      purchaseInvoiceNumber: "INV-2026-002",
      invoiceValue: 20000,
      notes: "Fresh stock delivery",
    });

    console.log(`\n[TEST 6] Logged Purchase Credit #2: ₹20,000`);
    console.log(`  - Expected: ₹30,000 + ₹20,000 = ₹50,000`);
    console.log(`  - Actual New Balance: ₹${creditRes2.newBalance}`);
    if (creditRes2.newBalance !== 50000) {
      throw new Error(`Expected balance 50000, got ${creditRes2.newBalance}`);
    }

    // 7. Record Second Payment Disbursement (₹30,000 via BANK_TRANSFER)
    const payRes2 = await supplierLedgerRepo.recordSupplierPayment({
      businessId: testBiz1._id,
      supplierId: supplierAlpha._id,
      amount: 30000,
      paymentMethod: "BANK_TRANSFER",
      referenceId: "NEFT-HDFC-112233",
      notes: "RTGS settlement",
    });

    console.log(`\n[TEST 7] Logged Payment Disbursement #2: ₹30,000 (BANK_TRANSFER)`);
    console.log(`  - Expected: ₹50,000 - ₹30,000 = ₹20,000`);
    console.log(`  - Actual New Balance: ₹${payRes2.newBalance}`);
    if (payRes2.newBalance !== 20000) {
      throw new Error(`Expected balance 20000, got ${payRes2.newBalance}`);
    }

    // 8. Append-Only Manual Adjustment Entry (e.g. ₹500 rebate / debit adjustment)
    const adjRes = await supplierLedgerRepo.appendLedgerEntry({
      businessId: testBiz1._id,
      supplierId: supplierAlpha._id,
      entryType: "ADJUSTMENT",
      invoiceValue: 0,
      paymentAmount: 500,
      notes: "Supplier volume discount adjustment",
    });

    console.log(`\n[TEST 8] Appended Manual Adjustment (-₹500 rebate)`);
    console.log(`  - Expected: ₹20,000 - ₹500 = ₹19,500`);
    console.log(`  - Actual New Balance: ₹${adjRes.newBalance}`);
    if (adjRes.newBalance !== 19500) {
      throw new Error(`Expected balance 19500, got ${adjRes.newBalance}`);
    }

    // 9. Fetch Full Supplier Ledger Statement & Aggregates
    const ledgerStatement = await supplierLedgerRepo.getSupplierLedger(testBiz1._id, supplierAlpha._id);
    console.log(`\n[TEST 9] Retrieved Full Supplier Ledger Statement:`);
    console.log(`  - Supplier: ${ledgerStatement.supplier.company}`);
    console.log(`  - Current Payable Outstanding: ₹${ledgerStatement.summary.currentPayableOutstanding}`);
    console.log(`  - Total Purchases Delivered:  ₹${ledgerStatement.summary.totalPurchasesValue}`);
    console.log(`  - Total Payments Disbursed:   ₹${ledgerStatement.summary.totalPaymentsMade}`);
    console.log(`  - Total Transactions Logged:  ${ledgerStatement.summary.totalTransactions}`);
    console.log(`  - Ledger Entries Count:       ${ledgerStatement.entries.length}`);

    if (
      ledgerStatement.summary.currentPayableOutstanding !== 19500 ||
      ledgerStatement.summary.totalPurchasesValue !== 70000 ||
      ledgerStatement.summary.totalPaymentsMade !== 50500 ||
      ledgerStatement.summary.totalTransactions !== 5
    ) {
      throw new Error("Ledger statement summary calculations mismatch.");
    }

    // 10. Multi-Tenant Tenant Isolation Guard
    let multiTenantErrorCaught = false;
    try {
      await supplierLedgerRepo.getSupplierLedger(testBiz2._id, supplierAlpha._id);
    } catch (err) {
      multiTenantErrorCaught = true;
      console.log(`\n[TEST 10] Multi-Tenancy Boundary Enforced: Correctly blocked Business Beta from reading Alpha's supplier ledger (${err.message})`);
    }
    if (!multiTenantErrorCaught) {
      throw new Error("Tenant isolation failed: Business Beta should not access Business Alpha's supplier ledger.");
    }

    // 11. Payables Summaries & Totals
    const payablesSummary = await supplierLedgerRepo.getBusinessPayablesSummary(testBiz1._id);
    const payablesTotals = await supplierLedgerRepo.getBusinessPayablesTotals(testBiz1._id);

    console.log(`\n[TEST 11] Payables Aggregates:`);
    console.log(`  - Suppliers with Outstanding Payables: ${payablesSummary.length}`);
    console.log(`  - Total Business Payables Due: ₹${payablesTotals.totalPayableOutstanding}`);
    if (payablesTotals.totalPayableOutstanding !== 19500) {
      throw new Error(`Expected payables total 19500, got ${payablesTotals.totalPayableOutstanding}`);
    }

    console.log("\n================================================================================");
    console.log("  ALL T39 SUPPLIER LEDGER TRANSACTION LOG TESTS PASSED SUCCESSFULLY! (100%)");
    console.log("================================================================================\n");

    // Cleanup test data
    await SupplierLedger.deleteMany({ businessId: { $in: [testBiz1._id, testBiz2._id] } });
    await Supplier.deleteMany({ businessId: { $in: [testBiz1._id, testBiz2._id] } });
    await Business.deleteMany({ _id: { $in: [testBiz1._id, testBiz2._id] } });
    console.log("Cleaned up test documents.\n");
  } catch (err) {
    console.error("\nTEST SUITE FAILED:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runSupplierLedgerTests();
