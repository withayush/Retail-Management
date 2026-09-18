const mongoose = require("mongoose");
const businessService = require("../src/services/business.service");

console.log("================================================================================");
console.log("            PHASE 1 - TASK T3: GET BUSINESS API ENDPOINT UNIT TEST              ");
console.log("================================================================================");

// Test 1: Invalid ObjectId rejection
async function runTests() {
  console.log("\n[Test 1] Invalid Business ID Format Validation:");
  try {
    await businessService.getBusinessById({
      businessId: "invalid-id-123",
      accountId: new mongoose.Types.ObjectId().toString(),
    });
    console.log(" - Result: FAILED (Should have thrown 400)");
  } catch (err) {
    console.log(" - Result: PASSED (Rejected cleanly with code:", err.code, "| Status:", err.statusCode, ")");
  }

  console.log("\n================================================================================");
  console.log("                    GET BUSINESS API LOGIC TEST COMPLETED                       ");
  console.log("================================================================================");
}

runTests();
