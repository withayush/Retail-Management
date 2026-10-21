const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const { businessMiddleware } = require("../middlewares/business.middleware");
const { getBusinessSummary } = require("../controllers/dashboard.controller");

const router = express.Router();

router.use(authMiddleware);
router.use(businessMiddleware);

// ============================================
// BUSINESS SUMMARY DASHBOARD (PHASE 10 - TASK T60)
// ============================================
// Canonical endpoint matching prompt: GET /api/dashboard/business-summary?from=&to=&periodPreset=
router.get("/business-summary", getBusinessSummary);
router.get("/summary", getBusinessSummary);

module.exports = router;
