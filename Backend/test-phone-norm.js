// test-phone-norm.js
const { normalizePhone } = require("./src/utils/phone");

console.log("--- Testing Phone Normalization ---");

const testCases = [
  { input: "09876543210", expected: "+919876543210" },
  { input: "+919876543210", expected: "+919876543210" },
  { input: "919876543210", expected: "+919876543210" },
  { input: "  9876543210  ", expected: "+919876543210" },
  { input: "12345", expected: "12345" }, // Invalid format fallback check
];

let passed = 0;

testCases.forEach((test, index) => {
  const result = normalizePhone(test.input);
  const isMatch = result === test.expected;
  if (isMatch) passed++;
  
  console.log(`Test ${index + 1}: Input: "${test.input}" => Got: "${result}" | Expected: "${test.expected}" -> ${isMatch ? "✅ PASS" : "❌ FAIL"}`);
});

console.log(`\nResult: ${passed}/${testCases.length} tests passed.`);