import { apiRequest } from "@/services/api";

export function getMarketIndexes() {
  return apiRequest("/market/indexes", { auth: false });
}

export function getMarketStocks() {
  return apiRequest("/market/stocks", { auth: false });
}

export function getMarketStock(symbol) {
  return apiRequest("/market/stocks/" + encodeURIComponent(symbol), { auth: false });
}

export function getMarketStatus() {
  return apiRequest("/market/status", { auth: false });
}

export function searchMarketStocks(query) {
  return apiRequest("/market/search?q=" + encodeURIComponent(query), { auth: false });
}
