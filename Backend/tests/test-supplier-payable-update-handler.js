const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const { PurchaseOrder } = require("../src/models/purchaseOrder.model");
const { PurchaseItem } = require("../src/models/purchaseItem.model");
const GoodsReceivedNote = require("../src/models/grn.model");
const { Inventory, InventoryLedger } = require("../src/models/inventory.model");
const { Supplier, SupplierLedger } = require("../src/models/supplier.model");
const Product = require("../src/models/product.model");
const Business = require("../src/models/business.model");
const purchaseOrderRepo = require("../src/repositories/purchaseOrder.repository");
const supplierRepo = require("../src/repositories/supplier.repository");
const supplierLedgerRepo = require("../src/repositories/supplierLedger.repository");
const grnService = require("../src/services/grn.service");

async function runSupplierPayableTests() {
  console.log("================================================================================");
  console.log("  PHASE 7 - TASK T46: SUPPLIER PAYABLE UPDATE HANDLER TEST SUITE");
  console.log("================================================================================");

  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/venderos";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB successfully.\n");

  const runId = Date.now().toString().slice(-6);

  try {
    // 1. Multi-Tenant Setup: Store A & Store B
    const bizA = await Business.create({
      ownerId: new mongoose.Types.ObjectId(),
      businessName: `T46 Store Alpha ${runId}`,
      email: `t46.alpha.${runId}@test.com`,
      phone: `+919811${runId.slice(0, 6)}`,
      currency: "INR",
    });

    const bizB = await Business.create({
      ownerId: new mongoose.Types.ObjectId(),
      businessName: `T46 Store Beta ${runId}`,
      email: `t46.beta.${runId}@test.com`,
      phone: `+919822${runId.slice(0, 6)}`,
      currency: "INR",
    });

    console.log(`[TEST 1] Setup Multi-Tenant Stores: Store Alpha (${bizA._id}), Store Beta (${bizB._id}) [PASSED]`);

    // 2. Setup Supplier & Product Catalog
    const supplierA = await supplierRepo.createSupplier(bizA._id, {
      company: `National FMCG Distributors ${runId}`,
      contactName: "Sanjay Singhania",
      phone: `+919844${runId.slice(0, 6)}`,
      email: `national.${runId}@fmcg.com`,
    });

    const categoryId = new mongoose.Types.ObjectId();

    const prodMaggi = await Product.create({
      businessId: bizA._id,
      categoryId,
      name: "Maggi Masala 70g",
      sku: `MAGGI-${runId}`,
      sellingPrice: 60.0,
      costPrice: 50.0,
      stock: 0,
      unit: "pcs",
    });

    const prodCoke = await Product.create({
      businessId: bizA._id,
      categoryId,
      name: "Coca-Cola 750ml",
      sku: `COKE-${runId}`,
      sellingPrice: 50.0,
      costPrice: 40.0,
      stock: 0,
      unit: "bottle",
    });

    console.log(`[TEST 2] Created Supplier (${supplierA.company}) & Products: Maggi (@₹50), Coke (@₹40) [PASSED]`);

    // 3. Create Purchase Order (PO-1001) for ₹7,000 total (100 Maggi @ ₹50 = ₹5,000; 50 Coke @ ₹40 = ₹2,000)
    const po = await purchaseOrderRepo.create(bizA._id, {
      supplierId: supplierA._id,
      supplierCompany: supplierA.company,
      expectedDeliveryDate: new Date(Date.now() + 86400000 * 3),
      items: [
        {
          productId: prodMaggi._id,
          name: prodMaggi.name,
          sku: prodMaggi.sku,
          unit: prodMaggi.unit,
          unitCost: 50.0,
          quantity: 100,
        },
        {
          productId: prodCoke._id,
          name: prodCoke.name,
          sku: prodCoke.sku,
          unit: prodCoke.unit,
          unitCost: 40.0,
          quantity: 50,
        },
      ],
      notes: "Urgent restocking order",
    });

    console.log(`[TEST 3] Created PO ${po.poNumber} with Total Ordered Cost = ₹${po.costTotal} [PASSED]`);

    // Invariant Check 1: PO Creation must NOT create payable liability
    const initialSupplier = await Supplier.findById(supplierA._id);
    if (initialSupplier.currentBalance !== 0) {
      throw new Error(`Expected initial supplier balance 0, got ${initialSupplier.currentBalance}`);
    }
    console.log(`[TEST 4] INVARIANT 1: PO creation does NOT generate debt. Supplier currentBalance = ₹${initialSupplier.currentBalance} [PASSED]`);

    // 4. Physical Partial Delivery 1: Supplier delivers 100 Maggi (₹5,000) and 30 Coke (₹1,200) -> Total Accepted = ₹6,200
    const grnPayload1 = {
      purchaseOrderId: po._id,
      receivedDate: new Date(),
      deliveryChallanNumber: `DC-${runId}-01`,
      invoiceNumber: `INV-${runId}-01`,
      notes: "Partial receipt: 100 Maggi + 30 Coke accepted",
      items: [
        {
          productId: prodMaggi._id,
          receivedQty: 100,
          costPrice: 50.0,
        },
        {
          productId: prodCoke._id,
          receivedQty: 30,
          costPrice: 40.0,
        },
      ],
    };

    const receiveResult1 = await grnService.receiveStock(bizA._id, grnPayload1, null, "Warehouse Manager");

    console.log(`\n[GRN 1 Generated]: ${receiveResult1.grn.grnNumber}`);
    console.log(`- Received Units: ${receiveResult1.summary.totalItemsReceived}`);
    console.log(`- Total Accepted Cost: ₹${receiveResult1.summary.totalCostReceived}`);
    console.log(`- PO Status Progressed: ${receiveResult1.summary.poStatus}`);

    // Verify T45 Inventory Updates
    const invMaggi1 = await Inventory.findOne({ businessId: bizA._id, productId: prodMaggi._id });
    const invCoke1 = await Inventory.findOne({ businessId: bizA._id, productId: prodCoke._id });
    if (invMaggi1.availableStock !== 100 || invCoke1.availableStock !== 30) {
      throw new Error(`Inventory mismatch: Maggi=${invMaggi1?.availableStock}, Coke=${invCoke1?.availableStock}`);
    }
    console.log(`[TEST 5] T45 Auto Inventory IN verified: Maggi = ${invMaggi1.availableStock}, Coke = ${invCoke1.availableStock} [PASSED]`);

    // Verify T46 Supplier Payable Update
    const supplierAfterGRN1 = await Supplier.findById(supplierA._id);
    if (supplierAfterGRN1.currentBalance !== 6200) {
      throw new Error(`Expected supplier payable ₹6,200, got ₹${supplierAfterGRN1.currentBalance}`);
    }
    if (supplierAfterGRN1.totalPurchases !== 6200) {
      throw new Error(`Expected supplier totalPurchases ₹6,200, got ₹${supplierAfterGRN1.totalPurchases}`);
    }
    if (!supplierAfterGRN1.lastPurchaseDate) {
      throw new Error(`Expected supplier lastPurchaseDate to be set`);
    }

    const ledgerAfterGRN1 = await SupplierLedger.findOne({ businessId: bizA._id, supplierId: supplierA._id });
    if (!ledgerAfterGRN1 || ledgerAfterGRN1.entries.length !== 1) {
      throw new Error(`Expected 1 ledger entry, found ${ledgerAfterGRN1?.entries?.length}`);
    }

    const entry1 = ledgerAfterGRN1.entries[0];
    if (entry1.entryType !== "PURCHASE_CREDIT" || entry1.invoiceValue !== 6200 || entry1.balance !== 6200) {
      throw new Error(`Ledger entry mismatch: type=${entry1.entryType}, invoiceVal=${entry1.invoiceValue}, bal=${entry1.balance}`);
    }
    if (entry1.grnNumber !== receiveResult1.grn.grnNumber) {
      throw new Error(`Ledger entry grnNumber mismatch: expected ${receiveResult1.grn.grnNumber}, got ${entry1.grnNumber}`);
    }

    console.log(`[TEST 6] INVARIANT 2: T46 Payable equals accepted goods (₹6,200 NOT PO ₹7,000)`);
    console.log(`- Supplier Outstanding Debt: ₹${supplierAfterGRN1.currentBalance}`);
    console.log(`- Supplier Lifetime Purchases: ₹${supplierAfterGRN1.totalPurchases}`);
    console.log(`- Ledger Entry 1: Type=${entry1.entryType}, Value=+₹${entry1.invoiceValue}, Running Balance=₹${entry1.balance} [PASSED]`);

    // 5. Idempotency Check: Attempting to call executeSupplierPayableUpdate with same GRN returns alreadyProcessed
    const duplicateCheck = await grnService.executeSupplierPayableUpdate(bizA._id, {
      grn: receiveResult1.grn,
      purchaseOrder: po,
      items: receiveResult1.grn.items,
    });

    if (!duplicateCheck.alreadyProcessed) {
      throw new Error("Expected duplicate payable update to be recognized as already processed!");
    }

    const supplierAfterDup = await Supplier.findById(supplierA._id);
    if (supplierAfterDup.currentBalance !== 6200) {
      throw new Error(`Balance changed on duplicate check! Expected 6200, got ${supplierAfterDup.currentBalance}`);
    }
    console.log(`[TEST 7] INVARIANT 3: Idempotency Protection prevents duplicate payable creation (Balance remains ₹${supplierAfterDup.currentBalance}) [PASSED]`);

    // 6. Second Delivery: Supplier delivers remaining 20 Coke (20 @ ₹40 = ₹800) -> Total PO Received = ₹7,000
    const grnPayload2 = {
      purchaseOrderId: po._id,
      receivedDate: new Date(),
      deliveryChallanNumber: `DC-${runId}-02`,
      invoiceNumber: `INV-${runId}-02`,
      notes: "Final delivery: remaining 20 Coke",
      items: [
        {
          productId: prodCoke._id,
          receivedQty: 20,
          costPrice: 40.0,
        },
      ],
    };

    const receiveResult2 = await grnService.receiveStock(bizA._id, grnPayload2, null, "Warehouse Manager");

    console.log(`\n[GRN 2 Generated]: ${receiveResult2.grn.grnNumber}`);
    console.log(`- Received Units: ${receiveResult2.summary.totalItemsReceived}`);
    console.log(`- Total Accepted Cost: ₹${receiveResult2.summary.totalCostReceived}`);
    console.log(`- PO Status Progressed: ${receiveResult2.summary.poStatus}`);

    // Verify Updated Inventory
    const invCoke2 = await Inventory.findOne({ businessId: bizA._id, productId: prodCoke._id });
    if (invCoke2.availableStock !== 50) {
      throw new Error(`Expected Coke stock 50, got ${invCoke2.availableStock}`);
    }

    // Verify Updated Supplier Balance & Ledger
    const supplierAfterGRN2 = await Supplier.findById(supplierA._id);
    if (supplierAfterGRN2.currentBalance !== 7000) {
      throw new Error(`Expected supplier payable ₹7,000, got ₹${supplierAfterGRN2.currentBalance}`);
    }
    if (supplierAfterGRN2.totalPurchases !== 7000) {
      throw new Error(`Expected supplier totalPurchases ₹7,000, got ₹${supplierAfterGRN2.totalPurchases}`);
    }

    const ledgerAfterGRN2 = await SupplierLedger.findOne({ businessId: bizA._id, supplierId: supplierA._id });
    if (ledgerAfterGRN2.entries.length !== 2) {
      throw new Error(`Expected 2 ledger entries, found ${ledgerAfterGRN2.entries.length}`);
    }

    const entry2 = ledgerAfterGRN2.entries[1];
    if (entry2.entryType !== "PURCHASE_CREDIT" || entry2.invoiceValue !== 800 || entry2.balance !== 7000) {
      throw new Error(`Ledger entry 2 mismatch: val=${entry2.invoiceValue}, bal=${entry2.balance}`);
    }

    console.log(`[TEST 8] Second Delivery T46 Integration:`);
    console.log(`- Supplier Outstanding Debt: ₹${supplierAfterGRN2.currentBalance} (6200 + 800)`);
    console.log(`- Ledger Entry 2: Type=${entry2.entryType}, Value=+₹${entry2.invoiceValue}, Running Balance=₹${entry2.balance} [PASSED]`);

    // 7. Payment Disbursement / Settle (T40 / Supplier Payment): Business pays ₹4,000 via UPI
    const paymentResult = await supplierLedgerRepo.recordSupplierPayment({
      businessId: bizA._id,
      supplierId: supplierA._id,
      amount: 4000.0,
      paymentMethod: "UPI",
      referenceId: `UPI-TXN-${runId}`,
      notes: "Partial payment for GRN deliveries",
    });

    const supplierAfterPayment = await Supplier.findById(supplierA._id);
    if (supplierAfterPayment.currentBalance !== 3000) {
      throw new Error(`Expected supplier payable ₹3,000 after ₹4,000 payment, got ₹${supplierAfterPayment.currentBalance}`);
    }

    const ledgerAfterPayment = await SupplierLedger.findOne({ businessId: bizA._id, supplierId: supplierA._id });
    const entry3 = ledgerAfterPayment.entries[2];
    if (entry3.entryType !== "PAYMENT_MADE" || entry3.paymentAmount !== 4000 || entry3.balance !== 3000) {
      throw new Error(`Ledger entry 3 mismatch: type=${entry3.entryType}, paid=${entry3.paymentAmount}, bal=${entry3.balance}`);
    }

    console.log(`\n[TEST 9] Supplier Payment Settlement:`);
    console.log(`- Disbursed Payment: ₹4,000 (UPI Ref: ${entry3.referenceId})`);
    console.log(`- Remaining Outstanding Payable: ₹${supplierAfterPayment.currentBalance} (7000 - 4000) [PASSED]`);

    // 8. Multi-Tenant Isolation Check: Store B cannot see or alter Store A's supplier payables
    try {
      await supplierLedgerRepo.getSupplierLedger(bizB._id, supplierA._id);
      throw new Error("Security Violation: Store B accessed Store A's supplier ledger!");
    } catch (crossErr) {
      if (crossErr.code !== "SUPPLIER_NOT_FOUND" && crossErr.statusCode !== 404) {
        throw crossErr;
      }
    }
    console.log(`[TEST 10] Multi-Tenant Security Isolation Verified (Access rejected with 404) [PASSED]`);

    console.log("\n================================================================================");
    console.log("  ALL TASK T46 SUPPLIER PAYABLE UPDATE HANDLER TESTS PASSED PERFECTLY!");
    console.log("================================================================================");
  } catch (err) {
    console.error("\n❌ TEST SUITE FAILED:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB.");
  }
}

runSupplierPayableTests();
