import { apiRequest } from "@/services/api";

export function getProfile() {
  return apiRequest("/profile");
}

export function updateProfile(payload) {
  return apiRequest("/profile", {
    body: payload,
    method: "PUT",
  });
}
