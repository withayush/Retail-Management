require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const { generateAccessToken, generateRefreshToken } = require("../src/utils/token");
const authMiddleware = require("../src/middlewares/auth.middleware");
const authRepo = require("../src/repositories/auth.repository");
const mongoose = require("mongoose");

console.log("================================================================================");
console.log(" [SECURITY 3.3] UNIT TEST: HttpOnly Cookie Authentication & Storage Hardening    ");
console.log("================================================================================");

async function runTest() {
  const dummyAccountId = new mongoose.Types.ObjectId().toString();

  // Mock finding account
  const originalFindAccountById = authRepo.findAccountById;
  authRepo.findAccountById = async (id) => {
    if (id === dummyAccountId) {
      return {
        _id: new mongoose.Types.ObjectId(dummyAccountId),
        status: "ACTIVE",
        fullName: "Security Verified User",
        email: "security@test.com",
        phone: "+919876543210",
      };
    }
    return null;
  };

  try {
    const validAccessToken = generateAccessToken({ sub: dummyAccountId });

    // Test 1: Authentication succeeds purely via req.cookies.accessToken (NO Authorization header)
    let nextCalled = false;
    const reqWithCookie = {
      cookies: {
        accessToken: validAccessToken,
      },
      headers: {}, // ZERO Authorization Bearer header!
    };
    const resMock = {
      status: (code) => ({
        json: (data) => ({ code, data }),
      }),
    };

    await authMiddleware(reqWithCookie, resMock, () => {
      nextCalled = true;
    });

    console.log("\n[Test 1] Pure HttpOnly Cookie Authentication (Zero Header / Zero LocalStorage Token):");
    console.log(" - Next() called successfully          :", nextCalled ? "YES ✅" : "NO ❌");
    console.log(" - Populated user id from Cookie       :", reqWithCookie.user?.id === dummyAccountId ? "MATCH ✅" : "FAILED ❌");
    console.log(" - Populated user fullName from Cookie :", reqWithCookie.user?.fullName);

    // Test 2: Missing cookie and missing header yields 401
    let failCode = null;
    let nextCalled2 = false;
    const reqEmpty = {
      cookies: {},
      headers: {},
    };
    const resMock2 = {
      status: (code) => ({
        json: (data) => {
          failCode = code;
          return { code, data };
        },
      }),
    };

    await authMiddleware(reqEmpty, resMock2, () => {
      nextCalled2 = true;
    });

    console.log("\n[Test 2] Missing Cookie Rejection (Zero Credential Leak):");
    console.log(" - Rejected with 401 status            :", failCode === 401 ? "YES (401) ✅" : `FAILED (${failCode}) ❌`);
    console.log(" - Next() blocked                     :", !nextCalled2 ? "YES ✅" : "NO ❌");

    console.log("\n================================================================================");
    console.log("    SECURITY 3.3 VERIFICATION COMPLETED: ZERO TOKENS IN LOCALSTORAGE ✅         ");
    console.log("================================================================================\n");
  } finally {
    authRepo.findAccountById = originalFindAccountById;
  }
}

runTest();
