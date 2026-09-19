import { apiClient } from "./client";

export const register = async (payload) => {
  return await apiClient("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};