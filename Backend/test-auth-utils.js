const {
  hashPassword,
  comparePassword,
} = require("./src/utils/password");

const {
  generateOtp,
  hashOtp,
  compareOtp,
} = require("./src/utils/otp");

const test = async () => {
  // PASSWORD TEST
  const password = "Strong@123";

  const passwordHash = await hashPassword(password);

  console.log("Password:", password);
  console.log("Password Hash:", passwordHash);

  console.log(
    "Correct Password:",
    await comparePassword(password, passwordHash)
  );

  console.log(
    "Wrong Password:",
    await comparePassword("Wrong@123", passwordHash)
  );

  // OTP TEST
  const otp = generateOtp();

  const otpHash = await hashOtp(otp);

  console.log("OTP:", otp);
  console.log("OTP Hash:", otpHash);

  console.log(
    "Correct OTP:",
    await compareOtp(otp, otpHash)
  );

  console.log(
    "Wrong OTP:",
    await compareOtp("000000", otpHash)
  );
};

test();