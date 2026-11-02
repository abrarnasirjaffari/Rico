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
  DocsKbd,
} from "@/components/docs/DocsArticleLayout";

export default function AskRicoDocsPage() {
  return (
    <main className="w-full min-h-screen bg-[#09090B] flex flex-col items-center overflow-x-hidden">
      <div className="box-border w-full h-fit flex flex-col gap-0 justify-start items-center bg-[#09090B] overflow-hidden">
        <RoadmapNavbar />
        <DocsArticleLayout
          activeSlug="ask-rico"
          title="Ask RICO"
          lede={
            <>
              Ask RICO is the streaming financial assistant in the left sidebar. Write spending
              rules in plain words, probe startup or student discounts, and inspect generative
              receipts inline.
            </>
          }
          outline={[
            { id: "natural-language-mandates", label: "Natural-language mandates" },
            { id: "tool-calling-pipeline", label: "Tool-calling pipeline" },
            { id: "generative-ui-cards", label: "Generative UI cards" },
            { id: "persona-savings-probes", label: "Persona savings probes" },
            { id: "where-to-go-next", label: "Where to go next" },
          ]}
          prevPager={{ title: "Verification Engine", href: "/docs/verification-engine" }}
          nextPager={{ title: "Mandates & Guardrails", href: "/docs/mandates-and-guardrails" }}
        >
          <DocsSection id="natural-language-mandates" title="Natural-language mandates" first>
            <DocsParagraph>
              You do not need complex forms to set up recurring payments or price audits. Type what
              you want in Ask RICO or press <DocsKbd>⌘</DocsKbd>
              <DocsKbd>K</DocsKbd> from anywhere in the workspace.
            </DocsParagraph>
            <DocsBullets
              items={[
                {
                  lead: "Recurring bills.",
                  body: '"Pay Netflix Standard HD on the 5th of every month, keep the ceiling at $20, and alert me if the plan price changes."',
                },
                {
                  lead: "Multi-site comparison.",
                  body: '"Compare Stripe, AWS and PostHog pricing tiers for a 10-person team and strip out hidden fees."',
                },
                {
                  lead: "Discount enforcement.",
                  body: '"Audit my Spotify, Notion and GitHub Copilot mandates and switch every eligible plan to the Student tier."',
                },
              ]}
            />
          </DocsSection>

          <DocsSection id="tool-calling-pipeline" title="Tool-calling pipeline">
            <DocsParagraph>
              Every message in Ask RICO streams structured tool calls that update the Verification
              Viewport and AG Grid ledger in real time.
            </DocsParagraph>
            <DocsTable
              headers={["Tool", "Action", "Guardrail Check"]}
              rows={[
                [
                  "verifyMerchantPrice",
                  "Opens live URL in Playwright CDP and extracts current tier pricing",
                  "Compares extracted price vs. mandate ceiling",
                ],
                [
                  "probePersonaSavings",
                  "Checks Startup Credit Matrix ($50k PostHog/AWS) & 50% Student deals",
                  "Applies discount before payment capture",
                ],
                [
                  "executeVaultPayment",
                  "Authorizes scoped Zero-Knowledge Vault token on primary or backup rail",
                  "Halts on ANOMALY_HOLD if price > cap",
                ],
              ]}
            />
          </DocsSection>

          <DocsSection id="generative-ui-cards" title="Generative UI cards">
            <DocsParagraph>
              Instead of walls of text, Ask RICO renders interactive Generative UI cards directly in
              the conversation stream:
            </DocsParagraph>
            <DocsSteps
              steps={[
                {
                  lead: "Live Verification Card.",
                  body: "Displays the merchant URL, baseline price, live scraped price and percentage delta.",
                },
                {
                  lead: "Savings Advisory Card.",
                  body: "Shows side-by-side savings when a Student 50% discount, Startup credit or Annual arbitrage is found.",
                },
                {
                  lead: "Verified Receipt Card.",
                  body: "Renders the order ID, verified price vs. ceiling, vault rail used and timestamped proof snapshot.",
                },
              ]}
            />
            <DocsCallout title="Copy and export any response">
              Every response, receipt ID and comparison table written by Ask RICO can be selected,
              copied as Markdown, or exported to CSV from the ledger.
            </DocsCallout>
          </DocsSection>

          <DocsSection id="persona-savings-probes" title="Persona savings probes">
            <DocsParagraph>
              Switch your active persona in the top bar between <strong>Startup Founder</strong>,{" "}
              <strong>Student</strong> and <strong>SMB</strong>. Ask RICO automatically tailors its
              pre-checkout probes to claim $50,000 PostHog credits, $1,000 Notion perks or 50%
              education pricing before charging your wallet.
            </DocsParagraph>
          </DocsSection>

          <DocsSection id="where-to-go-next" title="Where to go next">
            <DocsBullets
              items={[
                {
                  lead: "Mandates & Guardrails",
                  href: "/docs/mandates-and-guardrails",
                  body: "covers hard budget ceilings, anomaly holds and Dual-Rail failover.",
                },
                {
                  lead: "Models and keys",
                  href: "/docs/models-and-keys",
                  body: "explains RICO AI credits and bringing your own Gemini, Claude or OpenAI key.",
                },
                {
                  lead: "Omnichannel Bots",
                  href: "/docs/omnichannel-bots",
                  body: "shows how to approve or cancel mandates from Telegram, WhatsApp and Slack.",
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
