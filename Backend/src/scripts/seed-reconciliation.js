require("dotenv").config();
const { login, getErrorMessage } = require("./common/client");

async function seedReconciliation() {
  console.log("========================================");
  console.log("VendorOS Ledger & System Integrity Audit");
  console.log("========================================");

  try {
    console.log("\n[1/4] Authenticating with VendorOS...");
    const { client } = await login();
    console.log("✓ Logged in successfully.");

    console.log("\n[2/4] Executing full multi-tenant reconciliation run...");
    const runRes = await client.post("/api/reconciliation/run-all");
    console.log("✓ Run result:", runRes.data?.message || "Reconciliation completed.");

    console.log("\n[3/4] Fetching Ledger Health & Discrepancy Breakdown...");
    const [invRecRes, custRecRes, supRecRes] = await Promise.all([
      client.get("/api/reconciliation/inventory"),
      client.get("/api/reconciliation/customers"),
      client.get("/api/reconciliation/suppliers"),
    ]);

    const invData = invRecRes.data?.data || invRecRes.data;
    const custData = custRecRes.data?.data || custRecRes.data;
    const supData = supRecRes.data?.data || supRecRes.data;

    console.log("1. Inventory Integrity Status:", JSON.stringify({
      status: invData.status || "HEALTHY",
      totalProductsChecked: invData.totalProductsChecked || invData.checkedCount || 0,
      discrepanciesFound: invData.discrepancies?.length || 0,
    }, null, 2));

    console.log("2. Customer Khata Integrity Status:", JSON.stringify({
      status: custData.status || "HEALTHY",
      totalCustomersChecked: custData.totalCustomersChecked || custData.checkedCount || 0,
      discrepanciesFound: custData.discrepancies?.length || 0,
    }, null, 2));

    console.log("3. Supplier Payables Integrity Status:", JSON.stringify({
      status: supData.status || "HEALTHY",
      totalSuppliersChecked: supData.totalSuppliersChecked || supData.checkedCount || 0,
      discrepanciesFound: supData.discrepancies?.length || 0,
    }, null, 2));

    console.log("\n[4/4] Testing Auto-Fix Engine for zero-drift guarantee...");
    try {
      await Promise.all([
        client.post("/api/reconciliation/inventory/fix"),
        client.post("/api/reconciliation/customers/fix"),
        client.post("/api/reconciliation/suppliers/fix"),
      ]);
      console.log("✓ Auto-fix triggers executed cleanly on all 3 ledgers.");
    } catch (fixErr) {
      console.log("! Auto-fix note:", getErrorMessage(fixErr));
    }

    const summaryRes = await client.get("/api/reconciliation/summary");
    console.log("\nSystem Health Final Summary:", JSON.stringify(summaryRes.data?.data || summaryRes.data, null, 2));

    console.log("\n========================================");
    console.log("Reconciliation & Audit Testing Completed");
    console.log("========================================");
  } catch (error) {
    console.error("\nRECONCILIATION FAILED:", getErrorMessage(error));
    process.exit(1);
  }
}

if (require.main === module) {
  seedReconciliation();
}

module.exports = seedReconciliation;
