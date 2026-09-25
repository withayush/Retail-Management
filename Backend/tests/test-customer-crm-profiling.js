const mongoose = require("mongoose");
const { Customer, CustomerLedger } = require("../src/models/customer.model");
const Invoice = require("../src/models/invoice.model");
const customerRepo = require("../src/repositories/customer.repository");
const customerLedgerRepo = require("../src/repositories/customerLedger.repository");
require("dotenv").config({ path: "c:/Users/AYUSH/OneDrive/Desktop/VenderOS/Backend/.env" });

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://ayushsharma_db_user:Ayush%402003@cluster0.n18h7.mongodb.net/retail_management_system?retryWrites=true&w=majority&appName=Cluster0";

async function runCustomerCRMTests() {
  console.log("================================================================================");
  console.log("TEST SUITE: T36 - CUSTOMER CRM & 360° PROFILING ENGINE");
  console.log("================================================================================");

  let connection;
  try {
    connection = await mongoose.connect(MONGO_URI);
    console.log("[✓] Connected to MongoDB Atlas successfully.\n");

    const businessAId = new mongoose.Types.ObjectId();
    const businessBId = new mongoose.Types.ObjectId();

    // ── TEST 1: Customer Creation & Baseline CRM State (Zero Purchases) ─────────
    console.log("--> [TEST 1] Creating Customer in Business A and Checking Baseline CRM State...");
    const customer = await customerRepo.createCustomer(businessAId, {
      name: "Vikram Malhotra",
      phone: "+919811223344",
      email: "vikram@example.com",
      address: "Shop 12, Main Market",
      city: "Jaipur",
      state: "Rajasthan",
      pincode: "302001",
      creditLimit: 20000,
      notes: "VIP Wholesale buyer",
      tags: ["VIP", "Wholesale"],
    });

    const baselineCRM = await customerRepo.getCustomerCRMSummary(businessAId, customer._id);
    console.log(`[✓] Baseline Profile: Name = ${baselineCRM.profile.name}, Visits = ${baselineCRM.salesMetrics.totalVisits}, Total Sales = ₹${baselineCRM.salesMetrics.totalSalesAmount}`);
    
    if (baselineCRM.profile.name !== "Vikram Malhotra") throw new Error("Customer name mismatch");
    if (baselineCRM.salesMetrics.totalVisits !== 0) throw new Error("Expected 0 initial visits");
    if (baselineCRM.salesMetrics.totalSalesAmount !== 0) throw new Error("Expected ₹0 initial sales");
    if (baselineCRM.salesMetrics.averageSpend !== 0) throw new Error("Expected ₹0 initial average spend");
    if (baselineCRM.debtAging.totalAgedDebt !== 0) throw new Error("Expected ₹0 aged debt");

    // ── TEST 2: Simulating Multiple Sales Across Different Time Periods (Debt Aging) ─
    console.log("\n--> [TEST 2] Generating Historical Invoices with Debt for Aging Tiers...");
    const now = new Date();

    // Invoice 1: 10 days ago (0-30 days bucket) -> ₹5,000 total, ₹2,000 due (₹3,000 paid)
    const date10DaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    const inv1 = await Invoice.create({
      businessId: businessAId,
      invoiceNumber: "INV-8001",
      customerId: customer._id,
      customerName: customer.name,
      customerPhone: customer.phone,
      subtotal: 5000,
      total: 5000,
      paidAmount: 3000,
      dueAmount: 2000,
      paymentStatus: "PARTIAL",
      paymentMode: "SPLIT",
      status: "COMPLETED",
      createdAt: date10DaysAgo,
      items: [{ productId: new mongoose.Types.ObjectId(), name: "Item A", quantity: 2, soldPrice: 2500, totalPrice: 5000 }],
    });

    // Invoice 2: 45 days ago (31-60 days bucket) -> ₹4,000 total, ₹1,500 due (₹2,500 paid)
    const date45DaysAgo = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000);
    const inv2 = await Invoice.create({
      businessId: businessAId,
      invoiceNumber: "INV-7002",
      customerId: customer._id,
      customerName: customer.name,
      customerPhone: customer.phone,
      subtotal: 4000,
      total: 4000,
      paidAmount: 2500,
      dueAmount: 1500,
      paymentStatus: "PARTIAL",
      paymentMode: "CREDIT_UDHAR",
      status: "COMPLETED",
      createdAt: date45DaysAgo,
      items: [{ productId: new mongoose.Types.ObjectId(), name: "Item B", quantity: 4, soldPrice: 1000, totalPrice: 4000 }],
    });

    // Invoice 3: 75 days ago (61-90 days bucket) -> ₹3,000 total, ₹1,000 due (₹2,000 paid)
    const date75DaysAgo = new Date(now.getTime() - 75 * 24 * 60 * 60 * 1000);
    const inv3 = await Invoice.create({
      businessId: businessAId,
      invoiceNumber: "INV-6003",
      customerId: customer._id,
      customerName: customer.name,
      customerPhone: customer.phone,
      subtotal: 3000,
      total: 3000,
      paidAmount: 2000,
      dueAmount: 1000,
      paymentStatus: "PARTIAL",
      paymentMode: "CREDIT_UDHAR",
      status: "COMPLETED",
      createdAt: date75DaysAgo,
      items: [{ productId: new mongoose.Types.ObjectId(), name: "Item C", quantity: 3, soldPrice: 1000, totalPrice: 3000 }],
    });

    // Invoice 4: 100 days ago (90+ days bucket) -> ₹2,000 total, ₹500 due (₹1,500 paid)
    const date100DaysAgo = new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000);
    const inv4 = await Invoice.create({
      businessId: businessAId,
      invoiceNumber: "INV-5004",
      customerId: customer._id,
      customerName: customer.name,
      customerPhone: customer.phone,
      subtotal: 2000,
      total: 2000,
      paidAmount: 1500,
      dueAmount: 500,
      paymentStatus: "PARTIAL",
      paymentMode: "CREDIT_UDHAR",
      status: "COMPLETED",
      createdAt: date100DaysAgo,
      items: [{ productId: new mongoose.Types.ObjectId(), name: "Item D", quantity: 1, soldPrice: 2000, totalPrice: 2000 }],
    });

    // Total sales = 5000 + 4000 + 3000 + 2000 = ₹14,000
    // Total visits = 4
    // Total due = 2000 + 1500 + 1000 + 500 = ₹5,000
    customer.currentBalance = 5000;
    await customer.save();

    // ── TEST 3: Recording Repayments in Customer Ledger ─────────────────────────
    console.log("\n--> [TEST 3] Recording Repayment Settlements in Ledger...");
    await customerLedgerRepo.recordPaymentSettlement({
      businessId: businessAId,
      customerId: customer._id,
      amount: 1000,
      paymentMethod: "UPI",
      notes: "Repayment ref UPI-1122",
    });

    await customerLedgerRepo.recordPaymentSettlement({
      businessId: businessAId,
      customerId: customer._id,
      amount: 500,
      paymentMethod: "CASH",
      notes: "Cash repayment at shop",
    });

    // ── TEST 4: Verifying Complete 360° CRM Aggregation Payload ─────────────────
    console.log("\n--> [TEST 4] Fetching 360° CRM Aggregation Payload...");
    const crm = await customerRepo.getCustomerCRMSummary(businessAId, customer._id);

    console.log("[✓] Profile Summary:", {
      name: crm.profile.name,
      phone: crm.profile.phone,
      city: crm.profile.city,
      tags: crm.profile.tags,
      currentBalance: `₹${crm.profile.currentBalance}`,
    });

    console.log("[✓] Sales & Engagement Metrics:", {
      totalSalesAmount: `₹${crm.salesMetrics.totalSalesAmount}`,
      totalVisits: crm.salesMetrics.totalVisits,
      averageSpend: `₹${crm.salesMetrics.averageSpend}`,
      firstPurchaseDate: crm.salesMetrics.firstPurchaseDate,
      lastPurchaseDate: crm.salesMetrics.lastPurchaseDate,
    });

    console.log("[✓] Debt Aging Breakdown:", crm.debtAging);
    console.log(`[✓] Recent Repayments Count: ${crm.recentPayments.length}`);
    console.log(`[✓] Recent Sales Count: ${crm.recentSales.length}`);

    // Assertions
    if (crm.salesMetrics.totalSalesAmount !== 14000) throw new Error(`Expected ₹14,000 total sales, got ₹${crm.salesMetrics.totalSalesAmount}`);
    if (crm.salesMetrics.totalVisits !== 4) throw new Error(`Expected 4 total visits, got ${crm.salesMetrics.totalVisits}`);
    if (crm.salesMetrics.averageSpend !== 3500) throw new Error(`Expected ₹3,500 average spend, got ₹${crm.salesMetrics.averageSpend}`);
    if (crm.outstanding.currentBalance !== 3500) throw new Error(`Expected ₹3,500 outstanding, got ₹${crm.outstanding.currentBalance}`);
    if (crm.outstanding.availableCredit !== 16500) throw new Error(`Expected ₹16,500 available credit, got ₹${crm.outstanding.availableCredit}`);
    if (crm.outstanding.isLimitExceeded !== false) throw new Error("Limit should not be exceeded");

    // Debt Aging assertions (Allocating ₹3,500 remaining balance from oldest due invoices FIFO):
    // Oldest Inv 4 (100d): ₹500 (90+ days)
    // Inv 3 (75d): ₹1,000 (61-90 days)
    // Inv 2 (45d): ₹1,500 (31-60 days)
    // Inv 1 (10d): remaining ₹500 (0-30 days)
    if (crm.debtAging.bucket90Plus !== 500) throw new Error(`Expected ₹500 in 90+ days, got ${crm.debtAging.bucket90Plus}`);
    if (crm.debtAging.bucket61_90 !== 1000) throw new Error(`Expected ₹1,000 in 61-90 days, got ${crm.debtAging.bucket61_90}`);
    if (crm.debtAging.bucket31_60 !== 1500) throw new Error(`Expected ₹1,500 in 31-60 days, got ${crm.debtAging.bucket31_60}`);
    if (crm.debtAging.bucket0_30 !== 500) throw new Error(`Expected ₹500 in 0-30 days, got ${crm.debtAging.bucket0_30}`);
    if (crm.debtAging.totalAgedDebt !== 3500) throw new Error(`Expected ₹3,500 total aged debt, got ${crm.debtAging.totalAgedDebt}`);

    // Recent Payments & Sales assertions
    if (crm.recentPayments.length !== 2) throw new Error(`Expected 2 recent payments, got ${crm.recentPayments.length}`);
    if (crm.recentSales.length !== 4) throw new Error(`Expected 4 recent sales, got ${crm.recentSales.length}`);

    // ── TEST 5: Multi-Tenant Boundary Check ─────────────────────────────────────
    console.log("\n--> [TEST 5] Testing Multi-Tenant Tenancy Boundary...");
    try {
      await customerRepo.getCustomerCRMSummary(businessBId, customer._id);
      throw new Error("Cross-tenant violation: Business B was able to fetch Business A customer CRM summary!");
    } catch (err) {
      console.log(`[✓] Successfully blocked cross-tenant access with message: "${err.message}"`);
    }

    // Cleanup
    await Customer.deleteMany({ businessId: { $in: [businessAId, businessBId] } });
    await CustomerLedger.deleteMany({ businessId: { $in: [businessAId, businessBId] } });
    await Invoice.deleteMany({ businessId: { $in: [businessAId, businessBId] } });
    console.log("\n[✓] Test records cleaned up successfully.");

    console.log("\n================================================================================");
    console.log("ALL 5/5 T36 CUSTOMER CRM TESTS PASSED SUCCESSFULLY (100% VERIFIED)");
    console.log("================================================================================");
  } catch (error) {
    console.error("\n[X] TEST FAILED:", error);
    process.exit(1);
  } finally {
    if (connection) {
      await mongoose.disconnect();
      console.log("Disconnected from MongoDB Atlas.");
    }
  }
}

runCustomerCRMTests();
