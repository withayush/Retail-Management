const express = require("express");

const {
  register,
  verifyPhone,
  login,
  getMe,
  refresh,
  logout,
} = require("../controllers/auth.controller");

const validate = require("../middlewares/validate.middleware");

const authMiddleware = require("../middlewares/auth.middleware");

const {
  registerSchema,
  verifyPhoneSchema,
  loginSchema,
} = require("../validations/auth.validation");

const router = express.Router();

// ============================================
// REGISTER
// ============================================

router.post("/register", validate(registerSchema), register);

// ============================================
// VERIFY PHONE
// ============================================

router.post("/verify-phone", validate(verifyPhoneSchema), verifyPhone);

// ============================================
// LOGIN
// ============================================

router.post("/login", validate(loginSchema), login);

// ============================================
// ME
// ============================================

router.get("/me", authMiddleware, getMe);

// ============================================
// REFRESH
// ============================================

router.post("/refresh", refresh);

// ============================================
// LOGOUT
// ============================================

router.post("/logout", logout);

module.exports = router;
