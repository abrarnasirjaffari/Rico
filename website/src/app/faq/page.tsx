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
  FAQ_SIDENAV_ITEMS,
} from "@/components/docs/DocsArticleLayout";

export default function FAQPage() {
  return (
    <main className="w-full min-h-screen bg-[#09090B] flex flex-col items-center overflow-x-hidden">
      <div className="box-border w-full h-fit flex flex-col gap-0 justify-start items-center bg-[#09090B] overflow-hidden">
        <RoadmapNavbar />
        <DocsArticleLayout
          activeSlug="faq"
          sideNavHeading="Resources & FAQ"
          sideNavHeadingHref="/faq"
          sideNavItems={FAQ_SIDENAV_ITEMS}
          eyebrow={{ label: "Product", href: "/faq" }}
          title="Frequently Asked Questions"
          lede={
            <>
              Everything you need to know about RICO: the 30 FPS CDP verification viewport,
              Zero-Knowledge Vault security, deterministic budget ceilings, discount probes, and
              omnichannel bot integrations.
            </>
          }
          outline={[
            { id: "general-architecture", label: "General & Architecture" },
            { id: "verification-viewport", label: "Verification Viewport" },
            { id: "vault-and-security", label: "Vault & Security" },
            { id: "savings-and-mandates", label: "Savings & Mandates" },
            { id: "omnichannel-bots", label: "Omnichannel Bots" },
            { id: "open-source-self-hosting", label: "Open Source & Hosting" },
          ]}
          prevPager={{ title: "Support & Help", href: "/support" }}
          nextPager={{ title: "Documentation", href: "/docs" }}
        >
          <DocsSection id="general-architecture" title="General & Architecture" first>
            <DocsParagraph>
              <strong className="text-[#F4F4F6]">What is RICO?</strong>
              <br />
              RICO is an autonomous financial agent and payment workspace. Instead of manually
              tracking recurring software renewals, auditing invoice increases, or entering card
              numbers into dozens of websites, you define natural-language mandates with strict
              dollar ceilings. RICO verifies real merchant prices at 30 FPS, applies available promo
              codes, and handles renewals within your rules.
            </DocsParagraph>
            <DocsParagraph>
              <strong className="text-[#F4F4F6]">
                How is RICO different from auto-checkout browser extensions?
              </strong>
              <br />
              Browser extensions are passive and rely on brittle DOM regex matchers that frequently
              break when sites update. RICO runs headless Chrome DevTools Protocol (CDP) sessions with
              self-healing Stagehand vision agents, streams video frames directly into your viewport,
              and executes outside your personal browser tabs without tracking your daily browsing
              history.
            </DocsParagraph>
          </DocsSection>

          <DocsSection id="verification-viewport" title="Verification Viewport">
            <DocsParagraph>
              <strong className="text-[#F4F4F6]">
                How does RICO verify live merchant prices?
              </strong>
              <br />
              RICO launches a real headless Chromium instance, navigates to the merchant&apos;s checkout
              portal, and streams frames at 30 FPS. The agent reads the final line items, tax, and seat
              totals directly from the rendered DOM before any payment token is minted.
            </DocsParagraph>
            <DocsSteps
              steps={[
                {
                  lead: "Navigate & Render.",
                  body: "Headless Stagehand workers load the merchant checkout page in an isolated container.",
                },
                {
                  lead: "Strip Dark Patterns.",
                  body: "The Calm Pricing Lens removes fake countdown timers, hidden add-on pre-checks, and forced recurring toggles.",
                },
                {
                  lead: "Cryptographic Proof.",
                  body: "A visual snapshot of the final price is hashed and logged to your local SQLite ledger as immutable proof.",
                },
              ]}
            />
            <DocsParagraph>
              <strong className="text-[#F4F4F6]">What is Live Human Takeover?</strong>
              <br />
              If a merchant site requires an interactive SMS 2FA code, captcha, or complex custom
              plan builder, you can click anywhere on the live 30 FPS stream to take direct mouse and
              keyboard control without interrupting the agent&apos;s audit trail.
            </DocsParagraph>
          </DocsSection>

          <DocsSection id="vault-and-security" title="Vault & Security">
            <DocsParagraph>
              <strong className="text-[#F4F4F6]">
                Can the AI model see my credit card numbers or CVV?
              </strong>
              <br />
              Never. Your raw 16-digit cards, expiration dates, and CVVs are tokenized in a
              Zero-Knowledge Vault. The language model only receives an opaque, single-merchant
              transient token (such as <code>vault_tok_linear_8a2b</code>) that is mathematically
              incapable of authorizing charges over your mandate cap.
            </DocsParagraph>
            <DocsCallout title="Hard deterministic dollar ceilings">
              Budget limits are enforced in strict TypeScript code outside the LLM. If a merchant
              attempts to bill $20.01 on a $20.00 ceiling, the vault hardware rejects the transaction
              automatically.
            </DocsCallout>
          </DocsSection>

          <DocsSection id="savings-and-mandates" title="Savings & Mandates">
            <DocsParagraph>
              <strong className="text-[#F4F4F6]">
                How do Startup and Student savings probes work?
              </strong>
              <br />
              Prior to confirming any SaaS checkout or recurring invoice, RICO probes active promo
              inventories, student discounts (such as 50% off Spotify, GitHub Student Developer Pack),
              and startup programs (like AWS Activate, PostHog, or Segment credits). If eligible,
              the discount code is applied directly into the merchant field.
            </DocsParagraph>
            <DocsTable
              headers={["Merchant Category", "Probe Type", "Typical Savings"]}
              rows={[
                [
                  "Developer Tools",
                  "Startup Credit Pools & Founders Club",
                  "$5,000 – $50,000 in cloud credits",
                ],
                [
                  "Productivity SaaS",
                  "Annual Prepay & Multi-Seat Tiering",
                  "15% – 25% base discount",
                ],
                [
                  "Media & Subscriptions",
                  ".EDU & Student Verification",
                  "50% off monthly subscription fees",
                ],
              ]}
            />
          </DocsSection>

          <DocsSection id="omnichannel-bots" title="Omnichannel Bots">
            <DocsParagraph>
              <strong className="text-[#F4F4F6]">
                Can I approve or cancel payments from Telegram, WhatsApp, or Slack?
              </strong>
              <br />
              Yes. Connect RICO to your messaging channels via our encrypted webhook bots. When an
              upcoming renewal approaches or a price increases, RICO sends an alert containing the live
              price diff and verification screenshot, with interactive buttons:
            </DocsParagraph>
            <DocsBullets
              items={[
                {
                  lead: "Approve 1-Tap.",
                  body: "Authorizes the single-use vault token for the specific merchant run.",
                },
                {
                  lead: "Inspect Frame.",
                  body: "Opens the full high-resolution CDP screenshot directly in chat.",
                },
                {
                  lead: "Emergency Pause.",
                  body: (
                    <>
                      Send <code>/freeze</code> to immediately pause all active mandates across your
                      entire workspace.
                    </>
                  ),
                },
              ]}
            />
          </DocsSection>

          <DocsSection id="open-source-self-hosting" title="Open Source & Hosting">
            <DocsParagraph>
              <strong className="text-[#F4F4F6]">Is RICO free and open source?</strong>
              <br />
              Yes! RICO is 100% open source under the permissive MIT License. You can inspect the
              entire source code on GitHub, contribute pull requests, and self-host on your own Mac,
              Linux, or Windows machine without paying any software licensing fee.
            </DocsParagraph>
            <DocsParagraph>
              <strong className="text-[#F4F4F6]">Can I use my own LLM API keys?</strong>
              <br />
              Absolutely. RICO supports Bring Your Own Key (BYOK) for Google Gemini, Anthropic
              Claude, OpenAI GPT-4o, Groq, and local Ollama or vLLM instances. Your API keys are
              stored securely in your local environment and never sent to our servers.
            </DocsParagraph>
          </DocsSection>
        </DocsArticleLayout>
        <SiteFooter />
      </div>
    </main>
  );
}