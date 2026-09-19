import api from "./api";

export const registerUser = async (payload) => {
  const response = await api.post("/api/auth/register", payload);
  return response.data;
};

export const verifyPhone = async (payload) => {
  const response = await api.post("/api/auth/verify-phone", payload);
  return response.data;
};

export const verifyOTP = verifyPhone;

export const resendPhoneOtp = async (payload) => {
  const response = await api.post("/api/auth/resend-phone-otp", payload);
  return response.data;
};

export const resendOTP = resendPhoneOtp;

export const loginUser = async (payload) => {
  const body = {
    identifier: payload.identifier || payload.email || payload.phone,
    password: payload.password,
  };
  const response = await api.post("/api/auth/login", body);
  return response.data;
};

export const getMe = async () => {
  const response = await api.get("/api/auth/me");
  return response.data;
};

export const refreshSession = async () => {
  const response = await api.post("/api/auth/refresh");
  return response.data;
};

export const logoutUser = async () => {
  const response = await api.post("/api/auth/logout");
  return response.data;
};
