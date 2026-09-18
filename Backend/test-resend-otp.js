const { resendPhoneOtpSchema } = require("./src/validations/auth.validation");

console.log("=== 1. TEST VALIDATION ===");

const test1 = resendPhoneOtpSchema.safeParse({ phone: "9876543210" });
console.log("Valid 10-digit phone:", test1.success ? "PASSED" : "FAILED", test1.data);

const test2 = resendPhoneOtpSchema.safeParse({ phone: "+919876543210" });
console.log("Valid +91 phone:", test2.success ? "PASSED" : "FAILED", test2.data);

const test3 = resendPhoneOtpSchema.safeParse({ phone: "12345" });
console.log("Invalid phone rejected:", !test3.success ? "PASSED" : "FAILED", test3.error?.issues[0]?.message);

const test4 = resendPhoneOtpSchema.safeParse({ phone: "" });
console.log("Empty phone rejected:", !test4.success ? "PASSED" : "FAILED", test4.error?.issues[0]?.message);

console.log("\n=== ALL VALIDATION TESTS COMPLETED ===");
