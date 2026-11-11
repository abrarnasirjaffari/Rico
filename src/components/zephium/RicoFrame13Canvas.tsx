"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ArrowUp,
  Loader2,
  PanelLeft,
  PanelRight,
  SquarePen,
  Plus,
  User,
  ShieldCheck,
  ShieldAlert,
  Search,
  Plug,
  Globe,
  CreditCard,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import { Mandate, Transaction, AuditLog } from "@/components/dashboard/types";
import { ReceiptData } from "@/components/dashboard/ReceiptDialog";
import { ApprovalRequest } from "@/components/dashboard/ApprovalDialog";
import {
  ChatMessage,
  BrowserActionItem,
} from "@/lib/chat/use-payagent-chat";
import { ChatMessageRenderer } from "@/components/chat/ChatMessageRenderer";
import {
  WorkSurface,
  WorkSurfaceTab,
} from "@/components/dashboard/WorkSurface";
import { useAuth } from "@/lib/auth/AuthContext";

function ProfileMenu({ collapsed }: { collapsed: boolean }) {
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
  const [loggingOut, setLoggingOut] = useState(false);
  const [startingDemo, setStartingDemo] = useState(false);

  const handleClick = () => {
    if (isLoading) return;
    if (isAuthenticated) setMenuOpen((open) => !open);
    else openAuthPrompt();
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

  return (
    <div className="relative w-full space-y-1">
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

      <button
        type="button"
        onClick={handleClick}
        title={
          isAuthenticated && user ? `Signed in as ${user.email}` : "Sign in"
        }
        aria-label={isAuthenticated ? "Account menu" : "Sign in"}
        className={`w-full h-8 rounded-md flex items-center gap-2 text-[12.5px] font-medium text-[#1E1B1B] hover:bg-[#EFECEB] transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40 ${
          collapsed ? "justify-center px-0" : "px-2"
        }`}
      >
        <span
          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10.5px] font-semibold shrink-0 ${
            isAuthenticated
              ? "bg-[#1E1B1B] text-white"
              : "bg-white border border-[#D6D3D1] text-[#5C5858]"
          }`}
        >
          {isLoading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : isAuthenticated && user ? (
            user.email.charAt(0).toUpperCase()
          ) : (
            <User className="w-3 h-3" />
          )}
        </span>
        {!collapsed && (
          <span className="truncate text-left flex-1">
            {isAuthenticated && user
              ? session?.isSimulated
                ? "Demo sandbox"
                : user.email
              : "Sign in"}
          </span>
        )}
      </button>

      {menuOpen && isAuthenticated && user && (
        <div className="absolute left-0 bottom-10 z-50 w-56 rounded-xl border border-[#E6E4E3] bg-white p-3 shadow-[0_12px_32px_rgba(30,27,27,0.12)]">
          <p className="text-[11px] text-[#8A8585] m-0">Signed in as</p>
          <p
            className="text-xs font-medium text-[#1E1B1B] truncate m-0 mt-0.5"
            title={user.email}
          >
            {user.email}
          </p>
          {session?.isSimulated && (
            <p className="mt-2 mb-0 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2 py-1">
              Sandbox session: mock payments only
            </p>
          )}
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="mt-3 w-full h-8 rounded-md bg-[#1E1B1B] text-white text-xs font-medium hover:bg-[#332F2F] disabled:opacity-60 flex items-center justify-center gap-2 transition-colors duration-100"
          >
            {loggingOut && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Log out
          </button>
        </div>
      )}
    </div>
  );
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
  onOpenCommandPalette?: () => void;
  onRefreshData?: () => void;
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
  onApproveApproval,
  onRejectApproval,
  onDeployPlanMandate,
  onOpenCommandPalette,
  onRefreshData,
}: RicoFrame13CanvasProps) {
  const { isAuthenticated, demoLogin } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  // Right Split-Screen Browser open by default like OpenCode Review/Browser pane
  const [isSplitView, setIsSplitView] = useState(true);
  const [activeWorkspaceTab, setActiveWorkspaceTab] =
    useState<WorkSurfaceTab>("viewport");
  const [activeView, setActiveView] = useState<"chat" | "workspace">("chat");
  const [activeThread, setActiveThread] = useState<string>("today-1");
  const [externalBrowserUrl, setExternalBrowserUrl] = useState<string | null>(
    null
  );

  // Resizable split-pane width (% of stage width for Chat column)
  const [chatWidthPct, setChatWidthPct] = useState<number>(44);
  const [isDraggingSplit, setIsDraggingSplit] = useState<boolean>(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Responsive layout: keep Right Split Browser open on >=720px, collapse sidebar to icon rail on medium widths
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.innerWidth < 720) {
        setIsSplitView(false);
        setIsSidebarOpen(false);
      } else if (window.innerWidth < 1100) {
        setIsSplitView(true);
        setIsSidebarOpen(false);
      }
    }
  }, []);

  // Automatically open right split screen & focus Browser whenever agent uses the browser
  useEffect(() => {
    if (browserOpenSignal > 0) {
      setIsSplitView(true);
      setActiveWorkspaceTab("viewport");
      setActiveView("chat");
    }
  }, [browserOpenSignal]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isChatLoading]);

  useEffect(() => {
    if (activeView === "chat") {
      textareaRef.current?.focus();
    }
  }, [activeView]);

  // Drag resize logic (OpenCode ResizeHandle pattern)
  useEffect(() => {
    if (!isDraggingSplit) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!stageRef.current) return;
      const rect = stageRef.current.getBoundingClientRect();
      if (rect.width <= 0) return;
      const rawPct = ((e.clientX - rect.left) / rect.width) * 100;
      const clamped = Math.max(30, Math.min(64, rawPct));
      setChatWidthPct(clamped);
    };

    const handleMouseUp = () => {
      setIsDraggingSplit(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingSplit]);

  const handleOpenWorkspaceTab = (tab: WorkSurfaceTab) => {
    setActiveWorkspaceTab(tab);
    if (typeof window !== "undefined" && window.innerWidth >= 720) {
      setIsSplitView(true);
    } else {
      setActiveView("workspace");
    }
  };

  const handleOpenInBrowser = useCallback((url?: string) => {
    setIsSplitView(true);
    setActiveWorkspaceTab("viewport");
    if (url) {
      setExternalBrowserUrl(url);
    }
  }, []);

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
    if (!chatInput.trim() || isChatLoading) return;
    const text = chatInput.trim();
    onChatInputChange("");
    await dispatchChatWithSession(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const quickPrompts = [
    {
      label: "Search Vercel vs Render pricing",
      prompt: "Search Vercel Pro vs Render pricing plans",
    },
    {
      label: "Compare Netflix & Spotify live",
      prompt: "Compare Netflix and Spotify",
    },
    {
      label: "Search cloud GPU providers",
      prompt: "Search best cloud GPU providers hourly pricing",
    },
    {
      label: "Set a Netflix rule ($20 cap)",
      prompt: "Pay Netflix $15.99 on the 5th, max $20",
    },
  ];

  const navItems: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
  }> = [
    {
      id: "nav-chat",
      label: "Session",
      icon: <MessageSquare className="w-4 h-4 shrink-0" />,
      isActive: activeView === "chat" && activeWorkspaceTab === "viewport",
      onClick: () => {
        setActiveView("chat");
        setActiveWorkspaceTab("viewport");
      },
    },
    {
      id: "nav-browser",
      label: "Live browser",
      icon: <Globe className="w-4 h-4 shrink-0" />,
      isActive: activeView === "workspace" && activeWorkspaceTab === "viewport",
      onClick: () => {
        setActiveWorkspaceTab("viewport");
        if (!isSplitView) setActiveView("workspace");
      },
    },
    {
      id: "nav-rules",
      label: "Spending rules",
      icon: <CreditCard className="w-4 h-4 shrink-0" />,
      isActive:
        (isSplitView || activeView === "workspace") &&
        (activeWorkspaceTab === "mandates" ||
          activeWorkspaceTab === "transactions" ||
          activeWorkspaceTab === "audit"),
      onClick: () => handleOpenWorkspaceTab("mandates"),
    },
    {
      id: "nav-connectors",
      label: "Connectors & skills",
      icon: <Plug className="w-4 h-4 shrink-0" />,
      isActive:
        (isSplitView || activeView === "workspace") &&
        (activeWorkspaceTab === "mcp-connect" ||
          activeWorkspaceTab === "skills"),
      onClick: () => handleOpenWorkspaceTab("mcp-connect"),
    },
    {
      id: "nav-automations",
      label: "Automations",
      icon: <Sparkles className="w-4 h-4 shrink-0" />,
      isActive:
        (isSplitView || activeView === "workspace") &&
        (activeWorkspaceTab === "savings" ||
          activeWorkspaceTab === "sentinel" ||
          activeWorkspaceTab === "invoices" ||
          activeWorkspaceTab === "watchdog" ||
          activeWorkspaceTab === "guardrails"),
      onClick: () => handleOpenWorkspaceTab("savings"),
    },
  ];

  const renderComposer = (centered: boolean) => (
    <form
      onSubmit={handleSubmit}
      className={`w-full rounded-xl bg-white border border-[#D6D3D1] focus-within:border-[#1E1B1B] shadow-[0_2px_10px_rgba(30,27,27,0.04)] transition-colors duration-100 ${
        centered ? "p-3.5" : "p-3"
      }`}
    >
      <label htmlFor="rico-session-composer" className="sr-only">
        Ask Rico or search the web
      </label>
      <textarea
        id="rico-session-composer"
        ref={textareaRef}
        value={chatInput}
        onChange={(e) => onChatInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={centered ? 2 : 1}
        placeholder="Ask anything to search live in the browser, compare vendors, or set a spending rule..."
        className="w-full resize-none text-[14px] text-[#1E1B1B] placeholder-[#8A8585] outline-none border-none bg-transparent leading-relaxed min-h-[28px] max-h-[140px]"
      />

      <div className="flex items-center justify-between pt-2 border-t border-[#F1EFEF] mt-1.5">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onCreateMandateClick}
            title="New spending rule"
            className="h-7 px-2 rounded-md text-[12px] font-medium text-[#5C5858] hover:text-[#1E1B1B] hover:bg-[#F8F7F7] flex items-center gap-1 transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Rule</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenWorkspaceTab("mcp-connect")}
            title="MCP Connectors"
            className="h-7 px-2 rounded-md text-[12px] font-medium text-[#5C5858] hover:text-[#1E1B1B] hover:bg-[#F8F7F7] flex items-center gap-1 transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
          >
            <Plug className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">MCP</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenWorkspaceTab("viewport")}
            title="Focus right split browser"
            className="h-7 px-2 rounded-md text-[12px] font-medium text-[#5C5858] hover:text-[#1E1B1B] hover:bg-[#F8F7F7] flex items-center gap-1 transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Browser</span>
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-mono text-[#8A8585] select-none hidden sm:inline">
            gemini-3.8-flash
          </span>

          <button
            type="submit"
            disabled={!chatInput.trim() && !isChatLoading}
            aria-label="Send message"
            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40 ${
              chatInput.trim() && !isChatLoading
                ? "bg-[#1E1B1B] text-white hover:bg-[#332F2F] cursor-pointer"
                : "bg-[#EFECEB] text-[#8A8585] cursor-not-allowed"
            }`}
          >
            {isChatLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1E1B1B]" />
            ) : (
              <ArrowUp className="w-3.5 h-3.5 stroke-[2.2]" />
            )}
          </button>
        </div>
      </div>
    </form>
  );

  return (
    <div
      className={`w-screen h-screen flex flex-col bg-[#F8F7F7] text-[#1E1B1B] overflow-hidden font-[Inter,system-ui,sans-serif] ${
        isDraggingSplit ? "cursor-col-resize select-none" : ""
      }`}
    >
      {/* OpenCode 40px Global Titlebar */}
      <header className="h-10 px-3 border-b border-[#E6E4E3] bg-[#F8F7F7] grid grid-cols-[1fr_auto_1fr] items-center gap-2 shrink-0 select-none">
        {/* Left: Sidebar Toggle, New Session, Breadcrumb, Zephium Run Island */}
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            type="button"
            onClick={() => setIsSidebarOpen((v) => !v)}
            title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            className="w-7 h-7 rounded-md flex items-center justify-center text-[#5C5858] hover:text-[#1E1B1B] hover:bg-[#EFECEB] transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
          >
            <PanelLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              onClearChat();
              setActiveView("chat");
            }}
            title="New session"
            aria-label="New session"
            className="w-7 h-7 rounded-md flex items-center justify-center text-[#5C5858] hover:text-[#1E1B1B] hover:bg-[#EFECEB] transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
          >
            <SquarePen className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-1.5 pl-1 min-w-0">
            <div className="w-4 h-4 bg-[url('/brand-rico-mark-transparent.png')] bg-no-repeat bg-contain bg-center shrink-0" />
            <span className="text-[13px] font-semibold tracking-[-0.015em] text-[#1E1B1B]">
              rico
            </span>
            <span className="text-[#8A8585] text-xs">/</span>
            <span className="text-[12.5px] text-[#5C5858] truncate">
              session
            </span>
          </div>

          {activeBrowserAction && (
            <button
              type="button"
              onClick={() => handleOpenInBrowser(activeBrowserAction.url)}
              className="hidden lg:inline-flex items-center gap-1.5 ml-2 h-6 px-2.5 rounded-full bg-white border border-[#E6E4E3] text-[11.5px] text-[#1E1B1B] max-w-[260px] truncate transition-colors duration-100 hover:border-[#034CFF]"
            >
              <Loader2 className="w-3 h-3 text-[#034CFF] animate-spin shrink-0" />
              <span className="truncate">
                {activeBrowserAction.detail || activeBrowserAction.title || "Browsing live..."}
              </span>
            </button>
          )}
        </div>

        {/* Center: OpenCode Command Search Pill */}
        <div className="hidden sm:flex items-center justify-center">
          <button
            type="button"
            onClick={() => onOpenCommandPalette?.()}
            className="w-[240px] md:w-[300px] h-[26px] px-2.5 rounded-md bg-white/90 hover:bg-white border border-[#E6E4E3] text-[12px] text-[#8A8585] hover:text-[#1E1B1B] flex items-center justify-between transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
          >
            <span className="flex items-center gap-1.5 truncate">
              <Search className="w-3 h-3 shrink-0" />
              <span className="truncate">Search rules, browser, commands...</span>
            </span>
            <kbd className="text-[10.5px] font-mono text-[#8A8585] shrink-0">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Status & Right Split Browser Toggle */}
        <div className="flex items-center justify-end gap-1.5">
          <span className="hidden md:inline-flex items-center gap-1.5 px-2 h-6 rounded-md text-[11.5px] text-[#5C5858]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>PayPal MCP</span>
          </span>

          <button
            type="button"
            onClick={() => {
              setIsSplitView((prev) => {
                const next = !prev;
                if (next) {
                  setActiveView("chat");
                }
                return next;
              });
            }}
            className={`h-7 px-2.5 rounded-md text-[12px] font-medium flex items-center gap-1.5 border transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40 ${
              isSplitView
                ? "bg-[#1E1B1B] text-white border-[#1E1B1B]"
                : "bg-white text-[#5C5858] hover:text-[#1E1B1B] border-[#D6D3D1] hover:bg-[#F1EFEF]"
            }`}
            title="Toggle right split-screen browser pane"
          >
            <PanelRight className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Browser split</span>
          </button>
        </div>
      </header>

      {/* Main Shell Body */}
      <div className="flex-1 min-h-0 flex flex-row overflow-hidden">
        {/* Left Collapsible OpenCode Sidebar */}
        <aside
          aria-label="Workspace navigation"
          className={`h-full shrink-0 flex flex-col justify-between bg-[#F8F7F7] border-r border-[#E6E4E3] select-none transition-[width] duration-150 ease-out ${
            isSidebarOpen ? "w-[228px] p-2.5" : "w-[50px] py-2.5 px-1.5 items-center"
          }`}
        >
          <div className="w-full flex flex-col gap-2 min-h-0 flex-1">
            {/* Primary Navigation */}
            <nav className="flex flex-col gap-0.5">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.onClick}
                  title={item.label}
                  className={`h-8 rounded-md text-[12.5px] font-medium flex items-center gap-2.5 transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40 ${
                    isSidebarOpen ? "w-full px-2.5" : "w-8 justify-center px-0"
                  } ${
                    item.isActive
                      ? "bg-[#EFECEB] text-[#1E1B1B]"
                      : "text-[#5C5858] hover:text-[#1E1B1B] hover:bg-[#F1EFEF]"
                  }`}
                >
                  {item.icon}
                  {isSidebarOpen && <span className="truncate">{item.label}</span>}
                </button>
              ))}
            </nav>

            {/* Active Spending Rules List (Expanded Mode) */}
            {isSidebarOpen && (
              <div className="pt-2.5 mt-1 border-t border-[#E6E4E3] flex-1 min-h-0 overflow-y-auto space-y-1 oc-scroller">
                <div className="flex items-center justify-between px-2 pb-1">
                  <span className="text-[11px] font-medium text-[#8A8585] uppercase tracking-wider">
                    Rules
                  </span>
                  <button
                    type="button"
                    onClick={onCreateMandateClick}
                    title="Add spending rule"
                    className="text-[11px] font-medium text-[#5C5858] hover:text-[#1E1B1B] inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 hover:bg-[#EFECEB] transition-colors duration-100"
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
            )}
          </div>

          {/* Sidebar Bottom Controls */}
          <div className="w-full pt-2 border-t border-[#E6E4E3] flex flex-col gap-1">
            <button
              type="button"
              onClick={onToggleStrictMode}
              title={
                strictMode
                  ? "Manual approval required"
                  : "Autonomous within rule cap"
              }
              className={`h-8 rounded-md text-[12px] flex items-center gap-2 transition-colors duration-100 ${
                isSidebarOpen ? "w-full px-2" : "w-8 justify-center px-0"
              } ${
                strictMode
                  ? "text-amber-900 bg-amber-100/80 hover:bg-amber-100"
                  : "text-[#5C5858] hover:text-[#1E1B1B] hover:bg-[#EFECEB]"
              }`}
            >
              {strictMode ? (
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              )}
              {isSidebarOpen && (
                <span className="truncate">
                  {strictMode ? "Manual approval" : "Autonomous mode"}
                </span>
              )}
            </button>

            <ProfileMenu collapsed={!isSidebarOpen} />
          </div>
        </aside>

        {/* Split Stage: Center Chat Session + Resizable Handle + Right Live Browser */}
        <div
          ref={stageRef}
          className="flex-1 min-w-0 h-full flex flex-row overflow-hidden bg-[#FCFCFC]"
        >
          {/* Center Chat / Session Column */}
          {(activeView === "chat" || isSplitView) && (
            <div
              style={
                isSplitView ? { width: `${chatWidthPct}%` } : { width: "100%" }
              }
              className={`relative h-full flex flex-col min-w-0 bg-[#FCFCFC] ${
                isSplitView ? "min-w-[280px] border-r border-[#E6E4E3]" : "w-full"
              }`}
            >
              {messages.length === 0 ? (
                /* OpenCode Clean Empty Session + Composer */
                <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col items-center justify-center oc-scroller">
                  <div className="w-full max-w-[600px] flex flex-col items-center space-y-5 -mt-4">
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-[#F8F7F7] border border-[#E6E4E3] flex items-center justify-center">
                        <div className="w-5 h-5 bg-[url('/brand-rico-mark-transparent.png')] bg-no-repeat bg-contain bg-center" />
                      </div>
                      <h1 className="m-0 text-xl sm:text-[23px] font-semibold text-[#1E1B1B] tracking-[-0.02em]">
                        What should Rico research or handle?
                      </h1>
                      <p className="m-0 text-[13px] text-[#5C5858] max-w-md">
                        Ask anything that needs live web search or pricing verification — watch Rico browse and change pages in real time on the right.
                      </p>
                    </div>

                    {renderComposer(true)}

                    <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-[580px]">
                      {quickPrompts.map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => dispatchChatWithSession(item.prompt)}
                          className="h-7 px-3 rounded-md bg-[#F8F7F7] hover:bg-[#EFECEB] border border-[#E6E4E3] text-[12px] text-[#5C5858] hover:text-[#1E1B1B] transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Active Session Timeline + Bottom Dock */
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

                  <div className="w-full px-4 sm:px-6 pb-3.5 pt-2 shrink-0 bg-[#FCFCFC]">
                    <div className="w-full max-w-[680px] mx-auto">
                      {renderComposer(false)}
                    </div>
                  </div>
                </>
              )}

              {/* OpenCode Draggable Resize Handle */}
              {isSplitView && (
                <div
                  role="separator"
                  aria-orientation="vertical"
                  aria-label="Resize split screen"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setIsDraggingSplit(true);
                  }}
                  className="group absolute top-0 -right-[4px] bottom-0 w-[8px] z-30 cursor-col-resize flex items-center justify-center"
                >
                  <div
                    className={`w-[3px] h-full transition-opacity duration-150 ${
                      isDraggingSplit
                        ? "bg-[#034CFF] opacity-100"
                        : "bg-[#034CFF]/60 opacity-0 group-hover:opacity-100"
                    }`}
                  />
                </div>
              )}
            </div>
          )}

          {/* Right Split-Screen Pane: Live Browser + Review Workspace */}
          {(isSplitView || activeView === "workspace") && (
            <aside
              aria-label="Live browser and workspace"
              className="flex-1 h-full min-w-0 overflow-hidden bg-[#FCFCFC]"
            >
              <WorkSurface
                mandates={mandates}
                transactions={transactions}
                auditLogs={auditLogs}
                onTriggerMandate={onTriggerMandate}
                onViewReceipt={onViewReceipt}
                onCreateMandateClick={onCreateMandateClick}
                onDeployPlanMandate={onDeployPlanMandate}
                approvalRequest={approvalRequest}
                onApproveApproval={onApproveApproval}
                onRejectApproval={onRejectApproval}
                onRefreshData={onRefreshData}
                activeTab={activeWorkspaceTab}
                onTabChange={(tab) => setActiveWorkspaceTab(tab)}
                isBrowserStreaming={Boolean(activeBrowserAction) || isChatLoading}
                externalBrowserUrl={externalBrowserUrl}
              />
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
