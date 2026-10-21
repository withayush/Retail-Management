/**
 * Test Advanced Features E2E: Procurement, Expenses, Analytics, & Reconciliation
 */
const axios = require("axios");

const BASE_URL = "http://localhost:3001";
const client = axios.create({
  baseURL: BASE_URL,
  validateStatus: () => true,
  timeout: 10000,
});

let token = null;
let businessId = null;
let supplierId = null;
let productId = null;
let poId = null;
let expenseCategoryId = null;

const uniqueSuffix = Date.now().toString().slice(-6);

const run = async (title, fn) => {
  try {
    await fn();
    console.log(` \x1b[32m✔\x1b[0m ${title}`);
  } catch (err) {
    console.error(` \x1b[31m✖\x1b[0m ${title} - Error: ${err.message}`);
    process.exit(1);
  }
};

const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

const getHeaders = () => ({
  Authorization: `Bearer ${token}`,
  "x-business-id": businessId,
  "Content-Type": "application/json",
});

async function main() {
  console.log("Starting Advanced Features Live API Test Suite...");

  // 1. Register & verify user to get token and business
  const userPayload = {
    fullName: `Advanced Tester ${uniqueSuffix}`,
    email: `adv.${uniqueSuffix}@venderos.test`,
    phone: `+9195${Math.floor(10000000 + Math.random() * 90000000)}`,
    password: "Password@123",
  };

  const regRes = await client.post("/api/auth/register", userPayload);
  assert(regRes.status === 201, `Reg failed: ${regRes.status}`);
  const otp = regRes.data.data?.debugOtp || regRes.data.data?.otp;

  const verifyRes = await client.post("/api/auth/verify-phone", {
    phone: userPayload.phone,
    otp,
  });
  token = verifyRes.data.data?.accessToken;
  assert(token, "No access token");

  // Create Business
  const bizRes = await client.post(
    "/api/business/onboarding/step",
    {
      step: 3,
      data: {
        businessName: `Advanced Supermart ${uniqueSuffix}`,
        retailSegment: "Retail",
        currency: "INR",
        taxMode: "GST",
      },
      isFinalStep: true,
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  businessId = bizRes.data.data?.business?._id;
  assert(businessId, "No businessId created");

  // Create Category & Product
  const catRes = await client.post(
    "/api/categories",
    { name: `Advanced Category ${uniqueSuffix}` },
    { headers: getHeaders() }
  );
  const catId = catRes.data.data._id;

  const prodRes = await client.post(
    "/api/products",
    {
      name: `Pro Product ${uniqueSuffix}`,
      sku: `PROD-${uniqueSuffix}`,
      barcode: `999${uniqueSuffix}`,
      categoryId: catId,
      sellingPrice: 100,
      costPrice: 70,
      openingStock: 20,
    },
    { headers: getHeaders() }
  );
  productId = prodRes.data.data._id;

  // Create Supplier
  const supRes = await client.post(
    "/api/suppliers",
    {
      company: `Advanced Wholesaler ${uniqueSuffix}`,
      contactName: "Rajesh",
      phone: `+9194${Math.floor(10000000 + Math.random() * 90000000)}`,
    },
    { headers: getHeaders() }
  );
  supplierId = supRes.data.data._id;

  // --- MODULE A: PROCUREMENT & PURCHASE ORDERS ---
  console.log("\n▶ PROCUREMENT (Purchase Orders & GRN):");
  await run("POST /api/purchase-orders (Create PO)", async () => {
    const res = await client.post(
      "/api/purchase-orders",
      {
        supplierId,
        expectedDelivery: new Date(Date.now() + 86400000).toISOString(),
        items: [
          {
            productId,
            name: `Pro Product ${uniqueSuffix}`,
            sku: `PROD-${uniqueSuffix}`,
            quantity: 50,
            unitCost: 65,
          },
        ],
        notes: "Restock order",
      },
      { headers: getHeaders() }
    );
    assert(res.status === 201, `Expected 201, got ${res.status}: ${JSON.stringify(res.data)}`);
    poId = res.data.data._id;
    assert(poId, "No PO ID");
  });

  await run("GET /api/purchase-orders (List POs)", async () => {
    const res = await client.get("/api/purchase-orders", { headers: getHeaders() });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.data.length > 0, "No POs found");
  });

  await run("GET /api/purchase-orders/summary (PO Summary)", async () => {
    const res = await client.get("/api/purchase-orders/summary", { headers: getHeaders() });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await run("POST /api/purchases/receive (Receive Stock GRN)", async () => {
    const res = await client.post(
      "/api/purchases/receive",
      {
        purchaseOrderId: poId,
        items: [
          {
            productId,
            name: `Pro Product ${uniqueSuffix}`,
            sku: `PROD-${uniqueSuffix}`,
            receivedQty: 50,
            costPrice: 65,
          },
        ],
        invoiceNumber: `INV-SUP-${uniqueSuffix}`,
        notes: "All 50 units received in good order",
      },
      { headers: getHeaders() }
    );
    assert(res.status === 201, `Expected 201, got ${res.status}: ${JSON.stringify(res.data)}`);
  });

  await run("GET /api/purchases/grn (List GRNs)", async () => {
    const res = await client.get("/api/purchases/grn", { headers: getHeaders() });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await run("GET /api/purchases/grn/summary (GRN Summary)", async () => {
    const res = await client.get("/api/purchases/grn/summary", { headers: getHeaders() });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  // --- MODULE B: EXPENSES & OPEX ---
  console.log("\n▶ EXPENSES & OPEX:");
  await run("POST /api/expense-categories (Create Category)", async () => {
    const res = await client.post(
      "/api/expense-categories",
      {
        categoryName: `Shop Utilities ${uniqueSuffix}`,
        description: "Electricity and water",
      },
      { headers: getHeaders() }
    );
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    expenseCategoryId = res.data.data._id;
  });

  await run("GET /api/expense-categories (List Categories)", async () => {
    const res = await client.get("/api/expense-categories", { headers: getHeaders() });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await run("POST /api/expenses (Record Expense)", async () => {
    const res = await client.post(
      "/api/expenses",
      {
        categoryId: expenseCategoryId,
        amount: 2500,
        expenseDate: new Date().toISOString().split("T")[0],
        paymentMethod: "UPI",
        description: "Monthly Electric Bill",
        payee: "Electricity Board",
      },
      { headers: getHeaders() }
    );
    assert(res.status === 201, `Expected 201, got ${res.status}`);
  });

  await run("GET /api/expenses (List Expenses)", async () => {
    const res = await client.get("/api/expenses", { headers: getHeaders() });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await run("GET /api/expenses/summary (Expense Summary)", async () => {
    const res = await client.get("/api/expenses/summary", { headers: getHeaders() });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await run("GET /api/expenses/monthly-opex (Monthly OpEx)", async () => {
    const res = await client.get("/api/expenses/monthly-opex", { headers: getHeaders() });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  // --- MODULE C: FINANCIAL ANALYTICS (P&L, Net Profit, Payables T58, Receivables) ---
  console.log("\n▶ FINANCIAL ANALYTICS & P&L ENGINE:");
  await run("GET /api/analytics/net-profit (Net Profit Aggregation)", async () => {
    const res = await client.get("/api/analytics/net-profit", { headers: getHeaders() });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await run("GET /api/analytics/operating-expenses (OpEx Analytics)", async () => {
    const res = await client.get("/api/analytics/operating-expenses", { headers: getHeaders() });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await run("GET /api/analytics/receivables (Consolidated Receivables Index)", async () => {
    const res = await client.get("/api/analytics/receivables", { headers: getHeaders() });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await run("GET /api/analytics/payables (Consolidated Payables Index T58)", async () => {
    const res = await client.get("/api/analytics/payables", { headers: getHeaders() });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.success === true, "success flag false");
    assert(typeof (res.data.data?.totalPayables ?? res.data.data?.grossPayables) === "number", "totalPayables must be number");
  });

  await run("GET /api/analytics/payables/summary (Payables Summary T58)", async () => {
    const res = await client.get("/api/analytics/payables/summary", { headers: getHeaders() });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  // --- MODULE D: RECONCILIATION & SYSTEM INTEGRITY ---
  console.log("\n▶ RECONCILIATION ENGINE:");
  await run("GET /api/reconciliation/full (Full Reconciliation Scan)", async () => {
    const res = await client.get("/api/reconciliation/full", { headers: getHeaders() });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = res.data?.data || res.data;
    assert(data.overallStatus, "overallStatus missing");
    assert(typeof data.overallHealthScore === "number", "overallHealthScore must be number");
  });

  await run("GET /api/reconciliation/inventory (Inventory Reconciliation)", async () => {
    const res = await client.get("/api/reconciliation/inventory", { headers: getHeaders() });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = res.data?.data || res.data;
    assert(data.totalProductsChecked !== undefined, "totalProductsChecked missing");
  });

  await run("GET /api/reconciliation/customers (Customer Khata Reconciliation)", async () => {
    const res = await client.get("/api/reconciliation/customers", { headers: getHeaders() });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = res.data?.data || res.data;
    assert(data.totalCustomersChecked !== undefined, "totalCustomersChecked missing");
  });

  await run("GET /api/reconciliation/suppliers (Supplier Payables Reconciliation)", async () => {
    const res = await client.get("/api/reconciliation/suppliers", { headers: getHeaders() });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = res.data?.data || res.data;
    assert(data.totalSuppliersChecked !== undefined, "totalSuppliersChecked missing");
  });

  console.log("\n=======================================================");
  console.log("   ALL ADVANCED FEATURES LIVE API TESTS PASSED! 🎉     ");
  console.log("=======================================================\n");
}

main().catch((e) => {
  console.error("FATAL ERROR:", e);
  process.exit(1);
});
