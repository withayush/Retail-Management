const express = require("express");
const { handleChat, getStatus } = require("../controllers/ai.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { businessMiddleware } = require("../middlewares/business.middleware");

const router = express.Router();

// Optional auth helper: if auth succeeds, attach req.user and req.business; if not, proceed anyway
const optionalAuth = async (req, res, next) => {
  try {
    const hasToken =
      req.cookies?.accessToken ||
      (req.headers.authorization && req.headers.authorization.startsWith("Bearer "));
    
    if (hasToken) {
      await authMiddleware(req, res, () => {
        businessMiddleware(req, res, next);
      });
    } else {
      next();
    }
  } catch {
    next();
  }
};

// Routes
router.get("/status", getStatus);
router.post("/chat", optionalAuth, handleChat);
router.post("/ask", optionalAuth, handleChat); // Alias for convenience

module.exports = router;
