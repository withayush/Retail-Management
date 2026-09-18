const mongoose = require("mongoose");
const businessRepo = require("../repositories/business.repository");

const createBusiness = async ({ accountId, ...businessPayload }) => {
  const vendor = await businessRepo.findVendorByAccountId(accountId);

  const dbSession = await mongoose.startSession();
  try {
    let result;
    await dbSession.withTransaction(async () => {
      // 1. Create Business linked to User (ownerId) and Vendor
      const business = await businessRepo.createBusiness(
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
          businessId: business._id,
          accountId,
          role: "OWNER",
          status: "ACTIVE",
        },
        dbSession
      );

      // 3. Update Vendor onboarding status to COMPLETED
      if (vendor && vendor.onboardingStatus !== "COMPLETED") {
        await businessRepo.updateVendorOnboardingStatus(
          vendor._id,
          "COMPLETED",
          dbSession
        );
      }

      result = business;
    });

    return result;
  } finally {
    await dbSession.endSession();
  }
};

const getMyBusinesses = async (accountId) => {
  return await businessRepo.findBusinessesByOwnerId(accountId);
};

const getBusinessById = async ({ businessId, accountId }) => {
  const business = await businessRepo.findBusinessById(businessId);

  if (!business) {
    const error = new Error("Business not found.");
    error.statusCode = 404;
    error.code = "BUSINESS_NOT_FOUND";
    throw error;
  }

  // Ensure user owns this business
  if (business.ownerId.toString() !== accountId.toString()) {
    const error = new Error("You do not have permission to view this business.");
    error.statusCode = 403;
    error.code = "FORBIDDEN";
    throw error;
  }

  return business;
};

const updateBusiness = async ({ businessId, accountId, updatePayload }) => {
  const business = await businessRepo.findBusinessById(businessId);

  if (!business) {
    const error = new Error("Business not found.");
    error.statusCode = 404;
    error.code = "BUSINESS_NOT_FOUND";
    throw error;
  }

  // Ensure user owns this business
  if (business.ownerId.toString() !== accountId.toString()) {
    const error = new Error("You do not have permission to update this business.");
    error.statusCode = 403;
    error.code = "FORBIDDEN";
    throw error;
  }

  const updatedBusiness = await businessRepo.updateBusinessById(businessId, updatePayload);
  return updatedBusiness;
};

module.exports = {
  createBusiness,
  getMyBusinesses,
  getBusinessById,
  updateBusiness,
};
