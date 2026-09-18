const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const {
  createBusinessSchema,
  updateBusinessSchema,
  saveOnboardingStepSchema,
} = require("../validations/business.validation");
const {
  createBusiness,
  getMyBusinesses,
  getBusinessById,
  updateBusiness,
  getOnboardingStatus,
  saveOnboardingStep,
} = require("../controllers/business.controller");

const router = express.Router();

// All business routes require valid authenticated session
router.use(authMiddleware);

// ============================================
// ONBOARDING WIZARD WORKFLOW (PHASE 1 - T5)
// ============================================
router.get("/onboarding/status", getOnboardingStatus);
router.post("/onboarding/step", validate(saveOnboardingStepSchema), saveOnboardingStep);

// ============================================
// BUSINESS CRUD & PROFILE MANAGEMENT
// ============================================
router.post("/", validate(createBusinessSchema), createBusiness);
router.get("/me", getMyBusinesses);
router.get("/:id", getBusinessById);
router.put("/:id", validate(updateBusinessSchema), updateBusiness);

module.exports = router;
