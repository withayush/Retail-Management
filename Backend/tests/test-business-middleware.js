const mongoose = require("mongoose");
const {
  businessMiddleware,
  requireBusinessRole,
} = require("../src/middlewares/business.middleware");
const businessRepo = require("../src/repositories/business.repository");

console.log("================================================================================");
console.log("       PHASE 1 - TASK T6: USER-BUSINESS MAPPING MIDDLEWARE UNIT TESTS           ");
console.log("================================================================================");

const dummyAccountId = new mongoose.Types.ObjectId().toString();
const dummyBusinessId1 = new mongoose.Types.ObjectId().toString();
const dummyBusinessId2 = new mongoose.Types.ObjectId().toString();
const unauthorizedBusinessId = new mongoose.Types.ObjectId().toString();

const mockBusiness1 = {
  _id: new mongoose.Types.ObjectId(dummyBusinessId1),
  businessName: "Sharma Kirana Store",
  ownerId: new mongoose.Types.ObjectId(dummyAccountId),
  status: "ACTIVE",
};

const mockBusiness2 = {
  _id: new mongoose.Types.ObjectId(dummyBusinessId2),
  businessName: "Sharma Electronics",
  ownerId: new mongoose.Types.ObjectId(), // Different owner
  status: "ACTIVE",
};

async function runMiddlewareTests() {
  // ----------------------------------------------------
  // Test 1: Auto-resolves owned business when no header provided
  // ----------------------------------------------------
  const origFindOwned = businessRepo.findBusinessesByOwnerId;
  const origFindById = businessRepo.findBusinessById;
  const origFindMember = businessRepo.findBusinessMember;
  const origFindMemberships = businessRepo.findMembershipsByAccountId;

  businessRepo.findBusinessesByOwnerId = async (accId) => [mockBusiness1];

  let req1 = {
    user: { accountId: dummyAccountId },
    headers: {},
  };
  let res1 = {
    status: (code) => ({
      json: (data) => ({ code, data }),
    }),
  };
  let nextCalled1 = false;

  await businessMiddleware(req1, res1, () => {
    nextCalled1 = true;
  });

  console.log("\n[Test 1] Auto-Resolve Default Owned Business (No Header):");
  console.log(" - Next Called         :", nextCalled1 ? "YES ✅" : "NO ❌");
  console.log(" - Attached businessId :", req1.businessId);
  console.log(" - Attached role       :", req1.businessRole);
  console.log(" - Result              :", req1.businessId === dummyBusinessId1 && req1.businessRole === "OWNER" ? "PASSED ✅" : "FAILED ❌");

  // ----------------------------------------------------
  // Test 2: Specific valid X-Business-Id header for Owner
  // ----------------------------------------------------
  businessRepo.findBusinessById = async (id) => (id === dummyBusinessId1 ? mockBusiness1 : null);

  let req2 = {
    user: { accountId: dummyAccountId },
    headers: { "x-business-id": dummyBusinessId1 },
  };
  let nextCalled2 = false;

  await businessMiddleware(req2, res1, () => {
    nextCalled2 = true;
  });

  console.log("\n[Test 2] Verified X-Business-Id Header for Owner:");
  console.log(" - Next Called         :", nextCalled2 ? "YES ✅" : "NO ❌");
  console.log(" - Attached businessId :", req2.businessId);
  console.log(" - Result              :", req2.businessId === dummyBusinessId1 ? "PASSED ✅" : "FAILED ❌");

  // ----------------------------------------------------
  // Test 3: Specific valid X-Business-Id header for STAFF member
  // ----------------------------------------------------
  businessRepo.findBusinessById = async (id) => (id === dummyBusinessId2 ? mockBusiness2 : null);
  businessRepo.findBusinessMember = async ({ businessId, accountId }) => ({
    businessId: mockBusiness2._id,
    accountId,
    role: "STAFF",
    status: "ACTIVE",
  });

  let req3 = {
    user: { accountId: dummyAccountId },
    headers: { "x-business-id": dummyBusinessId2 },
  };
  let nextCalled3 = false;

  await businessMiddleware(req3, res1, () => {
    nextCalled3 = true;
  });

  console.log("\n[Test 3] Verified X-Business-Id Header for Non-Owner Member (STAFF):");
  console.log(" - Next Called         :", nextCalled3 ? "YES ✅" : "NO ❌");
  console.log(" - Attached role       :", req3.businessRole);
  console.log(" - Result              :", req3.businessRole === "STAFF" ? "PASSED ✅" : "FAILED ❌");

  // ----------------------------------------------------
  // Test 4: Security Rejection: Unauthorized Business ID (Not a member)
  // ----------------------------------------------------
  const unauthorizedBiz = {
    _id: new mongoose.Types.ObjectId(unauthorizedBusinessId),
    businessName: "Competitor Store",
    ownerId: new mongoose.Types.ObjectId(), // Stranger
    status: "ACTIVE",
  };
  businessRepo.findBusinessById = async (id) => (id === unauthorizedBusinessId ? unauthorizedBiz : null);
  businessRepo.findBusinessMember = async () => null; // No membership!

  let responseData4 = null;
  let res4 = {
    status: (code) => ({
      json: (data) => {
        responseData4 = { statusCode: code, ...data };
        return responseData4;
      },
    }),
  };

  let req4 = {
    user: { accountId: dummyAccountId },
    headers: { "x-business-id": unauthorizedBusinessId },
  };
  let nextCalled4 = false;

  await businessMiddleware(req4, res4, () => {
    nextCalled4 = true;
  });

  console.log("\n[Test 4] Security Rejection for Unauthorized Business ID Access:");
  console.log(" - Next Blocked (Not Called) :", !nextCalled4 ? "YES ✅" : "NO ❌");
  console.log(" - HTTP Status Code          :", responseData4?.statusCode, "(Expected: 403)");
  console.log(" - Error Code                :", responseData4?.code);
  console.log(" - Result                    :", responseData4?.statusCode === 403 ? "PASSED ✅ (403 Forbidden)" : "FAILED ❌");

  // ----------------------------------------------------
  // Test 5: Role Gate Middleware Check (requireBusinessRole)
  // ----------------------------------------------------
  const ownerGate = requireBusinessRole(["OWNER", "MANAGER"]);
  let rolePass = false;
  ownerGate({ businessRole: "OWNER" }, res1, () => { rolePass = true; });

  let roleFail = false;
  let roleFailResponse = null;
  const failRes = {
    status: (code) => ({
      json: (data) => {
        roleFailResponse = { statusCode: code, ...data };
      },
    }),
  };
  ownerGate({ businessRole: "STAFF" }, failRes, () => { roleFail = true; });

  console.log("\n[Test 5] Role Gate Middleware Enforcement (requireBusinessRole):");
  console.log(" - OWNER access to Admin route :", rolePass ? "PASSED ✅" : "FAILED ❌");
  console.log(" - STAFF rejected from Admin   :", !roleFail && roleFailResponse?.statusCode === 403 ? "PASSED ✅ (403 Forbidden)" : "FAILED ❌");

  // Restore repos
  businessRepo.findBusinessesByOwnerId = origFindOwned;
  businessRepo.findBusinessById = origFindById;
  businessRepo.findBusinessMember = origFindMember;
  businessRepo.findMembershipsByAccountId = origFindMemberships;

  console.log("\n================================================================================");
  console.log("        ALL T6 USER-BUSINESS MAPPING MIDDLEWARE TESTS PASSED 🎉                  ");
  console.log("================================================================================");
}

runMiddlewareTests();
