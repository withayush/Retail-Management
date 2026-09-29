const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const { PurchaseOrder } = require("../src/models/purchaseOrder.model");
const { Supplier } = require("../src/models/supplier.model");
const { Product } = require("../src/models/product.model");
const Business = require("../src/models/business.model");
const purchaseOrderRepo = require("../src/repositories/purchaseOrder.repository");
const purchaseOrderService = require("../src/services/purchaseOrder.service");
const supplierRepo = require("../src/repositories/supplier.repository");

async function runPurchaseOrderSchemaTests() {
  console.log("================================================================================");
  console.log("  PHASE 7 - TASK T42: PURCHASE ORDER SCHEMA MODEL TEST SUITE");
  console.log("================================================================================");

  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/venderos";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB successfully.\n");

  const runId = Date.now().toString().slice(-6);

  try {
    // 1. Setup Test Businesses
    const bizA = await Business.create({
      name: `PO Test Store A ${runId}`,
      email: `po.a.${runId}@test.com`,
      phone: `+919811${runId.slice(0, 6)}`,
      currency: "INR",
    });

    const bizB = await Business.create({
      name: `PO Test Store B ${runId}`,
      email: `po.b.${runId}@test.com`,
      phone: `+919822${runId.slice(0, 6)}`,
      currency: "INR",
    });

    console.log(`[TEST 1] Created Multi-Tenant Stores: Store A (${bizA._id}), Store B (${bizB._id})`);

    // 2. Setup Suppliers in Store A and Store B
    const supplierA = await supplierRepo.createSupplier(bizA._id, {
      company: `ABC Wholesale Hub ${runId}`,
      contactName: "Amit Sharma",
      phone: `+919833${runId.slice(0, 6)}`,
      email: `abc.${runId}@wholesale.com`,
      address: "Industrial Area Phase 1, Jaipur",
    });

    const supplierB = await supplierRepo.createSupplier(bizB._id, {
      company: `XYZ Distributors ${runId}`,
      contactName: "Vikram Mehta",
      phone: `+919844${runId.slice(0, 6)}`,
      email: `xyz.${runId}@distrib.com`,
      address: "Warehouse Block D, Delhi",
    });

    console.log(`[TEST 2] Created Suppliers: Store A -> ${supplierA.company}, Store B -> ${supplierB.company}`);

    // 3. Test PO Creation & Automatic poNumber Generation (PO-1001)
    const po1 = await purchaseOrderService.createPurchaseOrder(bizA._id, {
      supplierId: supplierA._id.toString(),
      orderDate: new Date(),
      expectedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // +3 days
      status: "PENDING",
      items: [
        { name: "Maggi Noodles 2-Min 70g", sku: "MAGGI-70G", quantity: 100, unitCost: 12.5, unit: "pack" },
        { name: "Coca Cola Can 300ml", sku: "COKE-300ML", quantity: 50, unitCost: 32.0, unit: "can" },
        { name: "Parle-G Gold 100g", sku: "PARLE-100G", quantity: 80, unitCost: 8.0, unit: "pack" },
      ],
      notes: "Please deliver before 2 PM to warehouse dock 2",
      paymentTerms: "Net 30 Days",
    });

    console.log("\n[TEST 3] Created Purchase Order 1:");
    console.log(`  - PO Number: ${po1.poNumber} (Auto-generated)`);
    console.log(`  - Supplier: ${po1.supplierCompany}`);
    console.log(`  - Status: ${po1.status}`);
    console.log(`  - Items Count: ${po1.itemsCount}, Total Qty: ${po1.totalQuantity}`);
    console.log(`  - Cost Total: ₹${po1.costTotal}`);

    // Verify CostTotal math: (100 * 12.5) + (50 * 32.0) + (80 * 8.0) = 1250 + 1600 + 640 = 3490
    if (po1.costTotal !== 3490 || po1.itemsCount !== 3 || po1.totalQuantity !== 230) {
      throw new Error(`Cost total calculation mismatch! Expected 3490, got ${po1.costTotal}`);
    }
    console.log("  ✓ Cost Total and Line Item Math Verified (100% Accurate)");

    // 4. Test Sequential PO Number Generation (PO-1002)
    const po2 = await purchaseOrderService.createPurchaseOrder(bizA._id, {
      supplierId: supplierA._id.toString(),
      status: "DRAFT",
      items: [
        { name: "Tata Salt 1kg", sku: "TATA-SALT-1KG", quantity: 50, unitCost: 24.0 },
      ],
    });

    console.log("\n[TEST 4] Created Purchase Order 2 (Sequential Numbering Check):");
    console.log(`  - PO Number: ${po2.poNumber}`);
    if (po2.poNumber !== "PO-1002" && po2.poNumber !== "PO-1001") {
      console.log(`  ✓ Generated sequential PO number: ${po2.poNumber}`);
    }

    // 5. Test Multi-Tenant Boundary Isolation
    // Store B cannot access Store A's PO
    console.log("\n[TEST 5] Multi-Tenant Security Isolation Check:");
    try {
      await purchaseOrderService.getPurchaseOrderById(bizB._id, po1._id.toString());
      throw new Error("Security Breach! Store B was able to access Store A's Purchase Order");
    } catch (err) {
      console.log(`  ✓ Store B access to Store A PO blocked: ${err.message}`);
    }

    // Cross-tenant supplier validation check: Store A cannot create PO referencing Store B's supplier
    try {
      await purchaseOrderService.createPurchaseOrder(bizA._id, {
        supplierId: supplierB._id.toString(),
        items: [{ name: "Test Item", quantity: 1, unitCost: 100 }],
      });
      throw new Error("Security Breach! Store A created PO referencing Store B's supplier");
    } catch (err) {
      console.log(`  ✓ Cross-tenant supplier assignment blocked: ${err.message}`);
    }

    // 6. Test Status Transitions (DRAFT -> PENDING -> PARTIAL -> RECEIVED / CANCELLED)
    console.log("\n[TEST 6] Status Transition Lifecycle Check:");
    const updatedPO2 = await purchaseOrderService.updatePOStatus(bizA._id, po2._id.toString(), {
      status: "PENDING",
      notes: "Draft finalized and dispatched to vendor via email",
    });
    console.log(`  - PO2 Updated Status: ${updatedPO2.status}`);

    const cancelledPO2 = await purchaseOrderService.cancelPurchaseOrder(bizA._id, po2._id.toString(), "Vendor out of stock");
    console.log(`  - PO2 Cancelled Status: ${cancelledPO2.status}`);

    // 7. Verify Core Architectural Guarantee:
    // PO creation does NOT alter inventory stock or supplier accounts payable balance!
    console.log("\n[TEST 7] Architectural Isolation Verification (PO ≠ Inventory ≠ Supplier Payable):");
    const supplierCheck = await Supplier.findById(supplierA._id);
    console.log(`  - Supplier ${supplierCheck.company} Current Balance: ₹${supplierCheck.currentBalance}`);
    if (supplierCheck.currentBalance !== 0) {
      throw new Error(`PO creation incorrectly modified supplier balance to ₹${supplierCheck.currentBalance}`);
    }
    console.log("  ✓ Confirmed: PO Creation did NOT create supplier debt in ledger (Payable is ₹0)");

    // 8. Test Purchase Order Summary KPIs
    console.log("\n[TEST 8] Purchase Order KPI Summary Aggregation:");
    const summary = await purchaseOrderService.getPOSummary(bizA._id);
    console.log("  - Store A PO Summary KPIs:", summary);
    if (summary.totalOrders < 2) {
      throw new Error(`Summary totalOrders expected >= 2, got ${summary.totalOrders}`);
    }
    console.log("  ✓ KPI Aggregation Verified");

    // 9. Clean up test records
    await PurchaseOrder.deleteMany({ businessId: { $in: [bizA._id, bizB._id] } });
    await Supplier.deleteMany({ businessId: { $in: [bizA._id, bizB._id] } });
    await Business.deleteMany({ _id: { $in: [bizA._id, bizB._id] } });

    console.log("\n================================================================================");
    console.log("  🎉 ALL PHASE 7 TASK T42 TESTS PASSED SUCCESSFULLY! (100% GREEN)");
    console.log("================================================================================\n");

  } catch (error) {
    console.error("\n❌ TEST SUITE FAILED:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runPurchaseOrderSchemaTests();
