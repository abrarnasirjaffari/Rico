import React from "react";
import { RoadmapNavbar } from "@/components/roadmap/RoadmapNavbar";
import { RoadmapMainShell } from "@/components/roadmap/RoadmapMainShell";
import { SiteFooter } from "@/components/home/SiteFooter";

export default function RoadmapPage() {
  return (
    <main className="w-full min-h-screen bg-[#09090B] flex flex-col items-center overflow-x-hidden">
      <div
        data-pencil-id="XmJvZ"
        data-pencil-name="RICO Roadmap"
        className="box-border w-full h-fit flex flex-col gap-0 justify-start items-center bg-[#09090B] overflow-hidden"
      >
        <RoadmapNavbar />
        <RoadmapMainShell />
        <SiteFooter />
      </div>
    </main>
  );
}
