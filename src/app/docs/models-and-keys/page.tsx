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

export default function ModelsAndKeysDocsPage() {
  return (
    <main className="w-full min-h-screen bg-[#09090B] flex flex-col items-center overflow-x-hidden">
      <div className="box-border w-full h-fit flex flex-col gap-0 justify-start items-center bg-[#09090B] overflow-hidden">
        <RoadmapNavbar />
        <DocsArticleLayout
          activeSlug="models-and-keys"
          title="Models and keys"
          lede={
            <>
              Start with RICO AI—1,000 free credits for your first month and 250 free credits every
              month after—or bring your own Gemini, Anthropic, OpenAI, Groq or local Ollama key for
              unlimited runs.
            </>
          }
          outline={[
            { id: "rico-ai-credits", label: "RICO AI & free credits" },
            { id: "supported-providers", label: "Supported model providers" },
            { id: "bring-your-own-key", label: "Bring your own key (BYOK)" },
            { id: "local-models", label: "Local models with Ollama" },
            { id: "where-to-go-next", label: "Where to go next" },
          ]}
          prevPager={{ title: "Mandates & Guardrails", href: "/docs/mandates-and-guardrails" }}
          nextPager={{ title: "Omnichannel Bots", href: "/docs/omnichannel-bots" }}
        >
          <DocsSection id="rico-ai-credits" title="RICO AI & free credits" first>
            <DocsParagraph>
              Every free RICO account starts with <strong>1,000 free credits</strong> in your first
              month and automatically refreshes with <strong>250 free credits every month</strong>{" "}
              after that at zero cost—no credit card required.
            </DocsParagraph>
            <DocsBullets
              items={[
                {
                  lead: "Zero setup.",
                  body: "RICO AI works out of the box in your browser for Ask RICO chat, Calm Pricing Lens and nightly Price Sentinel audits.",
                },
                {
                  lead: "API access included.",
                  body: "Every free account includes a personal RICO API token so you can trigger mandates from your own scripts and webhooks.",
                },
                {
                  lead: "Never billed automatically.",
                  body: "When your monthly credits finish, RICO pauses hosted AI runs cleanly or switches to your own API key if configured.",
                },
              ]}
            />
          </DocsSection>

          <DocsSection id="supported-providers" title="Supported model providers">
            <DocsParagraph>
              RICO is model-agnostic. You can switch between hosted RICO AI and your own provider
              keys at any time in Settings:
            </DocsParagraph>
            <DocsTable
              headers={["Provider", "Recommended Models", "Best For"]}
              rows={[
                [
                  "Google Gemini",
                  "Gemini 2.5 Pro / Flash",
                  "Fast tool calling, DOM price extraction and multi-tab comparisons",
                ],
                [
                  "Anthropic",
                  "Claude 3.7 Sonnet / Haiku",
                  "Complex SaaS contract analysis and Calm Pricing Lens",
                ],
                [
                  "OpenAI",
                  "GPT-4.1 / o3-mini",
                  "Structured JSON receipts and multi-step mandate planning",
                ],
                [
                  "Groq",
                  "Qwen 3.8 27B / Llama 3.3",
                  "Ultra-low-latency chat and instant savings probes",
                ],
                [
                  "Ollama (Local)",
                  "Llama 3.2 / Mistral",
                  "100% offline local reasoning on your own machine",
                ],
              ]}
            />
          </DocsSection>

          <DocsSection id="bring-your-own-key" title="Bring your own key (BYOK)">
            <DocsParagraph>
              Runs that use your own API key consume <strong>zero RICO platform credits</strong>. To
              add a key:
            </DocsParagraph>
            <DocsSteps
              steps={[
                {
                  lead: "Open Settings.",
                  body: (
                    <>
                      Press <DocsKbd>⌘</DocsKbd>
                      <DocsKbd>,</DocsKbd> or <DocsKbd>Ctrl</DocsKbd>
                      <DocsKbd>,</DocsKbd> and select <strong>Models &amp; Keys</strong>.
                    </>
                  ),
                },
                {
                  lead: "Paste your provider key.",
                  body: "Enter your Gemini, Anthropic, OpenAI or Groq API key and click Verify.",
                },
                {
                  lead: "Pick your default model.",
                  body: "Select which model powers Ask RICO chat and which model runs background Price Sentinel checks.",
                },
              ]}
            />
            <DocsCallout title="Keys are scoped to their provider">
              Your saved API key is encrypted at rest and is only ever sent directly to the model
              provider it was configured for.
            </DocsCallout>
          </DocsSection>

          <DocsSection id="local-models" title="Local models with Ollama">
            <DocsParagraph>
              When self-hosting RICO, point the model endpoint to your local Ollama server (
              <code>http://localhost:11434</code>) to run mandate reasoning and price extraction
              entirely on your own hardware.
            </DocsParagraph>
          </DocsSection>

          <DocsSection id="where-to-go-next" title="Where to go next">
            <DocsBullets
              items={[
                {
                  lead: "Omnichannel Bots",
                  href: "/docs/omnichannel-bots",
                  body: "connects RICO to Telegram, WhatsApp and Slack for mobile approvals.",
                },
                {
                  lead: "Privacy and security",
                  href: "/docs/privacy-and-security",
                  body: "explains how API keys and vault tokens are isolated per workspace.",
                },
                {
                  lead: "Pricing",
                  href: "/pricing",
                  body: "breaks down how the 1,000 first-month and 250 monthly free credits work.",
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
