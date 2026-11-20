"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Zap,
  CreditCard,
  Receipt,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Plus,
  Boxes,
  Globe,
  MessageSquare,
  Settings,
  X,
} from "lucide-react";
import { Mandate, Transaction, AuditLog } from "./types";
import { ReceiptData } from "./ReceiptDialog";
import type { ChatMessage } from "@/lib/chat/use-payagent-chat";

interface QuickCommandLauncherProps {
  isOpen: boolean;
  onClose: () => void;
  mandates: Mandate[];
  transactions: Transaction[];
  auditLogs: AuditLog[];
  messages?: ChatMessage[];
  onSendMessage: (text: string) => void;
  onOpenCreateMandate: () => void;
  onOpenSettings?: () => void;
  onViewReceipt: (receipt: ReceiptData) => void;
  onToggleStrictMode: () => void;
  strictMode: boolean;
  onTriggerParallelComparison?: (preset: "streaming" | "devtools" | "cloud") => void;
}

interface CommandItem {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  meta?: string;
  action: () => void;
}

export function QuickCommandLauncher({
  isOpen,
  onClose,
  mandates,
  transactions,
  auditLogs,
  messages = [],
  onSendMessage,
  onOpenCreateMandate,
  onOpenSettings,
  onViewReceipt,
  onToggleStrictMode,
  strictMode,
  onTriggerParallelComparison,
}: QuickCommandLauncherProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 40);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const buildCommandList = (): CommandItem[] => {
    const items: CommandItem[] = [];
    const q = query.trim().toLowerCase();

    if (q.length > 0) {
      items.push({
        id: "custom-prompt",
        category: "Ask RICO",
        title: `Ask Rico: "${query.trim()}"`,
        subtitle: "Send directly to conversation",
        icon: <Zap className="w-4 h-4" />,
        meta: "Prompt",
        action: () => {
          onSendMessage(query.trim());
          onClose();
        },
      });
    }

    const defaultActions: CommandItem[] = [
      {
        id: "action-new-mandate",
        category: "Actions",
        title: "New spending rule",
        subtitle: "Set a monthly cap and schedule for any subscription or vendor",
        icon: <Plus className="w-4 h-4" />,
        meta: "Rule",
        action: () => {
          onOpenCreateMandate();
          onClose();
        },
      },
      {
        id: "action-compare-streaming",
        category: "Actions",
        title: "Compare streaming plans",
        subtitle: "Inspect Netflix, Spotify, and YouTube pricing in parallel",
        icon: <Globe className="w-4 h-4" />,
        meta: "Browser",
        action: () => {
          if (onTriggerParallelComparison) {
            onTriggerParallelComparison("streaming");
          } else {
            onSendMessage("Compare streaming services pricing in parallel");
          }
          onClose();
        },
      },
      {
        id: "action-open-app-store",
        category: "Actions",
        title: "Browse MCP connectors & skills",
        subtitle: "Inspect connected tool servers and active SKILL.md modules",
        icon: <Boxes className="w-4 h-4" />,
        meta: "MCP",
        action: () => {
          onSendMessage("Show me available financial skills and connected MCP servers");
          onClose();
        },
      },
      {
        id: "action-scan-credits",
        category: "Actions",
        title: "Check startup & student credits",
        subtitle: "Probe eligible SaaS credit programs before paying",
        icon: <Sparkles className="w-4 h-4" />,
        meta: "Savings",
        action: () => {
          onSendMessage("Scan persona savings for Notion, PostHog, and Stripe deals");
          onClose();
        },
      },
      ...(onOpenSettings
        ? [
            {
              id: "action-open-settings",
              category: "Actions",
              title: "Open settings",
              subtitle:
                "Profile photo, name, language, currency, and payment preferences",
              icon: <Settings className="w-4 h-4" />,
              meta: "Settings",
              action: () => {
                onOpenSettings();
                onClose();
              },
            },
          ]
        : []),
      {
        id: "action-toggle-strict",
        category: "Actions",
        title: strictMode
          ? "Switch to Autonomous mode"
          : "Switch to Manual approval mode",
        subtitle: strictMode
          ? "Currently requiring manual confirmation on every rule"
          : "Currently auto-approving within verified budget caps",
        icon: strictMode ? (
          <ShieldAlert className="w-4 h-4" />
        ) : (
          <ShieldCheck className="w-4 h-4" />
        ),
        meta: strictMode ? "Strict" : "Auto",
        action: () => {
          onToggleStrictMode();
          onClose();
        },
      },
    ];

    defaultActions.forEach((act) => {
      if (!q || act.title.toLowerCase().includes(q) || act.subtitle.toLowerCase().includes(q)) {
        items.push(act);
      }
    });

    mandates.forEach((m) => {
      if (!q || m.service.toLowerCase().includes(q) || m.category.toLowerCase().includes(q)) {
        items.push({
          id: `mandate-${m.id}`,
          category: "Rules",
          title: `Check price for ${m.service}`,
          subtitle: `Cap $${m.budgetCeiling.toFixed(2)} ${m.currency} · ${m.recurrence}`,
          icon: <CreditCard className="w-4 h-4" />,
          meta: m.status,
          action: () => {
            onSendMessage(`How much is ${m.service}?`);
            onClose();
          },
        });
      }
    });

    transactions.forEach((tx) => {
      if (
        !q ||
        tx.service.toLowerCase().includes(q) ||
        tx.orderId.toLowerCase().includes(q)
      ) {
        items.push({
          id: `tx-${tx.id}`,
          category: "Receipts",
          title: `${tx.service} — $${tx.amount.toFixed(2)}`,
          subtitle: `${tx.orderId} · ${tx.timestamp}`,
          icon: <Receipt className="w-4 h-4" />,
          meta: "Receipt",
          action: () => {
            if (tx.receiptData) {
              onViewReceipt(tx.receiptData);
            }
            onClose();
          },
        });
      }
    });

    messages.forEach((msg) => {
      if (!q || msg.text.toLowerCase().includes(q)) {
        const snippet =
          msg.text.length > 72 ? `${msg.text.slice(0, 72)}…` : msg.text;
        items.push({
          id: `msg-${msg.id}`,
          category: "Chats",
          title: snippet || "Chat message",
          subtitle: `${msg.sender === "user" ? "You" : "Rico"} · ${msg.timestamp}`,
          icon: <MessageSquare className="w-4 h-4" />,
          meta: "Chat",
          action: () => {
            onClose();
          },
        });
      }
    });

    if (q) {
      auditLogs.forEach((log) => {
        if (
          log.service.toLowerCase().includes(q) ||
          log.details.toLowerCase().includes(q)
        ) {
          items.push({
            id: `log-${log.id}`,
            category: "Activity",
            title: `${log.service} · ${log.eventType}`,
            subtitle: log.details,
            icon: <ShieldCheck className="w-4 h-4" />,
            meta: log.timestamp,
            action: () => {
              onSendMessage(`Show audit log details for ${log.service}`);
              onClose();
            },
          });
        }
      });
    }

    return items;
  };

  const commandItems = buildCommandList();

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, commandItems.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev <= 0 ? commandItems.length - 1 : prev - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (commandItems[selectedIndex]) {
        commandItems[selectedIndex].action();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      className="fixed inset-0 z-[200] bg-[#131010]/35 backdrop-blur-[2px] flex items-start justify-center pt-20 px-4 select-none"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl bg-white border border-black/[0.08] rounded-2xl shadow-[0_16px_48px_rgba(30,27,27,0.14)] overflow-hidden flex flex-col max-h-[70vh]">
        <div className="px-4 py-3 border-b border-[#E6E4E3] flex items-center gap-3 shrink-0">
          <Search
            className="w-4 h-4 text-[#5C5858] shrink-0 stroke-[2]"
            aria-hidden="true"
          />
          <label htmlFor="rico-global-search" className="sr-only">
            Search anything
          </label>
          <input
            id="rico-global-search"
            ref={inputRef}
            type="search"
            autoComplete="off"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Search chats, rules, receipts, or ask Rico anything..."
            className="flex-1 bg-transparent text-sm text-[#1E1B1B] placeholder:text-[#8A8585] focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-[#F1EFEF] border border-[#D6D3D1] text-[10px] font-mono text-[#5C5858]">
            ESC
          </kbd>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#5C5858] hover:text-[#1E1B1B] hover:bg-[oklch(0.097_0_0_/_0.05)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
          >
            <X className="w-3.5 h-3.5 stroke-[2]" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5 rico-scroller">
          {commandItems.map((item, idx) => {
            const isSelected = selectedIndex === idx;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => item.action()}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`w-full px-3 py-2.5 rounded-xl text-left flex items-center justify-between gap-3 transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 ${
                  isSelected
                    ? "bg-[oklch(0.097_0_0_/_0.06)] text-[#1E1B1B]"
                    : "text-[#5C5858] hover:bg-[oklch(0.097_0_0_/_0.03)]"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected
                        ? "bg-white border border-[#E6E4E3] text-[#1E1B1B] shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                        : "bg-[#F8F7F7] text-[#5C5858]"
                    }`}
                  >
                    {item.icon}
                  </div>

                  <div className="min-w-0">
                    <div className="text-[12.5px] font-medium text-[#1E1B1B] truncate">
                      {item.title}
                    </div>
                    <p className="text-[11px] text-[#8A8585] truncate m-0 mt-0.5">
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.meta && (
                    <span className="text-[10px] font-mono text-[#8A8585]">
                      {item.meta}
                    </span>
                  )}
                  <ArrowRight
                    className={`w-3.5 h-3.5 ${
                      isSelected ? "text-[#1E1B1B]" : "text-transparent"
                    }`}
                    aria-hidden="true"
                  />
                </div>
              </button>
            );
          })}
        </div>

        <div className="h-8 px-4 bg-[#F8F7F7] border-t border-[#E6E4E3] flex items-center justify-between text-[11px] text-[#8A8585]">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
          </div>
          <span>Search Rico</span>
        </div>
      </div>
    </div>
  );
}
