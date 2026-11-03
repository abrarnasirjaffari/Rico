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
  LEGAL_SIDENAV_ITEMS,
} from "@/components/docs/DocsArticleLayout";

export default function TermsOfServicePage() {
  return (
    <main className="w-full min-h-screen bg-[#09090B] flex flex-col items-center overflow-x-hidden">
      <div className="box-border w-full h-fit flex flex-col gap-0 justify-start items-center bg-[#09090B] overflow-hidden">
        <RoadmapNavbar />
        <DocsArticleLayout
          activeSlug="terms"
          sideNavHeading="Legal & Compliance"
          sideNavHeadingHref="/terms"
          sideNavItems={LEGAL_SIDENAV_ITEMS}
          eyebrow={{ label: "Legal", href: "/terms" }}
          title="Terms of Service"
          lede={
            <>
              These terms govern your use of the RICO WebApp, CLI, verification engine, and
              autonomous payment orchestration agents. By connecting payment rails or configuring
              mandates, you agree to these conditions.
            </>
          }
          outline={[
            { id: "acceptance-of-terms", label: "Acceptance & scope" },
            { id: "autonomous-mandates", label: "Agent mandate authority" },
            { id: "budget-ceilings", label: "Budget ceilings & limits" },
            { id: "prohibited-activities", label: "Acceptable use policy" },
            { id: "third-party-providers", label: "Third-party LLMs & rails" },
            { id: "liability-disclaimer", label: "Warranty & liability" },
            { id: "disputes-governance", label: "Governing law & disputes" },
          ]}
          prevPager={{ title: "Privacy Policy", href: "/privacy" }}
          nextPager={{ title: "Commercial Licensing", href: "/commercial-licensing" }}
        >
          <DocsSection id="acceptance-of-terms" title="Acceptance & scope" first>
            <DocsParagraph>
              Welcome to RICO. These Terms of Service (&quot;Terms&quot;) constitute a legally binding
              agreement between you (&quot;User&quot; or &quot;Organization&quot;) and RICO (&quot;we&quot; or
              &quot;the Project&quot;). These terms govern access to the open-source client binaries, the
              hosted cloud dashboard, and the headless Verification Viewport runtime.
            </DocsParagraph>
            <DocsParagraph>
              If you are accepting these Terms on behalf of a company, partnership, or enterprise
              entity, you represent and warrant that you possess full corporate authority to bind that
              organization to these terms.
            </DocsParagraph>
          </DocsSection>

          <DocsSection id="autonomous-mandates" title="Agent mandate authority">
            <DocsParagraph>
              RICO operates on deterministic natural-language mandates. When you instruct RICO to
              monitor, negotiate, or renew a merchant service:
            </DocsParagraph>
            <DocsSteps
              steps={[
                {
                  lead: "Explicit delegation.",
                  body: "You grant RICO permission to navigate public web pages, extract merchant pricing structures, and test eligible discount codes on your behalf.",
                },
                {
                  lead: "Verified comparison.",
                  body: "Before issuing any payment authorization, RICO must verify that the merchant total is less than or equal to your configured budget ceiling.",
                },
                {
                  lead: "Human takeover reserve.",
                  body: "You retain the permanent right to pause any run, inspect live browser frames, or engage Live Human Takeover at any point during checkout.",
                },
              ]}
            />
            <DocsCallout title="Approval modes define autonomy">
              In &quot;Strict Manual Mode,&quot; RICO will never capture payment without an explicit one-tap
              confirmation from your Telegram, Slack, or WebApp session.
            </DocsCallout>
          </DocsSection>

          <DocsSection id="budget-ceilings" title="Budget ceilings & limits">
            <DocsParagraph>
              Deterministic code checks prevent payments from exceeding user-defined caps. The
              following limits apply across all mandate tiers:
            </DocsParagraph>
            <DocsTable
              headers={["Tier / Plan", "Max Single Transaction", "Concurrent Helper Bots", "Approval Model"]}
              rows={[
                [
                  "Open Source / Community",
                  "User-defined local limit",
                  "Up to 3 Stagehand browser instances",
                  "Local biometric / passkey or WebApp prompt",
                ],
                [
                  "RICO Cloud Pro",
                  "$2,500.00 / mandate default",
                  "Up to 5 concurrent browser workers",
                  "Omnichannel (Telegram/Slack) or 1-tap web",
                ],
                [
                  "Enterprise Custom",
                  "Configurable corporate limits",
                  "Dedicated worker cluster pool",
                  "Multi-sig dual CFO sign-off support",
                ],
              ]}
            />
          </DocsSection>

          <DocsSection id="prohibited-activities" title="Acceptable use policy">
            <DocsParagraph>
              You agree not to configure mandates or use RICO for any unlawful or abusive activities,
              including but not limited to:
            </DocsParagraph>
            <DocsBullets
              items={[
                {
                  lead: "Credential stuffing.",
                  body: "Using automated bots to brute-force merchant login portals or access unauthorized accounts.",
                },
                {
                  lead: "Denial of service.",
                  body: "Directing high-frequency crawler requests against small merchant services in violation of standard robots.txt conventions.",
                },
                {
                  lead: "Sanction evasion.",
                  body: "Transacting with sanctioned entities or jurisdictions prohibited by OFAC, the European Union, or applicable international law.",
                },
                {
                  lead: "Payment fraud.",
                  body: "Authorizing charges against stolen cards, virtual account numbers without backing funds, or abusive chargeback cycling.",
                },
              ]}
            />
          </DocsSection>

          <DocsSection id="third-party-providers" title="Third-party LLMs & rails">
            <DocsParagraph>
              RICO connects with external foundation models (such as Google Gemini, Anthropic Claude,
              OpenAI, and Groq) and card issuing rails (including Stripe, Visa, and Mastercard). Your
              usage of these external APIs is subject to the respective provider&apos;s Acceptable Use
              Policies and terms of service.
            </DocsParagraph>
          </DocsSection>

          <DocsSection id="liability-disclaimer" title="Warranty & liability">
            <DocsParagraph>
              EXCEPT WHERE PROHIBITED BY APPLICABLE LAW, THE SOFTWARE AND HOSTED SERVICES ARE PROVIDED
              &quot;AS IS&quot; AND &quot;AS AVAILABLE,&quot; WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED. IN NO
              EVENT SHALL THE DEVELOPERS OR CONTRIBUTORS BE LIABLE FOR ANY INDIRECT, SPECIAL,
              PUNITIVE, INCIDENTAL, OR CONSEQUENTIAL DAMAGES ARISING OUT OF THIRD-PARTY MERCHANT
              PRICE MODIFICATIONS, DOM STRUCTURE CHANGES, OR NETWORK TIMEOUTS.
            </DocsParagraph>
          </DocsSection>

          <DocsSection id="disputes-governance" title="Governing law & disputes">
            <DocsParagraph>
              These Terms are governed by and construed in accordance with the laws of the State of
              Delaware, without regard to conflict of law principles. Any legal suit, action, or
              proceeding arising out of or related to these Terms shall be instituted exclusively in
              the federal or state courts located in Delaware.
            </DocsParagraph>
            <DocsParagraph>
              If you have questions regarding these terms, reach out to our legal affairs desk at{" "}
              <a
                href="mailto:legal@rico.app"
                className="text-[#F4F4F6] underline decoration-[#FFFFFF33] hover:decoration-white"
              >
                legal@rico.app
              </a>
              .
            </DocsParagraph>
          </DocsSection>
        </DocsArticleLayout>
        <SiteFooter />
      </div>
    </main>
  );
}