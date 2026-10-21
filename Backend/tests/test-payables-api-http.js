const mongoose = require("mongoose");
const http = require("http");
const axios = require("axios");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const app = require("../src/app");
const Account = require("../src/models/account.model");
const Business = require("../src/models/business.model");
const { Supplier, SupplierLedger } = require("../src/models/supplier.model");
const supplierLedgerRepo = require("../src/repositories/supplierLedger.repository");
const { generateAccessToken } = require("../src/utils/token");

async function runHttpApiTests() {
  console.log("===============================================================================");
  console.log("  PHASE 9 - TASK T58: PAYABLES HTTP API END-TO-END TEST SUITE                 ");
  console.log("===============================================================================");

  const mongoUri =
    process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/vendoros";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB successfully.");

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`Test HTTP server running at ${baseUrl}\n`);

  const runId = Date.now().toString().slice(-6);

  try {
    // 1. Create Test Account & Businesses
    const accountAlpha = await Account.create({
      fullName: `Payables Tester ${runId}`,
      email: `payables.tester.${runId}@test.com`,
      phone: `+919888${runId}`,
      passwordHash: "mock_hash",
      status: "ACTIVE",
    });

    const bizAlpha = await Business.create({
      businessName: `Store Alpha ${runId}`,
      ownerId: accountAlpha._id,
      businessEmail: `store.alpha.${runId}@test.com`,
      businessPhone: `+919888${runId}`,
      currency: "INR",
    });

    const accountBeta = await Account.create({
      fullName: `Beta Tester ${runId}`,
      email: `beta.tester.${runId}@test.com`,
      phone: `+919899${runId}`,
      passwordHash: "mock_hash",
      status: "ACTIVE",
    });

    const bizBeta = await Business.create({
      businessName: `Store Beta ${runId}`,
      ownerId: accountBeta._id,
      businessEmail: `store.beta.${runId}@test.com`,
      businessPhone: `+919899${runId}`,
      currency: "INR",
    });

    const tokenAlpha = generateAccessToken({ sub: accountAlpha._id.toString() });
    const tokenBeta = generateAccessToken({ sub: accountBeta._id.toString() });

    console.log("--> Test 1: Created Test Account & Business Alpha & Beta.");

    // 2. Create 3 Suppliers for Store Alpha with balances ₹20,000, ₹15,000, ₹20,000 (Prompt Section 7)
    const [suppA, suppB, suppC] = await Supplier.create([
      {
        businessId: bizAlpha._id,
        company: `Alpha Supplier A-${runId}`,
        contactName: "Supplier A",
        phone: `+919111${runId}`,
        currentBalance: 0,
        status: "ACTIVE",
      },
      {
        businessId: bizAlpha._id,
        company: `Alpha Supplier B-${runId}`,
        contactName: "Supplier B",
        phone: `+919112${runId}`,
        currentBalance: 0,
        status: "ACTIVE",
      },
      {
        businessId: bizAlpha._id,
        company: `Alpha Supplier C-${runId}`,
        contactName: "Supplier C",
        phone: `+919113${runId}`,
        currentBalance: 0,
        status: "ACTIVE",
      },
    ]);

    // Supplier A: ₹50,000 purchases - ₹30,000 paid = ₹20,000 balance
    await supplierLedgerRepo.recordPurchaseCredit({
      businessId: bizAlpha._id,
      supplierId: suppA._id,
      invoiceValue: 50000,
      purchaseInvoiceNumber: `INV-A-${runId}`,
    });
    await supplierLedgerRepo.recordSupplierPayment({
      businessId: bizAlpha._id,
      supplierId: suppA._id,
      amount: 30000,
      paymentMethod: "BANK_TRANSFER",
    });

    // Supplier B: ₹40,000 purchases - ₹25,000 paid = ₹15,000 balance
    await supplierLedgerRepo.recordPurchaseCredit({
      businessId: bizAlpha._id,
      supplierId: suppB._id,
      invoiceValue: 40000,
      purchaseInvoiceNumber: `INV-B-${runId}`,
    });
    await supplierLedgerRepo.recordSupplierPayment({
      businessId: bizAlpha._id,
      supplierId: suppB._id,
      amount: 25000,
      paymentMethod: "UPI",
    });

    // Supplier C: ₹30,000 purchases - ₹10,000 paid = ₹20,000 balance
    await supplierLedgerRepo.recordPurchaseCredit({
      businessId: bizAlpha._id,
      supplierId: suppC._id,
      invoiceValue: 30000,
      purchaseInvoiceNumber: `INV-C-${runId}`,
    });
    await supplierLedgerRepo.recordSupplierPayment({
      businessId: bizAlpha._id,
      supplierId: suppC._id,
      amount: 10000,
      paymentMethod: "CASH",
    });

    console.log("--> Test 2: Established Outstanding Balances: ₹20,000, ₹15,000, ₹20,000 (Total = ₹55,000).");

    // 3. HTTP GET /api/analytics/payables
    console.log("--> Test 3: Calling GET /api/analytics/payables");
    const resPayables = await axios.get(`${baseUrl}/api/analytics/payables`, {
      headers: {
        Authorization: `Bearer ${tokenAlpha}`,
        "x-business-id": bizAlpha._id.toString(),
      },
    });

    console.log("  Status Code:", resPayables.status);
    console.log("  Response Body:", JSON.stringify(resPayables.data, null, 2));

    if (resPayables.status !== 200 || !resPayables.data.success) {
      throw new Error(`Expected HTTP 200 with success: true, got ${resPayables.status}`);
    }

    const data = resPayables.data.data;
    if (data.totalPayables !== 55000) {
      throw new Error(`Expected totalPayables: 55000, got ${data.totalPayables}`);
    }
    if (data.currency !== "INR") {
      throw new Error(`Expected currency: "INR", got ${data.currency}`);
    }
    if (data.suppliersWithOutstanding !== 3) {
      throw new Error(`Expected suppliersWithOutstanding: 3, got ${data.suppliersWithOutstanding}`);
    }
    console.log("  [PASS] GET /api/analytics/payables returned exact expected benchmark data!\n");

    // 4. HTTP GET /api/analytics/payables/summary
    console.log("--> Test 4: Calling GET /api/analytics/payables/summary");
    const resSummary = await axios.get(`${baseUrl}/api/analytics/payables/summary`, {
      headers: {
        Authorization: `Bearer ${tokenAlpha}`,
        "x-business-id": bizAlpha._id.toString(),
      },
    });

    if (resSummary.status !== 200 || resSummary.data.data.totalPayables !== 55000) {
      throw new Error("Summary endpoint failed to match totalPayables 55000");
    }
    console.log("  [PASS] GET /api/analytics/payables/summary returned matching snapshot.\n");

    // 5. Dynamic Update: Record a valid supplier payment of ₹5,000 (Prompt Section 7 Step 6)
    console.log("--> Test 5: Recording Supplier Payment of ₹5,000 via POST /api/suppliers/:id/settle");
    const resPayment = await axios.post(
      `${baseUrl}/api/suppliers/${suppA._id}/settle`,
      {
        amount: 5000,
        paymentMethod: "BANK_TRANSFER",
        referenceId: "RTGS-E2E-HTTP",
        notes: "Settling ₹5k",
      },
      {
        headers: {
          Authorization: `Bearer ${tokenAlpha}`,
          "x-business-id": bizAlpha._id.toString(),
        },
      }
    );

    console.log("  Payment recorded. Calling GET /api/analytics/payables to verify dynamic update...");
    const resPayablesRefreshed = await axios.get(`${baseUrl}/api/analytics/payables`, {
      headers: {
        Authorization: `Bearer ${tokenAlpha}`,
        "x-business-id": bizAlpha._id.toString(),
      },
    });

    const refreshedData = resPayablesRefreshed.data.data;
    console.log("  Refreshed totalPayables:", refreshedData.totalPayables);
    if (refreshedData.totalPayables !== 50000) {
      throw new Error(`Expected updated totalPayables: 50000, got ${refreshedData.totalPayables}`);
    }
    console.log("  [PASS] Dynamic update verified: Total becomes ₹50,000 after ₹5,000 payment.\n");

    // 6. Multi-Tenant Isolation: Another business (Store Beta) cannot access Store Alpha's supplier balances
    console.log("--> Test 6: Testing Multi-Tenant Isolation with Store Beta Token");
    const resBeta = await axios.get(`${baseUrl}/api/analytics/payables`, {
      headers: {
        Authorization: `Bearer ${tokenBeta}`,
        "x-business-id": bizBeta._id.toString(),
      },
    });

    if (resBeta.data.data.totalPayables !== 0 || resBeta.data.data.suppliersWithOutstanding !== 0) {
      throw new Error("Tenant isolation failed: Store Beta has leaked supplier data!");
    }
    console.log("  [PASS] Store Beta strictly isolated: totalPayables = 0, suppliersWithOutstanding = 0.\n");

    // 7. Unauthenticated request protection
    console.log("--> Test 7: Testing Unauthenticated Request Protection");
    try {
      await axios.get(`${baseUrl}/api/analytics/payables`);
      throw new Error("Expected unauthenticated request to fail with 401");
    } catch (err) {
      if (err.response && err.response.status === 401) {
        console.log("  [PASS] Correctly rejected unauthenticated request with HTTP 401.\n");
      } else {
        throw err;
      }
    }

    console.log("===============================================================================");
    console.log("  ALL HTTP E2E API TESTS PASSED SUCCESSFULLY! (100%)                          ");
    console.log("===============================================================================\n");

    // Cleanup
    await Supplier.deleteMany({ businessId: { $in: [bizAlpha._id, bizBeta._id] } });
    await SupplierLedger.deleteMany({ businessId: { $in: [bizAlpha._id, bizBeta._id] } });
    await Business.deleteMany({ _id: { $in: [bizAlpha._id, bizBeta._id] } });
    await Account.deleteMany({ _id: { $in: [accountAlpha._id, accountBeta._id] } });
  } catch (err) {
    console.error("\nHTTP API TEST SUITE FAILED:", err.response?.data || err.message || err);
    process.exit(1);
  } finally {
    server.close();
    await mongoose.disconnect();
    console.log("Server closed and disconnected from MongoDB.");
  }
}

runHttpApiTests();
