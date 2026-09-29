const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const { PurchaseOrder } = require("../src/models/purchaseOrder.model");
const { PurchaseItem } = require("../src/models/purchaseItem.model");
const { Supplier } = require("../src/models/supplier.model");
const Business = require("../src/models/business.model");
const purchaseOrderService = require("../src/services/purchaseOrder.service");
const supplierRepo = require("../src/repositories/supplier.repository");

async function testCreatePOManualItem() {
  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/venderos";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB.");

  const runId = Date.now().toString().slice(-6);

  try {
    const biz = await Business.create({
      name: `Sharma Kirana Store ${runId}`,
      email: `sharma.${runId}@kirana.com`,
      phone: `+919911${runId.slice(0, 6)}`,
      currency: "INR",
    });

    const supplier = await supplierRepo.createSupplier(biz._id, {
      company: `ABC Distributors (Amit Sharma) ${runId}`,
      contactName: "Amit Sharma",
      phone: `+919922${runId.slice(0, 6)}`,
      email: `abc.${runId}@distrib.com`,
    });

    // Exact payload from screenshot
    const payload = {
      supplierId: supplier._id.toString(),
      orderDate: new Date("2026-09-27").toISOString(),
      expectedDelivery: new Date("2026-09-30").toISOString(),
      status: "PENDING",
      shippingAddress: "gshgjsdhfksd",
      paymentTerms: "Net 30 Days",
      notes: "",
      items: [
        {
          productId: null,
          name: "rice",
          sku: "SKU-002",
          quantity: 1,
          unit: "pcs",
          unitCost: 5540,
        },
      ],
    };

    console.log("Submitting PO creation with manual custom product item...");
    const createdPO = await purchaseOrderService.createPurchaseOrder(
      biz._id,
      payload,
      null,
      "Ayush Sharma"
    );

    console.log(`PO Created successfully! Number: ${createdPO.poNumber}, ID: ${createdPO._id}, Total: ₹${createdPO.costTotal}`);

    // Verify PurchaseItem was also created
    const items = await PurchaseItem.find({ businessId: biz._id, purchaseOrderId: createdPO._id });
    console.log(`Found ${items.length} PurchaseItem records:`);
    items.forEach((item) => {
      console.log(` - Line: ${item.name} (${item.sku}), Qty: ${item.qty}, UnitCost: ₹${item.costPrice}, ProductId: ${item.productId}`);
    });

    if (items.length !== 1 || items[0].name !== "rice" || items[0].totalCost !== 5540) {
      throw new Error("Created PurchaseItem verification failed.");
    }

    console.log("\nALL VERIFICATIONS PASSED!");
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
    process.exit(0);
  }
}

testCreatePOManualItem();
