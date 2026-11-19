import { useEffect, useRef, useState, type FormEvent } from "react";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  Check,
  Command,
  CornerDownLeft,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import {
  askRicoLauncher,
  confirmLauncherQuote,
  type LauncherQuote,
} from "./launcherClient";

const QUICK_PROMPTS = [
  "Check my AWS & SaaS spend",
  "Set a $20/mo cap on Cursor",
  "Compare Netflix and Spotify",
  "Find startup credits for AI founders",
];

function isMacPlatform(): boolean {
  return (
    typeof navigator !== "undefined" &&
    /mac/i.test(navigator.platform || navigator.userAgent)
  );
}

export function CommandLauncher() {
  const [query, setQuery] = useState("");
  const [running, setRunning] = useState(false);
  const [replyText, setReplyText] = useState<string | null>(null);
  const [quote, setQuote] = useState<LauncherQuote | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const shortcutHint = isMacPlatform() ? "⌘⇧R" : "Ctrl+Shift+R";

  const hideLauncher = async () => {
    try {
      await getCurrentWindow().hide();
    } catch {
      // Safe no-op outside Tauri runtime
    }
  };

  useEffect(() => {
    inputRef.current?.focus();

    let unlisten: (() => void) | undefined;
    void listen("launcher:opened", () => {
      setError(null);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 20);
    })
      .then((fn) => {
        unlisten = fn;
      })
      .catch(() => {});

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        void hideLauncher();
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      unlisten?.();
    };
  }, []);

  const runPrompt = async (promptText: string) => {
    const trimmed = promptText.trim();
    if (!trimmed || running) return;

    setRunning(true);
    setError(null);
    setReplyText(null);
    setQuote(null);

    try {
      const reply = await askRicoLauncher(trimmed);
      setReplyText(reply.text);
      setQuote(reply.quote ?? null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not reach Rico agent."
      );
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await runPrompt(query);
  };

  const handleConfirmQuote = async () => {
    if (!quote || confirming) return;
    setConfirming(true);
    setError(null);
    try {
      const message = await confirmLauncherQuote(quote.confirmToken);
      setReplyText(message);
      setQuote(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Confirmation failed.");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[#DCE7F3] bg-white text-[#0F172A] shadow-2xl">
      {/* Top Spotlight Input Bar */}
      <form
        onSubmit={handleSubmit}
        data-tauri-drag-region
        className="flex items-center gap-2.5 border-b border-[#E2ECF6] bg-white px-4 py-3"
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#2563EB] text-white shadow-sm">
          {running ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Command className="h-4 w-4" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Ask Rico… e.g. "Check my AWS spend" or "Cap Cursor at $20/mo"'
          className="flex-1 bg-transparent text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none"
        />

        <button
          type="submit"
          disabled={running || !query.trim()}
          className="flex items-center gap-1 rounded-lg bg-[#0F172A] px-2.5 py-1.5 text-[11px] font-medium text-white transition hover:bg-[#1E293B] disabled:opacity-40"
        >
          Run
          <CornerDownLeft className="h-3 w-3" />
        </button>

        <button
          type="button"
          onClick={() => void hideLauncher()}
          title="Close launcher (Esc)"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#64748B] transition hover:bg-[#F1F5F9] hover:text-[#0F172A]"
        >
          <X className="h-4 w-4" />
        </button>
      </form>

      {/* Body: Response, Two-Step Payment Quote, or Quick Suggestions */}
      <div className="flex flex-1 flex-col justify-between overflow-y-auto bg-[#F8FAFC] p-3.5">
        {error ? (
          <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-3 text-xs leading-relaxed text-[#B91C1C]">
            {error}
          </div>
        ) : replyText ? (
          <div className="space-y-2.5">
            <div className="rounded-xl border border-[#DCE7F3] bg-white p-3 text-xs leading-relaxed text-[#0F172A] shadow-sm whitespace-pre-wrap">
              {replyText}
            </div>

            {quote && (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-3">
                <div className="text-xs">
                  <p className="font-semibold text-[#0F172A]">
                    Confirm {quote.service} — ${quote.amount.toFixed(2)}{" "}
                    {quote.currency}
                  </p>
                  <p className="text-[11px] text-[#52637A]">
                    Cap ${quote.budgetCeiling.toFixed(2)} · {quote.periodLabel}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={confirming}
                  onClick={() => void handleConfirmQuote()}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#2563EB] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#1D4ED8] disabled:opacity-60"
                >
                  {confirming ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  Confirm Pay
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 px-1 text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
              <Sparkles className="h-3 w-3 text-[#2563EB]" />
              Quick Commands
            </p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_PROMPTS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  disabled={running}
                  onClick={() => {
                    setQuery(suggestion);
                    void runPrompt(suggestion);
                  }}
                  className="rounded-xl border border-[#DCE7F3] bg-white px-3 py-2 text-left text-xs font-medium text-[#334155] transition hover:border-[#93C5FD] hover:bg-[#EFF6FF] hover:text-[#1D4ED8]"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Hint */}
      <footer className="flex items-center justify-between border-t border-[#E2ECF6] bg-white px-4 py-2 text-[11px] text-[#64748B]">
        <span>Global Shortcut: {shortcutHint}</span>
        <span>Press Esc to dismiss</span>
      </footer>
    </div>
  );
}
