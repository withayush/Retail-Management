const {
  verifyAccessToken,
} = require("../utils/token");

const authMiddleware = (
  req,
  res,
  next
) => {
  try {
    const token =
      req.cookies.accessToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        code: "ACCESS_TOKEN_MISSING",
        message: "Authentication required.",
      });
    }

    const payload =
      verifyAccessToken(token);

    if (!payload.sub) {
      return res.status(401).json({
        success: false,
        code: "INVALID_ACCESS_TOKEN",
        message: "Invalid access token.",
      });
    }

    req.user = {
      accountId: payload.sub,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      code: "INVALID_ACCESS_TOKEN",
      message: "Invalid or expired access token.",
    });
  }
};

module.exports = authMiddleware;
