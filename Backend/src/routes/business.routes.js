const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const {
  createBusinessSchema,
  updateBusinessSchema,
} = require("../validations/business.validation");
const {
  createBusiness,
  getMyBusinesses,
  getBusinessById,
  updateBusiness,
} = require("../controllers/business.controller");

const router = express.Router();

// All business routes require valid authenticated session
router.use(authMiddleware);

router.post("/", validate(createBusinessSchema), createBusiness);
router.get("/me", getMyBusinesses);
router.get("/:id", getBusinessById);
router.put("/:id", validate(updateBusinessSchema), updateBusiness);

module.exports = router;
