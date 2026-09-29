const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const { PurchaseOrder } = require("../src/models/purchaseOrder.model");
const { PurchaseItem } = require("../src/models/purchaseItem.model");
const GoodsReceivedNote = require("../src/models/grn.model");
const { Inventory, InventoryLedger } = require("../src/models/inventory.model");
const { Supplier } = require("../src/models/supplier.model");
const Product = require("../src/models/product.model");
const Business = require("../src/models/business.model");
const purchaseOrderRepo = require("../src/repositories/purchaseOrder.repository");
const supplierRepo = require("../src/repositories/supplier.repository");
const grnService = require("../src/services/grn.service");

async function runGRNTests() {
  console.log("================================================================================");
  console.log("  PHASE 7 - TASK T44: GOODS RECEIVED NOTE (GRN) API TEST SUITE");
  console.log("================================================================================");

  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/venderos";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB successfully.\n");

  const runId = Date.now().toString().slice(-6);

  try {
    // 1. Setup Test Multi-Tenant Stores
    const bizA = await Business.create({
      name: `T44 Store Alpha ${runId}`,
      email: `t44.alpha.${runId}@test.com`,
      phone: `+919811${runId.slice(0, 6)}`,
      currency: "INR",
    });

    const bizB = await Business.create({
      name: `T44 Store Beta ${runId}`,
      email: `t44.beta.${runId}@test.com`,
      phone: `+919822${runId.slice(0, 6)}`,
      currency: "INR",
    });

    console.log(`[TEST 1] Setup Multi-Tenant Stores: Store A (${bizA._id}), Store B (${bizB._id}) [PASSED]`);

    // 2. Setup Supplier and Catalog Products
    const supplierA = await supplierRepo.createSupplier(bizA._id, {
      company: `ABC Wholesale & FMCG ${runId}`,
      contactName: "Vikram Mehta",
      phone: `+919833${runId.slice(0, 6)}`,
      email: `abc.${runId}@fmcg.com`,
    });

    const prodMaggi = await Product.create({
      businessId: bizA._id,
      name: "Maggi Masala Noodles 70g",
      sku: `MAGGI-${runId}`,
      barcode: `8901058${runId}`,
      category: "Groceries",
      sellingPrice: 15.0,
      costPrice: 11.0,
      stock: 0,
      unit: "pcs",
    });

    const prodCoke = await Product.create({
      businessId: bizA._id,
      name: "Coca-Cola 500ml Can",
      sku: `COKE-${runId}`,
      barcode: `8901764${runId}`,
      category: "Beverages",
      sellingPrice: 40.0,
      costPrice: 30.0,
      stock: 0,
      unit: "can",
    });

    const prodBiscuit = await Product.create({
      businessId: bizA._id,
      name: "Parle-G Gold Biscuits 100g",
      sku: `PARLE-${runId}`,
      barcode: `8901234${runId}`,
      category: "Snacks",
      sellingPrice: 10.0,
      costPrice: 7.5,
      stock: 0,
      unit: "pack",
    });

    console.log(`[TEST 2] Created Supplier & 3 Products: Maggi, Coke, Biscuits [PASSED]`);

    // 3. Create Purchase Order (PO-1001) for Maggi (100 @ ₹11), Coke (50 @ ₹30), Biscuit (80 @ ₹7.5)
    const po = await purchaseOrderRepo.create(bizA._id, {
      supplierId: supplierA._id,
      poNumber: `PO-TEST-${runId}`,
      items: [
        { productId: prodMaggi._id, name: prodMaggi.name, quantity: 100, unitCost: 11.0, unit: "pcs" },
        { productId: prodCoke._id, name: prodCoke.name, quantity: 50, unitCost: 30.0, unit: "can" },
        { productId: prodBiscuit._id, name: prodBiscuit.name, quantity: 80, unitCost: 7.5, unit: "pack" },
      ],
      notes: "Urgent festival restock order",
    });

    console.log(`[TEST 3] Created PO ${po.poNumber}: CostTotal ₹${po.costTotal}, Initial Status: ${po.status} [PASSED]`);

    // 4. Verify PO Creation did NOT inflate stock (Principle: PO != Inventory Stock IN)
    const invBefore = await Inventory.find({
      businessId: bizA._id,
      productId: { $in: [prodMaggi._id, prodCoke._id, prodBiscuit._id] },
    });
    const totalStockBefore = invBefore.reduce((sum, i) => sum + i.availableStock, 0);
    if (totalStockBefore !== 0) {
      throw new Error(`Inventory stock before receipt should be 0, got ${totalStockBefore}`);
    }
    console.log(`[TEST 4] Verified PO Creation did NOT inflate physical stock (Available: 0) [PASSED]`);

    // 5. Test 1st Physical Delivery (Partial Receipt via GRN)
    // Receive: Maggi 100 (full), Coke 30 (partial, 20 pending), Biscuit 80 (full)
    const grn1Result = await grnService.receiveStock(bizA._id, {
      purchaseOrderId: po._id,
      deliveryChallanNumber: `CHALLAN-01-${runId}`,
      invoiceNumber: `INV-SUPP-01-${runId}`,
      notes: "First truck delivery: Maggi full, Coke partial, Biscuit full",
      items: [
        { productId: prodMaggi._id.toString(), receivedQty: 100 },
        { productId: prodCoke._id.toString(), receivedQty: 30 },
        { productId: prodBiscuit._id.toString(), receivedQty: 80 },
      ],
    });

    const grn1 = grn1Result.grn;
    console.log(`[TEST 5] Processed GRN #1 (${grn1.grnNumber}): Received ${grn1.totalItemsReceived} items, Total Cost ₹${grn1.totalCostReceived} [PASSED]`);

    if (grn1.totalItemsReceived !== 210) {
      throw new Error(`Expected total items received 210 (100+30+80), got ${grn1.totalItemsReceived}`);
    }
    if (grn1Result.purchaseOrder.newStatus !== "PARTIAL") {
      throw new Error(`Expected PO status to be 'PARTIAL', got ${grn1Result.purchaseOrder.newStatus}`);
    }

    // 6. Verify Physical Inventory Stock IN & Immutable Ledger after GRN #1
    const invMaggi = await Inventory.findOne({ businessId: bizA._id, productId: prodMaggi._id });
    const invCoke = await Inventory.findOne({ businessId: bizA._id, productId: prodCoke._id });
    const invBiscuit = await Inventory.findOne({ businessId: bizA._id, productId: prodBiscuit._id });

    if (invMaggi.availableStock !== 100) throw new Error(`Maggi stock expected 100, got ${invMaggi.availableStock}`);
    if (invCoke.availableStock !== 30) throw new Error(`Coke stock expected 30, got ${invCoke.availableStock}`);
    if (invBiscuit.availableStock !== 80) throw new Error(`Biscuit stock expected 80, got ${invBiscuit.availableStock}`);

    const ledgerLogs = await InventoryLedger.find({ businessId: bizA._id, referenceId: grn1._id });
    if (ledgerLogs.length !== 3) {
      throw new Error(`Expected 3 InventoryLedger entries for GRN #1, found ${ledgerLogs.length}`);
    }
    if (ledgerLogs[0].type !== "IN" || ledgerLogs[0].source !== "GOODS_RECEIPT") {
      throw new Error(`InventoryLedger type/source mismatch: ${ledgerLogs[0].type}/${ledgerLogs[0].source}`);
    }
    console.log(`[TEST 6] Verified Inventory Stock IN & Ledger Logs (+100 Maggi, +30 Coke, +80 Biscuits) [PASSED]`);

    // 7. Verify PurchaseItem receivedQty synchronization
    const piCoke = await PurchaseItem.findOne({ businessId: bizA._id, purchaseOrderId: po._id, productId: prodCoke._id });
    if (piCoke.receivedQty !== 30) {
      throw new Error(`PurchaseItem Coke receivedQty expected 30, got ${piCoke.receivedQty}`);
    }
    console.log(`[TEST 7] Verified PurchaseItem lines synchronized (Coke receivedQty: 30 / 50) [PASSED]`);

    // 8. Test 2nd Physical Delivery (Remaining Coke 20 units) -> PO should become RECEIVED
    const grn2Result = await grnService.receiveStock(bizA._id, {
      purchaseOrderId: po._id,
      deliveryChallanNumber: `CHALLAN-02-${runId}`,
      invoiceNumber: `INV-SUPP-02-${runId}`,
      notes: "Second delivery: Remaining 20 Coke cans delivered",
      items: [
        { productId: prodCoke._id.toString(), receivedQty: 20 },
      ],
    });

    const grn2 = grn2Result.grn;
    console.log(`[TEST 8] Processed GRN #2 (${grn2.grnNumber}): Received ${grn2.totalItemsReceived} Coke cans, Total Cost ₹${grn2.totalCostReceived} [PASSED]`);

    if (grn2Result.purchaseOrder.newStatus !== "RECEIVED") {
      throw new Error(`Expected PO status to transition to 'RECEIVED', got ${grn2Result.purchaseOrder.newStatus}`);
    }

    const updatedCokeInv = await Inventory.findOne({ businessId: bizA._id, productId: prodCoke._id });
    if (updatedCokeInv.availableStock !== 50) {
      throw new Error(`Expected total Coke available stock to be 50, got ${updatedCokeInv.availableStock}`);
    }
    console.log(`[TEST 8.1] Verified Coke total stock is now 50 and PO is fully RECEIVED [PASSED]`);

    // 9. Test Over-Delivery Protection
    let overdeliveryBlocked = false;
    try {
      await grnService.receiveStock(bizA._id, {
        purchaseOrderId: po._id,
        items: [{ productId: prodMaggi._id.toString(), receivedQty: 50 }],
        allowOverdelivery: false,
      });
    } catch (err) {
      if (err.statusCode === 400) {
        overdeliveryBlocked = true;
      }
    }
    if (!overdeliveryBlocked) {
      throw new Error("Expected over-delivery beyond tolerance to be rejected when allowOverdelivery is false");
    }
    console.log(`[TEST 9] Over-delivery protection verified (Blocked excess delivery on fully received order) [PASSED]`);

    // 10. Test Validation Guards: Rejects items not in PO & Zero receipts
    let invalidItemBlocked = false;
    const prodRandom = await Product.create({
      businessId: bizA._id,
      name: "Random Product Not in PO",
      sku: `RAND-${runId}`,
      sellingPrice: 100,
    });

    try {
      await grnService.receiveStock(bizA._id, {
        purchaseOrderId: po._id,
        items: [{ productId: prodRandom._id.toString(), receivedQty: 5 }],
      });
    } catch (err) {
      if (err.statusCode === 400 && err.code === "ITEM_NOT_IN_PURCHASE_ORDER") {
        invalidItemBlocked = true;
      }
    }
    if (!invalidItemBlocked) {
      throw new Error("Expected item not in PO to be rejected");
    }
    console.log(`[TEST 10] Validation guard verified (Rejects items not present in PO) [PASSED]`);

    // 11. Test GRN Retrieval APIs (Single GRN, By PO ID, Summary)
    const fetchedGrn1 = await grnService.getGrnById(bizA._id, grn1._id);
    if (fetchedGrn1.grnNumber !== grn1.grnNumber) {
      throw new Error(`Fetched GRN number mismatch: ${fetchedGrn1.grnNumber} vs ${grn1.grnNumber}`);
    }

    const poGrns = await grnService.getGrnsByPoId(bizA._id, po._id);
    if (poGrns.length !== 2) {
      throw new Error(`Expected 2 GRNs for PO, found ${poGrns.length}`);
    }

    const summary = await grnService.getSummary(bizA._id);
    if (summary.totalGrns !== 2 || summary.totalItemsReceived !== 230) {
      throw new Error(`Summary KPI mismatch: totalGrns=${summary.totalGrns}, totalItems=${summary.totalItemsReceived}`);
    }
    console.log(`[TEST 11] Verified GRN Retrieval & KPI Summary (Total GRNs: ${summary.totalGrns}, Total Items: ${summary.totalItemsReceived}, Total Value: ₹${summary.totalCostReceived}) [PASSED]`);

    // 12. Test Multi-Tenant Isolation: Business B cannot access or receive Business A's PO
    let tenantIsolationPassed = false;
    try {
      await grnService.receiveStock(bizB._id, {
        purchaseOrderId: po._id,
        items: [{ productId: prodMaggi._id.toString(), receivedQty: 10 }],
      });
    } catch (err) {
      if (err.statusCode === 404) {
        tenantIsolationPassed = true;
      }
    }
    if (!tenantIsolationPassed) {
      throw new Error("Tenant isolation failed: Business B was able to access Business A's PO");
    }
    console.log(`[TEST 12] Multi-Tenant Isolation verified across store boundaries [PASSED]`);

    console.log("\n================================================================================");
    console.log("  ALL 12/12 T44 GRN API TESTS PASSED SUCCESSFULLY! (100%)");
    console.log("================================================================================");
  } catch (error) {
    console.error("\nTEST SUITE FAILED:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    process.exit(0);
  }
}

runGRNTests();
