import React from "react";
import { RoadmapNavbar } from "@/components/roadmap/RoadmapNavbar";
import { GettingStartedMainShell } from "@/components/docs/GettingStartedMainShell";
import { SiteFooter } from "@/components/home/SiteFooter";

export default function DocsGettingStartedPage() {
  return (
    <main className="w-full min-h-screen bg-[#09090B] flex flex-col items-center overflow-x-hidden">
      <div
        data-pencil-id="xyaRq"
        data-pencil-name="RICO Docs - Getting Started"
        className="box-border w-full h-fit flex flex-col gap-0 justify-start items-center bg-[#09090B] overflow-hidden"
      >
        <RoadmapNavbar />
        <GettingStartedMainShell />
        <SiteFooter />
      </div>
    </main>
  );
}
