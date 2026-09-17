require("dotenv").config();

const {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} = require("./src/utils/token");

const accountId = "68aaaaaaaaaaaaaaaaaaaaaaaa";

const accessToken = generateAccessToken({
  sub: accountId,
});

const refreshToken = generateRefreshToken({
  sub: accountId,
  sid: "68bbbbbbbbbbbbbbbbbbbbbb",
});

console.log("\nACCESS TOKEN:\n");
console.log(accessToken);

console.log("\nREFRESH TOKEN:\n");
console.log(refreshToken);

console.log("\nDECODED ACCESS TOKEN:\n");
console.log(verifyAccessToken(accessToken));

console.log("\nDECODED REFRESH TOKEN:\n");
console.log(verifyRefreshToken(refreshToken));