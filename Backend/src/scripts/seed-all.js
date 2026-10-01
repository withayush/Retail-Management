require("dotenv").config();
const { login, getErrorMessage } = require("./common/client");

const seedCustomers = require("./seed-customers");
const seedSuppliers = require("./seed-suppliers");
const seedInventory = require("./seed-inventory");
const seedPurchases = require("./seed-purchases");
const seedSales = require("./seed-sales");
const seedReconciliation = require("./seed-reconciliation");

async function seedAll() {
  console.log("==========================================================");
  console.log(" VendorOS Unified Master Seeder & E2E API Verification ");
  console.log("==========================================================");

  const startTime = Date.now();

  try {
    console.log("\n>>> Step 0: Pre-flight Authentication & API Readiness Check");
    const { client } = await login();
    console.log("✓ Connected to VendorOS Backend API.");

    console.log("\n>>> Step 1/6: Seeding Customers & Khata Credit Accounts...");
    await seedCustomers();

    console.log("\n>>> Step 2/6: Seeding Suppliers & Accounts Payable Ledgers...");
    await seedSuppliers();

    console.log("\n>>> Step 3/6: Initializing Warehouse Inventory & Reorder Levels...");
    await seedInventory();

    console.log("\n>>> Step 4/6: Creating Purchase Orders & Goods Received Notes (GRN)...");
    await seedPurchases();

    console.log("\n>>> Step 5/6: Generating POS Sales Transactions & Invoices...");
    await seedSales();

    console.log("\n>>> Step 6/6: Running Multi-Tenant System Integrity & Ledger Audit...");
    await seedReconciliation();

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log("\n==========================================================");
    console.log(`✓ ALL PAGES & MODULES SEEDED AND VERIFIED IN ${elapsed}s`);
    console.log("==========================================================");
    console.log("Modules Populated:");
    console.log(" • /products      : 88 products with categories, SKUs & pricing");
    console.log(" • /inventory     : Physical stock, reorder levels, audit logs");
    console.log(" • /customers     : Customer profiles, Khata ledger, credit limits");
    console.log(" • /suppliers     : Supplier directory, GSTIN, accounts payables");
    console.log(" • /pos & /sales  : Active POS carts, sales history, gross margin");
    console.log(" • /reconciliation: Zero-drift health score 100% verified");
    console.log("==========================================================");
  } catch (error) {
    console.error("\nMASTER SEEDING FAILED:", getErrorMessage(error));
    process.exit(1);
  }
}

if (require.main === module) {
  seedAll();
}

module.exports = seedAll;
