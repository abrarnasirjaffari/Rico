import React from "react";
import { RoadmapNavbar } from "@/components/roadmap/RoadmapNavbar";
import { SiteFooter } from "@/components/home/SiteFooter";
import {
  DocsArticleLayout,
  DocsSection,
  DocsParagraph,
  DocsTable,
  DocsSteps,
  DocsBullets,
  DocsCallout,
} from "@/components/docs/DocsArticleLayout";

export default function PrivacyAndSecurityDocsPage() {
  return (
    <main className="w-full min-h-screen bg-[#09090B] flex flex-col items-center overflow-x-hidden">
      <div className="box-border w-full h-fit flex flex-col gap-0 justify-start items-center bg-[#09090B] overflow-hidden">
        <RoadmapNavbar />
        <DocsArticleLayout
          activeSlug="privacy-and-security"
          title="Privacy and security"
          lede={
            <>
              RICO is designed so the AI model is 100% blind to your raw card numbers and CVVs.
              Every mandate is governed by deterministic budget ceilings, scoped vault tokens and a
              complete audit trail.
            </>
          }
          outline={[
            { id: "zero-knowledge-vault", label: "Zero-Knowledge Vault" },
            { id: "deterministic-guardrails", label: "Deterministic guardrails" },
            { id: "api-keys-and-data", label: "API keys & workspace data" },
            { id: "observability-and-logs", label: "Observability & audit logs" },
            { id: "where-to-go-next", label: "Where to go next" },
          ]}
          prevPager={{ title: "Omnichannel Bots", href: "/docs/omnichannel-bots" }}
          nextPager={{ title: "Keyboard shortcuts", href: "/docs/keyboard-shortcuts" }}
        >
          <DocsSection id="zero-knowledge-vault" title="Zero-Knowledge Vault" first>
            <DocsParagraph>
              When you link a primary wallet or backup Visa/Mastercard in RICO, raw PAN, expiration
              and CVV numbers are never stored in prompt context or exposed to any LLM. Instead,
              RICO issues opaque, merchant-scoped execution tokens (e.g.{" "}
              <code> vault_tok_netflix_9f8a</code>).
            </DocsParagraph>
            <DocsTable
              headers={["Layer", "What the AI Sees", "What the Vault Enforces"]}
              rows={[
                [
                  "Payment Credentials",
                  "Opaque token ID only (never PAN or CVV)",
                  "Single-merchant binding & cryptographic signature",
                ],
                [
                  "Mandate Ceiling",
                  "Target budget cap ($20.00)",
                  "Hard rejection if extracted price > $20.00",
                ],
                [
                  "Execution Proof",
                  "DOM & visual price snapshot hash",
                  "Requires verified timestamp before token release",
                ],
              ]}
            />
            <DocsCallout title="AI models never touch raw card numbers">
              Even in the event of a prompt injection on a third-party merchant site, the LLM cannot
              exfiltrate card numbers or authorize a charge above your hard mandate ceiling.
            </DocsCallout>
          </DocsSection>

          <DocsSection id="deterministic-guardrails" title="Deterministic guardrails">
            <DocsParagraph>
              Ceiling checks run in deterministic TypeScript/SQLite guardrails outside the model:
            </DocsParagraph>
            <DocsBullets
              items={[
                {
                  lead: "Hard dollar cap.",
                  body: "No capture call can execute if the verified checkout total exceeds your mandate ceiling by even $0.01.",
                },
                {
                  lead: "Explicit query consent.",
                  body: "Ask RICO shows the exact merchant URL and search query before opening any external page.",
                },
                {
                  lead: "Strict Manual Approval toggle.",
                  body: "Flip the header toggle to require human confirmation before every single transaction.",
                },
              ]}
            />
          </DocsSection>

          <DocsSection id="api-keys-and-data" title="API keys & workspace data">
            <DocsSteps
              steps={[
                {
                  lead: "Provider isolation.",
                  body: "A saved Gemini, Anthropic, OpenAI or Groq API key is only ever transmitted to the provider it was configured for.",
                },
                {
                  lead: "Local SQLite persistence.",
                  body: "When self-hosting, your mandates, receipts and vault tokens stay in your own SQLite database.",
                },
                {
                  lead: "One-click workspace reset.",
                  body: "Choosing Clear workspace data in Settings cleanly wipes local mandates, transaction history and audit logs.",
                },
              ]}
            />
          </DocsSection>

          <DocsSection id="observability-and-logs" title="Observability & audit logs">
            <DocsParagraph>
              Every mandate creation, 30 FPS price check, discount probe, anomaly hold and payment
              capture is recorded in the immutable Audit Log with latency, token count and visual
              proof snapshots, and can be exported to CSV at any time.
            </DocsParagraph>
          </DocsSection>

          <DocsSection id="where-to-go-next" title="Where to go next">
            <DocsBullets
              items={[
                {
                  lead: "Keyboard shortcuts",
                  href: "/docs/keyboard-shortcuts",
                  body: "lists every default shortcut in the RICO WebApp.",
                },
                {
                  lead: "Mandates & Guardrails",
                  href: "/docs/mandates-and-guardrails",
                  body: "explains how budget ceilings and ANOMALY_HOLD work.",
                },
                {
                  lead: "About",
                  href: "/about",
                  body: "shares our open-source MIT license and security contact details.",
                },
              ]}
            />
          </DocsSection>
        </DocsArticleLayout>
        <SiteFooter />
      </div>
    </main>
  );
}
