"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const FAQ_ITEMS = [
  {
    q: "How does RICO verify live merchant prices?",
    a: "RICO dispatches parallel Stagehand browser helpers that open the real merchant checkout page, strip out dark patterns with the Calm Pricing Lens, and capture a visual proof snapshot before any mandate executes.",
  },
  {
    q: "Can the AI see my credit card numbers?",
    a: "Never. Your payment credentials live in a Zero-Knowledge Vault. The AI agent only receives a scoped, single-merchant execution token after your budget ceiling is verified.",
  },
  {
    q: "What happens if a subscription price spikes?",
    a: "If a merchant raises their price above your strict mandate ceiling—even by $0.01—RICO immediately halts the payment, logs the price diff, and sends an approval prompt to your Command Center or Telegram/Slack.",
  },
  {
    q: "How do Startup and Student savings probes work?",
    a: "Before renewing or purchasing SaaS tools, RICO automatically probes active promo codes, student discounts (like 50% off Spotify), and startup credit programs (such as $50k PostHog or AWS credits).",
  },
  {
    q: "Can agents execute payments without me?",
    a: "You choose the approval mode per mandate: fully autonomous within your strict dollar cap, or one-tap human approval for every run.",
  },
  {
    q: "Is RICO free and open source?",
    a: "Yes. RICO is 100% open source under the MIT License. You can self-host with your own Gemini, Claude, OpenAI, or local Ollama keys, or use RICO Cloud.",
  },
  {
    q: "Can I approve or cancel payments from Telegram or WhatsApp?",
    a: "Yes. Connect RICO's omnichannel bots to Telegram, WhatsApp, or Slack to trigger mandates, inspect proof snapshots, and approve or pause spend from anywhere.",
  },
];

export function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section
      data-pencil-id="wmAJV"
      data-pencil-name="FAQ Section"
      className="box-border w-full py-16 sm:py-24 lg:py-[120px] bg-[#09090B]"
    >
      <div className="w-full max-w-[1248px] mx-auto px-4 sm:px-6 flex flex-col lg:flex-row gap-10 lg:gap-[64px] justify-between items-start">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.65 }}
          data-pencil-id="AKPBF"
          data-pencil-name="FAQ Title Col"
          className="box-border w-full lg:w-[40%] max-w-[472px] shrink-0 h-fit flex flex-col gap-0 justify-start items-start"
        >
          <h2
            data-pencil-id="Z1EGu"
            data-pencil-name="FAQ Heading"
            className="m-0 text-[34px]/[38px] sm:text-[44px]/[46px] lg:text-[50px]/[51px] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-1.8px] lg:tracking-[-2.4px] text-left"
          >
            Questions, answered.
          </h2>
        </motion.div>

        <div
          data-pencil-id="lgw15"
          data-pencil-name="FAQ Accordion List"
          className="w-full lg:w-[60%] max-w-[664px] shrink-0 flex flex-col gap-0 justify-start items-start border-t border-[#FFFFFF1F]"
        >
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: idx * 0.06 }}
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full shrink-0 flex flex-col border-b border-[#FFFFFF1F] cursor-pointer select-none"
              >
                <div className="w-full min-h-[66.5px] flex flex-row gap-4 py-[22px] justify-between items-center hover:opacity-85 transition-opacity">
                  <div className="text-[16px]/[24px] sm:text-[18px]/[normal] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-medium tracking-[-0.27px] text-left">
                    {item.q}
                  </div>
                  <motion.svg
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 22 }}
                    viewBox="0 0 24 24"
                    preserveAspectRatio="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="box-border w-[18px] shrink-0 h-[18px] overflow-visible"
                  >
                    <path
                      d="M12.001 5.00003v14.00197m7.001-7l-14.00202 0"
                      fill="none"
                      stroke="#F4F4F6A3"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </motion.svg>
                </div>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="pb-[22px] pr-8 text-[15.5px]/[24px] text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif]">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
