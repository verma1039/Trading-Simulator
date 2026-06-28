import { apiRequest } from "@/services/api";

export function getAdminDashboard() {
  return apiRequest("/admin/dashboard");
}

export function getAdminUsers() {
  return apiRequest("/admin/users");
}

export function approveDeposit(depositId) {
  return apiRequest("/admin/deposit/approve", {
    body: { depositId },
    method: "POST",
  });
}

export function rejectDeposit(depositId) {
  return apiRequest("/admin/deposit/reject", {
    body: { depositId },
    method: "POST",
  });
}

export function suspendUser(userId) {
  return apiRequest("/admin/users/suspend", {
    body: { userId },
    method: "POST",
  });
}

export function activateUser(userId) {
  return apiRequest("/admin/users/activate", {
    body: { userId },
    method: "POST",
  });
}
