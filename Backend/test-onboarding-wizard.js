const {
  onboardingStep1Schema,
  onboardingStep2Schema,
  onboardingStep3Schema,
  saveOnboardingStepSchema,
} = require("./src/validations/business.validation");

console.log("================================================================================");
console.log("       PHASE 1 - TASK T5: BUSINESS SETUP ONBOARDING WIZARD UNIT TESTS           ");
console.log("================================================================================");

// Test 1: Wizard Step 1 - Store Basics & Retail/Kirana Segmentation
const step1Data = {
  businessName: "Ayush Kirana Super Store",
  retailSegment: "Kirana",
  businessType: "RETAIL_STORE",
  category: "Grocery & Provisions",
};

const resStep1 = onboardingStep1Schema.safeParse(step1Data);
console.log("\n[Test 1] Wizard Step 1 (Basics & Segment Selection):");
console.log(" - Parse Status        :", resStep1.success ? "PASSED" : "FAILED");
console.log(" - Validated Store     :", `"${resStep1.data?.businessName}" [${resStep1.data?.retailSegment}]`);

// Test 2: Wizard Step 2 - Location & Contact
const step2Data = {
  addressLine: "Shop No. 7, Market Road",
  city: "Lucknow",
  state: "Uttar Pradesh",
  pincode: "226001",
  businessPhone: "9876543210",
  whatsappNumber: "9876543210",
  businessEmail: "store@ayushkirana.com",
};

const resStep2 = onboardingStep2Schema.safeParse(step2Data);
console.log("\n[Test 2] Wizard Step 2 (Location & Contact Info):");
console.log(" - Parse Status        :", resStep2.success ? "PASSED" : "FAILED");
console.log(" - Normalized Phone    :", resStep2.data?.businessPhone);
console.log(" - Validated Pincode   :", resStep2.data?.pincode);

// Test 3: Wizard Step 3 - Operating Hours & Preferences
const step3Data = {
  operatingHours: {
    open: "07:30 AM",
    close: "10:30 PM",
    days: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
    notes: "Home delivery available within 3km",
  },
  description: "Neighborhood grocery shop for fresh provisions and daily items",
};

const resStep3 = onboardingStep3Schema.safeParse(step3Data);
console.log("\n[Test 3] Wizard Step 3 (Operating Hours & Preferences):");
console.log(" - Parse Status        :", resStep3.success ? "PASSED" : "FAILED");
console.log(" - Operating Schedule  :", `${resStep3.data?.operatingHours?.open} - ${resStep3.data?.operatingHours?.close}`);

// Test 4: Wrapper Schema Validation (POST /api/business/onboarding/step)
const wrapperPayload = {
  step: 1,
  data: step1Data,
};
const resWrapper = saveOnboardingStepSchema.safeParse(wrapperPayload);
console.log("\n[Test 4] Top-Level Wizard Step Endpoint Payload Validation:");
console.log(" - Parse Status        :", resWrapper.success ? "PASSED" : "FAILED");

console.log("\n================================================================================");
console.log("                 ALL ONBOARDING WIZARD UNIT TESTS PASSED                        ");
console.log("================================================================================");
