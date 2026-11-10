import React from "react";
import { RoadmapNavbar } from "@/components/roadmap/RoadmapNavbar";
import { SiteFooter } from "@/components/home/SiteFooter";
import {
  DocsArticleLayout,
  DocsSection,
  DocsParagraph,
  DocsTable,
  DocsBullets,
  DocsCallout,
  LEGAL_SIDENAV_ITEMS,
} from "@/components/docs/DocsArticleLayout";

export default function MITLicensePage() {
  return (
    <main className="w-full min-h-screen bg-[#09090B] flex flex-col items-center overflow-x-hidden">
      <div className="box-border w-full h-fit flex flex-col gap-0 justify-start items-center bg-[#09090B] overflow-hidden">
        <RoadmapNavbar />
        <DocsArticleLayout
          activeSlug="mit-license"
          sideNavHeading="Legal & Compliance"
          sideNavHeadingHref="/mit-license"
          sideNavItems={LEGAL_SIDENAV_ITEMS}
          eyebrow={{ label: "Legal", href: "/mit-license" }}
          title="MIT License"
          lede={
            <>
              RICO is free and open-source software, released under the permissive MIT License. You
              are free to study, build upon, self-host, and adapt the software without restrictive
              vendor lock-in.
            </>
          }
          outline={[
            { id: "license-text", label: "Official license text" },
            { id: "permissions", label: "Permitted usage" },
            { id: "conditions", label: "License conditions" },
            { id: "limitations", label: "Limitations & disclaimer" },
            { id: "contributing", label: "Open source contributing" },
          ]}
          prevPager={{ title: "Commercial Licensing", href: "/commercial-licensing" }}
          nextPager={{ title: "Privacy Policy", href: "/privacy" }}
        >
          <DocsSection id="license-text" title="Official license text" first>
            <DocsParagraph>
              The following is the complete legal text of the MIT License applying to the RICO
              codebase and all official repositories:
            </DocsParagraph>
            <div className="box-border w-full h-fit shrink-0 flex flex-col gap-3 p-5 sm:p-6 bg-[#111113] [outline:1px_solid_#FFFFFF17] [outline-offset:-0.5px] rounded-[16px] text-[#F4F4F6D6] font-[Geist,monospace,system-ui] text-[14px]/[24px]">
              <div className="font-semibold text-[#F4F4F6] text-[15px]">
                Copyright (c) 2026 RICO Contributors and Abrar Nasir
              </div>
              <div>
                Permission is hereby granted, free of charge, to any person obtaining a copy of this
                software and associated documentation files (the &quot;Software&quot;), to deal in the
                Software without restriction, including without limitation the rights to use, copy,
                modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
                and to permit persons to whom the Software is furnished to do so, subject to the
                following conditions:
              </div>
              <div>
                The above copyright notice and this permission notice shall be included in all
                copies or substantial portions of the Software.
              </div>
              <div className="uppercase text-[13px]/[22px] text-[#F4F4F68C]">
                THE SOFTWARE IS PROVIDED &quot;AS IS&quot;, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
                IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR
                A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
                HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
                CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE
                OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
              </div>
            </div>
            <DocsCallout title="Open source and proud">
              RICO was conceived from day one to be transparent and user-owned. You can verify every
              line of code executing transactions, auditing discount codes, or streaming CDP frames
              directly on GitHub.
            </DocsCallout>
          </DocsSection>

          <DocsSection id="permissions" title="Permitted usage">
            <DocsParagraph>
              Under the MIT License, you are granted extensive freedoms to use RICO in personal,
              academic, or commercial settings:
            </DocsParagraph>
            <DocsTable
              headers={["Permission", "Status", "Notes"]}
              rows={[
                [
                  "Commercial use",
                  "Allowed",
                  "You may use RICO internally within a commercial enterprise or company",
                ],
                [
                  "Modification",
                  "Allowed",
                  "You may alter the source code, add custom tools, or integrate proprietary APIs",
                ],
                [
                  "Distribution",
                  "Allowed",
                  "You may distribute copies or fork the codebase",
                ],
                [
                  "Sublicensing",
                  "Allowed",
                  "You can incorporate RICO into projects distributed under other licenses",
                ],
                [
                  "Private use",
                  "Allowed",
                  "You can run and modify RICO on air-gapped private servers without publishing code",
                ],
              ]}
            />
          </DocsSection>

          <DocsSection id="conditions" title="License conditions">
            <DocsParagraph>
              The MIT License is intentionally minimal. It imposes only one straightforward condition:
            </DocsParagraph>
            <DocsBullets
              items={[
                {
                  lead: "Preserve Copyright & Notice.",
                  body: "The original copyright notice and permission notice must be retained in all copies or substantial portions of the Software.",
                },
              ]}
            />
          </DocsSection>

          <DocsSection id="limitations" title="Limitations & disclaimer">
            <DocsParagraph>
              To protect open-source authors and community contributors from legal exposure, the MIT
              License includes standard disclaimer covenants:
            </DocsParagraph>
            <DocsBullets
              items={[
                {
                  lead: "No Warranty.",
                  body: "The software is provided without guarantees of merchantability, uptime, or error-free execution.",
                },
                {
                  lead: "No Liability.",
                  body: "Maintainers are not legally liable for any financial losses, merchant disputes, or unintended charges arising from usage of the software.",
                },
                {
                  lead: "Trademark Distinction.",
                  body: "The MIT License grants rights to the code, but does not grant rights to use the RICO trademarks, brand names, or project logos in a misleading manner.",
                },
              ]}
            />
          </DocsSection>

          <DocsSection id="contributing" title="Open source contributing">
            <DocsParagraph>
              Contributions to RICO are welcome! When you submit a pull request, your contributions
              are licensed under the same MIT License terms.
            </DocsParagraph>
            <DocsParagraph>
              View the project source, check out ongoing issues, and read the contribution guidelines
              on GitHub at{" "}
              <a
                href="https://github.com/abrarnasirjaffari/Rico-Website"
                target="_blank"
                rel="noreferrer"
                className="text-[#F4F4F6] underline decoration-[#FFFFFF33] hover:decoration-white"
              >
                github.com/abrarnasirjaffari/Rico-Website
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