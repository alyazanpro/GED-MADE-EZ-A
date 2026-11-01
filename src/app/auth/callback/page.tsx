"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { setToken } from "@/lib/auth-storage";
import { Button } from "@/components/ui";

function AuthCallbackInner() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const supabase = createClient();
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (data.session?.access_token) {
          setToken(data.session.access_token);
          if (!cancelled) window.location.replace("/dashboard");
          return;
        }

        // Email confirmation / magic-link style codes in hash or query
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        if (code) {
          const { data: exchanged, error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
          if (exchanged.session?.access_token) {
            setToken(exchanged.session.access_token);
            if (!cancelled) window.location.replace("/dashboard");
            return;
          }
        }

        if (!cancelled) {
          setError("No active session. Please sign in again.");
        }
      } catch {
        if (!cancelled) {
          setError("Failed to complete sign-in. Please try again.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (error) {
    return (
      <>
        <p className="text-red-400">{error}</p>
        <Link href="/auth/signin">
          <Button className="mt-5">Back to login</Button>
        </Link>
      </>
    );
  }

  return (
    <>
      <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-[var(--lp-green,#6ee7b7)]" />
      <p className="text-white/80">Completing sign-in…</p>
    </>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass w-full max-w-md rounded-2xl p-8 text-center">
        <Suspense
          fallback={
            <>
              <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-[var(--lp-green,#6ee7b7)]" />
              <p className="text-white/80">Completing sign-in…</p>
            </>
          }
        >
          <AuthCallbackInner />
        </Suspense>
      </div>
    </div>
  );
}
