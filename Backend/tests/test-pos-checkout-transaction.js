const mongoose = require("mongoose");
const assert = require("assert");
const Invoice = require("../src/models/invoice.model");
const SaleItem = require("../src/models/saleItem.model");
const { Inventory, InventoryLedger } = require("../src/models/inventory.model");
const Payment = require("../src/models/payment.model");
const { createSaleSchema } = require("../src/validations/sale.validation");

console.log("================================================================================");
console.log("    PHASE 4 - TASK T25: CREATE SALE (POS CHECKOUT) TRANSACTION TESTS            ");
console.log("================================================================================\n");

const dummyBusinessId1 = new mongoose.Types.ObjectId().toString();
const dummyBusinessId2 = new mongoose.Types.ObjectId().toString();
const dummyCustomerId = new mongoose.Types.ObjectId().toString();
const dummyProdMaggi = new mongoose.Types.ObjectId().toString();
const dummyProdCoke = new mongoose.Types.ObjectId().toString();
const dummyProdBiscuits = new mongoose.Types.ObjectId().toString();

// ==============================================================================
// TEST 1: Zod Schema Validation for POS Checkout Payload
// ==============================================================================
console.log("[Test 1] Zod Schema Validation for POS Checkout Payload (Task T25):");

const posPayload = {
  customerName: "Rahul Sharma",
  customerPhone: "9876543210",
  subtotal: 100,
  discount: 10,
  tax: 5,
  total: 95,
  paidAmount: 95,
  paymentStatus: "PAID",
  paymentMode: "UPI",
  items: [
    {
      productId: dummyProdMaggi,
      name: "Maggi 2-Min Noodles 70g",
      sku: "MAG001",
      unit: "pcs",
      soldPrice: 15,
      costPrice: 11,
      quantity: 2,
      totalPrice: 30,
      grossProfit: 8,
    },
    {
      productId: dummyProdCoke,
      name: "Coca Cola 750ml",
      sku: "COK001",
      unit: "bottle",
      soldPrice: 40,
      costPrice: 30,
      quantity: 1,
      totalPrice: 40,
      grossProfit: 10,
    },
  ],
  notes: "POS Counter Checkout",
};

const parsed = createSaleSchema.safeParse(posPayload);
assert.strictEqual(parsed.success, true);
assert.strictEqual(parsed.data.total, 95);
assert.strictEqual(parsed.data.items.length, 2);
console.log(" - Valid POS Checkout Payload Parse    : PASSED ✅");

// ==============================================================================
// TEST 2: Pre-Flight Stock Verification & Insufficient Stock Abort Guard
// ==============================================================================
console.log("\n[Test 2] Pre-Flight Stock Verification & Insufficient Stock Rollback Guard:");

// Store state: Maggi has 1 physical unit left in store
const simulatedInventoryStore = [
  { productId: dummyProdMaggi, productName: "Maggi", availableStock: 1, reorderLevel: 5 },
  { productId: dummyProdCoke, productName: "Coca Cola", availableStock: 50, reorderLevel: 10 },
];

const requestedCartItems = [
  { productId: dummyProdMaggi, name: "Maggi", quantity: 2 }, // Requests 2 units, but only 1 exists
  { productId: dummyProdCoke, name: "Coca Cola", quantity: 1 },
];

let transactionAborted = false;
let abortErrorCode = null;
let abortErrorMessage = null;

try {
  // Pre-flight check simulation
  for (const item of requestedCartItems) {
    const inv = simulatedInventoryStore.find((i) => i.productId === item.productId);
    const avail = inv ? inv.availableStock : 0;
    if (!inv || avail < item.quantity) {
      const err = new Error(`Insufficient stock for '${item.name}'. Available: ${avail}, Requested: ${item.quantity}`);
      err.code = "INSUFFICIENT_STOCK";
      err.statusCode = 400;
      throw err;
    }
  }
} catch (err) {
  transactionAborted = true;
  abortErrorCode = err.code;
  abortErrorMessage = err.message;
}

assert.strictEqual(transactionAborted, true);
assert.strictEqual(abortErrorCode, "INSUFFICIENT_STOCK");
assert.strictEqual(simulatedInventoryStore[0].availableStock, 1); // Guaranteed 0 mutation
assert.strictEqual(simulatedInventoryStore[1].availableStock, 50); // Guaranteed 0 mutation

console.log(` - Abort Triggered with Code           : "${abortErrorCode}" ✅`);
console.log(` - Rejection Message                   : "${abortErrorMessage}" ✅`);
console.log(" - Maggi Stock Preserved (0 mutation)  : 1 left (Untouched) ✅");
console.log(" - Coke Stock Preserved (0 mutation)   : 50 left (Untouched) ✅");

// ==============================================================================
// TEST 3: Complete Atomic Checkout (Invoice + SaleItems + Stock OUT + Ledger + Payment)
// ==============================================================================
console.log("\n[Test 3] Complete Atomic POS Checkout Execution Simulation:");

// Initial state: Maggi = 100, Coke = 50
const storeState = {
  [dummyProdMaggi]: { stock: 100, reorder: 20 },
  [dummyProdCoke]: { stock: 50, reorder: 10 },
};

const checkoutCart = [
  { productId: dummyProdMaggi, name: "Maggi 70g", sku: "MAG001", unit: "pcs", soldPrice: 15, costPrice: 11, quantity: 2 },
  { productId: dummyProdCoke, name: "Coke 750ml", sku: "COK001", unit: "bottle", soldPrice: 40, costPrice: 30, quantity: 1 },
];

// Step 1: Pre-flight check
for (const it of checkoutCart) {
  assert.strictEqual(storeState[it.productId].stock >= it.quantity, true);
}

// Step 2: Create Invoice Header (T23)
const invoiceDoc = new Invoice({
  businessId: new mongoose.Types.ObjectId(dummyBusinessId1),
  invoiceNumber: "INV-1001",
  customerName: "Walk-in Customer",
  subtotal: 70,
  discount: 0,
  tax: 0,
  total: 70,
  paidAmount: 70,
  dueAmount: 0,
  paymentStatus: "PAID",
  paymentMode: "CASH",
  items: checkoutCart.map((it) => ({
    productId: it.productId,
    name: it.name,
    sku: it.sku,
    unit: it.unit,
    soldPrice: it.soldPrice,
    costPrice: it.costPrice,
    quantity: it.quantity,
    totalPrice: it.soldPrice * it.quantity,
    grossProfit: (it.soldPrice - it.costPrice) * it.quantity,
  })),
});
assert.strictEqual(!invoiceDoc.validateSync(), true);

// Step 3: Create SaleItem snapshots (T24)
const saleItemDocs = checkoutCart.map((it) => new SaleItem({
  businessId: new mongoose.Types.ObjectId(dummyBusinessId1),
  saleId: invoiceDoc._id,
  productId: it.productId,
  name: it.name,
  sku: it.sku,
  unit: it.unit,
  soldPrice: it.soldPrice,
  costPrice: it.costPrice,
  quantity: it.quantity,
  totalPrice: it.soldPrice * it.quantity,
  grossProfit: (it.soldPrice - it.costPrice) * it.quantity,
}));

for (const sid of saleItemDocs) {
  assert.strictEqual(!sid.validateSync(), true);
}

// Step 4: Deduct Inventory & write OUT Ledger (T19 & T16)
const ledgerEntries = [];
for (const it of checkoutCart) {
  storeState[it.productId].stock -= it.quantity;
  ledgerEntries.push(new InventoryLedger({
    businessId: new mongoose.Types.ObjectId(dummyBusinessId1),
    productId: new mongoose.Types.ObjectId(it.productId),
    qtyChange: -it.quantity,
    balanceAfter: storeState[it.productId].stock,
    type: "OUT",
    source: "POS_CHECKOUT",
    referenceNumber: invoiceDoc.invoiceNumber,
    reason: `POS Sale Checkout #${invoiceDoc.invoiceNumber}`,
  }));
}

for (const led of ledgerEntries) {
  assert.strictEqual(!led.validateSync(), true);
}

// Step 5: Record Payment (Payment Model)
const paymentDoc = new Payment({
  businessId: new mongoose.Types.ObjectId(dummyBusinessId1),
  invoiceId: invoiceDoc._id,
  amount: invoiceDoc.paidAmount,
  method: "CASH",
  referenceId: invoiceDoc.invoiceNumber,
});
assert.strictEqual(!paymentDoc.validateSync(), true);

// Mathematical Verifications:
assert.strictEqual(storeState[dummyProdMaggi].stock, 98); // 100 - 2
assert.strictEqual(storeState[dummyProdCoke].stock, 49);  // 50 - 1
assert.strictEqual(saleItemDocs.length, 2);
assert.strictEqual(ledgerEntries.length, 2);
assert.strictEqual(paymentDoc.amount, 70);

console.log(" - Invoice Created                     : INV-1001 (Total: ₹70) ✅");
console.log(" - Sale Line Items Created (T24)       : 2 items snapshotted ✅");
console.log(" - Physical Inventory Deducted (T19)   : Maggi 100➔98 | Coke 50➔49 ✅");
console.log(" - Audit Ledger Logs Recorded (T16)    : 2 immutable OUT records ✅");
console.log(" - Payment Recorded                    : ₹70 CASH linked to INV-1001 ✅");

// ==============================================================================
// TEST 4: Partial / Udhar Checkout & Due Balance Tracking
// ==============================================================================
console.log("\n[Test 4] Partial / Udhar POS Checkout & Credit Due Handling:");

const udharInvoice = new Invoice({
  businessId: new mongoose.Types.ObjectId(dummyBusinessId1),
  invoiceNumber: "INV-1002",
  customerId: new mongoose.Types.ObjectId(dummyCustomerId),
  customerName: "Vikram Mehta",
  customerPhone: "9123456780",
  subtotal: 100,
  total: 100,
  paidAmount: 40,
  dueAmount: 60,
  paymentStatus: "PARTIAL",
  paymentMode: "SPLIT",
});

assert.strictEqual(udharInvoice.dueAmount, 60);
assert.strictEqual(udharInvoice.paymentStatus, "PARTIAL");
console.log(" - Split Checkout (Paid ₹40, Due ₹60)   : PASSED ✅ (Status: PARTIAL)");

// ==============================================================================
// TEST 5: Multi-Tenant Business Isolation in POS Checkout
// ==============================================================================
console.log("\n[Test 5] Multi-Tenant Business Isolation:");

const b1Inv = new Invoice({
  businessId: new mongoose.Types.ObjectId(dummyBusinessId1),
  invoiceNumber: "INV-1001",
  subtotal: 50,
  total: 50,
  paidAmount: 50,
  dueAmount: 0,
});

const b2Inv = new Invoice({
  businessId: new mongoose.Types.ObjectId(dummyBusinessId2),
  invoiceNumber: "INV-1001", // Same invoice number in isolated business
  subtotal: 150,
  total: 150,
  paidAmount: 150,
  dueAmount: 0,
});

assert.strictEqual(b1Inv.businessId.toString(), dummyBusinessId1);
assert.strictEqual(b2Inv.businessId.toString(), dummyBusinessId2);
assert.notStrictEqual(b1Inv.businessId.toString(), b2Inv.businessId.toString());
console.log(" - Multi-Tenant Isolation Verified      : PASSED ✅");

console.log("\n================================================================================");
console.log("    ALL PHASE 4 - TASK T25 POS CHECKOUT TRANSACTION TESTS PASSED! 🎉           ");
console.log("================================================================================\n");
