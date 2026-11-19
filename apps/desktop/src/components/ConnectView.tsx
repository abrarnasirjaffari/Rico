import { useState, type FormEvent } from "react";
import { Loader2, Server, Sparkles } from "lucide-react";
import type { RicoUser } from "../lib/ricoClient";
import { loginWithDemo, loginWithEmail, saveServerUrl } from "../lib/ricoClient";

interface ConnectViewProps {
  serverUrl: string;
  onServerUrlChange: (url: string) => void;
  onAuthenticated: (user: RicoUser, activeServerUrl: string) => void;
}

export function ConnectView({
  serverUrl,
  onServerUrlChange,
  onAuthenticated,
}: ConnectViewProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loadingMode, setLoadingMode] = useState<"demo" | "email" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDemoLogin = async () => {
    setError(null);
    setLoadingMode("demo");
    try {
      const normalized = saveServerUrl(serverUrl);
      onServerUrlChange(normalized);
      const user = await loginWithDemo(normalized);
      onAuthenticated(user, normalized);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not reach Rico server. Is it running?"
      );
    } finally {
      setLoadingMode(null);
    }
  };

  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Enter your email address to sign in.");
      return;
    }
    setError(null);
    setLoadingMode("email");
    try {
      const normalized = saveServerUrl(serverUrl);
      onServerUrlChange(normalized);
      const user = await loginWithEmail(normalized, email, password || undefined);
      onAuthenticated(user, normalized);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Sign-in failed. Check server URL and credentials."
      );
    } finally {
      setLoadingMode(null);
    }
  };

  return (
    <div className="flex flex-1 flex-col justify-between gap-3 p-4">
      <div className="space-y-3">
        <div className="rounded-2xl border border-[#DCE7F3] bg-white p-3.5 shadow-sm">
          <label
            htmlFor="rico-server-url"
            className="flex items-center gap-1.5 text-[11px] font-medium text-[#52637A]"
          >
            <Server className="h-3.5 w-3.5 text-[#2563EB]" />
            Rico Server URL
          </label>
          <input
            id="rico-server-url"
            type="url"
            value={serverUrl}
            onChange={(e) => onServerUrlChange(e.target.value)}
            placeholder="http://localhost:3000"
            className="mt-1.5 w-full rounded-lg border border-[#DCE7F3] bg-[#F8FAFC] px-2.5 py-1.5 font-mono text-xs text-[#0F172A] outline-none transition focus:border-[#2563EB] focus:bg-white"
          />
        </div>

        <form
          onSubmit={handleEmailLogin}
          className="space-y-2.5 rounded-2xl border border-[#DCE7F3] bg-white p-3.5 shadow-sm"
        >
          <div>
            <p className="text-xs font-semibold text-[#0F172A]">
              Connect your workspace
            </p>
            <p className="mt-0.5 text-[11px] text-[#52637A]">
              Sign in to monitor monthly burn &amp; approve held charges.
            </p>
          </div>

          <div className="space-y-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-lg border border-[#DCE7F3] bg-[#F8FAFC] px-2.5 py-1.5 text-xs text-[#0F172A] outline-none transition focus:border-[#2563EB] focus:bg-white"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (optional in local dev mode)"
              className="w-full rounded-lg border border-[#DCE7F3] bg-[#F8FAFC] px-2.5 py-1.5 text-xs text-[#0F172A] outline-none transition focus:border-[#2563EB] focus:bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={loadingMode !== null}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#0F172A] px-3 py-2 text-xs font-medium text-white transition hover:bg-[#1E293B] disabled:opacity-60"
          >
            {loadingMode === "email" && (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            )}
            Sign In
          </button>
        </form>

        {error && (
          <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-[11px] leading-snug text-[#B91C1C]">
            {error}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleDemoLogin}
        disabled={loadingMode !== null}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-2.5 text-xs font-semibold text-[#1D4ED8] transition hover:bg-[#DBEAFE] disabled:opacity-60"
      >
        {loadingMode === "demo" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Sparkles className="h-3.5 w-3.5" />
        )}
        1-Click Demo Evaluator Sign-In
      </button>
    </div>
  );
}
