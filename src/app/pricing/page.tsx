import React from "react";
import { PricingHeroSection } from "@/components/pricing/PricingHeroSection";
import { PricingRestSection } from "@/components/pricing/PricingRestSection";
import { SiteFooter } from "@/components/home/SiteFooter";

export default function PricingPage() {
  return (
    <main className="w-full min-h-screen bg-[#09090B] flex flex-col items-center overflow-x-hidden">
      <div
        data-pencil-id="AP68z"
        data-pencil-name="RICO Pricing"
        className="box-border w-full h-fit flex flex-col gap-0 justify-start items-center bg-[#09090B] overflow-hidden"
      >
        <PricingHeroSection />
        <PricingRestSection />
        <SiteFooter />
      </div>
    </main>
  );
}
