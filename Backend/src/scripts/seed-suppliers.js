require("dotenv").config();
const { login, getErrorMessage } = require("./common/client");
const suppliers = require("./data/suppliers");

async function seedSuppliers() {
  console.log("========================================");
  console.log("VendorOS Supplier & Payables Seeder");
  console.log("========================================");

  try {
    console.log("\n[1/4] Authenticating with VendorOS...");
    const { client } = await login();
    console.log("✓ Logged in successfully.");

    console.log("\n[2/4] Checking existing suppliers...");
    const existingRes = await client.get("/api/suppliers", {
      params: { limit: 100 },
    });
    const existingList = existingRes.data?.data || [];
    const supplierMap = new Map();
    for (const s of existingList) {
      if (s.company) {
        supplierMap.set(s.company.trim().toLowerCase(), s);
      }
      if (s.phone) {
        const clean = s.phone.replace(/\D/g, "").slice(-10);
        if (clean) supplierMap.set(clean, s);
      }
    }
    console.log(`Found ${existingList.length} existing supplier records.`);

    console.log("\n[3/4] Seeding suppliers & payables ledgers...");
    let created = 0;
    let existing = 0;
    let failed = 0;

    for (const sup of suppliers) {
      let supplierId = null;
      const compKey = sup.company.trim().toLowerCase();
      const phoneKey = sup.phone ? sup.phone.replace(/\D/g, "").slice(-10) : "";

      if (supplierMap.has(compKey) || (phoneKey && supplierMap.has(phoneKey))) {
        const found = supplierMap.get(compKey) || supplierMap.get(phoneKey);
        supplierId = found._id;
        existing++;
        console.log(`- Exists: ${sup.company} (${sup.contactName})`);
      } else {
        try {
          const payload = {
            company: sup.company,
            contactName: sup.contactName || "",
            phone: sup.phone || "",
            email: sup.email || "",
            address: sup.address || "",
            city: sup.city || "",
            state: sup.state || "",
            pincode: sup.pincode || "",
            gstin: sup.gstin || "",
            notes: sup.notes || "",
            tags: sup.tags || [],
            status: "ACTIVE",
          };

          const res = await client.post("/api/suppliers", payload);
          supplierId = res.data?.data?._id;
          created++;
          console.log(`✓ Created: ${sup.company} (${sup.contactName})`);
        } catch (err) {
          failed++;
          console.log(`✗ Failed: ${sup.company} -> ${getErrorMessage(err)}`);
          continue;
        }
      }

      // Record sample purchase credit and partial settlement for Accounts Payable testing
      if (supplierId && sup.openingCredit > 0) {
        try {
          await client.post(`/api/suppliers/${supplierId}/purchases/credit`, {
            amount: sup.openingCredit,
            invoiceNumber: `BILL-${Date.now().toString().slice(-5)}`,
            notes: "Goods consignment opening stock on credit",
          });
          console.log(`   + Added Accounts Payable Credit: ₹${sup.openingCredit}`);

          const settleAmount = Math.min(2500, Math.floor(sup.openingCredit / 3));
          if (settleAmount > 0) {
            await client.post(`/api/suppliers/${supplierId}/settle`, {
              amount: settleAmount,
              method: "NEFT",
              referenceId: `TXN-NEFT-${Date.now().toString().slice(-6)}`,
              notes: "Partial payment settlement via NetBanking NEFT",
            });
            console.log(`   + Settled supplier payment: ₹${settleAmount} via NEFT`);
          }
        } catch (payErr) {
          console.log(`   ! Supplier payable note: ${getErrorMessage(payErr)}`);
        }
      }
    }

    console.log("\n[4/4] Verifying Supplier Accounts Payable Summary...");
    const payablesRes = await client.get("/api/suppliers/payables/summary");
    const payablesData = payablesRes.data?.data || payablesRes.data;
    console.log("Supplier Payables Stats:", JSON.stringify(payablesData, null, 2));

    console.log("\n========================================");
    console.log("Supplier Seeding Completed");
    console.log(`Created  : ${created}`);
    console.log(`Existing : ${existing}`);
    console.log(`Failed   : ${failed}`);
    console.log(`Total    : ${suppliers.length}`);
    console.log("========================================");
  } catch (error) {
    console.error("\nSUPPLIER SEEDING FAILED:", getErrorMessage(error));
    process.exit(1);
  }
}

if (require.main === module) {
  seedSuppliers();
}

module.exports = seedSuppliers;
