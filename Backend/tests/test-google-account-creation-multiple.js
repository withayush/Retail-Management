const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Account = require("../src/models/account.model");
const authRepo = require("../src/repositories/auth.repository");

async function runTest() {
  console.log("================================================================================");
  console.log("   P0 VERIFICATION: MULTIPLE GOOGLE USERS ACCOUNT CREATION (NO PHONE CRASH)     ");
  console.log("================================================================================");

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    // Clean up test data if left over
    const testEmail1 = `google.user1.${Date.now()}@vendortest.com`;
    const testEmail2 = `google.user2.${Date.now()}@vendortest.com`;
    const testEmail3 = `google.user3.${Date.now()}@vendortest.com`;

    const googleId1 = `google_sub_1_${Date.now()}`;
    const googleId2 = `google_sub_2_${Date.now()}`;
    const googleId3 = `google_sub_3_${Date.now()}`;

    // Test 1: Create First Google Account
    console.log(`[Test 1] Creating Google Account 1 (${testEmail1})...`);
    const user1 = await authRepo.createGoogleAccount({
      fullName: "Google User One",
      email: testEmail1,
      googleId: googleId1,
      avatar: "https://avatar.com/1.png",
    });
    console.log(` - User 1 Created: ID=${user1._id}, phone=${user1.phone} ✅`);

    // Test 2: Create Second Google Account (This previously CRASHED with E11000 duplicate key on phone: null)
    console.log(`[Test 2] Creating Google Account 2 (${testEmail2})...`);
    const user2 = await authRepo.createGoogleAccount({
      fullName: "Google User Two",
      email: testEmail2,
      googleId: googleId2,
      avatar: "https://avatar.com/2.png",
    });
    console.log(` - User 2 Created: ID=${user2._id}, phone=${user2.phone} ✅`);

    // Test 3: Create Third Google Account
    console.log(`[Test 3] Creating Google Account 3 (${testEmail3})...`);
    const user3 = await authRepo.createGoogleAccount({
      fullName: "Google User Three",
      email: testEmail3,
      googleId: googleId3,
      avatar: "https://avatar.com/3.png",
    });
    console.log(` - User 3 Created: ID=${user3._id}, phone=${user3.phone} ✅`);

    // Test 4: Verify lookup by googleId and email
    console.log("[Test 4] Verifying lookup of Google accounts...");
    const lookup1 = await authRepo.findAccountByGoogleIdOrEmail({ googleId: googleId1 });
    if (!lookup1 || lookup1.email !== testEmail1) {
      throw new Error(`Lookup for user1 failed: expected ${testEmail1}, got ${lookup1?.email}`);
    }
    console.log(" - User 1 Lookup by googleId: PASSED ✅");

    const lookup2 = await authRepo.findAccountByGoogleIdOrEmail({ email: testEmail2 });
    if (!lookup2 || lookup2.googleId !== googleId2) {
      throw new Error(`Lookup for user2 failed: expected ${googleId2}, got ${lookup2?.googleId}`);
    }
    console.log(" - User 2 Lookup by email: PASSED ✅");

    // Test 5: Verify Email uniqueness is still preserved
    console.log("[Test 5] Verifying that duplicate email is still blocked...");
    let duplicateBlocked = false;
    try {
      await authRepo.createGoogleAccount({
        fullName: "Imposter User",
        email: testEmail1, // Same email as user 1
        googleId: `different_google_sub_${Date.now()}`,
      });
    } catch (err) {
      if (err.code === 11000) {
        duplicateBlocked = true;
      } else {
        throw err;
      }
    }
    if (!duplicateBlocked) {
      throw new Error("Duplicate email was not blocked!");
    }
    console.log(" - Duplicate Email Blocked with 11000: PASSED ✅");

    // Clean up test records
    await Account.deleteMany({ _id: { $in: [user1._id, user2._id, user3._id] } });
    console.log("Cleaned up test accounts.");

    console.log("================================================================================");
    console.log("   ALL MULTIPLE GOOGLE USER ACCOUNT TESTS PASSED SUCCESSFULLY! 🎉               ");
    console.log("================================================================================");

    process.exit(0);
  } catch (error) {
    console.error("TEST FAILED:", error);
    process.exit(1);
  }
}

runTest();
