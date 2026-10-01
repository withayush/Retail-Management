require("dotenv").config();
const { login, getErrorMessage } = require("./common/client");
const samplePurchaseOrders = require("./data/purchases");

async function seedPurchases() {
  console.log("========================================");
  console.log("VendorOS Purchase Orders & GRN Seeder");
  console.log("========================================");

  try {
    console.log("\n[1/4] Authenticating with VendorOS...");
    const { client } = await login();
    console.log("✓ Logged in successfully.");

    console.log("\n[2/4] Fetching suppliers & products for PO mapping...");
    const [suppliersRes, productsRes] = await Promise.all([
      client.get("/api/suppliers", { params: { limit: 50 } }),
      client.get("/api/products", { params: { limit: 200 } }),
    ]);

    const suppliersList = suppliersRes.data?.data || [];
    const productsList = productsRes.data?.data || productsRes.data?.products || [];

    const skuMap = new Map();
    for (const p of productsList) {
      const pid = p.id || p._id;
      skuMap.set(p.sku, { ...p, _id: pid, id: pid });
    }

    console.log(`Found ${suppliersList.length} suppliers and ${productsList.length} products.`);

    console.log("\n[3/4] Creating Purchase Orders and Receiving Goods (GRN)...");
    let poCreated = 0;
    let grnReceived = 0;
    let failed = 0;

    for (const poConfig of samplePurchaseOrders) {
      // Find matching supplier
      const matchedSupplier = suppliersList.find((s) =>
        s.company?.toLowerCase().includes(poConfig.supplierMatch.toLowerCase())
      );

      if (!matchedSupplier) {
        console.log(`! Skipping PO: Supplier matching "${poConfig.supplierMatch}" not found.`);
        continue;
      }

      // Build valid PO items
      const poItems = [];
      for (const itemConfig of poConfig.items) {
        const prod = skuMap.get(itemConfig.skuMatch);
        if (prod) {
          poItems.push({
            productId: prod._id,
            name: prod.name,
            sku: prod.sku,
            quantity: itemConfig.quantity,
            unitCost: itemConfig.unitCost,
            unit: prod.unit || "pcs",
            notes: "Item ordered from master supplier",
          });
        }
      }

      if (poItems.length === 0) {
        console.log(`! Skipping PO for ${matchedSupplier.company}: No matching items found.`);
        continue;
      }

      try {
        const createPoRes = await client.post("/api/purchase-orders", {
          supplierId: matchedSupplier._id,
          orderDate: new Date().toISOString(),
          paymentTerms: poConfig.paymentTerms,
          shippingAddress: poConfig.shippingAddress,
          notes: poConfig.notes,
          items: poItems,
        });

        const createdPo = createPoRes.data?.data || createPoRes.data;
        const poId = createdPo._id || createdPo.id;
        poCreated++;
        console.log(`✓ PO Created: ${createdPo.poNumber || poId} (${matchedSupplier.company}) - ₹${createdPo.totalAmount || "N/A"}`);

        // Generate Goods Received Note (GRN) to receive stock
        if (poConfig.receiveStock && poId) {
          const grnItems = poItems.map((item) => ({
            productId: item.productId,
            name: item.name,
            sku: item.sku,
            receivedQty: item.quantity,
            costPrice: item.unitCost,
            notes: "Inspected and accepted",
          }));

          const grnRes = await client.post("/api/purchases/receive", {
            purchaseOrderId: poId,
            receivedDate: new Date().toISOString(),
            deliveryChallanNumber: poConfig.receiveStock.deliveryChallanNumber,
            invoiceNumber: poConfig.receiveStock.invoiceNumber,
            notes: poConfig.receiveStock.notes,
            items: grnItems,
          });

          const createdGrn = grnRes.data?.data || grnRes.data;
          grnReceived++;
          console.log(`   + GRN Stock Receipt Generated: ${createdGrn.grnNumber || "GRN Success"} (PO Marked RECEIVED)`);
        }
      } catch (err) {
        failed++;
        console.log(`✗ PO/GRN Failed for ${matchedSupplier.company}: ${getErrorMessage(err)}`);
      }
    }

    console.log("\n[4/4] Verifying PO & GRN Summaries...");
    try {
      const [poSummaryRes, grnSummaryRes] = await Promise.all([
        client.get("/api/purchase-orders/summary"),
        client.get("/api/purchases/summary"),
      ]);
      console.log("PO Summary:", JSON.stringify(poSummaryRes.data?.data || poSummaryRes.data, null, 2));
      console.log("GRN Summary:", JSON.stringify(grnSummaryRes.data?.data || grnSummaryRes.data, null, 2));
    } catch (sumErr) {
      console.log("! Summary note:", getErrorMessage(sumErr));
    }

    console.log("\n========================================");
    console.log("Purchase Orders & GRN Seeding Completed");
    console.log(`POs Created   : ${poCreated}`);
    console.log(`GRNs Received : ${grnReceived}`);
    console.log(`Failed        : ${failed}`);
    console.log("========================================");
  } catch (error) {
    console.error("\nPURCHASE SEEDING FAILED:", getErrorMessage(error));
    process.exit(1);
  }
}

if (require.main === module) {
  seedPurchases();
}

module.exports = seedPurchases;
