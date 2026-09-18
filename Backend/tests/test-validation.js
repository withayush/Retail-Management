const { registerSchema } = require("../src/validations/auth.validation");

const validData = {
  fullName: "Ayush Sharma",
  email: "AYUSH@EXAMPLE.COM",
  phone: "9876543210",
  password: "Strong@123",
};

const invalidData = {
  fullName: "A",
  email: "wrong-email",
  phone: "12345",
  password: "123",
};

const trimmedPayload = {
  fullName: "  Ayush Sharma  ",
  email: "  AYUSH@EXAMPLE.COM  ",
  phone: "9876543210",
  password: "Strong@123",
};

console.log("========== VALID DATA ==========");

const validResult = registerSchema.safeParse(validData);

console.log(validResult);

console.log("\n========== INVALID DATA ==========");

const invalidResult = registerSchema.safeParse(invalidData);

console.log(invalidResult);

const trimmedResult = registerSchema.safeParse(trimmedPayload);

console.log(trimmedResult);
