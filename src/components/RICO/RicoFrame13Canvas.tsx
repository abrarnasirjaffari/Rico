"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  AlertCircle,
  ArrowUp,
  Blocks,
  BookOpen,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  FileText,
  Image as ImageIcon,
  Languages,
  Loader2,
  LogIn,
  LogOut,
  PanelLeft,
  Paperclip,
  Plus,
  Search,
  Settings,
  User,
  ShieldCheck,
  ShieldAlert,
  CreditCard,
  Crosshair,
  X,
} from "lucide-react";
import { Mandate, Transaction, AuditLog } from "@/components/dashboard/types";
import { ReceiptData } from "@/components/dashboard/ReceiptDialog";
import { ApprovalRequest } from "@/components/dashboard/ApprovalDialog";
import type { InspectedElementChip } from "@/lib/browser/types";
import {
  ChatMessage,
  BrowserActionItem,
} from "@/lib/chat/use-payagent-chat";
import { ChatMessageRenderer } from "@/components/chat/ChatMessageRenderer";
import { AgGridMandatesTable } from "@/components/dashboard/AgGridMandatesTable";
import { AgGridTransactionsTable } from "@/components/dashboard/AgGridTransactionsTable";
import { PersonaSavingsPanel } from "@/components/dashboard/PersonaSavingsPanel";
import { InvoiceOcrPanel } from "@/components/dashboard/InvoiceOcrPanel";
import { McpConnectPanel } from "@/components/dashboard/McpConnectPanel";
import { AppStorePanel } from "@/components/dashboard/AppStorePanel";
import { PriceSentinelPanel } from "@/components/dashboard/PriceSentinelPanel";
import { ContractWatchdogPanel } from "@/components/dashboard/ContractWatchdogPanel";
import {
  DEFAULT_RICO_PROFILE,
  RicoEnterpriseSettings,
  type RicoUserProfile,
} from "./RicoEnterpriseSettings";
import { useAuth } from "@/lib/auth/AuthContext";
import { SplitWorkspacePane } from "@/components/workspace/SplitWorkspacePane";
import type {
  SplitSurfaceTool,
  SplitWorkspaceSnapshot,
  WorkspaceActionEvent,
} from "@/lib/workspace/types";

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
          className="w-full h-7 px-2.5 rounded-md bg-white hover:bg-[#F1EFEF] border border-[#D6D3D1] text-[11.5px] font-medium text-[#1E1B1B] flex items-center justify-center gap-1.5 transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
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
          className={`w-10 h-10 sm:w-9 sm:h-9 rounded-full overflow-hidden flex items-center justify-center text-[12px] font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 ${
            profile.avatarUrl
              ? "border border-[#E6E4E3] bg-[#F1EFEF] hover:opacity-90"
              : isAuthenticated || profileInitials
                ? "bg-[oklch(0.097_0_0)] text-[oklch(0.994_0_89.876)] hover:opacity-85"
                : "bg-[oklch(0.097_0_0_/_0.05)] text-[oklch(0.097_0_0)] hover:bg-[oklch(0.097_0_0_/_0.09)]"
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
          className="w-full h-9 px-2.5 rounded-lg flex items-center gap-2.5 text-[13px] font-medium text-[#1E1B1B] hover:bg-[#EFECEB] transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
        >
          <span
            className={`w-6 h-6 rounded-full overflow-hidden flex items-center justify-center text-[10.5px] font-semibold shrink-0 ${
              profile.avatarUrl
                ? "border border-[#E6E4E3] bg-[#F1EFEF]"
                : isAuthenticated || profileInitials
                  ? "bg-[#1E1B1B] text-white"
                  : "bg-white border border-[#D6D3D1] text-[#5C5858]"
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

const MODEL_OPTIONS = [
  { id: "google/gemini-3.6-flash", label: "Gemini 3.6 Flash" },
  { id: "google/gemini-3.8-flash", label: "Gemini 3.8 Flash" },
  { id: "deepseek/deepseek-r1", label: "DeepSeek R1" },
];

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
  onOpenCommandPalette,
  settingsOpenSignal = 0,
  onRefreshData,
  pendingWorkspaceAction,
  onWorkspaceActionHandled,
  onWorkspaceSnapshotChange,
}: RicoFrame13CanvasProps) {
  const { isAuthenticated, demoLogin } = useAuth();
  // Collapsed slim rail and full-width welcome chat card by default to match OpenUI Cloud Chat home
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSplitView, setIsSplitView] = useState(false);
  const [splitTool, setSplitTool] = useState<SplitSurfaceTool | null>(null);
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
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<
    Array<{ id: string; file: File; previewUrl?: string }>
  >([]);

  const stageRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);
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

  const handleOpenInBrowser = useCallback(() => {
    setIsSplitView(true);
    setSplitTool("browser");
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
  ) => (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-[28px] bg-[oklch(0.99418_0_89.876)] px-3 py-[11px] min-h-[56px] flex flex-col justify-center shadow-[0_0_0_0.5px_oklch(0.097_0_0_/_0.08),0_4px_16px_rgba(0,0,0,0.06)]"
    >
      {(pickedChips.length > 0 || attachedFiles.length > 0) && (
        <div className="flex flex-wrap items-center gap-1.5 px-1 pb-2 mb-1.5 border-b border-[oklch(0.097_0_0_/_0.06)]">
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
                className="inline-flex items-center gap-1.5 h-7 pl-1.5 pr-1 rounded-lg bg-[oklch(0.097_0_0_/_0.04)] border border-[oklch(0.097_0_0_/_0.07)] text-[12px] text-[oklch(0.097_0_0)]"
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
                    className="w-3.5 h-3.5 text-[oklch(0.097_0_0_/_0.65)] shrink-0"
                    aria-hidden="true"
                  />
                ) : (
                  <Paperclip
                    className="w-3.5 h-3.5 text-[oklch(0.097_0_0_/_0.65)] shrink-0"
                    aria-hidden="true"
                  />
                )}
                <span className="truncate max-w-[150px] font-medium">
                  {item.file.name}
                </span>
                <span className="text-[11px] text-[oklch(0.097_0_0_/_0.45)] shrink-0">
                  {formatFileSize(item.file.size)}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(item.id)}
                  aria-label={`Remove ${item.file.name}`}
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[oklch(0.097_0_0_/_0.5)] hover:text-[oklch(0.097_0_0)] hover:bg-[oklch(0.097_0_0_/_0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            );
          })}

          {pickedChips.map((chip) => (
            <span
              key={`${chip.ref}-${chip.generation}`}
              className="inline-flex items-center gap-1.5 h-7 pl-2 pr-1 rounded-lg bg-[#F8F7F7] border border-[#E6E4E3] text-[11.5px] text-[#1E1B1B]"
            >
              <Crosshair className="w-3 h-3 text-[#034CFF] shrink-0" />
              <span className="font-mono font-semibold text-[#034CFF]">
                {chip.ref}
              </span>
              <span className="text-[#5C5858] truncate max-w-[160px]">
                {chip.role}
                {chip.name ? ` · ${chip.name}` : ""}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveChip(chip.ref)}
                aria-label={`Remove ${chip.ref} chip`}
                className="w-4 h-4 rounded flex items-center justify-center text-[#8A8585] hover:text-[#1E1B1B] hover:bg-[#EFECEB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2.5 w-full">
        {/* Left + File Attachment Menu */}
        <div ref={attachMenuRef} className="relative shrink-0 flex items-center">
          <button
            type="button"
            onClick={() => setAttachMenuOpen((v) => !v)}
            aria-expanded={attachMenuOpen}
            aria-haspopup="menu"
            aria-label="Add files"
            title="Add files"
            className="w-9 h-9 rounded-full bg-[oklch(0.097_0_0_/_0.05)] hover:bg-[oklch(0.097_0_0_/_0.09)] text-[oklch(0.097_0_0)] flex items-center justify-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
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
              className={`absolute left-0 z-50 w-56 rounded-2xl border border-black/[0.08] bg-white p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.1)] ${
                menuPlacement === "up" ? "bottom-full mb-2" : "top-full mt-2"
              }`}
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => imageInputRef.current?.click()}
                className="w-full px-2.5 py-2 rounded-xl text-[13px] text-[oklch(0.097_0_0)] hover:bg-[oklch(0.097_0_0_/_0.05)] flex items-center gap-2.5 text-left transition-colors"
              >
                <ImageIcon
                  className="w-4 h-4 text-[oklch(0.097_0_0_/_0.7)] shrink-0 stroke-[1.9]"
                  aria-hidden="true"
                />
                <div className="min-w-0 flex flex-col">
                  <span className="font-medium leading-tight">
                    Upload image
                  </span>
                  <span className="text-[11px] text-[oklch(0.097_0_0_/_0.5)] leading-tight mt-0.5">
                    PNG, JPG, WebP, GIF, SVG
                  </span>
                </div>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => docInputRef.current?.click()}
                className="w-full px-2.5 py-2 rounded-xl text-[13px] text-[oklch(0.097_0_0)] hover:bg-[oklch(0.097_0_0_/_0.05)] flex items-center gap-2.5 text-left transition-colors"
              >
                <FileText
                  className="w-4 h-4 text-[oklch(0.097_0_0_/_0.7)] shrink-0 stroke-[1.9]"
                  aria-hidden="true"
                />
                <div className="min-w-0 flex flex-col">
                  <span className="font-medium leading-tight">
                    Upload PDF or doc
                  </span>
                  <span className="text-[11px] text-[oklch(0.097_0_0_/_0.5)] leading-tight mt-0.5">
                    PDF, Word, CSV, Excel, TXT
                  </span>
                </div>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => anyFileInputRef.current?.click()}
                className="w-full px-2.5 py-2 rounded-xl text-[13px] text-[oklch(0.097_0_0)] hover:bg-[oklch(0.097_0_0_/_0.05)] flex items-center gap-2.5 text-left transition-colors"
              >
                <Paperclip
                  className="w-4 h-4 text-[oklch(0.097_0_0_/_0.7)] shrink-0 stroke-[1.9]"
                  aria-hidden="true"
                />
                <div className="min-w-0 flex flex-col">
                  <span className="font-medium leading-tight">
                    Attach any file
                  </span>
                  <span className="text-[11px] text-[oklch(0.097_0_0_/_0.5)] leading-tight mt-0.5">
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
          placeholder="Ask anything..."
          className="flex-1 min-w-0 min-h-[32px] max-h-[200px] py-[6px] px-0 resize-none text-[15px] leading-[20px] tracking-[-0.15px] font-normal text-[oklch(0.097_0_0)] placeholder:text-[oklch(0.097_0_0_/_0.6)] bg-transparent border-none outline-none"
        />

        <div className="shrink-0 flex items-center">
          <button
            type="submit"
            disabled={
              !chatInput.trim() &&
              pickedChips.length === 0 &&
              attachedFiles.length === 0 &&
              !isChatLoading
            }
            aria-label="Send"
            className="w-9 h-9 rounded-full bg-[oklch(0.097_0_0)] text-[oklch(0.994_0_89.876)] flex items-center justify-center transition-opacity duration-150 enabled:hover:opacity-85 disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/25 focus-visible:ring-offset-2"
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

  return (
    <div className="w-screen h-screen flex flex-row bg-[oklch(0.9844_0_89.876)] text-[oklch(0.097_0_0)] overflow-hidden font-[Inter,sans-serif]">
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
      {/* Left Sidebar: Responsive OpenUI Collapsed Rail or Expanded Workspace Drawer */}
      {!isSidebarOpen ? (
        <aside
          aria-label="Workspace navigation"
          className="w-[58px] sm:w-[68px] h-full py-3 sm:py-4 px-2 sm:px-3.5 shrink-0 flex flex-col items-center justify-between select-none"
        >
          <div className="flex flex-col items-center gap-5 sm:gap-6 w-10">
            {/* Rico Logo / Expand Sidebar Toggle */}
            <div className="group relative w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="Rico"
                src="/brand-rico-mark-transparent.png"
                className="w-[34px] h-[34px] sm:w-[36px] sm:h-[36px] max-w-none object-contain transition-opacity duration-150 group-hover:opacity-0 group-focus-within:opacity-0 pointer-events-none"
              />
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Expand sidebar"
                title="Expand sidebar"
                className="absolute inset-0 w-10 h-10 sm:w-9 sm:h-9 rounded-[9px] flex items-center justify-center text-[oklch(0.097_0_0)] hover:bg-[oklch(0.097_0_0_/_0.05)] opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
              >
                <PanelLeft
                  className="w-[18px] h-[18px] stroke-[2]"
                  aria-hidden="true"
                />
              </button>
            </div>

            {/* Primary Actions */}
            <div className="flex flex-col items-center gap-2 sm:gap-2.5 w-10">
              <button
                type="button"
                onClick={() => {
                  onClearChat();
                  setActiveSection("chat");
                  setIsSplitView(false);
                }}
                aria-label="New chat"
                title="New chat"
                className="w-10 h-10 sm:w-9 sm:h-9 rounded-full bg-[oklch(0.097_0_0_/_0.05)] hover:bg-[oklch(0.097_0_0_/_0.09)] text-[oklch(0.097_0_0)] flex items-center justify-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
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
                className="w-10 h-10 sm:w-9 sm:h-9 rounded-full text-[oklch(0.097_0_0)] hover:bg-[oklch(0.097_0_0_/_0.05)] flex items-center justify-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
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
                className={`w-10 h-10 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 ${
                  activeSection === "spending"
                    ? "bg-[oklch(0.097_0_0_/_0.09)] text-[oklch(0.097_0_0)]"
                    : "text-[oklch(0.097_0_0)] hover:bg-[oklch(0.097_0_0_/_0.05)]"
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
                className={`w-10 h-10 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 ${
                  activeSection === "mcp-skills"
                    ? "bg-[oklch(0.097_0_0_/_0.09)] text-[oklch(0.097_0_0)]"
                    : "text-[oklch(0.097_0_0)] hover:bg-[oklch(0.097_0_0_/_0.05)]"
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
                className={`w-10 h-10 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 ${
                  activeSection === "schedule"
                    ? "bg-[oklch(0.097_0_0_/_0.09)] text-[oklch(0.097_0_0)]"
                    : "text-[oklch(0.097_0_0)] hover:bg-[oklch(0.097_0_0_/_0.05)]"
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
            className="fixed inset-0 z-30 bg-[#131010]/25 backdrop-blur-[1px] md:hidden"
          />
          <aside
            aria-label="Workspace navigation"
            className="fixed inset-y-0 left-0 z-40 w-[264px] bg-[oklch(0.9844_0_89.876)] p-3 shadow-xl md:static md:z-auto md:w-[252px] md:shadow-none h-full shrink-0 flex flex-col justify-between select-none"
          >
            <div className="w-full flex flex-col gap-3 min-h-0 flex-1">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="Rico"
                    src="/brand-rico-mark-transparent.png"
                    className="w-8 h-8 object-contain"
                  />
                  <span className="text-[14px] font-semibold tracking-[-0.015em] text-[oklch(0.097_0_0)]">
                    Rico
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  aria-label="Collapse sidebar"
                  title="Collapse sidebar"
                  className="w-9 h-9 sm:w-8 sm:h-8 rounded-[8px] flex items-center justify-center text-[#5C5858] hover:text-[#1E1B1B] hover:bg-[oklch(0.097_0_0_/_0.05)] transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
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
                className="w-full h-9 px-3 rounded-lg bg-[oklch(0.097_0_0)] text-[oklch(0.994_0_89.876)] text-[13px] font-medium flex items-center gap-2.5 hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
              >
                <Plus
                  className="w-[17px] h-[17px] stroke-[2]"
                  aria-hidden="true"
                />
                <span>New Chat</span>
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
                className="w-full h-9 px-3 rounded-lg bg-[oklch(0.097_0_0_/_0.04)] hover:bg-[oklch(0.097_0_0_/_0.08)] text-[oklch(0.097_0_0)] text-[13px] font-medium flex items-center gap-2.5 transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
              >
                <Search
                  className="w-[17px] h-[17px] stroke-[2]"
                  aria-hidden="true"
                />
                <span className="flex-1 text-left">Search</span>
                <span className="text-[10.5px] font-mono text-[#8A8585]">
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
                    className={`w-full h-9 px-3 rounded-lg text-[13px] font-medium flex items-center gap-2.5 transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40 ${
                      item.isActive
                        ? "bg-[oklch(0.097_0_0_/_0.08)] text-[oklch(0.097_0_0)]"
                        : "text-[#5C5858] hover:text-[#1E1B1B] hover:bg-[oklch(0.097_0_0_/_0.04)]"
                    }`}
                  >
                    {item.icon}
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </nav>

            <div className="pt-2.5 mt-1 border-t border-[#E6E4E3] flex-1 min-h-0 overflow-y-auto space-y-1 oc-scroller">
              <div className="flex items-center justify-between px-2 pb-1">
                <span className="text-[11px] font-medium text-[#8A8585] uppercase tracking-wider">
                  Rules
                </span>
                <button
                  type="button"
                  onClick={onCreateMandateClick}
                  title="Add spending rule"
                  className="text-[11px] font-medium text-[#5C5858] hover:text-[#1E1B1B] inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 hover:bg-[#EFECEB] transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
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
                    className={`rounded-md transition-colors duration-100 ${
                      isSelected
                        ? "bg-white border border-[#E6E4E3]"
                        : "hover:bg-[#EFECEB]/70"
                    }`}
                  >
                    <button
                      type="button"
                      data-testid="sidebar-rule"
                      onClick={() => setActiveThread(`mandate-${idx}`)}
                      className="w-full px-2.5 py-1.5 flex flex-col gap-0.5 text-left"
                    >
                      <div className="flex items-center justify-between w-full gap-2">
                        <span className="text-[12.5px] text-[#1E1B1B] font-medium truncate">
                          {mandate.service}
                        </span>
                        <span className="text-[11px] font-mono tabular-nums text-[#5C5858] shrink-0">
                          ${mandate.budgetCeiling.toFixed(0)}
                        </span>
                      </div>
                      <span className="text-[10.5px] text-[#8A8585] truncate">
                        {mandate.recurrence}
                      </span>
                    </button>

                    {isSelected && (
                      <div className="flex justify-end px-2.5 pb-2">
                        <button
                          type="button"
                          data-testid="sidebar-run-now"
                          onClick={() => onTriggerMandate(mandate.id)}
                          className="h-6 px-2.5 rounded bg-[#1E1B1B] text-white text-[10.5px] font-medium hover:bg-[#332F2F] transition-colors duration-100"
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

          <div className="w-full pt-2 border-t border-[#E6E4E3] flex flex-col gap-1">
            <button
              type="button"
              onClick={onToggleStrictMode}
              title={
                strictMode
                  ? "Manual approval required"
                  : "Autonomous within rule cap"
              }
              className={`w-full h-9 px-2.5 rounded-lg text-[12.5px] flex items-center gap-2.5 transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40 ${
                strictMode
                  ? "text-amber-900 bg-amber-100/80 hover:bg-amber-100"
                  : "text-[#5C5858] hover:text-[#1E1B1B] hover:bg-[#EFECEB]"
              }`}
            >
              {strictMode ? (
                <ShieldAlert className="w-[17px] h-[17px] shrink-0 stroke-[2]" />
              ) : (
                <ShieldCheck className="w-[17px] h-[17px] shrink-0 stroke-[2]" />
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

      {/* Main Rounded Surface Card (.openui-agent-thread-container) */}
      <div
        ref={stageRef}
        className="relative flex-1 min-w-0 my-1 mr-1 rounded-[16px] bg-[oklch(0.994_0_89.876)] outline outline-1 outline-[oklch(0.097_0_0_/_0.04)] flex flex-row overflow-hidden"
      >
        {/* Left Half (or Full Width when unsplit): Active Section Surface */}
        <div
          className={`relative h-full flex flex-col min-w-0 bg-[oklch(0.994_0_89.876)] ${
            isSplitView && activeSection === "chat"
              ? "w-full md:w-1/2 md:border-r border-[oklch(0.097_0_0_/_0.06)]"
              : "w-full"
          }`}
        >
          {activeSection === "chat" ? (
            <>
              {/* Thread Header (.openui-agent-thread-header) */}
              <header className="h-[44px] pt-3 px-3 flex items-center justify-between shrink-0 z-10">
                <div ref={modelMenuRef} className="relative">
                  <button
                    type="button"
                    role="combobox"
                    aria-expanded={modelMenuOpen}
                    aria-controls="rico-model-listbox"
                    aria-label="Select model"
                    title={selectedModel.id}
                    onClick={() => setModelMenuOpen((v) => !v)}
                    className="h-8 px-3 rounded-full bg-[oklch(0.097_0_0_/_0.04)] hover:bg-[oklch(0.097_0_0_/_0.07)] text-[oklch(0.097_0_0)] text-[12px] font-normal leading-[12px] tracking-[-0.12px] inline-flex items-center gap-1.5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/google-light.svg"
                      alt=""
                      aria-hidden="true"
                      className="w-[14px] h-[14px] shrink-0 object-contain"
                    />
                    <span className="truncate">{selectedModel.label}</span>
                    <ChevronDown
                      className="w-3 h-3 opacity-40 shrink-0 stroke-[2]"
                      aria-hidden="true"
                    />
                  </button>

                  {modelMenuOpen && (
                    <div
                      id="rico-model-listbox"
                      role="listbox"
                      aria-label="Models"
                      className="absolute left-0 top-10 z-50 w-52 rounded-xl border border-black/[0.08] bg-white p-1 shadow-[0_10px_28px_rgba(0,0,0,0.08)]"
                    >
                      {MODEL_OPTIONS.map((opt) => {
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
                            }}
                            className={`w-full h-8 px-2.5 rounded-lg text-[12.5px] flex items-center gap-2 text-left transition-colors ${
                              active
                                ? "bg-[oklch(0.097_0_0_/_0.06)] font-medium text-[oklch(0.097_0_0)]"
                                : "text-[oklch(0.097_0_0_/_0.75)] hover:bg-[oklch(0.097_0_0_/_0.04)]"
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src="/google-light.svg"
                              alt=""
                              aria-hidden="true"
                              className="w-3.5 h-3.5 shrink-0 object-contain"
                            />
                            <span className="truncate">{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* OpenCode-style Top-Right Split Toggle Button */}
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
                  className={`hidden md:flex w-9 h-9 rounded-[9px] items-center justify-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 ${
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
                /* Exact OpenUI Welcome Screen (.openui-agent-welcome-screen--with-composer) */
                <div className="flex-1 min-h-0 w-full max-w-[760px] mx-auto px-4 pt-3 pb-[116px] grid grid-rows-[1fr_auto_1fr] grid-cols-1 justify-items-center overflow-y-auto oc-scroller">
                  {/* Greeting Header */}
                  <div className="self-end mb-9 w-full max-w-[728px] flex flex-col items-center text-center gap-2">
                    <h1 className="m-0 text-[24px] font-normal leading-[30px] tracking-[-0.24px] text-[oklch(0.097_0_0)]">
                      {userProfile.firstName
                        ? `Good to see you, ${userProfile.firstName}`
                        : "Good to see you"}
                    </h1>
                    <p className="m-0 text-[24px] font-medium leading-[26.4px] tracking-[-0.24px] text-[oklch(0.097_0_0_/_0.6)]">
                      What&apos;s on your mind today?
                    </p>
                  </div>

                  {/* Centered Pill Composer */}
                  <div className="w-full max-w-[728px] flex justify-center">
                    {renderPillComposer("rico-welcome-composer")}
                  </div>

                  <div aria-hidden="true" />
                </div>
              ) : (
                /* Active Session Timeline + Bottom Pill Composer */
                <>
                  <div className="flex-1 w-full min-h-0 overflow-y-auto px-4 sm:px-6 py-5 oc-scroller">
                    <div className="w-full max-w-[680px] mx-auto space-y-5">
                      {messages.map((message) => (
                        <ChatMessageRenderer
                          key={message.id}
                          message={message}
                          onViewReceipt={onViewReceipt}
                          onOpenInBrowser={handleOpenInBrowser}
                          isExpandedDefault={false}
                        />
                      ))}

                      {isChatLoading && (
                        <div className="flex items-center gap-2 text-[12.5px] text-[#5C5858] pl-9">
                          <Loader2 className="w-3.5 h-3.5 text-[#034CFF] animate-spin shrink-0" />
                          <span className="oc-text-shimmer font-medium">
                            {activeBrowserAction?.detail ||
                              "Browsing live web & verifying..."}
                          </span>
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>
                  </div>

                  <div className="w-full px-4 sm:px-6 pb-4 pt-2 shrink-0">
                    <div className="w-full max-w-[728px] mx-auto">
                      {renderPillComposer("rico-thread-composer", "up")}
                    </div>
                  </div>
                </>
              )}
            </>
          ) : activeSection === "spending" ? (
            <div className="flex-1 min-h-0 flex flex-col">
              <header className="px-4 sm:px-5 pt-3.5 pb-3 border-b border-[oklch(0.097_0_0_/_0.06)] flex flex-wrap items-center justify-between gap-2.5 shrink-0">
                <div className="flex items-center gap-3 min-w-0 max-w-full flex-wrap">
                  <h1 className="m-0 text-[15px] font-semibold tracking-[-0.015em] text-[oklch(0.097_0_0)]">
                    Spending
                  </h1>
                  <div
                    role="tablist"
                    aria-label="Spending views"
                    className="inline-flex items-center p-0.5 rounded-full bg-[oklch(0.097_0_0_/_0.04)] max-w-full overflow-x-auto no-scrollbar"
                  >
                    {(
                      [
                        { id: "rules", label: "Rules" },
                        { id: "transactions", label: "Transactions" },
                        { id: "audit", label: "Activity" },
                        { id: "savings", label: "Savings" },
                        { id: "invoices", label: "Invoices" },
                      ] as const
                    ).map((tab) => {
                      const selected = spendingTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          role="tab"
                          aria-selected={selected}
                          onClick={() => setSpendingTab(tab.id)}
                          className={`h-7 px-3 rounded-full text-[12px] font-medium whitespace-nowrap transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 ${
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
                    className="h-9 px-3.5 rounded-full bg-[oklch(0.097_0_0)] text-[oklch(0.994_0_89.876)] text-xs font-medium inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/25"
                  >
                    <Plus className="w-4 h-4 stroke-[2]" aria-hidden="true" />
                    <span>New rule</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSection("chat")}
                    aria-label="Close Spending and return home"
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

              <div className="flex-1 min-h-0 overflow-y-auto oc-scroller">
                {spendingTab === "rules" && (
                  <div className="h-full max-w-5xl mx-auto px-5 py-5 flex flex-col">
                    <div className="flex-1 rounded-xl border border-[#E6E4E3] bg-white p-3 overflow-hidden">
                      <AgGridMandatesTable
                        mandates={mandates}
                        onTriggerMandate={onTriggerMandate}
                        isDarkMode={false}
                      />
                    </div>
                  </div>
                )}

                {spendingTab === "transactions" && (
                  <div className="h-full max-w-5xl mx-auto px-5 py-5 flex flex-col">
                    <div className="flex-1 rounded-xl border border-[#E6E4E3] bg-white p-3 overflow-hidden">
                      <AgGridTransactionsTable
                        transactions={transactions}
                        onViewReceipt={onViewReceipt}
                        isDarkMode={false}
                      />
                    </div>
                  </div>
                )}

                {spendingTab === "audit" && (
                  <div className="max-w-4xl mx-auto px-5 py-6 space-y-2.5">
                    {auditLogs.length === 0 ? (
                      <div className="rounded-xl border border-[#E6E4E3] bg-white p-8 text-center text-xs text-[#5C5858]">
                        No activity recorded in this session yet.
                      </div>
                    ) : (
                      <div className="rounded-xl border border-[#E6E4E3] bg-white divide-y divide-[#F1EFEF]">
                        {auditLogs.map((log) => (
                          <div
                            key={log.id}
                            className="p-3.5 flex items-start justify-between gap-4 text-xs"
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              {log.severity === "danger" ||
                              log.severity === "warning" ? (
                                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              )}
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-[#1E1B1B]">
                                    {log.service}
                                  </span>
                                  <span className="text-[11px] font-mono text-[#8A8585]">
                                    {log.eventType}
                                  </span>
                                </div>
                                <p className="text-[#5C5858] m-0 mt-0.5 leading-relaxed">
                                  {log.details}
                                </p>
                              </div>
                            </div>
                            <span className="text-[11px] font-mono tabular-nums text-[#8A8585] shrink-0">
                              {log.timestamp}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {spendingTab === "savings" && (
                  <PersonaSavingsPanel
                    onDeployPlanMandate={onDeployPlanMandate}
                    onRefreshData={onRefreshData}
                  />
                )}

                {spendingTab === "invoices" && <InvoiceOcrPanel />}
              </div>
            </div>
          ) : activeSection === "mcp-skills" ? (
            <div className="flex-1 min-h-0 flex flex-col">
              <header className="px-4 sm:px-5 pt-3.5 pb-3 border-b border-[oklch(0.097_0_0_/_0.06)] flex flex-wrap items-center justify-between gap-2.5 shrink-0">
                <div className="flex items-center gap-3 min-w-0 max-w-full flex-wrap">
                  <h1 className="m-0 text-[15px] font-semibold tracking-[-0.015em] text-[oklch(0.097_0_0)]">
                    MCP &amp; skills
                  </h1>
                  <div
                    role="tablist"
                    aria-label="MCP and skills views"
                    className="inline-flex items-center p-0.5 rounded-full bg-[oklch(0.097_0_0_/_0.04)] max-w-full overflow-x-auto no-scrollbar"
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
                          className={`h-7 px-3 rounded-full text-[12px] font-medium whitespace-nowrap transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 ${
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

              <div className="flex-1 min-h-0 overflow-y-auto oc-scroller">
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
              <header className="px-4 sm:px-5 pt-3.5 pb-3 border-b border-[oklch(0.097_0_0_/_0.06)] flex flex-wrap items-center justify-between gap-2.5 shrink-0">
                <div className="flex items-center gap-3 min-w-0 max-w-full flex-wrap">
                  <h1 className="m-0 text-[15px] font-semibold tracking-[-0.015em] text-[oklch(0.097_0_0)]">
                    Schedule
                  </h1>
                  <div
                    role="tablist"
                    aria-label="Schedule views"
                    className="inline-flex items-center p-0.5 rounded-full bg-[oklch(0.097_0_0_/_0.04)] max-w-full overflow-x-auto no-scrollbar"
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
                          className={`h-7 px-3 rounded-full text-[12px] font-medium whitespace-nowrap transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 ${
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
                    className="h-9 px-3.5 rounded-full bg-[oklch(0.097_0_0)] text-[oklch(0.994_0_89.876)] text-xs font-medium inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/25"
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

              <div className="flex-1 min-h-0 overflow-y-auto oc-scroller">
                {scheduleTab === "scheduled" && (
                  <div className="max-w-4xl mx-auto px-5 py-6 space-y-3">
                    {mandates.length === 0 ? (
                      <div className="rounded-2xl border border-[#E6E4E3] bg-white p-8 text-center space-y-3">
                        <p className="m-0 text-sm font-medium text-[#1E1B1B]">
                          No scheduled rules yet
                        </p>
                        <p className="m-0 text-xs text-[#5C5858]">
                          Create a recurring spending rule to automate verified
                          billing schedules within your cap.
                        </p>
                        <button
                          type="button"
                          onClick={onCreateMandateClick}
                          className="h-8 px-3.5 rounded-full bg-[#1E1B1B] text-white text-xs font-medium inline-flex items-center gap-1.5 hover:bg-[#332F2F] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/25"
                        >
                          <Plus
                            className="w-3.5 h-3.5 stroke-[2]"
                            aria-hidden="true"
                          />
                          <span>Schedule first rule</span>
                        </button>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-[#E6E4E3] bg-white divide-y divide-[#F1EFEF]">
                        {mandates.map((mandate) => (
                          <div
                            key={mandate.id}
                            className="p-4 flex items-center justify-between gap-4"
                          >
                            <div className="min-w-0 space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[13.5px] font-semibold text-[#1E1B1B] truncate">
                                  {mandate.service}
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-[#F1EFEF] text-[10.5px] font-mono text-[#5C5858]">
                                  {mandate.status}
                                </span>
                              </div>
                              <p className="m-0 text-xs text-[#5C5858]">
                                {mandate.recurrence} · Next run:{" "}
                                <span className="font-mono text-[#1E1B1B]">
                                  {mandate.nextRun}
                                </span>
                              </p>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-xs font-mono tabular-nums text-[#5C5858]">
                                Cap ${mandate.budgetCeiling.toFixed(2)}
                              </span>
                              <button
                                type="button"
                                onClick={() => onTriggerMandate(mandate.id)}
                                className="h-7 px-3 rounded-full bg-[#1E1B1B] hover:bg-[#332F2F] text-white text-[11.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/25"
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

        {/* Right Half (50%): Shared Split Co-Working Workspace (Browser, Doc, Excel) */}
        {isSplitView && activeSection === "chat" && (
          <aside
            aria-label="Split workspace"
            className="hidden md:flex w-1/2 h-full min-w-0 bg-[#FCFCFC]"
          >
            <SplitWorkspacePane
              activeTool={splitTool}
              onSelectTool={(tool) => setSplitTool(tool)}
              onCloseSplit={() => setIsSplitView(false)}
              isBrowserStreaming={Boolean(activeBrowserAction)}
              externalBrowserUrl={activeBrowserAction?.url || null}
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
            />
          </aside>
        )}
      </div>
    </div>
  );
}
