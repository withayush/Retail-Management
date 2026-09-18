const authRepo = require("../repositories/auth.repository");

const mongoose = require("mongoose");

const { hashPassword, comparePassword } = require("../utils/password");

const Account = require("../models/account.model");

const { generateOtp, hashOtp, compareOtp } = require("../utils/otp");

const { normalizePhone } = require("../utils/phone");

const {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} = require("../utils/token");

const OTP_EXPIRY_MINUTES = 10;
const REFRESH_EXPIRY_DAYS = 7;

const register = async ({ fullName, email, phone, password }, meta = {}) => {
  // =========================
  // 1. NORMALIZE INPUT
  // =========================

  const cleanFullName = fullName.trim();
  const cleanEmail = email.trim().toLowerCase();
  const cleanPhone = normalizePhone(phone);

  // =========================
  // 2. DUPLICATE EMAIL CHECK
  // =========================

  const existingEmail = await authRepo.findAccountByEmail(cleanEmail);

  if (existingEmail) {
    const error = new Error("An account with this email already exists.");

    error.statusCode = 409;
    error.code = "EMAIL_ALREADY_EXISTS";

    throw error;
  }

  // =========================
  // 3. DUPLICATE PHONE CHECK
  // =========================

  const existingPhone = await authRepo.findAccountByPhone(cleanPhone);

  if (existingPhone) {
    const error = new Error(
      "An account with this phone number already exists.",
    );

    error.statusCode = 409;
    error.code = "PHONE_ALREADY_EXISTS";

    throw error;
  }

  // =========================
  // 4. HASH PASSWORD
  // =========================

  const passwordHash = await hashPassword(password);

  // =========================
  // 5. CREATE ACCOUNT
  // =========================

  const account = await authRepo.createAccount({
    fullName: cleanFullName,
    email: cleanEmail,
    phone: cleanPhone,
    passwordHash,
  });

  // =========================
  // 6. GENERATE OTP
  // =========================

  const rawOtp = generateOtp();

  // =========================
  // 7. HASH OTP
  // =========================

  const codeHash = await hashOtp(rawOtp);

  // =========================
  // 8. OTP EXPIRY
  // =========================

  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // =========================
  // 9. CREATE OTP CHALLENGE
  // =========================

  await authRepo.createOtpChallenge({
    accountId: account._id,
    phone: cleanPhone,
    purpose: "PHONE_VERIFICATION",
    codeHash,
    expiresAt,
  });

  // =========================
  // 10. AUTH EVENT
  // =========================

  await authRepo.logAuthEvent({
    accountId: account._id,
    eventType: "REGISTERED",
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
    metadata: {
      purpose: "PHONE_VERIFICATION",
    },
  });

  // =========================
  // 11. DEV OTP
  // =========================

  if (process.env.NODE_ENV !== "production") {
    console.log(`[DEV OTP] ${cleanPhone}: ${rawOtp}`);
  }

  // =========================
  // 12. RESPONSE
  // =========================

  return {
    accountId: account._id,
    fullName: account.fullName,
    email: account.email,
    phone: account.phone,
    status: account.status,
    verificationRequired: true,

    ...(process.env.NODE_ENV !== "production" && {
      debugOtp: rawOtp,
    }),
  };
};

const verifyPhone = async ({ phone, otp, ipAddress, userAgent }) => {
  const cleanPhone = normalizePhone(phone);
  const cleanOtp = otp.trim();

  // ---------------------------------------------
  // 1. Find active OTP
  // ---------------------------------------------

  const challenge = await authRepo.findActiveOtpChallenge({
    phone: cleanPhone,
    purpose: "PHONE_VERIFICATION",
  });

  if (!challenge) {
    const error = new Error("No active OTP challenge found.");

    error.statusCode = 400;
    error.code = "OTP_NOT_FOUND";

    throw error;
  }

  // ---------------------------------------------
  // 2. Expiry
  // ---------------------------------------------

  if (!challenge.expiresAt || challenge.expiresAt.getTime() <= Date.now()) {
    const error = new Error("OTP has expired.");

    error.statusCode = 400;
    error.code = "OTP_EXPIRED";

    throw error;
  }

  // ---------------------------------------------
  // 3. Maximum attempts
  // ---------------------------------------------

  if (challenge.attempts >= challenge.maxAttempts) {
    const error = new Error("Maximum OTP attempts exceeded.");

    error.statusCode = 429;
    error.code = "OTP_MAX_ATTEMPTS";

    throw error;
  }

  // ---------------------------------------------
  // 4. bcrypt comparison
  // ---------------------------------------------

  const isOtpValid = await compareOtp(cleanOtp, challenge.codeHash);

  if (!isOtpValid) {
    await challenge.updateOne({
      $inc: {
        attempts: 1,
      },
    });

    const error = new Error("Invalid OTP.");

    error.statusCode = 400;
    error.code = "INVALID_OTP";

    throw error;
  }

  // ---------------------------------------------
  // 5. Generate session ID BEFORE transaction
  // ---------------------------------------------

  const sessionId = new mongoose.Types.ObjectId();

  // ---------------------------------------------
  // 6. Generate JWTs
  // ---------------------------------------------

  const accessToken = generateAccessToken({
    sub: challenge.accountId.toString(),
  });

  const refreshToken = generateRefreshToken({
    sub: challenge.accountId.toString(),
    sid: sessionId.toString(),
  });

  // ---------------------------------------------
  // 7. Hash refresh token
  // ---------------------------------------------

  const refreshTokenHash = await hashPassword(refreshToken);

  const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // ---------------------------------------------
  // 8. Atomic DB transaction
  // ---------------------------------------------

  const result = await authRepo.completePhoneVerification({
    accountId: challenge.accountId,
    challengeId: challenge._id,

    sessionData: {
      sessionId,
      refreshTokenHash,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      expiresAt: sessionExpiresAt,
    },
  });

  // ---------------------------------------------
  // 9. Auth event
  // ---------------------------------------------

  await authRepo.logAuthEvent({
    accountId: result.account._id,
    eventType: "PHONE_VERIFIED",
    ipAddress: ipAddress || null,
    userAgent: userAgent || null,
  });

  return {
    accessToken,
    refreshToken,

    account: {
      accountId: result.account._id,
      fullName: result.account.fullName,
      email: result.account.email,
      phone: result.account.phone,
      status: result.account.status,
      phoneVerifiedAt: result.account.phoneVerifiedAt,
    },

    vendor: {
      vendorId: result.vendor._id,
      accountId: result.vendor.accountId,
      status: result.vendor.status,
      onboardingStatus: result.vendor.onboardingStatus,
    },
  };
};

const resendPhoneOtp = async ({ phone }, meta = {}) => {
  const cleanPhone = normalizePhone(phone);

  // 1. Account check
  const account = await authRepo.findAccountByPhone(cleanPhone);
  if (!account) {
    const error = new Error("Account not found with this phone number.");
    error.statusCode = 404;
    error.code = "ACCOUNT_NOT_FOUND";
    throw error;
  }

  if (account.status === "ACTIVE") {
    const error = new Error("Phone number is already verified.");
    error.statusCode = 400;
    error.code = "ACCOUNT_ALREADY_VERIFIED";
    throw error;
  }

  // 2. Active challenge check
  const challenge = await authRepo.findActiveOtpChallenge({
    phone: cleanPhone,
    purpose: "PHONE_VERIFICATION",
  });

  if (!challenge) {
    const error = new Error("No active OTP challenge found. Please register first.");
    error.statusCode = 400;
    error.code = "OTP_NOT_FOUND";
    throw error;
  }

  // 3. Max 3 resends limit check
  const MAX_RESEND_COUNT = 3;
  if (challenge.resendCount >= MAX_RESEND_COUNT) {
    const error = new Error("Maximum OTP resend limit reached. Please try again later.");
    error.statusCode = 429;
    error.code = "OTP_RESEND_LIMIT_EXCEEDED";
    throw error;
  }

  // 4. Cooldown check (60 seconds)
  const RESEND_COOLDOWN_SECONDS = 60;
  if (challenge.lastSentAt) {
    const timeSinceLastSent = (Date.now() - new Date(challenge.lastSentAt).getTime()) / 1000;
    if (timeSinceLastSent < RESEND_COOLDOWN_SECONDS) {
      const waitSeconds = Math.ceil(RESEND_COOLDOWN_SECONDS - timeSinceLastSent);
      const error = new Error(`Please wait ${waitSeconds} seconds before requesting a new OTP.`);
      error.statusCode = 429;
      error.code = "OTP_COOLDOWN";
      throw error;
    }
  }

  // 5. Generate and hash new OTP
  const rawOtp = generateOtp();
  const codeHash = await hashOtp(rawOtp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // 6. Update existing challenge in DB
  const updatedChallenge = await authRepo.updateOtpChallengeForResend({
    challengeId: challenge._id,
    codeHash,
    expiresAt,
  });

  // 7. Log auth event
  await authRepo.logAuthEvent({
    accountId: challenge.accountId,
    eventType: "OTP_RESENT",
    ipAddress: meta.ipAddress || null,
    userAgent: meta.userAgent || null,
    metadata: {
      purpose: "PHONE_VERIFICATION",
      resendCount: updatedChallenge.resendCount,
    },
  });

  // 8. Dev OTP logging
  if (process.env.NODE_ENV !== "production") {
    console.log(`[DEV OTP RESEND] ${cleanPhone}: ${rawOtp}`);
  }

  return {
    phone: cleanPhone,
    resendCount: updatedChallenge.resendCount,
    resendsLeft: MAX_RESEND_COUNT - updatedChallenge.resendCount,
    ...(process.env.NODE_ENV !== "production" && {
      debugOtp: rawOtp,
    }),
  };
};

const login = async ({ identifier, password }, meta = {}) => {
  const ipAddress = meta.ipAddress || null;
  const userAgent = meta.userAgent || null;

  // ============================================
  // 1. NORMALIZE IDENTIFIER (Email or Phone)
  // ============================================

  let cleanIdentifier = identifier.trim().toLowerCase();

  // If identifier looks like a phone number, normalize it too
  if (
    /^(\+91|91)?[6-9]\d{9}$/.test(cleanIdentifier) ||
    /^\d{10}$/.test(cleanIdentifier)
  ) {
    cleanIdentifier = normalizePhone(cleanIdentifier);
  }

  // ============================================
  // 2. FIND ACCOUNT
  // ============================================

  const account = await authRepo.findAccountByEmailOrPhone(cleanIdentifier);

  // ============================================
  // 3. ACCOUNT NOT FOUND
  // ============================================

  if (!account) {
    await authRepo.logAuthAttempt({
      accountId: null,
      identifier: cleanIdentifier,
      action: "LOGIN",
      success: false,
      reason: "USER_NOT_FOUND",
      ipAddress,
      userAgent,
    });

    const error = new Error("Invalid credentials.");

    error.statusCode = 401;
    error.code = "INVALID_CREDENTIALS";

    throw error;
  }

  // ============================================
  // 4. CHECK ACCOUNT STATUS
  // ============================================

  if (account.status === "PENDING_VERIFICATION") {
    await authRepo.logAuthAttempt({
      accountId: account._id,
      identifier: cleanIdentifier,
      action: "LOGIN",
      success: false,
      reason: "PHONE_VERIFICATION_REQUIRED",
      ipAddress,
      userAgent,
    });

    const error = new Error(
      "Phone verification is required. Please verify your phone number to continue."
    );

    error.statusCode = 403;
    error.code = "PHONE_VERIFICATION_REQUIRED";
    error.data = {
      phone: account.phone,
    };

    throw error;
  }

  if (account.status !== "ACTIVE") {
    await authRepo.logAuthAttempt({
      accountId: account._id,
      identifier: cleanIdentifier,
      action: "LOGIN",
      success: false,
      reason: `ACCOUNT_${account.status}`,
      ipAddress,
      userAgent,
    });

    const error = new Error(`Account is ${account.status.toLowerCase()}. Please contact support.`);

    error.statusCode = 403;
    error.code = `ACCOUNT_${account.status}`;

    throw error;
  }

  // ============================================
  // 5. COMPARE PASSWORD
  // ============================================

  const passwordValid = await comparePassword(password, account.passwordHash);

  if (!passwordValid) {
    await authRepo.logAuthAttempt({
      accountId: account._id,
      identifier: cleanIdentifier,
      action: "LOGIN",
      success: false,
      reason: "WRONG_PASSWORD",
      ipAddress,
      userAgent,
    });

    const error = new Error("Invalid credentials.");

    error.statusCode = 401;
    error.code = "INVALID_CREDENTIALS";

    throw error;
  }

  // ============================================
  // 6. LOG SUCCESSFUL LOGIN ATTEMPT
  // ============================================

  await authRepo.logAuthAttempt({
    accountId: account._id,
    identifier: cleanIdentifier,
    action: "LOGIN",
    success: true,
    reason: "SUCCESS",
    ipAddress,
    userAgent,
  });

  // ============================================
  // 7. GENERATE SESSION ID
  // ============================================

  const sessionId = new mongoose.Types.ObjectId();

  // ============================================
  // 8. GENERATE ACCESS TOKEN
  // ============================================

  const accessToken = generateAccessToken({
    sub: account._id.toString(),
  });

  // ============================================
  // 9. GENERATE REFRESH TOKEN
  // ============================================

  const refreshToken = generateRefreshToken({
    sub: account._id.toString(),
    sid: sessionId.toString(),
  });

  // ============================================
  // 10. HASH REFRESH TOKEN
  // ============================================

  const refreshTokenHash = await hashPassword(refreshToken);

  // ============================================
  // 10. SESSION EXPIRY
  // ============================================

  const expiresAt = new Date(
    Date.now() + REFRESH_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  );

  // ============================================
  // 11. CREATE SESSION
  // ============================================

  await authRepo.createSession({
    _id: sessionId,
    accountId: account._id,
    refreshTokenHash,
    ipAddress: ipAddress || null,
    userAgent: userAgent || null,
    expiresAt,
  });

  // ============================================
  // 12. UPDATE LAST LOGIN
  // ============================================

  await Account.findByIdAndUpdate(account._id, {
    $set: {
      lastLoginAt: new Date(),
    },
  });

  // ============================================
  // 13. AUTH EVENT
  // ============================================

  await authRepo.logAuthEvent({
    accountId: account._id,
    eventType: "LOGIN",
    ipAddress: ipAddress || null,
    userAgent: userAgent || null,
    metadata: {
      method: "PASSWORD",
    },
  });

  // ============================================
  // 14. RESPONSE
  // ============================================

  return {
    accessToken,
    refreshToken,

    account: {
      accountId: account._id,
      fullName: account.fullName,
      email: account.email,
      phone: account.phone,
      status: account.status,
      phoneVerifiedAt: account.phoneVerifiedAt,
    },
  };
};

const getMe = async (accountId) => {
  const account = await authRepo.findAccountById(accountId);

  if (!account) {
    const error = new Error("Account not found.");

    error.statusCode = 404;
    error.code = "ACCOUNT_NOT_FOUND";

    throw error;
  }

  if (account.status !== "ACTIVE") {
    const error = new Error("Account is not active.");

    error.statusCode = 403;
    error.code = "ACCOUNT_NOT_ACTIVE";

    throw error;
  }

  const vendor = await authRepo.findVendorByAccountId(account._id);

  return {
    account: {
      accountId: account._id,
      fullName: account.fullName,
      email: account.email,
      phone: account.phone,
      status: account.status,
      phoneVerifiedAt: account.phoneVerifiedAt,
    },
    vendor: vendor
      ? {
          vendorId: vendor._id,
          status: vendor.status,
          onboardingStatus: vendor.onboardingStatus,
        }
      : null,
  };
};

const refreshSession = async ({ refreshToken, ipAddress, userAgent }) => {
  if (!refreshToken) {
    const error = new Error("Refresh token required.");

    error.statusCode = 401;
    error.code = "REFRESH_TOKEN_MISSING";

    throw error;
  }

  let payload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (error) {
    const authError = new Error("Invalid or expired refresh token.");

    authError.statusCode = 401;
    authError.code = "INVALID_REFRESH_TOKEN";

    throw authError;
  }

  if (!payload.sub || !payload.sid) {
    const error = new Error("Invalid refresh token payload.");

    error.statusCode = 401;
    error.code = "INVALID_REFRESH_TOKEN";

    throw error;
  }

  const session = await authRepo.findSessionById(payload.sid);

  if (!session) {
    const error = new Error("Session not found.");

    error.statusCode = 401;
    error.code = "SESSION_NOT_FOUND";

    throw error;
  }

  if (session.revokedAt) {
    const error = new Error("Session has been revoked.");

    error.statusCode = 401;
    error.code = "SESSION_REVOKED";

    throw error;
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    const error = new Error("Session has expired.");

    error.statusCode = 401;
    error.code = "SESSION_EXPIRED";

    throw error;
  }

  const valid = await comparePassword(refreshToken, session.refreshTokenHash);

  if (!valid) {
    await authRepo.revokeSession(session._id);

    const error = new Error("Refresh token reuse detected.");

    error.statusCode = 401;
    error.code = "REFRESH_TOKEN_REUSE";

    throw error;
  }

  const account = await authRepo.findAccountById(payload.sub);

  if (!account || account.status !== "ACTIVE") {
    const error = new Error("Account is not active.");

    error.statusCode = 403;
    error.code = "ACCOUNT_NOT_ACTIVE";

    throw error;
  }

  const newAccessToken = generateAccessToken({
    sub: account._id.toString(),
  });

  const newRefreshToken = generateRefreshToken({
    sub: account._id.toString(),
    sid: session._id.toString(),
  });

  const newRefreshHash = await hashPassword(newRefreshToken);

  await authRepo.updateSessionRefreshToken({
    sessionId: session._id,
    refreshTokenHash: newRefreshHash,
    expiresAt: session.expiresAt,
  });

  await authRepo.logAuthEvent({
    accountId: account._id,
    eventType: "TOKEN_REFRESHED",
    ipAddress: ipAddress || null,
    userAgent: userAgent || null,
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

const logout = async ({ refreshToken }) => {
  if (refreshToken) {
    try {
      const payload = verifyRefreshToken(refreshToken);

      if (payload.sid) {
        await authRepo.revokeSession(payload.sid);

        if (payload.sub) {
          await authRepo.logAuthEvent({
            accountId: payload.sub,
            eventType: "LOGOUT",
          });
        }
      }
    } catch (error) {
      // Logout should still clear cookies
    }
  }

  return true;
};

module.exports = {
  register,
  verifyPhone,
  resendPhoneOtp,
  login,
  getMe,
  refreshSession,
  logout,
};
