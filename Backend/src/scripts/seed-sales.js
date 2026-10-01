require("dotenv").config();
const { login, getErrorMessage } = require("./common/client");
const sampleSalesTemplates = require("./data/sales");

async function seedSales() {
  console.log("========================================");
  console.log("VendorOS POS Sales & Invoices Seeder");
  console.log("========================================");

  try {
    console.log("\n[1/4] Authenticating with VendorOS...");
    const { client } = await login();
    console.log("✓ Logged in successfully.");

    console.log("\n[2/4] Fetching catalog and registered customers...");
    const [productsRes, customersRes] = await Promise.all([
      client.get("/api/products", { params: { limit: 200 } }),
      client.get("/api/customers", { params: { limit: 100 } }),
    ]);

    const productsList = productsRes.data?.data || productsRes.data?.products || [];
    const customersList = customersRes.data?.data || [];

    const skuMap = new Map();
    for (const p of productsList) {
      const pid = p.id || p._id;
      skuMap.set(p.sku, { ...p, _id: pid, id: pid });
    }

    console.log(`Loaded ${productsList.length} products and ${customersList.length} customers.`);

    console.log("\n[3/4] Generating POS Sales transactions and invoices...");
    let salesCreated = 0;
    let failed = 0;

    for (const tmpl of sampleSalesTemplates) {
      // Find customer
      let customerId = null;
      let customerName = tmpl.customerName || "Walk-in Customer";
      let customerPhone = tmpl.customerPhone || "";

      if (tmpl.customerMatch) {
        const found = customersList.find((c) =>
          c.name?.toLowerCase().includes(tmpl.customerMatch.toLowerCase())
        );
        if (found) {
          customerId = found._id || found.id;
          customerName = found.name;
          customerPhone = found.phone || "";
        }
      }

      // Build sale items
      const saleItems = [];
      let subtotal = 0;

      for (const itemTmpl of tmpl.items) {
        const prod = skuMap.get(itemTmpl.sku);
        if (!prod) continue;

        const qty = itemTmpl.quantity || 1;
        const soldPrice = prod.sellingPrice || 50;
        const costPrice = prod.costPrice || 40;
        const totalPrice = soldPrice * qty;
        const grossProfit = (soldPrice - costPrice) * qty;

        subtotal += totalPrice;
        saleItems.push({
          productId: prod._id,
          name: prod.name,
          sku: prod.sku,
          quantity: qty,
          unit: prod.unit || "pcs",
          soldPrice,
          costPrice,
          totalPrice,
          grossProfit,
        });
      }

      if (saleItems.length === 0) {
        console.log(`! Skipping sale: No matching items found for template.`);
        continue;
      }

      const discount = tmpl.discount || 0;
      const total = Math.max(0, subtotal - discount);

      let paidAmount = total;
      if (tmpl.paymentStatus === "PENDING") {
        paidAmount = 0;
      } else if (tmpl.paymentStatus === "PARTIAL") {
        paidAmount = tmpl.partialPaid || Math.floor(total / 2);
      }

      const salePayload = {
        customerId,
        customerName,
        customerPhone,
        subtotal,
        discount,
        tax: 0,
        total,
        paidAmount,
        paymentStatus: tmpl.paymentStatus || "PAID",
        paymentMode: tmpl.paymentMode || "CASH",
        status: "COMPLETED",
        notes: tmpl.notes || "POS register sale",
        items: saleItems,
      };

      try {
        const res = await client.post("/api/sales", salePayload);
        const sale = res.data?.data || res.data;
        const saleId = sale._id || sale.id;
        salesCreated++;
        console.log(`✓ Sale Invoice: ${sale.invoiceNumber || saleId} (${sale.customerName}) - ₹${total} [${sale.paymentMode} - ${sale.paymentStatus}]`);

        // Test recording payment settlement if partial
        if (tmpl.settleRest && saleId) {
          try {
            await client.post(`/api/sales/${saleId}/payments`, {
              amount: tmpl.settleRest,
              paymentMode: "UPI",
              reference: `UPI-SETTLE-${Date.now().toString().slice(-5)}`,
              notes: "Partial payment settlement via UPI",
            });
            console.log(`   + Recorded partial invoice settlement: ₹${tmpl.settleRest} via UPI`);
          } catch (payErr) {
            console.log(`   ! Partial payment settlement note: ${getErrorMessage(payErr)}`);
          }
        }
      } catch (err) {
        failed++;
        console.log(`✗ Sale creation failed for ${customerName}: ${getErrorMessage(err)}`);
      }
    }

    console.log("\n[4/4] Verifying Sales History, Gross Profit & POS Summaries...");
    try {
      const [summaryRes, profitRes] = await Promise.all([
        client.get("/api/sales/summary"),
        client.get("/api/sales/analytics/gross-profit"),
      ]);
      console.log("Sales Summary KPIs:", JSON.stringify(summaryRes.data?.data || summaryRes.data, null, 2));
      console.log("Gross Profit Analytics:", JSON.stringify(profitRes.data?.data || profitRes.data, null, 2));
    } catch (kpiErr) {
      console.log("! Sales analytics note:", getErrorMessage(kpiErr));
    }

    console.log("\n========================================");
    console.log("Sales & POS Invoicing Seeding Completed");
    console.log(`Invoices Created : ${salesCreated}`);
    console.log(`Failed           : ${failed}`);
    console.log("========================================");
  } catch (error) {
    console.error("\nSALES SEEDING FAILED:", getErrorMessage(error));
    process.exit(1);
  }
}

if (require.main === module) {
  seedSales();
}

module.exports = seedSales;
