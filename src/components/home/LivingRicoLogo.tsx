"use client";

import React from "react";
import { motion } from "framer-motion";

export function LivingRicoLogo({ showStageBadge: _showStageBadge = false }: { showStageBadge?: boolean }) {
  return (
    <div
      data-pencil-id="eswz5"
      data-pencil-name="Brand Link"
      className="box-border w-fit shrink-0 h-fit flex flex-row gap-[10px] justify-start items-center cursor-pointer select-none"
    >
      <motion.div
        animate={{ y: [0, -3.5, 0] }}
        transition={{
          duration: 3.2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        data-pencil-id="j6tGL"
        data-pencil-name="RICO Mark"
        className="box-border w-[30px] shrink-0 h-[28px] bg-[url('/assets/brand-rico-mark-transparent.png')] bg-no-repeat bg-contain bg-center"
      />
      <div
        data-pencil-id="RN4Y0"
        data-pencil-name="Brand Name"
        className="text-[16px]/[normal] box-border text-[#FFFFFF] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-0.32px] text-left [white-space:nowrap]"
      >
        RICO
      </div>
    </div>
  );
}
