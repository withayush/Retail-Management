const Business = require("../models/business.model");
const BusinessMember = require("../models/businessMember.model");
const Vendor = require("../models/vendor.model");

const createBusiness = async (businessData, session = null) => {
  const options = session ? { session } : {};
  const [business] = await Business.create([businessData], options);
  return business;
};

const createBusinessMember = async (memberData, session = null) => {
  const options = session ? { session } : {};
  const [member] = await BusinessMember.create([memberData], options);
  return member;
};

const findBusinessesByOwnerId = async (ownerId) => {
  return await Business.find({ ownerId, status: { $ne: "ARCHIVED" } }).sort({ createdAt: -1 });
};

const findBusinessById = async (businessId) => {
  return await Business.findOne({ _id: businessId, status: { $ne: "ARCHIVED" } });
};

const updateBusinessById = async (businessId, updateData) => {
  return await Business.findOneAndUpdate(
    { _id: businessId, status: { $ne: "ARCHIVED" } },
    { $set: updateData },
    { new: true, runValidators: true }
  );
};

const findVendorByAccountId = async (accountId) => {
  return await Vendor.findOne({ accountId });
};

const updateVendorOnboardingStatus = async (vendorId, status, session = null) => {
  const options = session ? { session, new: true } : { new: true };
  return await Vendor.findByIdAndUpdate(
    vendorId,
    { $set: { onboardingStatus: status } },
    options
  );
};

const findBusinessMember = async ({ businessId, accountId }) => {
  return await BusinessMember.findOne({
    businessId,
    accountId,
    status: "ACTIVE",
  });
};

const findMembershipsByAccountId = async (accountId) => {
  return await BusinessMember.find({
    accountId,
    status: "ACTIVE",
  }).populate("businessId");
};

const saveVendorOnboardingProgress = async ({
  vendorId,
  onboardingStep,
  onboardingData,
  onboardingStatus = "IN_PROGRESS",
  session = null,
}) => {
  const options = session ? { session, new: true } : { new: true };
  return await Vendor.findByIdAndUpdate(
    vendorId,
    {
      $set: {
        onboardingStep,
        onboardingData,
        onboardingStatus,
      },
    },
    options
  );
};

const finalizeVendorOnboarding = async (vendorId, session = null) => {
  const options = session ? { session, new: true } : { new: true };
  return await Vendor.findByIdAndUpdate(
    vendorId,
    {
      $set: {
        onboardingStatus: "COMPLETED",
        onboardingStep: 4,
        onboardingData: {},
      },
    },
    options
  );
};

module.exports = {
  createBusiness,
  createBusinessMember,
  findBusinessesByOwnerId,
  findBusinessById,
  updateBusinessById,
  findVendorByAccountId,
  updateVendorOnboardingStatus,
  findBusinessMember,
  findMembershipsByAccountId,
  saveVendorOnboardingProgress,
  finalizeVendorOnboarding,
};
