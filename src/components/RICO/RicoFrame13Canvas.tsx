"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ArrowUp,
  Blocks,
  BookOpen,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  FileText,
  Image as ImageIcon,
  Languages,
  Loader2,
  LogIn,
  LogOut,
  Moon,
  PanelLeft,
  Paperclip,
  Plus,
  Search,
  Settings,
  Sun,
  User,
  ShieldCheck,
  ShieldAlert,
  CreditCard,
  Crosshair,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Mandate, Transaction, AuditLog } from "@/components/dashboard/types";
import { ReceiptData } from "@/components/dashboard/ReceiptDialog";
import { ApprovalRequest } from "@/components/dashboard/ApprovalDialog";
import type { InspectedElementChip } from "@/lib/browser/types";
import {
  ChatMessage,
  BrowserActionItem,
} from "@/lib/chat/use-payagent-chat";
import { ChatMessageRenderer } from "@/components/chat/ChatMessageRenderer";
import { McpConnectPanel } from "@/components/dashboard/McpConnectPanel";
import { AppStorePanel } from "@/components/dashboard/AppStorePanel";
import { PriceSentinelPanel } from "@/components/dashboard/PriceSentinelPanel";
import { ContractWatchdogPanel } from "@/components/dashboard/ContractWatchdogPanel";
import { RicoSpendingView } from "./RicoSpendingView";
import {
  DEFAULT_RICO_PROFILE,
  RicoEnterpriseSettings,
  type ModelOption,
  type ModelProvider,
  type RicoUserProfile,
} from "./RicoEnterpriseSettings";
import { useAuth } from "@/lib/auth/AuthContext";
import { RicoSplitWorkspace } from "./RicoSplitWorkspace";
import type {
  SplitSurfaceTool,
  SplitWorkspaceSnapshot,
  WorkspaceActionEvent,
} from "@/lib/rico-workspace/types";

const LANGUAGE_OPTIONS = [
  { code: "en", short: "EN", label: "English (US)" },
  { code: "es", short: "ES", label: "Español" },
  { code: "fr", short: "FR", label: "Français" },
  { code: "de", short: "DE", label: "Deutsch" },
  { code: "ja", short: "JA", label: "日本語" },
] as const;

const WEBSITE_BASE_URL =
  process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3001";

function ProfileMenu({
  collapsed,
  profile,
  language,
  onSelectLanguage,
  onOpenSettings,
  onOpenCommandPalette,
}: {
  collapsed: boolean;
  profile: RicoUserProfile;
  language: string;
  onSelectLanguage: (code: string) => void;
  onOpenSettings: () => void;
  onOpenCommandPalette?: () => void;
}) {
  const {
    user,
    session,
    isAuthenticated,
    isLoading,
    openAuthPrompt,
    demoLogin,
    logout,
  } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [activeDialog, setActiveDialog] = useState<"help" | "learn" | null>(
    null
  );
  const [loggingOut, setLoggingOut] = useState(false);
  const [startingDemo, setStartingDemo] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme, setTheme } = useTheme();
  const [themeMounted, setThemeMounted] = useState(false);

  useEffect(() => {
    setThemeMounted(true);
  }, []);

  const isDarkTheme = themeMounted && resolvedTheme === "dark";

  useEffect(() => {
    if (!menuOpen && !activeDialog) return;
    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuOpen && menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false);
        setLanguageOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (activeDialog) {
          setActiveDialog(null);
        } else {
          setMenuOpen(false);
          setLanguageOpen(false);
        }
      }
    };
    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen, activeDialog]);

  const handleClick = () => {
    setMenuOpen((open) => {
      const next = !open;
      if (!next) setLanguageOpen(false);
      return next;
    });
  };

  const handleChooseLanguage = (code: string) => {
    onSelectLanguage(code);
    setLanguageOpen(false);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    window.location.reload();
  };

  const handleQuickDemo = async () => {
    if (startingDemo) return;
    setStartingDemo(true);
    await demoLogin();
    setStartingDemo(false);
  };

  const currentLang =
    LANGUAGE_OPTIONS.find((opt) => opt.code === language) ??
    LANGUAGE_OPTIONS[0];

  const fullName = [profile.firstName, profile.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const profileInitials =
    `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase() ||
    (isAuthenticated && user ? user.email.charAt(0).toUpperCase() : "");

  const menuItemClass =
    "w-full px-2.5 py-2 rounded-xl text-[13px] text-[oklch(0.097_0_0)] hover:bg-[oklch(0.097_0_0_/_0.05)] flex items-center gap-2.5 text-left transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20";

  return (
    <div ref={menuRef} className="relative w-full space-y-1">
      {!isAuthenticated && !isLoading && !collapsed && (
        <button
          type="button"
          onClick={handleQuickDemo}
          disabled={startingDemo}
          className="w-full h-7 px-2.5 rounded-[8px] bg-[var(--rico-iui-canvas)] hover:bg-[var(--rico-iui-hover)] border border-[var(--rico-iui-border-strong)] text-[11.5px] font-medium text-[var(--rico-iui-ink)] flex items-center justify-center gap-1.5 transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0285ff]/40"
        >
          {startingDemo && <Loader2 className="w-3 h-3 animate-spin" />}
          <span>Start demo sandbox</span>
        </button>
      )}

      {collapsed ? (
        <button
          type="button"
          onClick={handleClick}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          title={
            fullName ||
            (isAuthenticated && user ? `Signed in as ${user.email}` : "Profile")
          }
          aria-label={isAuthenticated ? "Account menu" : "Profile"}
          className={`w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-[12px] font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0285ff]/40 ${
            profile.avatarUrl
              ? "border border-[var(--rico-iui-border)] bg-[var(--rico-iui-surface)] hover:opacity-90"
              : isAuthenticated || profileInitials
                ? "bg-[var(--rico-primary-bg)] text-[var(--rico-primary-fg)] hover:opacity-85"
                : "bg-[var(--rico-iui-surface)] text-[var(--rico-iui-ink)] hover:bg-[var(--rico-iui-pressed)]"
          }`}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatarUrl}
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover"
            />
          ) : profileInitials ? (
            profileInitials
          ) : (
            <User className="w-[18px] h-[18px] stroke-[2]" aria-hidden="true" />
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          title={
            fullName ||
            (isAuthenticated && user ? `Signed in as ${user.email}` : "Profile")
          }
          aria-label={isAuthenticated ? "Account menu" : "Profile"}
          className="w-full h-9 px-2.5 rounded-[9px] flex items-center gap-2.5 text-[13px] font-medium text-[var(--rico-iui-ink)] hover:bg-[var(--rico-iui-hover)] transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0285ff]/40"
        >
          <span
            className={`w-6 h-6 rounded-full overflow-hidden flex items-center justify-center text-[10.5px] font-semibold shrink-0 ${
              profile.avatarUrl
                ? "border border-[var(--rico-iui-border)] bg-[var(--rico-iui-surface)]"
                : isAuthenticated || profileInitials
                  ? "bg-[var(--rico-primary-bg)] text-[var(--rico-primary-fg)]"
                  : "bg-[var(--rico-iui-canvas)] border border-[var(--rico-iui-border-strong)] text-[var(--rico-iui-muted)]"
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarUrl}
                alt=""
                aria-hidden="true"
                className="w-full h-full object-cover"
              />
            ) : profileInitials ? (
              profileInitials
            ) : (
              <User className="w-3.5 h-3.5 stroke-[2]" />
            )}
          </span>
          <span className="truncate text-left flex-1">
            {fullName ||
              (isAuthenticated && user
                ? session?.isSimulated
                  ? "Demo sandbox"
                  : user.email
                : "Profile")}
          </span>
        </button>
      )}

      {menuOpen && (
        <div
          role="menu"
          aria-label="Profile menu"
          className="absolute left-0 bottom-10 z-50 w-60 rounded-2xl border border-black/[0.08] bg-white p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.1)]"
        >
          {(fullName || (isAuthenticated && user)) && (
            <div className="px-2.5 pt-1.5 pb-2 mb-1 border-b border-black/[0.06]">
              {fullName && (
                <p className="text-xs font-semibold text-[#1E1B1B] truncate m-0">
                  {fullName}
                </p>
              )}
              {(profile.email || user?.email) && (
                <p
                  className="text-[11px] text-[#5C5858] truncate m-0 mt-0.5"
                  title={profile.email || user?.email}
                >
                  {profile.email || user?.email}
                </p>
              )}
              {session?.isSimulated && (
                <p className="mt-1.5 mb-0 text-[10.5px] text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2 py-0.5">
                  Sandbox session: mock payments only
                </p>
              )}
            </div>
          )}

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              setLanguageOpen(false);
              onOpenSettings();
            }}
            className={menuItemClass}
          >
            <Settings
              className="w-4 h-4 text-[oklch(0.097_0_0_/_0.7)] shrink-0 stroke-[1.9]"
              aria-hidden="true"
            />
            <span className="flex-1 font-normal">Settings</span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setTheme(isDarkTheme ? "light" : "dark");
            }}
            className={menuItemClass}
          >
            {isDarkTheme ? (
              <Moon
                className="w-4 h-4 text-[oklch(0.097_0_0_/_0.7)] shrink-0 stroke-[1.9]"
                aria-hidden="true"
              />
            ) : (
              <Sun
                className="w-4 h-4 text-[oklch(0.097_0_0_/_0.7)] shrink-0 stroke-[1.9]"
                aria-hidden="true"
              />
            )}
            <span className="flex-1 font-normal">Appearance</span>
            <span className="text-[11px] font-medium text-[#8A8585]">
              {isDarkTheme ? "Dark" : "Light"}
            </span>
          </button>

          <button
            type="button"
            role="menuitem"
            aria-expanded={languageOpen}
            onClick={() => setLanguageOpen((v) => !v)}
            className={menuItemClass}
          >
            <Languages
              className="w-4 h-4 text-[oklch(0.097_0_0_/_0.7)] shrink-0 stroke-[1.9]"
              aria-hidden="true"
            />
            <span className="flex-1 font-normal">Language</span>
            <span className="text-[11px] font-medium text-[#8A8585]">
              {currentLang.short}
            </span>
            <ChevronRight
              className={`w-3.5 h-3.5 text-[#8A8585] shrink-0 transition-transform duration-150 ${
                languageOpen ? "rotate-90" : ""
              }`}
              aria-hidden="true"
            />
          </button>

          {languageOpen && (
            <div
              role="group"
              aria-label="Select language"
              className="my-0.5 ml-6 mr-1 pl-2 border-l border-black/[0.08] space-y-0.5"
            >
              {LANGUAGE_OPTIONS.map((opt) => {
                const selected = opt.code === language;
                return (
                  <button
                    key={opt.code}
                    type="button"
                    role="menuitemradio"
                    aria-checked={selected}
                    onClick={() => handleChooseLanguage(opt.code)}
                    className={`w-full px-2 py-1.5 rounded-lg text-[12px] flex items-center justify-between text-left transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 ${
                      selected
                        ? "bg-[oklch(0.097_0_0_/_0.06)] font-medium text-[oklch(0.097_0_0)]"
                        : "text-[oklch(0.097_0_0_/_0.75)] hover:bg-[oklch(0.097_0_0_/_0.04)]"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {selected && (
                      <Check
                        className="w-3.5 h-3.5 text-[oklch(0.097_0_0)] shrink-0 stroke-[2]"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              setLanguageOpen(false);
              setActiveDialog("help");
            }}
            className={menuItemClass}
          >
            <CircleHelp
              className="w-4 h-4 text-[oklch(0.097_0_0_/_0.7)] shrink-0 stroke-[1.9]"
              aria-hidden="true"
            />
            <span className="flex-1 font-normal">Get help</span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              setLanguageOpen(false);
              setActiveDialog("learn");
            }}
            className={menuItemClass}
          >
            <BookOpen
              className="w-4 h-4 text-[oklch(0.097_0_0_/_0.7)] shrink-0 stroke-[1.9]"
              aria-hidden="true"
            />
            <span className="flex-1 font-normal">Learn more</span>
          </button>

          <div className="my-1 h-px bg-black/[0.06]" role="separator" />

          {isAuthenticated && user ? (
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              disabled={loggingOut}
              className={`${menuItemClass} disabled:opacity-60`}
            >
              {loggingOut ? (
                <Loader2 className="w-4 h-4 animate-spin shrink-0 text-[oklch(0.097_0_0_/_0.7)]" />
              ) : (
                <LogOut
                  className="w-4 h-4 text-[oklch(0.097_0_0_/_0.7)] shrink-0 stroke-[1.9]"
                  aria-hidden="true"
                />
              )}
              <span className="flex-1 font-normal">Log out</span>
            </button>
          ) : (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                setLanguageOpen(false);
                openAuthPrompt();
              }}
              className={menuItemClass}
            >
              <LogIn
                className="w-4 h-4 text-[oklch(0.097_0_0_/_0.7)] shrink-0 stroke-[1.9]"
                aria-hidden="true"
              />
              <span className="flex-1 font-normal">Sign in</span>
            </button>
          )}
        </div>
      )}

      {activeDialog && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-[#131010]/40 backdrop-blur-[2px] p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setActiveDialog(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="rico-profile-dialog-title"
            className="w-full max-w-md rounded-2xl border border-[#E6E4E3] bg-[#FCFCFC] p-5 shadow-2xl text-[#1E1B1B]"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2
                  id="rico-profile-dialog-title"
                  className="m-0 text-base font-semibold tracking-[-0.015em] text-[#1E1B1B]"
                >
                  {activeDialog === "help"
                    ? "Get help"
                    : "Learn more about Rico"}
                </h2>
                <p className="m-0 mt-0.5 text-xs text-[#5C5858]">
                  {activeDialog === "help"
                    ? "Shortcuts, payment safety support, and troubleshooting."
                    : "Autonomous financial operations with database-enforced guardrails."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveDialog(null)}
                aria-label="Close dialog"
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#5C5858] hover:text-[#1E1B1B] hover:bg-[oklch(0.097_0_0_/_0.05)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
              >
                <X className="w-4 h-4 stroke-[2]" aria-hidden="true" />
              </button>
            </div>

            {activeDialog === "help" && (
              <div className="space-y-3">
                <div className="rounded-xl border border-[#E6E4E3] bg-white p-3.5 space-y-2 text-xs text-[#5C5858]">
                  <p className="m-0 font-medium text-[#1E1B1B]">
                    Quick tips & shortcuts
                  </p>
                  <ul className="m-0 pl-4 space-y-1">
                    <li>
                      Press{" "}
                      <kbd className="px-1.5 py-0.5 rounded bg-[#F1EFEF] border border-[#D6D3D1] font-mono text-[11px] text-[#1E1B1B]">
                        Ctrl/⌘ + K
                      </kbd>{" "}
                      to open the command launcher from anywhere.
                    </li>
                    <li>
                      AI chat tools never capture funds directly—every charge uses
                      a two-step quote and signed confirmation token.
                    </li>
                  </ul>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  {onOpenCommandPalette && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveDialog(null);
                        onOpenCommandPalette();
                      }}
                      className="h-8 px-3 rounded-lg border border-[#D6D3D1] bg-white hover:bg-[#F1EFEF] text-xs font-medium text-[#1E1B1B] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                    >
                      Open command launcher
                    </button>
                  )}
                  <a
                    href={`${WEBSITE_BASE_URL}/support`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 px-3 rounded-lg bg-[#1E1B1B] hover:bg-[#332F2F] text-white text-xs font-medium inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/25"
                  >
                    Visit support center
                  </a>
                </div>
              </div>
            )}

            {activeDialog === "learn" && (
              <div className="space-y-3">
                <div className="rounded-xl border border-[#E6E4E3] bg-white p-3.5 space-y-1.5 text-xs text-[#5C5858] leading-relaxed">
                  <p className="m-0 font-medium text-[#1E1B1B]">
                    How Rico protects every transaction
                  </p>
                  <p className="m-0">
                    Rico pairs multi-model AI reasoning and live Playwright
                    browser verification with strict budget ceilings, &gt;20%
                    price-spike holds, and billing-period idempotency across
                    PayPal Orders v2 and vaulted backup cards.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <a
                    href={`${WEBSITE_BASE_URL}/docs`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 px-3 rounded-lg border border-[#D6D3D1] bg-white hover:bg-[#F1EFEF] text-xs font-medium text-[#1E1B1B] inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                  >
                    Read documentation
                  </a>
                  <a
                    href={WEBSITE_BASE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 px-3 rounded-lg bg-[#1E1B1B] hover:bg-[#332F2F] text-white text-xs font-medium inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/25"
                  >
                    Explore Rico website
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const MODEL_OPTIONS: ModelOption[] = [
  // RICO Smart Router (Default)
  {
    id: "rico/auto",
    label: "Auto",
    description: "Chooses the best model for the task",
    provider: "rico",
    group: "Recommended",
    badge: "Default",
  },

  // Google Gemini (Latest 2026)
  {
    id: "google/gemini-4-carbon",
    label: "Gemini 4 Carbon",
    provider: "google",
    group: "Google Gemini",
    badge: "Flagship",
  },
  {
    id: "google/gemini-4-argon",
    label: "Gemini 4 Argon",
    provider: "google",
    group: "Google Gemini",
    badge: "Reasoning",
  },
  {
    id: "google/gemini-4-hydrogen",
    label: "Gemini 4 Hydrogen",
    provider: "google",
    group: "Google Gemini",
    badge: "Fast",
  },
  {
    id: "google/gemini-4-neon",
    label: "Gemini 4 Neon",
    provider: "google",
    group: "Google Gemini",
    badge: "New",
  },
  {
    id: "google/gemini-3.8-flash",
    label: "Gemini 3.8 Flash",
    provider: "google",
    group: "Google Gemini",
  },

  // Anthropic Claude (Latest 2026)
  {
    id: "anthropic/claude-fable-5.2",
    label: "Claude Fable 5.2",
    provider: "anthropic",
    group: "Anthropic Claude",
    badge: "Frontier",
  },
  {
    id: "anthropic/claude-opus-5.5",
    label: "Claude Opus 5.5",
    provider: "anthropic",
    group: "Anthropic Claude",
    badge: "Flagship",
  },
  {
    id: "anthropic/claude-sonnet-5.5",
    label: "Claude Sonnet 5.5",
    provider: "anthropic",
    group: "Anthropic Claude",
  },
  {
    id: "anthropic/claude-haiku-5.5",
    label: "Claude Haiku 5.5",
    provider: "anthropic",
    group: "Anthropic Claude",
    badge: "Fast",
  },

  // OpenAI ChatGPT (Latest 2026)
  {
    id: "openai/gpt-6.2-astra",
    label: "GPT-6.2 Astra",
    provider: "openai",
    group: "OpenAI ChatGPT",
    badge: "Frontier",
  },
  {
    id: "openai/gpt-6.2-sol",
    label: "GPT-6.2 Sol",
    provider: "openai",
    group: "OpenAI ChatGPT",
    badge: "Default",
  },
  {
    id: "openai/gpt-6.1-terra",
    label: "GPT-6.1 Terra",
    provider: "openai",
    group: "OpenAI ChatGPT",
    badge: "Vision",
  },
  {
    id: "openai/gpt-6-luna",
    label: "GPT-6 Luna",
    provider: "openai",
    group: "OpenAI ChatGPT",
    badge: "Lite",
  },

  // Moonshot AI Kimi (Latest 2026)
  {
    id: "moonshot/kimi-k3.1-pro",
    label: "Kimi K3.1 Pro",
    provider: "moonshot",
    group: "Moonshot Kimi",
    badge: "Flagship",
  },
  {
    id: "moonshot/kimi-k3.1-pro-highspeed",
    label: "Kimi K3.1 Pro Highspeed",
    provider: "moonshot",
    group: "Moonshot Kimi",
    badge: "2-3x Fast",
  },
  {
    id: "moonshot/kimi-k3",
    label: "Kimi K3",
    provider: "moonshot",
    group: "Moonshot Kimi",
  },

  // DeepSeek (Latest 2026)
  {
    id: "deepseek/deepseek-v4.1-flash-1017",
    label: "DeepSeek V4.1 Flash",
    provider: "deepseek",
    group: "DeepSeek",
    badge: "Latest",
  },
  {
    id: "deepseek/deepseek-v4-pro",
    label: "DeepSeek V4 Pro",
    provider: "deepseek",
    group: "DeepSeek",
  },
  {
    id: "deepseek/deepseek-r1",
    label: "DeepSeek R1",
    provider: "deepseek",
    group: "DeepSeek",
  },

  // xAI, Qwen & Other Frontier Models (Latest 2026)
  {
    id: "xai/grok-4.7",
    label: "Grok 4.7",
    provider: "xai",
    group: "xAI, Qwen & More",
    badge: "Latest",
  },
  {
    id: "qwen/qwen4-max",
    label: "Qwen4-Max",
    provider: "qwen",
    group: "xAI, Qwen & More",
    badge: "New",
  },
  {
    id: "zai/glm-5.3",
    label: "GLM-5.3",
    provider: "zai",
    group: "xAI, Qwen & More",
  },
  {
    id: "mistral/mistral-large-4",
    label: "Mistral Large 4",
    provider: "mistral",
    group: "xAI, Qwen & More",
  },
  {
    id: "minimax/minimax-m3.1-flash",
    label: "MiniMax M3.1 Flash",
    provider: "minimax",
    group: "xAI, Qwen & More",
  },
];

function ModelProviderIcon({
  provider = "rico",
  className = "w-[18px] h-[18px] sm:w-5 sm:h-5 shrink-0 object-contain",
}: {
  provider?: ModelProvider;
  className?: string;
}) {
  const uid = React.useId().replace(/:/g, "");

  switch (provider) {
    case "rico":
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/brand-rico-mark-transparent.png"
          alt=""
          aria-hidden="true"
          className={`${className} scale-110 drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.16)] dark:drop-shadow-[0_1px_2.5px_rgba(0,0,0,0.5)]`}
        />
      );
    case "google": {
      const g0 = `gemini-g0-${uid}`;
      const g1 = `gemini-g1-${uid}`;
      const g2 = `gemini-g2-${uid}`;
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className={className}
        >
          <path
            d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z"
            fill="#3186FF"
          />
          <path
            d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z"
            fill={`url(#${g0})`}
          />
          <path
            d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z"
            fill={`url(#${g1})`}
          />
          <path
            d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z"
            fill={`url(#${g2})`}
          />
          <defs>
            <linearGradient
              gradientUnits="userSpaceOnUse"
              id={g0}
              x1="7"
              x2="11"
              y1="15.5"
              y2="12"
            >
              <stop stopColor="#08B962" />
              <stop offset="1" stopColor="#08B962" stopOpacity="0" />
            </linearGradient>
            <linearGradient
              gradientUnits="userSpaceOnUse"
              id={g1}
              x1="8"
              x2="11.5"
              y1="5.5"
              y2="11"
            >
              <stop stopColor="#F94543" />
              <stop offset="1" stopColor="#F94543" stopOpacity="0" />
            </linearGradient>
            <linearGradient
              gradientUnits="userSpaceOnUse"
              id={g2}
              x1="3.5"
              x2="17.5"
              y1="13.5"
              y2="12"
            >
              <stop stopColor="#FABC12" />
              <stop offset=".46" stopColor="#FABC12" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      );
    }
    case "openai":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          fillRule="evenodd"
          aria-hidden="true"
          className={className}
        >
          <path d="M9.205 8.658v-2.26c0-.19.072-.333.238-.428l4.543-2.616c.619-.357 1.356-.523 2.117-.523 2.854 0 4.662 2.212 4.662 4.566 0 .167 0 .357-.024.547l-4.71-2.759a.797.797 0 00-.856 0l-5.97 3.473zm10.609 8.8V12.06c0-.333-.143-.57-.429-.737l-5.97-3.473 1.95-1.118a.433.433 0 01.476 0l4.543 2.617c1.309.76 2.189 2.378 2.189 3.948 0 1.808-1.07 3.473-2.76 4.163zM7.802 12.703l-1.95-1.142c-.167-.095-.239-.238-.239-.428V5.899c0-2.545 1.95-4.472 4.591-4.472 1 0 1.927.333 2.712.928L8.23 5.067c-.285.166-.428.404-.428.737v6.898zM12 15.128l-2.795-1.57v-3.33L12 8.658l2.795 1.57v3.33L12 15.128zm1.796 7.23c-1 0-1.927-.332-2.712-.927l4.686-2.712c.285-.166.428-.404.428-.737v-6.898l1.974 1.142c.167.095.238.238.238.428v5.233c0 2.545-1.974 4.472-4.614 4.472zm-5.637-5.303l-4.544-2.617c-1.308-.761-2.188-2.378-2.188-3.948A4.482 4.482 0 014.21 6.327v5.423c0 .333.143.571.428.738l5.947 3.449-1.95 1.118a.432.432 0 01-.476 0zm-.262 3.9c-2.688 0-4.662-2.021-4.662-4.519 0-.19.024-.38.047-.57l4.686 2.71c.286.167.571.167.856 0l5.97-3.448v2.26c0 .19-.07.333-.237.428l-4.543 2.616c-.619.357-1.356.523-2.117.523zm5.899 2.83a5.947 5.947 0 005.827-4.756C22.287 18.339 24 15.84 24 13.296c0-1.665-.713-3.282-1.998-4.448.119-.5.19-.999.19-1.498 0-3.401-2.759-5.947-5.946-5.947-.642 0-1.26.095-1.88.31A5.962 5.962 0 0010.205 0a5.947 5.947 0 00-5.827 4.757C1.713 5.447 0 7.945 0 10.49c0 1.666.713 3.283 1.998 4.448-.119.5-.19 1-.19 1.499 0 3.401 2.759 5.946 5.946 5.946.642 0 1.26-.095 1.88-.309a5.96 5.96 0 004.162 1.713z" />
        </svg>
      );
    case "anthropic":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className={className}
        >
          <path
            d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z"
            fill="#D97757"
          />
        </svg>
      );
    case "moonshot":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className={className}
        >
          <path
            d="M21.846 0a1.923 1.923 0 110 3.846H20.15a.226.226 0 01-.227-.226V1.923C19.923.861 20.784 0 21.846 0z"
            fill="#1783FF"
          />
          <path
            d="M11.065 11.199l7.257-7.2c.137-.136.06-.41-.116-.41H14.3a.164.164 0 00-.117.051l-7.82 7.756c-.122.12-.302.013-.302-.179V3.82c0-.127-.083-.23-.185-.23H3.186c-.103 0-.186.103-.186.23V19.77c0 .128.083.23.186.23h2.69c.103 0 .186-.102.186-.23v-3.25c0-.069.025-.135.069-.178l2.424-2.406a.158.158 0 01.205-.023l6.484 4.772a7.677 7.677 0 003.453 1.283c.108.012.2-.095.2-.23v-3.06c0-.117-.07-.212-.164-.227a5.028 5.028 0 01-2.027-.807l-5.613-4.064c-.117-.078-.132-.279-.028-.381z"
            fill="currentColor"
          />
        </svg>
      );
    case "deepseek":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className={className}
        >
          <path
            d="M23.748 4.482c-.254-.124-.364.113-.512.234-.051.039-.094.09-.137.136-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.156-.708-.311-.955-.65-.172-.241-.219-.51-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.093.172.187.129.323-.082.28-.18.552-.266.833-.055.179-.137.217-.329.14a5.526 5.526 0 01-1.736-1.18c-.857-.828-1.631-1.742-2.597-2.458a11.365 11.365 0 00-.689-.471c-.985-.957.13-1.743.388-1.836.27-.098.093-.432-.779-.428-.872.004-1.67.295-2.687.684a3.055 3.055 0 01-.465.137 9.597 9.597 0 00-2.883-.102c-1.885.21-3.39 1.102-4.497 2.623C.082 8.606-.231 10.684.152 12.85c.403 2.284 1.569 4.175 3.36 5.653 1.858 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.133-.284 4.994-1.86.47.234.962.327 1.78.397.63.059 1.236-.03 1.705-.128.735-.156.684-.837.419-.961-2.155-1.004-1.682-.595-2.113-.926 1.096-1.296 2.746-2.642 3.392-7.003.05-.347.007-.565 0-.845-.004-.17.035-.237.23-.256a4.173 4.173 0 001.545-.475c1.396-.763 1.96-2.015 2.093-3.517.02-.23-.004-.467-.247-.588zM11.581 18c-2.089-1.642-3.102-2.183-3.52-2.16-.392.024-.321.471-.235.763.09.288.207.486.371.739.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.167-1.361-.802-2.5-1.86-3.301-3.307-.774-1.393-1.224-2.887-1.298-4.482-.02-.386.093-.522.477-.592a4.696 4.696 0 011.529-.039c2.132.312 3.946 1.265 5.468 2.774.868.86 1.525 1.887 2.202 2.891.72 1.066 1.494 2.082 2.48 2.914.348.292.625.514.891.677-.802.09-2.14.11-3.054-.614zm1-6.44a.306.306 0 01.415-.287.302.302 0 01.2.288.306.306 0 01-.31.307.303.303 0 01-.304-.308zm3.11 1.596c-.2.081-.399.151-.59.16a1.245 1.245 0 01-.798-.254c-.274-.23-.47-.358-.552-.758a1.73 1.73 0 01.016-.588c.07-.327-.008-.537-.239-.727-.187-.156-.426-.199-.688-.199a.559.559 0 01-.254-.078c-.11-.054-.2-.19-.114-.358.028-.054.16-.186.192-.21.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.391.451.462.576.685.914.176.265.336.537.445.848.067.195-.019.354-.25.452z"
            fill="#4D6BFE"
          />
        </svg>
      );
    case "xai":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          fillRule="evenodd"
          aria-hidden="true"
          className={className}
        >
          <path d="M9.27 15.29l7.978-5.897c.391-.29.95-.177 1.137.272.98 2.369.542 5.215-1.41 7.169-1.951 1.954-4.667 2.382-7.149 1.406l-2.711 1.257c3.889 2.661 8.611 2.003 11.562-.953 2.341-2.344 3.066-5.539 2.388-8.42l.006.007c-.983-4.232.242-5.924 2.75-9.383.06-.082.12-.164.179-.248l-3.301 3.305v-.01L9.267 15.292M7.623 16.723c-2.792-2.67-2.31-6.801.071-9.184 1.761-1.763 4.647-2.483 7.166-1.425l2.705-1.25a7.808 7.808 0 00-1.829-1A8.975 8.975 0 005.984 5.83c-2.533 2.536-3.33 6.436-1.962 9.764 1.022 2.487-.653 4.246-2.34 6.022-.599.63-1.199 1.259-1.682 1.925l7.62-6.815" />
        </svg>
      );
    case "qwen":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className={className}
        >
          <path
            d="M19.713 2.825h-5.907c0-.251-.066-.503-.196-.728L12.819.728A1.46 1.46 0 0011.559 0h-1.58c-.52 0-1 .275-1.26.728l-2.42 4.19a1.45 1.45 0 000 1.453l.791 1.37c.26.448.74.727 1.26.727h11.36c.52 0 1-.275 1.26-.728l.79-1.37a1.45 1.45 0 000-1.451l-.79-1.37a1.46 1.46 0 00-1.26-.728zM.195 9.905l2.951 5.115a1.46 1.46 0 00-.531.531l-.791 1.37a1.45 1.45 0 000 1.452l.79 1.37c.26.448.74.727 1.26.727h4.84c.52 0 1-.275 1.26-.728l.79-1.37a1.45 1.45 0 000-1.451L5.086 7.083a1.46 1.46 0 00-1.26-.728h-1.58c-.52 0-1 .276-1.26.728l-.79 1.37a1.45 1.45 0 000 1.452m15.888 13.367l2.951-5.115c.217.125.469.196.728.196h1.582c.52 0 1-.275 1.26-.728l.79-1.37a1.45 1.45 0 000-1.451l-2.42-4.191a1.46 1.46 0 00-1.259-.728h-1.582c-.52 0-1 .276-1.259.728l-5.678 9.838a1.45 1.45 0 000 1.452l.79 1.37c.26.448.74.727 1.26.727h1.582c.52 0 1-.275 1.26-.728z"
            className="fill-[#082DFF] dark:fill-[#6B8BFF]"
          />
        </svg>
      );
    case "mistral":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className={className}
        >
          <path
            d="M3.428 3.4h3.429v3.428H3.428V3.4zm13.714 0h3.43v3.428h-3.43V3.4z"
            fill="#FFD700"
          />
          <path
            d="M3.428 6.828h6.857v3.429H3.429V6.828zm10.286 0h6.857v3.429h-6.857V6.828z"
            fill="#FFAF00"
          />
          <path
            d="M3.428 10.258h17.144v3.428H3.428v-3.428z"
            fill="#FF8205"
          />
          <path
            d="M3.428 13.686h3.429v3.428H3.428v-3.428zm6.858 0h3.429v3.428h-3.429v-3.428zm6.856 0h3.43v3.428h-3.43v-3.428z"
            fill="#FA500F"
          />
          <path
            d="M0 17.114h10.286v3.429H0v-3.429zm13.714 0H24v3.429H13.714v-3.429z"
            fill="#E10500"
          />
        </svg>
      );
    case "zai":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          fillRule="evenodd"
          aria-hidden="true"
          className={className}
        >
          <path d="M12.105 2L9.927 4.953H.653L2.83 2h9.276zM23.254 19.048L21.078 22h-9.242l2.174-2.952h9.244zM24 2L9.264 22H0L14.736 2H24z" />
        </svg>
      );
    case "minimax": {
      const mmGrad = `minimax-g-${uid}`;
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className={className}
        >
          <defs>
            <linearGradient
              id={mmGrad}
              x1="0%"
              x2="100.182%"
              y1="50.057%"
              y2="50.057%"
            >
              <stop offset="0%" stopColor="#E2167E" />
              <stop offset="100%" stopColor="#FE603C" />
            </linearGradient>
          </defs>
          <path
            d="M16.278 2c1.156 0 2.093.927 2.093 2.07v12.501a.74.74 0 00.744.709.74.74 0 00.743-.709V9.099a2.06 2.06 0 012.071-2.049A2.06 2.06 0 0124 9.1v6.561a.649.649 0 01-.652.645.649.649 0 01-.653-.645V9.1a.762.762 0 00-.766-.758.762.762 0 00-.766.758v7.472a2.037 2.037 0 01-2.048 2.026 2.037 2.037 0 01-2.048-2.026v-12.5a.785.785 0 00-.788-.753.785.785 0 00-.789.752l-.001 15.904A2.037 2.037 0 0113.441 22a2.037 2.037 0 01-2.048-2.026V18.04c0-.356.292-.645.652-.645.36 0 .652.289.652.645v1.934c0 .263.142.506.372.638.23.131.514.131.744 0a.734.734 0 00.372-.638V4.07c0-1.143.937-2.07 2.093-2.07zm-5.674 0c1.156 0 2.093.927 2.093 2.07v11.523a.648.648 0 01-.652.645.648.648 0 01-.652-.645V4.07a.785.785 0 00-.789-.78.785.785 0 00-.789.78v14.013a2.06 2.06 0 01-2.07 2.048 2.06 2.06 0 01-2.071-2.048V9.1a.762.762 0 00-.766-.758.762.762 0 00-.766.758v3.8a2.06 2.06 0 01-2.071 2.049A2.06 2.06 0 010 12.9v-1.378c0-.357.292-.646.652-.646.36 0 .653.29.653.646V12.9c0 .418.343.757.766.757s.766-.339.766-.757V9.099a2.06 2.06 0 012.07-2.048 2.06 2.06 0 012.071 2.048v8.984c0 .419.343.758.767.758.423 0 .766-.339.766-.758V4.07c0-1.143.937-2.07 2.093-2.07z"
            fill={`url(#${mmGrad})`}
          />
        </svg>
      );
    }
  }
}

export interface RicoFrame13CanvasProps {
  mandates: Mandate[];
  transactions: Transaction[];
  auditLogs: AuditLog[];
  messages: ChatMessage[];
  chatInput: string;
  onChatInputChange: (val: string) => void;
  onSendMessage: (val: string) => void;
  onClearChat: () => void;
  isChatLoading: boolean;
  activeBrowserAction?: BrowserActionItem | null;
  browserOpenSignal?: number;
  onTriggerMandate: (id: string) => void;
  onViewReceipt: (receipt: ReceiptData) => void;
  onCreateMandateClick: () => void;
  strictMode: boolean;
  onToggleStrictMode: () => void;
  approvalRequest: ApprovalRequest | null;
  onApproveApproval: (fundingSource?: "PAYPAL" | "BACKUP_CARD") => void;
  onRejectApproval: () => void;
  onDeployPlanMandate: (
    service: string,
    price: number,
    planName: string
  ) => void;
  onStageExactMandate?: (data: {
    service: string;
    budgetCeiling: string;
    recurrence?: string;
    category?: string;
  }) => void;
  onOpenCommandPalette?: () => void;
  settingsOpenSignal?: number;
  onRefreshData?: () => void;
  pendingWorkspaceAction?: WorkspaceActionEvent | null;
  onWorkspaceActionHandled?: (id: string) => void;
  onWorkspaceSnapshotChange?: (
    patch: Partial<SplitWorkspaceSnapshot>
  ) => void;
}

export function RicoFrame13Canvas({
  mandates,
  transactions,
  auditLogs,
  messages,
  chatInput,
  onChatInputChange,
  onSendMessage,
  onClearChat,
  isChatLoading,
  activeBrowserAction,
  browserOpenSignal = 0,
  onTriggerMandate,
  onViewReceipt,
  onCreateMandateClick,
  strictMode,
  onToggleStrictMode,
  approvalRequest,
  onDeployPlanMandate,
  onStageExactMandate,
  onOpenCommandPalette,
  settingsOpenSignal = 0,
  onRefreshData,
  pendingWorkspaceAction,
  onWorkspaceActionHandled,
  onWorkspaceSnapshotChange,
}: RicoFrame13CanvasProps) {
  const { isAuthenticated, demoLogin } = useAuth();
  // Collapsed slim rail and full-width welcome chat card by default to match RICO home
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSplitView, setIsSplitView] = useState(false);
  const [splitTool, setSplitTool] = useState<SplitSurfaceTool | null>(null);
  const [manualBrowserUrl, setManualBrowserUrl] = useState<string | null>(null);
  const [manualBrowserSeq, setManualBrowserSeq] = useState<number>(0);
  const [activeSection, setActiveSection] = useState<
    "chat" | "spending" | "mcp-skills" | "schedule" | "settings"
  >("chat");
  const [language, setLanguage] = useState<string>("en");
  const [userProfile, setUserProfile] =
    useState<RicoUserProfile>(DEFAULT_RICO_PROFILE);
  const [spendingTab, setSpendingTab] = useState<
    "rules" | "transactions" | "audit" | "savings" | "invoices"
  >("rules");
  const [mcpSkillsTab, setMcpSkillsTab] = useState<"mcp" | "skills">("mcp");
  const [scheduleTab, setScheduleTab] = useState<
    "scheduled" | "sentinel" | "watchdog"
  >("scheduled");
  const [activeThread, setActiveThread] = useState<string>("today-1");
  const [pickedChips, setPickedChips] = useState<InspectedElementChip[]>([]);
  const [selectedModel, setSelectedModel] = useState(MODEL_OPTIONS[0]);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState("");
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<
    Array<{ id: string; file: File; previewUrl?: string }>
  >([]);

  const stageRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);
  const modelSearchInputRef = useRef<HTMLInputElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const anyFileInputRef = useRef<HTMLInputElement>(null);
  const attachedFilesRef = useRef(attachedFiles);
  attachedFilesRef.current = attachedFiles;

  // Cleanup preview object URLs on unmount
  useEffect(() => {
    return () => {
      for (const item of attachedFilesRef.current) {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      }
    };
  }, []);

  // Close model or attachment dropdown on outside click or Escape
  useEffect(() => {
    if (!modelMenuOpen && !attachMenuOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (modelMenuRef.current && !modelMenuRef.current.contains(target)) {
        setModelMenuOpen(false);
      }
      if (attachMenuRef.current && !attachMenuRef.current.contains(target)) {
        setAttachMenuOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setModelMenuOpen(false);
        setAttachMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [modelMenuOpen, attachMenuOpen]);

  useEffect(() => {
    try {
      const savedLang = window.localStorage.getItem("rico_language");
      if (
        savedLang &&
        LANGUAGE_OPTIONS.some((opt) => opt.code === savedLang)
      ) {
        setLanguage(savedLang);
        document.documentElement.lang = savedLang;
      }
      const savedModelId = window.localStorage.getItem("rico_model");
      const matchedModel = MODEL_OPTIONS.find((m) => m.id === savedModelId);
      if (matchedModel) {
        setSelectedModel(matchedModel);
      }
      const savedProfileRaw = window.localStorage.getItem("rico_user_profile");
      if (savedProfileRaw) {
        const parsed = JSON.parse(savedProfileRaw) as Partial<RicoUserProfile>;
        setUserProfile({
          firstName: typeof parsed.firstName === "string" ? parsed.firstName : "",
          lastName: typeof parsed.lastName === "string" ? parsed.lastName : "",
          email: typeof parsed.email === "string" ? parsed.email : "",
          roleTitle: typeof parsed.roleTitle === "string" ? parsed.roleTitle : "",
          avatarUrl: typeof parsed.avatarUrl === "string" ? parsed.avatarUrl : "",
        });
      }
    } catch {
      // Ignore storage access errors
    }
  }, []);

  const handleSaveProfile = useCallback((next: RicoUserProfile) => {
    setUserProfile(next);
    try {
      window.localStorage.setItem("rico_user_profile", JSON.stringify(next));
    } catch {
      // Ignore storage access errors
    }
  }, []);

  const handleSelectLanguage = useCallback((code: string) => {
    setLanguage(code);
    try {
      window.localStorage.setItem("rico_language", code);
      document.documentElement.lang = code;
    } catch {
      // Ignore storage access errors
    }
  }, []);

  const handleSelectModel = useCallback(
    (model: (typeof MODEL_OPTIONS)[number]) => {
      setSelectedModel(model);
      try {
        window.localStorage.setItem("rico_model", model.id);
      } catch {
        // Ignore storage access errors
      }
    },
    []
  );

  useEffect(() => {
    onWorkspaceSnapshotChange?.({
      isOpen: isSplitView,
      activeTool: splitTool,
    });
  }, [isSplitView, splitTool, onWorkspaceSnapshotChange]);

  useEffect(() => {
    if (browserOpenSignal > 0) {
      setIsSplitView(true);
      setSplitTool("browser");
      setActiveSection("chat");
    }
  }, [browserOpenSignal]);

  useEffect(() => {
    if (pendingWorkspaceAction) {
      setIsSplitView(true);
      setSplitTool(pendingWorkspaceAction.target);
      setActiveSection("chat");
    }
  }, [pendingWorkspaceAction]);

  useEffect(() => {
    if (settingsOpenSignal > 0) {
      setActiveSection("settings");
    }
  }, [settingsOpenSignal]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isChatLoading]);

  useEffect(() => {
    if (activeSection === "chat") {
      textareaRef.current?.focus();
      return;
    }
    const handleSectionEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.querySelector('[role="dialog"]')) {
        setActiveSection("chat");
      }
    };
    window.addEventListener("keydown", handleSectionEscape);
    return () => window.removeEventListener("keydown", handleSectionEscape);
  }, [activeSection]);

  const handleToggleSection = (
    section: "spending" | "mcp-skills" | "schedule"
  ) => {
    setActiveSection((prev) => (prev === section ? "chat" : section));
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleOpenInBrowser = useCallback((url?: string) => {
    if (url && /^https?:\/\//i.test(url.trim())) {
      setManualBrowserUrl(url.trim());
      setManualBrowserSeq((n) => n + 1);
    }
    setIsSplitView(true);
    setSplitTool("browser");
    setActiveSection("chat");
  }, []);

  const handleOpenWorkspaceSurface = useCallback((tool: SplitSurfaceTool) => {
    setIsSplitView(true);
    setSplitTool(tool);
    setActiveSection("chat");
  }, []);

  const handlePickElementChip = useCallback((chip: InspectedElementChip) => {
    setPickedChips((prev) => {
      const filtered = prev.filter((c) => c.ref !== chip.ref);
      return [...filtered, chip];
    });
    setTimeout(() => textareaRef.current?.focus(), 20);
  }, []);

  const handleAskAgentContext = useCallback(
    (snippet: string) => {
      onChatInputChange(
        chatInput.trim() ? `${chatInput.trim()} ${snippet}` : snippet
      );
      setTimeout(() => textareaRef.current?.focus(), 20);
    },
    [chatInput, onChatInputChange]
  );

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const nextItems = Array.from(fileList).map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      file,
      previewUrl: file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : undefined,
    }));
    setAttachedFiles((prev) => [...prev, ...nextItems]);
    setAttachMenuOpen(false);
    e.target.value = "";
    setTimeout(() => textareaRef.current?.focus(), 20);
  };

  const handleRemoveAttachment = (idToRemove: string) => {
    setAttachedFiles((prev) => {
      const target = prev.find((item) => item.id === idToRemove);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== idToRemove);
    });
  };

  const handleRemoveChip = (refToRemove: string) => {
    setPickedChips((prev) => prev.filter((c) => c.ref !== refToRemove));
  };

  const dispatchChatWithSession = async (rawPrompt: string) => {
    const trimmed = rawPrompt.trim();
    if (!trimmed || isChatLoading) return;
    if (!isAuthenticated) {
      await demoLogin().catch(() => {});
    }
    onSendMessage(trimmed);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (
      (!chatInput.trim() &&
        pickedChips.length === 0 &&
        attachedFiles.length === 0) ||
      isChatLoading
    ) {
      return;
    }
    const baseText = chatInput.trim();
    const chipContext =
      pickedChips.length > 0
        ? pickedChips
            .filter((c) => !baseText.includes(c.ref))
            .map((c) => c.ref)
            .join(" ")
        : "";
    const fileContext =
      attachedFiles.length > 0
        ? `[Attached: ${attachedFiles.map((a) => a.file.name).join(", ")}]`
        : "";
    const finalPrompt = [baseText, chipContext, fileContext]
      .filter(Boolean)
      .join(" ")
      .trim();
    onChatInputChange("");
    setPickedChips([]);
    for (const item of attachedFiles) {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    }
    setAttachedFiles([]);
    await dispatchChatWithSession(finalPrompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const navItems: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
  }> = [
    {
      id: "nav-spending",
      label: "Spending",
      icon: (
        <CreditCard
          className="w-[17px] h-[17px] shrink-0 stroke-[2]"
          aria-hidden="true"
        />
      ),
      isActive: activeSection === "spending",
      onClick: () => handleToggleSection("spending"),
    },
    {
      id: "nav-mcp-skills",
      label: "MCP & skills",
      icon: (
        <Blocks
          className="w-[17px] h-[17px] shrink-0 stroke-[2]"
          aria-hidden="true"
        />
      ),
      isActive: activeSection === "mcp-skills",
      onClick: () => handleToggleSection("mcp-skills"),
    },
    {
      id: "nav-schedule",
      label: "Schedule",
      icon: (
        <CalendarClock
          className="w-[17px] h-[17px] shrink-0 stroke-[2]"
          aria-hidden="true"
        />
      ),
      isActive: activeSection === "schedule",
      onClick: () => handleToggleSection("schedule"),
    },
  ];

  const renderPillComposer = (
    inputId: string,
    menuPlacement: "down" | "up" = "down"
  ) => {
    const hasDraft =
      Boolean(chatInput.trim()) ||
      pickedChips.length > 0 ||
      attachedFiles.length > 0;

    return (
      <form
        onSubmit={handleSubmit}
        className="relative w-full rounded-[24px] bg-[var(--rico-iui-canvas)] border border-[var(--rico-iui-border-strong)] px-3.5 py-2.5 min-h-[56px] flex flex-col justify-center shadow-[var(--rico-iui-shadow)]"
      >
        {(pickedChips.length > 0 || attachedFiles.length > 0) && (
          <div className="flex flex-wrap items-center gap-1.5 px-1 pb-2 mb-1.5 border-b border-[var(--rico-iui-border)]">
            {attachedFiles.map((item) => {
              const isImage = Boolean(item.previewUrl);
              const isPdfOrDoc =
                !isImage &&
                /\.(pdf|doc|docx|txt|md|csv|xls|xlsx|ppt|pptx)$/i.test(
                  item.file.name
                );
              return (
                <span
                  key={item.id}
                  className="inline-flex items-center gap-1.5 h-7 pl-1.5 pr-1 rounded-[8px] bg-[var(--rico-iui-surface)] border border-[var(--rico-iui-border)] text-[12px] text-[var(--rico-iui-ink)]"
                >
                  {item.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.previewUrl}
                      alt={item.file.name}
                      className="w-5 h-5 rounded object-cover shrink-0"
                    />
                  ) : isPdfOrDoc ? (
                    <FileText
                      className="w-3.5 h-3.5 text-[#0285ff] shrink-0"
                      aria-hidden="true"
                    />
                  ) : (
                    <Paperclip
                      className="w-3.5 h-3.5 text-[#0285ff] shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  <span className="truncate max-w-[150px] font-medium">
                    {item.file.name}
                  </span>
                  <span className="text-[11px] text-[var(--rico-iui-muted)] shrink-0">
                    {formatFileSize(item.file.size)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(item.id)}
                    aria-label={`Remove ${item.file.name}`}
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[var(--rico-iui-muted)] hover:text-[var(--rico-iui-ink)]"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              );
            })}

            {pickedChips.map((chip) => (
              <span
                key={`${chip.ref}-${chip.generation}`}
                className="inline-flex items-center gap-1.5 h-7 pl-2 pr-1 rounded-[8px] bg-[var(--rico-iui-surface)] border border-[var(--rico-iui-border)] text-[11.5px] text-[var(--rico-iui-ink)]"
              >
                <Crosshair className="w-3 h-3 text-[#0285ff] shrink-0" />
                <span className="font-mono font-semibold text-[#0285ff]">
                  {chip.ref}
                </span>
                <span className="text-[var(--rico-iui-muted)] truncate max-w-[160px]">
                  {chip.role}
                  {chip.name ? ` · ${chip.name}` : ""}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveChip(chip.ref)}
                  aria-label={`Remove ${chip.ref} chip`}
                  className="w-4 h-4 rounded flex items-center justify-center text-[var(--rico-iui-muted)] hover:text-[var(--rico-iui-ink)]"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2.5 w-full">
          <div ref={attachMenuRef} className="relative shrink-0 flex items-center">
            <button
              type="button"
              onClick={() => setAttachMenuOpen((v) => !v)}
              aria-expanded={attachMenuOpen}
              aria-haspopup="menu"
              aria-label="Add files"
              title="Add files"
              className="w-9 h-9 rounded-full bg-[var(--rico-iui-surface)] hover:bg-[var(--rico-iui-pressed)] text-[var(--rico-iui-ink)] flex items-center justify-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0285ff]/40"
            >
              <Plus
                className={`w-[18px] h-[18px] stroke-[2] transition-transform duration-150 ${
                  attachMenuOpen ? "rotate-45" : ""
                }`}
                aria-hidden="true"
              />
            </button>

            {attachMenuOpen && (
              <div
                role="menu"
                aria-label="Add attachment"
                className={`absolute left-0 z-50 w-56 rounded-[14px] border border-[var(--rico-iui-border-strong)] bg-[var(--rico-iui-canvas)] p-1.5 shadow-[var(--rico-iui-shadow)] ${
                  menuPlacement === "up" ? "bottom-full mb-2" : "top-full mt-2"
                }`}
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => imageInputRef.current?.click()}
                  className="w-full px-2.5 py-2 rounded-[10px] text-[13px] text-[var(--rico-iui-ink)] hover:bg-[var(--rico-iui-hover)] flex items-center gap-2.5 text-left transition-colors"
                >
                  <ImageIcon
                    className="w-4 h-4 text-[var(--rico-iui-muted)] shrink-0 stroke-[1.9]"
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex flex-col">
                    <span className="font-medium leading-tight">Upload image</span>
                    <span className="text-[11px] text-[var(--rico-iui-muted)] leading-tight mt-0.5">
                      PNG, JPG, WebP, SVG
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => docInputRef.current?.click()}
                  className="w-full px-2.5 py-2 rounded-[10px] text-[13px] text-[var(--rico-iui-ink)] hover:bg-[var(--rico-iui-hover)] flex items-center gap-2.5 text-left transition-colors"
                >
                  <FileText
                    className="w-4 h-4 text-[var(--rico-iui-muted)] shrink-0 stroke-[1.9]"
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex flex-col">
                    <span className="font-medium leading-tight">
                      Upload PDF or doc
                    </span>
                    <span className="text-[11px] text-[var(--rico-iui-muted)] leading-tight mt-0.5">
                      PDF, Word, CSV, Excel, TXT
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => anyFileInputRef.current?.click()}
                  className="w-full px-2.5 py-2 rounded-[10px] text-[13px] text-[var(--rico-iui-ink)] hover:bg-[var(--rico-iui-hover)] flex items-center gap-2.5 text-left transition-colors"
                >
                  <Paperclip
                    className="w-4 h-4 text-[var(--rico-iui-muted)] shrink-0 stroke-[1.9]"
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex flex-col">
                    <span className="font-medium leading-tight">Attach any file</span>
                    <span className="text-[11px] text-[var(--rico-iui-muted)] leading-tight mt-0.5">
                      Browse all file types
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>

          <label htmlFor={inputId} className="sr-only">
            Ask anything
          </label>
          <textarea
            id={inputId}
            ref={textareaRef}
            value={chatInput}
            onChange={(e) => onChatInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Ask anything about startups, SaaS pricing, runway, or spending rules..."
            className="flex-1 min-w-0 min-h-[32px] max-h-[200px] py-[6px] px-0 resize-none text-[15px] leading-[20px] tracking-[-0.01em] font-normal text-[var(--rico-iui-ink)] placeholder:text-[var(--rico-iui-muted)] bg-transparent border-none outline-none"
          />

          <div className="shrink-0 flex items-center">
            <button
              type="submit"
              disabled={!hasDraft && !isChatLoading}
              aria-label="Send"
              className="w-9 h-9 rounded-full bg-[var(--rico-primary-bg)] text-[var(--rico-primary-fg)] flex items-center justify-center transition-opacity duration-150 enabled:hover:opacity-85 disabled:opacity-35 disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0285ff]/40"
            >
              {isChatLoading ? (
                <Loader2 className="w-[18px] h-[18px] animate-spin" />
              ) : (
                <ArrowUp
                  className="w-[18px] h-[18px] stroke-[2]"
                  aria-hidden="true"
                />
              )}
            </button>
          </div>
        </div>
      </form>
    );
  };

  return (
    <div className="w-screen h-screen flex flex-row bg-[var(--rico-bg-base)] text-[var(--rico-iui-ink)] overflow-hidden">
      {/* Hidden File Pickers */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFilesSelected}
        className="hidden"
        tabIndex={-1}
      />
      <input
        ref={docInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.md,.csv,.xlsx,.xls,.ppt,.pptx,application/pdf"
        multiple
        onChange={handleFilesSelected}
        className="hidden"
        tabIndex={-1}
      />
      <input
        ref={anyFileInputRef}
        type="file"
        accept="*/*"
        multiple
        onChange={handleFilesSelected}
        className="hidden"
        tabIndex={-1}
      />
      {/* Left Sidebar: Calm Intelligent-UI Collapsed Rail or Expanded Drawer */}
      {!isSidebarOpen ? (
        <aside
          aria-label="Workspace navigation"
          className="w-[58px] sm:w-[64px] h-full py-3.5 px-2 shrink-0 flex flex-col items-center justify-between select-none border-r border-[var(--rico-iui-border)] bg-[var(--sidebar)]"
        >
          <div className="flex flex-col items-center gap-5 w-10">
            <div className="group relative w-9 h-9 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="Rico"
                src="/brand-rico-mark-transparent.png"
                className="w-[32px] h-[32px] max-w-none object-contain transition-opacity duration-150 group-hover:opacity-0 group-focus-within:opacity-0 pointer-events-none"
              />
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Expand sidebar"
                title="Expand sidebar"
                className="absolute inset-0 w-9 h-9 rounded-[9px] flex items-center justify-center text-[var(--rico-iui-ink)] hover:bg-[var(--rico-iui-hover)] opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0285ff]/40"
              >
                <PanelLeft
                  className="w-[18px] h-[18px] stroke-[2]"
                  aria-hidden="true"
                />
              </button>
            </div>

            <div className="flex flex-col items-center gap-2 w-10">
              <button
                type="button"
                onClick={() => {
                  onClearChat();
                  setActiveSection("chat");
                  setIsSplitView(false);
                }}
                aria-label="New chat"
                title="New chat"
                className="w-9 h-9 rounded-full bg-[var(--rico-iui-surface)] hover:bg-[var(--rico-iui-pressed)] text-[var(--rico-iui-ink)] flex items-center justify-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0285ff]/40"
              >
                <Plus
                  className="w-[18px] h-[18px] stroke-[2]"
                  aria-hidden="true"
                />
              </button>

              <button
                type="button"
                onClick={() => onOpenCommandPalette?.()}
                aria-label="Search"
                title="Search (Ctrl+K)"
                className="w-9 h-9 rounded-full text-[var(--rico-iui-muted)] hover:text-[var(--rico-iui-ink)] hover:bg-[var(--rico-iui-hover)] flex items-center justify-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0285ff]/40"
              >
                <Search
                  className="w-[18px] h-[18px] stroke-[2]"
                  aria-hidden="true"
                />
              </button>

              <button
                type="button"
                onClick={() => handleToggleSection("spending")}
                aria-label="Spending"
                aria-current={activeSection === "spending" ? "page" : undefined}
                title="Spending"
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0285ff]/40 ${
                  activeSection === "spending"
                    ? "bg-[var(--rico-iui-pressed)] text-[var(--rico-iui-ink)]"
                    : "text-[var(--rico-iui-muted)] hover:text-[var(--rico-iui-ink)] hover:bg-[var(--rico-iui-hover)]"
                }`}
              >
                <CreditCard
                  className="w-[18px] h-[18px] stroke-[2]"
                  aria-hidden="true"
                />
              </button>

              <button
                type="button"
                onClick={() => handleToggleSection("mcp-skills")}
                aria-label="MCP & skills"
                aria-current={
                  activeSection === "mcp-skills" ? "page" : undefined
                }
                title="MCP & skills"
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0285ff]/40 ${
                  activeSection === "mcp-skills"
                    ? "bg-[var(--rico-iui-pressed)] text-[var(--rico-iui-ink)]"
                    : "text-[var(--rico-iui-muted)] hover:text-[var(--rico-iui-ink)] hover:bg-[var(--rico-iui-hover)]"
                }`}
              >
                <Blocks
                  className="w-[18px] h-[18px] stroke-[2]"
                  aria-hidden="true"
                />
              </button>

              <button
                type="button"
                onClick={() => handleToggleSection("schedule")}
                aria-label="Schedule"
                aria-current={activeSection === "schedule" ? "page" : undefined}
                title="Schedule"
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0285ff]/40 ${
                  activeSection === "schedule"
                    ? "bg-[var(--rico-iui-pressed)] text-[var(--rico-iui-ink)]"
                    : "text-[var(--rico-iui-muted)] hover:text-[var(--rico-iui-ink)] hover:bg-[var(--rico-iui-hover)]"
                }`}
              >
                <CalendarClock
                  className="w-[18px] h-[18px] stroke-[2]"
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>

          <div className="w-10 flex justify-center">
            <ProfileMenu
              collapsed={true}
              profile={userProfile}
              language={language}
              onSelectLanguage={handleSelectLanguage}
              onOpenSettings={() => setActiveSection("settings")}
              onOpenCommandPalette={onOpenCommandPalette}
            />
          </div>
        </aside>
      ) : (
        <>
          <button
            type="button"
            aria-label="Close sidebar overlay"
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-black/25 backdrop-blur-[1px] md:hidden"
          />
          <aside
            aria-label="Workspace navigation"
            className="fixed inset-y-0 left-0 z-40 w-[264px] bg-[var(--sidebar)] border-r border-[var(--rico-iui-border)] p-3 shadow-xl md:static md:z-auto md:w-[252px] md:shadow-none h-full shrink-0 flex flex-col justify-between select-none"
          >
            <div className="w-full flex flex-col gap-3 min-h-0 flex-1">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="Rico"
                    src="/brand-rico-mark-transparent.png"
                    className="w-7 h-7 object-contain"
                  />
                  <span className="text-[14.5px] font-semibold tracking-[-0.015em] text-[var(--rico-iui-ink)]">
                    Rico
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  aria-label="Collapse sidebar"
                  title="Collapse sidebar"
                  className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[var(--rico-iui-muted)] hover:text-[var(--rico-iui-ink)] hover:bg-[var(--rico-iui-hover)] transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0285ff]/40"
                >
                  <PanelLeft
                    className="w-[18px] h-[18px] stroke-[2]"
                    aria-hidden="true"
                  />
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClearChat();
                  setActiveSection("chat");
                  setIsSplitView(false);
                  if (typeof window !== "undefined" && window.innerWidth < 768) {
                    setIsSidebarOpen(false);
                  }
                }}
                className="w-full h-9 px-3 rounded-[9px] bg-[var(--rico-primary-bg)] text-[var(--rico-primary-fg)] text-[13px] font-medium flex items-center gap-2.5 hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0285ff]/40"
              >
                <Plus
                  className="w-[17px] h-[17px] stroke-[2]"
                  aria-hidden="true"
                />
                <span>New chat</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined" && window.innerWidth < 768) {
                    setIsSidebarOpen(false);
                  }
                  onOpenCommandPalette?.();
                }}
                aria-label="Search"
                title="Search (Ctrl+K)"
                className="w-full h-9 px-3 rounded-[9px] bg-[var(--rico-iui-surface)] hover:bg-[var(--rico-iui-pressed)] text-[var(--rico-iui-ink)] text-[13px] font-medium flex items-center gap-2.5 transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0285ff]/40"
              >
                <Search
                  className="w-[16px] h-[16px] stroke-[2] text-[var(--rico-iui-muted)]"
                  aria-hidden="true"
                />
                <span className="flex-1 text-left">Search</span>
                <span className="text-[10.5px] font-mono text-[var(--rico-iui-faint)]">
                  Ctrl+K
                </span>
              </button>

              <nav className="flex flex-col gap-0.5">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={item.onClick}
                    title={item.label}
                    className={`w-full h-9 px-3 rounded-[9px] text-[13px] font-medium flex items-center gap-2.5 transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0285ff]/40 ${
                      item.isActive
                        ? "bg-[var(--rico-iui-pressed)] text-[var(--rico-iui-ink)]"
                        : "text-[var(--rico-iui-muted)] hover:text-[var(--rico-iui-ink)] hover:bg-[var(--rico-iui-hover)]"
                    }`}
                  >
                    {item.icon}
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </nav>

              <div className="pt-2.5 mt-1 border-t border-[var(--rico-iui-border)] flex-1 min-h-0 overflow-y-auto space-y-1 rico-scroller">
                <div className="flex items-center justify-between px-2 pb-1">
                  <span className="text-[11px] font-medium text-[var(--rico-iui-muted)] uppercase tracking-wider">
                    Rules
                  </span>
                  <button
                    type="button"
                    onClick={onCreateMandateClick}
                    title="Add spending rule"
                    className="text-[11px] font-medium text-[var(--rico-iui-muted)] hover:text-[var(--rico-iui-ink)] inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 hover:bg-[var(--rico-iui-hover)] transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0285ff]/40"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add</span>
                  </button>
                </div>

                {mandates.slice(0, 5).map((mandate, idx) => {
                  const isSelected = activeThread === `mandate-${idx}`;
                  return (
                    <div
                      key={mandate.id}
                      className={`rounded-[8px] transition-colors duration-100 ${
                        isSelected
                          ? "bg-[var(--rico-iui-canvas)] border border-[var(--rico-iui-border)] shadow-[var(--rico-iui-shadow-sm)]"
                          : "hover:bg-[var(--rico-iui-hover)]"
                      }`}
                    >
                      <button
                        type="button"
                        data-testid="sidebar-rule"
                        onClick={() => setActiveThread(`mandate-${idx}`)}
                        className="w-full px-2.5 py-1.5 flex flex-col gap-0.5 text-left"
                      >
                        <div className="flex items-center justify-between w-full gap-2">
                          <span className="text-[12.5px] text-[var(--rico-iui-ink)] font-medium truncate">
                            {mandate.service}
                          </span>
                          <span className="text-[11px] font-mono tabular-nums text-[var(--rico-iui-muted)] shrink-0">
                            ${mandate.budgetCeiling.toFixed(0)}
                          </span>
                        </div>
                        <span className="text-[10.5px] text-[var(--rico-iui-faint)] truncate">
                          {mandate.recurrence}
                        </span>
                      </button>

                      {isSelected && (
                        <div className="flex justify-end px-2.5 pb-2">
                          <button
                            type="button"
                            data-testid="sidebar-run-now"
                            onClick={() => onTriggerMandate(mandate.id)}
                            className="h-6 px-2.5 rounded-[6px] bg-[var(--rico-primary-bg)] text-[var(--rico-primary-fg)] text-[10.5px] font-medium hover:opacity-90 transition-opacity"
                            title={`Review and confirm a payment for ${mandate.service}`}
                          >
                            Run now
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="w-full pt-2 border-t border-[var(--rico-iui-border)] flex flex-col gap-1">
              <button
                type="button"
                onClick={onToggleStrictMode}
                title={
                  strictMode
                    ? "Manual approval required"
                    : "Autonomous within rule cap"
                }
                className={`w-full h-9 px-2.5 rounded-[9px] text-[12.5px] flex items-center gap-2.5 transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0285ff]/40 ${
                  strictMode
                    ? "bg-[var(--rico-iui-warning-soft)] text-[var(--rico-iui-warning)]"
                    : "text-[var(--rico-iui-muted)] hover:text-[var(--rico-iui-ink)] hover:bg-[var(--rico-iui-hover)]"
                }`}
              >
                {strictMode ? (
                  <ShieldAlert className="w-[17px] h-[17px] shrink-0 stroke-[2]" />
                ) : (
                  <ShieldCheck className="w-[17px] h-[17px] shrink-0 stroke-[2] text-[#00a67d]" />
                )}
                <span className="truncate">
                  {strictMode ? "Manual approval" : "Autonomous mode"}
                </span>
              </button>

              <ProfileMenu
                collapsed={false}
                profile={userProfile}
                language={language}
                onSelectLanguage={handleSelectLanguage}
                onOpenSettings={() => {
                  setActiveSection("settings");
                  if (typeof window !== "undefined" && window.innerWidth < 768) {
                    setIsSidebarOpen(false);
                  }
                }}
                onOpenCommandPalette={onOpenCommandPalette}
              />
            </div>
          </aside>
        </>
      )}

      {/* Main Clean Intelligent-UI Surface */}
      <div
        ref={stageRef}
        className="relative flex-1 min-w-0 bg-[var(--rico-iui-canvas)] flex flex-row overflow-hidden"
      >
        {/* Left Half (or Full Width when unsplit): Active Section Surface */}
        <div
          className={`relative h-full flex flex-col min-w-0 bg-[var(--rico-iui-canvas)] ${
            isSplitView && activeSection === "chat"
              ? "hidden md:flex md:w-1/2 md:border-r border-[var(--rico-iui-border)]"
              : "w-full"
          }`}
        >
          {activeSection === "chat" ? (
            <>
              {/* RICO Thread Header */}
              <header className="min-h-[52px] pt-3 pb-1 px-4 sm:px-5 flex items-center justify-between shrink-0 z-10">
                <div ref={modelMenuRef} className="relative">
                  <button
                    type="button"
                    role="combobox"
                    aria-expanded={modelMenuOpen}
                    aria-controls="rico-model-listbox"
                    aria-label="Select model"
                    title={selectedModel.id}
                    onClick={() => {
                      setModelMenuOpen((prev) => {
                        const next = !prev;
                        if (next) {
                          setModelSearchQuery("");
                          requestAnimationFrame(() =>
                            modelSearchInputRef.current?.focus()
                          );
                        }
                        return next;
                      });
                    }}
                    className="h-9 px-3.5 rounded-full bg-[oklch(0.097_0_0_/_0.045)] hover:bg-[oklch(0.097_0_0_/_0.08)] text-[oklch(0.097_0_0)] text-[13px] font-medium leading-none tracking-[-0.01em] inline-flex items-center gap-2 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
                  >
                    <span className="w-5 h-5 flex items-center justify-center shrink-0">
                      <ModelProviderIcon
                        provider={selectedModel.provider}
                        className="w-[18px] h-[18px] sm:w-5 sm:h-5 shrink-0 object-contain"
                      />
                    </span>
                    <span className="truncate max-w-[160px] sm:max-w-[220px]">
                      {selectedModel.label}
                    </span>
                    <ChevronDown
                      className="w-3.5 h-3.5 opacity-50 shrink-0 stroke-[2]"
                      aria-hidden="true"
                    />
                  </button>

                  {modelMenuOpen && (() => {
                    const q = modelSearchQuery.trim().toLowerCase();
                    const filteredModels = q
                      ? MODEL_OPTIONS.filter(
                          (opt) =>
                            opt.label.toLowerCase().includes(q) ||
                            opt.id.toLowerCase().includes(q) ||
                            (opt.description &&
                              opt.description.toLowerCase().includes(q)) ||
                            (opt.group && opt.group.toLowerCase().includes(q)) ||
                            (opt.badge && opt.badge.toLowerCase().includes(q))
                        )
                      : MODEL_OPTIONS;
                    const groups = Array.from(
                      new Set(
                        filteredModels.map((opt) => opt.group || "Models")
                      )
                    );

                    return (
                      <div
                        id="rico-model-listbox"
                        role="listbox"
                        aria-label="Models"
                        className="absolute left-0 top-11 z-50 w-[min(calc(100vw-1.5rem),320px)] sm:w-[356px] rounded-xl border border-[#E6E4E3] bg-white shadow-[0_14px_36px_rgba(30,27,27,0.12)] overflow-hidden"
                      >
                        <div className="px-3 py-2.5 border-b border-[#F1EFEF] bg-[#FCFCFC] flex items-center gap-2.5">
                          <Search
                            className="w-4 h-4 text-[#8A8585] shrink-0"
                            aria-hidden="true"
                          />
                          <label htmlFor="rico-model-search" className="sr-only">
                            Search models
                          </label>
                          <input
                            id="rico-model-search"
                            ref={modelSearchInputRef}
                            type="text"
                            autoComplete="off"
                            value={modelSearchQuery}
                            onChange={(e) => setModelSearchQuery(e.target.value)}
                            placeholder="Search Gemini, Claude, GPT, Kimi..."
                            className="w-full bg-transparent text-[13px] text-[#1E1B1B] placeholder:text-[#8A8585] focus:outline-none"
                          />
                          {modelSearchQuery && (
                            <button
                              type="button"
                              aria-label="Clear model search"
                              onClick={() => {
                                setModelSearchQuery("");
                                modelSearchInputRef.current?.focus();
                              }}
                              className="p-1 rounded text-[#8A8585] hover:text-[#1E1B1B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
                            >
                              <X className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          )}
                        </div>

                        <div className="max-h-[min(66vh,420px)] overflow-y-auto p-1.5 space-y-2 rico-scroller">
                          {groups.length === 0 ? (
                            <div className="py-6 px-3 text-center">
                              <p className="m-0 text-[13px] text-[#5C5858]">
                                No matching models found
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  setModelSearchQuery("");
                                  modelSearchInputRef.current?.focus();
                                }}
                                className="mt-2 px-3 py-1.5 rounded-md text-xs font-medium text-[#034CFF] hover:bg-[#F1EFEF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
                              >
                                Clear filter
                              </button>
                            </div>
                          ) : (
                            groups.map((groupName) => (
                              <div key={groupName} className="space-y-0.5">
                                <div className="px-2.5 pt-1.5 pb-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A8585] select-none">
                                  {groupName}
                                </div>
                                {filteredModels
                                  .filter(
                                    (opt) => (opt.group || "Models") === groupName
                                  )
                                  .map((opt) => {
                                    const active = opt.id === selectedModel.id;
                                    return (
                                      <button
                                        key={opt.id}
                                        type="button"
                                        role="option"
                                        aria-selected={active}
                                        onClick={() => {
                                          handleSelectModel(opt);
                                          setModelMenuOpen(false);
                                          setModelSearchQuery("");
                                        }}
                                        className={`w-full ${
                                          opt.description
                                            ? "py-2"
                                            : "min-h-[38px] py-1.5"
                                        } px-2.5 rounded-lg text-[13px] sm:text-[13.5px] flex items-center gap-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40 ${
                                          active
                                            ? "bg-[#F1EFEF] font-medium text-[#1E1B1B]"
                                            : "text-[#1E1B1B]/85 hover:bg-[#F8F7F7]"
                                        }`}
                                      >
                                        <span className="w-6 h-6 flex items-center justify-center shrink-0">
                                          <ModelProviderIcon
                                            provider={opt.provider}
                                            className="w-[18px] h-[18px] sm:w-5 sm:h-5 shrink-0 object-contain"
                                          />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center gap-2">
                                            <span className="truncate">
                                              {opt.label}
                                            </span>
                                            {opt.badge && (
                                              <span className="shrink-0 text-[10.5px] font-medium px-1.5 py-0.5 rounded bg-[#E6E4E3]/75 text-[#5C5858] leading-none">
                                                {opt.badge}
                                              </span>
                                            )}
                                          </div>
                                          {opt.description && (
                                            <p className="m-0 mt-0.5 text-xs font-normal text-[#5C5858] leading-snug truncate">
                                              {opt.description}
                                            </p>
                                          )}
                                        </div>
                                        {active && (
                                          <Check
                                            className="w-4 h-4 text-[#034CFF] shrink-0 stroke-[2.2]"
                                            aria-hidden="true"
                                          />
                                        )}
                                      </button>
                                    );
                                  })}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* RICO Top-Right Split Toggle Button */}
                <button
                  type="button"
                  data-testid="split-view-toggle"
                  onClick={() => {
                    if (isSplitView) {
                      setIsSplitView(false);
                    } else {
                      setSplitTool(null);
                      setIsSplitView(true);
                    }
                  }}
                  aria-pressed={isSplitView}
                  aria-label={isSplitView ? "Close split view" : "Split view"}
                  title={isSplitView ? "Close split view" : "Split view"}
                  className={`flex w-9 h-9 rounded-[9px] items-center justify-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 ${
                    isSplitView
                      ? "bg-[oklch(0.097_0_0_/_0.07)] text-[oklch(0.097_0_0)] hover:bg-[oklch(0.097_0_0_/_0.1)]"
                      : "text-[oklch(0.097_0_0_/_0.65)] hover:text-[oklch(0.097_0_0)] hover:bg-[oklch(0.097_0_0_/_0.05)]"
                  }`}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <rect
                      x="3"
                      y="3"
                      width="18"
                      height="18"
                      rx="2.5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    {isSplitView && (
                      <path
                        d="M12 3.9H18.5C19.38 3.9 20.1 4.62 20.1 5.5V18.5C20.1 19.38 19.38 20.1 18.5 20.1H12V3.9Z"
                        fill="currentColor"
                        fillOpacity="0.18"
                      />
                    )}
                    <line
                      x1="12"
                      y1="3"
                      x2="12"
                      y2="21"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                  </svg>
                </button>
              </header>

              {messages.length === 0 ? (
                /* Clean Minimal Welcome Screen */
                <div className="flex-1 min-h-0 w-full max-w-3xl mx-auto px-4 sm:px-6 pt-4 pb-10 sm:pb-16 lg:pb-20 grid grid-rows-[1fr_auto_1fr] grid-cols-1 justify-items-center overflow-y-auto rico-scroller">
                  <div className="self-end mb-7 sm:mb-8 w-full max-w-3xl flex flex-col items-center text-center gap-1.5">
                    <h1 className="m-0 text-[24px] sm:text-[28px] font-semibold leading-tight tracking-[-0.02em] text-[var(--rico-iui-ink)]">
                      {userProfile.firstName
                        ? `Good to see you, ${userProfile.firstName}`
                        : "Good to see you"}
                    </h1>
                    <p className="m-0 text-[18px] sm:text-[21px] font-normal leading-tight tracking-[-0.015em] text-[var(--rico-iui-muted)]">
                      What&apos;s on your mind today?
                    </p>
                  </div>

                  {/* Centered Composer */}
                  <div className="w-full max-w-3xl flex justify-center">
                    {renderPillComposer("rico-welcome-composer")}
                  </div>

                  <div aria-hidden="true" />
                </div>
              ) : (
                /* Active Session Timeline + Bottom Pill Composer */
                <>
                  <div className="flex-1 w-full min-h-0 overflow-y-auto px-4 sm:px-6 py-5 rico-scroller">
                    <div className="w-full max-w-3xl mx-auto space-y-5">
                      {messages.map((message, mIdx) => (
                        <ChatMessageRenderer
                          key={message.id}
                          message={message}
                          isStreaming={
                            isChatLoading && mIdx === messages.length - 1
                          }
                          onViewReceipt={onViewReceipt}
                          onOpenInBrowser={handleOpenInBrowser}
                          onOpenWorkspaceTool={handleOpenWorkspaceSurface}
                          onSendPrompt={(prompt) =>
                            void dispatchChatWithSession(prompt)
                          }
                          onStageMandate={onDeployPlanMandate}
                          onStageExactMandate={onStageExactMandate}
                          onTriggerMandate={onTriggerMandate}
                          isExpandedDefault={false}
                        />
                      ))}

                      {isChatLoading && (
                        <div className="flex items-center gap-2 text-[13px] text-[#5C5858] pl-9">
                          <Loader2 className="w-4 h-4 text-[#034CFF] animate-spin shrink-0" />
                          <span className="rico-text-shimmer font-medium">
                            {activeBrowserAction?.detail || "Thinking..."}
                          </span>
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>
                  </div>

                  <div className="w-full px-4 sm:px-6 pb-4 pt-2 shrink-0">
                    <div className="w-full max-w-3xl mx-auto">
                      {renderPillComposer("rico-thread-composer", "up")}
                    </div>
                  </div>
                </>
              )}
            </>
          ) : activeSection === "spending" ? (
            <RicoSpendingView
              activeTab={spendingTab}
              onSelectTab={setSpendingTab}
              onClose={() => setActiveSection("chat")}
              mandates={mandates}
              transactions={transactions}
              auditLogs={auditLogs}
              strictMode={strictMode}
              onToggleStrictMode={onToggleStrictMode}
              onCreateMandateClick={onCreateMandateClick}
              onTriggerMandate={onTriggerMandate}
              onViewReceipt={onViewReceipt}
              onDeployPlanMandate={onDeployPlanMandate}
              onRefreshData={onRefreshData}
            />
          ) : activeSection === "mcp-skills" ? (
            <div className="flex-1 min-h-0 flex flex-col">
              <header className="min-h-[56px] px-4 sm:px-6 lg:px-8 py-3 border-b border-[oklch(0.097_0_0_/_0.06)] flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3.5 min-w-0 max-w-full flex-wrap">
                  <h1 className="m-0 text-[16px] sm:text-[17px] font-semibold tracking-[-0.015em] text-[oklch(0.097_0_0)]">
                    MCP &amp; skills
                  </h1>
                  <div
                    role="tablist"
                    aria-label="MCP and skills views"
                    className="inline-flex items-center p-1 rounded-full bg-[oklch(0.097_0_0_/_0.045)] max-w-full overflow-x-auto no-scrollbar"
                  >
                    {(
                      [
                        { id: "mcp", label: "MCP connectors" },
                        { id: "skills", label: "Skills" },
                      ] as const
                    ).map((tab) => {
                      const selected = mcpSkillsTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          role="tab"
                          aria-selected={selected}
                          onClick={() => setMcpSkillsTab(tab.id)}
                          className={`h-8 px-3.5 rounded-full text-[12.5px] sm:text-[13px] font-medium whitespace-nowrap transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 ${
                            selected
                              ? "bg-white text-[oklch(0.097_0_0)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                              : "text-[#5C5858] hover:text-[#1E1B1B]"
                          }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveSection("chat")}
                  aria-label="Close MCP & skills and return home"
                  title="Back to home (Esc)"
                  className="w-9 h-9 rounded-full bg-[oklch(0.097_0_0_/_0.05)] hover:bg-[oklch(0.097_0_0_/_0.1)] text-[oklch(0.097_0_0)] flex items-center justify-center shrink-0 ml-auto transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                >
                  <X
                    className="w-[18px] h-[18px] stroke-[2]"
                    aria-hidden="true"
                  />
                </button>
              </header>

              <div className="flex-1 min-h-0 overflow-y-auto rico-scroller">
                {mcpSkillsTab === "mcp" ? (
                  <McpConnectPanel />
                ) : (
                  <AppStorePanel
                    onRefreshData={onRefreshData}
                    onDeployPlanMandate={onDeployPlanMandate}
                  />
                )}
              </div>
            </div>
          ) : activeSection === "schedule" ? (
            <div className="flex-1 min-h-0 flex flex-col">
              <header className="min-h-[56px] px-4 sm:px-6 lg:px-8 py-3 border-b border-[oklch(0.097_0_0_/_0.06)] flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3.5 min-w-0 max-w-full flex-wrap">
                  <h1 className="m-0 text-[16px] sm:text-[17px] font-semibold tracking-[-0.015em] text-[oklch(0.097_0_0)]">
                    Schedule
                  </h1>
                  <div
                    role="tablist"
                    aria-label="Schedule views"
                    className="inline-flex items-center p-1 rounded-full bg-[oklch(0.097_0_0_/_0.045)] max-w-full overflow-x-auto no-scrollbar"
                  >
                    {(
                      [
                        { id: "scheduled", label: "Recurring rules" },
                        { id: "sentinel", label: "Price sentinel" },
                        { id: "watchdog", label: "Renewal watchdog" },
                      ] as const
                    ).map((tab) => {
                      const selected = scheduleTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          role="tab"
                          aria-selected={selected}
                          onClick={() => setScheduleTab(tab.id)}
                          className={`h-8 px-3.5 rounded-full text-[12.5px] sm:text-[13px] font-medium whitespace-nowrap transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 ${
                            selected
                              ? "bg-white text-[oklch(0.097_0_0)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                              : "text-[#5C5858] hover:text-[#1E1B1B]"
                          }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-auto">
                  <button
                    type="button"
                    onClick={onCreateMandateClick}
                    className="h-9 px-3.5 rounded-full bg-[oklch(0.097_0_0)] text-[oklch(0.994_0_89.876)] text-[12.5px] sm:text-[13px] font-medium inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/25"
                  >
                    <Plus className="w-4 h-4 stroke-[2]" aria-hidden="true" />
                    <span>Schedule rule</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSection("chat")}
                    aria-label="Close Schedule and return home"
                    title="Back to home (Esc)"
                    className="w-9 h-9 rounded-full bg-[oklch(0.097_0_0_/_0.05)] hover:bg-[oklch(0.097_0_0_/_0.1)] text-[oklch(0.097_0_0)] flex items-center justify-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                  >
                    <X
                      className="w-[18px] h-[18px] stroke-[2]"
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </header>

              <div className="flex-1 min-h-0 overflow-y-auto rico-scroller">
                {scheduleTab === "scheduled" && (
                  <div className="w-full max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-3">
                    {mandates.length === 0 ? (
                      <div className="rounded-xl border border-[#E6E4E3] bg-white p-8 sm:p-10 text-center space-y-3">
                        <p className="m-0 text-sm font-medium text-[#1E1B1B]">
                          No scheduled rules yet
                        </p>
                        <p className="m-0 text-[13px] text-[#5C5858]">
                          Create a recurring spending rule to automate verified
                          billing schedules within your cap.
                        </p>
                        <button
                          type="button"
                          onClick={onCreateMandateClick}
                          className="h-9 px-4 rounded-full bg-[#1E1B1B] text-white text-[13px] font-medium inline-flex items-center gap-1.5 hover:bg-[#332F2F] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/25"
                        >
                          <Plus
                            className="w-4 h-4 stroke-[2]"
                            aria-hidden="true"
                          />
                          <span>Schedule first rule</span>
                        </button>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-[#E6E4E3] bg-white divide-y divide-[#F1EFEF]">
                        {mandates.map((mandate) => (
                          <div
                            key={mandate.id}
                            className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
                          >
                            <div className="min-w-0 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[14px] sm:text-[14.5px] font-semibold text-[#1E1B1B] truncate">
                                  {mandate.service}
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-[#F1EFEF] text-[11px] font-mono text-[#5C5858]">
                                  {mandate.status}
                                </span>
                              </div>
                              <p className="m-0 text-[13px] text-[#5C5858]">
                                {mandate.recurrence} · Next run:{" "}
                                <span className="font-mono text-[#1E1B1B]">
                                  {mandate.nextRun}
                                </span>
                              </p>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                              <span className="text-[13px] font-mono tabular-nums text-[#5C5858]">
                                Cap ${mandate.budgetCeiling.toFixed(2)}
                              </span>
                              <button
                                type="button"
                                onClick={() => onTriggerMandate(mandate.id)}
                                className="h-8 px-3.5 rounded-full bg-[#1E1B1B] hover:bg-[#332F2F] text-white text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/25"
                              >
                                Run now
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {scheduleTab === "sentinel" && (
                  <PriceSentinelPanel
                    mandates={mandates}
                    onRefreshData={onRefreshData}
                  />
                )}

                {scheduleTab === "watchdog" && <ContractWatchdogPanel />}
              </div>
            </div>
          ) : (
            <RicoEnterpriseSettings
              onClose={() => setActiveSection("chat")}
              profile={userProfile}
              onSaveProfile={handleSaveProfile}
              strictMode={strictMode}
              onToggleStrictMode={onToggleStrictMode}
              language={language}
              languageOptions={LANGUAGE_OPTIONS}
              onSelectLanguage={handleSelectLanguage}
              selectedModel={selectedModel}
              modelOptions={MODEL_OPTIONS}
              onSelectModel={handleSelectModel}
            />
          )}
        </div>

        {/* Right Half (50% on md+, full panel on <md): RICO Split Workspace */}
        {isSplitView && activeSection === "chat" && (
          <aside
            aria-label="Split workspace"
            className="flex w-full md:w-1/2 h-full min-w-0 bg-[#FCFCFC]"
          >
            <RicoSplitWorkspace
              activeTool={splitTool}
              onSelectTool={(tool) => setSplitTool(tool)}
              onCloseSplit={() => setIsSplitView(false)}
              isBrowserStreaming={Boolean(activeBrowserAction)}
              externalBrowserUrl={activeBrowserAction?.url || manualBrowserUrl}
              externalBrowserSeq={manualBrowserSeq}
              approvalRequest={approvalRequest}
              onPickElementChip={handlePickElementChip}
              pendingWorkspaceAction={pendingWorkspaceAction}
              onWorkspaceActionHandled={onWorkspaceActionHandled}
              onDocSnapshotChange={(doc) =>
                onWorkspaceSnapshotChange?.({ doc })
              }
              onExcelSnapshotChange={(excel) =>
                onWorkspaceSnapshotChange?.({ excel })
              }
              onAskAgentContext={handleAskAgentContext}
              onSendChatPrompt={(prompt) => void dispatchChatWithSession(prompt)}
              onDeployPlanMandate={onDeployPlanMandate}
              onStageExactMandate={onStageExactMandate}
              onTriggerMandate={onTriggerMandate}
            />
          </aside>
        )}
      </div>
    </div>
  );
}
