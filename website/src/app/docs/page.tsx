import React from "react";
import { RoadmapNavbar } from "@/components/roadmap/RoadmapNavbar";
import { DocsMainShell } from "@/components/docs/DocsMainShell";
import { SiteFooter } from "@/components/home/SiteFooter";

export default function DocsPage() {
  return (
    <main className="w-full min-h-screen bg-[#09090B] flex flex-col items-center overflow-x-hidden">
      <div
        data-pencil-id="Y1d4g2"
        data-pencil-name="RICO Docs"
        className="box-border w-full h-fit flex flex-col gap-0 justify-start items-center bg-[#09090B] overflow-hidden"
      >
        <RoadmapNavbar />
        <DocsMainShell />
        <SiteFooter />
      </div>
    </main>
  );
}
