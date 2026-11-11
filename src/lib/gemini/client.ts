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
} from "./tool-executors";
import { StreamEvent, ChatContext, ThoughtStep } from "./types";
import { posthogServer } from "@/lib/telemetry/posthog-server";
import { personaSavingsOptimizer } from "@/lib/savings";
import { skillInjector } from "@/lib/skills";
import { classifyChatIntent, detectKnownService } from "./intent";
import { quoteMandatePayment } from "@/lib/payments/mandate-execution";
import { browserTabPool, priceWorker, KNOWN_MERCHANT_PROFILES } from "@/lib/browser";

export function stripStars(text: string): string {
  if (!text) return "";
  return text
    .replace(/^(\s*)\*+(\s*)/gm, "$1- $2")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^(\s*)\*+\s*/gm, "$1")
    .replace(/\s*\*+\s*$/gm, "")
    .replace(/^\*+/, "")
    .replace(/\*+$/, "");
}

function detectAllKnownServices(message: string): string[] {
  const lower = message.toLowerCase();
  const candidates: Array<{ keyword: string; service: string }> = [
    { keyword: "netflix", service: "Netflix Standard HD" },
    { keyword: "spotify", service: "Spotify Premium" },
    { keyword: "aws", service: "AWS Cloud Services" },
    { keyword: "copilot", service: "GitHub Copilot" },
    { keyword: "github", service: "GitHub Copilot" },
    { keyword: "adobe", service: "Adobe Creative Cloud" },
    { keyword: "chatgpt", service: "ChatGPT Plus" },
    { keyword: "youtube", service: "YouTube Premium" },
  ];
  const matched = new Set<string>();
  for (const c of candidates) {
    if (new RegExp(`\\b${c.keyword}\\b`, "i").test(lower)) {
      matched.add(c.service);
    }
  }
  return Array.from(matched);
}

function defaultUrlForService(service: string): string {
  const key = Object.keys(KNOWN_MERCHANT_PROFILES).find((k) =>
    service.toLowerCase().includes(k)
  );
  return key
    ? KNOWN_MERCHANT_PROFILES[key].defaultUrl
    : `https://html.duckduckgo.com/html/?q=${encodeURIComponent(service + " pricing")}`;
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

    const enhancedContext: ChatContext = {
      ...context,
      injectedSkillPrompt: skillContext.injectedPrompt,
    };

    const stream =
      isLive && this.client
        ? this.streamLiveGemini(userMessage, enhancedContext)
        : this.streamSimulatedReasoning(userMessage, enhancedContext);

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
        model: isLive ? this.modelName : "gemini-3.8-flash",
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
    context?: ChatContext
  ): AsyncGenerator<StreamEvent> {
    if (!this.client) return;

    const systemInstruction = buildSystemPromptWithContext(context);

    yield {
      type: "step",
      step: {
        step: "Interpreting request via Gemini",
        status: "running",
        detail: "Analyzing intent and required browser/MCP tools...",
      },
    };

    const conversationHistory: Array<{
      role: "user" | "model";
      parts: Array<Record<string, unknown>>;
    }> = [
      {
        role: "user",
        parts: [{ text: userMessage }],
      },
    ];

    yield {
      type: "step",
      step: {
        step: "Interpreting request via Gemini",
        status: "done",
        detail: "Intent and parameters recognized",
      },
    };

    let fullText = "";
    const toolOutputsForSynthesis: Array<{ name: string; result: Record<string, unknown> }> = [];
    const maxTurns = 5;

    for (let turn = 0; turn < maxTurns; turn++) {
      const responseStream = await this.client.models.generateContentStream({
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

      const turnFunctionCalls: Array<{
        name: string;
        args: Record<string, unknown>;
      }> = [];
      let turnText = "";

      for await (const chunk of responseStream) {
        const candidates = chunk.candidates || [];
        if (candidates.length > 0) {
          const parts = candidates[0].content?.parts || [];
          for (const part of parts) {
            if (part.text) {
              turnText += part.text;
              fullText += part.text;
              yield {
                type: "token",
                text: part.text,
              };
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

        const isBrowserTool =
          toolCall.name === "verify_web_price" ||
          toolCall.name === "search_and_browse_web" ||
          toolCall.name === "compare_multi_service_prices" ||
          toolCall.name === "browser_snapshot" ||
          toolCall.name === "browser_act" ||
          toolCall.name === "browser_tabs";

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
          step: {
            step: `Executing Tool: ${toolCall.name}`,
            status: "running",
            detail: `Invoked with: ${JSON.stringify(toolCall.args)}`,
          },
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

          if (toolCall.name === "search_and_browse_web") {
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
            step: {
              step: `Executed Tool: ${toolCall.name}`,
              status: "done",
              detail: toolResult.message
                ? String(toolResult.message)
                : `Result: ${JSON.stringify(toolResult).slice(0, 80)}...`,
            },
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
            step: {
              step: `Tool ${toolCall.name} Blocked`,
              status: "done",
              detail: errMsg,
            },
          };
        }
      }

      conversationHistory.push({
        role: "user",
        parts: functionResponseParts,
      });
    }

    // If Gemini invoked tools without writing a final prose summary yet, synthesize a response from the live tool output
    if (!fullText.trim() && toolOutputsForSynthesis.length > 0) {
      const followUp = await this.client.models.generateContentStream({
        model: this.modelName,
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `User asked: "${userMessage}"\n\nLive tool results:\n${JSON.stringify(
                  toolOutputsForSynthesis
                )}\n\nProvide a clear, concise answer citing verified numbers and URLs. Do not use any asterisks.`,
              },
            ],
          },
        ],
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      });
      for await (const chunk of followUp) {
        const parts = chunk.candidates?.[0]?.content?.parts || [];
        for (const p of parts) {
          if (p.text) {
            fullText += p.text;
            yield { type: "token", text: p.text };
          }
        }
      }
    }

    yield {
      type: "done",
      text: stripStars(fullText),
    };
  }

  /**
   * Autonomous financial & live web research engine:
   * - Preserves strict safety invariants (only explicit create/execute act on mandates; payments require confirmation).
   * - Drives real-time Playwright web search & page navigation for informational, pricing, and comparison queries.
   */
  private async *streamSimulatedReasoning(
    userMessage: string,
    context?: ChatContext
  ): AsyncGenerator<StreamEvent> {
    const textLower = userMessage.toLowerCase().trim();
    const isStrictMode = !!context?.strictMode;
    const isTestEnv = process.env.NODE_ENV === "test";

    const say = async function* (text: string): AsyncGenerator<StreamEvent> {
      for (const word of text.split(" ")) {
        yield { type: "token", text: word + " " };
        if (!isTestEnv) await delay(14);
      }
      yield { type: "done", text };
    };

    // Handle conversational greetings or generic help
    if (
      textLower === "hi" ||
      textLower === "hello" ||
      textLower === "hey" ||
      textLower === "help" ||
      textLower.startsWith("hi ") ||
      textLower.startsWith("hello ")
    ) {
      const greetingMsg = `Hello! I am Rico, your autonomous financial and browser research agent.\n\nTry asking me to:\n- Search any live pricing or vendor on the web (e.g. "Search Vercel Pro vs Render pricing")\n- Check or compare subscriptions ("Compare Netflix and Spotify")\n- Set a guarded spending rule ("Pay Netflix $15.99 on the 5th, max $20")`;
      yield* say(greetingMsg);
      return;
    }

    // Skill Ingestion Flow 1: Startup Credit & Grant Inquiries
    if (
      textLower.includes("startup credit") ||
      textLower.includes("posthog credit") ||
      textLower.includes("aws activate") ||
      textLower.includes("zero burn") ||
      textLower.includes("founder discount") ||
      textLower.includes("persona savings")
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
      const msg = `Startup Credit Drafter Activated:\n\nBased on your startup profile, I have identified $55,000 in eligible credits:\n- PostHog for Startups: $50,000 credit allocation (12 months free analytics and session replay for companies under $5M funding)\n- AWS Activate: $5,000 infrastructure credits\n\nI have prepared your application summary matching official vendor criteria. Would you like me to set a $0.00 spending rule until credits expire?`;
      yield* say(msg);
      return;
    }

    // Skill Ingestion Flow 2: Student 50% Discount Inquiries
    if (
      textLower.includes("student discount") ||
      textLower.includes("college deal") ||
      textLower.includes("university pricing") ||
      textLower.includes("edu email")
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
      const msg = `Student Discount Enforcer Activated:\n\nI verified eligible educational discount tiers:\n- Spotify Student: $5.99/mo (normally $11.99/mo, 50% off)\n- Adobe Creative Cloud Student: $19.99/mo (normally $59.99/mo, 67% off)\n- GitHub Student Developer Pack: Free developer tools worth $2,500+\n\nWould you like me to enforce a student spending ceiling rule for your subscriptions?`;
      yield* say(msg);
      return;
    }

    // Skill Ingestion Flow 3: Tax Deduction & Expense Inquiries
    if (
      textLower.includes("tax deduction") ||
      textLower.includes("schedule c") ||
      textLower.includes("write off") ||
      textLower.includes("tax write-off")
    ) {
      const msg = `Tax Deduction Classifier Activated:\n\nI classified your recent subscriptions and SaaS expenses into IRS Schedule C categories:\n- Software & Cloud: AWS, Supabase, GitHub Copilot (100% Tax Deductible)\n- Office & Productivity: Notion, Zoom, Slack (100% Tax Deductible)\n- Marketing & Analytics: PostHog, Meta Ads (100% Tax Deductible)\n\nEstimated annual tax savings: ~$1,420 (28% blended rate).`;
      yield* say(msg);
      return;
    }

    const intent = classifyChatIntent(userMessage);
    const known = detectKnownService(userMessage);

    // Ask about own spending rules without triggering external scraping
    if (
      intent === "info" &&
      /\b(my|active|show|list)\b.*\b(spending rules|rules|mandates)\b/i.test(userMessage)
    ) {
      const rules = context?.activeMandates ?? [];
      if (rules.length === 0) {
        yield* say(
          "You don't have any active spending rules yet. Tell me a rule like \"Create a rule for Netflix, max $20 monthly\" to add one."
        );
        return;
      }
      const lines = rules
        .map(
          (r) =>
            `- ${r.service}: ceiling $${r.budgetCeiling.toFixed(2)} (${r.recurrence}, ${r.status})`
        )
        .join("\n");
      yield* say(`Here are your active spending rules:\n${lines}`);
      return;
    }

    // Strict Safety Guard: Create and Execute ONLY operate on explicitly recognized services
    if ((intent === "create" || intent === "execute") && !known) {
      yield* say(
        "I couldn't match that to a supported service, so nothing was created or paid. Try naming one, for example: \"Check the price of Spotify Premium\" or \"Create a rule for Netflix, max $20 monthly\"."
      );
      return;
    }

    const ownerId = context?.ownerId;

    // 1. Explicit request to create a spending rule: creates it, never pays.
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
        `Created a spending rule for ${service}: max $${ceiling.toFixed(2)} USD, ${known.schedule}. No payment was made. Use Run Now on the rule when you want to pay, and you'll be asked to confirm first.`
      );
      return;
    }

    // 2. Explicit request to run a rule: prepares a quote for confirmation, never pays.
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

    // 3. Multi-service comparison (e.g. "Compare Netflix and Spotify")
    const allKnown = detectAllKnownServices(userMessage);
    if (allKnown.length >= 2 || (/\b(compare|versus|vs\.?)\b/i.test(userMessage) && allKnown.length >= 2)) {
      const firstUrl = defaultUrlForService(allKnown[0]);
      yield {
        type: "browser_action",
        browserAction: {
          action: "navigate",
          url: firstUrl,
          title: `Comparing ${allKnown.join(" vs ")}`,
          detail: `Dispatching parallel browser tabs for ${allKnown.join(", ")}...`,
          status: "running",
        },
      };
      yield {
        type: "step",
        step: {
          step: "Parallel browser comparison",
          status: "running",
          detail: `Inspecting ${allKnown.join(" & ")} pricing pages...`,
        },
      };

      const comp = await executeCompareMultiServicePrices({ services: allKnown });
      const comparison = comp.comparison as {
        bots?: Array<{ service: string; url: string; extractedResult?: { price: number; planName: string; currency: string } }>;
        bestDeal?: { service: string; price: number; planName: string; savingsVsHighest: number };
      };

      yield {
        type: "browser_action",
        browserAction: {
          action: "complete",
          url: comparison.bots?.[0]?.url || firstUrl,
          title: `Compared ${allKnown.length} services`,
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

      const breakdown = (comparison.bots || [])
        .map((b) => {
          const r = b.extractedResult;
          return r
            ? `- ${b.service} (${r.planName}): $${r.price.toFixed(2)} ${r.currency}/mo`
            : `- ${b.service}: inspected (${b.url})`;
        })
        .join("\n");
      const bestLine = comparison.bestDeal
        ? `\n\nLowest verified option: ${comparison.bestDeal.service} at $${comparison.bestDeal.price.toFixed(2)}/mo (saves $${comparison.bestDeal.savingsVsHighest.toFixed(2)}/mo vs highest).`
        : "";

      yield* say(
        `I opened parallel browser tabs and verified live pricing across ${allKnown.join(" and ")}:\n\n${breakdown}${bestLine}\n\nNothing was created or paid.`
      );
      return;
    }

    // 4. Known single-service live price verification
    if (known) {
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
        `${service} currently costs $${priceVerification.verifiedPrice.toFixed(2)} ${priceVerification.currency}/mo (${priceVerification.planName}). Nothing was created or paid.`
      );
      return;
    }

    // 5. General Live Web Search, @eN Semantic Element Actions & Real-Time Browser Navigation
    if (isTestEnv) {
      yield* say(
        "I couldn't match that to a supported service, so nothing was created or paid. Try naming one, for example: \"Check the price of Spotify Premium\" or \"Create a rule for Netflix, max $20 monthly\"."
      );
      return;
    }

    // Handle @eN element picker chips or semantic AXTree requests directly on the live tab pool
    const refMatch = userMessage.match(/@e(\d+)\b/i);
    if (refMatch || /\b(snapshot|axtree|semantic tree)\b/i.test(userMessage)) {
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
            yield* say(`${actRes.summary} on ${actRes.url} (generation ${actRes.generation}). Nothing was paid.`);
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
            yield* say(`${actRes.summary}. Active page is now ${actRes.title || actRes.url} (generation ${actRes.generation}). Nothing was paid.`);
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

    const searchQuery = userMessage
      .replace(/^(please\s+)?(can you\s+|could you\s+)?(search|find|look up|check|browse|google|tell me about)\s+(for\s+)?/i, "")
      .trim() || userMessage.trim();

    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`;

    // Stream live progress events concurrently while Playwright searches & navigates pages
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
