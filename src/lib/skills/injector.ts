/**
 * Modular Skill Runtime Injector
 * Matches user prompts against enabled skills and dynamically injects
 * domain-specific instructions, constraints, and few-shot tool calls into
 * the agent's runtime context.
 */

import { skillRegistry } from "./registry";
import {
  Skill,
  SkillMatchResult,
  SkillInjectionOptions,
  InjectedSkillContext,
} from "./types";

/**
 * Strips asterisks / markdown stars to strictly satisfy Anas's Clean Code rules.
 */
function cleanText(text: string): string {
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

const STOPWORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "into", "about", "what",
  "when", "where", "which", "who", "whom", "whose", "why", "how", "can", "could",
  "would", "should", "will", "are", "was", "were", "been", "being", "have", "has",
  "had", "does", "did", "doing", "our", "your", "their", "his", "her", "its",
  "you", "they", "them", "she", "him", "need", "want", "use", "using", "used",
  "get", "got", "make", "made", "help", "please", "tell", "show", "give", "find",
  "check", "more", "some", "any", "all", "not", "but", "just", "only", "very",
  "also", "than", "then", "now", "here", "there", "like", "over", "under",
  "per", "month", "monthly", "year", "yearly", "annual", "cost", "price", "money",
]);

const HIGH_SIGNAL_DOMAIN_TOKENS = new Set([
  "posthog", "sheerid", "unidays", "reconcile", "reconciliation", "overbilled",
  "overcharge", "overcharged", "accrual", "accruals", "runway", "ltv", "cac",
  "nvidia", "inception", "zendesk", "retool", "depot", "domino", "payback",
  "variance", "audit", "zombie", "deductible", "deduction", "writeoff", "ocr",
  "activate", "bootstrapped", "mrr", "arr", "burn",
]);

const SKILL_SYNONYM_KEYWORDS: Record<string, string[]> = {
  "cloud-credit-domino": [
    "aws credit", "aws credits", "gcp credit", "gcp credits",
    "google cloud credit", "google cloud credits", "cloud credit", "cloud credits",
    "cant get aws", "can't get aws", "cannot get aws", "rejected aws",
    "aws rejection", "aws denied", "free aws", "free gcp", "nvidia", "retool",
    "zendesk", "depot", "bootstrapped cloud", "partner bridge", "activate credits",
  ],
  "startup-credit-grant": [
    "startup", "founder", "pre-seed", "seed", "bootstrapped", "grants",
    "credits", "posthog", "notion", "aws", "openai credits", "supabase credits",
    "runway", "pitch", "accelerator", "yc", "perks",
  ],
  "saas-unit-economics": [
    "burn", "runway", "mrr", "arr", "gross margin", "unit economics",
    "ltv", "cac", "churn", "retention", "cash flow", "zero cash", "profitability",
    "ai cost", "inference cost",
  ],
  "monthly-spend-closer": [
    "month end", "close month", "spend summary", "monthly spend", "variance",
    "accrual", "prepaid", "why did spend", "bills jumped", "cost spike", "burn report",
  ],
  "payment-reconciler": [
    "reconcile", "reconciliation", "mismatch", "ledger", "double charge",
    "duplicate", "statement", "capture", "discrepancy", "unmatched", "variance",
  ],
  "invoice-statement-auditor": [
    "invoice", "receipt", "billing error", "overbilled", "overcharged",
    "math error", "line item", "vendor contract", "statement audit", "verify bill",
  ],
  "saas-renewal-negotiator": [
    "renewal", "auto-renew", "auto renew", "lock-in", "zombie", "unused seats",
    "unused licenses", "negotiate", "retention discount", "cancel subscription",
    "seat optimization", "contract notice",
  ],
  "tax-deduction-ocr": [
    "tax", "taxes", "deduct", "deductible", "deduction", "write off", "write-off",
    "schedule c", "irs", "business expense", "freelancer expense", "1099",
  ],
  "student-discount-enforcer": [
    "student", "college", "university", "edu", "campus", "sheerid", "unidays",
    "academic", "school email",
  ],
};

function tokenizeSignificant(text: string): string[] {
  const cleaned = text.toLowerCase().replace(/[^a-z0-9.\s-]/g, " ");
  const raw = cleaned.split(/\s+/).filter(Boolean);
  const tokens: string[] = [];
  for (const w of raw) {
    let start = 0;
    let end = w.length;
    while (start < end && w[start] === "-") start += 1;
    while (end > start && w[end - 1] === "-") end -= 1;
    const t = w.slice(start, end);
    if (t.length >= 2 && !STOPWORDS.has(t)) {
      tokens.push(t);
    }
  }
  return Array.from(new Set(tokens));
}

function inferPersonaFromInput(normalizedInput: string): string | undefined {
  if (
    /\b(startup|founder|co-founder|cofounder|bootstrapped|pre-seed|seed round|series a|runway|burn rate|mrr|arr|ltv|cac|investor|vc|yc|y combinator|accelerator|saas)\b/i.test(
      normalizedInput
    )
  ) {
    return "founder";
  }
  if (
    /\b(student|college|university|\.edu|edu email|campus|dorm|sheerid|unidays)\b/i.test(
      normalizedInput
    )
  ) {
    return "student";
  }
  if (
    /\b(freelancer|freelance|1099|sole proprietor|self-employed|schedule c|write[- ]?off)\b/i.test(
      normalizedInput
    )
  ) {
    return "freelancer";
  }
  return undefined;
}

export class SkillInjector {
  /**
   * Matches a user query and persona against all registered enabled skills.
   * Combines exact trigger phrases, multi-word trigger token coverage,
   * domain synonyms, persona inference, and follow-up history carry-over.
   */
  public matchSkills(
    userMessage: string,
    options?: SkillInjectionOptions
  ): SkillMatchResult[] {
    const skills = skillRegistry.getAllSkills({ enabledOnly: true });
    const normalizedInput = userMessage.toLowerCase();
    const inputTokens = new Set(tokenizeSignificant(normalizedInput));
    const effectivePersona = options?.persona || inferPersonaFromInput(normalizedInput);
    const results: SkillMatchResult[] = [];

    const minConfidence = options?.minConfidence ?? 0.25;
    const forceIds = options?.forceIncludeIds?.map((id) => id.toLowerCase()) || [];

    for (const skill of skills) {
      const skillId = skill.metadata.id.toLowerCase();

      // Check if forcibly included
      if (forceIds.includes(skillId)) {
        results.push({
          skill,
          score: 1.0,
          matchedTriggers: ["forced"],
          reason: "Manually selected or forced by session state",
        });
        continue;
      }

      let score = 0;
      const matchedTriggers: string[] = [];

      // 1. Check exact trigger phrases and non-adjacent trigger token coverage
      for (const trigger of skill.metadata.triggers) {
        const lowerTrigger = trigger.toLowerCase();
        if (normalizedInput.includes(lowerTrigger)) {
          const wordCount = lowerTrigger.split(/\s+/).length;
          const weight = 0.35 + Math.min(0.5, wordCount * 0.15);
          score += weight;
          matchedTriggers.push(trigger);
        } else {
          const trigTokens = tokenizeSignificant(lowerTrigger);
          if (trigTokens.length >= 2) {
            const hits = trigTokens.filter((t) => inputTokens.has(t));
            if (hits.length === trigTokens.length || (trigTokens.length >= 3 && hits.length >= 2)) {
              score += 0.28;
              matchedTriggers.push(`${trigger} (tokens)`);
            }
          }
        }
      }

      // 2. Check skill name or ID
      if (
        normalizedInput.includes(skill.metadata.name.toLowerCase()) ||
        normalizedInput.includes(skillId)
      ) {
        score += 0.4;
        matchedTriggers.push(skill.metadata.name);
      }

      // 3. Domain synonym & description keyword overlap (catches natural phrasing)
      const synonymList = SKILL_SYNONYM_KEYWORDS[skillId] || [];
      const synonymHits: string[] = [];
      for (const kw of synonymList) {
        if (kw.includes(" ")) {
          if (normalizedInput.includes(kw)) {
            synonymHits.push(kw);
          }
        } else if (inputTokens.has(kw)) {
          synonymHits.push(kw);
        }
      }

      // Also check significant tokens from description
      const descTokens = tokenizeSignificant(skill.metadata.description);
      const descHits = descTokens.filter(
        (t) => t.length >= 4 && inputTokens.has(t)
      );
      const uniqueDomainHits = Array.from(new Set([...synonymHits, ...descHits]));
      const hasHighSignal = uniqueDomainHits.some((t) =>
        HIGH_SIGNAL_DOMAIN_TOKENS.has(t)
      );

      if (uniqueDomainHits.length >= 2 || (hasHighSignal && uniqueDomainHits.length >= 1)) {
        const semanticBoost = Math.min(0.55, uniqueDomainHits.length * 0.16);
        score += semanticBoost;
        for (const h of uniqueDomainHits.slice(0, 3)) {
          if (!matchedTriggers.includes(h)) {
            matchedTriggers.push(h);
          }
        }
      }

      // 4. Persona match bonus (only if we already have at least 1 signal hit)
      if (
        matchedTriggers.length > 0 &&
        effectivePersona &&
        (skill.metadata.persona === effectivePersona ||
          skill.metadata.persona === "all")
      ) {
        score += 0.15;
      }

      // Cap score at 1.0
      score = Math.min(1.0, score);

      if (score >= minConfidence && matchedTriggers.length > 0) {
        results.push({
          skill,
          score: Math.round(score * 100) / 100,
          matchedTriggers,
          reason: `Matched ${matchedTriggers.length} signal(s): ${matchedTriggers.slice(0, 3).join(", ")}`,
        });
      }
    }

    // 5. Follow-up conversation history carry-over when current turn has no direct match
    if (
      results.length === 0 &&
      options?.history &&
      options.history.length > 0 &&
      !/^(hi|hello|hey|thanks|thank you|bye|ok|okay)\b/i.test(normalizedInput) &&
      !/\b(15%|calculate|compute|\d+\s*[+\-*/]\s*\d+)\b/i.test(normalizedInput)
    ) {
      const isFollowUp =
        userMessage.trim().split(/\s+/).length <= 10 ||
        /\b(what next|next step|how do i apply|how to apply|draft it|more details|tell me more|which one|what about|go ahead|do that|continue)\b/i.test(
          normalizedInput
        );
      if (isFollowUp) {
        const recentUserText = options.history
          .filter((h) => h.role === "user")
          .slice(-2)
          .map((h) => h.content)
          .join(" ");
        if (recentUserText.trim()) {
          const priorMatches = this.matchSkills(recentUserText, {
            ...options,
            history: undefined,
            minConfidence: 0.35,
          });
          for (const pm of priorMatches) {
            results.push({
              skill: pm.skill,
              score: Math.max(0.3, Math.round(pm.score * 0.7 * 100) / 100),
              matchedTriggers: [...pm.matchedTriggers, "context-followup"],
              reason: `Carried over from recent turn (${pm.reason})`,
            });
          }
        }
      }
    }

    // Sort descending by score
    results.sort((a, b) => b.score - a.score);

    const maxSkills = options?.maxSkills ?? 3;
    return results.slice(0, maxSkills);
  }

  /**
   * Builds a compact, zero-asterisk index of all enabled skills so the agent
   * always knows what specialized playbooks exist and can load/follow them.
   */
  public buildAvailableSkillsIndex(persona?: string): string {
    const skills = skillRegistry.getAllSkills({ enabledOnly: true });
    if (skills.length === 0) return "";

    const lines: string[] = [
      "### AVAILABLE RICO SKILLS INDEX (ALWAYS CHECK BEFORE ANSWERING)",
      "Always verify whether any of the following enabled skills applies to the user's question (especially for founders, credits, runway, burn, renewals, taxes, invoices, or reconciliation). If a relevant skill is not already injected below, call lookup_rico_skills to load its full rules and playbook before answering:",
    ];

    for (const s of skills) {
      const personaTag = s.metadata.persona ? `persona=${s.metadata.persona}` : "persona=all";
      const matchHint =
        persona && s.metadata.persona === persona ? " [PRIORITY FOR USER]" : "";
      lines.push(
        `- ${s.metadata.id} (${s.metadata.name}, ${personaTag})${matchHint}: ${cleanText(s.metadata.description)}`
      );
    }

    return lines.join("\n");
  }

  /**
   * Generates a clean markdown prompt block to inject into the system prompt.
   * Format is carefully structured with zero asterisks / AI slop.
   */
  public buildInjectionPrompt(activeSkills: Skill[]): string {
    if (!activeSkills || activeSkills.length === 0) {
      return "";
    }

    const sections: string[] = [];

    sections.push("### DYNAMICALLY INJECTED DOMAIN SKILLS");
    sections.push(
      "The following specialized skills have been matched and activated for this interaction:"
    );

    for (let i = 0; i < activeSkills.length; i++) {
      const s = activeSkills[i];
      const num = i + 1;
      sections.push(`\n--- SKILL ${num}: ${s.metadata.name.toUpperCase()} (ID: ${s.metadata.id}) ---`);
      sections.push(`CATEGORY: ${s.metadata.category.toUpperCase()}`);
      sections.push(`DESCRIPTION: ${cleanText(s.metadata.description)}`);

      if (s.rules && s.rules.length > 0) {
        sections.push("MANDATORY RULES & GUARDRAILS:");
        for (const rule of s.rules) {
          sections.push(`- ${cleanText(rule)}`);
        }
      }

      if (s.instructions) {
        sections.push("EXECUTION INSTRUCTIONS:");
        sections.push(cleanText(s.instructions));
      }

      if (s.fewShotExamples && s.fewShotExamples.length > 0) {
        sections.push("FEW-SHOT EXAMPLES:");
        s.fewShotExamples.forEach((ex, idx) => {
          sections.push(`Example ${idx + 1}:`);
          sections.push(`User: ${cleanText(ex.user)}`);
          if (ex.thought) {
            sections.push(`Thought: ${cleanText(ex.thought)}`);
          }
          sections.push(`Assistant: ${cleanText(ex.assistantResponse)}`);
        });
      }
    }

    sections.push("\n### END INJECTED SKILLS\n");
    return sections.join("\n");
  }

  /**
   * Complete runtime injection: matches relevant skills for the user message
   * and builds both the injected prompt and tool suggestions.
   */
  public injectSkills(
    userMessage: string,
    options?: SkillInjectionOptions
  ): InjectedSkillContext {
    const matched = this.matchSkills(userMessage, options);
    const activeSkills = matched.map((m) => m.skill);
    const injectedPrompt = this.buildInjectionPrompt(activeSkills);

    // Aggregate suggested tools
    const toolSet = new Set<string>();
    const triggerSet = new Set<string>();

    for (const m of matched) {
      if (m.skill.metadata.toolsRequired) {
        m.skill.metadata.toolsRequired.forEach((t) => toolSet.add(t));
      }
      m.matchedTriggers.forEach((t) => triggerSet.add(t));
    }

    return {
      activeSkills,
      injectedPrompt,
      suggestedTools: Array.from(toolSet),
      matchedTriggers: Array.from(triggerSet),
    };
  }

  /**
   * Builds a concise, zero-asterisk answer grounded directly in the top matched skill
   * for offline / fallback reasoning mode.
   */
  public buildSkillFallbackReply(activeSkills: Skill[]): string | null {
    if (!activeSkills || activeSkills.length === 0) return null;
    const primary = activeSkills[0];
    const parts: string[] = [];

    parts.push(`Activated ${primary.metadata.name}: ${cleanText(primary.metadata.description)}`);

    if (primary.instructions) {
      const cleanInstr = cleanText(primary.instructions)
        .split("\n")
        .filter((l) => l.trim().length > 0)
        .slice(0, 8)
        .join("\n");
      parts.push(`\nPlaybook Steps:\n${cleanInstr}`);
    }

    if (primary.rules && primary.rules.length > 0) {
      parts.push(
        `\nGuardrails:\n${primary.rules
          .slice(0, 3)
          .map((r) => `- ${cleanText(r)}`)
          .join("\n")}`
      );
    }

    if (primary.metadata.toolsRequired && primary.metadata.toolsRequired.length > 0) {
      parts.push(
        `\nRecommended next actions: ${primary.metadata.toolsRequired.join(", ")}.`
      );
    }

    return parts.join("\n");
  }
}

export const skillInjector = new SkillInjector();
