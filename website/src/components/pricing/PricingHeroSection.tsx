"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useScroll,
  useMotionValueEvent,
  useReducedMotion,
} from "framer-motion";
import { LivingRicoLogo } from "@/components/home/LivingRicoLogo";

const FREE_FEATURES = [
  {
    rowId: "xW59h",
    rowName: "Free Feature 1",
    wrapId: "z1XfRP",
    wrapName: "Free Feature 1 Check Wrap",
    checkId: "hwRA2",
    checkName: "Free Feature 1 Check",
    textId: "xHscQ",
    textName: "Free Feature 1 Text",
    text: "1,000 free credits for your first month",
  },
  {
    rowId: "MSAbo",
    rowName: "Free Feature 2",
    wrapId: "kg5XK",
    wrapName: "Free Feature 2 Check Wrap",
    checkId: "FNxaj",
    checkName: "Free Feature 2 Check",
    textId: "gfO23",
    textName: "Free Feature 2 Text",
    text: "250 free credits refreshed every month after",
  },
  {
    rowId: "OzeeM",
    rowName: "Free Feature 3",
    wrapId: "F6J3C",
    wrapName: "Free Feature 3 Check Wrap",
    checkId: "Ze23z",
    checkName: "Free Feature 3 Check",
    textId: "J2MuFn",
    textName: "Free Feature 3 Text",
    text: "Full access to the web app, price alerts and API",
  },
  {
    rowId: "edclO",
    rowName: "Free Feature 4",
    wrapId: "I1n1s8",
    wrapName: "Free Feature 4 Check Wrap",
    checkId: "pjQm5",
    checkName: "Free Feature 4 Check",
    textId: "C4BMW",
    textName: "Free Feature 4 Text",
    text: "Use your own API key anytime for unlimited use",
  },
];

const ENTERPRISE_FEATURES = [
  {
    id: "ent-feat-1",
    text: "Dedicated isolated CDP browser worker clusters",
  },
  {
    id: "ent-feat-2",
    text: "Multi-sig treasury approvals & custom spend caps",
  },
  {
    id: "ent-feat-3",
    text: "SOC 2 Type II, DPA & full IP indemnification",
  },
  {
    id: "ent-feat-4",
    text: "99.99% uptime SLA & shared Slack channel",
  },
];

export function PricingHeroSection() {
  const prefersReducedMotion = useReducedMotion();
  const [isScrolled, setIsScrolled] = useState(false);

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 48);
  });

  // Subtle 3D tilt for the Free Plan Card
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 140, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 140, damping: 20 });
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [4, -4]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-4, 4]);

  // Subtle 3D tilt for the Enterprise Plan Card
  const entMouseX = useMotionValue(0);
  const entMouseY = useMotionValue(0);
  const entSmoothX = useSpring(entMouseX, { stiffness: 140, damping: 20 });
  const entSmoothY = useSpring(entMouseY, { stiffness: 140, damping: 20 });
  const entRotateX = useTransform(entSmoothY, [-0.5, 0.5], [4, -4]);
  const entRotateY = useTransform(entSmoothX, [-0.5, 0.5], [-4, 4]);

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleCardMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleEntCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    entMouseX.set(x);
    entMouseY.set(y);
  };

  const handleEntCardMouseLeave = () => {
    entMouseX.set(0);
    entMouseY.set(0);
  };

  return (
    <section
      data-pencil-id="DLlTg"
      data-pencil-name="Pricing Hero Section"
      className="box-border w-full shrink-0 overflow-hidden relative flex flex-col items-center pb-10 sm:pb-12"
    >
      {/* Full-bleed Sky Background with slow breathing zoom */}
      <motion.div
        data-pencil-id="U0X0P"
        data-pencil-name="Pricing Sky Background"
        initial={{ scale: 1.06 }}
        animate={{ scale: [1.06, 1.0, 1.06] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
        className="box-border w-full h-full absolute inset-0 bg-[url('/assets/sky-day-1672.jpg')] bg-no-repeat bg-cover bg-center [z-index:0]"
      />

      {/* Pricing Sky Tint */}
      <div
        data-pencil-id="aD59I"
        data-pencil-name="Pricing Sky Tint"
        className="box-border w-full h-full absolute inset-0 [background-image:linear-gradient(180deg,_#0E26501F_0%,_#0C285C47_35%,_#1A3F7A4D_72%,_#09090B00_100%)] bg-no-repeat bg-[length:100%_100%] [z-index:1]"
      />

      {/* Ambient floating light orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden [z-index:1]">
        <motion.div
          animate={{
            x: [0, 40, -20, 0],
            y: [0, -30, 20, 0],
            opacity: [0.22, 0.42, 0.22],
          }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[10%] left-[22%] w-[360px] h-[360px] rounded-full bg-white/10 blur-[90px]"
        />
        <motion.div
          animate={{
            x: [0, -50, 30, 0],
            y: [0, 25, -25, 0],
            opacity: [0.16, 0.36, 0.16],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[24%] right-[18%] w-[420px] h-[420px] rounded-full bg-[#B4CFEE]/20 blur-[110px]"
        />
      </div>

      {/* Pricing Sky Bottom Veil */}
      <div
        data-pencil-id="O4HqdI"
        data-pencil-name="Pricing Sky Bottom Veil"
        className="box-border w-full h-[360px] absolute inset-x-0 bottom-0 [background-image:linear-gradient(180deg,_#09090B00_0%,_#09090B33_28%,_#09090B8C_61%,_#09090BE0_86%,_#09090B_100%)] bg-no-repeat bg-[length:100%_100%] [z-index:2]"
      />

      {/* Spacer for fixed header */}
      <div className="w-full h-[64px] shrink-0" />

      {/* Fixed Site Navigation (matches Homepage navbar with Living RICO Logo) */}
      <motion.header
        data-pencil-id="wjTe1"
        data-pencil-name="Site Navigation"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`box-border w-full fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-[#09090B]/75 backdrop-blur-xl border-b border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.45)]"
            : "bg-transparent"
        }`}
      >
        <div className="w-full max-w-[1280px] mx-auto h-[64px] px-4 sm:px-6 lg:px-[40px] flex flex-row justify-between items-center">
          <LivingRicoLogo showStageBadge={true} />

          <nav
            data-pencil-id="eilHZ"
            data-pencil-name="Nav Links"
            className="box-border hidden md:flex w-fit shrink-0 h-fit flex-row gap-[4px] justify-start items-center"
          >
            {[
              { label: "Docs", id: "U1zf7G", textId: "o07KiE", href: "/docs" },
              { label: "Workflows", id: "rILvO", textId: "Y8YEx", href: "/workflows" },
              { label: "Pricing", id: "gZYix", textId: "KH0pj", href: "/pricing" },
              { label: "Roadmap", id: "b4bbo", textId: "PI45P", href: "/roadmap" },
              { label: "Changelog", id: "a6Rvho", textId: "zKBur", href: "/changelog" },
              { label: "About", id: "t3qXo", textId: "Wrb6u", href: "/about" },
            ].map((item) => (
              <Link key={item.label} href={item.href} className="no-underline">
                <motion.div
                  data-pencil-id={item.id}
                  data-pencil-name={`Nav ${item.label}`}
                  whileHover={{ scale: 1.04, backgroundColor: "rgba(255,255,255,0.12)" }}
                  whileTap={{ scale: 0.97 }}
                  className="box-border w-fit shrink-0 h-fit flex flex-row gap-0 p-[6px_12px] justify-center items-center rounded-[999px] transition-colors cursor-pointer"
                >
                  <div
                    data-pencil-id={item.textId}
                    data-pencil-name={`${item.label} Label`}
                    className="text-[14px]/[normal] box-border text-[#FFFFFFD9] font-[Geist,system-ui,sans-serif] font-medium tracking-[-0.08px] text-left [white-space:nowrap]"
                  >
                    {item.label}
                  </div>
                </motion.div>
              </Link>
            ))}
          </nav>

          <div
            data-pencil-id="vT4vF"
            data-pencil-name="Nav Actions"
            className="box-border w-fit shrink-0 h-fit flex flex-row gap-[10px] justify-start items-center"
          >
            <motion.a
              href="https://github.com/abrarnasirjaffari/Rico-Website"
              target="_blank"
              rel="noreferrer"
              whileHover={{ scale: 1.04, backgroundColor: "rgba(255,255,255,0.12)" }}
              whileTap={{ scale: 0.96 }}
              data-pencil-id="F2kxJS"
              data-pencil-name="Nav GitHub Button"
              className="box-border w-fit shrink-0 h-[34px] flex flex-row gap-[7px] p-[0px_14px_0px_11px] justify-start items-center [outline:1px_solid_#FFFFFF66] [outline-offset:-0.5px] rounded-[999px] cursor-pointer no-underline"
            >
              <svg
                data-pencil-id="TuFs7"
                data-pencil-name="GitHub Icon"
                viewBox="0 0 24 24"
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
                className="box-border w-[15px] shrink-0 h-[15px] overflow-visible"
              >
                <path
                  d="M12 0.297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385 0.6 0.113 0.82-0.258 0.82-0.577 0-0.285-0.01-1.04-0.015-2.04-3.338 0.724-4.042-1.61-4.042-1.61-0.546-1.385-1.335-1.755-1.335-1.755-1.087-0.744 0.084-0.729 0.084-0.729 1.205 0.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495 0.998 0.108-0.776 0.417-1.305 0.76-1.605-2.665-0.3-5.466-1.332-5.466-5.93 0-1.31 0.465-2.38 1.235-3.22-0.135-0.303-0.54-1.523 0.105-3.176 0 0 1.005-0.322 3.3 1.23 0.96-0.267 1.98-0.399 3-0.405 1.02 0.006 2.04 0.138 3 0.405 2.28-1.552 3.285-1.23 3.285-1.23 0.645 1.653 0.24 2.873 0.12 3.176 0.765 0.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92 0.42 0.36 0.81 1.096 0.81 2.22 0 1.606-0.015 2.896-0.015 3.286 0 0.315 0.21 0.69 0.825 0.57 4.801-1.574 8.236-6.074 8.236-11.369 0-6.627-5.373-12-12-12"
                  fill="#FFFFFF"
                />
              </svg>
              <div
                data-pencil-id="ZIzod"
                data-pencil-name="GitHub Label"
                className="text-[14px]/[normal] box-border text-[#FFFFFF] font-[Geist,system-ui,sans-serif] font-medium tracking-[-0.14px] text-left [white-space:nowrap]"
              >
                GitHub
              </div>
            </motion.a>
          </div>
        </div>
      </motion.header>

      {/* Pricing Header */}
      <div
        data-pencil-id="AWFxX"
        data-pencil-name="Pricing Header"
        className="box-border w-full max-w-[736px] px-4 pt-[76px] sm:pt-[96px] lg:pt-[112px] h-fit flex flex-col gap-[20px] justify-start items-center relative [z-index:4]"
      >
        <div
          data-pencil-id="CPO1c"
          data-pencil-name="Pricing Title Stack"
          className="box-border w-fit h-fit shrink-0 flex flex-col gap-0 justify-start items-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.75, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            data-pencil-id="iCkJg"
            data-pencil-name="Pricing Title Line 1"
            className="text-[40px]/[42px] sm:text-[56px]/[58px] lg:text-[68px]/[68px] box-border text-[#FFFFFF] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-2px] sm:tracking-[-2.6px] lg:tracking-[-3.06px] text-center"
          >
            Completely free
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.75, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
            data-pencil-id="mEJCj"
            data-pencil-name="Pricing Title Line 2"
            className="text-[40px]/[42px] sm:text-[56px]/[58px] lg:text-[68px]/[68px] box-border text-[#FFFFFFD1] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-2px] sm:tracking-[-2.6px] lg:tracking-[-3.06px] text-center"
          >
            for now.
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.34, ease: [0.22, 1, 0.36, 1] }}
          data-pencil-id="HUegd"
          data-pencil-name="Pricing Lede"
          className="text-[17px]/[26px] sm:text-[20px]/[30px] box-border text-[#FFFFFFF0] font-[Geist,system-ui,sans-serif] font-normal text-center max-w-[580px]"
        >
          Start with 1,000 free credits for your first month, then 250 free credits every month
          after that—with zero cost. Or use your own key anytime for unlimited runs.
        </motion.div>
      </div>

      {/* Pricing Plans Grid */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.85, delay: 0.42, ease: [0.22, 1, 0.36, 1] }}
        style={{ perspective: 1400 }}
        data-pencil-id="IW31I"
        data-pencil-name="Pricing Plans Grid"
        className="box-border w-full max-w-[1000px] px-4 mt-[48px] sm:mt-[56px] h-fit flex flex-col lg:flex-row gap-[18px] justify-center items-center lg:items-stretch relative [z-index:5]"
      >
        <motion.div
          onMouseMove={handleCardMouseMove}
          onMouseLeave={handleCardMouseLeave}
          style={
            prefersReducedMotion
              ? undefined
              : { rotateX, rotateY, transformStyle: "preserve-3d" }
          }
          whileHover={prefersReducedMotion ? undefined : { y: -4 }}
          data-pencil-id="ZF4yl"
          data-pencil-name="Free Plan Card"
          className="box-border w-full max-w-[480px] lg:flex-1 shrink-0 h-auto [backdrop-filter:blur(14px)] flex flex-col gap-0 p-[28px] justify-start items-start bg-[#203354AB] [outline:1px_solid_#FFFFFF80] [outline-offset:-0.5px] rounded-[20px] [box-shadow:0px_28px_70px_rgba(10,30,60,0.42)] hover:[box-shadow:0px_36px_90px_rgba(10,30,60,0.62)] transition-shadow duration-300"
        >
          <div
            data-pencil-id="iQ7ij"
            data-pencil-name="Free Title"
            className="text-[19px]/[29px] box-border text-[#FFFFFF] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-0.38px] text-left [white-space:nowrap]"
          >
            Free
          </div>
          <div
            data-pencil-id="NQjP2"
            data-pencil-name="Free Blurb Wrap"
            className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[6px_0px_0px_0px] justify-start items-start"
          >
            <div
              data-pencil-id="ciZpX"
              data-pencil-name="Free Blurb"
              className="text-[15px]/[23px] box-border [flex:1_1_0] text-[#FFFFFFDB] font-[Geist,system-ui,sans-serif] font-normal text-left"
            >
              Everything in RICO, completely free to use.
            </div>
          </div>
          <div
            data-pencil-id="Yjy7z"
            data-pencil-name="Free Pricing Block"
            className="box-border w-full h-fit shrink-0 flex flex-col gap-[10px] p-[28px_0px_0px_0px] justify-start items-start"
          >
            <div
              data-pencil-id="nOvjh"
              data-pencil-name="Free Price Row"
              className="box-border w-fit h-fit shrink-0 flex flex-row gap-[6px] justify-start items-end"
            >
              <div
                data-pencil-id="j6UWN"
                data-pencil-name="Free Price Figure"
                className="text-[48px]/[48px] box-border text-[#FFFFFF] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-2.16px] text-left [white-space:nowrap]"
              >
                $0
              </div>
              <div
                data-pencil-id="s5IbeX"
                data-pencil-name="Free Price Per Wrap"
                className="box-border w-fit shrink-0 h-fit flex flex-row gap-0 p-[0px_0px_5px_0px] justify-start items-start"
              >
                <div
                  data-pencil-id="m4XJUK"
                  data-pencil-name="Free Price Per"
                  className="text-[16px]/[normal] box-border text-[#FFFFFFDB] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                >
                  free for now
                </div>
              </div>
            </div>
            <div
              data-pencil-id="vch1p"
              data-pencil-name="Free Billed Note"
              className="text-[14px]/[20px] box-border text-[#FFFFFFC2] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
            >
              No credit card required · Zero cost
            </div>
          </div>
          <div
            data-pencil-id="X4YQ1l"
            data-pencil-name="Free Credits Outer"
            className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[20px_0px_0px_0px] justify-start items-start"
          >
            <motion.div
              whileHover={
                prefersReducedMotion
                  ? undefined
                  : { scale: 1.015, backgroundColor: "rgba(255,255,255,0.12)" }
              }
              transition={{ duration: 0.2 }}
              data-pencil-id="efThc"
              data-pencil-name="Free Credits Box"
              className="box-border [flex:1_1_0] min-h-[57px] flex flex-row gap-[12px] p-[12px_14px] justify-start items-center bg-[#FFFFFF14] [outline:1px_solid_#FFFFFF33] [outline-offset:-0.5px] rounded-[12px]"
            >
              <div
                data-pencil-id="K11dl5"
                data-pencil-name="Free Credits Amount"
                className="text-[22px]/[normal] box-border text-[#F2F5FF] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-0.66px] text-left [white-space:nowrap]"
              >
                1,000
              </div>
              <div
                data-pencil-id="Ani04"
                data-pencil-name="Free Credits Description"
                className="text-[12.5px]/[16px] box-border text-[#FFFFFFDB] font-[Geist,system-ui,sans-serif] font-normal text-left"
              >
                free credits for your first month
                <br />
                then 250 free credits every month
              </div>
            </motion.div>
          </div>
          <div
            data-pencil-id="nZKAZ"
            data-pencil-name="Free CTA Outer"
            className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[24px_0px_0px_0px] justify-start items-start"
          >
            <Link
              href="/docs/getting-started"
              className="w-full no-underline rounded-[999px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#203354]"
            >
              <motion.span
                whileHover={
                  prefersReducedMotion
                    ? undefined
                    : {
                        scale: 1.02,
                        boxShadow: "0px 10px 30px rgba(255, 255, 255, 0.28)",
                      }
                }
                whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                data-pencil-id="uMwGA"
                data-pencil-name="Free CTA Button"
                className="box-border w-full h-[46px] flex flex-row gap-0 justify-center items-center bg-[#FFFFFF] rounded-[999px] cursor-pointer select-none"
              >
                <span
                  data-pencil-id="k9RMOp"
                  data-pencil-name="Free CTA Label"
                  className="text-[15.5px]/[normal] box-border text-[#0B1F36] font-[Geist,system-ui,sans-serif] font-medium tracking-[-0.186px] text-left [white-space:nowrap]"
                >
                  Start Free
                </span>
              </motion.span>
            </Link>
          </div>
          <div
            data-pencil-id="S3BfmG"
            data-pencil-name="Free Features Outer"
            className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[28px_0px_0px_0px] justify-start items-start"
          >
            <div
              data-pencil-id="WOFEU"
              data-pencil-name="Free Features List"
              className="box-border w-full flex flex-col gap-[12px] pt-[24px] justify-start items-start border-t border-[#FFFFFF38]"
            >
              {FREE_FEATURES.map((feat, idx) => (
                <motion.div
                  key={feat.rowId}
                  initial={prefersReducedMotion ? false : { opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.45, delay: 0.55 + idx * 0.08 }}
                  whileHover={prefersReducedMotion ? undefined : { x: 4 }}
                  data-pencil-id={feat.rowId}
                  data-pencil-name={feat.rowName}
                  className="box-border w-full h-fit shrink-0 flex flex-row gap-[10px] justify-start items-start cursor-default"
                >
                  <div
                    data-pencil-id={feat.wrapId}
                    data-pencil-name={feat.wrapName}
                    className="box-border w-[16px] shrink-0 h-[22px] flex flex-row gap-0 p-[3px_0px_0px_0px] justify-center items-center"
                  >
                    <svg
                      aria-hidden="true"
                      data-pencil-id={feat.checkId}
                      data-pencil-name={feat.checkName}
                      viewBox="0 0 24 24"
                      preserveAspectRatio="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="box-border w-[16px] shrink-0 h-[16px] overflow-visible"
                    >
                      <path
                        d="M5 14l3.5 3.5 10.5-11"
                        fill="none"
                        stroke="#FFFFFF"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>
                  </div>
                  <div
                    data-pencil-id={feat.textId}
                    data-pencil-name={feat.textName}
                    className="text-[15px]/[23px] box-border [flex:1_1_0] text-[#FFFFFFDB] font-[Geist,system-ui,sans-serif] font-normal text-left"
                  >
                    {feat.text}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Enterprise Plan Card */}
        <motion.div
          onMouseMove={handleEntCardMouseMove}
          onMouseLeave={handleEntCardMouseLeave}
          style={
            prefersReducedMotion
              ? undefined
              : {
                  rotateX: entRotateX,
                  rotateY: entRotateY,
                  transformStyle: "preserve-3d",
                }
          }
          whileHover={prefersReducedMotion ? undefined : { y: -4 }}
          data-pencil-name="Enterprise Plan Card"
          className="box-border w-full max-w-[480px] lg:flex-1 shrink-0 h-auto [backdrop-filter:blur(14px)] flex flex-col gap-0 p-[28px] justify-start items-start bg-[#182946BA] [outline:1px_solid_#FFFFFF66] [outline-offset:-0.5px] rounded-[20px] [box-shadow:0px_28px_70px_rgba(10,30,60,0.42)] hover:[box-shadow:0px_36px_90px_rgba(10,30,60,0.62)] transition-shadow duration-300"
        >
          <div className="w-full flex flex-row items-center justify-between gap-2">
            <div className="text-[19px]/[29px] box-border text-[#FFFFFF] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-0.38px] text-left [white-space:nowrap]">
              Enterprise
            </div>
            <span className="px-2.5 py-0.5 rounded-[999px] bg-[#FFFFFF17] [outline:1px_solid_#FFFFFF3D] text-[11.5px]/[16px] text-[#FFFFFFE6] font-[Geist,system-ui,sans-serif] font-medium tracking-[-0.08px]">
              Organizations
            </span>
          </div>

          <div className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[6px_0px_0px_0px] justify-start items-start">
            <div className="text-[15px]/[23px] box-border [flex:1_1_0] text-[#FFFFFFDB] font-[Geist,system-ui,sans-serif] font-normal text-left">
              Custom infrastructure, governance, and SLAs for teams.
            </div>
          </div>

          <div className="box-border w-full h-fit shrink-0 flex flex-col gap-[10px] p-[28px_0px_0px_0px] justify-start items-start">
            <div className="box-border w-fit h-fit shrink-0 flex flex-row gap-[8px] justify-start items-end">
              <div className="text-[44px]/[48px] sm:text-[48px]/[48px] box-border text-[#FFFFFF] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-2.06px] text-left [white-space:nowrap]">
                Custom
              </div>
              <div className="box-border w-fit shrink-0 h-fit flex flex-row gap-0 p-[0px_0px_5px_0px] justify-start items-start">
                <div className="text-[16px]/[normal] box-border text-[#FFFFFFDB] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]">
                  contact us
                </div>
              </div>
            </div>
            <div className="text-[14px]/[20px] box-border text-[#FFFFFFC2] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]">
              Tailored deployment · Annual or custom terms
            </div>
          </div>

          <div className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[20px_0px_0px_0px] justify-start items-start">
            <motion.div
              whileHover={
                prefersReducedMotion
                  ? undefined
                  : { scale: 1.015, backgroundColor: "rgba(255,255,255,0.12)" }
              }
              transition={{ duration: 0.2 }}
              className="box-border [flex:1_1_0] min-h-[57px] flex flex-row gap-[12px] p-[12px_14px] justify-start items-center bg-[#FFFFFF14] [outline:1px_solid_#FFFFFF33] [outline-offset:-0.5px] rounded-[12px]"
            >
              <div className="text-[22px]/[normal] box-border text-[#F2F5FF] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-0.66px] text-left [white-space:nowrap]">
                SLA
              </div>
              <div className="text-[12.5px]/[16px] box-border text-[#FFFFFFDB] font-[Geist,system-ui,sans-serif] font-normal text-left">
                dedicated browser clusters, custom guardrails
                <br />
                &amp; 1-hour priority maintainer support
              </div>
            </motion.div>
          </div>

          <div className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[24px_0px_0px_0px] justify-start items-start">
            <Link
              href="/pricing/enterprise"
              className="w-full no-underline rounded-[999px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#182946]"
            >
              <motion.span
                whileHover={
                  prefersReducedMotion
                    ? undefined
                    : {
                        scale: 1.02,
                        backgroundColor: "rgba(255, 255, 255, 0.24)",
                        boxShadow: "0px 10px 30px rgba(10, 30, 60, 0.45)",
                      }
                }
                whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                className="box-border w-full h-[46px] flex flex-row gap-2 justify-center items-center bg-[#FFFFFF1C] [outline:1px_solid_#FFFFFF80] [outline-offset:-0.5px] rounded-[999px] cursor-pointer select-none transition-colors"
              >
                <span className="text-[15.5px]/[normal] box-border text-[#FFFFFF] font-[Geist,system-ui,sans-serif] font-medium tracking-[-0.186px] text-left [white-space:nowrap]">
                  Contact Us
                </span>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="w-[15px] h-[15px] shrink-0 overflow-visible"
                >
                  <path
                    d="M5 12h14m-6-6l6 6-6 6"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.span>
            </Link>
          </div>

          <div className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[28px_0px_0px_0px] justify-start items-start">
            <div className="box-border w-full flex flex-col gap-[12px] pt-[24px] justify-start items-start border-t border-[#FFFFFF38]">
              {ENTERPRISE_FEATURES.map((feat, idx) => (
                <motion.div
                  key={feat.id}
                  initial={prefersReducedMotion ? false : { opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.45, delay: 0.6 + idx * 0.08 }}
                  whileHover={prefersReducedMotion ? undefined : { x: 4 }}
                  className="box-border w-full h-fit shrink-0 flex flex-row gap-[10px] justify-start items-start cursor-default"
                >
                  <div className="box-border w-[16px] shrink-0 h-[22px] flex flex-row gap-0 p-[3px_0px_0px_0px] justify-center items-center">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      preserveAspectRatio="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="box-border w-[16px] shrink-0 h-[16px] overflow-visible"
                    >
                      <path
                        d="M5 14l3.5 3.5 10.5-11"
                        fill="none"
                        stroke="#FFFFFF"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>
                  </div>
                  <div className="text-[15px]/[23px] box-border [flex:1_1_0] text-[#FFFFFFDB] font-[Geist,system-ui,sans-serif] font-normal text-left">
                    {feat.text}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Pricing Checkout Note — sits right below the Free Plan card */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.65 }}
        data-pencil-id="E4BntU"
        data-pencil-name="Pricing Checkout Note"
        className="mt-8 px-4 text-[14px]/[21px] box-border text-[#F4F4F66B] font-[Geist,system-ui,sans-serif] font-normal text-center relative [z-index:5]"
      >
        RICO is completely free to use with no credit card required.
        <br />
        Sign in to get your 1,000 first-month credits and API key right away.
      </motion.div>
    </section>
  );
}
