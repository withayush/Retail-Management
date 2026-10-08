import api from "./api";

// Naya business create karne ke liye (Onboarding submit)
export const createBusiness = async (data) => {
  const response = await api.post("/businesses", data);
  const createdBiz = response?.data?.data || response?.data;
  if (createdBiz && (createdBiz._id || createdBiz.id)) {
    const bId = (createdBiz._id || createdBiz.id).toString();
    localStorage.setItem("businessId", bId);
    localStorage.setItem("business", JSON.stringify(createdBiz));
  }
  return response.data;
};

// Logged-in vendor ka business fetch karne ke liye
export const getMyBusiness = async () => {
  const response = await api.get("/businesses/me");
  console.log("getMyBusiness raw response:", response);
  console.log("getMyBusiness data:", response.data);
  return response.data;
};

export const getMyBusinesses = getMyBusiness;

// Business profile update karne ke liye
export const updateMyBusiness = async (businessId, data) => {
  const response = await api.put(`/businesses/${businessId}`, data);
  return response.data;
};

export const updateBusiness = updateMyBusiness;

export const getOnboardingStatus = async () => {
  const response = await api.get("/businesses/onboarding/status");
  return response.data;
};

export const saveOnboardingStep = async (payload) => {
  const response = await api.post("/businesses/onboarding/step", payload);
  return response.data;
};
