"use client";

import React, { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";

/** Minimal login/signup modal. Credentials live only in this component's state while typing. */
export function AuthModal() {
  const { authPrompt, closeAuthPrompt, login, signup, demoLogin } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<"form" | "demo" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!authPrompt.open) {
      setPassword("");
      setError(null);
      setBusy(null);
    }
  }, [authPrompt.open]);

  if (!authPrompt.open) return null;

  const switchMode = (next: "login" | "signup") => {
    setMode(next);
    setError(null);
    setNotice(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setNotice(null);
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    if (mode === "signup" && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setBusy("form");
    if (mode === "login") {
      const result = await login(email.trim(), password);
      setBusy(null);
      if (result.success) closeAuthPrompt();
      else setError(result.error ?? "Sign-in failed.");
      return;
    }
    const result = await signup(email.trim(), password);
    setBusy(null);
    if (!result.success) {
      setError(result.error ?? "Sign-up failed.");
    } else if (result.needsEmailConfirmation) {
      setPassword("");
      setMode("login");
      setNotice(
        `We sent a confirmation link to ${email.trim()}. Open it to verify your email, then sign in here.`
      );
    } else {
      closeAuthPrompt();
    }
  };

  const handleDemo = async () => {
    if (busy) return;
    setError(null);
    setBusy("demo");
    const result = await demoLogin();
    setBusy(null);
    if (result.success) closeAuthPrompt();
    else setError(result.error ?? "Demo sign-in failed.");
  };

  const inputClass =
    "w-full h-9 px-3 rounded-lg border border-[#D6D3D1] bg-white text-sm text-[#1E1B1B] placeholder:text-[#8A8585] outline-none focus:border-[#034CFF] focus:ring-2 focus:ring-[#034CFF]/20 transition-colors duration-100";

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[#131010]/40 backdrop-blur-[2px] p-4"
      onClick={closeAuthPrompt}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rico-auth-title"
        className="w-full max-w-sm rounded-xl border border-[#E6E4E3] bg-[#FCFCFC] p-5 shadow-2xl font-[Inter,system-ui,sans-serif]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-3.5">
          <h2
            id="rico-auth-title"
            className="text-base font-semibold text-[#1E1B1B] tracking-[-0.015em]"
          >
            {mode === "login" ? "Sign in to Rico" : "Create your Rico account"}
          </h2>
          <button
            type="button"
            onClick={closeAuthPrompt}
            className="p-1 rounded-md text-[#5C5858] hover:text-[#1E1B1B] hover:bg-[#F1EFEF] transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {authPrompt.reason && !notice && (
          <p className="mb-3 text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            {authPrompt.reason}
          </p>
        )}
        {notice && (
          <p className="mb-3 text-xs text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            {notice}
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="space-y-1">
            <label
              htmlFor="rico-auth-email"
              className="block text-xs font-medium text-[#5C5858]"
            >
              Email
            </label>
            <input
              id="rico-auth-email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              disabled={busy !== null}
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="rico-auth-password"
              className="block text-xs font-medium text-[#5C5858]"
            >
              Password
            </label>
            <input
              id="rico-auth-password"
              type="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              disabled={busy !== null}
            />
          </div>

          {error && (
            <p
              role="alert"
              className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
            >
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy !== null}
            className="h-9 rounded-lg bg-[#1E1B1B] text-white text-sm font-medium hover:bg-[#332F2F] disabled:opacity-60 flex items-center justify-center gap-2 transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
          >
            {busy === "form" && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="mt-3 text-xs text-[#5C5858] text-center">
          {mode === "login" ? "No account yet? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => switchMode(mode === "login" ? "signup" : "login")}
            className="font-medium text-[#034CFF] hover:underline focus-visible:outline-none"
            disabled={busy !== null}
          >
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>

        <div className="mt-4 pt-3 border-t border-[#E6E4E3]">
          <button
            type="button"
            onClick={handleDemo}
            disabled={busy !== null}
            className="w-full h-8 rounded-lg border border-[#D6D3D1] bg-[#F8F7F7] text-xs font-medium text-[#1E1B1B] hover:bg-[#EFECEB] disabled:opacity-60 flex items-center justify-center gap-2 transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
          >
            {busy === "demo" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Continue in demo sandbox (mock payments)
          </button>
        </div>
      </div>
    </div>
  );
}
