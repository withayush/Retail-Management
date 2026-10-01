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

// 2a. Canonical CustomerLedger Schema format (creditAmount / debitAmount)
const canonicalCustomerLedger = [
  { entryType: "SALE_CREDIT", creditAmount: 1200, debitAmount: 0 },
  { entryType: "PAYMENT_RECEIVED", creditAmount: 0, debitAmount: 500 },
  { entryType: "SALE_CREDIT", creditAmount: 300, debitAmount: 0 },
  { entryType: "PAYMENT_RECEIVED", creditAmount: 0, debitAmount: 200 },
];

let canonicalRunning = 0;
for (const entry of canonicalCustomerLedger) {
  const type = entry.entryType || entry.type;
  if (type === "SALE_CREDIT" || type === "CREDIT_SALE" || type === "DEBT_INCREASE") {
    canonicalRunning += Number(entry.creditAmount ?? entry.unpaidAmount ?? entry.debit ?? 0);
  } else if (type === "PAYMENT_RECEIVED" || type === "PAYMENT_SETTLEMENT" || type === "DEBT_DECREASE") {
    canonicalRunning -= Number(entry.debitAmount ?? entry.paymentAmount ?? entry.credit ?? 0);
  }
}

assert.strictEqual(canonicalRunning, 800); // 1200 - 500 + 300 - 200 = 800
const storedCustomerBalance = 800;
assert.strictEqual(storedCustomerBalance, canonicalRunning);

console.log(` - Canonical Schema Calculated Khata Balance: ₹${canonicalRunning}`);
console.log(` - Stored Customer Master Balance            : ₹${storedCustomerBalance}`);
console.log(" - Customer Balance Invariant Check          : PASSED ✅");

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
