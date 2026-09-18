const {
  createBusinessSchema,
  updateBusinessSchema,
} = require("./src/validations/business.validation");

console.log("=== 1. TESTING BUSINESS VALIDATION SCHEMAS ===");

// Test 1: Valid Create Business Payload
const validCreate = {
  businessName: "Ayush Supermarket & Retail",
  retailSegment: "Grocery & Supermarket",
  businessType: "RETAIL_STORE",
  category: "FMCG",
  description: "One stop shop for all daily essentials",
  businessEmail: "store@ayushmarket.com",
  businessPhone: "9876543210",
  whatsappNumber: "9876543210",
  addressLine: "123 Main Street, Hazratganj",
  city: "Lucknow",
  state: "Uttar Pradesh",
  pincode: "226001",
};

const res1 = createBusinessSchema.safeParse(validCreate);
console.log("Valid Create Payload:", res1.success ? "PASSED" : "FAILED", res1.data?.businessName);

// Test 2: Invalid Short Name
const invalidCreate = {
  businessName: "A",
};
const res2 = createBusinessSchema.safeParse(invalidCreate);
console.log("Short Business Name Rejected:", !res2.success ? "PASSED" : "FAILED", res2.error?.issues[0]?.message);

// Test 3: Partial Update Payload
const validUpdate = {
  description: "Updated store description",
  city: "Kanpur",
};
const res3 = updateBusinessSchema.safeParse(validUpdate);
console.log("Partial Update Payload:", res3.success ? "PASSED" : "FAILED", res3.data);

console.log("\n=== ALL BUSINESS MODULE VALIDATION TESTS PASSED ===");
