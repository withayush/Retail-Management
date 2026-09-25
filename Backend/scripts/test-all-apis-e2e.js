/**
 * ============================================================================
 *               VENDOROS - AUTOMATED END-TO-END API TEST RUNNER
 * ============================================================================
 * Automatically executes and validates all 35+ API endpoints across all 10 modules
 * against a live running server (http://localhost:3001).
 * 
 * Run with: npm run test:api   (or: node scripts/test-all-apis-e2e.js)
 * ============================================================================
 */

const axios = require("axios");

const BASE_URL = process.env.API_URL || "http://localhost:3001";
const client = axios.create({
  baseURL: BASE_URL,
  validateStatus: () => true, // Don't throw on HTTP error codes so we inspect and assert them cleanly
  timeout: 10000,
});

// State preserved across request execution flow
let token = null;
let accountId = null;
let businessId = null;
let categoryId = null;
let productId = null;
let barcode = null;
let sku = null;
let invoiceId = null;
let customerId = null;
let customerPhone = null;
let supplierId = null;

// Unique test credentials
const uniqueSuffix = Date.now().toString().slice(-6);
const testUser = {
  fullName: `Automation Tester ${uniqueSuffix}`,
  email: `test.auto.${uniqueSuffix}@venderos.test`,
  phone: `+9198${Math.floor(10000000 + Math.random() * 90000000)}`,
  password: "Password@123",
};

let passedCount = 0;
let failedCount = 0;
const results = [];

const getHeaders = (includeBusiness = true) => {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (includeBusiness && businessId) headers["x-business-id"] = businessId;
  return headers;
};

const runTest = async (title, fn) => {
  const start = Date.now();
  try {
    await fn();
    const duration = Date.now() - start;
    passedCount++;
    results.push({ title, status: "PASS", duration });
    console.log(` \x1b[32m✔\x1b[0m  ${title.padEnd(55)} \x1b[90m(${duration}ms)\x1b[0m`);
  } catch (err) {
    const duration = Date.now() - start;
    failedCount++;
    results.push({ title, status: "FAIL", error: err.message, duration });
    console.log(` \x1b[31m✖\x1b[0m  ${title.padEnd(55)} \x1b[31mFAILED: ${err.message}\x1b[0m`);
  }
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message || "Assertion failed");
};

async function startSuite() {
  console.log("\n================================================================================");
  console.log("            🚀 VENDOROS COMPLETE AUTOMATED API TEST SUITE                      ");
  console.log(`            Target Server: ${BASE_URL}                                         `);
  console.log("================================================================================\n");

  // MODULE 1: HEALTH
  console.log("\x1b[36m▶ MODULE 1: System & Health Check\x1b[0m");
  await runTest("GET  / (Server Health Check)", async () => {
    const res = await client.get("/");
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.success === true, "Response success must be true");
  });

  // MODULE 2: AUTHENTICATION
  console.log("\n\x1b[36m▶ MODULE 2: Authentication & User Management (/api/auth)\x1b[0m");
  let testOtp = null;
  await runTest("POST /api/auth/register (Register User)", async () => {
    const res = await client.post("/api/auth/register", testUser);
    assert(res.status === 201, `Expected 201, got ${res.status}: ${JSON.stringify(res.data)}`);
    assert(res.data.success === true, "success flag false");
    testOtp = res.data.data?.debugOtp || res.data.data?.otp;
    accountId = res.data.data?.accountId;
    assert(testOtp, `OTP not returned in response: ${JSON.stringify(res.data)}`);
  });

  await runTest("POST /api/auth/verify-phone (Verify Phone OTP)", async () => {
    const res = await client.post("/api/auth/verify-phone", {
      phone: testUser.phone,
      otp: testOtp,
    });
    assert(res.status === 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.data)}`);
    token = res.data.data?.accessToken;
    if (!token && res.headers["set-cookie"]) {
      const match = res.headers["set-cookie"].find((c) => c.startsWith("accessToken="));
      if (match) token = match.split(";")[0].replace("accessToken=", "");
    }
    assert(token, "Access token not returned");
  });

  await runTest("POST /api/auth/login (Login User)", async () => {
    const res = await client.post("/api/auth/login", {
      identifier: testUser.email,
      password: testUser.password,
    });
    assert(res.status === 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.data)}`);
    token = res.data.data?.accessToken || token;
    assert(token, "Access token missing in login");
  });

  await runTest("GET  /api/auth/me (Get Profile)", async () => {
    const res = await client.get("/api/auth/me", { headers: getHeaders(false) });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.data.account.email === testUser.email, "Email mismatch");
  });

  // MODULE 3: BUSINESS MANAGEMENT & ONBOARDING
  console.log("\n\x1b[36m▶ MODULE 3: Business Management & Onboarding (/api/business)\x1b[0m");
  await runTest("GET  /api/business/onboarding/status (Onboarding Status)", async () => {
    const res = await client.get("/api/business/onboarding/status", { headers: getHeaders(false) });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await runTest("POST /api/business/onboarding/step (Save Wizard Step 1)", async () => {
    const res = await client.post(
      "/api/business/onboarding/step",
      {
        step: 1,
        data: {
          businessName: `Test Supermart ${uniqueSuffix}`,
          retailSegment: "Retail/Kirana",
          businessType: "Retail",
        },
      },
      { headers: getHeaders(false) }
    );
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await runTest("POST /api/business/onboarding/step (Save Wizard Step 2)", async () => {
    const res = await client.post(
      "/api/business/onboarding/step",
      {
        step: 2,
        data: {
          addressLine: "Shop 12, Retail Mall",
          city: "Jaipur",
          state: "Rajasthan",
          pincode: "302001",
          businessPhone: testUser.phone,
        },
      },
      { headers: getHeaders(false) }
    );
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await runTest("POST /api/business/onboarding/step (Step 3 Finalize Business)", async () => {
    const res = await client.post(
      "/api/business/onboarding/step",
      {
        step: 3,
        data: {
          currency: "INR",
          taxMode: "GST",
          inventoryTracking: true,
          operatingHours: {
            open: "09:00 AM",
            close: "10:00 PM",
          },
        },
        isFinalStep: true,
      },
      { headers: getHeaders(false) }
    );
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    businessId = res.data.data.business._id;
    assert(businessId, "Business ID was not provisioned");
  });

  await runTest("GET  /api/business/active/context (Active Store Context)", async () => {
    const res = await client.get("/api/business/active/context", { headers: getHeaders() });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.data.businessId === businessId, "Context businessId mismatch");
  });

  await runTest("GET  /api/business/me (Get My Businesses)", async () => {
    const res = await client.get("/api/business/me", { headers: getHeaders(false) });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.data.data) && res.data.data.length > 0, "No business array returned");
  });

  await runTest("GET  /api/business/:id (Get Business By ID)", async () => {
    const res = await client.get(`/api/business/${businessId}`, { headers: getHeaders() });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await runTest("PUT  /api/business/:id (Update Business)", async () => {
    const res = await client.put(
      `/api/business/${businessId}`,
      { businessName: `Updated Supermart ${uniqueSuffix}` },
      { headers: getHeaders() }
    );
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  // MODULE 4: CATEGORY MANAGEMENT
  console.log("\n\x1b[36m▶ MODULE 4: Category Management (/api/categories)\x1b[0m");
  await runTest("POST /api/categories (Create Category)", async () => {
    const res = await client.post(
      "/api/categories",
      {
        name: `Dairy & Milk ${uniqueSuffix}`,
        description: "Fresh milk, paneer, and butter products",
      },
      { headers: getHeaders() }
    );
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    categoryId = res.data.data._id;
    assert(categoryId, "Category ID missing");
  });

  await runTest("GET  /api/categories (List Categories)", async () => {
    const res = await client.get("/api/categories", { headers: getHeaders() });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.data.length > 0, "Categories empty");
  });

  await runTest("GET  /api/categories/:id (Get Category By ID)", async () => {
    const res = await client.get(`/api/categories/${categoryId}`, { headers: getHeaders() });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await runTest("PUT  /api/categories/:id (Update Category)", async () => {
    const res = await client.put(
      `/api/categories/${categoryId}`,
      { description: "Updated fresh dairy items" },
      { headers: getHeaders() }
    );
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  // MODULE 5: PRODUCTS & BARCODE LOOKUP
  console.log("\n\x1b[36m▶ MODULE 5: Product Catalog & Barcode Lookup (/api/products)\x1b[0m");
  sku = `MILK-TEST-${uniqueSuffix}`;
  barcode = `890126${uniqueSuffix}`;

  await runTest("POST /api/products (Create Product + Auto-Inventory)", async () => {
    const res = await client.post(
      "/api/products",
      {
        name: `Amul Milk ${uniqueSuffix}`,
        sku,
        barcode,
        categoryId,
        sellingPrice: 30.0,
        costPrice: 26.0,
        unit: "packet",
        openingStock: 50,
        reorderLevel: 10,
      },
      { headers: getHeaders() }
    );
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    productId = res.data.data._id;
    assert(productId, "Product ID missing");
  });

  await runTest("GET  /api/products (List Paginated Products)", async () => {
    const res = await client.get("/api/products?page=1&limit=10", { headers: getHeaders() });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.data.length > 0, "Products empty");
  });

  await runTest("GET  /api/products/search (Search Products)", async () => {
    const res = await client.get(`/api/products/search?q=Amul`, { headers: getHeaders() });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await runTest("GET  /api/products/barcode/:barcode (Barcode Scan Lookup)", async () => {
    const res = await client.get(`/api/products/barcode/${barcode}`, { headers: getHeaders() });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.data.sku === sku, "Barcode SKU mismatch");
  });

  await runTest("GET  /api/products/:id (Get Product By ID)", async () => {
    const res = await client.get(`/api/products/${productId}`, { headers: getHeaders() });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await runTest("PUT  /api/products/:id (Update Product Price)", async () => {
    const res = await client.put(
      `/api/products/${productId}`,
      { sellingPrice: 32.0 },
      { headers: getHeaders() }
    );
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  // MODULE 6: INVENTORY & LEDGER ENGINE
  console.log("\n\x1b[36m▶ MODULE 6: Inventory & Ledger Engine (/api/inventory)\x1b[0m");
  await runTest("GET  /api/inventory/summary (Inventory KPI Summary)", async () => {
    const res = await client.get("/api/inventory/summary", { headers: getHeaders() });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await runTest("GET  /api/inventory/store-state (Store State Inventory)", async () => {
    const res = await client.get("/api/inventory/store-state", { headers: getHeaders() });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.data.length > 0, "Store state empty");
  });

  await runTest("GET  /api/inventory/product/:productId (Product Inventory)", async () => {
    const res = await client.get(`/api/inventory/product/${productId}`, { headers: getHeaders() });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await runTest("PUT  /api/inventory/product/:productId/reorder-level", async () => {
    const res = await client.put(
      `/api/inventory/product/${productId}/reorder-level`,
      { reorderLevel: 15 },
      { headers: getHeaders() }
    );
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await runTest("POST /api/inventory/stock-in (Stock In Procurement)", async () => {
    const res = await client.post(
      "/api/inventory/stock-in",
      {
        productId,
        quantity: 20,
        source: "PURCHASE",
        supplierName: "Amul Dairy Distro",
        unitCost: 26.0,
        referenceNumber: `PO-${uniqueSuffix}`,
        reason: "Test restock",
      },
      { headers: getHeaders() }
    );
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const currentStock = res.data.data?.inventory?.availableStock ?? res.data.data?.ledgerEntry?.balanceAfter;
    assert(currentStock === 70, `Expected 70 stock, got ${currentStock}`);
  });

  await runTest("POST /api/inventory/stock-out (Stock Out / Waste)", async () => {
    const res = await client.post(
      "/api/inventory/stock-out",
      {
        productId,
        quantity: 5,
        source: "DAMAGE",
        reason: "Damaged pouch",
        referenceNumber: `DMG-${uniqueSuffix}`,
      },
      { headers: getHeaders() }
    );
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const currentStock = res.data.data?.inventory?.availableStock ?? res.data.data?.ledgerEntry?.balanceAfter;
    assert(currentStock === 65, `Expected 65 stock, got ${currentStock}`);
  });

  await runTest("POST /api/inventory/adjust (Reconcile Stock)", async () => {
    const res = await client.post(
      "/api/inventory/adjust",
      {
        productId,
        physicalCount: 64,
        reason: "Audit reconciliation",
        referenceNumber: `AUD-${uniqueSuffix}`,
      },
      { headers: getHeaders() }
    );
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await runTest("GET  /api/inventory/ledger (Inventory Audit Ledger)", async () => {
    const res = await client.get("/api/inventory/ledger", { headers: getHeaders() });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.data.length > 0, "Ledger logs empty");
  });

  // MODULE 9 (PREREQUISITE FOR SALE): CUSTOMER MANAGEMENT
  console.log("\n\x1b[36m▶ MODULE 9: Customer Profiles & Khata Ledger (/api/customers)\x1b[0m");
  customerPhone = `+9197${Math.floor(10000000 + Math.random() * 90000000)}`;
  await runTest("POST /api/customers (Create Customer Master)", async () => {
    const res = await client.post(
      "/api/customers",
      {
        name: `Rahul Sharma ${uniqueSuffix}`,
        phone: customerPhone,
        email: `rahul.${uniqueSuffix}@example.com`,
        address: "House 45, Civil Lines",
        city: "Jaipur",
        state: "Rajasthan",
        pincode: "302001",
        creditLimit: 10000,
        notes: "Automated test customer",
        tags: ["VIP", "REGULAR"],
      },
      { headers: getHeaders() }
    );
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    customerId = res.data.data._id;
    assert(customerId, "Customer ID missing");
  });

  await runTest("GET  /api/customers (List Customers)", async () => {
    const res = await client.get("/api/customers", { headers: getHeaders() });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await runTest("GET  /api/customers/search (Search Customers)", async () => {
    const res = await client.get(`/api/customers/search?q=Rahul`, { headers: getHeaders() });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await runTest("GET  /api/customers/phone/:phone (Lookup Customer By Phone)", async () => {
    const res = await client.get(`/api/customers/phone/${customerPhone}`, { headers: getHeaders() });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await runTest("GET  /api/customers/:id (Get Customer Details)", async () => {
    const res = await client.get(`/api/customers/${customerId}`, { headers: getHeaders() });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  // MODULE 7: SALES & POS CHECKOUT TRANSACTIONS
  console.log("\n\x1b[36m▶ MODULE 7: Sales Transactions & Invoicing (/api/sales)\x1b[0m");
  await runTest("GET  /api/sales/next-invoice-number (Next Invoice Sequence)", async () => {
    const res = await client.get("/api/sales/next-invoice-number", { headers: getHeaders() });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await runTest("POST /api/sales (Create POS Sale Checkout Transaction)", async () => {
    const res = await client.post(
      "/api/sales",
      {
        customerId,
        customerName: `Rahul Sharma ${uniqueSuffix}`,
        customerPhone,
        items: [
          {
            productId,
            name: `Amul Milk ${uniqueSuffix}`,
            sku,
            quantity: 2,
            unit: "packet",
            soldPrice: 32.0,
            costPrice: 26.0,
            discount: 0,
          },
        ],
        subtotal: 64.0,
        discount: 4.0,
        tax: 0.0,
        total: 60.0,
        paidAmount: 20.0,
        dueAmount: 40.0,
        paymentStatus: "PARTIAL",
        paymentMode: "CASH",
        notes: "Automated POS checkout test",
      },
      { headers: getHeaders() }
    );
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    invoiceId = res.data.data._id;
    assert(invoiceId, "Invoice ID missing");
  });

  await runTest("GET  /api/sales (List Sales Invoices)", async () => {
    const res = await client.get("/api/sales", { headers: getHeaders() });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.data.length > 0, "Sales invoices empty");
  });

  await runTest("GET  /api/sales/:id (Get Invoice Details)", async () => {
    const res = await client.get(`/api/sales/${invoiceId}`, { headers: getHeaders() });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await runTest("GET  /api/sales/analytics/gross-profit (Profit Analytics)", async () => {
    const res = await client.get("/api/sales/analytics/gross-profit", { headers: getHeaders() });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  // MODULE 8: PAYMENT RECORDING
  console.log("\n\x1b[36m▶ MODULE 8: Payment Recording & Settlements (/api/payments)\x1b[0m");
  await runTest("POST /api/payments (Record Tranche Payment against Invoice)", async () => {
    const res = await client.post(
      "/api/payments",
      {
        invoiceId,
        customerId,
        amount: 40.0,
        method: "UPI",
        referenceId: `UPI-${uniqueSuffix}`,
        notes: "Settling balance due",
      },
      { headers: getHeaders() }
    );
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    assert(res.data.data.invoice.dueAmount === 0, "Invoice dueAmount should be 0");
  });

  await runTest("GET  /api/payments/invoice/:invoiceId (Get Payments for Invoice)", async () => {
    const res = await client.get(`/api/payments/invoice/${invoiceId}`, { headers: getHeaders() });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.count > 0, "Payments empty for invoice");
  });

  // MODULE 9 (CONTINUED): KHATA & UDHAAR SETTLEMENTS
  console.log("\n\x1b[36m▶ MODULE 9: Customer Khata & Udhaar Settlements\x1b[0m");
  await runTest("POST /api/customers/:id/ledger (Append Opening Balance Entry)", async () => {
    const res = await client.post(
      `/api/customers/${customerId}/ledger`,
      {
        creditAmount: 500.0,
        debitAmount: 0.0,
        entryType: "SALE_CREDIT",
        notes: "Opening credit migration",
      },
      { headers: getHeaders() }
    );
    assert(res.status === 201, `Expected 201, got ${res.status}`);
  });

  await runTest("POST /api/customers/:id/settle (Settle Customer Debt Repayment)", async () => {
    const res = await client.post(
      `/api/customers/${customerId}/settle`,
      {
        amount: 200.0,
        paymentMethod: "CASH",
        notes: "Counter cash repayment",
      },
      { headers: getHeaders() }
    );
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await runTest("GET  /api/customers/:id/ledger (Customer Ledger Statement)", async () => {
    const res = await client.get(`/api/customers/${customerId}/ledger`, { headers: getHeaders() });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.data.entries.length > 0, "Customer entries empty");
  });

  await runTest("GET  /api/customers/:id/outstanding (Real-time Debt Balance)", async () => {
    const res = await client.get(`/api/customers/${customerId}/outstanding`, { headers: getHeaders() });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await runTest("GET  /api/customers/outstanding/totals (Store-wide Debt Totals)", async () => {
    const res = await client.get(`/api/customers/outstanding/totals`, { headers: getHeaders() });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await runTest("GET  /api/customers/:id/crm-summary (360° CRM Profiling Summary)", async () => {
    const res = await client.get(`/api/customers/${customerId}/crm-summary`, { headers: getHeaders() });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  // MODULE 10: SUPPLIER MANAGEMENT
  console.log("\n\x1b[36m▶ MODULE 10: Supplier Management (/api/suppliers)\x1b[0m");
  await runTest("POST /api/suppliers (Create Supplier)", async () => {
    const res = await client.post(
      "/api/suppliers",
      {
        company: `Amul Wholesalers ${uniqueSuffix}`,
        contactName: "Amit Sharma",
        phone: `+9196${Math.floor(10000000 + Math.random() * 90000000)}`,
        email: `amit.${uniqueSuffix}@amuldistro.com`,
        address: "Plot 18, Industrial Estate",
        city: "Jaipur",
        state: "Rajasthan",
        pincode: "302013",
        gstin: "08ABCDE1234F1Z5",
        notes: "Primary dairy vendor",
        tags: ["FMCG", "DAIRY"],
      },
      { headers: getHeaders() }
    );
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    supplierId = res.data.data._id;
    assert(supplierId, "Supplier ID missing");
  });

  await runTest("GET  /api/suppliers (List Suppliers)", async () => {
    const res = await client.get("/api/suppliers", { headers: getHeaders() });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await runTest("GET  /api/suppliers/:id (Get Supplier By ID)", async () => {
    const res = await client.get(`/api/suppliers/${supplierId}`, { headers: getHeaders() });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await runTest("PUT  /api/suppliers/:id (Update Supplier)", async () => {
    const res = await client.put(
      `/api/suppliers/${supplierId}`,
      { notes: "Updated contract terms" },
      { headers: getHeaders() }
    );
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  // CLEANUP / ARCHIVAL TEST (Optional)
  console.log("\n\x1b[36m▶ CLEANUP & RESTORE ACTIONS\x1b[0m");
  await runTest("POST /api/products/:id/archive (Archive Product)", async () => {
    const res = await client.post(`/api/products/${productId}/archive`, {}, { headers: getHeaders() });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await runTest("POST /api/products/:id/restore (Restore Product)", async () => {
    const res = await client.post(`/api/products/${productId}/restore`, {}, { headers: getHeaders() });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  // SUMMARY REPORT
  console.log("\n================================================================================");
  console.log("                           🏁 TEST EXECUTION REPORT                             ");
  console.log("================================================================================");
  console.log(`  Total Endpoints Tested : ${passedCount + failedCount}`);
  console.log(`  Passed                 : \x1b[32m${passedCount} ✅\x1b[0m`);
  console.log(`  Failed                 : \x1b[31m${failedCount} ❌\x1b[0m`);
  console.log(`  Success Rate           : \x1b[32m${((passedCount / (passedCount + failedCount)) * 100).toFixed(1)}%\x1b[0m`);
  console.log("================================================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

startSuite().catch((err) => {
  console.error("Fatal test suite runner error:", err);
  process.exit(1);
});
