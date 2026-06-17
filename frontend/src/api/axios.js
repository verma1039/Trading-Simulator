import axios from "axios";
import { API_BASE_URL } from "../config";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(async (config) => {
  if (!isSupabaseConfigured || !supabase) {
    return config;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }

  return config;
});

export default api;
