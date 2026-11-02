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

export default function MandatesAndGuardrailsDocsPage() {
  return (
    <main className="w-full min-h-screen bg-[#09090B] flex flex-col items-center overflow-x-hidden">
      <div className="box-border w-full h-fit flex flex-col gap-0 justify-start items-center bg-[#09090B] overflow-hidden">
        <RoadmapNavbar />
        <DocsArticleLayout
          activeSlug="mandates-and-guardrails"
          title="Mandates & Guardrails"
          lede={
            <>
              A mandate is a recurring spending rule bound to a strict dollar ceiling. RICO verifies
              the live price before every run, blocks unexpected price spikes, and logs every
              capture in AG Grid.
            </>
          }
          outline={[
            { id: "how-mandates-work", label: "How mandates work" },
            { id: "budget-ceilings", label: "Strict budget ceilings" },
            { id: "price-sentinel", label: "24/7 Price Sentinel" },
            { id: "dual-rail-failover", label: "Dual-Rail auto failover" },
            { id: "approval-modes", label: "Approval modes" },
            { id: "where-to-go-next", label: "Where to go next" },
          ]}
          prevPager={{ title: "Ask RICO", href: "/docs/ask-rico" }}
          nextPager={{ title: "Models and keys", href: "/docs/models-and-keys" }}
        >
          <DocsSection id="how-mandates-work" title="How mandates work" first>
            <DocsParagraph>
              Every mandate in RICO pairs a merchant URL and billing schedule with a hard budget
              ceiling. Mandates are stored persistently in SQLite and displayed in the interactive
              AG Grid financial ledger.
            </DocsParagraph>
            <DocsSteps
              steps={[
                {
                  lead: "Define the rule.",
                  body: "Specify the merchant, plan tier, billing frequency (monthly or annual) and maximum dollar cap.",
                },
                {
                  lead: "Pre-billing verification.",
                  body: "Before billing day, RICO opens the live merchant page at 30 FPS to verify the current price.",
                },
                {
                  lead: "Execute or hold.",
                  body: "If the verified price is within your ceiling, the payment executes via your tokenized vault rail; if it exceeds your cap, RICO halts immediately.",
                },
              ]}
            />
          </DocsSection>

          <DocsSection id="budget-ceilings" title="Strict budget ceilings">
            <DocsParagraph>
              Your budget ceiling is enforced deterministically outside the LLM. Even if a merchant
              raises their subscription price by $0.01 above your ceiling, RICO blocks automatic
              capture and transitions the mandate to <code>ANOMALY_HOLD</code>.
            </DocsParagraph>
            <DocsTable
              headers={["Status", "Trigger Condition", "Agent Behavior"]}
              rows={[
                [
                  "ACTIVE",
                  "Verified price ≤ Mandate ceiling",
                  "Executes payment and logs verified receipt",
                ],
                [
                  "ANOMALY_HOLD",
                  "Verified price > Mandate ceiling",
                  "Halts payment and dispatches spike alert to chat & mobile",
                ],
                [
                  "PAUSED",
                  "User paused mandate in UI or chat",
                  "Skips all scheduled background runs until resumed",
                ],
              ]}
            />
            <DocsCallout title="Zero surprise charges">
              A price spike can never auto-capture. When a mandate enters ANOMALY_HOLD, you choose
              whether to approve the new price once, raise your ceiling, or cancel the subscription.
            </DocsCallout>
          </DocsSection>

          <DocsSection id="price-sentinel" title="24/7 Price Sentinel">
            <DocsParagraph>
              The 24/7 Price Sentinel background worker audits your active subscriptions every night
              against their baseline prices. If Adobe Creative Cloud jumps from $35.00 to $54.99
              (+57%), Price Sentinel catches the hike before your billing date arrives.
            </DocsParagraph>
          </DocsSection>

          <DocsSection id="dual-rail-failover" title="Dual-Rail auto failover">
            <DocsParagraph>
              RICO supports a primary wallet rail alongside a backup Visa or Mastercard rail in the
              Zero-Knowledge Vault. If a merchant rejects virtual wallet tokens or requires direct
              card billing, RICO automatically fails over to your backup rail while keeping raw card
              numbers hidden from the AI.
            </DocsParagraph>
          </DocsSection>

          <DocsSection id="approval-modes" title="Approval modes">
            <DocsBullets
              items={[
                {
                  lead: "Autonomous mode.",
                  body: "Mandates execute automatically whenever the verified live price is at or below your strict dollar ceiling.",
                },
                {
                  lead: "Strict Manual Approval mode.",
                  body: "Every run pauses after price verification and waits for your 1-tap approval in the Command Center, Telegram, WhatsApp or Slack.",
                },
              ]}
            />
          </DocsSection>

          <DocsSection id="where-to-go-next" title="Where to go next">
            <DocsBullets
              items={[
                {
                  lead: "Models and keys",
                  href: "/docs/models-and-keys",
                  body: "explains RICO AI credits and connecting your own LLM API keys.",
                },
                {
                  lead: "Omnichannel Bots",
                  href: "/docs/omnichannel-bots",
                  body: "shows how to receive ANOMALY_HOLD alerts on Telegram, WhatsApp and Slack.",
                },
                {
                  lead: "Privacy and security",
                  href: "/docs/privacy-and-security",
                  body: "details Zero-Knowledge Vault tokenization and audit logging.",
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
