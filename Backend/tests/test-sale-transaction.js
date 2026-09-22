const mongoose = require("mongoose");
const assert = require("assert");
const Invoice = require("../src/models/invoice.model");
const { createSaleSchema, updatePaymentStatusSchema } = require("../src/validations/sale.validation");

console.log("================================================================================");
console.log("    PHASE 4 - TASK T23: SALE TRANSACTION SCHEMA MODEL & INVOICING TESTS         ");
console.log("================================================================================\n");

const dummyBusinessId1 = new mongoose.Types.ObjectId().toString();
const dummyBusinessId2 = new mongoose.Types.ObjectId().toString();
const dummyCustomerId = new mongoose.Types.ObjectId().toString();
const dummyUserId = new mongoose.Types.ObjectId().toString();
const dummyProductId = new mongoose.Types.ObjectId().toString();

// ==============================================================================
// TEST 1: Zod Schema Validations for Sale Creation
// ==============================================================================
console.log("[Test 1] Zod Schema Validations for Sale Creation (Task T23):");

const validSalePayload = {
  invoiceNumber: "INV-1001",
  customerId: dummyCustomerId,
  customerName: "Rahul Sharma",
  customerPhone: "9876543210",
  subtotal: 100,
  discount: 10,
  tax: 5,
  total: 95,
  paidAmount: 95,
  paymentStatus: "PAID",
  paymentMode: "UPI",
  notes: "Counter POS sale",
  items: [
    {
      productId: dummyProductId,
      name: "Maggi Masala 70g",
      sku: "MAG001",
      quantity: 5,
      soldPrice: 20,
      totalPrice: 100,
    },
  ],
};

const parsed = createSaleSchema.safeParse(validSalePayload);
assert.strictEqual(parsed.success, true);
assert.strictEqual(parsed.data.total, 95);
assert.strictEqual(parsed.data.paymentStatus, "PAID");
console.log(" - Valid Sale Payload Parse       : PASSED ✅");

// Test negative subtotal rejection
const invalidSubtotal = createSaleSchema.safeParse({
  ...validSalePayload,
  subtotal: -50,
});
assert.strictEqual(invalidSubtotal.success, false);
console.log(" - Negative Subtotal Rejection    : PASSED ✅ (-50 rejected)");

// Test invalid payment status rejection
const invalidStatus = createSaleSchema.safeParse({
  ...validSalePayload,
  paymentStatus: "UNKNOWN_STATUS",
});
assert.strictEqual(invalidStatus.success, false);
console.log(" - Invalid Payment Status Block   : PASSED ✅");

// ==============================================================================
// TEST 2: Mongoose Invoice Schema Document & Financial Math Checks
// ==============================================================================
console.log("\n[Test 2] Mongoose Schema Document & Financial Math Integrity Check:");

const invoiceDoc = new Invoice({
  businessId: new mongoose.Types.ObjectId(dummyBusinessId1),
  invoiceNumber: "INV-1001",
  customerId: new mongoose.Types.ObjectId(dummyCustomerId),
  customerName: "Rahul Sharma",
  customerPhone: "9876543210",
  subtotal: 150.0,
  discount: 15.0,
  tax: 7.5,
  total: 142.5,
  paidAmount: 100.0,
  dueAmount: 42.5,
  paymentStatus: "PARTIAL",
  paymentMode: "SPLIT",
  createdBy: new mongoose.Types.ObjectId(dummyUserId),
  createdByName: "Ayush (Owner)",
  notes: "Partial payment received via Cash, balance on Udhar",
});

const valErr = invoiceDoc.validateSync();
assert.strictEqual(!valErr, true);
assert.strictEqual(invoiceDoc.subtotal, 150);
assert.strictEqual(invoiceDoc.discount, 15);
assert.strictEqual(invoiceDoc.tax, 7.5);
assert.strictEqual(invoiceDoc.total, 142.5);
assert.strictEqual(invoiceDoc.paidAmount, 100);
assert.strictEqual(invoiceDoc.dueAmount, 42.5);
assert.strictEqual(invoiceDoc.paymentStatus, "PARTIAL");

// Mathematical Equation Guarantee Check:
const expectedTotal = invoiceDoc.subtotal - invoiceDoc.discount + invoiceDoc.tax;
assert.strictEqual(invoiceDoc.total, expectedTotal);
const expectedDue = invoiceDoc.total - invoiceDoc.paidAmount;
assert.strictEqual(invoiceDoc.dueAmount, expectedDue);

console.log(" - Subtotal (₹150) - Discount (₹15) + Tax (₹7.5) = Total (₹142.5) : PASSED ✅");
console.log(" - Total (₹142.5) - Paid (₹100) = Balance Due (₹42.5)             : PASSED ✅");
console.log(" - Payment Status correctly marked as PARTIAL                     : PASSED ✅");

// ==============================================================================
// TEST 3: Walk-in vs Registered Customer Support
// ==============================================================================
console.log("\n[Test 3] Walk-in Retail Customer vs Registered Customer Support:");

const walkInInvoice = new Invoice({
  businessId: new mongoose.Types.ObjectId(dummyBusinessId1),
  invoiceNumber: "INV-1002",
  customerId: null, // Walk-in has null customerId
  customerName: "Walk-in Customer",
  customerPhone: "",
  subtotal: 50,
  discount: 0,
  tax: 0,
  total: 50,
  paidAmount: 50,
  dueAmount: 0,
  paymentStatus: "PAID",
  paymentMode: "CASH",
});

const walkInErr = walkInInvoice.validateSync();
assert.strictEqual(!walkInErr, true);
assert.strictEqual(walkInInvoice.customerId, null);
assert.strictEqual(walkInInvoice.customerName, "Walk-in Customer");
console.log(" - Walk-in Customer (null customerId, Cash Paid) : PASSED ✅");

// ==============================================================================
// TEST 4: Simulated Sequential Invoice Numbering & Aggregation Engine
// ==============================================================================
console.log("\n[Test 4] Sequential Invoice Generator & Sales Summary Simulation:");

const testInvoiceStore = [];

const simulateNextInvoiceNumber = (businessId) => {
  const count = testInvoiceStore.filter((i) => i.businessId === businessId).length;
  let seq = 1001 + count;
  let candidate = `INV-${seq}`;
  while (testInvoiceStore.some((i) => i.businessId === businessId && i.invoiceNumber === candidate)) {
    seq++;
    candidate = `INV-${seq}`;
  }
  return candidate;
};

// Generate 3 sequential invoices for Business 1
const invNum1 = simulateNextInvoiceNumber(dummyBusinessId1);
assert.strictEqual(invNum1, "INV-1001");
testInvoiceStore.push({
  businessId: dummyBusinessId1,
  invoiceNumber: invNum1,
  total: 200,
  paidAmount: 200,
  dueAmount: 0,
  paymentStatus: "PAID",
});

const invNum2 = simulateNextInvoiceNumber(dummyBusinessId1);
assert.strictEqual(invNum2, "INV-1002");
testInvoiceStore.push({
  businessId: dummyBusinessId1,
  invoiceNumber: invNum2,
  total: 150,
  paidAmount: 50,
  dueAmount: 100,
  paymentStatus: "PARTIAL",
});

const invNum3 = simulateNextInvoiceNumber(dummyBusinessId1);
assert.strictEqual(invNum3, "INV-1003");
testInvoiceStore.push({
  businessId: dummyBusinessId1,
  invoiceNumber: invNum3,
  total: 100,
  paidAmount: 0,
  dueAmount: 100,
  paymentStatus: "PENDING",
});

console.log(" - Sequential Invoice Numbers Generated : INV-1001, INV-1002, INV-1003 ✅");

// Sales summary calculation
const b1Invoices = testInvoiceStore.filter((i) => i.businessId === dummyBusinessId1);
const totalSalesAmount = b1Invoices.reduce((sum, i) => sum + i.total, 0);
const totalPaidAmount = b1Invoices.reduce((sum, i) => sum + i.paidAmount, 0);
const totalDueAmount = b1Invoices.reduce((sum, i) => sum + i.dueAmount, 0);

assert.strictEqual(totalSalesAmount, 450); // 200 + 150 + 100
assert.strictEqual(totalPaidAmount, 250);  // 200 + 50 + 0
assert.strictEqual(totalDueAmount, 200);   // 0 + 100 + 100

console.log(` - Total Revenue Billed     : ₹${totalSalesAmount} (Expected: ₹450) ✅`);
console.log(` - Total Cash/UPI Collected : ₹${totalPaidAmount} (Expected: ₹250) ✅`);
console.log(` - Total Outstanding Udhar  : ₹${totalDueAmount} (Expected: ₹200) ✅`);

// ==============================================================================
// TEST 5: Multi-Tenant Business Isolation
// ==============================================================================
console.log("\n[Test 5] Multi-Tenant Business Isolation:");

const b2InvNum = simulateNextInvoiceNumber(dummyBusinessId2);
assert.strictEqual(b2InvNum, "INV-1001"); // Business 2 starts its own clean sequence
testInvoiceStore.push({
  businessId: dummyBusinessId2,
  invoiceNumber: b2InvNum,
  total: 500,
  paidAmount: 500,
  dueAmount: 0,
  paymentStatus: "PAID",
});

const b2Invoices = testInvoiceStore.filter((i) => i.businessId === dummyBusinessId2);
assert.strictEqual(b2Invoices.length, 1);
assert.strictEqual(b2Invoices[0].invoiceNumber, "INV-1001");
console.log(" - Business 2 independent sequence starts at INV-1001 : PASSED ✅");
console.log(" - Multi-Tenant Isolation                             : PASSED ✅");

console.log("\n================================================================================");
console.log("    ALL PHASE 4 - TASK T23 SALE TRANSACTION TESTS PASSED! 🎉                   ");
console.log("================================================================================\n");
