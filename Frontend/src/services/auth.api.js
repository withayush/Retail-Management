import api from "./api";

// Register API call
export const registerUser = async (data) => {
  const response = await api.post("/auth/register", data);
  return response.data;
};

// Verify OTP API call
export const verifyOTP = async (data) => {
  const response = await api.post("/auth/verify-phone", data);
  return response.data;
};

export const verifyPhone = verifyOTP;

// Login API call
export const loginUser = async (data) => {
  const payload = {
    identifier: data.identifier || data.email || data.phone,
    password: data.password,
  };
  const response = await api.post("/auth/login", payload);
  return response.data;
};

// Resend OTP API call
export const resendOTP = async (data) => {
  const response = await api.post("/auth/resend-phone-otp", data);
  return response.data;
};

export const resendPhoneOtp = resendOTP;

// Get Current User Profile
export const getMe = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};

// Logout API call
export const logoutUser = async () => {
  const response = await api.post("/auth/logout");
  return response.data;
};
