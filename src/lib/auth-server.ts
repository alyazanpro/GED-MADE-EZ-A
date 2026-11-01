import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export type AppUser = {
  id: string;
  email: string;
  name: string;
  picture: string;
};

export function normalizeEmail(email: string | null | undefined): string {
  return (email || "").trim().toLowerCase();
}

export function authConfig() {
  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "",
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "",
    frontendUrl: process.env.FRONTEND_URL?.trim() || "http://localhost:3000",
  };
}

export function supabaseConfigured(): boolean {
  const c = authConfig();
  return Boolean(c.supabaseUrl && c.supabaseAnonKey);
}

/** Verify a Supabase access token and return the app user. */
export async function decodeAccessToken(token: string): Promise<AppUser> {
  const { supabaseUrl, supabaseAnonKey } = authConfig();
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase is not configured.");
  }

  const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    throw new Error("Invalid or expired session.");
  }

  const email = normalizeEmail(data.user.email);
  if (!email) {
    throw new Error("Account has no email address.");
  }

  const meta = data.user.user_metadata || {};
  return {
    id: data.user.id,
    email,
    name:
      String(meta.display_name || meta.full_name || meta.name || "").trim() ||
      email.split("@")[0],
    picture: String(meta.avatar_url || meta.picture || ""),
  };
}

export function userToAppUser(user: AppUser) {
  return {
    uid: user.id,
    email: user.email,
    displayName: user.name,
    photoURL: user.picture || null,
  };
}
