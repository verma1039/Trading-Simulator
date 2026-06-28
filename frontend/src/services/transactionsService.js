import { apiRequest } from "@/services/api";

export function getTransactions() {
  return apiRequest("/transactions");
}

export function createDepositRequest(payload) {
  return apiRequest("/transactions/deposit-request", {
    body: payload,
    method: "POST",
  });
}
