require("dotenv").config();
const { login, getErrorMessage } = require("./common/client");
const customers = require("./data/customers");

async function seedCustomers() {
  console.log("========================================");
  console.log("VendorOS Customer & Khata Seeder");
  console.log("========================================");

  try {
    console.log("\n[1/4] Authenticating with VendorOS...");
    const { client } = await login();
    console.log("✓ Logged in successfully.");

    console.log("\n[2/4] Checking existing customers...");
    const existingRes = await client.get("/api/customers", {
      params: { limit: 100 },
    });
    const existingList = existingRes.data?.data || [];
    const phoneMap = new Map();
    for (const c of existingList) {
      if (c.phone) {
        const cleanPhone = c.phone.replace(/\D/g, "").slice(-10);
        phoneMap.set(cleanPhone, c);
      }
    }
    console.log(`Found ${existingList.length} existing customer records.`);

    console.log("\n[3/4] Seeding customers & credit ledgers...");
    let created = 0;
    let existing = 0;
    let failed = 0;

    for (const cust of customers) {
      let customerId = null;
      const cleanInputPhone = cust.phone?.replace(/\D/g, "").slice(-10);

      if (cleanInputPhone && phoneMap.has(cleanInputPhone)) {
        customerId = phoneMap.get(cleanInputPhone)._id;
        existing++;
        console.log(`- Exists: ${cust.name} (${cust.phone})`);
      } else {
        try {
          const payload = {
            name: cust.name,
            phone: cust.phone,
            email: cust.email,
            address: cust.address,
            city: cust.city,
            state: cust.state,
            pincode: cust.pincode,
            creditLimit: cust.creditLimit || 0,
            notes: cust.notes,
            tags: cust.tags || [],
          };

          const res = await client.post("/api/customers", payload);
          customerId = res.data?.data?._id;
          created++;
          console.log(`✓ Created: ${cust.name} (${cust.phone})`);
        } catch (err) {
          failed++;
          console.log(`✗ Failed: ${cust.name} -> ${getErrorMessage(err)}`);
          continue;
        }
      }

      // If customer has opening credit, record a ledger entry and sample settlement
      if (customerId && cust.openingCredit > 0) {
        try {
          await client.post(`/api/customers/${customerId}/ledger`, {
            entryType: "SALE_CREDIT",
            debitAmount: cust.openingCredit,
            creditAmount: 0,
            notes: "Previous month grocery balance",
          });
          console.log(`   + Added Khata debit: ₹${cust.openingCredit}`);

          // Sample partial settlement for testing /pay endpoint
          if (cust.openingCredit > 500) {
            await client.post(`/api/customers/${customerId}/pay`, {
              amount: 500,
              method: "UPI",
              referenceId: `UPI-${Date.now().toString().slice(-6)}`,
              notes: "Partial payment settlement via GPay",
            });
            console.log(`   + Settled partial payment: ₹500 via UPI`);
          }
        } catch (ledgerErr) {
          console.log(`   ! Ledger update note: ${getErrorMessage(ledgerErr)}`);
        }
      }
    }

    console.log("\n[4/4] Verifying Customer Summary & Outstanding Debt...");
    const summaryRes = await client.get("/api/customers/outstanding/summary");
    const summaryData = summaryRes.data?.data || summaryRes.data;
    console.log("Customer Overview Stats:", JSON.stringify(summaryData, null, 2));

    console.log("\n========================================");
    console.log("Customer Seeding Completed");
    console.log(`Created  : ${created}`);
    console.log(`Existing : ${existing}`);
    console.log(`Failed   : ${failed}`);
    console.log(`Total    : ${customers.length}`);
    console.log("========================================");
  } catch (error) {
    console.error("\nCUSTOMER SEEDING FAILED:", getErrorMessage(error));
    process.exit(1);
  }
}

if (require.main === module) {
  seedCustomers();
}

module.exports = seedCustomers;
