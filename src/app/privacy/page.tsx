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

export default function PrivacyPolicyPage() {
  return (
    <main className="w-full min-h-screen bg-[#09090B] flex flex-col items-center overflow-x-hidden">
      <div className="box-border w-full h-fit flex flex-col gap-0 justify-start items-center bg-[#09090B] overflow-hidden">
        <RoadmapNavbar />
        <DocsArticleLayout
          activeSlug="privacy"
          sideNavHeading="Legal & Compliance"
          sideNavHeadingHref="/privacy"
          sideNavItems={LEGAL_SIDENAV_ITEMS}
          eyebrow={{ label: "Legal", href: "/privacy" }}
          title="Privacy Policy"
          lede={
            <>
              RICO is engineered around a Zero-Knowledge Vault architecture. Autonomous AI models
              never see or store your raw payment details, and all mandate verifications occur within
              isolated sandbox environments.
            </>
          }
          outline={[
            { id: "core-principles", label: "Core principles" },
            { id: "data-collection", label: "Data we collect & skip" },
            { id: "vault-architecture", label: "Zero-Knowledge Vault" },
            { id: "browser-isolation", label: "Browser session sandbox" },
            { id: "telemetry", label: "Telemetry & diagnostics" },
            { id: "user-rights", label: "GDPR & CCPA rights" },
            { id: "contact-privacy", label: "Contact privacy team" },
          ]}
          prevPager={{ title: "Documentation", href: "/docs" }}
          nextPager={{ title: "Terms of Service", href: "/terms" }}
        >
          <DocsSection id="core-principles" title="Core principles" first>
            <DocsParagraph>
              At RICO, we believe autonomous financial agents must be private by default. Unlike
              traditional assistants that pass unstructured credentials into prompt context windows,
              RICO strictly isolates model inference from card credentials, tokens, and bank rails.
            </DocsParagraph>
            <DocsBullets
              items={[
                {
                  lead: "Zero Model Exposure.",
                  body: "LLMs never receive raw 16-digit credit card numbers, CVVs, or bank routing passwords.",
                },
                {
                  lead: "Cryptographic Scoping.",
                  body: "Every checkout authorization is bound to an opaque single-merchant token valid only for a verified budget ceiling.",
                },
                {
                  lead: "Local-First Retention.",
                  body: "Self-hosted deployments maintain full data sovereignty inside your own local SQLite database without cloud egress.",
                },
              ]}
            />
          </DocsSection>

          <DocsSection id="data-collection" title="Data we collect & skip">
            <DocsParagraph>
              We deliberately minimize the metadata needed to execute recurring mandates and verify
              merchant rates.
            </DocsParagraph>
            <DocsTable
              headers={["Category", "Data Handled", "Retention Policy"]}
              rows={[
                [
                  "Account & Profile",
                  "GitHub/Email identifier, workspace name",
                  "Retained for active account duration; deleted on purge",
                ],
                [
                  "Payment Credentials",
                  "Opaque vault token references (e.g. vault_tok_*)",
                  "Encrypted with AES-256-GCM; raw credentials never stored by RICO",
                ],
                [
                  "Mandate Rules",
                  "Ceiling amounts, renewal cycles, merchant domains",
                  "Stored in encrypted SQLite ledger; portable export available",
                ],
                [
                  "Browser Proofs",
                  "SHA-256 price snapshot hash & timestamp",
                  "Archived for audit history until manually purged by user",
                ],
              ]}
            />
          </DocsSection>

          <DocsSection id="vault-architecture" title="Zero-Knowledge Vault">
            <DocsParagraph>
              When you configure a payment method in RICO WebApp or the CLI, the credentials pass
              directly to our PCI-DSS Level 1 compliant vault or your own private hardware security
              module (HSM). The agent receives only a transient token.
            </DocsParagraph>
            <DocsCallout title="Hardware and model blindness">
              Even in the theoretical event of a prompt injection attack from an untrusted merchant
              site, the model has zero cryptographic access to payment instruments or funds outside
              your strict dollar ceiling.
            </DocsCallout>
          </DocsSection>

          <DocsSection id="browser-isolation" title="Browser session sandbox">
            <DocsParagraph>
              RICO launches headless Chrome DevTools Protocol (CDP) sessions with Stagehand to verify
              prices in real time:
            </DocsParagraph>
            <DocsSteps
              steps={[
                {
                  lead: "Ephemeral container.",
                  body: "Each merchant verification runs in an isolated browser context with sandboxed cookies and state.",
                },
                {
                  lead: "DOM Sanitization.",
                  body: "Input forms, autofill attributes, and private session cookies are scrubbed prior to frame rendering.",
                },
                {
                  lead: "Proof snapshot hashing.",
                  body: "A visual proof of the verified checkout price is hashed with SHA-256, verified against the mandate cap, and then closed.",
                },
              ]}
            />
          </DocsSection>

          <DocsSection id="telemetry" title="Telemetry & diagnostics">
            <DocsParagraph>
              RICO uses self-hostable PostHog for minimal operational telemetry (app launches, error
              rates, and latency metrics). We do not record keystrokes, personal names, mandate
              descriptions, or transaction dollar values in telemetry streams. Telemetry can be
              disabled at any time via the settings toggle or by exporting{" "}
              <code>RICO_TELEMETRY=0</code> in your environment.
            </DocsParagraph>
          </DocsSection>

          <DocsSection id="user-rights" title="GDPR & CCPA rights">
            <DocsParagraph>
              Under global privacy regulations including GDPR (Articles 15-22) and CCPA/CPRA, you
              have the right to:
            </DocsParagraph>
            <DocsBullets
              items={[
                {
                  lead: "Right to access & export.",
                  body: "Export your complete mandate ledger, verification logs, and audit trails in standard JSON format.",
                },
                {
                  lead: "Right to erasure.",
                  body: "Execute a 1-click workspace purge that destroys all local tokens, cached snapshots, and session records.",
                },
                {
                  lead: "Right to restrict processing.",
                  body: "Turn off autonomous background checks and switch to strict manual approval mode.",
                },
              ]}
            />
          </DocsSection>

          <DocsSection id="contact-privacy" title="Contact privacy team">
            <DocsParagraph>
              For privacy inquiries, audit log requests, or data protection officer inquiries, please
              contact us at{" "}
              <a
                href="mailto:privacy@rico.app"
                className="text-[#F4F4F6] underline decoration-[#FFFFFF33] hover:decoration-white"
              >
                privacy@rico.app
              </a>
              . We respond to all formal compliance requests within 48 business hours.
            </DocsParagraph>
          </DocsSection>
        </DocsArticleLayout>
        <SiteFooter />
      </div>
    </main>
  );
}