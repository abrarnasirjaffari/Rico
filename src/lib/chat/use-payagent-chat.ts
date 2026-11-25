"use client";

import { useState, useCallback, useRef } from "react";
import { ReceiptData } from "@/components/dashboard/ReceiptDialog";
import { ApprovalRequest } from "@/components/dashboard/ApprovalDialog";
import { Mandate } from "@/components/dashboard/types";
import type { SavingsAdvisoryData } from "@/lib/savings/types";
import type {
  SplitWorkspaceSnapshot,
  WorkspaceActionEvent,
} from "@/lib/rico-workspace/types";
import { summarizeA2uiWireForHistory } from "@/lib/a2ui/history";

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
  target?: "browser" | "doc" | "excel" | "payment";
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

export type ChatMessagePart =
  | { type: "text"; text: string }
  | { type: "a2ui"; messages: Record<string, unknown>[] };

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  parts?: ChatMessagePart[];
  a2uiMessages?: Record<string, unknown>[];
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
  getWorkspaceSnapshot?: () => SplitWorkspaceSnapshot | undefined;
  onReceiptCaptured?: (receipt: ReceiptData) => void;
  onApprovalRequired?: (approval: ApprovalRequest) => void;
  onBrowserActivity?: (action: BrowserActionItem) => void;
  onWorkspaceAction?: (action: WorkspaceActionEvent) => void;
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
  getWorkspaceSnapshot,
  onReceiptCaptured,
  onApprovalRequired,
  onBrowserActivity,
  onWorkspaceAction,
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
  const messagesRef = useRef<ChatMessage[]>(initialMessages);
  messagesRef.current = messages;

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
        const selectedModelId =
          typeof window !== "undefined"
            ? window.localStorage.getItem("rico_model") || undefined
            : undefined;

        const priorHistory = messagesRef.current
          .filter(
            (m) =>
              (m.text && m.text.trim().length > 0) ||
              (m.a2uiMessages && m.a2uiMessages.length > 0)
          )
          .slice(-10)
          .map((m) => {
            const textPart = m.text?.trim() || "";
            const a2uiSummary = summarizeA2uiWireForHistory(m.a2uiMessages);
            const combined = [textPart, a2uiSummary].filter(Boolean).join("\n");
            return {
              role: m.sender === "user" ? ("user" as const) : ("assistant" as const),
              content:
                combined ||
                "[Displayed interactive A2UI controls for the previous request]",
            };
          });

        const response = await fetch(api, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: trimmed,
            model: selectedModelId,
            strictMode,
            mandates,
            workspaceSnapshot: getWorkspaceSnapshot?.(),
            history: priorHistory,
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
        const currentA2uiMessages: Record<string, unknown>[] = [];
        const currentParts: ChatMessagePart[] = [];
        const currentSteps: ExecutionStep[] = [];
        const currentBrowserActions: BrowserActionItem[] = [];
        let customThought: ThoughtProcess | undefined;
        let finalReceipt: ReceiptData | undefined;

        const appendTextPart = (chunk: string) => {
          const last = currentParts[currentParts.length - 1];
          if (last && last.type === "text") {
            currentParts[currentParts.length - 1] = {
              type: "text",
              text: last.text + chunk,
            };
          } else {
            currentParts.push({ type: "text", text: chunk });
          }
        };

        const appendA2uiPart = (batch: Record<string, unknown>[]) => {
          // Always route all wire messages for a turn into the active A2UI part so
          // updateComponents / updateDataModel / deleteSurface reach the same MessageProcessor.
          const existingIdx = currentParts.findIndex((p) => p.type === "a2ui");
          if (existingIdx >= 0) {
            const prevPart = currentParts[existingIdx] as {
              type: "a2ui";
              messages: Record<string, unknown>[];
            };
            currentParts[existingIdx] = {
              type: "a2ui",
              messages: [...prevPart.messages, ...batch],
            };
          } else {
            currentParts.push({ type: "a2ui", messages: [...batch] });
          }
        };

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
                appendTextPart(event.text);
                const partsSnap = [...currentParts];
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, text: accumulatedText, parts: partsSnap }
                      : m
                  )
                );
              } else if (event.type === "a2ui" && Array.isArray(event.a2ui) && event.a2ui.length > 0) {
                const batch = event.a2ui as Record<string, unknown>[];
                currentA2uiMessages.push(...batch);
                appendA2uiPart(batch);
                const snapshot = [...currentA2uiMessages];
                const partsSnap = [...currentParts];
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, a2uiMessages: snapshot, parts: partsSnap }
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

                // Collapse running -> done or merge final 'complete' into same-URL navigate
                const existingIdx = currentBrowserActions.findIndex(
                  (b) =>
                    (b.url === act.url && b.action === act.action && b.ref === act.ref) ||
                    (act.action === "complete" && b.url === act.url && b.action === "navigate")
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
                            target: "browser",
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

                const hasRunning = currentSteps.some((s) => s.status === "running");
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          thoughtProcess: {
                            summary: hasRunning
                              ? currentSteps[currentSteps.length - 1]?.step || "Working..."
                              : "Actions completed",
                            steps: [...currentSteps],
                          },
                        }
                      : m
                  )
                );
              } else if (event.type === "thought" && event.thought) {
                customThought = event.thought as ThoughtProcess;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          thoughtProcess: customThought,
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
                            target: "payment",
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
              } else if (event.type === "workspace_action" && event.workspaceAction) {
                const wsAction = event.workspaceAction as WorkspaceActionEvent;
                onWorkspaceAction?.(wsAction);
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          statusPill: {
                            step:
                              wsAction.summary ||
                              `Updated ${wsAction.target.toUpperCase()} workspace`,
                            state: "success",
                            target: wsAction.target,
                          },
                        }
                      : m
                  )
                );
              } else if (event.type === "done") {
                if (typeof event.text === "string" && event.text.trim()) {
                  accumulatedText = event.text;
                }
                if (Array.isArray(event.a2ui) && event.a2ui.length > 0) {
                  if (currentA2uiMessages.length === 0) {
                    const batch = event.a2ui as Record<string, unknown>[];
                    currentA2uiMessages.push(...batch);
                    appendA2uiPart(batch);
                  }
                } else if (event.a2ui === undefined && currentA2uiMessages.length > 0) {
                  // All temporary surfaces were deleted by the server quality gate
                  currentA2uiMessages.length = 0;
                  for (let i = currentParts.length - 1; i >= 0; i--) {
                    if (currentParts[i].type === "a2ui") {
                      currentParts.splice(i, 1);
                    }
                  }
                }
                const finalA2ui =
                  currentA2uiMessages.length > 0
                    ? [...currentA2uiMessages]
                    : undefined;
                const finalParts =
                  currentParts.length > 0 ? [...currentParts] : undefined;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          text: accumulatedText,
                          a2uiMessages: finalA2ui,
                          parts: finalParts,
                        }
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
        const finalThought: ThoughtProcess | undefined = customThought
          ? customThought
          : settledSteps.length > 0
          ? {
              summary:
                settledSteps.length === 1
                  ? settledSteps[0].step
                  : "Actions completed",
              steps: settledSteps,
            }
          : undefined;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  thoughtProcess: finalThought,
                  browserActions: settledActions,
                }
              : m
          )
        );
        setActiveBrowserAction(null);

        const completedMsg: ChatMessage = {
          id: assistantMsgId,
          sender: "assistant",
          text:
            accumulatedText ||
            (currentA2uiMessages.length > 0 ? "" : "Execution finished."),
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          a2uiMessages:
            currentA2uiMessages.length > 0
              ? [...currentA2uiMessages]
              : undefined,
          parts: currentParts.length > 0 ? [...currentParts] : undefined,
          thoughtProcess: finalThought,
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
      getWorkspaceSnapshot,
      onReceiptCaptured,
      onApprovalRequired,
      onBrowserActivity,
      onWorkspaceAction,
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
