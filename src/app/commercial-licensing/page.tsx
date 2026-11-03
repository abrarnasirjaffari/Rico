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

export default function CommercialLicensingPage() {
  return (
    <main className="w-full min-h-screen bg-[#09090B] flex flex-col items-center overflow-x-hidden">
      <div className="box-border w-full h-fit flex flex-col gap-0 justify-start items-center bg-[#09090B] overflow-hidden">
        <RoadmapNavbar />
        <DocsArticleLayout
          activeSlug="commercial-licensing"
          sideNavHeading="Legal & Compliance"
          sideNavHeadingHref="/commercial-licensing"
          sideNavItems={LEGAL_SIDENAV_ITEMS}
          eyebrow={{ label: "Legal", href: "/commercial-licensing" }}
          title="Commercial Licensing"
          lede={
            <>
              While RICO core is open-source under the permissive MIT license, our Commercial
              Licensing program provides enterprise warranties, dedicated SLA uptime, white-label
              OEM rights, and customized compliance indemnification.
            </>
          }
          outline={[
            { id: "licensing-overview", label: "Dual-licensing overview" },
            { id: "when-commercial-needed", label: "When do you need a license?" },
            { id: "enterprise-features", label: "Commercial perks & guarantees" },
            { id: "comparison-table", label: "MIT vs Commercial matrix" },
            { id: "oem-white-label", label: "OEM & white-label embedding" },
            { id: "procurement", label: "Procurement & custom terms" },
          ]}
          prevPager={{ title: "Terms of Service", href: "/terms" }}
          nextPager={{ title: "MIT License", href: "/mit-license" }}
        >
          <DocsSection id="licensing-overview" title="Dual-licensing overview" first>
            <DocsParagraph>
              RICO embraces an open ecosystem. Individual developers, research teams, startups, and
              community members can freely inspect, modify, fork, and self-host RICO under the
              permissive MIT License without paying any software licensing fee.
            </DocsParagraph>
            <DocsParagraph>
              For enterprises deploying RICO across critical treasury pipelines, requiring SOC 2 Type
              II compliance reports, custom IP indemnification, or redistributing RICO within
              proprietary commercial software suites, our Commercial License is specifically crafted
              for your legal requirements.
            </DocsParagraph>
          </DocsSection>

          <DocsSection id="when-commercial-needed" title="When do you need a license?">
            <DocsParagraph>
              Review the standard criteria below to determine whether your organization requires a
              Commercial License:
            </DocsParagraph>
            <DocsBullets
              items={[
                {
                  lead: "Proprietary OEM Distribution.",
                  body: "You are bundling the RICO engine into a proprietary closed-source product sold to third parties without attribution.",
                },
                {
                  lead: "Enterprise SLA & Dedicated Support.",
                  body: "You require a 99.95% or 99.99% uptime guarantee with 1-hour priority incident response times from core maintainers.",
                },
                {
                  lead: "Corporate IP Indemnification.",
                  body: "Your corporate legal counsel requires warranty protections against third-party patent or copyright infringement claims.",
                },
                {
                  lead: "Custom Banking & Vault Connectors.",
                  body: "You need proprietary connectors for on-premise Oracle ERP, SAP S/4HANA, or private banking payment rails.",
                },
              ]}
            />
          </DocsSection>

          <DocsSection id="enterprise-features" title="Commercial perks & guarantees">
            <DocsParagraph>
              Commercial License agreements include dedicated engineering and operational guarantees
              designed for corporate financial governance:
            </DocsParagraph>
            <DocsSteps
              steps={[
                {
                  lead: "Dedicated CDP Cluster.",
                  body: "Access isolated Playwright / Stagehand headless browser worker pools provisioned in your preferred cloud region (AWS, GCP, Azure).",
                },
                {
                  lead: "Treasury multi-sig signoff.",
                  body: "Enforce multi-party dual approval workflows before high-value mandates can be authorized by agents.",
                },
                {
                  lead: "Audit-ready SOC 2 & ISO packs.",
                  body: "Annual SOC 2 Type II reports, penetration testing certifications, and data processing agreements (DPAs) ready for procurement.",
                },
              ]}
            />
            <DocsCallout title="Tailored to your procurement cycle">
              We work with standard enterprise purchasing portals (Coupa, SAP Ariba, Vendr) and
              support annual PO invoicing with net-30 / net-60 terms.
            </DocsCallout>
          </DocsSection>

          <DocsSection id="comparison-table" title="MIT vs Commercial matrix">
            <DocsParagraph>
              A side-by-side comparison of rights and services provided across license tiers:
            </DocsParagraph>
            <DocsTable
              headers={["Feature / Term", "Community (MIT)", "Commercial License"]}
              rows={[
                [
                  "Source Code Access",
                  "100% Full Public GitHub",
                  "Full Access + Enterprise Modules",
                ],
                [
                  "Commercial Use & Self-Hosting",
                  "Included",
                  "Included + Dedicated Private Cloud",
                ],
                [
                  "White-Label & Branding Removal",
                  "Must retain license notice",
                  "100% Unbranded OEM embedding allowed",
                ],
                [
                  "Support SLA",
                  "Community Discord & GitHub",
                  "Guaranteed 1h / 4h response, dedicated Slack channel",
                ],
                [
                  "Legal Indemnification",
                  "As-is (No warranty)",
                  "Full intellectual property warranty & defense",
                ],
                [
                  "Security & Compliance",
                  "Community disclosures",
                  "SOC 2 Type II, DPA, Vendor Risk Assessments",
                ],
              ]}
            />
          </DocsSection>

          <DocsSection id="oem-white-label" title="OEM & white-label embedding">
            <DocsParagraph>
              ISVs, Fintech aggregators, and SaaS billing platforms can embed RICO&apos;s 30 FPS CDP
              Verification Viewport, Ask RICO natural-language mandate builder, and discount probe
              engine directly into their own user interfaces under their own brand. Commercial OEM
              agreements include flexible seat-based or volume-based pricing models.
            </DocsParagraph>
          </DocsSection>

          <DocsSection id="procurement" title="Procurement & custom terms">
            <DocsParagraph>
              Ready to execute a Commercial License or review a master services agreement (MSA)? Reach
              out directly to our enterprise team at{" "}
              <a
                href="mailto:licensing@rico.app"
                className="text-[#F4F4F6] underline decoration-[#FFFFFF33] hover:decoration-white"
              >
                licensing@rico.app
              </a>
              . We can provide a standard MSA or review your organization&apos;s paper.
            </DocsParagraph>
          </DocsSection>
        </DocsArticleLayout>
        <SiteFooter />
      </div>
    </main>
  );
}