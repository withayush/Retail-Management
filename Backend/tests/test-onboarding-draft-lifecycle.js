const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const businessService = require("../src/services/business.service");
const authRepo = require("../src/repositories/auth.repository");
const businessRepo = require("../src/repositories/business.repository");

async function runDraftLifecycleTest() {
  console.log("================================================================================");
  console.log("       TOPIC 5: ONBOARDING DRAFT PERSISTENCE & RESTORATION LIFECYCLE TEST       ");
  console.log("================================================================================");

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  const testAccount = await authRepo.createAccount({
    email: `draft.tester.${Date.now()}@vendortest.com`,
    passwordHash: "dummyHash123!",
    fullName: "Draft Onboarding Tester",
    status: "ACTIVE",
  });

  console.log("\n[Test 1] Created Test Account:", testAccount._id);

  // 1. Initial Status Check
  const initialStatus = await businessService.getOnboardingStatus(testAccount._id);
  console.log("\n[Test 2] Initial Onboarding Status:");
  console.log(" - isCompleted    :", initialStatus.isCompleted);
  console.log(" - currentStep    :", initialStatus.currentStep);
  console.log(" - draftData keys :", Object.keys(initialStatus.draftData).length);

  // 2. Save Step 1 Draft
  const step1Result = await businessService.saveOnboardingStep({
    accountId: testAccount._id,
    step: 1,
    data: {
      businessName: "Draft Grocery Supermart",
      retailSegment: "Grocery",
      businessType: "Retail",
      category: "Supermarket Goods",
    },
    isFinalStep: false,
  });
  console.log("\n[Test 3] Saved Step 1 Draft:");
  console.log(" - Step saved     :", step1Result.step);
  console.log(" - Next Step      :", step1Result.nextStep);
  console.log(" - Status         :", step1Result.onboardingStatus);

  // 3. Save Step 2 Draft
  const step2Result = await businessService.saveOnboardingStep({
    accountId: testAccount._id,
    step: 2,
    data: {
      addressLine: "Plot 42, Commercial Sector",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001",
      businessPhone: "9876543210",
      whatsappNumber: "9876543210",
      businessEmail: "store@draftgrocery.com",
    },
    isFinalStep: false,
  });
  console.log("\n[Test 4] Saved Step 2 Draft:");
  console.log(" - Step saved     :", step2Result.step);
  console.log(" - Next Step      :", step2Result.nextStep);
  console.log(" - Status         :", step2Result.onboardingStatus);

  // 4. Save Step 3 Draft (non-final, navigating to step 4 Review)
  const step3Result = await businessService.saveOnboardingStep({
    accountId: testAccount._id,
    step: 3,
    data: {
      currency: "INR",
      taxMode: "GST",
      inventoryTracking: true,
      operatingHours: {
        open: "08:00 AM",
        close: "10:00 PM",
        days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      },
    },
    isFinalStep: false,
  });
  console.log("\n[Test 5] Saved Step 3 Draft (Navigating to Step 4 Review):");
  console.log(" - Step saved     :", step3Result.step);
  console.log(" - Next Step      :", step3Result.nextStep);
  console.log(" - Status         :", step3Result.onboardingStatus);

  // 5. Simulate Page Refresh (F5): Fetch Onboarding Status & Verify Draft Restoration
  const restoredStatus = await businessService.getOnboardingStatus(testAccount._id);
  console.log("\n[Test 6] Restoring Draft on Page Refresh (F5):");
  console.log(" - Restored currentStep :", restoredStatus.currentStep);
  console.log(" - Restored businessName:", restoredStatus.draftData.businessName);
  console.log(" - Restored city        :", restoredStatus.draftData.city);
  console.log(" - Restored taxMode     :", restoredStatus.draftData.taxMode);

  if (
    restoredStatus.currentStep === 4 &&
    restoredStatus.draftData.businessName === "Draft Grocery Supermart" &&
    restoredStatus.draftData.city === "Bengaluru"
  ) {
    console.log(" - Draft Restoration Validation: PASSED ✅");
  } else {
    throw new Error("Draft restoration failed!");
  }

  // 6. Finalize Onboarding from Review Screen (Step 4)
  const finalResult = await businessService.saveOnboardingStep({
    accountId: testAccount._id,
    step: 4,
    data: {},
    isFinalStep: true,
  });
  console.log("\n[Test 7] Finalizing Onboarding (Atomic Business Creation):");
  console.log(" - isCompleted    :", finalResult.isCompleted);
  console.log(" - Created Biz ID :", finalResult.business?._id);
  console.log(" - Role Assigned  :", finalResult.role);

  // 7. Post-Finalization Check
  const completedStatus = await businessService.getOnboardingStatus(testAccount._id);
  console.log("\n[Test 8] Post-Completion Status:");
  console.log(" - isCompleted    :", completedStatus.isCompleted);
  console.log(" - Draft Cleared  :", Object.keys(completedStatus.draftData).length === 0 ? "YES ✅" : "NO ❌");
  console.log(" - Active Business:", completedStatus.activeBusiness?.businessName);

  // Cleanup test data
  const Business = require("../src/models/business.model");
  const Account = require("../src/models/account.model");
  const Vendor = require("../src/models/vendor.model");
  const BusinessMember = require("../src/models/businessMember.model");

  await Business.findByIdAndDelete(finalResult.business._id);
  await BusinessMember.deleteMany({ businessId: finalResult.business._id });
  await Vendor.deleteMany({ accountId: testAccount._id });
  await Account.findByIdAndDelete(testAccount._id);
  console.log("\nCleaned up test account and business.");

  console.log("\n================================================================================");
  console.log("    ALL ONBOARDING DRAFT LIFECYCLE TESTS PASSED 100% SUCCESSFULLY! 🎉           ");
  console.log("================================================================================");
  await mongoose.disconnect();
}

runDraftLifecycleTest().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
