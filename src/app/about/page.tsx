import React from "react";
import { RoadmapNavbar } from "@/components/roadmap/RoadmapNavbar";
import { AboutMainShell } from "@/components/about/AboutMainShell";
import { SiteFooter } from "@/components/home/SiteFooter";

export default function AboutPage() {
  return (
    <main className="w-full min-h-screen bg-[#09090B] flex flex-col items-center overflow-x-hidden">
      <div
        data-pencil-id="ouZoz"
        data-pencil-name="RICO About"
        className="box-border w-full h-fit flex flex-col gap-0 justify-start items-center bg-[#09090B] overflow-hidden"
      >
        <RoadmapNavbar />
        <AboutMainShell />
        <SiteFooter />
      </div>
    </main>
  );
}
