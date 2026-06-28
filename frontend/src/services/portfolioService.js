import { apiRequest } from "@/services/api";

export function getPortfolio() {
  return apiRequest("/portfolio");
}
