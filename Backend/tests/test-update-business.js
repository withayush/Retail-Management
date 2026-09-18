const mongoose = require("mongoose");
const { updateBusinessSchema } = require("../src/validations/business.validation");
const businessService = require("../src/services/business.service");

console.log("================================================================================");
console.log("           PHASE 1 - TASK T4: UPDATE BUSINESS API ENDPOINT UNIT TEST            ");
console.log("================================================================================");

// Test 1: Validate Operating Hours & Profile Settings Schema
const updatePayload = {
  description: "Premier 24/7 Supermarket for groceries, dairy, and household essentials",
  addressLine: "Shop No. 12, Commercial Plaza, Gomti Nagar",
  city: "Lucknow",
  state: "Uttar Pradesh",
  pincode: "226010",
  currency: "INR",
  taxMode: "GST",
  inventoryTracking: true,
  operatingHours: {
    open: "08:00 AM",
    close: "11:00 PM",
    days: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
    notes: "Home delivery available between 9 AM to 9 PM",
  },
  status: "ACTIVE",
};

const validationRes = updateBusinessSchema.safeParse(updatePayload);
console.log("\n[Test 1] Operating Hours & Address Update Payload Validation:");
console.log(" - Parse Status        :", validationRes.success ? "PASSED" : "FAILED");
if (validationRes.success) {
  console.log(" - Open Time           :", validationRes.data.operatingHours?.open);
  console.log(" - Close Time          :", validationRes.data.operatingHours?.close);
  console.log(" - Updated Address     :", validationRes.data.addressLine, validationRes.data.city);
}

// Test 2: Invalid Business ID Rejection
async function testServiceSecurity() {
  console.log("\n[Test 2] Invalid Business ID Format Validation:");
  try {
    await businessService.updateBusiness({
      businessId: "invalid-id-xyz",
      accountId: new mongoose.Types.ObjectId().toString(),
      updatePayload: { city: "Lucknow" },
    });
    console.log(" - Result: FAILED (Should have thrown 400)");
  } catch (err) {
    console.log(" - Result: PASSED (Rejected cleanly with code:", err.code, "| Status:", err.statusCode, ")");
  }

  console.log("\n================================================================================");
  console.log("                  UPDATE BUSINESS API UNIT TEST COMPLETED                       ");
  console.log("================================================================================");
}

testServiceSecurity();
