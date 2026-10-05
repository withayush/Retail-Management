const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const { PurchaseOrder } = require("../src/models/purchaseOrder.model");
const { PurchaseOrderHistory } = require("../src/models/purchaseOrderHistory.model");
const Product = require("../src/models/product.model");
const Business = require("../src/models/business.model");
const purchaseOrderRepo = require("../src/repositories/purchaseOrder.repository");
const purchaseOrderHistoryRepo = require("../src/repositories/purchaseOrderHistory.repository");
const supplierRepo = require("../src/repositories/supplier.repository");
const grnService = require("../src/services/grn.service");

async function runPOHistoryTests() {
  console.log("================================================================================");
  console.log("  PHASE 7 - TASK T47: PURCHASE ORDER WORKFLOW HISTORY TEST SUITE");
  console.log("================================================================================");

  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/venderos";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB successfully.\n");

  const runId = Date.now().toString().slice(-6);

  try {
    // 1. Multi-Tenant Setup: Store Alpha & Store Beta
    const bizA = await Business.create({
      ownerId: new mongoose.Types.ObjectId(),
      businessName: `T47 Store Alpha ${runId}`,
      email: `t47.alpha.${runId}@test.com`,
      phone: `+919811${runId.slice(0, 6)}`,
      currency: "INR",
    });

    const bizB = await Business.create({
      ownerId: new mongoose.Types.ObjectId(),
      businessName: `T47 Store Beta ${runId}`,
      email: `t47.beta.${runId}@test.com`,
      phone: `+919822${runId.slice(0, 6)}`,
      currency: "INR",
    });

    console.log(`[TEST 1] Setup Multi-Tenant Stores: Store Alpha (${bizA._id}), Store Beta (${bizB._id}) [PASSED]`);

    // 2. Setup Supplier & Product
    const supplierA = await supplierRepo.createSupplier(bizA._id, {
      company: `Premier Goods Ltd ${runId}`,
      contactName: "Rajesh Khanna",
      phone: `+919855${runId.slice(0, 6)}`,
      email: `premier.${runId}@goods.com`,
    });

    const categoryId = new mongoose.Types.ObjectId();

    const prodMaggi = await Product.create({
      businessId: bizA._id,
      categoryId,
      name: "Maggi 70g Pouch",
      sku: `MAGGI-${runId}`,
      sellingPrice: 60.0,
      costPrice: 50.0,
      stock: 0,
      unit: "pcs",
    });

    console.log(`[TEST 2] Created Supplier (${supplierA.company}) & Product (Maggi) [PASSED]`);

    // 3. Create PO (PO-1001) for ₹5,000 (100 units @ ₹50) with Expected Delivery in 3 days
    const expectedDeliveryDate = new Date(Date.now() + 86400000 * 3);
    const po = await purchaseOrderRepo.create(
      bizA._id,
      {
        supplierId: supplierA._id,
        supplierCompany: supplierA.company,
        expectedDeliveryDate,
        items: [
          {
            productId: prodMaggi._id,
            name: prodMaggi.name,
            sku: prodMaggi.sku,
            unit: prodMaggi.unit,
            unitCost: 50.0,
            quantity: 100,
          },
        ],
        notes: "Urgent festival replenishment",
      },
      new mongoose.Types.ObjectId(),
      "Procurement Manager"
    );

    console.log(`[TEST 3] Created PO ${po.poNumber} (CostTotal = ₹${po.costTotal}) [PASSED]`);

    // Verify PO_CREATED Event in History
    const historyAfterCreate = await purchaseOrderHistoryRepo.getHistoryByPoId(bizA._id, po._id);
    if (historyAfterCreate.length !== 1) {
      throw new Error(`Expected 1 history event after create, found ${historyAfterCreate.length}`);
    }

    const createEvt = historyAfterCreate[0];
    if (createEvt.eventType !== "PO_CREATED" || createEvt.details?.costTotal !== 5000) {
      throw new Error(`PO_CREATED event mismatch: type=${createEvt.eventType}, cost=${createEvt.details?.costTotal}`);
    }
    console.log(`[TEST 4] INVARIANT: PO_CREATED history event automatically logged with details [PASSED]`);

    // 4. Update Expected Delivery Date
    const updatedExpectedDate = new Date(Date.now() + 86400000 * 5);
    await purchaseOrderRepo.updateById(
      bizA._id,
      po._id,
      {
        expectedDelivery: updatedExpectedDate,
      },
      new mongoose.Types.ObjectId(),
      "Store Admin"
    );

    const historyAfterDateUpdate = await purchaseOrderHistoryRepo.getHistoryByPoId(bizA._id, po._id);
    const dateEvt = historyAfterDateUpdate.find((e) => e.eventType === "EXPECTED_DELIVERY_CHANGED");
    if (!dateEvt) {
      throw new Error("EXPECTED_DELIVERY_CHANGED history event not found!");
    }
    console.log(`[TEST 5] EXPECTED_DELIVERY_CHANGED event recorded successfully [PASSED]`);

    // 5. Cost Change Negotiation: Supplier negotiates unit cost down from ₹50 to ₹48 (Total: ₹4,800)
    await purchaseOrderRepo.updateById(
      bizA._id,
      po._id,
      {
        items: [
          {
            productId: prodMaggi._id,
            name: prodMaggi.name,
            sku: prodMaggi.sku,
            unit: prodMaggi.unit,
            unitCost: 48.0,
            quantity: 100,
          },
        ],
      },
      new mongoose.Types.ObjectId(),
      "Purchasing Officer"
    );

    const historyAfterCostUpdate = await purchaseOrderHistoryRepo.getHistoryByPoId(bizA._id, po._id);
    const costEvt = historyAfterCostUpdate.find((e) => e.eventType === "COST_CHANGED");
    if (!costEvt || costEvt.details?.costBefore !== 5000 || costEvt.details?.costAfter !== 4800) {
      throw new Error(`COST_CHANGED event mismatch: before=${costEvt?.details?.costBefore}, after=${costEvt?.details?.costAfter}`);
    }
    console.log(`[TEST 6] COST_CHANGED event preserved (₹5,000 → ₹4,800, Diff: ₹${costEvt.details.diffAmount}) [PASSED]`);

    // 6. First Partial Delivery (GRN 1): 60 units received on-time (60 @ ₹48 = ₹2,880)
    const grnPayload1 = {
      purchaseOrderId: po._id,
      receivedDate: new Date(),
      deliveryChallanNumber: `DC-${runId}-01`,
      invoiceNumber: `INV-${runId}-01`,
      notes: "Partial receipt: 60 units",
      items: [
        {
          productId: prodMaggi._id,
          receivedQty: 60,
          costPrice: 48.0,
        },
      ],
    };

    const grn1Result = await grnService.receiveStock(bizA._id, grnPayload1, null, "Warehouse Lead");

    const historyAfterGRN1 = await purchaseOrderHistoryRepo.getHistoryByPoId(bizA._id, po._id);
    const partialEvt = historyAfterGRN1.find((e) => e.eventType === "PARTIAL_RECEIPT");
    const payableEvt1 = historyAfterGRN1.find(
      (e) => e.eventType === "PAYABLE_CREATED" && e.details?.grnNumber === grn1Result.grn.grnNumber
    );

    if (!partialEvt || partialEvt.details?.totalCostReceived !== 2880) {
      throw new Error(`PARTIAL_RECEIPT event mismatch: cost=${partialEvt?.details?.totalCostReceived}`);
    }
    if (!payableEvt1 || payableEvt1.details?.payableAmount !== 2880) {
      throw new Error(`PAYABLE_CREATED event mismatch for GRN 1: amount=${payableEvt1?.details?.payableAmount}`);
    }
    console.log(`[TEST 7] GRN 1 PARTIAL_RECEIPT and PAYABLE_CREATED (+₹2,880) events logged [PASSED]`);

    // 7. Second Delayed Delivery (GRN 2): remaining 40 units received 2 days late (40 @ ₹48 = ₹1,920)
    const delayedReceivedDate = new Date(updatedExpectedDate.getTime() + 86400000 * 2); // 2 days after expected
    const grnPayload2 = {
      purchaseOrderId: po._id,
      receivedDate: delayedReceivedDate,
      deliveryChallanNumber: `DC-${runId}-02`,
      invoiceNumber: `INV-${runId}-02`,
      notes: "Final delivery: 40 units (delayed)",
      items: [
        {
          productId: prodMaggi._id,
          receivedQty: 40,
          costPrice: 48.0,
        },
      ],
    };

    const grn2Result = await grnService.receiveStock(bizA._id, grnPayload2, null, "Warehouse Lead");

    const historyAfterGRN2 = await purchaseOrderHistoryRepo.getHistoryByPoId(bizA._id, po._id);
    const fullEvt = historyAfterGRN2.find((e) => e.eventType === "FULL_RECEIPT");
    const payableEvt2 = historyAfterGRN2.find(
      (e) => e.eventType === "PAYABLE_CREATED" && e.details?.grnNumber === grn2Result.grn.grnNumber
    );

    if (!fullEvt || fullEvt.details?.delayDays < 1) {
      throw new Error(`FULL_RECEIPT event should record delayDays > 0, got ${fullEvt?.details?.delayDays}`);
    }
    if (!payableEvt2 || payableEvt2.details?.payableAmount !== 1920) {
      throw new Error(`PAYABLE_CREATED event mismatch for GRN 2: amount=${payableEvt2?.details?.payableAmount}`);
    }
    console.log(`[TEST 8] GRN 2 FULL_RECEIPT (Delay: ${fullEvt.details.delayDays}d) and PAYABLE_CREATED (+₹1,920) logged [PASSED]`);

    // 8. Manual Operational Log
    await purchaseOrderHistoryRepo.recordEvent({
      businessId: bizA._id,
      purchaseOrderId: po._id,
      poNumber: po.poNumber,
      eventType: "MANUAL_LOG",
      title: "Invoice Stamp & Gatepass Verification",
      description: "Warehouse manager verified supplier invoice stamp and filed original DC copy.",
      previousStatus: "RECEIVED",
      newStatus: "RECEIVED",
      performedByName: "Chief Inspector",
    });

    const allEvents = await purchaseOrderHistoryRepo.getHistoryByPoId(bizA._id, po._id);
    const manualEvt = allEvents.find((e) => e.eventType === "MANUAL_LOG");
    if (!manualEvt) {
      throw new Error("MANUAL_LOG event not found!");
    }
    console.log(`[TEST 9] MANUAL_LOG operational note appended to PO timeline [PASSED]`);

    // 9. Full Timeline & Lead-Time Summary Aggregation
    const timeline = await purchaseOrderHistoryRepo.getTimelineSummary(bizA._id, po._id);
    if (timeline.events.length < 6) {
      throw new Error(`Expected at least 6 timeline events, found ${timeline.events.length}`);
    }
    if (timeline.analytics.totalCostOrdered !== 4800 || timeline.analytics.totalCostReceived !== 4800) {
      throw new Error(`Cost totals mismatch in timeline analytics: ordered=${timeline.analytics.totalCostOrdered}, rec=${timeline.analytics.totalCostReceived}`);
    }
    if (timeline.analytics.costChanges.length !== 1) {
      throw new Error(`Expected 1 cost change record in timeline, found ${timeline.analytics.costChanges.length}`);
    }

    console.log(`\n[TIMELINE SUMMARY]:`);
    console.log(`- PO Number: ${timeline.purchaseOrder.poNumber}`);
    console.log(`- Status: ${timeline.purchaseOrder.status}`);
    console.log(`- Delivery Status: ${timeline.analytics.deliveryStatus}`);
    console.log(`- Total Lead Time: ${timeline.analytics.totalLeadTimeDays} days`);
    console.log(`- Delay: ${timeline.analytics.delayDays} days`);
    console.log(`- Total Events: ${timeline.totalEventsCount}`);
    console.log(`- Cost Changes Logged: ${timeline.analytics.costChanges.length} (₹${timeline.analytics.costChanges[0].costBefore} → ₹${timeline.analytics.costChanges[0].costAfter})`);
    console.log(`[TEST 10] getTimelineSummary aggregated audit metrics accurately [PASSED]`);

    // 10. Supplier Procurement Performance Aggregation
    const supplierPerf = await purchaseOrderHistoryRepo.getSupplierProcurementPerformance(bizA._id, supplierA._id);
    if (supplierPerf.metrics.totalOrdersPlaced !== 1 || supplierPerf.metrics.completedOrdersCount !== 1) {
      throw new Error(`Supplier performance mismatch: placed=${supplierPerf.metrics.totalOrdersPlaced}, completed=${supplierPerf.metrics.completedOrdersCount}`);
    }
    console.log(`\n[SUPPLIER PERFORMANCE]:`);
    console.log(`- Vendor: ${supplierPerf.supplier.company}`);
    console.log(`- Total Orders: ${supplierPerf.metrics.totalOrdersPlaced}`);
    console.log(`- Completed Orders: ${supplierPerf.metrics.completedOrdersCount}`);
    console.log(`- Delayed Shipments: ${supplierPerf.metrics.delayedDeliveriesCount}`);
    console.log(`- Average Delay: ${supplierPerf.metrics.averageDelayDays} days`);
    console.log(`- Total Value Procured: ₹${supplierPerf.metrics.totalProcurementValue}`);
    console.log(`[TEST 11] Supplier Procurement Performance analytics verified [PASSED]`);

    // 11. Multi-Tenant Isolation: Store Beta cannot access Store Alpha's PO history
    const crossTenantHistory = await purchaseOrderHistoryRepo.getHistoryByPoId(bizB._id, po._id);
    if (crossTenantHistory.length !== 0) {
      throw new Error("Security Violation: Store Beta accessed Store Alpha's PO history!");
    }

    try {
      await purchaseOrderHistoryRepo.getTimelineSummary(bizB._id, po._id);
      throw new Error("Security Violation: Store Beta accessed Store Alpha's PO timeline summary!");
    } catch (crossErr) {
      if (crossErr.statusCode !== 404 && crossErr.code !== "PURCHASE_ORDER_NOT_FOUND") {
        throw crossErr;
      }
    }
    console.log(`[TEST 12] Multi-Tenant Security Isolation Verified (Access rejected across stores) [PASSED]`);

    console.log("\n================================================================================");
    console.log("  ALL TASK T47 PURCHASE ORDER WORKFLOW HISTORY TESTS PASSED PERFECTLY!");
    console.log("================================================================================");
  } catch (err) {
    console.error("\n❌ TEST SUITE FAILED:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB.");
  }
}

runPOHistoryTests();
