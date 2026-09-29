const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const { Supplier, SupplierLedger } = require("../src/models/supplier.model");
const Business = require("../src/models/business.model");
const supplierRepo = require("../src/repositories/supplier.repository");
const supplierLedgerRepo = require("../src/repositories/supplierLedger.repository");

async function runSupplier360ManagementTests() {
  console.log("================================================================================");
  console.log("  PHASE 6 - TASK T41: SUPPLIER 360° MANAGEMENT CENTER TEST SUITE");
  console.log("================================================================================");

  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/venderos";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB successfully.\n");

  const runId = Date.now().toString().slice(-6);

  try {
    // 1. Setup Mock Business Store
    const testBiz = await Business.create({
      name: `T41 Store Alpha ${runId}`,
      email: `t41.alpha.${runId}@test.com`,
      phone: `+919871${runId.slice(0, 6)}`,
      currency: "INR",
    });

    const otherBiz = await Business.create({
      name: `T41 Store Beta ${runId}`,
      email: `t41.beta.${runId}@test.com`,
      phone: `+919872${runId.slice(0, 6)}`,
      currency: "INR",
    });

    console.log(`[TEST 1] Setup Business Tenant: ${testBiz._id}`);

    // 2. Create Supplier Profile with Rich Demographics
    const supplier = await supplierRepo.createSupplier(testBiz._id, {
      company: `Apex Distributors ${runId}`,
      contactName: "Rajesh Kulkarni",
      phone: `+919873${runId.slice(0, 6)}`,
      email: `apex.${runId}@distributors.com`,
      address: "Warehouse Block C, Transport Nagar",
      city: "Jaipur",
      state: "Rajasthan",
      pincode: "302013",
      gstin: "08ABCDE1234F1Z5",
      notes: "Primary FMCG beverage distributor (Payment terms: Net 15 days)",
      tags: ["WHOLESALER", "FMCG", "BEVERAGES"],
    });

    console.log(`\n[TEST 2] Created Supplier: ${supplier.company} (ID: ${supplier._id})`);

    // 3. Populate 3x Stock Purchases and 2x Payment Disbursements
    // Purchase 1: ₹50,000
    await supplierLedgerRepo.recordPurchaseCredit({
      businessId: testBiz._id,
      supplierId: supplier._id,
      invoiceValue: 50000,
      purchaseInvoiceNumber: "BILL-101",
      notes: "100 Cartons Soft Drinks",
    });

    // Payment 1: ₹20,000 (UPI)
    await supplierLedgerRepo.recordSupplierPayment({
      businessId: testBiz._id,
      supplierId: supplier._id,
      amount: 20000,
      paymentMethod: "UPI",
      referenceId: "UPI-PAY-001",
      notes: "Advance part payment",
    });

    // Purchase 2: ₹30,000
    await supplierLedgerRepo.recordPurchaseCredit({
      businessId: testBiz._id,
      supplierId: supplier._id,
      invoiceValue: 30000,
      purchaseInvoiceNumber: "BILL-102",
      notes: "50 Boxes Energy Drinks",
    });

    // Payment 2: ₹15,000 (Bank Transfer)
    await supplierLedgerRepo.recordSupplierPayment({
      businessId: testBiz._id,
      supplierId: supplier._id,
      amount: 15000,
      paymentMethod: "BANK_TRANSFER",
      referenceId: "NEFT-HDFC-9922",
      notes: "RTGS settlement",
    });

    // Purchase 3: ₹20,000
    await supplierLedgerRepo.recordPurchaseCredit({
      businessId: testBiz._id,
      supplierId: supplier._id,
      invoiceValue: 20000,
      purchaseInvoiceNumber: "BILL-103",
      notes: "20 Cartons Mineral Water",
    });

    // Expected Financial State:
    // Total Purchases = ₹50,000 + ₹30,000 + ₹20,000 = ₹100,000
    // Total Payments Disbursed = ₹20,000 + ₹15,000 = ₹35,000
    // Current Outstanding Balance = ₹100,000 - ₹35,000 = ₹65,000
    // Total Orders = 3, Avg Order = ₹33,333.33

    console.log(`\n[TEST 3] Logged 3 Purchases (₹100k) & 2 Payments (₹35k).`);

    // 4. Test Single Consolidated 360° Summary Endpoint (T41)
    const summary360 = await supplierRepo.getSupplier360Summary(testBiz._id, supplier._id);

    console.log(`\n[TEST 4] Retrieved Supplier 360° Profile & Metrics:`);
    console.log(`  - Company: ${summary360.profile.company}`);
    console.log(`  - Contact: ${summary360.profile.contactName} (${summary360.profile.phone})`);
    console.log(`  - GSTIN: ${summary360.profile.gstin}`);
    console.log(`  - Tags: ${summary360.profile.tags.join(", ")}`);
    console.log(`  - Lifetime Procurement Spend: ₹${summary360.metrics.totalPurchasesVolume}`);
    console.log(`  - Lifetime Payments Disbursed: ₹${summary360.metrics.totalPaymentsDisbursed}`);
    console.log(`  - Current Accounts Payable Due: ₹${summary360.metrics.currentPayableOutstanding}`);
    console.log(`  - Total Orders Count: ${summary360.metrics.totalOrdersCount}`);
    console.log(`  - Average Order Value: ₹${summary360.metrics.averageOrderValue}`);
    console.log(`  - Recent Purchases Listed: ${summary360.recentPurchases.length}`);
    console.log(`  - Recent Payments Listed: ${summary360.recentPayments.length}`);

    if (
      summary360.metrics.totalPurchasesVolume !== 100000 ||
      summary360.metrics.totalPaymentsDisbursed !== 35000 ||
      summary360.metrics.currentPayableOutstanding !== 65000 ||
      summary360.metrics.totalOrdersCount !== 3 ||
      summary360.recentPurchases.length !== 3 ||
      summary360.recentPayments.length !== 2
    ) {
      throw new Error("Supplier 360° summary calculations or recent activities mismatch.");
    }

    // 5. Test Recent Purchases Ordering (Latest first)
    if (summary360.recentPurchases[0].invoiceNumber !== "BILL-103") {
      throw new Error(`Expected latest purchase BILL-103, got ${summary360.recentPurchases[0].invoiceNumber}`);
    }

    // 6. Test Recent Payments Ordering (Latest first)
    if (summary360.recentPayments[0].paymentMethod !== "BANK_TRANSFER") {
      throw new Error(`Expected latest payment BANK_TRANSFER, got ${summary360.recentPayments[0].paymentMethod}`);
    }

    // 7. Multi-Tenancy Boundary Isolation Test
    let multiTenantErrorCaught = false;
    try {
      await supplierRepo.getSupplier360Summary(otherBiz._id, supplier._id);
    } catch (err) {
      multiTenantErrorCaught = true;
      console.log(`\n[TEST 5] Multi-Tenancy Isolation Verified: Store Beta blocked from accessing Store Alpha's supplier 360 (${err.message})`);
    }
    if (!multiTenantErrorCaught) {
      throw new Error("Tenant isolation failed: Store Beta should not access Store Alpha's supplier 360 profile.");
    }

    console.log("\n================================================================================");
    console.log("  ALL T41 SUPPLIER 360° MANAGEMENT CENTER TESTS PASSED SUCCESSFULLY! (100%)");
    console.log("================================================================================\n");

    // Cleanup
    await SupplierLedger.deleteMany({ businessId: { $in: [testBiz._id, otherBiz._id] } });
    await Supplier.deleteMany({ businessId: { $in: [testBiz._id, otherBiz._id] } });
    await Business.deleteMany({ _id: { $in: [testBiz._id, otherBiz._id] } });
  } catch (err) {
    console.error("\nTEST SUITE FAILED:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runSupplier360ManagementTests();
