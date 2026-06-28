import { getSupabaseSession } from "@/lib/supabaseClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function apiRequest(path, options = {}) {
  const { auth = true, body, headers, method = "GET" } = options;

  if (!API_BASE_URL) {
    throw new Error("VITE_API_BASE_URL is required.");
  }

  const session = auth ? await getSupabaseSession() : null;
  if (auth && !session?.access_token) {
    throw new Error("Authentication required.");
  }

  const response = await fetch(API_BASE_URL + path, {
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(auth && session?.access_token ? { Authorization: "Bearer " + session.access_token } : {}),
      ...headers,
    },
    method,
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    const message = payload?.message || payload?.detail || "Request failed.";
    throw new Error(Array.isArray(message) ? message.map((item) => item.msg).join(" ") : message);
  }

  if (payload?.success === false) {
    throw new Error(payload.message || "Request failed.");
  }

  if (payload?.success === true) {
    return payload.data;
  }

  return payload;
}
