const mongoose = require("mongoose");
const assert = require("assert");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const counterRepo = require("../src/repositories/counter.repository");
const saleRepo = require("../src/repositories/sale.repository");
const purchaseOrderRepo = require("../src/repositories/purchaseOrder.repository");
const grnRepo = require("../src/repositories/grn.repository");
const Counter = require("../src/models/counter.model");
const Business = require("../src/models/business.model");
const Invoice = require("../src/models/invoice.model");

async function runBug23Tests() {
  console.log("================================================================================");
  console.log("   BUG 2.3 VERIFICATION: CONCURRENCY-SAFE ATOMIC SEQUENTIAL NUMBER GENERATOR    ");
  console.log("================================================================================\n");

  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/venderos";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB successfully.\n");

  const runId = Date.now().toString().slice(-6);

  try {
    // 1. Create a dedicated test business
    const testBusiness = await Business.create({
      ownerId: new mongoose.Types.ObjectId(),
      businessName: `Test Counter Store ${runId}`,
      email: `counter.store.${runId}@test.com`,
      phone: `+919911${runId.slice(0, 6)}`,
      currency: "INR",
    });

    const bId = testBusiness._id;
    console.log(`[Setup] Created Test Business: ${testBusiness.businessName} (ID: ${bId})`);

    // ==============================================================================
    // TEST 1: Simultaneous Invoice Number Generation (POS Cashier Race Condition)
    // ==============================================================================
    console.log("\n[Test 1] 10 Concurrent POS Cashier Checkouts Requesting Invoice Numbers:");

    // 10 cashiers simultaneously invoke getNextSequence for INVOICE at the exact same millisecond
    const invoicePromises = Array.from({ length: 10 }, () =>
      saleRepo.getNextInvoiceNumber(bId)
    );

    const generatedInvoices = await Promise.all(invoicePromises);
    console.log(" - Generated Invoice Numbers:", generatedInvoices);

    // Verify all 10 numbers are unique
    const uniqueInvoices = new Set(generatedInvoices);
    assert.strictEqual(
      uniqueInvoices.size,
      10,
      `All 10 generated invoice numbers must be strictly unique! Duplicates found: ${10 - uniqueInvoices.size}`
    );

    // Verify format and sequential values
    generatedInvoices.forEach((invNum) => {
      assert.match(invNum, /^INV-\d+$/);
    });

    // Verify sorted values are consecutive
    const numericInvoices = generatedInvoices.map((inv) => parseInt(inv.replace("INV-", ""), 10)).sort((a, b) => a - b);
    for (let i = 1; i < numericInvoices.length; i++) {
      assert.strictEqual(
        numericInvoices[i],
        numericInvoices[i - 1] + 1,
        `Invoice sequence must be strictly consecutive! ${numericInvoices[i - 1]} -> ${numericInvoices[i]}`
      );
    }
    console.log(" - Strict Uniqueness & Consecutive Sequences : PASSED ✅");

    // ==============================================================================
    // TEST 2: Simultaneous Purchase Order Number Generation (Admin Race Condition)
    // ==============================================================================
    console.log("\n[Test 2] 10 Concurrent Admin Requests Generating Purchase Order Numbers:");

    const poPromises = Array.from({ length: 10 }, () =>
      purchaseOrderRepo.generateNextPoNumber(bId)
    );

    const generatedPOs = await Promise.all(poPromises);
    console.log(" - Generated PO Numbers:", generatedPOs);

    const uniquePOs = new Set(generatedPOs);
    assert.strictEqual(
      uniquePOs.size,
      10,
      `All 10 generated PO numbers must be strictly unique!`
    );

    generatedPOs.forEach((poNum) => {
      assert.match(poNum, /^PO-\d+$/);
    });

    const numericPOs = generatedPOs.map((p) => parseInt(p.replace("PO-", ""), 10)).sort((a, b) => a - b);
    for (let i = 1; i < numericPOs.length; i++) {
      assert.strictEqual(numericPOs[i], numericPOs[i - 1] + 1);
    }
    console.log(" - PO Strict Uniqueness & Consecutive Sequences : PASSED ✅");

    // ==============================================================================
    // TEST 3: Simultaneous Goods Received Note Number Generation (GRN Race Condition)
    // ==============================================================================
    console.log("\n[Test 3] 10 Concurrent Warehouse Receipts Generating GRN Numbers:");

    const grnPromises = Array.from({ length: 10 }, () =>
      grnRepo.generateNextGrnNumber(bId)
    );

    const generatedGRNs = await Promise.all(grnPromises);
    console.log(" - Generated GRN Numbers:", generatedGRNs);

    const uniqueGRNs = new Set(generatedGRNs);
    assert.strictEqual(
      uniqueGRNs.size,
      10,
      `All 10 generated GRN numbers must be strictly unique!`
    );

    generatedGRNs.forEach((grnNum) => {
      assert.match(grnNum, /^GRN-\d+$/);
    });

    const numericGRNs = generatedGRNs.map((g) => parseInt(g.replace("GRN-", ""), 10)).sort((a, b) => a - b);
    for (let i = 1; i < numericGRNs.length; i++) {
      assert.strictEqual(numericGRNs[i], numericGRNs[i - 1] + 1);
    }
    console.log(" - GRN Strict Uniqueness & Consecutive Sequences : PASSED ✅");

    // ==============================================================================
    // TEST 4: Cold-Start Pre-Existing Records Backward Compatibility
    // ==============================================================================
    console.log("\n[Test 4] Cold-Start Counter Seeding from Existing Documents:");

    const legacyBiz = await Business.create({
      ownerId: new mongoose.Types.ObjectId(),
      businessName: `Legacy Store ${runId}`,
      email: `legacy.${runId}@test.com`,
      phone: `+919922${runId.slice(0, 6)}`,
      currency: "INR",
    });

    // Simulate an existing store that already has invoices up to INV-1045 before Counter existed
    await Invoice.create({
      businessId: legacyBiz._id,
      invoiceNumber: "INV-1045",
      subtotal: 100,
      total: 100,
      paymentStatus: "PAID",
      paymentMode: "CASH",
      status: "COMPLETED",
    });

    // Now call getNextInvoiceNumber on legacy store
    const nextLegacyInv = await saleRepo.getNextInvoiceNumber(legacyBiz._id);
    console.log(` - Legacy Store (had INV-1045) generated: ${nextLegacyInv}`);

    // Must be INV-1046, NOT restarting from INV-1001!
    assert.strictEqual(
      nextLegacyInv,
      "INV-1046",
      `Must seamlessly detect existing max sequence (1045) and continue with INV-1046!`
    );
    console.log(" - Backward Compatibility & Non-Destructive Seeding: PASSED ✅");

    // ==============================================================================
    // TEST 5: Real Database Concurrent Insert Verification (Zero E11000 Duplicate Key Error)
    // ==============================================================================
    console.log("\n[Test 5] Concurrent Insertion of 5 Invoices into MongoDB:");

    const insertPromises = Array.from({ length: 5 }, async (_, idx) => {
      const invNumber = await saleRepo.getNextInvoiceNumber(bId);
      return await Invoice.create({
        businessId: bId,
        invoiceNumber: invNumber,
        subtotal: 50 * (idx + 1),
        total: 50 * (idx + 1),
        paymentStatus: "PAID",
        paymentMode: "CASH",
        status: "COMPLETED",
      });
    });

    const insertedInvoices = await Promise.all(insertPromises);
    assert.strictEqual(insertedInvoices.length, 5);
    console.log(` - Successfully inserted 5 concurrent invoices with zero E11000 errors! ✅`);

    console.log("\n================================================================================");
    console.log("    ALL BUG 2.3 CONCURRENCY & COUNTER TESTS PASSED PERFECTLY (5/5) ✅           ");
    console.log("================================================================================\n");
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

runBug23Tests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
