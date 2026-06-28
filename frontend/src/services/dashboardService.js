import { apiRequest } from "@/services/api";

export function getDashboard() {
  return apiRequest("/dashboard");
}
