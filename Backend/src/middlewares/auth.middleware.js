const authRepo = require("../repositories/auth.repository");
const { verifyAccessToken } = require("../utils/token");

const authMiddleware = async (req, res, next) => {
  try {
    let token = req.cookies?.accessToken;

    if (
      (!token || token === "undefined" || token === "null") &&
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      const headerToken = req.headers.authorization.split(" ")[1];
      if (headerToken && headerToken !== "undefined" && headerToken !== "null") {
        token = headerToken;
      }
    }

    if (!token || token === "undefined" || token === "null") {
      return res.status(401).json({
        success: false,
        code: "ACCESS_TOKEN_MISSING",
        message: "Authentication required.",
      });
    }

    const payload = verifyAccessToken(token);

    if (!payload || !payload.sub) {
      return res.status(401).json({
        success: false,
        code: "INVALID_ACCESS_TOKEN",
        message: "Invalid access token.",
      });
    }

    const account = await authRepo.findAccountById(payload.sub);

    if (!account) {
      return res.status(401).json({
        success: false,
        code: "ACCOUNT_NOT_FOUND",
        message: "Account no longer exists.",
      });
    }

    if (account.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        code: `ACCOUNT_${account.status}`,
        message: `Account is ${account.status.toLowerCase()}. Access denied.`,
      });
    }

    req.user = {
      accountId: account._id.toString(),
      email: account.email,
      phone: account.phone,
      status: account.status,
    };

    req.account = account;

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
