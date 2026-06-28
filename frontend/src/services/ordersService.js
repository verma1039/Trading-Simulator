import { apiRequest } from "@/services/api";

export function buyOrder(payload) {
  return apiRequest("/orders/buy", {
    body: payload,
    method: "POST",
  });
}

export function sellOrder(payload) {
  return apiRequest("/orders/sell", {
    body: payload,
    method: "POST",
  });
}
