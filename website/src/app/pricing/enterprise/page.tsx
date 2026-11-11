import React from "react";
import { EnterpriseContactSection } from "@/components/pricing/EnterpriseContactSection";
import { SiteFooter } from "@/components/home/SiteFooter";

export default function EnterprisePricingFormPage() {
  return (
    <main className="w-full min-h-screen bg-[#09090B] flex flex-col items-center overflow-x-hidden">
      <div className="box-border w-full h-fit flex flex-col gap-0 justify-start items-center bg-[#09090B] overflow-hidden">
        <EnterpriseContactSection />
        <SiteFooter />
      </div>
    </main>
  );
}
