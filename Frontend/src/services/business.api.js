import api from "./api";

export const getOnboardingStatus = async () => {
  const response = await api.get("/api/businesses/onboarding/status");
  return response.data;
};

export const saveOnboardingStep = async (payload) => {
  const response = await api.post("/api/businesses/onboarding/step", payload);
  return response.data;
};

export const completeOnboarding = async (payload) => {
  const response = await api.post("/api/businesses/onboarding", payload);
  return response.data;
};

export const getMyBusiness = async () => {
  const response = await api.get("/api/businesses/me");
  return response.data;
};

export const getMyBusinesses = getMyBusiness;

export const getActiveBusinessContext = async () => {
  const response = await api.get("/api/businesses/active/context");
  return response.data;
};

export const getBusinessById = async (id) => {
  const response = await api.get(`/api/businesses/${id}`);
  return response.data;
};

export const updateBusiness = async (id, payload) => {
  const response = await api.put(`/api/businesses/${id}`, payload);
  return response.data;
};
