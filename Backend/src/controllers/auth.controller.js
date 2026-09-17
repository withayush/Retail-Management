const authService = require("../services/auth.service");

const {
  accessCookieOptions,
  refreshCookieOptions,
} = require("../config/cookies");

// ============================================
// REGISTER
// ============================================

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body, {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    return res.status(201).json({
      success: true,

      message: "Registration successful. Verification OTP generated.",

      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// VERIFY PHONE
// ============================================

const verifyPhone = async (req, res, next) => {
  try {
    const result = await authService.verifyPhone(req.body, {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    // ========================================
    // ACCESS TOKEN COOKIE
    // ========================================

    res.cookie("accessToken", result.accessToken, accessCookieOptions);

    // ========================================
    // REFRESH TOKEN COOKIE
    // ========================================

    res.cookie("refreshToken", result.refreshToken, refreshCookieOptions);

    // ========================================
    // RESPONSE
    // ========================================

    return res.status(200).json({
      success: true,

      message: "Phone verified successfully.",

      data: {
        account: result.account,
        vendor: result.vendor,
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const result =
      await authService.login(
        req.body,
        {
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        }
      );

    res.cookie(
      "accessToken",
      result.accessToken,
      accessCookieOptions
    );

    res.cookie(
      "refreshToken",
      result.refreshToken,
      refreshCookieOptions
    );

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        account: result.account,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const account =
      await authService.getMe(
        req.user.accountId
      );

    return res.status(200).json({
      success: true,
      data: account,
    });
  } catch (error) {
    next(error);
  }
};


const refresh = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await authService.refreshSession({
        refreshToken:
          req.cookies.refreshToken,
        ipAddress: req.ip,
        userAgent:
          req.get("user-agent"),
      });

    res.cookie(
      "accessToken",
      result.accessToken,
      accessCookieOptions
    );

    res.cookie(
      "refreshToken",
      result.refreshToken,
      refreshCookieOptions
    );

    return res.status(200).json({
      success: true,
      message:
        "Session refreshed successfully.",
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (
  req,
  res,
  next
) => {
  try {
    await authService.logout({
      refreshToken:
        req.cookies.refreshToken,
    });

    res.clearCookie(
      "accessToken",
      accessCookieOptions
    );

    res.clearCookie(
      "refreshToken",
      refreshCookieOptions
    );

    return res.status(200).json({
      success: true,
      message: "Logout successful.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  verifyPhone,
  login,
  getMe,
  refresh,
  logout,
};