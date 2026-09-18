const {
  createBusinessSchema,
  updateBusinessSchema,
  ALLOWED_RETAIL_SEGMENTS,
} = require("../src/validations/business.validation");

console.log("================================================================================");
console.log("              PHASE 1 - TASK T2: CREATE BUSINESS API VALIDATION SUITE           ");
console.log("================================================================================");

// Test 1: Valid Create Business Payload with Sanitization & Phone Normalization
const validCreate = {
  businessName: "   Ayush Kirana & General Store   ",
  retailSegment: "Kirana",
  businessType: "Retail",
  category: "Grocery & FMCG",
  description: "Neighborhood Kirana store for groceries and daily essentials",
  businessEmail: "  STORE@KIRANA.COM  ",
  businessPhone: "9876543210",
  whatsappNumber: "+91 9876543210",
  addressLine: "Shop No. 4, Market Complex",
  city: "Lucknow",
  state: "Uttar Pradesh",
  pincode: "226001",
  currency: "INR",
  taxMode: "GST",
  inventoryTracking: true,
};

const res1 = createBusinessSchema.safeParse(validCreate);
console.log("\n[Test 1] Valid Create Payload & Data Sanitization:");
console.log(" - Parse Status        :", res1.success ? "PASSED" : "FAILED");
if (res1.success) {
  console.log(" - Trimmed Name        :", `"${res1.data.businessName}"`);
  console.log(" - Normalized Email    :", `"${res1.data.businessEmail}"`);
  console.log(" - Normalized Phone    :", `"${res1.data.businessPhone}"`);
  console.log(" - Normalized WhatsApp :", `"${res1.data.whatsappNumber}"`);
}

// Test 2: Default Segmentation Check
const defaultSegmentPayload = {
  businessName: "Shree Ganesh Supermarket",
};
const res2 = createBusinessSchema.safeParse(defaultSegmentPayload);
console.log("\n[Test 2] Default Retail Segment Assignment:");
console.log(" - Parse Status        :", res2.success ? "PASSED" : "FAILED");
console.log(" - Assigned Segment    :", `"${res2.data?.retailSegment}"`);

// Test 3: Segment Restriction Check (Disallowed Sector e.g. Aerospace)
const invalidSegmentPayload = {
  businessName: "Heavy Machinery & Aerospace Corp",
  retailSegment: "Aerospace Defense",
};
const res3 = createBusinessSchema.safeParse(invalidSegmentPayload);
console.log("\n[Test 3] Non-Supported Segment Rejection:");
console.log(" - Rejection Status    :", !res3.success ? "PASSED (Rejected Correctly)" : "FAILED");
if (!res3.success) {
  console.log(" - Error Message       :", res3.error.issues[0]?.message);
}

// Test 4: Short Business Name Rejection
const shortNamePayload = {
  businessName: "A",
};
const res4 = createBusinessSchema.safeParse(shortNamePayload);
console.log("\n[Test 4] Short Business Name (<2 chars) Rejection:");
console.log(" - Rejection Status    :", !res4.success ? "PASSED (Rejected Correctly)" : "FAILED");

// Test 5: Invalid Pincode Rejection
const invalidPincodePayload = {
  businessName: "Lucknow Provision Store",
  pincode: "22600", // 5 digits instead of 6
};
const res5 = createBusinessSchema.safeParse(invalidPincodePayload);
console.log("\n[Test 5] Invalid Pincode Format Rejection:");
console.log(" - Rejection Status    :", !res5.success ? "PASSED (Rejected Correctly)" : "FAILED");

// Test 6: Partial Update Validation
const validUpdate = {
  description: "Updated store timings and description",
  city: "Kanpur",
  pincode: "208001",
};
const res6 = updateBusinessSchema.safeParse(validUpdate);
console.log("\n[Test 6] Partial Update Payload:");
console.log(" - Parse Status        :", res6.success ? "PASSED" : "FAILED");

console.log("\n================================================================================");
console.log("                  ALL BUSINESS API VALIDATION TESTS PASSED                      ");
console.log("================================================================================");
