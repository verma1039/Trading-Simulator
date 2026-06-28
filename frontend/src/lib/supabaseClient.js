import { createClient } from "@supabase/supabase-js";

let client = null;

export function getSupabaseClient() {
  if (client) {
    return client;
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required.");
  }

  client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: false,
      persistSession: true,
    },
  });

  return client;
}

export async function getSupabaseSession() {
  const { data, error } = await getSupabaseClient().auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  return data.session;
}
