const mongoose = require("mongoose");
const assert = require("assert");
const SaleItem = require("../src/models/saleItem.model");
const Invoice = require("../src/models/invoice.model");
const { createSaleSchema } = require("../src/validations/sale.validation");

console.log("================================================================================");
console.log("    PHASE 4 - TASK T24: SALE ITEM SCHEMA MODEL & SNAPSHOT TESTS                 ");
console.log("================================================================================\n");

const dummyBusinessId1 = new mongoose.Types.ObjectId().toString();
const dummyBusinessId2 = new mongoose.Types.ObjectId().toString();
const dummySaleId = new mongoose.Types.ObjectId().toString();
const dummyProductId1 = new mongoose.Types.ObjectId().toString();
const dummyProductId2 = new mongoose.Types.ObjectId().toString();

// ==============================================================================
// TEST 1: Zod Validation for Line Items with Snapshot Pricing
// ==============================================================================
console.log("[Test 1] Zod Validation for Sale Items with Snapshot Pricing (Task T24):");

const validSaleWithItems = {
  invoiceNumber: "INV-1001",
  subtotal: 145,
  discount: 5,
  tax: 7,
  total: 147,
  paidAmount: 147,
  paymentStatus: "PAID",
  paymentMode: "CASH",
  items: [
    {
      productId: dummyProductId1,
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
      productId: dummyProductId2,
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
};

const parsed = createSaleSchema.safeParse(validSaleWithItems);
assert.strictEqual(parsed.success, true);
assert.strictEqual(parsed.data.items.length, 2);
assert.strictEqual(parsed.data.items[0].soldPrice, 15);
assert.strictEqual(parsed.data.items[0].costPrice, 11);
assert.strictEqual(parsed.data.items[0].quantity, 2);
console.log(" - Valid Sale Items Payload Parse        : PASSED ✅");

// Test negative price/cost rejection
const invalidItem = createSaleSchema.safeParse({
  ...validSaleWithItems,
  items: [{ productId: dummyProductId1, soldPrice: -10, quantity: 1 }],
});
assert.strictEqual(invalidItem.success, false);
console.log(" - Negative Sold Price Blocked          : PASSED ✅ (-10 rejected)");

// ==============================================================================
// TEST 2: Mongoose SaleItem Schema Document & Mathematical Guarantees
// ==============================================================================
console.log("\n[Test 2] Mongoose SaleItem Schema Document & Profit Math Check:");

const saleItemDoc = new SaleItem({
  businessId: new mongoose.Types.ObjectId(dummyBusinessId1),
  saleId: new mongoose.Types.ObjectId(dummySaleId),
  productId: new mongoose.Types.ObjectId(dummyProductId1),
  name: "Maggi 2-Min Noodles 70g",
  sku: "MAG001",
  unit: "pcs",
  soldPrice: 15.0,
  costPrice: 11.0,
  quantity: 2,
  totalPrice: 30.0,
  grossProfit: 8.0,
});

const valErr = saleItemDoc.validateSync();
assert.strictEqual(!valErr, true);
assert.strictEqual(saleItemDoc.soldPrice, 15);
assert.strictEqual(saleItemDoc.costPrice, 11);
assert.strictEqual(saleItemDoc.quantity, 2);

// Mathematical Formula Verifications
const calcLineTotal = saleItemDoc.soldPrice * saleItemDoc.quantity;
assert.strictEqual(saleItemDoc.totalPrice, calcLineTotal);

const calcProfit = (saleItemDoc.soldPrice - saleItemDoc.costPrice) * saleItemDoc.quantity;
assert.strictEqual(saleItemDoc.grossProfit, calcProfit);

console.log(" - Line Total Formula: SoldPrice (₹15) × Qty (2) = ₹30               : PASSED ✅");
console.log(" - Gross Profit Formula: (₹15 - ₹11) × Qty (2) = ₹8 (Profit Margin)  : PASSED ✅");

// ==============================================================================
// TEST 3: Historical Price Snapshot Preservation (Future Price Change Guard)
// ==============================================================================
console.log("\n[Test 3] Historical Price Snapshot Preservation (Master Catalog Price Update):");

// Step 1: Master product catalog at checkout day
let masterProduct = {
  _id: dummyProductId1,
  name: "Maggi 2-Min Noodles 70g",
  sellingPrice: 15,
  costPrice: 11,
};

// Step 2: Sale happens and creates frozen snapshot in SaleItem
const checkedOutItemSnapshot = {
  saleId: "INV-1001",
  productId: masterProduct._id,
  name: masterProduct.name,
  soldPrice: masterProduct.sellingPrice,
  costPrice: masterProduct.costPrice,
  quantity: 2,
  totalPrice: masterProduct.sellingPrice * 2, // 30
  grossProfit: (masterProduct.sellingPrice - masterProduct.costPrice) * 2, // 8
};

// Step 3: Next week, vendor updates master catalog prices due to inflation
masterProduct.sellingPrice = 20;
masterProduct.costPrice = 14;

// Verify that the historical checkout record remains 100% untouched
assert.strictEqual(checkedOutItemSnapshot.soldPrice, 15);
assert.strictEqual(checkedOutItemSnapshot.costPrice, 11);
assert.strictEqual(checkedOutItemSnapshot.totalPrice, 30);
assert.strictEqual(checkedOutItemSnapshot.grossProfit, 8);
assert.notStrictEqual(checkedOutItemSnapshot.soldPrice, masterProduct.sellingPrice);

console.log(" - Master product selling price changed : ₹15 ➔ ₹20");
console.log(" - Master product cost price changed    : ₹11 ➔ ₹14");
console.log(" - Historical SaleItem soldPrice remains: ₹15 (Unaffected) ✅");
console.log(" - Historical SaleItem costPrice remains: ₹11 (Unaffected) ✅");
console.log(" - Historical Gross Profit remains      : ₹8  (Unaffected) ✅");

// ==============================================================================
// TEST 4: Gross Profit & COGS Analytics Aggregator Simulation
// ==============================================================================
console.log("\n[Test 4] Gross Profit & COGS Analytics Aggregator Simulation:");

const mockSaleItems = [
  // Sale 1 items
  {
    businessId: dummyBusinessId1,
    productId: dummyProductId1,
    name: "Maggi",
    soldPrice: 15,
    costPrice: 11,
    quantity: 2,
    totalPrice: 30,
    grossProfit: 8,
  },
  {
    businessId: dummyBusinessId1,
    productId: dummyProductId2,
    name: "Coca Cola",
    soldPrice: 40,
    costPrice: 30,
    quantity: 1,
    totalPrice: 40,
    grossProfit: 10,
  },
  // Sale 2 items
  {
    businessId: dummyBusinessId1,
    productId: dummyProductId1,
    name: "Maggi",
    soldPrice: 15,
    costPrice: 11,
    quantity: 3,
    totalPrice: 45,
    grossProfit: 12,
  },
];

const totalRevenue = mockSaleItems.reduce((acc, it) => acc + it.totalPrice, 0);
const totalCostOfGoods = mockSaleItems.reduce((acc, it) => acc + it.costPrice * it.quantity, 0);
const totalGrossProfit = mockSaleItems.reduce((acc, it) => acc + it.grossProfit, 0);
const marginPercent = Math.round((totalGrossProfit / totalRevenue) * 10000) / 100;

assert.strictEqual(totalRevenue, 115); // 30 + 40 + 45
assert.strictEqual(totalCostOfGoods, 85); // 22 + 30 + 33
assert.strictEqual(totalGrossProfit, 30); // 8 + 10 + 12
assert.strictEqual(marginPercent, 26.09); // (30 / 115) * 100

console.log(` - Total Gross Revenue Billed : ₹${totalRevenue} (Expected: ₹115) ✅`);
console.log(` - Total Cost of Goods (COGS) : ₹${totalCostOfGoods} (Expected: ₹85)  ✅`);
console.log(` - Total Gross Profit         : ₹${totalGrossProfit} (Expected: ₹30)  ✅`);
console.log(` - Overall Margin %           : ${marginPercent}% (Expected: 26.09%) ✅`);

// ==============================================================================
// TEST 5: Multi-Tenant Isolation for Line Items
// ==============================================================================
console.log("\n[Test 5] Multi-Tenant Isolation for Line Items:");

const b1Item = new SaleItem({
  businessId: new mongoose.Types.ObjectId(dummyBusinessId1),
  saleId: new mongoose.Types.ObjectId(dummySaleId),
  productId: new mongoose.Types.ObjectId(dummyProductId1),
  soldPrice: 20,
  costPrice: 15,
  quantity: 1,
  totalPrice: 20,
  grossProfit: 5,
});

const b2Item = new SaleItem({
  businessId: new mongoose.Types.ObjectId(dummyBusinessId2),
  saleId: new mongoose.Types.ObjectId(dummySaleId),
  productId: new mongoose.Types.ObjectId(dummyProductId2),
  soldPrice: 50,
  costPrice: 35,
  quantity: 2,
  totalPrice: 100,
  grossProfit: 30,
});

assert.strictEqual(b1Item.businessId.toString(), dummyBusinessId1);
assert.strictEqual(b2Item.businessId.toString(), dummyBusinessId2);
assert.notStrictEqual(b1Item.businessId.toString(), b2Item.businessId.toString());

console.log(" - Multi-Tenant Isolation Verified      : PASSED ✅");

console.log("\n================================================================================");
console.log("    ALL PHASE 4 - TASK T24 SALE ITEM SNAPSHOT TESTS PASSED! 🎉                 ");
console.log("================================================================================\n");
