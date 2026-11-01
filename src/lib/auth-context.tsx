"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { apiUrl } from "@/lib/api";
import { isSuperAdminEmail } from "@/lib/admin";
import { clearToken, getToken, setToken } from "@/lib/auth-storage";
import { createClient } from "@/lib/supabase/client";

export type AppUser = {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  isSuperAdmin: boolean;
  isTeacher: boolean;
};

type AuthContextType = {
  user: AppUser | null;
  loading: boolean;
  authConfigured: boolean;
  /** @deprecated use authConfigured */
  googleConfigured: boolean;
  isSuperAdmin: boolean;
  isTeacher: boolean;
  signInWithEmail: (email: string, password: string) => Promise<AppUser>;
  signUpWithEmail: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<{ user: AppUser | null; needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapFromSessionUser(
  raw: {
    id: string;
    email?: string | null;
    user_metadata?: Record<string, unknown>;
  },
  roles?: { isSuperAdmin?: boolean; isTeacher?: boolean }
): AppUser {
  const email = (raw.email || "").trim().toLowerCase();
  const meta = raw.user_metadata || {};
  const displayName =
    String(meta.display_name || meta.full_name || meta.name || "").trim() ||
    email.split("@")[0] ||
    "Student";
  return {
    uid: raw.id,
    email,
    displayName,
    photoURL: (meta.avatar_url as string) || (meta.picture as string) || null,
    isSuperAdmin: Boolean(roles?.isSuperAdmin ?? isSuperAdminEmail(email)),
    isTeacher: Boolean(roles?.isTeacher),
  };
}

async function fetchRoles(token: string): Promise<{
  isSuperAdmin: boolean;
  isTeacher: boolean;
}> {
  try {
    const res = await fetch(apiUrl("/api/auth/me"), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      return { isSuperAdmin: false, isTeacher: false };
    }
    const data = await res.json();
    return {
      isSuperAdmin: Boolean(data.user?.isSuperAdmin),
      isTeacher: Boolean(data.user?.isTeacher),
    };
  } catch {
    return { isSuperAdmin: false, isTeacher: false };
  }
}

async function trackSignIn(token: string): Promise<void> {
  try {
    await fetch(apiUrl("/api/auth/track-signin"), {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // non-blocking
  }
}

async function hydrateUser(session: Session | null): Promise<AppUser | null> {
  if (!session?.user || !session.access_token) return null;
  setToken(session.access_token);
  const roles = await fetchRoles(session.access_token);
  return mapFromSessionUser(session.user, roles);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const authConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const loadSession = useCallback(async () => {
    setLoading(true);
    try {
      if (!authConfigured) {
        setUser(null);
        return;
      }
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      const next = await hydrateUser(data.session);
      setUser(next);
      if (!next) clearToken();
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [authConfigured]);

  useEffect(() => {
    void loadSession();
    if (!authConfigured) return;

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void (async () => {
        const next = await hydrateUser(session);
        setUser(next);
        if (!next) clearToken();
        setLoading(false);
      })();
    });

    return () => subscription.unsubscribe();
  }, [authConfigured, loadSession]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw error;
    if (!data.session) throw new Error("Sign-in failed — no session returned.");
    const me = await hydrateUser(data.session);
    if (!me) throw new Error("Sign-in failed.");
    await trackSignIn(data.session.access_token);
    setUser(me);
    return me;
  }, []);

  const signUpWithEmail = useCallback(
    async (email: string, password: string, displayName?: string) => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            display_name: displayName?.trim() || email.split("@")[0],
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;

      if (data.session) {
        const me = await hydrateUser(data.session);
        if (me) {
          await trackSignIn(data.session.access_token);
          setUser(me);
        }
        return { user: me, needsEmailConfirmation: false };
      }

      return { user: null, needsEmailConfirmation: true };
    },
    []
  );

  const signOut = useCallback(async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    clearToken();
    setUser(null);
    window.location.href = "/auth/signin";
  }, []);

  const refreshSession = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      const next = await hydrateUser(data.session);
      setUser(next);
      if (!next) clearToken();
    } catch {
      clearToken();
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      authConfigured,
      googleConfigured: authConfigured,
      isSuperAdmin: Boolean(user?.isSuperAdmin),
      isTeacher: Boolean(user?.isTeacher),
      signInWithEmail,
      signUpWithEmail,
      signOut,
      refreshSession,
    }),
    [
      user,
      loading,
      authConfigured,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      refreshSession,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
