"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const USAGE_ITEMS = [
  {
    id: "H12JC1",
    name: "Usage Item Free starts you with 250 credits",
    titleId: "kFhZr",
    titleName: "Free starts you with 250 credits Title",
    bodyId: "Ap1PU",
    bodyName: "Free starts you with 250 credits Body",
    title: "1,000 credits for your first month",
    body: "When you sign up, you get 1,000 free credits for your first month so you can explore and automate everything freely.",
  },
  {
    id: "NwXKX",
    name: "Usage Item Pro and Max renew every month",
    titleId: "h0IYu5",
    titleName: "Pro and Max renew every month Title",
    bodyId: "UlTiL",
    bodyName: "Pro and Max renew every month Body",
    title: "250 free credits every month",
    body: "After your first month, your account automatically refreshes with 250 free credits every single month at zero cost.",
  },
  {
    id: "zYugq",
    name: "Usage Item No surprise charges",
    titleId: "G7G2n",
    titleName: "No surprise charges Title",
    bodyId: "mGOqT",
    bodyName: "No surprise charges Body",
    title: "No surprise charges",
    body: "You never enter a credit card to use RICO, and you will never be charged when your monthly credits finish.",
  },
  {
    id: "BsBnu",
    name: "Usage Item Top-ups",
    titleId: "DtBGJ",
    titleName: "Top-ups Title",
    bodyId: "oGObe",
    bodyName: "Top-ups Body",
    title: "Ready to use right away",
    body: "RICO works out of the box in your browser with no setup, no downloads and no keys to manage on your own.",
  },
  {
    id: "xRbaI",
    name: "Usage Item Your own keys",
    titleId: "J7JUa",
    titleName: "Your own keys Title",
    bodyId: "IbRFf",
    bodyName: "Your own keys Body",
    title: "Your own key for unlimited use",
    body: "If you ever want more than the monthly free credits, add your own API key in Settings and keep going without limits.",
  },
  {
    id: "Hus8V",
    name: "Usage Item Demand and changes",
    titleId: "zoszi",
    titleName: "Demand and changes Title",
    bodyId: "dXUmQ",
    bodyName: "Demand and changes Body",
    title: "API access included",
    body: "Every free account also gets an API key so you can connect RICO to your own tools and workflows whenever you need.",
  },
];

const PRICING_QUESTIONS = [
  {
    rowId: "a4ZNT",
    rowName: "Question Row 1",
    textId: "jmURX",
    textName: "Question 1 Text",
    iconId: "TN3Dl",
    iconName: "Question 1 Plus Icon",
    q: "Can I use RICO without paying?",
    a: "Yes. RICO is completely free to use with no credit card required. You get 1,000 free credits in your first month and 250 free credits refreshed automatically every month after that.",
  },
  {
    rowId: "nqu3A",
    rowName: "Question Row 2",
    textId: "A0JRY",
    textName: "Question 2 Text",
    iconId: "Wu1Fz",
    iconName: "Question 2 Plus Icon",
    q: "How do I get my 1,000 free credits?",
    a: "Simply sign in to your RICO workspace. Your 1,000 first-month credits and personal API key are provisioned immediately with zero setup or billing details required.",
  },
  {
    rowId: "Lawu9",
    rowName: "Question Row 3",
    textId: "bchxd",
    textName: "Question 3 Text",
    iconId: "YW5Wj",
    iconName: "Question 3 Plus Icon",
    q: "What happens after the first month?",
    a: "Your account automatically refreshes with 250 free credits every month at zero cost. You will never be billed or charged when your monthly credits finish.",
  },
  {
    rowId: "l7mWV",
    rowName: "Question Row 4",
    textId: "Wl0jO",
    textName: "Question 4 Text",
    iconId: "fpjpp",
    iconName: "Question 4 Plus Icon",
    q: "Is the API included for free too?",
    a: "Yes. Every free account includes full access to the RICO API, price alerts, and web workspace so you can trigger mandates and verify prices from your own tools and workflows.",
  },
  {
    rowId: "T8oMf",
    rowName: "Question Row 5",
    textId: "V6cwjn",
    textName: "Question 5 Text",
    iconId: "XMvzp",
    iconName: "Question 5 Plus Icon",
    q: "Can I bring my own API key?",
    a: "Absolutely. You can add your own Gemini, Claude, OpenAI, or local Ollama key in Settings at any time for unlimited runs without touching your monthly credits.",
  },
  {
    rowId: "GF1wF",
    rowName: "Question Row 6",
    textId: "egNia",
    textName: "Question 6 Text",
    iconId: "QUwkA",
    iconName: "Question 6 Plus Icon",
    q: "Do I need to install anything?",
    a: "No. RICO runs 100% in your browser and via API in our hosted cloud workspace—or you can self-host the open-source MIT repository on your own server whenever you like.",
  },
  {
    rowId: "EntQ7",
    rowName: "Question Row 7",
    textId: "EntQ7T",
    textName: "Question 7 Text",
    iconId: "EntQ7I",
    iconName: "Question 7 Plus Icon",
    q: "What is included in RICO Enterprise?",
    a: "Enterprise includes dedicated isolated Playwright/CDP browser clusters in your preferred cloud region, multi-sig treasury mandate approvals, SOC 2 Type II compliance packs, custom DPAs, IP indemnification, and a 99.99% uptime SLA with a shared Slack channel.",
  },
];

export function PricingRestSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section
      data-pencil-id="SnUQ7"
      data-pencil-name="Pricing Rest Section"
      className="box-border w-full bg-[#09090B] pt-16 sm:pt-24 pb-8"
    >
      <div className="w-full max-w-[1248px] mx-auto px-4 sm:px-6 flex flex-col gap-20 sm:gap-[104px] items-center">
        {/* Usage Works Section */}
        <div
          data-pencil-id="y4bcI"
          data-pencil-name="Usage Works Section"
          className="box-border w-full h-fit shrink-0 flex flex-col gap-[36px] justify-start items-start bg-[#09090B]"
        >
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            data-pencil-id="EeHFb"
            data-pencil-name="Usage Works Heading"
            className="m-0 text-[34px]/[38px] sm:text-[46px]/[48px] lg:text-[56px]/[58px] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-1.8px] lg:tracking-[-2.24px] text-left"
          >
            How RICO credits work
          </motion.h2>

          <div
            data-pencil-id="VYKMp"
            data-pencil-name="Usage Works Grid"
            className="box-border w-full h-fit shrink-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-[48px] gap-y-[32px]"
          >
            {USAGE_ITEMS.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.55, delay: idx * 0.08 }}
                whileHover={{ y: -4 }}
                data-pencil-id={item.id}
                data-pencil-name={item.name}
                className="box-border w-full h-fit flex flex-col gap-[8px] justify-start items-start cursor-default"
              >
                <div
                  data-pencil-id={item.titleId}
                  data-pencil-name={item.titleName}
                  className="text-[17px]/[24px] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-0.255px] text-left"
                >
                  {item.title}
                </div>
                <div
                  data-pencil-id={item.bodyId}
                  data-pencil-name={item.bodyName}
                  className="text-[15.5px]/[25px] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal text-left"
                >
                  {item.body}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Pricing Questions Section (Interactive Accordion) */}
        <div
          data-pencil-id="BTlb5"
          data-pencil-name="Pricing Questions Section"
          className="box-border w-full h-fit shrink-0 flex flex-col gap-[36px] justify-start items-start bg-[#09090B]"
        >
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            data-pencil-id="X6wfi"
            data-pencil-name="Pricing Questions Heading"
            className="m-0 text-[34px]/[38px] sm:text-[46px]/[48px] lg:text-[56px]/[58px] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-1.8px] lg:tracking-[-2.24px] text-left"
          >
            Questions
          </motion.h2>

          <div
            data-pencil-id="hwlEb"
            data-pencil-name="Pricing Questions List"
            className="box-border w-full h-fit shrink-0 flex flex-col gap-0 justify-start items-start border-t border-[#FFFFFF1F]"
          >
            {PRICING_QUESTIONS.map((item, idx) => {
              const isOpen = openIdx === idx;
              const panelId = `pricing-faq-panel-${item.rowId}`;
              return (
                <motion.div
                  key={item.rowId}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: idx * 0.06 }}
                  data-pencil-id={item.rowId}
                  data-pencil-name={item.rowName}
                  className="w-full shrink-0 flex flex-col border-b border-[#FFFFFF1F]"
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenIdx(isOpen ? null : idx)}
                    className="w-full min-h-[66.5px] flex flex-row gap-4 py-[22px] px-1 justify-between items-center bg-transparent border-0 cursor-pointer select-none hover:opacity-85 transition-opacity rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090B]"
                  >
                    <span
                      data-pencil-id={item.textId}
                      data-pencil-name={item.textName}
                      className="text-[16px]/[24px] sm:text-[18px]/[normal] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-medium tracking-[-0.27px] text-left"
                    >
                      {item.q}
                    </span>
                    <motion.svg
                      aria-hidden="true"
                      animate={{ rotate: isOpen ? 45 : 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 22 }}
                      data-pencil-id={item.iconId}
                      data-pencil-name={item.iconName}
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
                        vectorEffect="non-scaling-stroke"
                      />
                    </motion.svg>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={panelId}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="pb-[22px] pr-8 max-w-[780px] text-[15.5px]/[25px] text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif]">
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

        {/* Run It Yourself Band + Legal Nav */}
        <div className="w-full flex flex-col gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -3 }}
            data-pencil-id="iVTk2"
            data-pencil-name="Run It Yourself Band"
            className="box-border w-full h-fit shrink-0 flex flex-col lg:flex-row gap-8 lg:gap-[64px] p-6 sm:p-10 lg:p-[48px] justify-between items-start lg:items-center bg-[#111113] [outline:1px_solid_#FFFFFF1A] [outline-offset:-0.5px] rounded-[28px] transition-shadow duration-300 hover:[box-shadow:0_20px_60px_rgba(0,0,0,0.5)]"
          >
            <div
              data-pencil-id="Tp9UZ"
              data-pencil-name="Run It Yourself Copy"
              className="box-border w-full lg:w-[607px] shrink-0 h-fit flex flex-col gap-[14px] justify-start items-start"
            >
              <div
                data-pencil-id="uPGmp"
                data-pencil-name="Run It Yourself Heading"
                className="text-[32px]/[36px] sm:text-[40px]/[42px] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-1.6px] text-left"
              >
                Run it yourself.
              </div>
              <div
                data-pencil-id="taXzg"
                data-pencil-name="Run It Yourself Body"
                className="text-[16px]/[26px] box-border max-w-[540px] text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal text-left"
              >
                Everything is open source under the MIT License. You can use RICO for free in our
                hosted workspace, or run the web app and API on your own server whenever you like.
              </div>
            </div>

            <div
              data-pencil-id="xxBqP"
              data-pencil-name="Run It Yourself Links"
              className="box-border w-full lg:w-[433px] shrink-0 h-fit flex flex-col gap-0 justify-start items-start"
            >
              {[
                {
                  id: "KB9E1",
                  name: "Self Host Link Backend source",
                  textId: "TANV8",
                  textName: "Backend source Label",
                  iconId: "zZTPZ",
                  iconName: "Backend source Arrow Icon",
                  label: "Backend source",
                },
                {
                  id: "Ehijj",
                  name: "Self Host Link Self-hosting guide",
                  textId: "T3ye6g",
                  textName: "Self-hosting guide Label",
                  iconId: "PbnDn",
                  iconName: "Self-hosting guide Arrow Icon",
                  label: "Self-hosting guide",
                },
                {
                  id: "I2ZeM",
                  name: "Self Host Link Commercial licensing",
                  textId: "kWr7w",
                  textName: "Commercial licensing Label",
                  iconId: "V3A0V",
                  iconName: "Commercial licensing Arrow Icon",
                  label: "Commercial licensing",
                },
              ].map((link, i) => (
                <motion.a
                  key={link.id}
                  href="https://github.com/abrarnasirjaffari/Rico-Website"
                  target="_blank"
                  rel="noreferrer"
                  whileHover={{ x: 5 }}
                  data-pencil-id={link.id}
                  data-pencil-name={link.name}
                  className={`group box-border w-full h-[48.5px] shrink-0 flex flex-row gap-0 py-[14px] justify-between items-center cursor-pointer no-underline ${
                    i > 0 ? "border-t border-[#FFFFFF1A]" : ""
                  }`}
                >
                  <div
                    data-pencil-id={link.textId}
                    data-pencil-name={link.textName}
                    className="text-[16px]/[normal] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-medium tracking-[-0.16px] text-left"
                  >
                    {link.label}
                  </div>
                  <svg
                    data-pencil-id={link.iconId}
                    data-pencil-name={link.iconName}
                    viewBox="0 0 24 24"
                    preserveAspectRatio="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="box-border w-[15px] shrink-0 h-[15px] overflow-visible transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  >
                    <path
                      d="M9 6.65032c0 0 6.9383-0.54273 7.9154 0.43431 0.977 0.97704 0.4342 7.91537 0.4342 7.91537m-0.8496-7.5l-10 10"
                      fill="none"
                      stroke="#F4F4F66B"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Pricing Legal Nav */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            data-pencil-id="w3lm4"
            data-pencil-name="Pricing Legal Nav"
            className="box-border w-full h-fit shrink-0 flex flex-row gap-[28px] justify-center items-center"
          >
            {[
              { label: "Terms", id: "XUKhW", name: "Pricing Legal Terms", href: "/terms" },
              { label: "Privacy", id: "P8HmUi", name: "Pricing Legal Privacy", href: "/privacy" },
              { label: "Support", id: "M2QbJz", name: "Pricing Legal Support", href: "/support" },
            ].map((item) => (
              <Link
                key={item.id}
                href={item.href}
                data-pencil-id={item.id}
                data-pencil-name={item.name}
                className="min-h-[40px] inline-flex items-center px-2 text-[14.5px]/[normal] text-[#F4F4F6A3] hover:text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-normal whitespace-nowrap no-underline transition-colors rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090B]"
              >
                {item.label}
              </Link>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
