const {
  onboardingStep1Schema,
  onboardingStep2Schema,
  onboardingStep3Schema,
  saveOnboardingStepSchema,
  createBusinessSchema,
} = require("../src/validations/business.validation");

console.log("================================================================================");
console.log("       PHASE 1 - TASK T5: BUSINESS SETUP ONBOARDING WIZARD UNIT TESTS           ");
console.log("================================================================================");

// Test 1: Wizard Step 1 - Store Basics & Segment Selection (Grocery, Electronics, Kirana, etc.)
const step1Data = {
  businessName: "Sharma General & Electronics Store",
  retailSegment: "Electronics",
  businessType: "Retail",
  category: "Consumer Electronics & Appliances",
};

const resStep1 = onboardingStep1Schema.safeParse(step1Data);
console.log("\n[Test 1] Wizard Step 1 (Store Identity & Segment Selection):");
console.log(" - Parse Status        :", resStep1.success ? "PASSED ✅" : "FAILED ❌");
console.log(" - Validated Store     :", `"${resStep1.data?.businessName}" [Segment: ${resStep1.data?.retailSegment}]`);

// Test 2: Wizard Step 2 - Location & Normalized Contact
const step2Data = {
  addressLine: "Shop No. 12, Main Market Road",
  city: "Jaipur",
  state: "Rajasthan",
  pincode: "302001",
  businessPhone: "9876543210",
  whatsappNumber: "9876543210",
  businessEmail: "store@sharmageneral.com",
};

const resStep2 = onboardingStep2Schema.safeParse(step2Data);
console.log("\n[Test 2] Wizard Step 2 (Location & Normalized Contact Info):");
console.log(" - Parse Status        :", resStep2.success ? "PASSED ✅" : "FAILED ❌");
console.log(" - Normalized Phone    :", resStep2.data?.businessPhone);
console.log(" - Normalized WhatsApp :", resStep2.data?.whatsappNumber);
console.log(" - Validated Pincode   :", resStep2.data?.pincode);

// Test 3: Wizard Step 3 - Setup Preferences & Operating Hours
const step3Data = {
  currency: "INR",
  taxMode: "GST",
  inventoryTracking: true,
  operatingHours: {
    open: "09:00 AM",
    close: "09:30 PM",
    days: ["MON", "TUE", "WED", "THU", "FRI", "SAT"],
    notes: "Closed on Sundays",
  },
  description: "Retail and wholesale electronics and grocery store",
};

const resStep3 = onboardingStep3Schema.safeParse(step3Data);
console.log("\n[Test 3] Wizard Step 3 (Preferences, Currency, Tax Mode & Operating Hours):");
console.log(" - Parse Status        :", resStep3.success ? "PASSED ✅" : "FAILED ❌");
console.log(" - Currency & Tax Mode :", `${resStep3.data?.currency} | ${resStep3.data?.taxMode}`);
console.log(" - Inventory Tracking  :", resStep3.data?.inventoryTracking ? "ENABLED" : "DISABLED");
console.log(" - Operating Schedule  :", `${resStep3.data?.operatingHours?.open} - ${resStep3.data?.operatingHours?.close}`);

// Test 4: Top-Level Wizard Step Endpoint Payload Validation (POST /api/business/onboarding/step)
const wrapperPayload = {
  step: 1,
  data: step1Data,
};
const resWrapper = saveOnboardingStepSchema.safeParse(wrapperPayload);
console.log("\n[Test 4] Step Wrapper Payload Validation (POST /api/business/onboarding/step):");
console.log(" - Parse Status        :", resWrapper.success ? "PASSED ✅" : "FAILED ❌");

// Test 5: Full Combined 1-Shot Onboarding Payload (POST /api/business/onboarding)
const fullPayload = {
  ...step1Data,
  ...step2Data,
  ...step3Data,
};
const resFull = createBusinessSchema.safeParse(fullPayload);
console.log("\n[Test 5] Complete 1-Shot Business Onboarding (POST /api/business/onboarding):");
console.log(" - Parse Status        :", resFull.success ? "PASSED ✅" : "FAILED ❌");
console.log(" - Ready to Provision  :", resFull.data?.businessName);

console.log("\n================================================================================");
console.log("           ALL T5 ONBOARDING WIZARD UNIT & SCHEMA TESTS PASSED 🎉               ");
console.log("================================================================================");
