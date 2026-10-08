const businessService = require("../services/business.service");

const createBusiness = async (req, res, next) => {
  try {
    const business = await businessService.createBusiness({
      accountId: req.user.accountId,
      ...req.body,
    });

    return res.status(201).json({
      success: true,
      message: "Business created successfully.",
      data: business,
    });
  } catch (error) {
    next(error);
  }
};

const getMyBusinesses = async (req, res, next) => {
  try {
    const businesses = await businessService.getMyBusinesses(req.user.accountId);

    return res.status(200).json({
      success: true,
      data: businesses,
    });
  } catch (error) {
    next(error);
  }
};

const getBusinessById = async (req, res, next) => {
  try {
    const business = await businessService.getBusinessById({
      businessId: req.params.id,
      accountId: req.user.accountId,
    });

    return res.status(200).json({
      success: true,
      data: business,
    });
  } catch (error) {
    next(error);
  }
};

const updateBusiness = async (req, res, next) => {
  try {
    const updatedBusiness = await businessService.updateBusiness({
      businessId: req.params.id,
      accountId: req.user.accountId,
      updatePayload: req.body,
    });

    return res.status(200).json({
      success: true,
      message: "Business updated successfully.",
      data: updatedBusiness,
    });
  } catch (error) {
    next(error);
  }
};

const getOnboardingStatus = async (req, res, next) => {
  try {
    const status = await businessService.getOnboardingStatus(
      req.user.accountId
    );

    return res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
};

const saveOnboardingStep = async (req, res, next) => {
  try {
    const result = await businessService.saveOnboardingStep({
      accountId: req.user.accountId,
      step: req.body.step,
      data: req.body.data,
      isFinalStep: req.body.isFinalStep,
    });

    return res.status(200).json({
      success: true,
      message: result.isCompleted
        ? "Business onboarding completed successfully! All modules unlocked."
        : `Onboarding Step ${result.step} saved successfully.`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getActiveBusinessContext = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      data: {
        businessId: req.businessId,
        role: req.businessRole,
        business: req.business,
        membership: req.businessMember || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBusiness,
  getMyBusinesses,
  getBusinessById,
  updateBusiness,
  getOnboardingStatus,
  saveOnboardingStep,
  getActiveBusinessContext,
};
