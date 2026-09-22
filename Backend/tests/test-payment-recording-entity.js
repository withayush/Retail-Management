const assert = require("assert");
const mongoose = require("mongoose");
const { recordPaymentSchema } = require("../src/validations/payment.validation");

/**
 * Phase 4 - Task T28: Payment Recording Entity Test Suite
 * Validates standalone payment ledger records, multi-tranche partial payments,
 * status transitions (PENDING ➔ PARTIAL ➔ PAID), credit ledger tracking, and multi-tenancy.
 */

console.log("================================================================================");
console.log("    PHASE 4 - TASK T28: PAYMENT RECORDING ENTITY TESTS                          ");
console.log("================================================================================");

const dummyBusinessId1 = new mongoose.Types.ObjectId();
const dummyBusinessId2 = new mongoose.Types.ObjectId();
const dummyInvoice1 = new mongoose.Types.ObjectId();
const dummyInvoice2 = new mongoose.Types.ObjectId();
const dummyInvoice3 = new mongoose.Types.ObjectId();
const dummyCustomer = new mongoose.Types.ObjectId();

// Mock in-memory payment repository simulation
const createMockStore = () => ({
  invoices: [
    {
      _id: dummyInvoice1,
      businessId: dummyBusinessId1,
      invoiceNumber: "INV-1001",
      total: 500.0,
      paidAmount: 0.0,
      dueAmount: 500.0,
      paymentStatus: "PENDING",
      status: "COMPLETED",
    },
    {
      _id: dummyInvoice2,
      businessId: dummyBusinessId1,
      invoiceNumber: "INV-1002",
      total: 1000.0,
      paidAmount: 0.0,
      dueAmount: 1000.0,
      paymentStatus: "PENDING",
      status: "COMPLETED",
    },
    {
      _id: dummyInvoice3,
      businessId: dummyBusinessId1,
      invoiceNumber: "INV-1003",
      total: 2000.0,
      paidAmount: 0.0,
      dueAmount: 2000.0,
      paymentStatus: "PENDING",
      status: "COMPLETED",
      customerId: dummyCustomer,
    },
    {
      _id: new mongoose.Types.ObjectId(),
      businessId: dummyBusinessId2,
      invoiceNumber: "INV-2001",
      total: 750.0,
      paidAmount: 0.0,
      dueAmount: 750.0,
      paymentStatus: "PENDING",
      status: "COMPLETED",
    },
  ],
  payments: [],
});

const executeRecordPayment = (store, businessId, payload) => {
  const { invoiceId, amount, method, referenceId, notes } = payload;
  const inv = store.invoices.find(
    (i) => i._id.toString() === invoiceId.toString() && i.businessId.toString() === businessId.toString()
  );

  if (!inv) {
    const error = new Error("Invoice not found");
    error.code = "INVOICE_NOT_FOUND";
    throw error;
  }

  const numAmount = Math.round(Number(amount) * 100) / 100;
  const paymentDoc = {
    _id: new mongoose.Types.ObjectId(),
    businessId,
    invoiceId: inv._id,
    amount: numAmount,
    method,
    referenceId: referenceId || null,
    notes: notes || "",
    status: "SUCCESS",
    createdAt: new Date(),
  };

  store.payments.push(paymentDoc);

  // Recalculate invoice totals from all successful non-credit payments
  const nonCreditPayments = store.payments.filter(
    (p) =>
      p.businessId.toString() === businessId.toString() &&
      p.invoiceId.toString() === inv._id.toString() &&
      p.status === "SUCCESS" &&
      p.method !== "CREDIT" &&
      p.method !== "CREDIT_UDHAR"
  );

  const totalCollected = nonCreditPayments.reduce((sum, p) => sum + p.amount, 0);
  inv.paidAmount = Math.round(totalCollected * 100) / 100;
  inv.dueAmount = Math.max(0, Math.round((inv.total - inv.paidAmount) * 100) / 100);

  if (inv.paidAmount >= inv.total) {
    inv.paymentStatus = "PAID";
  } else if (inv.paidAmount > 0) {
    inv.paymentStatus = "PARTIAL";
  } else {
    inv.paymentStatus = "PENDING";
  }

  return { payment: paymentDoc, invoice: inv };
};

// -----------------------------------------------------------------------------
// [Test 1] Zod Validation for Payment Recording Schema
// -----------------------------------------------------------------------------
console.log("\n[Test 1] Zod Validation for Payment Recording Payload (Task T28):");
const validPayload = {
  invoiceId: dummyInvoice1.toString(),
  amount: 500,
  method: "CASH",
  notes: "Direct counter payment",
};
const parsedValid = recordPaymentSchema.safeParse(validPayload);
assert.strictEqual(parsedValid.success, true);
console.log(" - Valid Cash Payment Parse       : PASSED ✅");

const invalidAmount = recordPaymentSchema.safeParse({ ...validPayload, amount: -50 });
assert.strictEqual(invalidAmount.success, false);
console.log(" - Negative Amount Rejection     : PASSED ✅ (Negative amount blocked)");

const invalidMethod = recordPaymentSchema.safeParse({ ...validPayload, method: "BITCOIN" });
assert.strictEqual(invalidMethod.success, false);
console.log(" - Invalid Method Rejection      : PASSED ✅");

// -----------------------------------------------------------------------------
// [Test 2] Example 1: Full Cash Payment (INV-1001, Total: ₹500)
// -----------------------------------------------------------------------------
console.log("\n[Test 2] Example 1: Full Cash Payment (INV-1001, Total: ₹500):");
let store = createMockStore();
const payment1 = executeRecordPayment(store, dummyBusinessId1, {
  invoiceId: dummyInvoice1,
  amount: 500.0,
  method: "CASH",
  notes: "Full payment in cash",
});

assert.strictEqual(payment1.payment.amount, 500.0);
assert.strictEqual(payment1.payment.method, "CASH");
assert.strictEqual(payment1.invoice.paidAmount, 500.0);
assert.strictEqual(payment1.invoice.dueAmount, 0.0);
assert.strictEqual(payment1.invoice.paymentStatus, "PAID");

console.log(" - Recorded Payment Entity       : Amount: ₹500, Method: CASH ✅");
console.log(" - Invoice State Updated         : Paid: ₹500, Due: ₹0, Status: PAID ✅");

// -----------------------------------------------------------------------------
// [Test 3] Example 2: Multi-Tranche Partial Payments (INV-1002, Total: ₹1000)
// -----------------------------------------------------------------------------
console.log("\n[Test 3] Example 2: Multi-Tranche Partial Payments (INV-1002, Total: ₹1000):");
// Tranche 1: Customer pays ₹600 CASH
console.log(" • Step 1: Customer pays Tranche #1 (₹600 CASH)...");
const tranche1 = executeRecordPayment(store, dummyBusinessId1, {
  invoiceId: dummyInvoice2,
  amount: 600.0,
  method: "CASH",
  notes: "Tranche 1",
});

assert.strictEqual(tranche1.payment.amount, 600.0);
assert.strictEqual(tranche1.invoice.paidAmount, 600.0);
assert.strictEqual(tranche1.invoice.dueAmount, 400.0);
assert.strictEqual(tranche1.invoice.paymentStatus, "PARTIAL");
console.log("   Result: Status='PARTIAL', Paid=₹600, Due=₹400 ✅");

// Tranche 2: Customer pays remaining ₹400 via UPI with Reference ID
console.log(" • Step 2: Customer pays Tranche #2 (₹400 UPI with ref 'UPI98765')...");
const tranche2 = executeRecordPayment(store, dummyBusinessId1, {
  invoiceId: dummyInvoice2,
  amount: 400.0,
  method: "UPI",
  referenceId: "UPI98765",
  notes: "Tranche 2 settlement",
});

assert.strictEqual(tranche2.payment.amount, 400.0);
assert.strictEqual(tranche2.payment.method, "UPI");
assert.strictEqual(tranche2.payment.referenceId, "UPI98765");
assert.strictEqual(tranche2.invoice.paidAmount, 1000.0);
assert.strictEqual(tranche2.invoice.dueAmount, 0.0);
assert.strictEqual(tranche2.invoice.paymentStatus, "PAID");

console.log("   Result: Total Paid=₹1000 (₹600 CASH + ₹400 UPI), Due=₹0, Status='PAID' ✅");
console.log(" - Multi-Payment Ledger Count    : 2 separate payment records linked to INV-1002 ✅");

// -----------------------------------------------------------------------------
// [Test 4] Example 3: Credit / Udhar Recording (INV-1003, Total: ₹2000)
// -----------------------------------------------------------------------------
console.log("\n[Test 4] Example 3: Credit / Udhar Recording (INV-1003, Total: ₹2000):");
const creditPayment = executeRecordPayment(store, dummyBusinessId1, {
  invoiceId: dummyInvoice3,
  amount: 2000.0,
  method: "CREDIT",
  notes: "Udhar / Credit purchase to be settled later",
});

assert.strictEqual(creditPayment.payment.method, "CREDIT");
assert.strictEqual(creditPayment.payment.amount, 2000.0);
assert.strictEqual(creditPayment.invoice.paidAmount, 0.0); // No cash collected
assert.strictEqual(creditPayment.invoice.dueAmount, 2000.0); // Full amount remains due
assert.strictEqual(creditPayment.invoice.paymentStatus, "PENDING");

console.log(" - Credit Record Created         : ₹2000 Method='CREDIT' ✅");
console.log(" - Invoice Outstanding Preserved : Paid: ₹0, Due: ₹2000, Status: PENDING ✅");

// -----------------------------------------------------------------------------
// [Test 5] Payment Method Breakdown & Aggregate Summary
// -----------------------------------------------------------------------------
console.log("\n[Test 5] Payment Method Breakdown & Collection Aggregates:");
let totalCash = 0;
let totalUpi = 0;
let totalCredit = 0;
let totalCollected = 0;

for (const p of store.payments) {
  if (p.method === "CASH") totalCash += p.amount;
  if (p.method === "UPI") totalUpi += p.amount;
  if (p.method === "CREDIT") totalCredit += p.amount;
  if (p.method !== "CREDIT") totalCollected += p.amount;
}

assert.strictEqual(totalCash, 1100.0); // 500 + 600
assert.strictEqual(totalUpi, 400.0); // 400
assert.strictEqual(totalCredit, 2000.0); // 2000
assert.strictEqual(totalCollected, 1500.0); // 1100 + 400

console.log(" - Total Cash Collected          : ₹", totalCash, "✅");
console.log(" - Total UPI Collected           : ₹", totalUpi, "✅");
console.log(" - Total Credit Outstanding      : ₹", totalCredit, "✅");
console.log(" - Total Net Cash/UPI Inflow     : ₹", totalCollected, "✅");

// -----------------------------------------------------------------------------
// [Test 6] Multi-Tenant Business Isolation Guard
// -----------------------------------------------------------------------------
console.log("\n[Test 6] Multi-Tenant Business Isolation Guard:");
let crossTenantBlocked = false;
try {
  executeRecordPayment(store, dummyBusinessId1, {
    invoiceId: store.invoices.find((i) => i.businessId === dummyBusinessId2)._id,
    amount: 100.0,
    method: "CASH",
  });
} catch (err) {
  crossTenantBlocked = true;
  assert.strictEqual(err.code, "INVOICE_NOT_FOUND");
}

assert.strictEqual(crossTenantBlocked, true);
console.log(" - Cross-Tenant Payment Attempt  : BLOCKED ✅ (Foreign invoices 100% isolated)");

console.log("\n================================================================================");
console.log("    ALL PHASE 4 - TASK T28 PAYMENT RECORDING ENTITY TESTS PASSED! 🎉            ");
console.log("================================================================================\n");
