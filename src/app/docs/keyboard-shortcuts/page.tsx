import React from "react";
import { RoadmapNavbar } from "@/components/roadmap/RoadmapNavbar";
import { SiteFooter } from "@/components/home/SiteFooter";
import {
  DocsArticleLayout,
  DocsSection,
  DocsParagraph,
  DocsTable,
  DocsBullets,
  DocsKbd,
} from "@/components/docs/DocsArticleLayout";

export default function KeyboardShortcutsDocsPage() {
  return (
    <main className="w-full min-h-screen bg-[#09090B] flex flex-col items-center overflow-x-hidden">
      <div className="box-border w-full h-fit flex flex-col gap-0 justify-start items-center bg-[#09090B] overflow-hidden">
        <RoadmapNavbar />
        <DocsArticleLayout
          activeSlug="keyboard-shortcuts"
          title="Keyboard shortcuts"
          lede={
            <>
              Every default keyboard shortcut in the RICO WebApp. Trigger mandates, toggle the
              Verification Viewport, switch approval modes and search audit logs without lifting
              your hands from the keyboard.
            </>
          }
          outline={[
            { id: "command-launcher", label: "Quick Command Launcher" },
            { id: "workspace-and-views", label: "Workspace & views" },
            { id: "mandates-and-ledger", label: "Mandates & AG Grid ledger" },
            { id: "verification-viewport", label: "Verification Viewport" },
            { id: "where-to-go-next", label: "Where to go next" },
          ]}
          prevPager={{ title: "Privacy and security", href: "/docs/privacy-and-security" }}
        >
          <DocsSection id="command-launcher" title="Quick Command Launcher" first>
            <DocsParagraph>
              The Quick Command Launcher lets you trigger a mandate run, search transactions, switch
              personas or jump to any setting from anywhere in RICO.
            </DocsParagraph>
            <DocsTable
              headers={["Action", "macOS", "Windows / Linux"]}
              colWidths={["w-[320px]", "w-[180px]", "w-[180px]"]}
              rows={[
                [
                  "Open Quick Command Launcher",
                  <>
                    <DocsKbd>⌘</DocsKbd> <DocsKbd>K</DocsKbd>
                  </>,
                  <>
                    <DocsKbd>Ctrl</DocsKbd> <DocsKbd>K</DocsKbd>
                  </>,
                ],
                [
                  "Trigger new natural-language mandate",
                  <>
                    <DocsKbd>⌘</DocsKbd> <DocsKbd>⇧</DocsKbd> <DocsKbd>Space</DocsKbd>
                  </>,
                  <>
                    <DocsKbd>Ctrl</DocsKbd> <DocsKbd>Shift</DocsKbd> <DocsKbd>Space</DocsKbd>
                  </>,
                ],
                [
                  "Open Workspace Settings",
                  <>
                    <DocsKbd>⌘</DocsKbd> <DocsKbd>,</DocsKbd>
                  </>,
                  <>
                    <DocsKbd>Ctrl</DocsKbd> <DocsKbd>,</DocsKbd>
                  </>,
                ],
              ]}
            />
          </DocsSection>

          <DocsSection id="workspace-and-views" title="Workspace & views">
            <DocsParagraph>
              Switch between Split View, Chat Only and Dashboard Only, or collapse the sidebar to
              focus on the live 30 FPS viewport.
            </DocsParagraph>
            <DocsTable
              headers={["Action", "macOS", "Windows / Linux"]}
              colWidths={["w-[320px]", "w-[180px]", "w-[180px]"]}
              rows={[
                [
                  "Toggle left sidebar",
                  <>
                    <DocsKbd>⌘</DocsKbd> <DocsKbd>B</DocsKbd>
                  </>,
                  <>
                    <DocsKbd>Ctrl</DocsKbd> <DocsKbd>B</DocsKbd>
                  </>,
                ],
                [
                  "Switch to Split View",
                  <>
                    <DocsKbd>⌘</DocsKbd> <DocsKbd>1</DocsKbd>
                  </>,
                  <>
                    <DocsKbd>Ctrl</DocsKbd> <DocsKbd>1</DocsKbd>
                  </>,
                ],
                [
                  "Switch to Chat Only",
                  <>
                    <DocsKbd>⌘</DocsKbd> <DocsKbd>2</DocsKbd>
                  </>,
                  <>
                    <DocsKbd>Ctrl</DocsKbd> <DocsKbd>2</DocsKbd>
                  </>,
                ],
                [
                  "Switch to Dashboard & Ledger Only",
                  <>
                    <DocsKbd>⌘</DocsKbd> <DocsKbd>3</DocsKbd>
                  </>,
                  <>
                    <DocsKbd>Ctrl</DocsKbd> <DocsKbd>3</DocsKbd>
                  </>,
                ],
                [
                  "Toggle Dark / Light mode",
                  <>
                    <DocsKbd>⌘</DocsKbd> <DocsKbd>⇧</DocsKbd> <DocsKbd>L</DocsKbd>
                  </>,
                  <>
                    <DocsKbd>Ctrl</DocsKbd> <DocsKbd>Shift</DocsKbd> <DocsKbd>L</DocsKbd>
                  </>,
                ],
              ]}
            />
          </DocsSection>

          <DocsSection id="mandates-and-ledger" title="Mandates & AG Grid ledger">
            <DocsTable
              headers={["Action", "macOS", "Windows / Linux"]}
              colWidths={["w-[320px]", "w-[180px]", "w-[180px]"]}
              rows={[
                [
                  "Run price audit on selected mandate",
                  <>
                    <DocsKbd>⌘</DocsKbd> <DocsKbd>R</DocsKbd>
                  </>,
                  <>
                    <DocsKbd>Ctrl</DocsKbd> <DocsKbd>R</DocsKbd>
                  </>,
                ],
                [
                  "Pause / Resume selected mandate",
                  <>
                    <DocsKbd>⌘</DocsKbd> <DocsKbd>P</DocsKbd>
                  </>,
                  <>
                    <DocsKbd>Ctrl</DocsKbd> <DocsKbd>P</DocsKbd>
                  </>,
                ],
                [
                  "Export AG Grid ledger to CSV",
                  <>
                    <DocsKbd>⌘</DocsKbd> <DocsKbd>⇧</DocsKbd> <DocsKbd>E</DocsKbd>
                  </>,
                  <>
                    <DocsKbd>Ctrl</DocsKbd> <DocsKbd>Shift</DocsKbd> <DocsKbd>E</DocsKbd>
                  </>,
                ],
              ]}
            />
          </DocsSection>

          <DocsSection id="verification-viewport" title="Verification Viewport">
            <DocsTable
              headers={["Action", "macOS", "Windows / Linux"]}
              colWidths={["w-[320px]", "w-[180px]", "w-[180px]"]}
              rows={[
                [
                  "Toggle Calm Pricing Lens",
                  <>
                    <DocsKbd>⌘</DocsKbd> <DocsKbd>L</DocsKbd>
                  </>,
                  <>
                    <DocsKbd>Ctrl</DocsKbd> <DocsKbd>L</DocsKbd>
                  </>,
                ],
                [
                  "Enter Live Human Takeover mode",
                  <>
                    <DocsKbd>⌘</DocsKbd> <DocsKbd>⇧</DocsKbd> <DocsKbd>T</DocsKbd>
                  </>,
                  <>
                    <DocsKbd>Ctrl</DocsKbd> <DocsKbd>Shift</DocsKbd> <DocsKbd>T</DocsKbd>
                  </>,
                ],
                [
                  "Capture manual proof snapshot",
                  <>
                    <DocsKbd>⌘</DocsKbd> <DocsKbd>⇧</DocsKbd> <DocsKbd>S</DocsKbd>
                  </>,
                  <>
                    <DocsKbd>Ctrl</DocsKbd> <DocsKbd>Shift</DocsKbd> <DocsKbd>S</DocsKbd>
                  </>,
                ],
              ]}
            />
          </DocsSection>

          <DocsSection id="where-to-go-next" title="Where to go next">
            <DocsBullets
              items={[
                {
                  lead: "Getting started",
                  href: "/docs/getting-started",
                  body: "walks through launching your first session and importing subscriptions.",
                },
                {
                  lead: "Verification Engine",
                  href: "/docs/verification-engine",
                  body: "explains the 30 FPS CDP viewport and Parallel Helper Bots.",
                },
                {
                  lead: "Ask RICO",
                  href: "/docs/ask-rico",
                  body: "shows how to create mandates and probe discounts in plain words.",
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
