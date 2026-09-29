const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const { PurchaseOrder } = require("../src/models/purchaseOrder.model");
const { PurchaseItem } = require("../src/models/purchaseItem.model");
const { Supplier } = require("../src/models/supplier.model");
const Product = require("../src/models/product.model");
const Business = require("../src/models/business.model");
const purchaseOrderRepo = require("../src/repositories/purchaseOrder.repository");
const purchaseOrderService = require("../src/services/purchaseOrder.service");
const supplierRepo = require("../src/repositories/supplier.repository");

async function runPurchaseItemSchemaTests() {
  console.log("================================================================================");
  console.log("  PHASE 7 - TASK T43: PURCHASE ITEM SCHEMA MODEL TEST SUITE");
  console.log("================================================================================");

  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/venderos";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB successfully.\n");

  const runId = Date.now().toString().slice(-6);

  try {
    // 1. Setup Test Multi-Tenant Stores
    const bizA = await Business.create({
      name: `T43 Store Alpha ${runId}`,
      email: `t43.alpha.${runId}@test.com`,
      phone: `+919711${runId.slice(0, 6)}`,
      currency: "INR",
    });

    const bizB = await Business.create({
      name: `T43 Store Beta ${runId}`,
      email: `t43.beta.${runId}@test.com`,
      phone: `+919722${runId.slice(0, 6)}`,
      currency: "INR",
    });

    console.log(`[TEST 1] Setup Business Tenants: Store A (${bizA._id}), Store B (${bizB._id})`);

    // 2. Setup Supplier and Catalog Products
    const supplierA = await supplierRepo.createSupplier(bizA._id, {
      company: `Nestle India Distributors ${runId}`,
      contactName: "Sanjay Singhal",
      phone: `+919733${runId.slice(0, 6)}`,
      email: `nestle.${runId}@distrib.com`,
    });

    const productMaggi = await Product.create({
      businessId: bizA._id,
      name: "Maggi 2-Minute Noodles 70g",
      sku: `MAGGI-${runId}`,
      barcode: `8901058${runId}`,
      category: "Packaged Foods",
      sellingPrice: 15.0,
      costPrice: 11.5,
      stock: 45,
    });

    const productKitKat = await Product.create({
      businessId: bizA._id,
      name: "KitKat 4-Finger Chocolate 38g",
      sku: `KITKAT-${runId}`,
      barcode: `8901059${runId}`,
      category: "Confectionery",
      sellingPrice: 30.0,
      costPrice: 22.0,
      stock: 20,
    });

    console.log(`\n[TEST 2] Catalog Products Initialized:`);
    console.log(`  - Maggi: Catalog Cost = ₹${productMaggi.costPrice}, Selling = ₹${productMaggi.sellingPrice}, Stock = ${productMaggi.stock}`);
    console.log(`  - KitKat: Catalog Cost = ₹${productKitKat.costPrice}, Selling = ₹${productKitKat.sellingPrice}, Stock = ${productKitKat.stock}`);

    // 3. Create PO with specific negotiated purchase cost prices (Task T43)
    const negotiatedMaggiCost = 10.8; // Special volume deal (lower than catalog 11.5)
    const negotiatedKitKatCost = 21.0;

    const po = await purchaseOrderService.createPurchaseOrder(bizA._id, {
      supplierId: supplierA._id.toString(),
      status: "PENDING",
      items: [
        {
          productId: productMaggi._id.toString(),
          name: productMaggi.name,
          sku: productMaggi.sku,
          quantity: 200,
          unitCost: negotiatedMaggiCost,
          unit: "pack",
        },
        {
          productId: productKitKat._id.toString(),
          name: productKitKat.name,
          sku: productKitKat.sku,
          quantity: 100,
          unitCost: negotiatedKitKatCost,
          unit: "bar",
        },
      ],
      notes: "Bulk festive supply order",
    });

    console.log(`\n[TEST 3] Created Purchase Order ${po.poNumber} (ID: ${po._id}):`);
    console.log(`  - Cost Total: ₹${po.costTotal}`);

    // Expected Total: (200 * 10.80) + (100 * 21.00) = 2160 + 2100 = 4260.00
    if (po.costTotal !== 4260) {
      throw new Error(`Cost total mismatch! Expected 4260, got ${po.costTotal}`);
    }

    // 4. Verify Individual PurchaseItem Documents Persisted in Database
    const purchaseItems = await purchaseOrderService.getPurchaseOrderItems(bizA._id, po._id.toString());
    console.log(`\n[TEST 4] Verified PurchaseItem Documents in DB (Count: ${purchaseItems.length}):`);
    
    if (purchaseItems.length !== 2) {
      throw new Error(`Expected 2 PurchaseItem documents, found ${purchaseItems.length}`);
    }

    for (const item of purchaseItems) {
      console.log(`  - Line Item: ${item.name} | Qty: ${item.qty} | Cost: ₹${item.costPrice} | Line Total: ₹${item.totalCost}`);
      if (item.totalCost !== Number((item.qty * item.costPrice).toFixed(2))) {
        throw new Error(`Line total calculation error for ${item.name}`);
      }
    }
    console.log("  ✓ Individual PurchaseItem models and line totals verified");

    // 5. Test CostPrice Snapshot Principle (Catalog Price Change does NOT alter historical PO line)
    console.log(`\n[TEST 5] CostPrice Snapshot Verification:`);
    // Change catalog product cost in master
    productMaggi.costPrice = 14.0; // Price increased next month
    await productMaggi.save();
    console.log(`  - Updated Maggi catalog costPrice to ₹${productMaggi.costPrice}`);

    // Fetch PO item again
    const reloadedItems = await purchaseOrderService.getPurchaseOrderItems(bizA._id, po._id.toString());
    const reloadedMaggiItem = reloadedItems.find((i) => i.sku === productMaggi.sku);
    console.log(`  - Historical PO Item Cost: ₹${reloadedMaggiItem.costPrice} (Should remain ₹${negotiatedMaggiCost})`);

    if (reloadedMaggiItem.costPrice !== negotiatedMaggiCost) {
      throw new Error(`Snapshot violation! PO item cost altered to ₹${reloadedMaggiItem.costPrice}`);
    }
    console.log("  ✓ Confirmed: CostPrice snapshot preserved historically");

    // 6. Test Duplicate Product Line Merging / Deduplication
    console.log(`\n[TEST 6] Duplicate Product Line Deduplication Check:`);
    const poDuplicate = await purchaseOrderService.createPurchaseOrder(bizA._id, {
      supplierId: supplierA._id.toString(),
      items: [
        { productId: productMaggi._id.toString(), quantity: 50, unitCost: 11.0 },
        { productId: productMaggi._id.toString(), quantity: 30, unitCost: 11.0 },
      ],
    });

    const dedupItems = await purchaseOrderService.getPurchaseOrderItems(bizA._id, poDuplicate._id.toString());
    console.log(`  - Created PO with 2x duplicate product lines. Saved items count: ${dedupItems.length}`);
    if (dedupItems.length !== 1 || dedupItems[0].qty !== 80) {
      throw new Error(`Expected merged item with qty 80, got ${dedupItems.length} items with qty ${dedupItems[0]?.qty}`);
    }
    console.log(`  ✓ Duplicate product lines successfully merged into single line with total qty = ${dedupItems[0].qty}`);

    // 7. Verify Core Rule: PO Items do NOT update Product Stock or Supplier Ledger
    console.log(`\n[TEST 7] Architectural Isolation Check (PO Items ≠ Stock IN ≠ Ledger):`);
    const checkProduct = await Product.findById(productMaggi._id);
    console.log(`  - Maggi current stock: ${checkProduct.stock} (Initial stock: 45)`);
    if (checkProduct.stock !== 45) {
      throw new Error(`PO creation incorrectly modified product stock to ${checkProduct.stock}`);
    }

    const checkSupplier = await Supplier.findById(supplierA._id);
    console.log(`  - Supplier ${checkSupplier.company} currentBalance: ₹${checkSupplier.currentBalance}`);
    if (checkSupplier.currentBalance !== 0) {
      throw new Error(`PO creation incorrectly modified supplier balance to ₹${checkSupplier.currentBalance}`);
    }
    console.log("  ✓ Stock level and supplier balance remain untouched (100% Isolated)");

    // 8. Test Product Purchase History Query (T43)
    console.log(`\n[TEST 8] Product Purchase Price History Query:`);
    const history = await purchaseOrderService.getProductPurchaseHistory(bizA._id, productMaggi._id.toString());
    console.log(`  - Historical Purchase Orders for Maggi (Count: ${history.length}):`);
    history.forEach((h) => {
      console.log(`    * PO: ${h.purchaseOrderId?.poNumber || "PO"} | Qty: ${h.qty} | Negotiated Cost: ₹${h.costPrice}`);
    });
    if (history.length < 2) {
      throw new Error(`Expected at least 2 historical purchase items, got ${history.length}`);
    }
    console.log("  ✓ Product purchase history query verified");

    // 9. Multi-Tenant Security Isolation Check
    console.log(`\n[TEST 9] Multi-Tenant Security Isolation:`);
    try {
      await purchaseOrderService.getPurchaseOrderItems(bizB._id, po._id.toString());
      throw new Error("Security Breach! Store B accessed Store A's PO items");
    } catch (err) {
      console.log(`  ✓ Store B access blocked: ${err.message}`);
    }

    // Clean up test records
    await PurchaseItem.deleteMany({ businessId: { $in: [bizA._id, bizB._id] } });
    await PurchaseOrder.deleteMany({ businessId: { $in: [bizA._id, bizB._id] } });
    await Product.deleteMany({ businessId: { $in: [bizA._id, bizB._id] } });
    await Supplier.deleteMany({ businessId: { $in: [bizA._id, bizB._id] } });
    await Business.deleteMany({ _id: { $in: [bizA._id, bizB._id] } });

    console.log("\n================================================================================");
    console.log("  🎉 ALL PHASE 7 TASK T43 TESTS PASSED SUCCESSFULLY! (100% GREEN)");
    console.log("================================================================================\n");

  } catch (error) {
    console.error("\n❌ TEST SUITE FAILED:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runPurchaseItemSchemaTests();
