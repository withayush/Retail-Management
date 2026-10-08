const mongoose = require("mongoose");
const businessRepo = require("../repositories/business.repository");
const authRepo = require("../repositories/auth.repository");

const UNLOCKED_MODULES = [
  "DASHBOARD",
  "PRODUCTS",
  "CATEGORIES",
  "INVENTORY",
  "INVOICES",
  "CUSTOMERS",
  "REPORTS",
];

const {
  onboardingStep1Schema,
  onboardingStep2Schema,
  onboardingStep3Schema,
  createBusinessSchema,
} = require("../validations/business.validation");

const createBusiness = async ({ accountId, ...businessPayload }) => {
  const vendor = await businessRepo.findVendorByAccountId(accountId);

  const dbSession = await mongoose.startSession();
  try {
    let createdBusiness;
    await dbSession.withTransaction(async () => {
      // 1. Create Business linked to User (ownerId) and Vendor
      createdBusiness = await businessRepo.createBusiness(
        {
          ...businessPayload,
          ownerId: accountId,
          vendorId: vendor ? vendor._id : null,
        },
        dbSession
      );

      // 2. Automatically assign OWNER role in BusinessMember
      await businessRepo.createBusinessMember(
        {
          businessId: createdBusiness._id,
          accountId,
          role: "OWNER",
          status: "ACTIVE",
        },
        dbSession
      );

      // 3. Update Vendor onboarding status to COMPLETED
      if (vendor && vendor.onboardingStatus !== "COMPLETED") {
        await businessRepo.finalizeVendorOnboarding(vendor._id, dbSession);
      }
    });

    return {
      ...(createdBusiness.toObject ? createdBusiness.toObject() : createdBusiness),
      role: "OWNER",
      onboardingCompleted: true,
      unlockedModules: UNLOCKED_MODULES,
    };
  } finally {
    await dbSession.endSession();
  }
};

const getMyBusinesses = async (accountId) => {
  return await businessRepo.findBusinessesByOwnerId(accountId);
};

const getBusinessById = async ({ businessId, accountId }) => {
  // 1. Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(businessId)) {
    const error = new Error("Invalid business ID format.");
    error.statusCode = 400;
    error.code = "INVALID_BUSINESS_ID";
    throw error;
  }

  // 2. Fetch business
  const business = await businessRepo.findBusinessById(businessId);

  if (!business) {
    const error = new Error("Business not found.");
    error.statusCode = 404;
    error.code = "BUSINESS_NOT_FOUND";
    throw error;
  }

  // 3. User context & permission integration (Owner OR Active Member)
  let userRole = null;
  let joinedAt = null;

  if (business.ownerId.toString() === accountId.toString()) {
    userRole = "OWNER";
  } else {
    const membership = await businessRepo.findBusinessMember({
      businessId: business._id,
      accountId,
    });

    if (!membership) {
      const error = new Error("You do not have permission to view this business.");
      error.statusCode = 403;
      error.code = "FORBIDDEN";
      throw error;
    }

    userRole = membership.role;
    joinedAt = membership.joinedAt;
  }

  return {
    ...business.toObject(),
    userRole,
    ...(joinedAt && { joinedAt }),
  };
};

const updateBusiness = async ({ businessId, accountId, updatePayload }) => {
  // 1. Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(businessId)) {
    const error = new Error("Invalid business ID format.");
    error.statusCode = 400;
    error.code = "INVALID_BUSINESS_ID";
    throw error;
  }

  // 2. Fetch business
  const business = await businessRepo.findBusinessById(businessId);

  if (!business) {
    const error = new Error("Business not found.");
    error.statusCode = 404;
    error.code = "BUSINESS_NOT_FOUND";
    throw error;
  }

  // 3. Security check: Ensure ONLY OWNER can perform PUT
  if (business.ownerId.toString() !== accountId.toString()) {
    const error = new Error("Only the business owner is authorized to update business profile and settings.");
    error.statusCode = 403;
    error.code = "ONLY_OWNER_CAN_UPDATE";
    throw error;
  }

  // 4. Update and return updated document
  const updatedBusiness = await businessRepo.updateBusinessById(businessId, updatePayload);
  return updatedBusiness;
};

const getOnboardingStatus = async (accountId) => {
  const vendor = await businessRepo.findVendorByAccountId(accountId);
  const businesses = await businessRepo.findBusinessesByOwnerId(accountId);

  const isCompleted =
    (vendor && vendor.onboardingStatus === "COMPLETED") ||
    businesses.length > 0;

  return {
    isCompleted,
    onboardingCompleted: isCompleted,
    onboardingStatus: isCompleted
      ? "COMPLETED"
      : vendor?.onboardingStatus || "NOT_STARTED",
    currentStep: isCompleted ? 4 : vendor?.onboardingStep || 1,
    draftData: isCompleted ? {} : vendor?.onboardingData || {},
    unlockedModules: isCompleted ? UNLOCKED_MODULES : [],
    businessCount: businesses.length,
    activeBusiness: businesses[0] || null,
  };
};

const saveOnboardingStep = async ({ accountId, step, data = {}, isFinalStep = false }) => {
  let vendor = await businessRepo.findVendorByAccountId(accountId);
  if (!vendor) {
    vendor = await authRepo.ensureVendorForAccount(accountId);
  }

  // 1. Step 1 Validation (Store Basics & Identity)
  if (step === 1) {
    const parsed = onboardingStep1Schema.safeParse(data);
    if (!parsed.success) {
      const error = new Error(
        parsed.error.issues[0]?.message || "Validation failed for step 1."
      );
      error.statusCode = 400;
      error.code = "VALIDATION_ERROR";
      throw error;
    }
    const validatedStepData = parsed.data;

    // Save step 1 draft
    const updatedDraft = { ...(vendor.onboardingData || {}), ...validatedStepData };
    await businessRepo.saveVendorOnboardingProgress({
      vendorId: vendor._id,
      onboardingStep: 2,
      onboardingData: updatedDraft,
      onboardingStatus: "IN_PROGRESS",
    });

    return {
      step: 1,
      nextStep: 2,
      savedData: validatedStepData,
      onboardingStatus: "IN_PROGRESS",
    };
  }

  // 2. Step 2 Validation (Location & Normalized Contact)
  if (step === 2) {
    const parsed = onboardingStep2Schema.safeParse(data);
    if (!parsed.success) {
      const error = new Error(
        parsed.error.issues[0]?.message || "Validation failed for step 2."
      );
      error.statusCode = 400;
      error.code = "VALIDATION_ERROR";
      throw error;
    }
    const validatedStepData = parsed.data;

    // Save step 2 draft
    const updatedDraft = { ...(vendor.onboardingData || {}), ...validatedStepData };
    await businessRepo.saveVendorOnboardingProgress({
      vendorId: vendor._id,
      onboardingStep: 3,
      onboardingData: updatedDraft,
      onboardingStatus: "IN_PROGRESS",
    });

    return {
      step: 2,
      nextStep: 3,
      savedData: validatedStepData,
      onboardingStatus: "IN_PROGRESS",
    };
  }

  // 3. Step 3 Draft Validation (Tax Mode, Operating Hours, Preferences)
  if (step === 3 && !isFinalStep) {
    const parsed = onboardingStep3Schema.safeParse(data);
    if (!parsed.success) {
      const error = new Error(
        parsed.error.issues[0]?.message || "Validation failed for step 3."
      );
      error.statusCode = 400;
      error.code = "VALIDATION_ERROR";
      throw error;
    }
    const validatedStepData = parsed.data;

    // Save step 3 draft and advance wizard progress to step 4 (Review screen)
    const updatedDraft = { ...(vendor.onboardingData || {}), ...validatedStepData };
    await businessRepo.saveVendorOnboardingProgress({
      vendorId: vendor._id,
      onboardingStep: 4,
      onboardingData: updatedDraft,
      onboardingStatus: "IN_PROGRESS",
    });

    return {
      step: 3,
      nextStep: 4,
      savedData: validatedStepData,
      onboardingStatus: "IN_PROGRESS",
    };
  }

  // 4. Final Step (step 4, or isFinalStep true): Atomic Business Creation & Onboarding Completion
  if (step === 4 || isFinalStep || step === 3) {
    let step3Validated = {};
    if (data && Object.keys(data).length > 0) {
      const parsed3 = onboardingStep3Schema.safeParse(data);
      if (parsed3.success) {
        step3Validated = parsed3.data;
      }
    }

    // Merge all accumulated wizard draft data + current payload
    const completePayload = {
      ...(vendor.onboardingData || {}),
      ...step3Validated,
      ...(data || {}),
    };

    // Full business schema validation
    const fullValidation = createBusinessSchema.safeParse(completePayload);
    if (!fullValidation.success) {
      const error = new Error(
        fullValidation.error.issues[0]?.message || "Final onboarding data is invalid."
      );
      error.statusCode = 400;
      error.code = "VALIDATION_ERROR";
      throw error;
    }

    // Atomic Finalization: Create Business + Assign Owner Member + Complete Vendor Status
    const dbSession = await mongoose.startSession();
    try {
      let createdBusiness;
      await dbSession.withTransaction(async () => {
        createdBusiness = await businessRepo.createBusiness(
          {
            ...fullValidation.data,
            ownerId: accountId,
            vendorId: vendor._id,
          },
          dbSession
        );

        await businessRepo.createBusinessMember(
          {
            businessId: createdBusiness._id,
            accountId,
            role: "OWNER",
            status: "ACTIVE",
          },
          dbSession
        );

        await businessRepo.finalizeVendorOnboarding(vendor._id, dbSession);
      });

      return {
        step: 4,
        isCompleted: true,
        onboardingCompleted: true,
        onboardingStatus: "COMPLETED",
        role: "OWNER",
        unlockedModules: UNLOCKED_MODULES,
        business: createdBusiness,
      };
    } finally {
      await dbSession.endSession();
    }
  }

  const error = new Error("Invalid step number. Supported steps: 1, 2, 3, 4.");
  error.statusCode = 400;
  error.code = "INVALID_STEP";
  throw error;
};

module.exports = {
  createBusiness,
  getMyBusinesses,
  getBusinessById,
  updateBusiness,
  getOnboardingStatus,
  saveOnboardingStep,
  UNLOCKED_MODULES,
};
