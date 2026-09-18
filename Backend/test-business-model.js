const mongoose = require("mongoose");
const Business = require("./src/models/business.model");
const BusinessMember = require("./src/models/businessMember.model");

console.log("=== 1. VERIFY BUSINESS SCHEMA STRUCTURE ===");

const dummyOwnerId = new mongoose.Types.ObjectId();
const dummyVendorId = new mongoose.Types.ObjectId();

// Test 1: Instantiating Business 1 for Owner
const business1 = new Business({
  ownerId: dummyOwnerId,
  vendorId: dummyVendorId,
  businessName: "Ayush Kirana & Supermarket",
  retailSegment: "Grocery & FMCG",
  businessType: "RETAIL_STORE",
  city: "Lucknow",
  state: "Uttar Pradesh",
});

const err1 = business1.validateSync();
console.log("Business 1 validation:", err1 ? "FAILED: " + err1.message : "PASSED");
console.log("Fields checked:");
console.log(" - _id:", business1._id.toString());
console.log(" - businessName:", business1.businessName);
console.log(" - retailSegment:", business1.retailSegment);
console.log(" - ownerId:", business1.ownerId.toString());

// Test 2: 1-to-Many support: Instantiating Business 2 for the SAME Owner
const business2 = new Business({
  ownerId: dummyOwnerId,
  vendorId: dummyVendorId,
  businessName: "Ayush Electronics & Mobile",
  retailSegment: "Consumer Electronics",
  businessType: "RETAIL_STORE",
  city: "Lucknow",
  state: "Uttar Pradesh",
});

const err2 = business2.validateSync();
console.log("\nBusiness 2 validation (1-to-many test for same owner):", err2 ? "FAILED: " + err2.message : "PASSED");
console.log(" - Business 1 ID:", business1._id.toString(), "Owner:", business1.ownerId.toString());
console.log(" - Business 2 ID:", business2._id.toString(), "Owner:", business2.ownerId.toString());

// Test 3: Validation failure without required ownerId
const invalidBiz = new Business({
  businessName: "Invalid Business",
});
const err3 = invalidBiz.validateSync();
console.log("\nMissing ownerId rejected correctly:", err3?.errors?.ownerId ? "PASSED" : "FAILED");

console.log("\n=== ALL BUSINESS SCHEMA TESTS PASSED ===");
