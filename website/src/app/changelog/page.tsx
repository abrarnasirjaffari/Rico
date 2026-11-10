import React from "react";
import { RoadmapNavbar } from "@/components/roadmap/RoadmapNavbar";
import { ChangelogMainShell } from "@/components/changelog/ChangelogMainShell";
import { SiteFooter } from "@/components/home/SiteFooter";

export default function ChangelogPage() {
  return (
    <main className="w-full min-h-screen bg-[#09090B] flex flex-col items-center overflow-x-hidden">
      <div
        data-pencil-id="MjoBX"
        data-pencil-name="RICO Changelog"
        className="box-border w-full h-fit flex flex-col gap-0 justify-start items-center bg-[#09090B] overflow-hidden"
      >
        <RoadmapNavbar />
        <ChangelogMainShell />
        <SiteFooter />
      </div>
    </main>
  );
}
