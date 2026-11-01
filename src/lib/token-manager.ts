import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { authConfig } from "./auth-server";
import { AuthenticationError } from "./api-error-handler";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenPair> {
  const { supabaseUrl, supabaseAnonKey } = authConfig();
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new AuthenticationError("Supabase is not configured.");
  }

  const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken
  });

  if (error || !data.session) {
    throw new AuthenticationError("Token refresh failed. Please sign in again.");
  }

  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresAt: data.session.expires_at || Date.now() + 3600000 // Default 1 hour
  };
}

export async function verifyToken(token: string): Promise<boolean> {
  try {
    const { supabaseUrl, supabaseAnonKey } = authConfig();
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return false;
    }

    const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    const { data, error } = await supabase.auth.getUser(token);
    return !error && !!data.user;
  } catch {
    return false;
  }
}

export function getTokenExpiration(token: string): number | null {
  try {
    // JWT tokens have base64 encoded payload
    const payload = token.split('.')[1];
    if (!payload) return null;
    
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
    return decoded.exp ? decoded.exp * 1000 : null; // Convert to milliseconds
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string, bufferMs: number = 30000): boolean {
  const expiration = getTokenExpiration(token);
  if (!expiration) return true;
  
  return Date.now() + bufferMs >= expiration;
}

export async function getValidToken(
  accessToken: string,
  refreshToken: string
): Promise<string> {
  // Check if access token is still valid (with 30 second buffer)
  if (!isTokenExpired(accessToken, 30000)) {
    return accessToken;
  }

  // Refresh the token
  const tokens = await refreshAccessToken(refreshToken);
  return tokens.accessToken;
}
