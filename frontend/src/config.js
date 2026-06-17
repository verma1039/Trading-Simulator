export const API_BASE_URL = normalizeUrl(
  getRequiredEnv("VITE_API_BASE_URL", import.meta.env.VITE_API_BASE_URL),
);

export const WS_BASE_URL = normalizeUrl(
  getRequiredEnv("VITE_WS_BASE_URL", import.meta.env.VITE_WS_BASE_URL),
);

function getRequiredEnv(name, value) {
  if (!value) {
    throw new Error(name + " is required");
  }

  return value;
}

function normalizeUrl(value) {
  return value.replace(/\/$/, "");
}
