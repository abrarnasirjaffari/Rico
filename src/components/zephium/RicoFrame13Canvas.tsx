"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ArrowUp,
  ChevronDown,
  FileText,
  Image as ImageIcon,
  Loader2,
  PanelLeft,
  Paperclip,
  SquarePen,
  Plus,
  User,
  ShieldCheck,
  ShieldAlert,
  Plug,
  Globe,
  CreditCard,
  Sparkles,
  MessageSquare,
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
import { WorkSurfaceTab } from "@/components/dashboard/WorkSurface";
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

      {collapsed ? (
        <button
          type="button"
          onClick={handleClick}
          title={
            isAuthenticated && user ? `Signed in as ${user.email}` : "Profile"
          }
          aria-label={isAuthenticated ? "Account menu" : "Profile"}
          className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 ${
            isAuthenticated
              ? "bg-[oklch(0.097_0_0)] text-[oklch(0.994_0_89.876)] hover:opacity-85"
              : "bg-[oklch(0.097_0_0_/_0.05)] text-[oklch(0.097_0_0)] hover:bg-[oklch(0.097_0_0_/_0.09)]"
          }`}
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : isAuthenticated && user ? (
            user.email.charAt(0).toUpperCase()
          ) : (
            <User className="w-4 h-4 stroke-[2]" aria-hidden="true" />
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          title={
            isAuthenticated && user ? `Signed in as ${user.email}` : "Sign in"
          }
          aria-label={isAuthenticated ? "Account menu" : "Sign in"}
          className="w-full h-8 px-2 rounded-md flex items-center gap-2 text-[12.5px] font-medium text-[#1E1B1B] hover:bg-[#EFECEB] transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
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
          <span className="truncate text-left flex-1">
            {isAuthenticated && user
              ? session?.isSimulated
                ? "Demo sandbox"
                : user.email
              : "Sign in"}
          </span>
        </button>
      )}

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
  onRefreshData?: () => void;
}

export function RicoFrame13Canvas({
  mandates,
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
}: RicoFrame13CanvasProps) {
  const { isAuthenticated, demoLogin } = useAuth();
  // Collapsed slim rail and full-width welcome chat card by default to match OpenUI Cloud Chat home
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSplitView, setIsSplitView] = useState(false);
  const [activeWorkspaceTab, setActiveWorkspaceTab] =
    useState<WorkSurfaceTab>("viewport");
  const [activeView, setActiveView] = useState<"chat" | "workspace">("chat");
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

  const handleOpenWorkspaceTab = (tab: WorkSurfaceTab) => {
    if (isSplitView && activeWorkspaceTab === tab) {
      setIsSplitView(false);
      setActiveView("chat");
      return;
    }
    setActiveWorkspaceTab(tab);
    setIsSplitView(true);
  };

  const handleOpenInBrowser = useCallback(() => {
    setIsSplitView(true);
    setActiveWorkspaceTab("viewport");
  }, []);

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
      id: "nav-chat",
      label: "New Chat",
      icon: <MessageSquare className="w-4 h-4 shrink-0" />,
      isActive: activeView === "chat" && !isSplitView,
      onClick: () => {
        setActiveView("chat");
        setIsSplitView(false);
      },
    },
    {
      id: "nav-browser",
      label: "Live browser",
      icon: <Globe className="w-4 h-4 shrink-0" />,
      isActive: isSplitView && activeWorkspaceTab === "viewport",
      onClick: () => handleOpenWorkspaceTab("viewport"),
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
            className="w-8 h-8 rounded-full bg-[oklch(0.097_0_0_/_0.05)] hover:bg-[oklch(0.097_0_0_/_0.09)] text-[oklch(0.097_0_0)] flex items-center justify-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
          >
            <Plus
              className={`w-4 h-4 stroke-[2] transition-transform duration-150 ${
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
            className="w-8 h-8 rounded-full bg-[oklch(0.097_0_0)] text-[oklch(0.994_0_89.876)] flex items-center justify-center transition-opacity duration-150 enabled:hover:opacity-85 disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/25 focus-visible:ring-offset-2"
          >
            {isChatLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowUp className="w-4 h-4 stroke-[2]" aria-hidden="true" />
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
      {/* Left Sidebar: Exact OpenUI 68px Collapsed Rail or Expanded Rico Workspace Drawer */}
      {!isSidebarOpen ? (
        <aside
          aria-label="Workspace navigation"
          className="w-[68px] h-full py-4 px-[18px] shrink-0 flex flex-col justify-between select-none"
        >
          <div className="flex flex-col gap-6 w-8">
            {/* Rico Logo / Expand Sidebar Toggle */}
            <div className="group relative w-8 h-8 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="Rico"
                src="/brand-rico-mark-transparent.png"
                className="w-[34px] h-[34px] max-w-none object-contain transition-opacity duration-150 group-hover:opacity-0 group-focus-within:opacity-0 pointer-events-none"
              />
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Expand sidebar"
                title="Expand sidebar"
                className="absolute inset-0 w-8 h-8 rounded-[7px] flex items-center justify-center text-[oklch(0.097_0_0)] hover:bg-[oklch(0.097_0_0_/_0.05)] opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
              >
                <PanelLeft className="w-4 h-4 stroke-[2]" aria-hidden="true" />
              </button>
            </div>

            {/* Primary Actions */}
            <div className="flex flex-col gap-3 w-8">
              <button
                type="button"
                onClick={() => {
                  onClearChat();
                  setActiveView("chat");
                  setIsSplitView(false);
                }}
                aria-label="New chat"
                title="New chat"
                className="w-8 h-8 rounded-full bg-[oklch(0.097_0_0)] text-[oklch(0.994_0_89.876)] flex items-center justify-center hover:opacity-85 transition-opacity duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/25 focus-visible:ring-offset-2"
              >
                <SquarePen
                  className="w-[14px] h-[14px] stroke-[2]"
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>

          <div className="w-8">
            <ProfileMenu collapsed={true} />
          </div>
        </aside>
      ) : (
        <aside
          aria-label="Workspace navigation"
          className="w-[248px] h-full p-3 shrink-0 flex flex-col justify-between select-none"
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
                <span className="text-[13.5px] font-semibold tracking-[-0.015em] text-[oklch(0.097_0_0)]">
                  Rico
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                aria-label="Collapse sidebar"
                title="Collapse sidebar"
                className="w-7 h-7 rounded-[7px] flex items-center justify-center text-[#5C5858] hover:text-[#1E1B1B] hover:bg-[oklch(0.097_0_0_/_0.05)] transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
              >
                <PanelLeft className="w-4 h-4 stroke-[2]" aria-hidden="true" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                onClearChat();
                setActiveView("chat");
                setIsSplitView(false);
              }}
              className="w-full h-8 px-2.5 rounded-lg bg-[oklch(0.097_0_0)] text-[oklch(0.994_0_89.876)] text-[12.5px] font-medium flex items-center gap-2 hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
            >
              <SquarePen className="w-3.5 h-3.5 stroke-[2]" aria-hidden="true" />
              <span>New Chat</span>
            </button>

            <nav className="flex flex-col gap-0.5">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.onClick}
                  title={item.label}
                  className={`w-full h-8 px-2.5 rounded-md text-[12.5px] font-medium flex items-center gap-2.5 transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40 ${
                    item.isActive
                      ? "bg-[oklch(0.097_0_0_/_0.07)] text-[oklch(0.097_0_0)]"
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
              className={`w-full h-8 px-2 rounded-md text-[12px] flex items-center gap-2 transition-colors duration-100 ${
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
              <span className="truncate">
                {strictMode ? "Manual approval" : "Autonomous mode"}
              </span>
            </button>

            <ProfileMenu collapsed={false} />
          </div>
        </aside>
      )}

      {/* Main Rounded Surface Card (.openui-agent-thread-container) */}
      <div
        ref={stageRef}
        className="relative flex-1 min-w-0 my-1 mr-1 rounded-[16px] bg-[oklch(0.994_0_89.876)] outline outline-1 outline-[oklch(0.097_0_0_/_0.04)] flex flex-row overflow-hidden"
      >
        {/* Single OpenCode-style Top-Right Split Button */}
        <button
          type="button"
          onClick={() => setIsSplitView((v) => !v)}
          aria-pressed={isSplitView}
          aria-label={isSplitView ? "Close split view" : "Split view"}
          title={isSplitView ? "Close split view" : "Split view"}
          className={`absolute top-3 right-3 z-20 w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 ${
            isSplitView
              ? "bg-[oklch(0.097_0_0_/_0.07)] text-[oklch(0.097_0_0)] hover:bg-[oklch(0.097_0_0_/_0.1)]"
              : "text-[oklch(0.097_0_0_/_0.65)] hover:text-[oklch(0.097_0_0)] hover:bg-[oklch(0.097_0_0_/_0.05)]"
          }`}
        >
          <svg
            width="16"
            height="16"
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

        {/* Left Half (or Full Width when unsplit): Chat Panel */}
        <div
          className={`relative h-full flex flex-col min-w-0 bg-[oklch(0.994_0_89.876)] ${
            isSplitView
              ? "w-1/2 border-r border-[oklch(0.097_0_0_/_0.06)]"
              : "w-full"
          }`}
        >
          {/* Thread Header (.openui-agent-thread-header) */}
          <header className="h-[44px] pt-3 px-3 flex items-center justify-start shrink-0 z-10">
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
                          setSelectedModel(opt);
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
          </header>

          {messages.length === 0 ? (
            /* Exact OpenUI Welcome Screen (.openui-agent-welcome-screen--with-composer) */
            <div className="flex-1 min-h-0 w-full max-w-[760px] mx-auto px-4 pt-3 pb-[116px] grid grid-rows-[1fr_auto_1fr] grid-cols-1 justify-items-center overflow-y-auto oc-scroller">
              {/* Greeting Header */}
              <div className="self-end mb-9 w-full max-w-[728px] flex flex-col items-center text-center gap-2">
                <h1 className="m-0 text-[24px] font-normal leading-[30px] tracking-[-0.24px] text-[oklch(0.097_0_0)]">
                  Good to see you
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
        </div>

        {/* Right Half (50%): Empty Split Pane */}
        {isSplitView && (
          <aside
            aria-label="Split pane"
            className="w-1/2 h-full min-w-0 bg-[oklch(0.994_0_89.876)]"
          />
        )}
      </div>
    </div>
  );
}
