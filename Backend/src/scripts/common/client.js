require("dotenv").config();
const axios = require("axios");

const BASE_URL = (process.env.SEED_API_URL || "http://127.0.0.1:3001").replace("localhost", "127.0.0.1");
const IDENTIFIER = process.env.SEED_IDENTIFIER;
const PASSWORD = process.env.SEED_PASSWORD;

function getErrorMessage(error) {
  return (
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.response?.data?.errors?.[0]?.message ||
    error.message ||
    "Unknown error"
  );
}

async function login() {
  if (!IDENTIFIER || !PASSWORD) {
    throw new Error(
      "SEED_IDENTIFIER or SEED_PASSWORD is missing in .env file."
    );
  }

  const response = await axios.post(`${BASE_URL}/api/auth/login`, {
    identifier: IDENTIFIER,
    password: PASSWORD,
  });

  const body = response.data;
  const token =
    body.accessToken ||
    body.data?.accessToken ||
    body.token ||
    body.data?.token ||
    null;

  const setCookie = response.headers["set-cookie"];
  const cookie = Array.isArray(setCookie)
    ? setCookie.map((val) => val.split(";")[0]).join("; ")
    : null;

  if (!token && !cookie) {
    throw new Error(
      "Login succeeded, but no access token or authentication cookie was found."
    );
  }

  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (cookie) headers.Cookie = cookie;

  const client = axios.create({
    baseURL: BASE_URL,
    headers,
  });

  return {
    token,
    cookie,
    headers,
    client,
    baseUrl: BASE_URL,
  };
}

module.exports = {
  BASE_URL,
  IDENTIFIER,
  PASSWORD,
  login,
  getErrorMessage,
};
