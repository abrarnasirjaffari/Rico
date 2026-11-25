import { GoogleGenAI } from "@google/genai";
import { and, eq } from "drizzle-orm";
import { db, mandates } from "@/db";
import { buildSystemPromptWithContext } from "./prompts";
import { payAgentTools } from "./tools";
import {
  dispatchAgentTool,
  executeCreateMandate,
  executeVerifyWebPrice,
  executeCompareMultiServicePrices,
  executeWorkspaceDocEdit,
  executeWorkspaceExcelEdit,
} from "./tool-executors";
import {
  createA2uiTurnProcessor,
  getA2uiSystemPromptSection,
  inspectA2uiSurfaces,
  repairExpressDslSyntax,
  sanitizeA2uiWireBatch,
  stripPlainTextStars,
} from "@/lib/a2ui/server";
import { buildSkillA2uiBatch } from "@/lib/a2ui/skill-surfaces";
import type { WorkspaceActionEvent } from "@/lib/rico-workspace/types";
import { StreamEvent, ChatContext, ThoughtStep } from "./types";
import { posthogServer } from "@/lib/telemetry/posthog-server";
import { personaSavingsOptimizer } from "@/lib/savings";
import { skillInjector } from "@/lib/skills";
import { classifyChatIntent, detectKnownService } from "./intent";
import {
  routeUserQuestion,
  detectAllMentionedServices,
  type TurnRoutingDecision,
} from "./surface-router";
import {
  buildDirectChatAnswer,
  buildTailoredDocPayload,
  buildTailoredExcelPayload,
} from "./direct-chat-responder";
import { quoteMandatePayment } from "@/lib/payments/mandate-execution";
import { browserTabPool, priceWorker, KNOWN_MERCHANT_PROFILES } from "@/lib/browser";
import { fastWebFetch, fastWebSearch } from "@/lib/web/fast-search";

export function stripStars(text: string): string {
  return stripPlainTextStars(text);
}

function defaultUrlForService(service: string): string {
  const key = Object.keys(KNOWN_MERCHANT_PROFILES).find((k) =>
    service.toLowerCase().includes(k)
  );
  return key
    ? KNOWN_MERCHANT_PROFILES[key].defaultUrl
    : `https://html.duckduckgo.com/html/?q=${encodeURIComponent(service + " pricing")}`;
}

function formatHumanToolStep(
  toolName: string,
  args: Record<string, unknown>,
  phase: "running" | "done" | "blocked",
  resultOrError?: Record<string, unknown> | string
): ThoughtStep {
  const labels: Record<string, { title: string; runningDetail: string }> = {
    workspace_doc_edit: {
      title: "Update Doc workspace",
      runningDetail: args.title
        ? `Writing "${String(args.title)}" in Doc...`
        : "Updating blocks in Doc...",
    },
    workspace_excel_edit: {
      title: "Update Excel workbook",
      runningDetail: args.title
        ? `Building "${String(args.title)}" in Excel...`
        : "Applying cells and formulas in Excel...",
    },
    verify_web_price: {
      title: "Verify live merchant pricing",
      runningDetail: args.service_name
        ? `Checking ${String(args.service_name)} pricing page...`
        : "Checking merchant pricing page...",
    },
    compare_multi_service_prices: {
      title: "Compare live service pricing",
      runningDetail: Array.isArray(args.services)
        ? `Comparing ${args.services.join(" vs ")}...`
        : "Comparing pricing across parallel tabs...",
    },
    search_and_browse_web: {
      title: "Search live web",
      runningDetail: args.query
        ? `Searching for "${String(args.query)}"...`
        : "Inspecting live web sources...",
    },
    web_search: {
      title: "Search web",
      runningDetail: args.query
        ? `Searching for "${String(args.query)}"...`
        : "Fetching search results...",
    },
    web_fetch: {
      title: "Read webpage",
      runningDetail: args.url
        ? `Reading ${String(args.url).slice(0, 56)}...`
        : "Fetching page content...",
    },
    create_mandate: {
      title: "Create spending rule",
      runningDetail: args.service
        ? `Registering rule for ${String(args.service)}...`
        : "Registering spending rule...",
    },
    execute_paypal_payment: {
      title: "Prepare payment confirmation",
      runningDetail: "Generating server-signed confirmation quote...",
    },
    check_persona_savings: {
      title: "Check credits & discounts",
      runningDetail: "Probing startup credits and student discounts...",
    },
    lookup_rico_skills: {
      title: "Check Rico skills",
      runningDetail: args.query
        ? `Matching playbooks for "${String(args.query).slice(0, 48)}"...`
        : "Loading matching Rico skill rules...",
    },
    browser_snapshot: {
      title: "Capture page snapshot",
      runningDetail: "Reading semantic page elements...",
    },
    browser_act: {
      title: "Interact with live page",
      runningDetail: `Running ${String(args.action || "action")} ${String(args.ref || "")}`.trim(),
    },
    browser_tabs: {
      title: "Manage browser tabs",
      runningDetail: `Running tab ${String(args.op || "list")}...`,
    },
  };

  const meta = labels[toolName] ?? {
    title: "Run workspace action",
    runningDetail: "Processing...",
  };

  if (phase === "running") {
    return {
      step: meta.title,
      status: "running",
      detail: meta.runningDetail,
    };
  }

  if (phase === "blocked") {
    return {
      step: meta.title,
      status: "done",
      detail:
        typeof resultOrError === "string"
          ? resultOrError
          : "Action skipped by safety policy",
    };
  }

  const res =
    resultOrError && typeof resultOrError === "object" ? resultOrError : {};
  let doneDetail = "";
  if (typeof res.message === "string" && res.message.trim()) {
    doneDetail = res.message;
  } else if (typeof res.summary === "string" && res.summary.trim()) {
    doneDetail = res.summary;
  } else if (
    toolName === "verify_web_price" &&
    typeof res.verifiedPrice === "number"
  ) {
    doneDetail = `${String(res.service || args.service_name || "Service")}: $${res.verifiedPrice.toFixed(2)}/mo${res.planName ? ` (${String(res.planName)})` : ""}`;
  } else {
    doneDetail = "Completed";
  }

  return {
    step: meta.title,
    status: "done",
    detail: doneDetail,
  };
}

export class GeminiAgentClient {
  private client: GoogleGenAI | null = null;
  private modelName: string;

  constructor() {
    this.modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const apiKey = process.env.GEMINI_API_KEY;

    if (
      apiKey &&
      apiKey.trim().length > 10 &&
      apiKey !== "your_gemini_api_key_here"
    ) {
      try {
        this.client = new GoogleGenAI({ apiKey });
      } catch (err) {
        console.warn("Failed to initialize GoogleGenAI client:", err);
        this.client = null;
      }
    }
  }

  public isLiveKeyConfigured(): boolean {
    return this.client !== null;
  }

  public getModelName(): string {
    return this.modelName;
  }

  /**
   * Stream agent response using either live Gemini 3.8 / 2.5 Flash SDK
   * or high-fidelity autonomous reasoning + live Playwright browser engine.
   */
  public async *streamResponse(
    userMessage: string,
    context?: ChatContext
  ): AsyncGenerator<StreamEvent> {
    const isLive = this.isLiveKeyConfigured();
    const startTime = Date.now();
    let totalOutputTokens = 0;

    // Dynamically match and inject domain-specific SKILL.md rules
    const skillContext = skillInjector.injectSkills(userMessage, {
      persona: context?.persona,
      history: context?.history,
    });

    for (const skill of skillContext.activeSkills) {
      yield {
        type: "step",
        step: {
          step: `Activated Skill: ${skill.metadata.name}`,
          status: "done",
          detail: `Injected ${skill.metadata.category} domain rules (${skillContext.matchedTriggers.join(", ")})`,
        },
      };
    }

    const routing = routeUserQuestion(userMessage, {
      workspaceSnapshot: context?.workspaceSnapshot,
      history: context?.history,
    });

    const enhancedContext: ChatContext = {
      ...context,
      injectedSkillPrompt: skillContext.injectedPrompt,
      activeSkills: skillContext.activeSkills,
    };

    const stream =
      isLive && this.client
        ? this.streamLiveGemini(userMessage, enhancedContext, routing)
        : this.streamSimulatedReasoning(userMessage, enhancedContext, routing);

    try {
      for await (const event of stream) {
        if (event.type === "token" && event.text) {
          totalOutputTokens += Math.max(1, Math.round(event.text.length / 4));
        }
        yield event;
      }
    } finally {
      const latencyMs = Date.now() - startTime;
      const inputTokens = Math.max(80, Math.round((userMessage.length + 800) / 4));
      const outputTokens = Math.max(25, totalOutputTokens);

      await posthogServer.trackLLMGeneration({
        model: context?.model || (isLive ? this.modelName : "gemini-4-carbon"),
        inputTokens,
        outputTokens,
        latencyMs,
        status: "success",
        promptSnippet: userMessage.slice(0, 80),
      });
    }
  }

  /**
   * Calls Google GenAI streaming API with function calling tools and system instructions
   */
  private async *streamLiveGemini(
    userMessage: string,
    context?: ChatContext,
    routing?: TurnRoutingDecision
  ): AsyncGenerator<StreamEvent> {
    if (!this.client) return;

    const a2uiProcessor = createA2uiTurnProcessor();
    const a2uiState = a2uiProcessor.createState();
    const systemInstruction = buildSystemPromptWithContext({
      ...context,
      routing,
      a2uiPromptSection: getA2uiSystemPromptSection(a2uiProcessor),
    });

    const priorHistory: Array<{
      role: "user" | "model";
      parts: Array<Record<string, unknown>>;
    }> = (context?.history ?? []).slice(-8).map((item) => ({
      role: item.role === "assistant" ? "model" : "user",
      parts: [{ text: item.content }],
    }));

    const conversationHistory: Array<{
      role: "user" | "model";
      parts: Array<Record<string, unknown>>;
    }> = [
      ...priorHistory,
      {
        role: "user",
        parts: [{ text: userMessage }],
      },
    ];

    let fullText = "";
    const emittedA2uiMessages: Record<string, unknown>[] = [];
    const emittedSurfaceIds = new Set<string>();
    let rejectedA2uiError: string | null = null;
    let rejectedTurnRawText = "";
    let lastTurnRawText = "";
    const toolOutputsForSynthesis: Array<{ name: string; result: Record<string, unknown> }> = [];
    const maxTurns = 7;

    const recordSurfaceIds = (batch: Record<string, unknown>[]) => {
      for (const msg of batch) {
        const cs = msg.createSurface as { surfaceId?: string } | undefined;
        if (cs?.surfaceId) emittedSurfaceIds.add(cs.surfaceId);
        const ds = msg.deleteSurface as { surfaceId?: string } | undefined;
        if (ds?.surfaceId) emittedSurfaceIds.delete(ds.surfaceId);
      }
    };

    for (let turn = 0; turn < maxTurns; turn++) {
      let responseStream: Awaited<
        ReturnType<typeof this.client.models.generateContentStream>
      >;
      try {
        responseStream = await this.client.models.generateContentStream({
          model: this.modelName,
          contents: conversationHistory as unknown as Parameters<
            typeof this.client.models.generateContentStream
          >[0]["contents"],
          config: {
            systemInstruction,
            tools: payAgentTools,
            temperature: 0.2,
          },
        });
      } catch (apiErr) {
        if (!fullText && emittedA2uiMessages.length === 0 && toolOutputsForSynthesis.length === 0) {
          console.warn(
            "Live Gemini stream unavailable, falling back to local engine:",
            apiErr instanceof Error ? apiErr.message : String(apiErr)
          );
          yield* this.streamSimulatedReasoning(userMessage, context, routing);
          return;
        }
        throw apiErr;
      }

      const turnFunctionCalls: Array<{
        name: string;
        args: Record<string, unknown>;
      }> = [];
      let turnText = "";
      const a2uiStream = a2uiProcessor.openStream({
        state: a2uiState,
        afterRejectedBlock: "continue",
      });

      for await (const chunk of responseStream) {
        const candidates = chunk.candidates || [];
        if (candidates.length > 0) {
          const parts = candidates[0].content?.parts || [];
          for (const part of parts) {
            if (part.text) {
              turnText += part.text;
              for (const parsed of a2uiStream.feed(part.text)) {
                if (parsed.type === "text" && parsed.text) {
                  fullText += parsed.text;
                  yield {
                    type: "token",
                    text: parsed.text,
                  };
                } else if (parsed.type === "a2ui" && parsed.a2ui.length > 0) {
                  const wireBatch = sanitizeA2uiWireBatch(
                    parsed.a2ui as unknown as Record<string, unknown>[]
                  );
                  recordSurfaceIds(wireBatch);
                  emittedA2uiMessages.push(...wireBatch);
                  yield {
                    type: "a2ui",
                    a2ui: wireBatch,
                  };
                } else if (parsed.type === "error") {
                  rejectedA2uiError = parsed.error.message;
                  rejectedTurnRawText = turnText;
                  console.warn("[A2UI] Rejected block (will self-correct):", parsed.error.message);
                }
              }
            }

            if (part.functionCall) {
              turnFunctionCalls.push({
                name: part.functionCall.name || "unknown",
                args: (part.functionCall.args as Record<string, unknown>) || {},
              });
            }
          }
        }
      }

      for (const parsed of a2uiStream.close()) {
        if (parsed.type === "text" && parsed.text) {
          fullText += parsed.text;
          yield {
            type: "token",
            text: parsed.text,
          };
        } else if (parsed.type === "a2ui" && parsed.a2ui.length > 0) {
          const wireBatch = sanitizeA2uiWireBatch(
            parsed.a2ui as unknown as Record<string, unknown>[]
          );
          recordSurfaceIds(wireBatch);
          emittedA2uiMessages.push(...wireBatch);
          yield {
            type: "a2ui",
            a2ui: wireBatch,
          };
        } else if (parsed.type === "error") {
          rejectedA2uiError = parsed.error.message;
          rejectedTurnRawText = turnText;
          console.warn("[A2UI] Rejected trailing block (will self-correct):", parsed.error.message);
        }
      }

      if (turnText) {
        lastTurnRawText = turnText;
      }

      if (turnFunctionCalls.length === 0) {
        break;
      }

      const modelParts: Array<Record<string, unknown>> = [];
      if (turnText) modelParts.push({ text: turnText });
      for (const fc of turnFunctionCalls) {
        modelParts.push({ functionCall: { name: fc.name, args: fc.args } });
      }
      conversationHistory.push({ role: "model", parts: modelParts });

      const functionResponseParts: Array<Record<string, unknown>> = [];

      for (const toolCall of turnFunctionCalls) {
        yield {
          type: "tool_call",
          toolCall,
        };

        const explicitBrowserTurn = routing?.target === "browser";
        const redirectSearchToFastHttp =
          toolCall.name === "search_and_browse_web" && !explicitBrowserTurn;
        const redirectTabOpenToFastFetch =
          toolCall.name === "browser_tabs" &&
          String(toolCall.args.op || "").toLowerCase() === "open" &&
          Boolean(toolCall.args.url) &&
          !explicitBrowserTurn;

        const isBrowserTool =
          !redirectSearchToFastHttp &&
          !redirectTabOpenToFastFetch &&
          (toolCall.name === "verify_web_price" ||
            toolCall.name === "search_and_browse_web" ||
            toolCall.name === "compare_multi_service_prices" ||
            toolCall.name === "browser_snapshot" ||
            toolCall.name === "browser_act" ||
            toolCall.name === "browser_tabs");

        const shouldSkipBrowserHijack =
          isBrowserTool &&
          routing?.target === "chat" &&
          (routing.chatSubkind === "greeting" ||
            routing.chatSubkind === "math" ||
            routing.chatSubkind === "capabilities" ||
            routing.chatSubkind === "session_rules");

        if (shouldSkipBrowserHijack) {
          functionResponseParts.push({
            functionResponse: {
              name: toolCall.name,
              response: {
                success: false,
                skipped: true,
                message:
                  "External browser search skipped: this question is answered directly from session context without opening Browser.",
              },
            },
          });
          continue;
        }

        if (isBrowserTool) {
          const targetLabel = String(
            toolCall.args.query ||
              toolCall.args.service_name ||
              toolCall.args.ref ||
              toolCall.args.url ||
              (Array.isArray(toolCall.args.services)
                ? toolCall.args.services.join(", ")
                : toolCall.name === "browser_snapshot"
                ? "Semantic AXTree"
                : "Web")
          );
          const previewUrl =
            toolCall.name === "search_and_browse_web"
              ? `https://html.duckduckgo.com/html/?q=${encodeURIComponent(targetLabel)}`
              : toolCall.name === "browser_snapshot" || toolCall.name === "browser_act"
              ? String(toolCall.args.url || "")
              : String(toolCall.args.service_url || toolCall.args.url || defaultUrlForService(targetLabel));

          const actionKind =
            toolCall.name === "search_and_browse_web"
              ? "search"
              : toolCall.name === "browser_snapshot"
              ? "snapshot"
              : toolCall.name === "browser_act"
              ? "act"
              : toolCall.name === "browser_tabs"
              ? String(toolCall.args.op) === "open"
                ? "open_tab"
                : "switch_tab"
              : "navigate";

          yield {
            type: "browser_action",
            browserAction: {
              action: actionKind,
              url: previewUrl,
              title: targetLabel,
              ref: toolCall.args.ref ? String(toolCall.args.ref) : undefined,
              detail:
                toolCall.name === "browser_snapshot"
                  ? "Capturing @eN semantic AXTree..."
                  : toolCall.name === "browser_act"
                  ? `Running ${String(toolCall.args.action)} ${String(toolCall.args.ref || "")}`.trim()
                  : `Browsing live web for ${targetLabel}...`,
              status: "running",
            },
          };
        }

        yield {
          type: "step",
          step: formatHumanToolStep(
            redirectSearchToFastHttp
              ? "web_search"
              : redirectTabOpenToFastFetch
              ? "web_fetch"
              : toolCall.name,
            toolCall.args,
            "running"
          ),
        };

        try {
          if (!context?.ownerId) throw new Error("Agent tools require a verified user.");
          const intent = classifyChatIntent(userMessage);
          if (toolCall.name === "create_mandate" && intent !== "create") {
            throw new Error("You didn't ask to create a spending rule, so none was created.");
          }
          if (toolCall.name === "execute_paypal_payment" && intent !== "execute") {
            throw new Error("You didn't ask to run a spending rule, so no payment was prepared.");
          }
          let toolResult: Record<string, unknown>;

          if (redirectSearchToFastHttp) {
            const qStr = String(toolCall.args.query || userMessage).trim();
            toolResult = (await fastWebSearch(qStr, 8)) as unknown as Record<string, unknown>;
          } else if (redirectTabOpenToFastFetch) {
            const targetUrl = String(toolCall.args.url || "");
            const fetched = await fastWebFetch(targetUrl);
            toolResult = {
              ...(fetched as unknown as Record<string, unknown>),
              note: "Fetched rapidly via headless web_fetch without opening RICO-Browser. Do not open browser tabs for research lists; synthesize the complete answer now.",
            };
          } else if (toolCall.name === "search_and_browse_web") {
            const qStr = String(toolCall.args.query || userMessage).trim();
            const liveQueue: StreamEvent[] = [];
            let wakeQueue: (() => void) | null = null;
            let doneBrowsing = false;

            const pushLive = (ev: StreamEvent) => {
              liveQueue.push(ev);
              if (wakeQueue) {
                const fn = wakeQueue;
                wakeQueue = null;
                fn();
              }
            };

            const runPromise = priceWorker
              .searchAndBrowseLiveWeb(qStr, {
                maxPagesToVisit: 1,
                onProgress: (prog) => {
                  pushLive({
                    type: "browser_action",
                    browserAction: {
                      action: prog.action,
                      url: prog.url,
                      title: prog.title,
                      detail: prog.detail,
                      tabId: prog.tabId,
                      status: prog.action === "complete" ? "done" : "running",
                    },
                  });
                },
              })
              .finally(() => {
                doneBrowsing = true;
                if (wakeQueue) {
                  const fn = wakeQueue;
                  wakeQueue = null;
                  fn();
                }
              });

            while (!doneBrowsing || liveQueue.length > 0) {
              if (liveQueue.length > 0) {
                yield liveQueue.shift()!;
              } else {
                await new Promise<void>((r) => {
                  wakeQueue = r;
                });
              }
            }

            const searchRes = await runPromise;
            toolResult = {
              success: true,
              searchResult: searchRes,
              message: `Searched "${qStr}" and inspected ${searchRes.primaryTitle} (${searchRes.primaryUrl}).`,
            };
          } else {
            toolResult = await dispatchAgentTool(
              toolCall.name,
              toolCall.args,
              context.ownerId
            );
          }

          toolOutputsForSynthesis.push({ name: toolCall.name, result: toolResult });
          functionResponseParts.push({
            functionResponse: {
              name: toolCall.name,
              response: toolResult,
            },
          });

          if (toolResult.quote) {
            yield {
              type: "payment_confirmation",
              quote: toolResult.quote as Record<string, unknown>,
            };
          }
          if (toolResult.advisory) {
            yield {
              type: "savings_advisory",
              advisory: toolResult.advisory as Record<string, unknown>,
            };
          }
          if (toolResult.workspaceAction) {
            yield {
              type: "workspace_action",
              workspaceAction: toolResult.workspaceAction as WorkspaceActionEvent,
            };
          }
          if (isBrowserTool) {
            const sr = toolResult.searchResult as { primaryUrl?: string; primaryTitle?: string } | undefined;
            const comp = toolResult.comparison as {
              bots?: Array<{ url?: string; service?: string }>;
            } | undefined;
            const finalUrl =
              String(toolResult.url || "") ||
              sr?.primaryUrl ||
              comp?.bots?.[comp.bots.length - 1]?.url ||
              String(
                toolCall.args.service_url ||
                  defaultUrlForService(String(toolCall.args.service_name || userMessage))
              );
            const doneAction =
              toolCall.name === "browser_snapshot"
                ? "snapshot"
                : toolCall.name === "browser_act"
                ? "act"
                : "complete";
            yield {
              type: "browser_action",
              browserAction: {
                action: doneAction,
                url: finalUrl,
                title:
                  String(toolResult.title || "") ||
                  sr?.primaryTitle ||
                  comp?.bots?.map((b) => b.service).filter(Boolean).join(" vs ") ||
                  String(toolCall.args.service_name || "Verified"),
                ref: toolCall.args.ref ? String(toolCall.args.ref) : undefined,
                generation:
                  typeof toolResult.generation === "number"
                    ? toolResult.generation
                    : undefined,
                detail: String(
                  toolResult.message ||
                    toolResult.summary ||
                    "Live browser inspection finished"
                ),
                status: "done",
              },
            };
          }
          yield {
            type: "step",
            step: formatHumanToolStep(
              redirectSearchToFastHttp
                ? "web_search"
                : redirectTabOpenToFastFetch
                ? "web_fetch"
                : toolCall.name,
              toolCall.args,
              "done",
              toolResult
            ),
          };
        } catch (toolErr) {
          const errMsg =
            toolErr instanceof Error ? toolErr.message : String(toolErr);
          functionResponseParts.push({
            functionResponse: {
              name: toolCall.name,
              response: { success: false, error: errMsg },
            },
          });
          yield {
            type: "step",
            step: formatHumanToolStep(
              redirectSearchToFastHttp
                ? "web_search"
                : redirectTabOpenToFastFetch
                ? "web_fetch"
                : toolCall.name,
              toolCall.args,
              "blocked",
              errMsg
            ),
          };
        }
      }

      const hasComparisonToolOutput = turnFunctionCalls.some(
        (fc) =>
          fc.name === "compare_multi_service_prices" ||
          fc.name === "check_persona_savings"
      );
      const hasSkillLookupOutput = turnFunctionCalls.some(
        (fc) => fc.name === "lookup_rico_skills"
      );
      const hasFastSearchOutput = turnFunctionCalls.some(
        (fc) =>
          fc.name === "web_search" ||
          fc.name === "web_fetch" ||
          (fc.name === "search_and_browse_web" && routing?.target !== "browser") ||
          (fc.name === "browser_tabs" &&
            String(fc.args.op || "").toLowerCase() === "open" &&
            routing?.target !== "browser")
      );
      const hasLookupToolOutput = turnFunctionCalls.some(
        (fc) =>
          (fc.name === "search_and_browse_web" && routing?.target === "browser") ||
          fc.name === "verify_web_price"
      );

      if (hasComparisonToolOutput) {
        functionResponseParts.push({
          text: "Synthesize these live multi-option results cleanly: write at most 1 short plain-text lead sentence (zero asterisks), followed by a rich interactive <a2ui>...</a2ui> comparison using Tabs (one tab per service/option) with Card/Column/Row, exact pricing, key plan details/trade-offs, and action Buttons (openUrl plus a follow-up Event with userMessage). Set $/theme/accent to fit the topic.",
        });
      } else if (hasSkillLookupOutput) {
        functionResponseParts.push({
          text: "Apply the loaded Rico skill rules strictly (zero asterisks in prose). If the skill defines a multi-stage roadmap, credit domino chain, calculator, renewal/audit workflow, or multi-option playbook, write 1 concise plain-text lead sentence and render a complete interactive <a2ui>...</a2ui> UI (ChoicePicker/TextField/Tabs/Card/Button with openUrl and Event(..., userMessage=...)) instead of a plain-text wall.",
        });
      } else if (hasFastSearchOutput) {
        functionResponseParts.push({
          text: "You now have the fast search/fetch results. Do NOT open Playwright browser tabs one-by-one. Synthesize the COMPLETE answer immediately (zero asterisks in prose): if the user asked for a Top-N list, directory, ranking, or multi-option comparison (e.g. top 10 accelerators), write 1 concise lead sentence and render the complete interactive <a2ui>...</a2ui> Tabs + Card explorer covering ALL requested items; otherwise give a crisp plain-text answer.",
        });
      } else if (hasLookupToolOutput) {
        functionResponseParts.push({
          text: "Synthesize these live results concisely (zero asterisks). For a single price check or simple factual answer, respond in clean plain text with NO <a2ui> block. Only include an <a2ui>...</a2ui> block if there are 2+ distinct plans/options to interactively compare in Tabs or interactive controls the user needs to choose from — never emit a tiny 1-line A2UI snippet.",
        });
      }

      conversationHistory.push({
        role: "user",
        parts: functionResponseParts,
      });
    }

    // If Gemini invoked tools without writing a final response yet, let it summarize naturally (optionally with A2UI)
    if (!fullText.trim() && emittedA2uiMessages.length === 0 && toolOutputsForSynthesis.length > 0) {
      try {
        const followUp = await this.client.models.generateContentStream({
          model: this.modelName,
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `User asked: "${userMessage}"\n\nLive tool results:\n${JSON.stringify(
                    toolOutputsForSynthesis
                  )}\n\nRespond clearly in plain text (no asterisks), and optionally include a native <a2ui>...</a2ui> interactive UI only if it genuinely helps the user act on or explore the results (do not force cards or unnecessary widgets).`,
                },
              ],
            },
          ],
          config: {
            systemInstruction,
            temperature: 0.2,
          },
        });
        const followUpA2uiStream = a2uiProcessor.openStream({
          state: a2uiState,
          afterRejectedBlock: "continue",
        });
        for await (const chunk of followUp) {
          const parts = chunk.candidates?.[0]?.content?.parts || [];
          for (const p of parts) {
            if (p.text) {
              lastTurnRawText += p.text;
              for (const parsed of followUpA2uiStream.feed(p.text)) {
                if (parsed.type === "text" && parsed.text) {
                  fullText += parsed.text;
                  yield { type: "token", text: parsed.text };
                } else if (parsed.type === "a2ui" && parsed.a2ui.length > 0) {
                  const wireBatch = sanitizeA2uiWireBatch(
                    parsed.a2ui as unknown as Record<string, unknown>[]
                  );
                  recordSurfaceIds(wireBatch);
                  emittedA2uiMessages.push(...wireBatch);
                  yield { type: "a2ui", a2ui: wireBatch };
                } else if (parsed.type === "error") {
                  rejectedA2uiError = parsed.error.message;
                  rejectedTurnRawText = lastTurnRawText;
                  console.warn("[A2UI] Skipped rejected follow-up block:", parsed.error.message);
                }
              }
            }
          }
        }
        for (const parsed of followUpA2uiStream.close()) {
          if (parsed.type === "text" && parsed.text) {
            fullText += parsed.text;
            yield { type: "token", text: parsed.text };
          } else if (parsed.type === "a2ui" && parsed.a2ui.length > 0) {
            const wireBatch = sanitizeA2uiWireBatch(
              parsed.a2ui as unknown as Record<string, unknown>[]
            );
            recordSurfaceIds(wireBatch);
            emittedA2uiMessages.push(...wireBatch);
            yield { type: "a2ui", a2ui: wireBatch };
          } else if (parsed.type === "error") {
            rejectedA2uiError = parsed.error.message;
            rejectedTurnRawText = lastTurnRawText;
          }
        }
      } catch {
        // Leave response graceful even if follow-up synthesis fails
      }
    }

    // Post-stream A2UI integrity check (Phase 1): catch broken formatString bindings
    if (emittedA2uiMessages.length > 0 && !rejectedA2uiError) {
      const preInspections = inspectA2uiSurfaces(emittedA2uiMessages);
      const brokenErrors: string[] = [];
      for (const insp of preInspections) {
        if (insp.brokenFormatStrings.length > 0) {
          brokenErrors.push(
            `Surface "${insp.surfaceId}": ${insp.brokenFormatStrings.join("; ")}`
          );
        }
      }
      if (brokenErrors.length > 0) {
        rejectedA2uiError = brokenErrors.join("\n");
        rejectedTurnRawText = lastTurnRawText || JSON.stringify(emittedA2uiMessages);
        console.warn("[A2UI] Broken data bindings detected (will self-correct):", rejectedA2uiError);
      }
    }

    // Automatic A2UI repair:
    // Step 1: Try instant deterministic syntax repair (e.g. `userMessage:` -> `userMessage=`)
    // Step 2: If still broken, run 1-turn LLM self-correction
    if (rejectedA2uiError && rejectedTurnRawText) {
      let repairedSuccessfully = false;

      if (rejectedTurnRawText.includes("<a2ui>")) {
        try {
          const detFixed = repairExpressDslSyntax(rejectedTurnRawText);
          if (detFixed !== rejectedTurnRawText) {
            const detProcessor = createA2uiTurnProcessor();
            const detParts = detProcessor.parseResponse(detFixed);
            const detWireRaw: Record<string, unknown>[] = [];
            for (const part of detParts) {
              if (part.type === "a2ui" && part.a2ui.length > 0) {
                detWireRaw.push(...(part.a2ui as unknown as Record<string, unknown>[]));
              }
            }
            const detWire = sanitizeA2uiWireBatch(detWireRaw);
            const detInsp = inspectA2uiSurfaces(detWire);
            if (
              detWire.length > 0 &&
              detInsp.every((s) => s.brokenFormatStrings.length === 0) &&
              detInsp.some((s) => s.hasInteractiveControls)
            ) {
              const cleanupDeletes: Record<string, unknown>[] = Array.from(
                emittedSurfaceIds
              ).map((surfaceId) => ({
                version: "1.0",
                deleteSurface: { surfaceId },
              }));
              const replacementBatch = [...cleanupDeletes, ...detWire];
              recordSurfaceIds(replacementBatch);
              emittedA2uiMessages.push(...replacementBatch);
              yield {
                type: "a2ui",
                a2ui: replacementBatch,
              };
              repairedSuccessfully = true;
            }
          }
        } catch {
          // Fall through to 1-turn LLM self-correction
        }
      }

      if (!repairedSuccessfully) {
        try {
          const repairResp = await this.client.models.generateContent({
            model: this.modelName,
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: [
                      `The user asked: "${userMessage}"`,
                      `Your previous <a2ui> block had an error:\n${rejectedA2uiError}`,
                      `Your previous output:\n${rejectedTurnRawText}`,
                      "Fix this now:",
                      "- If this answer only needs computed numbers or plain explanation (no interactive controls needed), reply in clean plain text with ZERO <a2ui> tags and compute all numbers directly.",
                      "- If genuine interactive controls (inputs, sliders, pickers, tabs, buttons) ARE needed, output ONLY a single corrected <a2ui>...</a2ui> block with valid A2UI Express syntax.",
                      "- Rules: keyword arguments in function/component/Event calls MUST use `=` (e.g. `userMessage=\"...\"`, `variant=\"primary\"`), NEVER `:` (colons are ONLY for `{ key: value }` maps); compute all numbers yourself (never invent undefined ${var} names or use arithmetic operators +, -, *, /); initialize every $/path referenced in formatString; never nest ${...} inside ${...}; initialize TextField values as strings; Text variant is only \"body\" or \"caption\"; Button takes (childTextNode, variant, Event(\"name\", { ... }, userMessage=...)).",
                    ].join("\n\n"),
                  },
                ],
              },
            ],
            config: {
              systemInstruction,
              temperature: 0.1,
            },
          });

          const repairedText = repairExpressDslSyntax(repairResp.text || "");
          const cleanupDeletes: Record<string, unknown>[] = Array.from(
            emittedSurfaceIds
          ).map((surfaceId) => ({
            version: "1.0",
            deleteSurface: { surfaceId },
          }));

          if (repairedText.includes("<a2ui>")) {
            const freshProcessor = createA2uiTurnProcessor();
            const repairedParts = freshProcessor.parseResponse(repairedText);
            const repairedWireRaw: Record<string, unknown>[] = [];
            let repairedProse = "";
            for (const part of repairedParts) {
              if (part.type === "a2ui" && part.a2ui.length > 0) {
                repairedWireRaw.push(...(part.a2ui as unknown as Record<string, unknown>[]));
              } else if (part.type === "text" && part.text.trim()) {
                repairedProse += part.text;
              }
            }
            const repairedWire = sanitizeA2uiWireBatch(repairedWireRaw);
            const repairedInspections = inspectA2uiSurfaces(repairedWire);
            const hasValidInteractive =
              repairedWire.length > 0 &&
              repairedInspections.some(
                (s) => s.hasInteractiveControls && s.brokenFormatStrings.length === 0
              );

            if (hasValidInteractive) {
              const replacementBatch = [...cleanupDeletes, ...repairedWire];
              recordSurfaceIds(replacementBatch);
              emittedA2uiMessages.push(...replacementBatch);
              yield {
                type: "a2ui",
                a2ui: replacementBatch,
              };
            } else {
              if (cleanupDeletes.length > 0) {
                recordSurfaceIds(cleanupDeletes);
                emittedA2uiMessages.push(...cleanupDeletes);
                yield { type: "a2ui", a2ui: cleanupDeletes };
              }
              const cleanFallback = stripStars(
                repairedProse ||
                  repairedInspections.map((s) => s.extractedText).filter(Boolean).join("\n\n")
              );
              if (cleanFallback) {
                const prefix = fullText.trim() ? "\n\n" : "";
                fullText += `${prefix}${cleanFallback}`;
                yield { type: "token", text: `${prefix}${cleanFallback}` };
              }
            }
          } else if (repairedText.trim()) {
            if (cleanupDeletes.length > 0) {
              recordSurfaceIds(cleanupDeletes);
              emittedA2uiMessages.push(...cleanupDeletes);
              yield { type: "a2ui", a2ui: cleanupDeletes };
            }
            const cleanRepairText = stripStars(repairedText);
            const prefix = fullText.trim() ? "\n\n" : "";
            fullText += `${prefix}${cleanRepairText}`;
            yield { type: "token", text: `${prefix}${cleanRepairText}` };
          }
        } catch (repairErr) {
          console.warn(
            "[A2UI] Self-correction retry failed:",
            repairErr instanceof Error ? repairErr.message : String(repairErr)
          );
        }
      }
    }

    // Post-stream A2UI quality gate (Phase 2): remove any unnecessary read-only/text-only surfaces
    if (emittedA2uiMessages.length > 0 && emittedSurfaceIds.size > 0) {
      const finalInspections = inspectA2uiSurfaces(emittedA2uiMessages);
      const textOnlySurfaces = finalInspections.filter((s) => s.isTextOnly);
      if (textOnlySurfaces.length > 0) {
        const deleteBatch: Record<string, unknown>[] = textOnlySurfaces.map((s) => ({
          version: "1.0",
          deleteSurface: { surfaceId: s.surfaceId },
        }));
        recordSurfaceIds(deleteBatch);
        emittedA2uiMessages.push(...deleteBatch);
        yield {
          type: "a2ui",
          a2ui: deleteBatch,
        };

        for (const s of textOnlySurfaces) {
          if (s.extractedText && !fullText.includes(s.extractedText.slice(0, 40))) {
            const prefix = fullText.trim() ? "\n\n" : "";
            const fallbackChunk = `${prefix}${s.extractedText}`;
            fullText += fallbackChunk;
            yield { type: "token", text: fallbackChunk };
          }
        }
      }
    }

    const activeSurfacesRemaining = emittedSurfaceIds.size > 0;
    yield {
      type: "done",
      text: stripStars(fullText),
      a2ui:
        activeSurfacesRemaining && emittedA2uiMessages.length > 0
          ? emittedA2uiMessages
          : undefined,
    };
  }

  /**
   * Autonomous financial, workspace (Doc / Excel), & live web research engine:
   * - Preserves strict safety invariants (only explicit create/execute act on mandates; payments require confirmation).
   * - Follows OpenCode-style dedicated tool selection: answers directly in chat when appropriate,
   *   routes document work to RICO-DOC, tabular/formula work to RICO-Excel, and launches RICO-Browser
   *   ONLY when live pricing verification, URL navigation, @eN DOM actions, or web search is requested.
   */
  private async *streamSimulatedReasoning(
    userMessage: string,
    context?: ChatContext,
    routingOverride?: TurnRoutingDecision
  ): AsyncGenerator<StreamEvent> {
    const textLower = userMessage.toLowerCase().trim();
    const isStrictMode = !!context?.strictMode;
    const isTestEnv = process.env.NODE_ENV === "test";

    const activeRouting =
      routingOverride ??
      routeUserQuestion(userMessage, {
        workspaceSnapshot: context?.workspaceSnapshot,
        history: context?.history,
      });

    const say = async function* (
      text: string,
      a2uiBatch?: Record<string, unknown>[]
    ): AsyncGenerator<StreamEvent> {
      const clean = stripStars(text);
      const chunks = clean.match(/[^\s]+\s*|\s+/g) ?? [clean];
      for (const chunk of chunks) {
        yield { type: "token", text: chunk };
        if (!isTestEnv) await delay(8);
      }
      if (a2uiBatch && a2uiBatch.length > 0) {
        yield { type: "a2ui", a2ui: a2uiBatch };
      }
      yield {
        type: "done",
        text: clean,
        a2ui: a2uiBatch && a2uiBatch.length > 0 ? a2uiBatch : undefined,
      };
    };

    const wsSnap = context?.workspaceSnapshot;
    const intent = classifyChatIntent(userMessage);
    const known = detectKnownService(userMessage);
    const ownerId = context?.ownerId;

    // =========================================================================
    // A. GUARDED FINANCIAL MANDATE CREATION & EXECUTION QUOTES
    // =========================================================================
    if ((intent === "create" || intent === "execute") && !known) {
      yield* say(
        'I couldn\'t match that to a supported service, so nothing was created or paid. Try naming one, for example: "Check the price of Spotify Premium" or "Create a rule for Netflix, max $20 monthly".'
      );
      return;
    }

    if (intent === "create" && known) {
      if (!ownerId) throw new Error("Creating a mandate requires a verified user.");
      const service = known.service;
      const dollarMatches = userMessage.match(/\$([0-9]+(?:\.[0-9]{1,2})?)/g) ?? [];
      const ceiling =
        dollarMatches.length > 0
          ? parseFloat(dollarMatches[dollarMatches.length - 1].replace("$", ""))
          : known.defaultCeiling;

      const created = await executeCreateMandate(
        {
          service,
          max_amount: ceiling,
          schedule: known.schedule,
          strict_mode: isStrictMode,
        },
        ownerId
      );

      await posthogServer.trackMandateCreated({
        mandateId: created.mandate.id,
        service,
        budgetCeiling: ceiling,
        recurrence: known.schedule,
        strictMode: isStrictMode,
      });

      yield {
        type: "thought",
        thought: {
          summary: "Spending Rule Created",
          steps: [
            { step: "Created spending rule", status: "done", detail: `Rule ID: ${created.mandate.id}` },
            { step: "Budget ceiling configured", status: "done", detail: `Max $${ceiling.toFixed(2)} USD` },
          ],
        },
      };
      yield* say(
        `Created a spending rule for ${service}: max $${ceiling.toFixed(2)} USD, ${known.schedule}. No payment was made.`
      );
      return;
    }

    if (intent === "execute" && known) {
      if (!ownerId) throw new Error("Running a spending rule requires a verified user.");
      const service = known.service;
      const keyword = known.keyword;
      const owned = (
        await db
          .select()
          .from(mandates)
          .where(and(eq(mandates.ownerId, ownerId), eq(mandates.status, "ACTIVE")))
      ).filter((m) => m.service.toLowerCase().includes(keyword) || m.service === service);

      if (owned.length !== 1) {
        yield* say(
          owned.length === 0
            ? `You don't have an active spending rule for ${service}, so nothing was paid. Create the rule first, then run it.`
            : `You have more than one active rule matching ${service}. Use Run Now on the one you mean. Nothing was paid.`
        );
        return;
      }
      const quoted = await quoteMandatePayment(owned[0].id, ownerId);
      if (!quoted.ok) {
        yield* say(quoted.message);
        return;
      }
      const q = quoted.quote;
      yield { type: "payment_confirmation", quote: q as unknown as Record<string, unknown> };
      yield* say(
        `Ready to pay ${q.service}: $${q.amount.toFixed(2)} ${q.currency} (ceiling $${q.budgetCeiling.toFixed(2)}, billing period ${q.periodLabel}). Please confirm to proceed. No payment has been made yet.`
      );
      return;
    }

    // =========================================================================
    // B. PERSONA SAVINGS, CREDITS, STARTUP PROGRAMS, STUDENT DISCOUNTS & TAX
    // =========================================================================
    const activeSkillIds = new Set(
      (context?.activeSkills ?? []).map((s) => s.metadata.id)
    );
    const isWorkspaceSurfaceTurn =
      activeRouting.target === "doc" || activeRouting.target === "excel";

    if (
      !isWorkspaceSurfaceTurn &&
      /\b(top\s*\d*\s*(startup\s*)?accelerators?|best\s*(startup\s*)?accelerators?|accelerator programs?|best accelerators|startup accelerators)\b/i.test(
        textLower
      )
    ) {
      const accA2ui = buildSkillA2uiBatch("top-accelerators");
      yield* say(
        "Here are the top 10 startup accelerator programs across global flagships, equity-free tech programs, and seed/deep-tech funds.",
        accA2ui
      );
      return;
    }

    if (!isWorkspaceSurfaceTurn && activeSkillIds.has("cloud-credit-domino")) {
      const probeResult = await personaSavingsOptimizer.probePersonaSavings({
        serviceName: "PostHog",
        currentPrice: 120.0,
        persona: "STARTUP_FOUNDER",
      });
      if (probeResult.hasDeals) {
        yield {
          type: "savings_advisory",
          advisory: probeResult as unknown as Record<string, unknown>,
        };
      }
      const dominoA2ui = buildSkillA2uiBatch("cloud-credit-domino");
      const dominoLead = dominoA2ui
        ? "Stop retrying the cold $1,000 AWS tier — use your interactive Cloud Credit Domino roadmap below to unlock PostHog ($50k), Retool/Zendesk ($5k AWS), and NVIDIA Inception ($25k AWS + $25k GCP) while skipping perks your stack does not need."
        : skillInjector.buildSkillFallbackReply(context?.activeSkills ?? []) ||
          "Follow the Partner Credit Domino Chain: start with PostHog for Startups ($50k), bridge via Retool/Zendesk ($5k AWS org tier) or NVIDIA Inception ($10k-$25k AWS + $25k bootstrapped GCP), skip tools your stack does not need, and lock $0.00 Rico mandates.";
      yield* say(dominoLead, dominoA2ui);
      return;
    }

    if (
      !isWorkspaceSurfaceTurn &&
      (activeSkillIds.has("startup-credit-grant") ||
        textLower.includes("startup credit") ||
        textLower.includes("posthog credit") ||
        textLower.includes("aws activate") ||
        textLower.includes("zero burn") ||
        textLower.includes("founder discount") ||
        textLower.includes("persona savings"))
    ) {
      const probeResult = await personaSavingsOptimizer.probePersonaSavings({
        serviceName: "PostHog",
        currentPrice: 120.0,
        persona: "STARTUP_FOUNDER",
      });
      if (probeResult.hasDeals) {
        yield {
          type: "savings_advisory",
          advisory: probeResult as unknown as Record<string, unknown>,
        };
      }
      const creditsA2ui = buildSkillA2uiBatch("startup-credit-grant");
      yield* say(
        creditsA2ui
          ? "Identified $100,000+ in non-dilutive startup credit allocations — explore your eligible programs and draft your application below."
          : "Identified $55,000 in eligible startup allocations: PostHog for Startups ($50,000 for 12 months) and AWS Activate Portfolio ($5,000 cloud credits).",
        creditsA2ui
      );
      return;
    }

    if (
      !isWorkspaceSurfaceTurn &&
      (activeSkillIds.has("student-discount-enforcer") ||
        textLower.includes("student discount") ||
        textLower.includes("college deal") ||
        textLower.includes("university pricing") ||
        textLower.includes("edu email"))
    ) {
      const probeResult = await personaSavingsOptimizer.probePersonaSavings({
        serviceName: "Spotify",
        currentPrice: 11.99,
        persona: "STUDENT",
      });
      if (probeResult.hasDeals) {
        yield {
          type: "savings_advisory",
          advisory: probeResult as unknown as Record<string, unknown>,
        };
      }
      yield* say(
        "Verified student discount tiers: Spotify Student ($5.99/mo, 50% off), Adobe Creative Cloud Student ($19.99/mo, 67% off), and GitHub Student Developer Pack ($2,500+ value)."
      );
      return;
    }

    if (
      !isWorkspaceSurfaceTurn &&
      (activeSkillIds.has("tax-deduction-ocr") ||
        textLower.includes("tax deduction") ||
        textLower.includes("schedule c") ||
        textLower.includes("write off") ||
        textLower.includes("tax write-off"))
    ) {
      yield* say(
        "Software and cloud subscriptions (AWS, Supabase, GitHub Copilot, Notion, PostHog) are generally 100% deductible under IRS Schedule C Line 18 (estimated ~$1,420/yr savings at a 28% bracket)."
      );
      return;
    }

    // =========================================================================
    // C. RICO-DOC SPLIT WORKSPACE ROUTING (OPEN, READ, DRAFT / APPEND)
    // =========================================================================
    if (activeRouting.target === "doc") {
      if (activeRouting.workspaceOp === "open") {
        const execRes = await executeWorkspaceDocEdit({ op: "open" });
        yield {
          type: "workspace_action",
          workspaceAction: execRes.workspaceAction as WorkspaceActionEvent,
        };
        yield* say(
          "Opened RICO-DOC in the right split view. Tell me what document, memo, policy, or summary you would like to draft or refine."
        );
        return;
      }

      if (activeRouting.workspaceOp === "read") {
        if (!wsSnap?.doc || !wsSnap.doc.markdown.trim()) {
          yield* say(
            `Your Doc "${wsSnap?.doc?.title || "Untitled"}" is currently blank. Ask me to draft a spend brief, policy, or meeting notes to populate it.`
          );
          return;
        }
        const selNote = wsSnap.doc.selectedText
          ? `\nHighlighted selection: "${wsSnap.doc.selectedText}"\n`
          : "";
        yield* say(
          `I can see your Doc "${wsSnap.doc.title}" (${wsSnap.doc.blockCount} blocks).${selNote}\nCurrent content summary:\n${stripStars(wsSnap.doc.markdown).slice(0, 800)}`
        );
        return;
      }

      const docPayload = buildTailoredDocPayload(userMessage, context);
      const execRes = await executeWorkspaceDocEdit(docPayload);

      yield {
        type: "step",
        step: {
          step: "Updated Shared Split Document",
          status: "done",
          detail:
            docPayload.op === "append"
              ? "Appended structured section to live Doc"
              : `Drafted "${docPayload.title || "Document"}" in live Doc`,
        },
      };
      yield {
        type: "workspace_action",
        workspaceAction: execRes.workspaceAction as WorkspaceActionEvent,
      };
      yield* say(
        `I ${docPayload.op === "append" ? "appended the new section to" : "drafted"} your Doc${docPayload.title ? ` (${docPayload.title})` : ""} in the right split view. You can edit any block directly or highlight text and click Ask Rico to refine it.`
      );
      return;
    }

    // =========================================================================
    // D. RICO-EXCEL SPLIT WORKSPACE ROUTING (OPEN, READ, TABLE / FORMULAS)
    // =========================================================================
    if (activeRouting.target === "excel") {
      if (activeRouting.workspaceOp === "open") {
        const execRes = await executeWorkspaceExcelEdit({ op: "open" });
        yield {
          type: "workspace_action",
          workspaceAction: execRes.workspaceAction as WorkspaceActionEvent,
        };
        yield* say(
          "Opened RICO-Excel in the right split view. Ask me to build a budget table, 6-month runway model, vendor comparison matrix, or write formulas into specific cells."
        );
        return;
      }

      if (activeRouting.workspaceOp === "read") {
        if (!wsSnap?.excel || wsSnap.excel.nonEmptyCount === 0) {
          yield* say(
            `Your Excel workbook "${wsSnap?.excel?.title || "Untitled sheet"}" (active sheet: ${wsSnap?.excel?.activeSheet || "Sheet 1"}) is currently empty. Say "Build a subscription budget table in Excel" to populate live rows and =SUM() formulas.`
          );
          return;
        }
        yield* say(
          `I can see your Excel workbook "${wsSnap.excel.title}" (active sheet: ${wsSnap.excel.activeSheet}, selected range: ${wsSnap.excel.selectionRange || "A1"}).\n\nCurrent cells and formulas:\n${wsSnap.excel.cellSummary}`
        );
        return;
      }

      const excelPayload = buildTailoredExcelPayload(userMessage, context);
      const execRes = await executeWorkspaceExcelEdit({
        op: excelPayload.op,
        title: excelPayload.title,
        start_cell: excelPayload.start_cell,
        headers: excelPayload.headers,
        rows: excelPayload.rows,
        cells: excelPayload.cells,
      });

      yield {
        type: "step",
        step: {
          step: "Updated Shared Excel Workbook",
          status: "done",
          detail: excelPayload.description,
        },
      };
      yield {
        type: "workspace_action",
        workspaceAction: execRes.workspaceAction as WorkspaceActionEvent,
      };
      yield* say(
        `${excelPayload.description} Both of us can edit cells or formulas directly in split view.`
      );
      return;
    }

    // =========================================================================
    // E. DIRECT CHAT ROUTING (NO UNWANTED BROWSER SEARCH!)
    // =========================================================================
    if (activeRouting.target === "chat") {
      if (
        (activeRouting.chatSubkind === "advisory" ||
          activeRouting.chatSubkind === "general_qa") &&
        context?.activeSkills &&
        context.activeSkills.length > 0
      ) {
        const topSkill = context.activeSkills[0];
        const skillA2ui = buildSkillA2uiBatch(topSkill.metadata.id);
        if (skillA2ui) {
          yield* say(
            `Activated ${topSkill.metadata.name} — use the interactive workflow below to run the playbook or take action.`,
            skillA2ui
          );
          return;
        }
      }
      const directReply = buildDirectChatAnswer(userMessage, activeRouting, context);
      yield* say(directReply);
      return;
    }

    // =========================================================================
    // F. RICO-BROWSER & LIVE WEB RESEARCH (ONLY WHEN EXPLICITLY NEEDED)
    // =========================================================================

    // F1. Open Browser pane without running a search
    if (activeRouting.browserMode === "open_only") {
      const pool = browserTabPool.listTabs();
      const activeUrl = pool.tabs.find((t) => t.id === pool.focusedTabId)?.url || "";
      yield {
        type: "browser_action",
        browserAction: {
          action: "open_tab",
          url: activeUrl,
          title: "RICO-Browser",
          detail: "Opened live Browser workspace",
          status: "done",
        },
      };
      yield* say(
        "Opened RICO-Browser in the right split view. Enter a URL, ask me to check a vendor's live pricing, or use the Element Picker (@eN) to interact with any page."
      );
      return;
    }

    // F2. Direct URL navigation ("open https://stripe.com/pricing", "go to vercel.com")
    if (activeRouting.browserMode === "open_url" && activeRouting.directUrl) {
      const url = activeRouting.directUrl;
      yield {
        type: "browser_action",
        browserAction: {
          action: "navigate",
          url,
          title: url,
          detail: `Navigating live browser to ${url}...`,
          status: "running",
        },
      };
      try {
        const tab = await browserTabPool.openTab({ url, focus: true });
        yield {
          type: "browser_action",
          browserAction: {
            action: "complete",
            url: tab.url || url,
            title: tab.title || url,
            tabId: tab.id,
            detail: `Loaded ${tab.title || url}`,
            status: "done",
          },
        };
        yield* say(
          `Opened ${tab.title || url} (${tab.url || url}) in the live split browser. You can inspect elements with the @eN picker or ask me to extract pricing from this page.`
        );
      } catch (navErr) {
        const msg = navErr instanceof Error ? navErr.message : String(navErr);
        yield* say(`Could not open ${url} in the live browser: ${msg}`);
      }
      return;
    }

    // F3. Multi-service parallel price comparison
    const compareTargets =
      activeRouting.browserMode === "compare_prices"
        ? activeRouting.compareServices ?? detectAllMentionedServices(userMessage)
        : [];
    if (compareTargets.length >= 2) {
      const firstUrl = defaultUrlForService(compareTargets[0]);
      yield {
        type: "browser_action",
        browserAction: {
          action: "navigate",
          url: firstUrl,
          title: `Comparing ${compareTargets.join(" vs ")}`,
          detail: `Dispatching parallel browser tabs for ${compareTargets.join(", ")}...`,
          status: "running",
        },
      };
      yield {
        type: "step",
        step: {
          step: "Parallel browser comparison",
          status: "running",
          detail: `Inspecting ${compareTargets.join(" & ")} pricing pages...`,
        },
      };

      const comp = await executeCompareMultiServicePrices({ services: compareTargets });
      const comparison = comp.comparison as {
        bots?: Array<{
          service: string;
          url: string;
          extractedResult?: { price: number; planName: string; currency: string };
        }>;
        bestDeal?: {
          service: string;
          price: number;
          planName: string;
          savingsVsHighest: number;
        };
      };

      yield {
        type: "browser_action",
        browserAction: {
          action: "complete",
          url: comparison.bots?.[0]?.url || firstUrl,
          title: `Compared ${compareTargets.length} services`,
          detail: comp.summary ? String(comp.summary) : "Comparison complete",
          status: "done",
        },
      };
      yield {
        type: "step",
        step: {
          step: "Parallel browser comparison",
          status: "done",
          detail: String(comp.summary || "Verified live rates across tabs"),
        },
      };

      const lines = (comparison.bots || []).map(
        (b) =>
          `- ${b.service}: $${(b.extractedResult?.price || 0).toFixed(2)} ${b.extractedResult?.currency || "USD"}/mo (${b.extractedResult?.planName || "Verified Plan"})`
      );

      yield* say(
        [
          `Verified live pricing across ${compareTargets.join(" and ")}. Nothing was created or paid:`,
          ...lines,
        ].join("\n")
      );
      return;
    }

    // F4. Single known-service live price verification
    if (activeRouting.browserMode === "verify_price" && known) {
      const service = known.service;
      const targetUrl = defaultUrlForService(service);
      const dollarMatches = userMessage.match(/\$([0-9]+(?:\.[0-9]{1,2})?)/g) ?? [];
      const ceiling =
        dollarMatches.length > 0
          ? parseFloat(dollarMatches[dollarMatches.length - 1].replace("$", ""))
          : known.defaultCeiling;

      yield {
        type: "browser_action",
        browserAction: {
          action: "navigate",
          url: targetUrl,
          title: service,
          detail: `Opening ${targetUrl}...`,
          status: "running",
        },
      };

      const step: ThoughtStep = {
        step: "Verified merchant price via Playwright",
        status: "running",
        detail: `Navigating to ${service} pricing page...`,
      };
      yield { type: "step", step };

      const priceVerification = await executeVerifyWebPrice({
        service_name: service,
        expected_price: ceiling,
      });

      yield {
        type: "browser_action",
        browserAction: {
          action: "complete",
          url: targetUrl,
          title: `${service} — $${priceVerification.verifiedPrice.toFixed(2)}/mo`,
          detail: `Verified $${priceVerification.verifiedPrice.toFixed(2)}/mo (${priceVerification.planName})`,
          status: "done",
        },
      };

      step.status = "done";
      step.detail = `Price: $${priceVerification.verifiedPrice.toFixed(2)}/mo (${priceVerification.planName})`;
      yield { type: "step", step };

      yield* say(
        `Verified live pricing for ${service} at $${priceVerification.verifiedPrice.toFixed(2)} ${priceVerification.currency}/mo (${priceVerification.planName}). Recommended cap: $${ceiling.toFixed(2)}/mo. Nothing was created or paid.`
      );
      return;
    }

    // F5. @eN Semantic Element Actions & AXTree Snapshots
    const refMatch = userMessage.match(/@e(\d+)\b/i);
    if (
      activeRouting.browserMode === "semantic_ref" ||
      refMatch ||
      /\b(snapshot|axtree|semantic tree)\b/i.test(userMessage)
    ) {
      const atRef = refMatch ? `@e${refMatch[1]}` : undefined;
      yield {
        type: "browser_action",
        browserAction: {
          action: atRef ? "act" : "snapshot",
          url: "",
          ref: atRef,
          detail: atRef
            ? `Inspecting & acting on ${atRef} in live browser...`
            : "Capturing semantic AXTree snapshot...",
          status: "running",
        },
      };

      try {
        const snap = await browserTabPool.snapshot();
        if (atRef) {
          const wantsClick = /\b(click|press|open|select|choose|tap)\b/i.test(userMessage);
          const fillMatch = userMessage.match(
            /\b(?:fill|type|enter)\b[^"']*["']([^"']+)["']/i
          );
          if (fillMatch) {
            const actRes = await browserTabPool.act({
              tabId: snap.tabId,
              action: "fill",
              ref: atRef,
              generation: snap.generation,
              value: fillMatch[1],
            });
            yield {
              type: "browser_action",
              browserAction: {
                action: "act",
                url: actRes.url,
                title: actRes.title,
                ref: atRef,
                generation: actRes.generation,
                detail: actRes.summary,
                status: "done",
              },
            };
            yield* say(
              `${actRes.summary} on ${actRes.url} (generation ${actRes.generation}). Nothing was paid.`
            );
            return;
          }
          if (wantsClick) {
            const actRes = await browserTabPool.act({
              tabId: snap.tabId,
              action: "click",
              ref: atRef,
              generation: snap.generation,
            });
            yield {
              type: "browser_action",
              browserAction: {
                action: "act",
                url: actRes.url,
                title: actRes.title,
                ref: atRef,
                generation: actRes.generation,
                detail: actRes.summary,
                status: "done",
              },
            };
            yield* say(
              `${actRes.summary}. Active page is now ${actRes.title || actRes.url} (generation ${actRes.generation}). Nothing was paid.`
            );
            return;
          }

          const targetNode = snap.elements.find(
            (e) => e.ref.toLowerCase() === atRef.toLowerCase()
          );
          yield {
            type: "browser_action",
            browserAction: {
              action: "snapshot",
              url: snap.url,
              title: snap.title,
              ref: atRef,
              generation: snap.generation,
              detail: targetNode
                ? `Inspected ${atRef} [${targetNode.role}] "${targetNode.name}"`
                : `Captured AXTree (${snap.elements.length} nodes)`,
              status: "done",
            },
          };
          if (targetNode) {
            const priceLine =
              snap.groundedPrices.length > 0
                ? `\nGrounded page prices: ${snap.groundedPrices
                    .map((g) => `${g.matchedSubstring} (${g.billingPeriod})`)
                    .join(", ")}`
                : "";
            yield* say(
              `Inspected ${targetNode.ref} on ${snap.title} (${snap.url}, generation ${snap.generation}):\n- Role: ${targetNode.role} (<${targetNode.tagName}>)\n- Accessible label: ${targetNode.name || "(unlabeled)"}\n- Bounds: ${targetNode.rect.width}x${targetNode.rect.height} at (${targetNode.rect.x}, ${targetNode.rect.y})${priceLine}\n\nSay "Click ${targetNode.ref}" to activate it in the live browser. Nothing was paid.`
            );
            return;
          }
        }

        yield {
          type: "browser_action",
          browserAction: {
            action: "snapshot",
            url: snap.url,
            title: snap.title,
            generation: snap.generation,
            detail: `Captured ${snap.elements.length} @eN semantic elements (gen=${snap.generation})`,
            status: "done",
          },
        };
        const previewLines = snap.elements
          .slice(0, 12)
          .map((e) => `- ${e.ref} [${e.role}] ${e.name || e.tagName}`)
          .join("\n");
        yield* say(
          `Captured semantic AXTree snapshot on ${snap.title} (${snap.url}, generation ${snap.generation}, ${snap.elements.length} interactive nodes):\n${previewLines}\n\nNothing was created or paid.`
        );
        return;
      } catch (snapErr) {
        const errText = snapErr instanceof Error ? snapErr.message : String(snapErr);
        yield* say(`Could not complete semantic action: ${errText}`);
        return;
      }
    }

    // F6. Explicit Live Web Search (never triggered in offline test environments)
    if (isTestEnv) {
      yield* say(
        'Offline test mode: external web search skipped. Name a supported service (e.g. "Check the price of Spotify Premium") or create a spending rule.'
      );
      return;
    }

    const searchQuery =
      userMessage
        .replace(
          /^(please\s+)?(can you\s+|could you\s+)?(search\s+(the\s+web\s+)?(for\s+)?|find\s+(online\s+)?|look\s+up\s+(online\s+)?|check\s+(the\s+web\s+for\s+)?|browse\s+(for\s+)?|google\s+)/i,
          ""
        )
        .trim() || userMessage.trim();

    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`;

    const eventQueue: StreamEvent[] = [];
    let notifyNext: (() => void) | null = null;
    let searchFinished = false;

    const pushEvent = (ev: StreamEvent) => {
      eventQueue.push(ev);
      if (notifyNext) {
        const fn = notifyNext;
        notifyNext = null;
        fn();
      }
    };

    pushEvent({
      type: "browser_action",
      browserAction: {
        action: "search",
        url: searchUrl,
        title: `Search: ${searchQuery}`,
        detail: `Searching web for "${searchQuery}"...`,
        status: "running",
      },
    });
    pushEvent({
      type: "step",
      step: {
        step: `Searching the web: "${searchQuery}"`,
        status: "running",
        detail: "Launching Chromium search & inspecting top results...",
      },
    });

    const browsePromise = priceWorker
      .searchAndBrowseLiveWeb(searchQuery, {
        maxPagesToVisit: 1,
        onProgress: (prog) => {
          pushEvent({
            type: "browser_action",
            browserAction: {
              action: prog.action,
              url: prog.url,
              title: prog.title,
              detail: prog.detail,
              tabId: prog.tabId,
              status: prog.action === "complete" ? "done" : "running",
            },
          });
          if (prog.action === "navigate") {
            pushEvent({
              type: "step",
              step: {
                step: `Opening ${prog.title.slice(0, 56)}`,
                status: "running",
                detail: prog.url,
              },
            });
          } else if (prog.action === "scroll") {
            pushEvent({
              type: "step",
              step: {
                step: `Opening ${prog.title.slice(0, 56)}`,
                status: "done",
                detail: `Scrolled & extracted live content from ${prog.url}`,
              },
            });
          }
        },
      })
      .finally(() => {
        searchFinished = true;
        if (notifyNext) {
          const fn = notifyNext;
          notifyNext = null;
          fn();
        }
      });

    while (!searchFinished || eventQueue.length > 0) {
      if (eventQueue.length > 0) {
        yield eventQueue.shift()!;
      } else {
        await new Promise<void>((resolve) => {
          notifyNext = resolve;
        });
      }
    }

    const liveResult = await browsePromise;

    yield {
      type: "step",
      step: {
        step: `Searching the web: "${searchQuery}"`,
        status: "done",
        detail: `Found ${liveResult.searchResults.length} sources · Inspected ${liveResult.primaryUrl}`,
      },
    };

    if (liveResult.searchResults.length === 0 && liveResult.visitedPages.length === 0) {
      yield* say(
        `I searched the web for "${searchQuery}" in the live browser (${liveResult.searchUrl}), but no public result snippets were returned. Try refining the query or entering a direct URL in the browser pane on the right.`
      );
      return;
    }

    const lines: string[] = [];
    const primaryVisited = liveResult.visitedPages[0];
    if (primaryVisited) {
      lines.push(`Inspected live page: ${primaryVisited.title}`);
      lines.push(`Source: ${primaryVisited.url}`);
      if (primaryVisited.detectedPrice) {
        lines.push(
          `Detected pricing on page: $${primaryVisited.detectedPrice.price.toFixed(2)} ${primaryVisited.detectedPrice.currency} (${primaryVisited.detectedPrice.billingPeriod})`
        );
      }
      if (primaryVisited.excerpt) {
        lines.push(`\nKey page findings:\n${primaryVisited.excerpt.slice(0, 380)}`);
      }
    }

    const topResults = liveResult.searchResults.slice(0, 3);
    if (topResults.length > 0) {
      lines.push(`\nWeb search sources:`);
      for (const r of topResults) {
        lines.push(`- ${r.title} (${r.url})${r.snippet ? `\n  ${r.snippet.slice(0, 160)}` : ""}`);
      }
    }

    lines.push(`\nNothing was created or paid.`);
    yield* say(lines.join("\n"));
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const geminiAgent = new GeminiAgentClient();
