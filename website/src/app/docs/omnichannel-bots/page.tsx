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

export default function OmnichannelBotsDocsPage() {
  return (
    <main className="w-full min-h-screen bg-[#09090B] flex flex-col items-center overflow-x-hidden">
      <div className="box-border w-full h-fit flex flex-col gap-0 justify-start items-center bg-[#09090B] overflow-hidden">
        <RoadmapNavbar />
        <DocsArticleLayout
          activeSlug="omnichannel-bots"
          title="Omnichannel Bots"
          lede={
            <>
              Connect RICO to Telegram, WhatsApp and Slack. Receive 24/7 price spike alerts, inspect
              verified receipts, and approve, switch rails or cancel subscriptions in one tap from
              your phone.
            </>
          }
          outline={[
            { id: "supported-channels", label: "Supported channels" },
            { id: "interactive-spike-alerts", label: "Interactive spike alerts" },
            { id: "connecting-telegram-whatsapp", label: "Connecting Telegram & WhatsApp" },
            { id: "slack-workspace-alerts", label: "Slack workspace alerts" },
            { id: "where-to-go-next", label: "Where to go next" },
          ]}
          prevPager={{ title: "Models and keys", href: "/docs/models-and-keys" }}
          nextPager={{ title: "Privacy and security", href: "/docs/privacy-and-security" }}
        >
          <DocsSection id="supported-channels" title="Supported channels" first>
            <DocsParagraph>
              RICO dispatches real-time webhook events and interactive approval cards across three
              messaging channels so you never have to keep the web dashboard open to stay protected.
            </DocsParagraph>
            <DocsTable
              headers={["Channel", "Capabilities", "Setup Method"]}
              rows={[
                [
                  "Telegram Bot",
                  "Inline Approve / Switch Rail / Cancel buttons + receipt snapshots",
                  "Bot token + Chat ID in Settings › Channels",
                ],
                [
                  "WhatsApp Cloud",
                  "Instant spike notifications, weekly spend digests and quick replies",
                  "Webhook URL + Phone Number ID",
                ],
                [
                  "Slack App",
                  "Team channel alerts, manager approvals and SaaS audit summaries",
                  "Incoming Webhook + Interactive Callback URL",
                ],
              ]}
            />
          </DocsSection>

          <DocsSection id="interactive-spike-alerts" title="Interactive spike alerts">
            <DocsParagraph>
              When the 24/7 Price Sentinel detects a subscription price increase above your mandate
              ceiling (for example, Adobe Creative Cloud jumping from $35.00 to $54.99), RICO places
              the mandate on <code>ANOMALY_HOLD</code> and sends an interactive alert to your
              connected channels:
            </DocsParagraph>
            <DocsBullets
              items={[
                {
                  lead: "Approve Once.",
                  body: "Authorizes the single billing cycle at the new price while keeping your original ceiling for future months.",
                },
                {
                  lead: "Switch to Backup Card.",
                  body: "Routes the capture to your backup Visa or Mastercard rail in the Zero-Knowledge Vault.",
                },
                {
                  lead: "Cancel Subscription.",
                  body: "Pauses the mandate immediately and prevents any charge from executing.",
                },
              ]}
            />
            <DocsCallout title="Real-time two-way sync">
              Every tap on Telegram, WhatsApp or Slack immediately updates the AG Grid financial
              ledger and Audit Logs in your web Command Center.
            </DocsCallout>
          </DocsSection>

          <DocsSection
            id="connecting-telegram-whatsapp"
            title="Connecting Telegram & WhatsApp"
          >
            <DocsSteps
              steps={[
                {
                  lead: "Open Channels in Settings.",
                  body: "Navigate to Settings › Omnichannel Bots in the RICO WebApp.",
                },
                {
                  lead: "Link your bot or number.",
                  body: "Enter your Telegram Chat ID or scan the pairing QR code to bind your workspace.",
                },
                {
                  lead: "Send a test alert.",
                  body: "Click Test Spike Alert to verify that interactive Approve and Cancel buttons arrive on your phone.",
                },
              ]}
            />
          </DocsSection>

          <DocsSection id="slack-workspace-alerts" title="Slack workspace alerts">
            <DocsParagraph>
              For startups and finance teams, connect RICO to a dedicated <code>#finance-ops</code>{" "}
              Slack channel. Weekly spend summaries, claimed startup credits and high-value mandate
              approvals stream directly to your team.
            </DocsParagraph>
          </DocsSection>

          <DocsSection id="where-to-go-next" title="Where to go next">
            <DocsBullets
              items={[
                {
                  lead: "Privacy and security",
                  href: "/docs/privacy-and-security",
                  body: "explains webhook signature verification and Zero-Knowledge Vault isolation.",
                },
                {
                  lead: "Keyboard shortcuts",
                  href: "/docs/keyboard-shortcuts",
                  body: "lists every shortcut for managing mandates in the web Command Center.",
                },
                {
                  lead: "Workflows",
                  href: "/workflows",
                  body: "shows Omnichannel and Price Sentinel workflows in action.",
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
