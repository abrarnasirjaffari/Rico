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
  SUPPORT_SIDENAV_ITEMS,
} from "@/components/docs/DocsArticleLayout";

export default function SupportPage() {
  return (
    <main className="w-full min-h-screen bg-[#09090B] flex flex-col items-center overflow-x-hidden">
      <div className="box-border w-full h-fit flex flex-col gap-0 justify-start items-center bg-[#09090B] overflow-hidden">
        <RoadmapNavbar />
        <DocsArticleLayout
          activeSlug="support"
          sideNavHeading="Resources & Support"
          sideNavHeadingHref="/support"
          sideNavItems={SUPPORT_SIDENAV_ITEMS}
          eyebrow={{ label: "Resources", href: "/support" }}
          title="Support & Help"
          lede={
            <>
              Need assistance with autonomous mandates, headless CDP verification viewports, or
              enterprise cluster deployments? Explore our support channels, SLAs, and emergency
              freeze procedures below.
            </>
          }
          outline={[
            { id: "support-channels", label: "Support channels" },
            { id: "response-slas", label: "Response SLAs" },
            { id: "emergency-freeze", label: "Emergency killswitch" },
            { id: "reporting-issues", label: "Reporting bugs & logs" },
            { id: "billing-inquiries", label: "Billing & credits" },
            { id: "security-disclosure", label: "Security disclosures" },
          ]}
          prevPager={{ title: "Documentation", href: "/docs" }}
          nextPager={{ title: "Frequently Asked Questions", href: "/faq" }}
        >
          <DocsSection id="support-channels" title="Support channels" first>
            <DocsParagraph>
              Whether you are troubleshooting a self-hosted Stagehand instance or managing high-volume
              treasury mandates, we provide multiple direct avenues for assistance:
            </DocsParagraph>
            <DocsTable
              headers={["Channel", "Audience", "Availability & Focus"]}
              rows={[
                [
                  "Community Discord",
                  "All users & developers",
                  "24/7 community peer support, workflow tips & discussions",
                ],
                [
                  "GitHub Issues",
                  "Open source contributors",
                  "Bug reports, feature requests, pull requests & code review",
                ],
                [
                  "Email Desk (support@rico.app)",
                  "Pro & Cloud users",
                  "Account issues, billing inquiries, mandate errors (12h response)",
                ],
                [
                  "Dedicated Shared Slack",
                  "Enterprise & Commercial",
                  "Real-time maintainer channel, priority SLA, custom triage (1h response)",
                ],
              ]}
            />
          </DocsSection>

          <DocsSection id="response-slas" title="Response SLAs">
            <DocsParagraph>
              Our support team is distributed across North America, Europe, and Asia Pacific to
              ensure consistent global coverage:
            </DocsParagraph>
            <DocsBullets
              items={[
                {
                  lead: "Community Tier (Free / OSS):",
                  body: "Best-effort response via GitHub Discussions and Discord channels.",
                },
                {
                  lead: "Pro Tier ($49/mo):",
                  body: "Guaranteed initial response within 12 business hours via email with priority ticket routing.",
                },
                {
                  lead: "Enterprise Tier:",
                  body: "Guaranteed 1-hour response for critical (P1) incidents, 4-hour response for standard tickets, and a dedicated Customer Success Engineer.",
                },
              ]}
            />
          </DocsSection>

          <DocsSection id="emergency-freeze" title="Emergency killswitch">
            <DocsParagraph>
              If you suspect an errant mandate, unexpected price spike, or need to halt all active
              browser workers immediately, you have three zero-latency mechanisms:
            </DocsParagraph>
            <DocsSteps
              steps={[
                {
                  lead: "Command Center Killswitch.",
                  body: (
                    <>
                      Press <DocsKbd>⌘</DocsKbd> + <DocsKbd>K</DocsKbd> (or <DocsKbd>Ctrl</DocsKbd> +{" "}
                      <DocsKbd>K</DocsKbd>) to open the command palette and type{" "}
                      <code>Emergency Pause All</code>.
                    </>
                  ),
                },
                {
                  lead: "Omnichannel Bot Command.",
                  body: (
                    <>
                      Send <code>/freeze</code> to your configured Telegram, WhatsApp, or Slack bot to
                      revoke all active execution tokens instantly.
                    </>
                  ),
                },
                {
                  lead: "CLI Local Killswitch.",
                  body: (
                    <>
                      In your terminal, run <code>rico mandate pause --all</code> to terminate all
                      local headless CDP processes and lock SQLite records.
                    </>
                  ),
                },
              ]}
            />
            <DocsCallout title="Vault revocation is atomic">
              Freezing active mandates immediately invalidates any transient merchant tokens in the
              Zero-Knowledge Vault, preventing further charges even if checkout forms were partially
              filled.
            </DocsCallout>
          </DocsSection>

          <DocsSection id="reporting-issues" title="Reporting bugs & logs">
            <DocsParagraph>
              To help us resolve issues quickly, please include sanitized diagnostics when opening a
              support ticket or GitHub issue:
            </DocsParagraph>
            <DocsBullets
              items={[
                {
                  lead: "RICO Version.",
                  body: (
                    <>
                      Run <code>rico --version</code> or check the footer badge in WebApp settings.
                    </>
                  ),
                },
                {
                  lead: "Diagnostic bundle.",
                  body: (
                    <>
                      Export sanitized logs using <code>rico logs export --sanitize</code> (this
                      automatically redacts tokens and emails).
                    </>
                  ),
                },
                {
                  lead: "Verification snapshot ID.",
                  body: "If a merchant price extraction failed, provide the 8-character verification run ID (e.g. run_9x8f).",
                },
              ]}
            />
          </DocsSection>

          <DocsSection id="billing-inquiries" title="Billing & credits">
            <DocsParagraph>
              Have questions about your monthly 1,000 onboarding credits, 250 monthly refresh balance,
              or purchasing additional CDP streaming minutes? Contact{" "}
              <a
                href="mailto:billing@rico.app"
                className="text-[#F4F4F6] underline decoration-[#FFFFFF33] hover:decoration-white"
              >
                billing@rico.app
              </a>{" "}
              with your workspace ID.
            </DocsParagraph>
          </DocsSection>

          <DocsSection id="security-disclosure" title="Security disclosures">
            <DocsParagraph>
              We take the security of autonomous payment execution with utmost seriousness. If you
              have identified a potential vulnerability in our vault tokenization, CDP browser
              sandbox, or authentication rails, please review our Coordinated Vulnerability Disclosure
              policy.
            </DocsParagraph>
            <DocsParagraph>
              Email encrypted reports to{" "}
              <a
                href="mailto:security@rico.app"
                className="text-[#F4F4F6] underline decoration-[#FFFFFF33] hover:decoration-white"
              >
                security@rico.app
              </a>
              . We acknowledge all security reports within 12 hours and operate a bug bounty program
              for qualified submissions.
            </DocsParagraph>
          </DocsSection>
        </DocsArticleLayout>
        <SiteFooter />
      </div>
    </main>
  );
}