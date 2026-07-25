"use client";

import { useAuth } from "@/features/auth/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Briefcase, ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function LoginPage() {
  const { user, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (user) {
      router.push("/applications");
    }
  }, [user, router]);

  const handleSignIn = async () => {
    try {
      setSigningIn(true);
      await signInWithGoogle();
    } catch (error) {
      console.error("Authentication failed", error);
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--bg)] relative">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="max-w-sm w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 shadow-xl shadow-black/5 text-center space-y-6">
        <div className="w-12 h-12 bg-[var(--accent-soft)] rounded-2xl flex items-center justify-center mx-auto text-[var(--accent)]">
          <Briefcase className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[var(--ink)] tracking-tight">ApplyDesk</h1>
          <p className="text-sm text-[var(--ink-soft)] leading-relaxed">
            Your personal job-application command center. Tailor, send, and track applications from your own Gmail.
          </p>
        </div>

        <button
          onClick={handleSignIn}
          disabled={signingIn}
          className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-lg bg-[var(--accent)] text-white font-medium hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-md shadow-[var(--accent)]/20"
        >
          {signingIn ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>Sign in with Google</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <p className="text-xs text-[var(--ink-soft)] font-mono">
          Single-user secure authorization
        </p>
      </div>
    </div>
  );
}
