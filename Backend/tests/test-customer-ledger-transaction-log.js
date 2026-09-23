const mongoose = require("mongoose");
const { Customer, CustomerLedger } = require("../src/models/customer.model");
const Business = require("../src/models/business.model");
const Account = require("../src/models/account.model");
const Invoice = require("../src/models/invoice.model");
const customerLedgerRepo = require("../src/repositories/customerLedger.repository");
const customerRepo = require("../src/repositories/customer.repository");
const env = require("../src/config/env");

/**
 * Task T33 — Customer Ledger Transaction Log Test Suite
 * 
 * Verifies:
 * 1. Schema fields: ID, CustomerID, CreditAmount, DebitAmount, Balance, SaleID
 * 2. Credit Sale transaction append: Credit = +₹5000, Debit = 0, Balance = ₹5000
 * 3. Payment settlement append: Credit = 0, Debit = -₹2000, Balance = ₹3000
 * 4. Second Payment settlement: Credit = 0, Debit = -₹3000, Balance = ₹0
 * 5. Formula check: Balance = Previous Balance + Credit - Debit
 * 6. SaleID invoice traceability link
 * 7. Multi-tenant ledger isolation across stores
 * 8. Manual adjustment ledger entry
 * 9. Customer ledger retrieval and aggregates calculation
 */

const runTests = async () => {
  console.log("================================================================================");
  console.log("  RUNNING T33 TEST SUITE: CUSTOMER LEDGER TRANSACTION LOG");
  console.log("================================================================================");

  try {
    await mongoose.connect(env.MONGO_URI);
    console.log("✓ Connected to MongoDB Atlas");

    // Clean up previous test artifacts
    await Account.deleteMany({ email: /test-t33-.*@vendoros\.test/ });
    await Business.deleteMany({ businessName: /Test T33 Store .*/ });

    // Setup Test Accounts & Businesses
    const [accA] = await Account.create([
      {
        fullName: "Store A Owner",
        email: `test-t33-a-${Date.now()}@vendoros.test`,
        phone: `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        passwordHash: "hashed_pwd",
        status: "ACTIVE",
      },
    ]);

    const [bizA] = await Business.create([
      {
        businessName: "Test T33 Store A",
        retailSegment: "Grocery / Kirana",
        ownerId: accA._id,
      },
    ]);

    const [bizB] = await Business.create([
      {
        businessName: "Test T33 Store B",
        retailSegment: "Supermarket",
        ownerId: accA._id,
      },
    ]);

    // ── TEST 1: Register Customer in Store A ─────────────────────────────────
    console.log("\n[TEST 1] Registering Customer Rahul in Store A...");
    const custRahul = await customerRepo.createCustomer(bizA._id, {
      name: "Rahul Sharma",
      phone: "+919876543210",
      email: "rahul@example.com",
      creditLimit: 10000,
    });
    console.log(`✓ Customer Rahul created with ID: ${custRahul._id}, Initial Balance: ₹${custRahul.currentBalance}`);

    // Create dummy Invoice
    const [inv1] = await Invoice.create([
      {
        businessId: bizA._id,
        invoiceNumber: "INV-5001",
        grandTotal: 5000,
        paidAmount: 0,
        balanceDue: 5000,
        paymentStatus: "UNPAID",
        paymentMethod: "CREDIT",
      },
    ]);

    // ── TEST 2: Credit Sale Entry (+₹5,000 Udhaar) ───────────────────────────
    console.log("\n[TEST 2] Recording Udhaar Sale: Credit = ₹5,000, Debit = ₹0...");
    const creditRes = await customerLedgerRepo.recordSaleCredit({
      businessId: bizA._id,
      customerId: custRahul._id,
      customerPhone: custRahul.phone,
      customerName: custRahul.name,
      invoiceId: inv1._id,
      invoiceNumber: inv1.invoiceNumber,
      unpaidAmount: 5000,
      notes: "Invoice #INV-5001 credit purchase",
      createdBy: accA._id,
      createdByName: accA.fullName,
    });

    console.log(`✓ Credit Sale recorded. New Balance: ₹${creditRes.newBalance}`);
    console.log(`✓ Ledger Entry Schema Check:`, {
      id: creditRes.ledgerEntry._id,
      customerId: creditRes.ledgerEntry.customerId,
      creditAmount: creditRes.ledgerEntry.creditAmount,
      debitAmount: creditRes.ledgerEntry.debitAmount,
      balance: creditRes.ledgerEntry.balance,
      saleId: creditRes.ledgerEntry.saleId,
    });

    if (
      creditRes.ledgerEntry.creditAmount !== 5000 ||
      creditRes.ledgerEntry.debitAmount !== 0 ||
      creditRes.ledgerEntry.balance !== 5000 ||
      String(creditRes.ledgerEntry.saleId) !== String(inv1._id)
    ) {
      throw new Error("TEST 2 FAILED: Schema values or balance mismatch for credit sale");
    }

    // ── TEST 3: Payment Settlement Entry (-₹2,000 Payment Received) ───────────
    console.log("\n[TEST 3] Recording Repayment #1: Credit = ₹0, Debit = ₹2,000...");
    const pay1Res = await customerLedgerRepo.recordPaymentSettlement({
      businessId: bizA._id,
      customerId: custRahul._id,
      amount: 2000,
      method: "CASH",
      notes: "Cash counter payment",
      createdBy: accA._id,
      createdByName: accA.fullName,
    });

    console.log(`✓ Repayment #1 recorded. New Balance: ₹${pay1Res.newBalance}`);
    if (
      pay1Res.ledgerEntry.creditAmount !== 0 ||
      pay1Res.ledgerEntry.debitAmount !== 2000 ||
      pay1Res.newBalance !== 3000
    ) {
      throw new Error(`TEST 3 FAILED: Expected balance ₹3000, got ₹${pay1Res.newBalance}`);
    }

    // ── TEST 4: Second Payment Settlement (-₹3,000 Payment Received) ──────────
    console.log("\n[TEST 4] Recording Repayment #2: Credit = ₹0, Debit = ₹3,000...");
    const pay2Res = await customerLedgerRepo.recordPaymentSettlement({
      businessId: bizA._id,
      customerId: custRahul._id,
      amount: 3000,
      method: "UPI",
      referenceId: "UPI-998877",
      notes: "UPI payment settlement",
      createdBy: accA._id,
      createdByName: accA.fullName,
    });

    console.log(`✓ Repayment #2 recorded. Final Balance: ₹${pay2Res.newBalance}`);
    if (
      pay2Res.ledgerEntry.creditAmount !== 0 ||
      pay2Res.ledgerEntry.debitAmount !== 3000 ||
      pay2Res.newBalance !== 0
    ) {
      throw new Error(`TEST 4 FAILED: Expected balance ₹0, got ₹${pay2Res.newBalance}`);
    }

    // ── TEST 5: Manual Ledger Adjustment (+₹1,500 Opening Balance Migration) ──
    console.log("\n[TEST 5] Appending Manual Ledger Entry (+₹1,500 Opening Udhaar Migration)...");
    const adjustRes = await customerLedgerRepo.appendLedgerEntry({
      businessId: bizA._id,
      customerId: custRahul._id,
      entryType: "ADJUSTMENT",
      creditAmount: 1500,
      debitAmount: 0,
      notes: "Historical udhaar migration from physical diary",
      createdBy: accA._id,
      createdByName: accA.fullName,
    });

    console.log(`✓ Manual entry appended. New Balance: ₹${adjustRes.newBalance}`);
    if (adjustRes.newBalance !== 1500) {
      throw new Error(`TEST 5 FAILED: Expected balance ₹1500, got ₹${adjustRes.newBalance}`);
    }

    // ── TEST 6: Multi-Tenant Ledger Isolation ─────────────────────────────────
    console.log("\n[TEST 6] Verifying Multi-Tenant Ledger Isolation across Stores...");
    // Register same phone customer in Store B
    const custB = await customerRepo.createCustomer(bizB._id, {
      name: "Rahul Store B",
      phone: "+919876543210",
      creditLimit: 5000,
    });

    const storeALedger = await customerLedgerRepo.getCustomerLedger(bizA._id, custRahul._id);
    const storeBLedger = await customerLedgerRepo.getCustomerLedger(bizB._id, custB._id);

    console.log(`✓ Store A Rahul Entries: ${storeALedger.entries.length}, Balance: ₹${storeALedger.summary.currentOutstanding}`);
    console.log(`✓ Store B Rahul Entries: ${storeBLedger.entries.length}, Balance: ₹${storeBLedger.summary.currentOutstanding}`);

    if (storeALedger.entries.length !== 4 || storeBLedger.entries.length !== 0) {
      throw new Error("TEST 6 FAILED: Cross-tenant ledger entries leaked between Store A and Store B");
    }

    // ── TEST 7: Ledger Audit Trail Summary & Calculation Verification ─────────
    console.log("\n[TEST 7] Verifying Chronological Ledger Statement & Summary Aggregates...");
    console.log(`✓ Total Udhaar Credit Sales: ₹${storeALedger.summary.totalCreditSales}`);
    console.log(`✓ Total Payments Received: ₹${storeALedger.summary.totalPaymentsReceived}`);
    console.log(`✓ Current Net Outstanding: ₹${storeALedger.summary.currentOutstanding}`);

    // totalCreditSales = 5000 + 1500 = 6500
    // totalPaymentsReceived = 2000 + 3000 = 5000
    // currentOutstanding = 1500
    if (
      storeALedger.summary.totalCreditSales !== 6500 ||
      storeALedger.summary.totalPaymentsReceived !== 5000 ||
      storeALedger.summary.currentOutstanding !== 1500
    ) {
      throw new Error("TEST 7 FAILED: Aggregate sums do not match ledger history");
    }

    // Clean up
    await CustomerLedger.deleteMany({ businessId: { $in: [bizA._id, bizB._id] } });
    await Customer.deleteMany({ businessId: { $in: [bizA._id, bizB._id] } });
    await Invoice.deleteMany({ businessId: { $in: [bizA._id, bizB._id] } });
    await Business.deleteMany({ _id: { $in: [bizA._id, bizB._id] } });
    await Account.deleteMany({ _id: accA._id });

    console.log("\n================================================================================");
    console.log("  ALL 7 TESTS IN T33 CUSTOMER LEDGER SUITE PASSED SUCCESSFULLY! (100%)");
    console.log("================================================================================");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ T33 Test Suite Failed:", error);
    process.exit(1);
  }
};

runTests();
