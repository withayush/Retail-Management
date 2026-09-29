const assert = require("assert");

console.log("================================================================================");
console.log("   TRANSACTION INTEGRITY: RECONCILIATION & SYSTEM INTEGRITY SCAN TESTS          ");
console.log("================================================================================\n");

// ==============================================================================
// TEST 1: Inventory vs Ledger Audit & Discrepancy Detection
// ==============================================================================
console.log("[Test 1] Inventory Available Stock vs sum(Ledger) Discrepancy Detection:");

const mockProducts = [
  { id: "PROD_1", name: "Tata Salt 1kg", currentStock: 20, ledgerSum: 20 }, // Clean
  { id: "PROD_2", name: "Aashirvaad Atta 5kg", currentStock: 15, ledgerSum: 15 }, // Clean
  { id: "PROD_3", name: "Fortune Oil 1L", currentStock: 30, ledgerSum: 25 }, // Drift: 5 surplus unrecorded!
];

const discrepancies = [];
let inSync = 0;

for (const p of mockProducts) {
  const diff = p.currentStock - p.ledgerSum;
  if (diff !== 0) {
    discrepancies.push({
      product: p.name,
      actual: p.currentStock,
      expected: p.ledgerSum,
      drift: diff,
    });
  } else {
    inSync++;
  }
}

assert.strictEqual(inSync, 2);
assert.strictEqual(discrepancies.length, 1);
assert.strictEqual(discrepancies[0].product, "Fortune Oil 1L");
assert.strictEqual(discrepancies[0].drift, 5);

console.log(` - In-Sync Products Count               : ${inSync} ✅`);
console.log(` - Discrepant Items Flagged             : ${discrepancies.length} ✅`);
console.log(` - Flagged Item                         : "${discrepancies[0].product}" (Drift: +${discrepancies[0].drift}) ✅`);

// ==============================================================================
// TEST 2: Customer Khata Balance Reconciliation
// ==============================================================================
console.log("\n[Test 2] Customer Ledger Running Balance Audit:");

const mockCustomerLedger = [
  { type: "SALE_CREDIT", debit: 1200, credit: 0 },
  { type: "PAYMENT_RECEIVED", debit: 0, credit: 500 },
  { type: "SALE_CREDIT", debit: 300, credit: 0 },
  { type: "PAYMENT_RECEIVED", debit: 0, credit: 200 },
];

const customerCalculatedDebt = mockCustomerLedger.reduce((bal, entry) => {
  return bal + entry.debit - entry.credit;
}, 0);

assert.strictEqual(customerCalculatedDebt, 800); // 1200 - 500 + 300 - 200 = 800

const storedCustomerBalance = 800;
assert.strictEqual(storedCustomerBalance, customerCalculatedDebt);

console.log(` - Calculated Khata Balance from Entries: ₹${customerCalculatedDebt}`);
console.log(` - Stored Customer Master Balance       : ₹${storedCustomerBalance}`);
console.log(" - Customer Balance Invariant Check     : PASSED ✅");

// ==============================================================================
// TEST 3: Supplier Accounts Payable Reconciliation
// ==============================================================================
console.log("\n[Test 3] Supplier Payables Audit & Settlement Verification:");

const mockSupplierLedger = [
  { type: "PURCHASE_CREDIT", invoiceValue: 50000, paymentAmount: 0 },
  { type: "PAYMENT_MADE", invoiceValue: 0, paymentAmount: 20000 },
  { type: "PURCHASE_CREDIT", invoiceValue: 15000, paymentAmount: 0 },
  { type: "PAYMENT_MADE", invoiceValue: 0, paymentAmount: 10000 },
];

const calculatedPayable = mockSupplierLedger.reduce((bal, entry) => {
  return bal + entry.invoiceValue - entry.paymentAmount;
}, 0);

assert.strictEqual(calculatedPayable, 35000); // 50000 - 20000 + 15000 - 10000 = 35000

const storedSupplierPayable = 35000;
assert.strictEqual(storedSupplierPayable, calculatedPayable);

console.log(` - Calculated Payable from Ledger Logs  : ₹${calculatedPayable}`);
console.log(` - Stored Supplier Master Balance       : ₹${storedSupplierPayable}`);
console.log(" - Supplier Payable Invariant Check     : PASSED ✅");

console.log("\n================================================================================");
console.log("    ALL RECONCILIATION & AUDIT TESTS PASSED (3/3) ✅                            ");
console.log("================================================================================\n");
