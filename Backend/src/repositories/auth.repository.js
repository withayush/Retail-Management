const mongoose = require("mongoose");

const Account = require("../models/account.model");
const OtpChallenge = require("../models/otpChallenge.model");
const Vendor = require("../models/vendor.model");
const Session = require("../models/session.model");

const { AuthEvent, AuthAttempt } = require("../models/authLog.model");

// =====================================================
// ACCOUNT
// =====================================================

const findAccountByEmail = async (email) => {
  return await Account.findOne({ email });
};

const findAccountByPhone = async (phone) => {
  return await Account.findOne({ phone });
};

const findAccountByEmailOrPhone = async (identifier) => {
  return await Account.findOne({
    $or: [
      { email: identifier },
      { phone: identifier },
    ],
  }).select("+passwordHash");
};

const findAccountById = async (accountId) => {
  return await Account.findById(accountId);
};

const createAccount = async ({
  fullName,
  email,
  phone,
  passwordHash,
}) => {
  return await Account.create({
    fullName,
    email,
    phone,
    passwordHash,
    status: "PENDING_VERIFICATION",
  });
};

// =====================================================
// OTP
// =====================================================

const createOtpChallenge = async ({
  accountId,
  phone,
  purpose,
  codeHash,
  expiresAt,
}) => {
  return await OtpChallenge.create({
    accountId,
    phone,
    purpose,
    codeHash,
    expiresAt,
    lastSentAt: new Date(),
  });
};

const findActiveOtpChallenge = async ({
  phone,
  purpose,
}) => {
  return await OtpChallenge.findOne({
    phone,
    purpose,
    consumedAt: null,
  })
    .select("+codeHash")
    .sort({ createdAt: -1 });
};

// =====================================================
// SESSION
// =====================================================

const createSession = async ({
  _id,
  accountId,
  refreshTokenHash,
  ipAddress,
  userAgent,
  expiresAt,
}) => {
  return await Session.create({
    _id,
    accountId,
    refreshTokenHash,
    ipAddress,
    userAgent,
    expiresAt,
    lastUsedAt: new Date(),
  });
};

const findSessionById = async (sessionId) => {
  return await Session.findById(sessionId)
    .select("+refreshTokenHash");
};

const revokeSession = async (sessionId) => {
  return await Session.findOneAndUpdate(
    {
      _id: sessionId,
      revokedAt: null,
    },
    {
      $set: {
        revokedAt: new Date(),
      },
    },
    {
      returnDocument: "after",
      new: true,
    }
  );
};

const updateSessionRefreshToken = async ({
  sessionId,
  refreshTokenHash,
  expiresAt,
}) => {
  return await Session.findOneAndUpdate(
    {
      _id: sessionId,
      revokedAt: null,
    },
    {
      $set: {
        refreshTokenHash,
        expiresAt,
        lastUsedAt: new Date(),
      },
    },
    {
      returnDocument: "after",
      new: true,
    }
  );
};

// =====================================================
// TRANSACTIONAL PHONE VERIFICATION
// =====================================================

const completePhoneVerification = async ({
  accountId,
  challengeId,
  sessionData,
}) => {
  const dbSession = await mongoose.startSession();

  try {
    let result;

    await dbSession.withTransaction(async () => {
      // ---------------------------------------------
      // 1. Consume OTP atomically
      // ---------------------------------------------

      const otpResult =
        await OtpChallenge.findOneAndUpdate(
          {
            _id: challengeId,
            accountId,
            consumedAt: null,
          },
          {
            $set: {
              verifiedAt: new Date(),
              consumedAt: new Date(),
            },
          },
          {
            returnDocument: "after",
            new: true,
            session: dbSession,
          }
        );

      if (!otpResult) {
        const error = new Error(
          "OTP challenge is no longer active."
        );

        error.statusCode = 400;
        error.code = "OTP_CHALLENGE_INVALID";

        throw error;
      }

      // ---------------------------------------------
      // 2. Activate account
      // ---------------------------------------------

      const account =
        await Account.findOneAndUpdate(
          {
            _id: accountId,
            status: "PENDING_VERIFICATION",
          },
          {
            $set: {
              status: "ACTIVE",
              phoneVerifiedAt: new Date(),
            },
          },
          {
            returnDocument: "after",
            new: true,
            session: dbSession,
          }
        );

      if (!account) {
        const error = new Error(
          "Account cannot be activated."
        );

        error.statusCode = 400;
        error.code = "ACCOUNT_ACTIVATION_FAILED";

        throw error;
      }

      // ---------------------------------------------
      // 3. Create Vendor
      // ---------------------------------------------

      const vendor =
        await Vendor.findOneAndUpdate(
          {
            accountId: account._id,
          },
          {
            $setOnInsert: {
              accountId: account._id,
              status: "ACTIVE",
              onboardingStatus: "NOT_STARTED",
            },
          },
          {
            returnDocument: "after",
            new: true,
            upsert: true,
            session: dbSession,
          }
        );

      // ---------------------------------------------
      // 4. Create Session
      // ---------------------------------------------

      const newSession =
        await Session.create(
          [
            {
              _id: sessionData.sessionId,
              accountId: account._id,
              refreshTokenHash:
                sessionData.refreshTokenHash,
              ipAddress:
                sessionData.ipAddress || null,
              userAgent:
                sessionData.userAgent || null,
              expiresAt:
                sessionData.expiresAt,
              lastUsedAt: new Date(),
            },
          ],
          {
            session: dbSession,
          }
        );

      result = {
        account,
        vendor,
        session: newSession[0],
      };
    });

    return result;
  } finally {
    await dbSession.endSession();
  }
};

// =====================================================
// AUTH EVENTS
// =====================================================

const logAuthEvent = async ({
  accountId,
  eventType,
  ipAddress = null,
  userAgent = null,
  metadata = null,
}) => {
  return await AuthEvent.create({
    accountId,
    eventType,
    ipAddress,
    userAgent,
    metadata,
  });
};



const logAuthAttempt = async ({
  accountId = null,
  identifier,
  action = "LOGIN",
  success = false,
  reason = null,
  ipAddress = null,
  userAgent = null,
}) => {
  return await AuthAttempt.create({
    accountId,
    identifier,
    action,
    success,
    reason,
    ipAddress,
    userAgent,
  });
};

const updateOtpChallengeForResend = async ({
  challengeId,
  codeHash,
  expiresAt,
}) => {
  return await OtpChallenge.findByIdAndUpdate(
    challengeId,
    {
      $set: {
        codeHash,
        expiresAt,
        lastSentAt: new Date(),
        attempts: 0, // Reset failed verification attempts on new send
      },
      $inc: {
        resendCount: 1,
      },
    },
    { returnDocument: "after", new: true }
  );
};

const findVendorByAccountId = async (accountId) => {
  return await Vendor.findOne({ accountId });
};

module.exports = {
  findAccountByEmail,
  findAccountByPhone,
  findAccountByEmailOrPhone,
  findAccountById,

  createAccount,

  createOtpChallenge,
  findActiveOtpChallenge,

  createSession,
  findSessionById,
  updateSessionRefreshToken,
  
  revokeSession,

  completePhoneVerification,

  findVendorByAccountId,

  logAuthEvent,
  logAuthAttempt,
  updateOtpChallengeForResend,
};

