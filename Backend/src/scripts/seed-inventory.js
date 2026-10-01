require("dotenv").config();
const { login, getErrorMessage } = require("./common/client");
const { categoryStockDefaults, auditAdjustments } = require("./data/inventory");

async function seedInventory() {
  console.log("========================================");
  console.log("VendorOS Inventory & Stock Levels Seeder");
  console.log("========================================");

  try {
    console.log("\n[1/5] Authenticating with VendorOS...");
    const { client } = await login();
    console.log("✓ Logged in successfully.");

    console.log("\n[2/5] Fetching business products...");
    const productsRes = await client.get("/api/products", {
      params: { limit: 200 },
    });
    const products = productsRes.data?.data || productsRes.data?.products || [];
    console.log(`Fetched ${products.length} products to initialize inventory.`);

    if (products.length === 0) {
      console.log("No products found! Please run seed-products.js first.");
      return;
    }

    console.log("\n[3/5] Setting opening stock & reorder levels for each product...");
    let initialized = 0;
    let alreadyStocked = 0;
    let failed = 0;
    const skuProductMap = new Map();

    for (const product of products) {
      const productId = product.id || product._id;
      if (!productId) continue;
      skuProductMap.set(product.sku, { ...product, _id: productId, id: productId });

      const catName = (product.category?.name || product.categoryId?.name || "").toLowerCase().trim();
      const config = categoryStockDefaults[catName] || { openingStock: 50, reorderLevel: 10 };

      try {
        // Check current product inventory
        let currentStock = 0;
        try {
          const invRes = await client.get(`/api/inventory/product/${productId}`);
          currentStock = invRes.data?.data?.availableStock ?? invRes.data?.availableStock ?? invRes.data?.data?.currentStock ?? 0;
        } catch {
          currentStock = 0;
        }

        if (currentStock > 0) {
          alreadyStocked++;
        } else {
          // Attempt opening stock initialization
          try {
            await client.post("/api/inventory/opening-stock", {
              productId,
              openingStock: config.openingStock,
              reorderLevel: config.reorderLevel,
              notes: "Initial inventory setup for retail operation",
            });
            initialized++;
            console.log(`✓ Initialized: ${product.name} (Qty: ${config.openingStock}, Reorder: ${config.reorderLevel})`);
          } catch (initErr) {
            // If opening stock already initialized, top up via stock-in
            if (initErr.response?.data?.message?.includes("already initialized")) {
              await client.post("/api/inventory/stock-in", {
                productId,
                quantity: config.openingStock,
                source: "PURCHASE",
                unitCost: product.costPrice || 20,
                notes: "Replenishment batch receipt",
              });
              initialized++;
              console.log(`✓ Stocked In: ${product.name} (Qty: +${config.openingStock})`);
            } else {
              throw initErr;
            }
          }
        }
      } catch (err) {
        failed++;
        console.log(`✗ Stocking error for ${product.name}: ${getErrorMessage(err)}`);
      }
    }

    console.log(`\nStocking Summary: ${initialized} newly stocked, ${alreadyStocked} already healthy, ${failed} failed.`);

    console.log("\n[4/5] Simulating inventory physical audit adjustments...");
    for (const adj of auditAdjustments) {
      const matchedProduct = skuProductMap.get(adj.skuMatch);
      if (matchedProduct) {
        try {
          const currentRes = await client.get(`/api/inventory/product/${matchedProduct._id}`);
          const currentStock = currentRes.data?.data?.currentStock || 50;
          const newStock = Math.max(0, currentStock + adj.adjustmentQty);

          await client.post("/api/inventory/adjust", {
            productId: matchedProduct._id,
            newStock,
            source: adj.source,
            reason: adj.reason,
            notes: `Audit adjustment test: ${adj.source}`,
          });
          console.log(`✓ Adjusted ${matchedProduct.name}: ${currentStock} -> ${newStock} (${adj.source})`);
        } catch (adjErr) {
          console.log(`! Audit adjustment note: ${getErrorMessage(adjErr)}`);
        }
      }
    }

    console.log("\n[5/5] Synchronizing deterministic low-stock reorder alerts...");
    try {
      const syncRes = await client.post("/api/inventory/alerts/sync");
      console.log("✓ Alerts sync complete:", syncRes.data?.message || "Synced");
    } catch (syncErr) {
      console.log("! Alert sync:", getErrorMessage(syncErr));
    }

    // Print final inventory state
    const summaryRes = await client.get("/api/inventory/summary");
    console.log("\nStore Inventory Snapshot:", JSON.stringify(summaryRes.data?.data || summaryRes.data, null, 2));

    console.log("\n========================================");
    console.log("Inventory Seeding Completed");
    console.log("========================================");
  } catch (error) {
    console.error("\nINVENTORY SEEDING FAILED:", getErrorMessage(error));
    process.exit(1);
  }
}

if (require.main === module) {
  seedInventory();
}

module.exports = seedInventory;
