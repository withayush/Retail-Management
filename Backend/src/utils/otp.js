const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const OTP_SALT_ROUNDS = 10;

const generateOtp = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

const hashOtp = async (otp) => {
  return await bcrypt.hash(otp, OTP_SALT_ROUNDS);
};

const compareOtp = async (otp, otpHash) => {
  return await bcrypt.compare(otp, otpHash);
};

module.exports = {
  generateOtp,
  hashOtp,
  compareOtp,
};