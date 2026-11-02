import React from "react";
import { HeroSection } from "@/components/home/HeroSection";
import { BrowserSection } from "@/components/home/BrowserSection";
import { PrivacySection } from "@/components/home/PrivacySection";
import { WorkSection } from "@/components/home/WorkSection";
import { EverydaySection } from "@/components/home/EverydaySection";
import { EngineSection } from "@/components/home/EngineSection";
import { FilmSection } from "@/components/home/FilmSection";
import { FaqSection } from "@/components/home/FaqSection";
import { SiteFooter } from "@/components/home/SiteFooter";

export default function HomePage() {
  return (
    <main className="w-full min-h-screen bg-[#09090B] flex flex-col items-center overflow-x-hidden">
      <div
        data-pencil-id="XCqS3"
        data-pencil-name="RICO Homepage"
        className="box-border w-full h-fit flex flex-col gap-0 justify-start items-center bg-[#09090B] overflow-x-hidden"
      >
        <HeroSection />
        <BrowserSection />
        <PrivacySection />
        <WorkSection />
        <EverydaySection />
        <EngineSection />
        <FilmSection />
        <FaqSection />
        <SiteFooter />
      </div>
    </main>
  );
}
