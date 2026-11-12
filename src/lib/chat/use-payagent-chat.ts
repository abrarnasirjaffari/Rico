"use client";

import { useState, useCallback, useRef } from "react";
import { ReceiptData } from "@/components/dashboard/ReceiptDialog";
import { ApprovalRequest } from "@/components/dashboard/ApprovalDialog";
import { Mandate } from "@/components/dashboard/types";
import type { SavingsAdvisoryData } from "@/lib/savings/types";

export interface ExecutionStep {
  step: string;
  status: "done" | "running" | "waiting";
  detail?: string;
}

export interface ThoughtProcess {
  summary: string;
  steps: ExecutionStep[];
}

export interface StatusPill {
  step: string;
  state: "loading" | "success" | "warning";
}

export interface BrowserActionItem {
  action:
    | "search"
    | "navigate"
    | "scroll"
    | "extract"
    | "snapshot"
    | "act"
    | "switch_tab"
    | "open_tab"
    | "complete";
  url: string;
  title?: string;
  detail?: string;
  tabId?: string;
  ref?: string;
  generation?: number;
  status: "running" | "done";
}

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  thoughtProcess?: ThoughtProcess;
  statusPill?: StatusPill;
  browserActions?: BrowserActionItem[];
  receipt?: ReceiptData;
  savingsAdvisory?: SavingsAdvisoryData;
}

export interface UsePayAgentChatOptions {
  api?: string;
  initialMessages?: ChatMessage[];
  strictMode?: boolean;
  mandates?: Mandate[];
  onReceiptCaptured?: (receipt: ReceiptData) => void;
  onApprovalRequired?: (approval: ApprovalRequest) => void;
  onBrowserActivity?: (action: BrowserActionItem) => void;
  onFinish?: (message: ChatMessage) => void;
  onError?: (error: Error) => void;
}

export interface UsePayAgentChatReturn {
  messages: ChatMessage[];
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleSubmit: (e?: React.FormEvent) => void;
  sendMessage: (content: string) => Promise<void>;
  isLoading: boolean;
  activeBrowserAction: BrowserActionItem | null;
  stop: () => void;
  reload: () => Promise<void>;
  clearChat: () => void;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  error: Error | null;
}

export function usePayAgentChat({
  api = "/api/chat",
  initialMessages = [],
  strictMode = false,
  mandates = [],
  onReceiptCaptured,
  onApprovalRequired,
  onBrowserActivity,
  onFinish,
  onError,
}: UsePayAgentChatOptions = {}): UsePayAgentChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeBrowserAction, setActiveBrowserAction] = useState<BrowserActionItem | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastUserPromptRef = useRef<string>("");

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      setActiveBrowserAction(null);
    }
  }, []);

  const clearChat = useCallback(() => {
    stop();
    setMessages([]);
    setError(null);
  }, [stop]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setInput(e.target.value);
    },
    []
  );

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isLoading) return;

      lastUserPromptRef.current = trimmed;
      setError(null);

      const userMsg: ChatMessage = {
        id: `msg-user-${Date.now()}`,
        sender: "user",
        text: trimmed,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      const assistantMsgId = `msg-agent-${Date.now()}`;
      const initialAssistantMsg: ChatMessage = {
        id: assistantMsgId,
        sender: "assistant",
        text: "",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        thoughtProcess: {
          summary: "Reasoning...",
          steps: [],
        },
        browserActions: [],
      };

      setMessages((prev) => [...prev, userMsg, initialAssistantMsg]);
      setIsLoading(true);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await fetch(api, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: trimmed,
            strictMode,
            mandates,
          }),
          signal: controller.signal,
        });

        if (response.status === 401) {
          throw new Error("Sign in or click 'Demo sandbox' in the sidebar to start an agent session.");
        }

        if (!response.ok || !response.body) {
          throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulatedText = "";
        const currentSteps: ExecutionStep[] = [];
        const currentBrowserActions: BrowserActionItem[] = [];
        let finalReceipt: ReceiptData | undefined;

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";

          for (const part of parts) {
            const line = part.trim();
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6);
            if (!jsonStr) continue;

            try {
              const event = JSON.parse(jsonStr);

              if (event.type === "token" && event.text) {
                accumulatedText += event.text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, text: accumulatedText }
                      : m
                  )
                );
              } else if (event.type === "browser_action" && event.browserAction) {
                const act: BrowserActionItem = {
                  action: event.browserAction.action,
                  url: event.browserAction.url,
                  title: event.browserAction.title,
                  detail: event.browserAction.detail,
                  tabId: event.browserAction.tabId,
                  ref: event.browserAction.ref,
                  generation: event.browserAction.generation,
                  status: event.browserAction.status === "done" ? "done" : "running",
                };

                // Collapse running -> done or update matching URL + ref entry
                const existingIdx = currentBrowserActions.findIndex(
                  (b) => b.url === act.url && b.action === act.action && b.ref === act.ref
                );
                if (existingIdx >= 0) {
                  currentBrowserActions[existingIdx] = act;
                } else {
                  // Mark prior running browser actions as done when advancing to next page
                  for (let i = 0; i < currentBrowserActions.length; i++) {
                    if (currentBrowserActions[i].status === "running") {
                      currentBrowserActions[i] = { ...currentBrowserActions[i], status: "done" };
                    }
                  }
                  currentBrowserActions.push(act);
                }

                setActiveBrowserAction(act.status === "done" ? null : act);
                if (onBrowserActivity) {
                  onBrowserActivity(act);
                }

                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          browserActions: [...currentBrowserActions],
                          statusPill: {
                            step: act.detail || act.title || act.url,
                            state: act.status === "done" ? "success" : "loading",
                          },
                        }
                      : m
                  )
                );
              } else if (event.type === "step" && event.step) {
                const stepObj = event.step as ExecutionStep;
                const existingIdx = currentSteps.findIndex(
                  (s) => s.step === stepObj.step
                );
                if (existingIdx >= 0) {
                  currentSteps[existingIdx] = stepObj;
                } else {
                  currentSteps.push(stepObj);
                }

                const stepLower = (stepObj.step + " " + (stepObj.detail || "")).toLowerCase();
                const isBrowsing =
                  stepLower.includes("brows") ||
                  stepLower.includes("search") ||
                  stepLower.includes("playwright") ||
                  stepLower.includes("price") ||
                  stepLower.includes("merchant") ||
                  stepLower.includes("opening");

                if (isBrowsing && onBrowserActivity && currentBrowserActions.length === 0) {
                  onBrowserActivity({
                    action: "navigate",
                    url: "",
                    detail: stepObj.detail || stepObj.step,
                    status: stepObj.status === "done" ? "done" : "running",
                  });
                }

                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          thoughtProcess: {
                            summary: `${currentSteps.length} step${
                              currentSteps.length === 1 ? "" : "s"
                            } completed`,
                            steps: [...currentSteps],
                          },
                          statusPill: isBrowsing
                            ? {
                                step: stepObj.detail || stepObj.step,
                                state: stepObj.status === "done" ? "success" : "loading",
                              }
                            : m.statusPill,
                        }
                      : m
                  )
                );
              } else if (event.type === "thought" && event.thought) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          thoughtProcess: event.thought,
                        }
                      : m
                  )
                );
              } else if (event.type === "receipt" && event.receipt) {
                const receiptData = event.receipt as ReceiptData;
                finalReceipt = receiptData;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          receipt: receiptData,
                          statusPill: {
                            step: `Payment captured: ${receiptData.orderId}`,
                            state: "success",
                          },
                        }
                      : m
                  )
                );

                if (onReceiptCaptured) {
                  onReceiptCaptured(receiptData);
                }
              } else if (event.type === "savings_advisory" && event.advisory) {
                const advData = event.advisory as SavingsAdvisoryData;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          savingsAdvisory: advData,
                        }
                      : m
                  )
                );
              } else if (event.type === "payment_confirmation" && event.quote && onApprovalRequired) {
                const q = event.quote as {
                  mandateId: string;
                  service: string;
                  amount: number;
                  currency: string;
                  budgetCeiling: number;
                  periodLabel: string;
                  confirmToken: string;
                };
                onApprovalRequired({
                  id: `confirm-${Date.now()}`,
                  service: q.service,
                  detectedPrice: q.amount,
                  budgetCeiling: q.budgetCeiling,
                  currency: q.currency,
                  reason: "Please confirm this payment. Nothing has been charged yet.",
                  confirmToken: q.confirmToken,
                  mandateId: q.mandateId,
                  periodLabel: q.periodLabel,
                });
              } else if (event.type === "done" && event.text && !accumulatedText) {
                accumulatedText = event.text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, text: accumulatedText }
                      : m
                  )
                );
              } else if (event.type === "error" && event.error) {
                throw new Error(event.error);
              }
            } catch (pErr) {
              console.warn("SSE parse error:", pErr);
            }
          }
        }

        // Mark any remaining running steps & browser actions as done once stream ends
        const settledSteps = currentSteps.map((s) =>
          s.status === "running" ? { ...s, status: "done" as const } : s
        );
        const settledActions = currentBrowserActions.map((b) => ({
          ...b,
          status: "done" as const,
        }));
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  thoughtProcess: {
                    summary: `${settledSteps.length} step${
                      settledSteps.length === 1 ? "" : "s"
                    } completed`,
                    steps: settledSteps,
                  },
                  browserActions: settledActions,
                }
              : m
          )
        );
        setActiveBrowserAction(null);

        const completedMsg: ChatMessage = {
          id: assistantMsgId,
          sender: "assistant",
          text: accumulatedText || "Execution finished.",
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          thoughtProcess: {
            summary: `${settledSteps.length} step${settledSteps.length === 1 ? "" : "s"} completed`,
            steps: settledSteps,
          },
          browserActions: settledActions,
          receipt: finalReceipt,
        };

        if (onFinish) {
          onFinish(completedMsg);
        }
      } catch (err: unknown) {
        if (controller.signal.aborted) {
          return;
        }
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        if (onError) onError(e);

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  text: e.message,
                }
              : m
          )
        );
      } finally {
        setIsLoading(false);
        setActiveBrowserAction(null);
        abortControllerRef.current = null;
      }
    },
    [
      api,
      isLoading,
      strictMode,
      mandates,
      onReceiptCaptured,
      onApprovalRequired,
      onBrowserActivity,
      onFinish,
      onError,
    ]
  );

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!input.trim() || isLoading) return;
      const text = input;
      setInput("");
      sendMessage(text);
    },
    [input, isLoading, sendMessage]
  );

  const reload = useCallback(async () => {
    if (lastUserPromptRef.current && !isLoading) {
      await sendMessage(lastUserPromptRef.current);
    }
  }, [isLoading, sendMessage]);

  return {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    sendMessage,
    isLoading,
    activeBrowserAction,
    stop,
    reload,
    clearChat,
    setMessages,
    error,
  };
}
