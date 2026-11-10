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

export default function VerificationEngineDocsPage() {
  return (
    <main className="w-full min-h-screen bg-[#09090B] flex flex-col items-center overflow-x-hidden">
      <div className="box-border w-full h-fit flex flex-col gap-0 justify-start items-center bg-[#09090B] overflow-hidden">
        <RoadmapNavbar />
        <DocsArticleLayout
          activeSlug="verification-engine"
          title="Verification Engine"
          lede={
            <>
              RICO verifies every live merchant price on a real headless browser canvas before
              capturing payment. Watch at 30 FPS, strip dark patterns with Calm Pricing Lens, or
              step in with Live Human Takeover.
            </>
          }
          outline={[
            { id: "live-viewport", label: "30 FPS CDP viewport" },
            { id: "parallel-helpers", label: "Parallel Helper Bots" },
            {
              id: "calm-pricing-lens",
              label: (
                <>
                  Calm Pricing Lens &amp;
                  <br />
                  dark patterns
                </>
              ),
            },
            { id: "human-takeover", label: "Live Human Takeover" },
            { id: "proof-snapshots", label: "Cryptographic proof" },
            { id: "where-to-go-next", label: "Where to go next" },
          ]}
          prevPager={{ title: "Getting started", href: "/docs/getting-started" }}
          nextPager={{ title: "Ask RICO", href: "/docs/ask-rico" }}
        >
          <DocsSection id="live-viewport" title="30 FPS CDP viewport" first>
            <DocsParagraph>
              Instead of relying on stale API caches or brittle regex scrapers, RICO launches an
              isolated Playwright + Stagehand browser session and streams frames over Chrome
              DevTools Protocol (CDP) at 30 FPS directly into the right-hand Verification Viewport.
            </DocsParagraph>
            <DocsTable
              headers={["Component", "Technology", "Purpose"]}
              rows={[
                [
                  "Screencast Stream",
                  "Playwright CDP",
                  "Real-time 30 FPS visual feed of the live merchant checkout",
                ],
                [
                  "Action Engine",
                  "Stagehand SDK",
                  "Self-healing natural-language DOM navigation and extraction",
                ],
                [
                  "Price Extractor",
                  "Gemini Structured Output",
                  "Parses base rate, taxes, seat minimums and billing cycle",
                ],
              ]}
            />
            <DocsCallout title="Every verification happens in plain sight">
              You can watch the agent navigate to the merchant pricing page, highlight the plan tier
              and compare the extracted figure against your mandate ceiling before any token is
              authorized.
            </DocsCallout>
          </DocsSection>

          <DocsSection id="parallel-helpers" title="Parallel Helper Bots">
            <DocsParagraph>
              When you ask RICO to compare multiple SaaS tools or audit several subscriptions at
              once, RICO dispatches up to three concurrent helper workers in parallel tabs.
            </DocsParagraph>
            <DocsSteps
              steps={[
                {
                  lead: "Spawn workers.",
                  body: "Each merchant URL opens in an isolated browser context with its own tab pill in the viewport header.",
                },
                {
                  lead: "Extract tiers.",
                  body: "Helpers simultaneously scrape base price, per-seat minimums, annual discounts and overage fees.",
                },
                {
                  lead: "Synthesize comparison.",
                  body: "Results merge into a single normalized comparison card in chat and update the AG Grid ledger.",
                },
              ]}
            />
          </DocsSection>

          <DocsSection id="calm-pricing-lens" title="Calm Pricing Lens">
            <DocsParagraph>
              Modern SaaS pricing pages hide true costs behind fake countdown timers, pre-checked
              add-ons, per-seat minimums and confusing annual/monthly toggles. Calm Pricing Lens
              strips the noise away.
            </DocsParagraph>
            <DocsBullets
              items={[
                {
                  lead: "True monthly cost.",
                  body: "Converts 'billed annually' headline numbers into the actual monthly charge hitting your card.",
                },
                {
                  lead: "Seat minimum detection.",
                  body: "Flags plans that advertise a single-user price but enforce a 3-seat or 5-seat minimum at checkout.",
                },
                {
                  lead: "Add-on stripping.",
                  body: "Automatically unchecks optional priority support or AI add-on bundles unless explicitly requested.",
                },
              ]}
            />
          </DocsSection>

          <DocsSection id="human-takeover" title="Live Human Takeover">
            <DocsParagraph>
              If a merchant checkout triggers a 2FA code, passkey prompt or CAPTCHA challenge, RICO
              never guesses or loops. It pauses the mandate run and opens the interactive Takeover
              Challenge modal.
            </DocsParagraph>
            <DocsSteps
              steps={[
                {
                  lead: "Challenge detected.",
                  body: "The viewport highlights the 2FA or CAPTCHA prompt and pauses autonomous execution.",
                },
                {
                  lead: "Click Takeover.",
                  body: (
                    <>
                      Interact directly with the live stream or press <DocsKbd>⌘</DocsKbd>
                      <DocsKbd>⇧</DocsKbd>
                      <DocsKbd>T</DocsKbd> to type your 2FA code.
                    </>
                  ),
                },
                {
                  lead: "Resume mandate.",
                  body: "Once verified, hand control back to RICO to complete the ceiling check and capture the receipt.",
                },
              ]}
            />
          </DocsSection>

          <DocsSection id="proof-snapshots" title="Cryptographic proof snapshots">
            <DocsParagraph>
              Before any payment executes, RICO captures a timestamped DOM + visual screenshot proof
              snapshot of the checkout total. The snapshot hash is stored alongside the order ID in
              SQLite and attached to your generative receipt card.
            </DocsParagraph>
          </DocsSection>

          <DocsSection id="where-to-go-next" title="Where to go next">
            <DocsBullets
              items={[
                {
                  lead: "Ask RICO",
                  href: "/docs/ask-rico",
                  body: "shows how to trigger verification runs and savings probes from chat.",
                },
                {
                  lead: "Mandates & Guardrails",
                  href: "/docs/mandates-and-guardrails",
                  body: "explains strict budget ceilings and 24/7 Price Sentinel holds.",
                },
                {
                  lead: "Privacy and security",
                  href: "/docs/privacy-and-security",
                  body: "details how Zero-Knowledge Vault tokens keep raw card numbers hidden.",
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
