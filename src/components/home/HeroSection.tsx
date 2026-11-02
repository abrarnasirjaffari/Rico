"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform, useScroll, useMotionValueEvent } from "framer-motion";
import { LivingRicoLogo } from "@/components/home/LivingRicoLogo";

const MANDATE_TABS = [
  { id: "netflix", title: "Netflix Standard HD · $15.49", type: "eleven" },
  { id: "spotify", title: "Spotify Student · $5.99", type: "linear" },
  { id: "posthog", title: "PostHog Credits · $50k", type: "notion" },
  { id: "github", title: "abrarnasirjaffari/Rico · GitHub", type: "github" },
  { id: "notion", title: "Notion Plus · $10.00", type: "stay" },
  { id: "copilot", title: "GitHub Copilot · $19.00", type: "flight" },
  { id: "command", title: "Command Center", type: "globe" },
];

export function HeroSection() {
  const [activeMode, setActiveMode] = useState<"mandates" | "command">("mandates");
  const [activeTab, setActiveTab] = useState<string>("command");
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isScrolled, setIsScrolled] = useState(false);

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 48);
  });

  // Subtle 3D tilt for the Product Window
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 120, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 120, damping: 20 });
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [3.5, -3.5]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-3.5, 3.5]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 8);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleWindowMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleWindowMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <section
      data-pencil-id="iphF8"
      data-pencil-name="Hero Section"
      className="box-border w-full shrink-0 overflow-hidden relative flex flex-col items-center pb-12 md:pb-16"
    >
      {/* Full-bleed Sky Background with slow breathing zoom */}
      <motion.div
        data-pencil-id="HBFBq"
        data-pencil-name="Hero Sky Background"
        initial={{ scale: 1.06 }}
        animate={{ scale: [1.06, 1.0, 1.06] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
        className="box-border w-full h-full absolute inset-0 bg-[url('/assets/sky-day-1672.jpg')] bg-no-repeat bg-cover bg-center [z-index:0]"
      />

      {/* Ambient floating light orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden [z-index:1]">
        <motion.div
          animate={{
            x: [0, 40, -20, 0],
            y: [0, -30, 20, 0],
            opacity: [0.25, 0.45, 0.25],
          }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[12%] left-[20%] w-[360px] h-[360px] rounded-full bg-white/10 blur-[90px]"
        />
        <motion.div
          animate={{
            x: [0, -50, 30, 0],
            y: [0, 25, -25, 0],
            opacity: [0.18, 0.38, 0.18],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[22%] right-[15%] w-[420px] h-[420px] rounded-full bg-[#B4CFEE]/20 blur-[110px]"
        />
      </div>

      {/* Bottom Gradient Veil */}
      <div
        data-pencil-id="YqWMI"
        data-pencil-name="Hero Sky Bottom Veil"
        className="box-border w-full h-[360px] md:h-[440px] absolute inset-x-0 bottom-0 [background-image:linear-gradient(180deg,_#09090B00_0%,_#09090B66_45%,_#09090BD9_80%,_#09090B_100%)] bg-no-repeat bg-[length:100%_100%] [z-index:1]"
      />

      {/* Spacer when nav becomes fixed */}
      <div className="w-full h-[64px] shrink-0" />

      {/* Site Navigation (Fixed so the Living RICO Logo moves & morphs as you scroll) */}
      <motion.header
        data-pencil-id="h2Jju"
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
        <div className="w-full max-w-[1280px] mx-auto h-[64px] px-4 sm:px-6 lg:px-10 flex flex-row justify-between items-center">
          <LivingRicoLogo showStageBadge={true} />

          <nav
            data-pencil-id="ljans"
            data-pencil-name="Nav Links"
            className="box-border hidden md:flex w-fit shrink-0 h-fit flex-row gap-1 justify-start items-center"
          >
            {["Docs", "Workflows", "Pricing", "Roadmap", "Changelog", "About"].map((label) => (
              <Link
                key={label}
                href={label === "Pricing" ? "/pricing" : "#"}
                className="no-underline"
              >
                <motion.div
                  whileHover={{ scale: 1.04, backgroundColor: "rgba(255,255,255,0.12)" }}
                  whileTap={{ scale: 0.97 }}
                  className="box-border w-fit shrink-0 h-fit flex flex-row gap-0 px-3 py-1.5 justify-center items-center rounded-[999px] transition-colors cursor-pointer"
                >
                  <div className="text-[14px]/[normal] box-border text-[#FFFFFFD9] font-[Geist,system-ui,sans-serif] font-medium tracking-[-0.08px] text-left [white-space:nowrap]">
                    {label}
                  </div>
                </motion.div>
              </Link>
            ))}
          </nav>

          <div
            data-pencil-id="Rb69Z"
            data-pencil-name="Nav Actions"
            className="box-border w-fit shrink-0 h-fit flex flex-row gap-[10px] justify-start items-center"
          >
            <motion.a
              href="https://github.com/abrarnasirjaffari/Rico-Website"
              target="_blank"
              rel="noreferrer"
              whileHover={{ scale: 1.04, backgroundColor: "rgba(255,255,255,0.12)" }}
              whileTap={{ scale: 0.96 }}
              data-pencil-id="Rnnok"
              data-pencil-name="Nav GitHub Button"
              className="box-border w-fit shrink-0 h-[34px] flex flex-row gap-[7px] p-[0px_14px_0px_11px] justify-start items-center [outline:1px_solid_#FFFFFF66] [outline-offset:-0.5px] rounded-[999px] cursor-pointer no-underline"
            >
              <svg
                data-pencil-id="OlpII"
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
                data-pencil-id="R2MxF"
                data-pencil-name="GitHub Label"
                className="text-[14px]/[normal] box-border text-[#FFFFFF] font-[Geist,system-ui,sans-serif] font-medium tracking-[-0.14px] text-left [white-space:nowrap]"
              >
                GitHub
              </div>
            </motion.a>
          </div>
        </div>
      </motion.header>

      {/* Mobile Sub-nav */}
      <div className="flex md:hidden w-full overflow-x-auto px-4 py-1.5 gap-1 justify-start sm:justify-center items-center relative [z-index:2]">
        {["Docs", "Workflows", "Pricing", "Roadmap", "Changelog", "About"].map((item) => (
          <div
            key={item}
            className="shrink-0 px-2.5 py-1 rounded-full text-[13px] text-[#FFFFFFD9] font-medium"
          >
            {item}
          </div>
        ))}
      </div>

      {/* Hero Copy */}
      <div
        data-pencil-id="U6SYN8"
        data-pencil-name="Hero Copy"
        className="box-border w-full max-w-[1280px] mx-auto px-4 sm:px-6 pt-10 sm:pt-14 md:pt-16 lg:pt-20 flex flex-col gap-0 justify-start items-center relative [z-index:3]"
      >
        <div
          data-pencil-id="N3TCCR"
          data-pencil-name="Hero Title Wrap"
          className="box-border w-full h-fit shrink-0 flex flex-col gap-[2px] justify-start items-center"
        >
          <motion.h1
            initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.75, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            data-pencil-id="UDBui"
            data-pencil-name="Hero Headline Line 1"
            className="m-0 text-[32px]/[35px] sm:text-[44px]/[46px] md:text-[52px]/[54px] lg:text-[64px]/[64px] xl:text-[76px]/[74px] box-border text-[#FFFFFF] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-1.5px] sm:tracking-[-2.2px] lg:tracking-[-3.2px] xl:tracking-[-3.8px] text-center"
          >
            An autonomous financial agent,
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.75, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
            data-pencil-id="dd6OT"
            data-pencil-name="Hero Headline Line 2"
            className="text-[32px]/[35px] sm:text-[44px]/[46px] md:text-[52px]/[54px] lg:text-[64px]/[64px] xl:text-[76px]/[74px] box-border font-[Geist,system-ui,sans-serif] font-semibold tracking-[-1.5px] sm:tracking-[-2.2px] lg:tracking-[-3.2px] xl:tracking-[-3.8px] text-center pb-1"
            style={{
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              backgroundImage: "linear-gradient(0deg, #E2EEFB 0%, #B4CFEE 100%)",
              backgroundRepeat: "no-repeat",
              backgroundSize: "100% 100%",
              color: "transparent",
            }}
          >
            reimagined for you and your payments.
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          data-pencil-id="zB8US"
          data-pencil-name="Hero Lede Wrap"
          className="box-border w-full h-fit shrink-0 flex flex-row gap-0 pt-5 sm:pt-6 justify-center items-center"
        >
          <p
            data-pencil-id="aLMGA"
            data-pencil-name="Hero Lede"
            className="m-0 text-[16px]/[24px] sm:text-[18px]/[26px] xl:text-[20.5px]/[normal] box-border text-[#FFFFFFE6] font-[Geist,system-ui,sans-serif] font-normal tracking-[-0.25px] text-center max-w-[680px]"
          >
            Autonomous price verification and smart guardrails. Free and open source.
          </p>
        </motion.div>
      </div>

      {/* Product Window with 3D tilt */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, delay: 0.42, ease: [0.22, 1, 0.36, 1] }}
        style={{ perspective: 1400 }}
        className="w-full max-w-[1244px] mx-auto px-4 sm:px-6 mt-10 sm:mt-14 md:mt-16 relative [z-index:4]"
      >
        <motion.div
          onMouseMove={handleWindowMouseMove}
          onMouseLeave={handleWindowMouseLeave}
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          data-pencil-id="x2RiHC"
          data-pencil-name="Product Window"
          className="box-border w-full h-auto md:h-[580px] lg:h-[640px] xl:h-[700px] [box-shadow:0px_30px_80px_#0A1E3C73] [backdrop-filter:blur(25px)] bg-[#102238B0] [outline:1px_solid_#FFFFFF2E] [outline-offset:-0.5px] rounded-[20px] overflow-hidden flex flex-col md:flex-row transition-shadow duration-300 hover:[box-shadow:0px_40px_100px_#0A1E3C99]"
        >
          {/* Window Sidebar */}
          <div
            data-pencil-id="Wr3gH"
            data-pencil-name="Window Sidebar"
            className="box-border w-full md:w-[220px] lg:w-[254px] shrink-0 h-auto md:h-full flex flex-col gap-2 md:gap-0 p-[8px] md:p-[4px_8px_8px_8px] justify-between items-start"
          >
            <div
              data-pencil-id="IaUWe"
              data-pencil-name="Sidebar Top Group"
              className="box-border w-full h-fit shrink-0 flex flex-col gap-0 justify-start items-start"
            >
              <div
                data-pencil-id="R3l4nE"
                data-pencil-name="Sidebar Toolbar"
                className="box-border w-full h-[38px] shrink-0 flex flex-row gap-0 p-[0px_8px_0px_6px] justify-between items-center"
              >
                <div
                  data-pencil-id="pkS4F"
                  data-pencil-name="Window Controls Left"
                  className="box-border w-fit shrink-0 h-fit flex flex-row gap-[14px] justify-start items-center"
                >
                  <div
                    data-pencil-id="oyRPP"
                    data-pencil-name="Traffic Lights"
                    className="box-border w-fit shrink-0 h-fit flex flex-row gap-[9px] justify-start items-center group"
                  >
                    <div
                      data-pencil-id="yyhdc"
                      data-pencil-name="Close Light"
                      className="box-border w-[13.5px] shrink-0 h-[13.5px] bg-[#FFFFFF3D] group-hover:bg-[#FF5F56] transition-colors rounded-[50%]"
                    />
                    <div
                      data-pencil-id="P5vmCk"
                      data-pencil-name="Minimize Light"
                      className="box-border w-[13.5px] shrink-0 h-[13.5px] bg-[#FFFFFF3D] group-hover:bg-[#FFBD2E] transition-colors rounded-[50%]"
                    />
                    <div
                      data-pencil-id="EJ4nO"
                      data-pencil-name="Zoom Light"
                      className="box-border w-[13.5px] shrink-0 h-[13.5px] bg-[#FFFFFF3D] group-hover:bg-[#27C93F] transition-colors rounded-[50%]"
                    />
                  </div>
                  <svg
                    data-pencil-id="X0CmAk"
                    data-pencil-name="Sidebar Toggle Icon"
                    viewBox="0 0 24 24"
                    preserveAspectRatio="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="box-border w-[17px] shrink-0 h-[17px] overflow-visible"
                  >
                    <path
                      d="M2 12c0-3.68913 0-5.5337 0.81382-6.84123 0.30108-0.48375 0.67509-0.9045 1.10509-1.24323 1.16225-0.91554 2.80186-0.91554 6.08109-0.91554h4c3.2792 0 4.9188 0 6.0811 0.91554 0.43 0.33873 0.804 0.75948 1.1051 1.24323 0.8138 1.30753 0.8138 3.1521 0.8138 6.84123 0 3.6891 0 5.5337-0.8138 6.8412-0.3011 0.4838-0.6751 0.9045-1.1051 1.2433-1.1623 0.9155-2.8019 0.9155-6.0811 0.9155h-4c-3.27923 0-4.91884 0-6.08109-0.9155-0.43-0.3388-0.80401-0.7595-1.10509-1.2433-0.81382-1.3075-0.81382-3.1521-0.81382-6.8412z m7.5-9l0 18m-4.5-14h1m-1 3h1"
                      fill="none"
                      stroke="#F4F4F6B3"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                </div>
                <div
                  data-pencil-id="CYVQA"
                  data-pencil-name="Browser Nav Tools"
                  className="box-border w-fit shrink-0 h-fit flex flex-row gap-[10px] justify-start items-center"
                >
                  <svg
                    viewBox="0 0 24 24"
                    preserveAspectRatio="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="box-border w-[17px] shrink-0 h-[17px] overflow-visible"
                  >
                    <path
                      d="M15 6c0 0-5.99999 4.4189-6 6-0.00001 1.5812 6 6 6 6"
                      fill="none"
                      stroke="#F4F4F675"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                  <svg
                    viewBox="0 0 24 24"
                    preserveAspectRatio="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="box-border w-[17px] shrink-0 h-[17px] overflow-visible"
                  >
                    <path
                      d="M9.00005 6c0 0 5.99995 4.4189 5.99995 6 0 1.5812-6 6-6 6"
                      fill="none"
                      stroke="#F4F4F675"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                  <motion.svg
                    whileHover={{ rotate: 180 }}
                    transition={{ duration: 0.4 }}
                    viewBox="0 0 24 24"
                    preserveAspectRatio="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="box-border w-[17px] shrink-0 h-[17px] overflow-visible cursor-pointer"
                  >
                    <path
                      d="M16.5 7.99976h1.5c1.4142 0 2.1213 0 2.5607-0.43934 0.4393-0.43934 0.4393-1.14645 0.4393-2.56066v-1.5m-18 8.50004c0-4.97061 4.0293-9.00004 9-9.00004 3.571 0 6.0948 1.73053 8 4.08371m1 4.91633c0 4.9705-4.0293 9-9 9-3.57096 0-6.09476-1.7306-8-4.0838m3.5-0.9162h-1.5c-1.41421 0-2.12132 0-2.56066 0.4393-0.43934 0.4393-0.43934 1.1464-0.43934 2.5607v1.5"
                      fill="none"
                      stroke="#F4F4F6B3"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </motion.svg>
                </div>
              </div>

              {/* Interactive Mode Switcher */}
              <div
                data-pencil-id="AB0Fv"
                data-pencil-name="Mode Switcher"
                className="box-border w-full h-[29px] shrink-0 flex flex-row gap-0 p-[2.5px] justify-start items-center bg-[#FFFFFF17] rounded-[10px]"
              >
                <div
                  onClick={() => setActiveMode("mandates")}
                  data-pencil-id="U7u3jN"
                  data-pencil-name="Browse Mode Active"
                  className="box-border [flex:1_1_0] h-[24px] flex flex-row gap-[6px] justify-center items-center rounded-[8px] relative cursor-pointer"
                >
                  {activeMode === "mandates" && (
                    <motion.div
                      layoutId="heroModePill"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      className="absolute inset-0 bg-[#FFFFFF29] rounded-[8px]"
                    />
                  )}
                  <svg
                    viewBox="0 0 24 24"
                    preserveAspectRatio="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="box-border w-[14px] shrink-0 h-[14px] overflow-visible relative z-10"
                  >
                    <path
                      d="M12 22c5.5228 0 10-4.4772 10-10 0-5.52285-4.4772-10-10-10-5.52285 0-10 4.47715-10 10 0 5.5228 4.47715 10 10 10z m-4-10c0 6 4 10 4 10 0 0 4-4 4-10 0-6-4-10-4-10 0 0-4 4-4 10z m13 3h-18m18-6h-18"
                      fill="none"
                      stroke="#F4F4F6"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                  <div className="text-[13px]/[normal] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-medium text-left [white-space:nowrap] relative z-10">
                    Mandates
                  </div>
                </div>

                <div
                  onClick={() => setActiveMode("command")}
                  data-pencil-id="KvLaP"
                  data-pencil-name="Work Mode Inactive"
                  className="box-border [flex:1_1_0] h-[24px] flex flex-row gap-[6px] justify-center items-center rounded-[8px] relative cursor-pointer"
                >
                  {activeMode === "command" && (
                    <motion.div
                      layoutId="heroModePill"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      className="absolute inset-0 bg-[#FFFFFF29] rounded-[8px]"
                    />
                  )}
                  <svg
                    viewBox="0 0 24 24"
                    preserveAspectRatio="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="box-border w-[14px] shrink-0 h-[14px] overflow-visible relative z-10"
                  >
                    <path
                      d="M8.49869 6.50012c0-1.40446 0-2.10669 0.33706-2.61114 0.14592-0.21838 0.33342-0.40588 0.5518-0.5518 0.50444-0.33706 1.20665-0.33706 2.61115-0.33706 1.4045 0 2.1067 0 2.6111 0.33706 0.2184 0.14592 0.4059 0.33342 0.5518 0.5518 0.3371 0.50445 0.3371 1.20668 0.3371 2.61114m4.4994 0.00016l-15.99909-0.00016c-1.10446 0.00007-2.0001 0.89568-2.0002 2.00013 0.0001 2.20895 1.79139 4.00025 4.00035 4.00045h11.99884c2.2089-0.0001 4.0001-1.7913 4.0002-4.00028 0-1.10448-0.8956-2.00006-2.0001-2.00014z m-12.49941 4.49982v3m9.00001 0v-3m-14.49756-2.49998l-0.00215 5.49698c-0.00129 3.3009-0.00194 4.9514 1.02324 5.977 1.02518 1.0256 2.67566 1.0257 5.9766 1.0257l6.00107 0.0002c3.2993 0 4.949 0.0001 5.9741-1.0248 1.0251-1.0249 1.0254-2.6746 1.0261-5.9739l0.001-5.50118"
                      fill="none"
                      stroke="#F4F4F6B3"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                  <div className="text-[13px]/[normal] box-border text-[#F4F4F6B3] font-[Geist,system-ui,sans-serif] font-medium text-left [white-space:nowrap] relative z-10">
                    Command
                  </div>
                </div>
              </div>

              <div
                data-pencil-id="zSe2e"
                data-pencil-name="Sidebar Address Wrap"
                className="box-border hidden md:flex w-full h-fit shrink-0 flex-row gap-0 p-[7px_0px_0px_0px] justify-start items-start"
              >
                <div
                  data-pencil-id="BEHGO"
                  data-pencil-name="Sidebar Address Bar"
                  className="box-border [flex:1_1_0] h-[34px] flex flex-row gap-0 p-[0px_9px] justify-between items-center bg-[#FFFFFF17] rounded-[12px]"
                >
                  <div className="box-border w-[16px] shrink-0 h-[16px]" />
                  <div className="text-[13.5px]/[normal] box-border text-[#F4F4F675] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]">
                    New spending rule...
                  </div>
                  <svg
                    viewBox="0 0 24 24"
                    preserveAspectRatio="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="box-border w-[16px] shrink-0 h-[16px] overflow-visible"
                  >
                    <path
                      d="M2.5 12c0-4.47834 0-6.71751 1.39124-8.10876 1.39125-1.39124 3.63042-1.39124 8.10876-1.39124 4.4783 0 6.7175 0 8.1088 1.39124 1.3912 1.39125 1.3912 3.63042 1.3912 8.10876 0 4.4783 0 6.7175-1.3912 8.1088-1.3913 1.3912-3.6305 1.3912-8.1088 1.3912-4.47834 0-6.71751 0-8.10876-1.3912-1.39124-1.3913-1.39124-3.6305-1.39124-8.1088z m6-2c-0.82843 0-1.5-0.67157-1.5-1.5 0-0.82843 0.67157-1.5 1.5-1.5 0.82843 0 1.5 0.67157 1.5 1.5 0 0.82843-0.67157 1.5-1.5 1.5z m7 7c0.8284 0 1.5-0.6716 1.5-1.5 0-0.8284-0.6716-1.5-1.5-1.5-0.8284 0-1.5 0.6716-1.5 1.5 0 0.8284 0.6716 1.5 1.5 1.5z m-5.5-8.5l7 0m-3 7l-7 0"
                      fill="none"
                      stroke="#F4F4F6B3"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                </div>
              </div>

              <div
                data-pencil-id="CLINF"
                data-pencil-name="Sidebar Space Wrap"
                className="box-border hidden md:flex w-full h-fit shrink-0 flex-row gap-0 p-[12px_0px_4px_0px] justify-start items-start"
              >
                <div className="box-border [flex:1_1_0] h-[34px] flex flex-row gap-0 p-[0px_8px_0px_10px] justify-between items-center">
                  <div className="box-border w-fit shrink-0 h-fit flex flex-row gap-[6px] justify-start items-center">
                    <div className="text-[13px]/[normal] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold text-left [white-space:nowrap]">
                      Active Mandates
                    </div>
                    <svg
                      viewBox="0 0 24 24"
                      preserveAspectRatio="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="box-border w-[12px] shrink-0 h-[12px] overflow-visible"
                    >
                      <path
                        d="M18 9.00005c0 0-4.4189 5.99995-6 5.99995-1.5812 0-6-6-6-6"
                        fill="none"
                        stroke="#F4F4F675"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>
                  </div>
                  <svg
                    viewBox="0 0 24 24"
                    preserveAspectRatio="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="box-border w-[17px] shrink-0 h-[17px] overflow-visible"
                  >
                    <path
                      d="M12.001 5.00003v14.00197m7.001-7l-14.00202 0"
                      fill="none"
                      stroke="#F4F4F6B3"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                </div>
              </div>

              {/* Interactive Sidebar Tabs */}
              <div
                data-pencil-id="iT1CL"
                data-pencil-name="Sidebar Tabs List"
                className="box-border hidden md:flex w-full h-fit shrink-0 flex-col gap-[4px] justify-start items-start"
              >
                {MANDATE_TABS.map((tab) => {
                  const isSelected = activeTab === tab.id;
                  return (
                    <div
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className="box-border w-full h-[36px] shrink-0 flex flex-row gap-[10px] p-[0px_10px] justify-start items-center rounded-[12px] overflow-hidden relative cursor-pointer hover:bg-white/5 transition-colors"
                    >
                      {isSelected && (
                        <motion.div
                          layoutId="sidebarActiveTab"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          className="absolute inset-0 bg-[#FFFFFF29] rounded-[12px]"
                        />
                      )}
                      <div className="relative z-10 flex items-center justify-center shrink-0">
                        {tab.type === "eleven" && (
                          <div className="w-[16px] h-[16px] flex justify-center items-center bg-[#FFFFFF] rounded-[3.5px]">
                            <svg viewBox="0 0 24 24" className="w-[11px] h-[11px]">
                              <path
                                d="M4.6035 0v24h4.9317v-24z m9.8613 0v24h4.9317v-24z"
                                fill="#000000"
                              />
                            </svg>
                          </div>
                        )}
                        {tab.type === "linear" && (
                          <svg viewBox="0 0 100 100" className="w-[16px] h-[16px]">
                            <path
                              d="M1.225 61.523c-0.222-0.949 0.908-1.546 1.597-0.857l36.512 36.512c0.69 0.69 0.092 1.82-0.857 1.597-18.425-4.323-32.93-18.827-37.252-37.252z m-1.223-14.634a0.99 0.99 0 0 0 0.29 0.76l52.058 52.061c0.201 0.2 0.478 0.307 0.76 0.29 2.37-0.149 4.695-0.46 6.963-0.927 0.765-0.157 1.03-1.096 0.478-1.648l-57.975-57.977c-0.552-0.551-1.491-0.286-1.648 0.479a50.067 50.067 0 0 0-0.926 6.962z m4.208-17.184a0.988 0.988 0 0 0 0.208 1.1l64.776 64.776c0.289 0.29 0.726 0.375 1.1 0.208a49.908 49.908 0 0 0 5.185-2.684 0.981 0.981 0 0 0 0.183-1.54l-67.226-67.229a0.981 0.981 0 0 0-1.541 0.183 49.896 49.896 0 0 0-2.684 5.185z m8.448-11.631a0.986 0.986 0 0 1-0.045-1.354c9.167-10.26 22.498-16.72 37.339-16.72 27.64 0 50.048 22.407 50.048 50.048 0 14.84-6.46 28.172-16.72 37.338a0.986 0.986 0 0 1-1.354-0.045l-69.267-69.267z"
                              fill="#5E6AD2"
                            />
                          </svg>
                        )}
                        {tab.type === "notion" && (
                          <div className="w-[16px] h-[16px] flex justify-center items-center bg-[#FFFFFF] rounded-[3px]">
                            <svg viewBox="0 0 24 24" className="w-[13px] h-[13px]">
                              <path
                                d="M4.459 4.208c0.746 0.606 1.026 0.56 2.428 0.466l13.215-0.793c0.28 0 0.047-0.28-0.046-0.326l-2.196-1.587c-0.42-0.326-0.981-0.7-2.055-0.607l-12.795 0.934c-0.466 0.046-0.56 0.28-0.374 0.466z m0.793 3.08v13.904c0 0.747 0.373 1.027 1.214 0.98l14.523-0.84c0.841-0.046 0.935-0.56 0.935-1.167v-13.811c0-0.606-0.233-0.933-0.748-0.887l-15.177 0.887c-0.56 0.047-0.747 0.327-0.747 0.933z m14.337 0.745c0.093 0.42 0 0.84-0.42 0.888l-0.7 0.14v10.264c-0.608 0.327-1.168 0.514-1.635 0.514-0.748 0-0.935-0.234-1.495-0.933l-4.577-7.186v6.952l1.448 0.328s0 0.84-1.168 0.84l-3.222 0.186c-0.093-0.186 0-0.653 0.327-0.746l0.84-0.233v-9.193l-1.165-0.094c-0.094-0.42 0.14-1.026 0.793-1.073l3.456-0.233 4.764 7.279v-6.44l-1.215-0.139c-0.093-0.514 0.28-0.887 0.747-0.933z m-17.653-6.998l13.31-0.98c1.634-0.14 2.055-0.047 3.082 0.7l4.249 2.986c0.7 0.513 0.934 0.653 0.934 1.213v16.378c0 1.026-0.373 1.634-1.68 1.726l-15.458 0.934c-0.98 0.047-1.448-0.093-1.962-0.747l-3.129-4.06c-0.56-0.747-0.793-1.306-0.793-1.96v-14.558c0-0.839 0.374-1.54 1.447-1.632z"
                                fill="#000000"
                              />
                            </svg>
                          </div>
                        )}
                        {tab.type === "github" && (
                          <div className="w-[16px] h-[16px] bg-[url('/assets/marks-github-dark.png')] bg-no-repeat bg-contain bg-center" />
                        )}
                        {tab.type === "stay" && (
                          <div className="w-[16px] h-[16px] flex justify-center items-center bg-[#E8505B] rounded-[4px]">
                            <svg viewBox="0 0 24 24" className="w-[12px] h-[12px]">
                              <path
                                d="M5.5 11.6l6.5-5.6 6.5 5.6m-10.7-1.6v7.6h8.4v-7.6m-5.6 7.6v-3.4h2.8v3.4"
                                fill="none"
                                stroke="#FFFFFF"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                        )}
                        {tab.type === "flight" && (
                          <div className="w-[16px] h-[16px] flex justify-center items-center bg-[#1F6FE5] rounded-[4px]">
                            <svg viewBox="0 0 24 24" className="w-[12px] h-[12px]">
                              <path
                                d="M4.8 11.1l14.1-6-5.6 13.8-2.4-5.5-6.1-2.3z"
                                fill="#FFFFFF"
                              />
                            </svg>
                          </div>
                        )}
                        {tab.type === "globe" && (
                          <svg viewBox="0 0 24 24" className="w-[16px] h-[16px]">
                            <path
                              d="M12 22c5.5228 0 10-4.4772 10-10 0-5.52285-4.4772-10-10-10-5.52285 0-10 4.47715-10 10 0 5.5228 4.47715 10 10 10z m-4-10c0 6 4 10 4 10 0 0 4-4 4-10 0-6-4-10-4-10 0 0-4 4-4 10z m13 3h-18m18-6h-18"
                              fill="none"
                              stroke="#F4F4F6B3"
                              strokeWidth="1.6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                      <div
                        className={`text-[13px]/[normal] box-border font-[Geist,system-ui,sans-serif] text-left truncate relative z-10 ${
                          isSelected ? "text-[#F4F4F6] font-semibold" : "text-[#E4E6EA] font-normal"
                        }`}
                      >
                        {tab.title}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              data-pencil-id="OmcEG"
              data-pencil-name="Sidebar Bottom Dock"
              className="box-border hidden md:flex w-full h-[44px] shrink-0 flex-row gap-[6px] justify-start items-center"
            >
              <motion.div
                whileHover={{ scale: 1.06 }}
                className="box-border w-[40px] shrink-0 h-[40px] flex flex-row gap-0 justify-center items-center bg-[#FFFFFF1A] rounded-[999px] cursor-pointer"
              >
                <svg viewBox="0 0 24 24" className="w-[17px] h-[17px]">
                  <path
                    d="M20 21.0001c-0.287-3.7311-3.2711-6.685-7.005-6.9339l-0.995-0.0663c-0.3554 0.0097-0.6866 0.0226-0.9992 0.0379-3.7008 0.1814-6.71663 3.2679-7.0008 6.9623m12-14.0001c0 2.20914-1.7909 4-4 4-2.20914 0-4-1.79086-4-4 0-2.20914 1.79086-4 4-4 2.2091 0 4 1.79086 4 4z"
                    fill="none"
                    stroke="#E4E6EA"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.div>
              <div className="box-border w-[1px] shrink-0 h-[30px] bg-[#FFFFFF1F]" />
              <motion.div
                whileHover={{ y: -2, backgroundColor: "rgba(255,255,255,0.16)" }}
                className="box-border [flex:1_1_0] h-[44px] flex flex-row gap-0 justify-center items-center bg-[#FFFFFF1A] rounded-[18px] cursor-pointer"
              >
                <div className="box-border w-[18px] shrink-0 h-[18px] relative">
                  <svg
                    viewBox="0 0 2447.6 2452.5"
                    className="w-[18px] h-[18px] absolute left-0 top-0"
                  >
                    <path
                      d="M897.4 0c-135.3 0.1-244.8 109.9-244.7 245.2-0.1 135.3 109.5 245.1 244.8 245.2h244.8v-245.1c0.1-135.3-109.5-245.1-244.9-245.3 0.1 0 0.1 0 0 0m0 654h-652.6c-135.3 0.1-244.9 109.9-244.8 245.2-0.2 135.3 109.4 245.1 244.7 245.3h652.7c135.3-0.1 244.9-109.9 244.8-245.2 0.1-135.4-109.5-245.2-244.8-245.3z"
                      fill="#36C5F0"
                    />
                    <path
                      d="M2447.6 899.2c0.1-135.3-109.5-245.1-244.8-245.2-135.3 0.1-244.9 109.9-244.8 245.2v245.3h244.8c135.3-0.1 244.9-109.9 244.8-245.3z m-652.7 0v-654c0.1-135.2-109.4-245-244.7-245.2-135.3 0.1-244.9 109.9-244.8 245.2v654c-0.2 135.3 109.4 245.1 244.7 245.3 135.3-0.1 244.9-109.9 244.8-245.3z"
                      fill="#2EB67D"
                    />
                    <path
                      d="M1550.1 2452.5c135.3-0.1 244.9-109.9 244.8-245.2 0.1-135.3-109.5-245.1-244.8-245.2h-244.8v245.2c-0.1 135.2 109.5 245 244.8 245.2z m0-654.1h652.7c135.3-0.1 244.9-109.9 244.8-245.2 0.2-135.3-109.4-245.1-244.7-245.3h-652.7c-135.3 0.1-244.9 109.9-244.8 245.2-0.1-135.4 109.4-245.2 244.7-245.3z"
                      fill="#ECB22E"
                    />
                    <path
                      d="M0 1553.2c-0.1 135.3 109.5 245.1 244.8 245.2 135.3-0.1 244.9-109.9 244.8-245.2v-245.2h-244.8c-135.3 0.1-244.9 109.9-244.8 245.2z m652.7 0v654c-0.2 135.3 109.4 245.1 244.7 245.3 135.3-0.1 244.9-109.9 244.8-245.2v-653.9c0.2-135.3-109.4-245.1-244.7-245.3-135.4 0-244.9 109.8-244.8 245.1 0 0 0 0.1 0 0"
                      fill="#E01E5A"
                    />
                  </svg>
                </div>
              </motion.div>
              <motion.div
                whileHover={{ y: -2, backgroundColor: "rgba(255,255,255,0.16)" }}
                className="box-border [flex:1_1_0] h-[44px] flex flex-row gap-0 justify-center items-center bg-[#FFFFFF1A] rounded-[18px] cursor-pointer"
              >
                <div className="box-border w-[18px] shrink-0 h-[18px] bg-[url('/assets/marks-github-dark.png')] bg-no-repeat bg-contain bg-center" />
              </motion.div>
              <motion.div
                whileHover={{ y: -2, backgroundColor: "rgba(255,255,255,0.16)" }}
                className="box-border [flex:1_1_0] h-[44px] flex flex-row gap-0 justify-center items-center bg-[#FFFFFF1A] rounded-[18px] cursor-pointer"
              >
                <svg viewBox="0 0 100 100" className="w-[18px] h-[18px]">
                  <path
                    d="M1.225 61.523c-0.222-0.949 0.908-1.546 1.597-0.857l36.512 36.512c0.69 0.69 0.092 1.82-0.857 1.597-18.425-4.323-32.93-18.827-37.252-37.252z m-1.223-14.634a0.99 0.99 0 0 0 0.29 0.76l52.058 52.061c0.201 0.2 0.478 0.307 0.76 0.29 2.37-0.149 4.695-0.46 6.963-0.927 0.765-0.157 1.03-1.096 0.478-1.648l-57.975-57.977c-0.552-0.551-1.491-0.286-1.648 0.479a50.067 50.067 0 0 0-0.926 6.962z m4.208-17.184a0.988 0.988 0 0 0 0.208 1.1l64.776 64.776c0.289 0.29 0.726 0.375 1.1 0.208a49.908 49.908 0 0 0 5.185-2.684 0.981 0.981 0 0 0 0.183-1.54l-67.226-67.229a0.981 0.981 0 0 0-1.541 0.183 49.896 49.896 0 0 0-2.684 5.185z m8.448-11.631a0.986 0.986 0 0 1-0.045-1.354c9.167-10.26 22.498-16.72 37.339-16.72 27.64 0 50.048 22.407 50.048 50.048 0 14.84-6.46 28.172-16.72 37.338a0.986 0.986 0 0 1-1.354-0.045l-69.267-69.267z"
                    fill="#5E6AD2"
                  />
                </svg>
              </motion.div>
            </div>
          </div>

          {/* Window Main Page */}
          <div
            data-pencil-id="F0i4E"
            data-pencil-name="Window Main Page"
            className="box-border flex-1 h-[420px] sm:h-[500px] md:h-[calc(100%-16px)] m-2 md:my-[8px] md:mr-[8px] md:ml-0 relative bg-[#1A1D25] [outline:1px_solid_#FFFFFF1A] [outline-offset:-0.5px] rounded-[13px] overflow-hidden flex flex-col justify-between items-center"
          >
            <motion.div
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
              data-pencil-id="SrvqH"
              data-pencil-name="New Tab Night Sky"
              className="box-border w-full h-full absolute inset-0 bg-[url('/assets/sky-night-2200.jpg')] bg-no-repeat bg-cover bg-center [z-index:0]"
            />

            {/* Top bar with notch & settings */}
            <div className="w-full relative [z-index:2] flex justify-center items-start px-3">
              <motion.div
                whileHover={{ backgroundColor: "rgba(16, 34, 56, 0.95)" }}
                data-pencil-id="eKtBp"
                data-pencil-name="Top Address Notch"
                className="box-border w-[calc(100%-80px)] max-w-[668px] h-[44px] sm:h-[50px] flex flex-row gap-[11px] px-4 sm:p-[3px_32px_0px_32px] justify-start items-center bg-[#102238D9] [outline:1px_solid_#FFFFFF1F] [outline-offset:-0.5px] rounded-[0px_0px_18px_18px] cursor-pointer"
              >
                <svg
                  viewBox="0 0 24 24"
                  preserveAspectRatio="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="box-border w-[16px] shrink-0 h-[16px] overflow-visible"
                >
                  <path
                    d="M17.5 17.5l4.5 4.5m-2-11c0-4.97056-4.0294-9-9-9-4.97056 0-9 4.02944-9 9 0 4.9706 4.02944 9 9 9 4.9706 0 9-4.0294 9-9z"
                    fill="none"
                    stroke="#FFFFFF99"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div
                  data-pencil-id="rKzLf"
                  data-pencil-name="Notch Search Text"
                  className="text-[13px] sm:text-[15px]/[normal] box-border text-[#FFFFFF99] font-[Geist,system-ui,sans-serif] font-normal text-left truncate"
                >
                  Ask RICO or trigger a mandate (⌘K)
                </div>
              </motion.div>

              <motion.div
                whileHover={{ rotate: 90, scale: 1.08 }}
                transition={{ duration: 0.35 }}
                data-pencil-id="o4mhkx"
                data-pencil-name="New Tab Settings Button"
                className="box-border w-[32px] h-[32px] absolute right-[14px] top-[9px] flex flex-row gap-0 justify-center items-center bg-[#FFFFFF1A] [outline:1px_solid_#FFFFFF2E] [outline-offset:-0.5px] rounded-[999px] cursor-pointer"
              >
                <svg
                  viewBox="0 0 24 24"
                  preserveAspectRatio="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="box-border w-[16px] shrink-0 h-[16px] overflow-visible"
                >
                  <path
                    d="M15 12c0 1.6569-1.3431 3-3 3-1.6569 0-3-1.3431-3-3 0-1.6569 1.3431-3 3-3 1.6569 0 3 1.3431 3 3z m-3-10v2m0 16v2m-7.07-17.07l1.41 1.41m11.32 11.32l1.41 1.41m-17.07-7.07h2m16 0h2m-17.07 7.07l1.41-1.41m11.32-11.32l1.41-1.41"
                    fill="none"
                    stroke="#FFFFFFCC"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.div>
            </div>

            {/* Center Wordmark & Date Time */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col items-center gap-4 relative [z-index:3] px-4"
            >
              <svg
                data-pencil-id="unaCJ"
                data-pencil-name="New Tab RICO Wordmark"
                viewBox="0 0 960 200"
                preserveAspectRatio="xMidYMid meet"
                xmlns="http://www.w3.org/2000/svg"
                className="box-border w-[180px] h-[38px] sm:w-[230px] sm:h-[48px] overflow-visible drop-shadow-[0_4px_24px_rgba(255,255,255,0.2)]"
              >
                <path
                  d="M60 16h126c36 0 60 22 60 52 0 26-18 46-48 51l52 65h-38l-48-62h-72v62h-32V16zm32 28v50h90c20 0 32-10 32-25 0-15-12-25-32-25H92z M320 16h34v168h-34V16z M608 64h-34c-8-16-28-22-54-22-44 0-64 24-64 58 0 34 20 58 64 58 26 0 46-6 54-22h34c-10 32-42 50-88 50-64 0-98-34-98-86 0-52 34-86 98-86 46 0 78 18 88 50z M788 14c68 0 106 34 106 86 0 52-38 86-106 86-68 0-106-34-106-86 0-52 38-86 106-86zm0 28c-48 0-72 24-72 58 0 34 24 58 72 58 48 0 72-24 72-58 0-34-24-58-72-58z"
                  fill="#FFFFFFEB"
                  fillRule="evenodd"
                />
              </svg>

              <div
                data-pencil-id="Oc9dz"
                data-pencil-name="New Tab Date Time"
                className="box-border w-full flex flex-row gap-[8px] justify-center items-center"
              >
                <div className="text-[14px] sm:text-[16px]/[normal] box-border text-[#FFFFFF] font-[Geist,system-ui,sans-serif] font-semibold text-left [white-space:nowrap]">
                  12:37 AM
                </div>
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="box-border w-[4px] shrink-0 h-[4px] bg-[#FFFFFF] rounded-[50%]"
                />
                <div className="text-[14px] sm:text-[16px]/[normal] box-border text-[#FFFFFFE6] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]">
                  Monday, November 2
                </div>
              </div>
            </motion.div>

            {/* Bottom Figures */}
            <div
              data-pencil-id="rPMum"
              data-pencil-name="New Tab Bottom Figures"
              className="box-border w-full pb-4 sm:pb-6 px-3 flex flex-row flex-wrap gap-[8px] justify-center items-center relative [z-index:5]"
            >
              <motion.div
                whileHover={{ y: -2, backgroundColor: "rgba(255,255,255,0.1)" }}
                className="box-border w-fit shrink-0 h-[34px] flex flex-row gap-[7px] p-[0px_14px_0px_12px] justify-start items-center bg-[#FFFFFF0D] rounded-[999px] cursor-pointer"
              >
                <svg viewBox="0 0 24 24" className="w-[14px] h-[14px]">
                  <path
                    d="M18.7088 3.49534c-1.8923-0.94152-4.2079-1.49534-6.7088-1.49534-2.5009 0-4.8165 0.55382-6.70884 1.49534-0.92798 0.46172-1.39197 0.69258-1.84156 1.41844-0.4496 0.72587-0.4496 1.4287-0.4496 2.83436v3.48896c0 5.6834 4.54236 8.8433 7.173 10.1967 0.7337 0.3775 1.1005 0.5662 1.827 0.5662 0.7265 0 1.0933-0.1887 1.8269-0.5662 2.6307-1.3534 7.1731-4.5133 7.1731-10.1967l0-3.48896c0-1.40565 0-2.10848-0.4496-2.83436-0.4496-0.72587-0.9136-0.95672-1.8416-1.41844z"
                    fill="none"
                    stroke="#FFFFFF70"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="text-[12.5px]/[normal] text-[#FFFFFFA3] font-medium">
                  Active mandates
                </div>
                <div className="text-[12.5px]/[normal] text-[#FFFFFFEB] font-semibold">3</div>
              </motion.div>

              <motion.div
                whileHover={{ y: -2, backgroundColor: "rgba(255,255,255,0.1)" }}
                className="box-border w-fit shrink-0 h-[34px] flex flex-row gap-[7px] p-[0px_14px_0px_12px] justify-start items-center bg-[#FFFFFF0D] rounded-[999px] cursor-pointer"
              >
                <svg viewBox="0 0 24 24" className="w-[14px] h-[14px]">
                  <path
                    d="M12 22c5.5228 0 10-4.4772 10-10 0-5.52285-4.4772-10-10-10-5.52285 0-10 4.47715-10 10 0 5.5228 4.47715 10 10 10z m0-14v4l2 2"
                    fill="none"
                    stroke="#FFFFFF70"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="text-[12.5px]/[normal] text-[#FFFFFFA3] font-medium">
                  Saved this month
                </div>
                <div className="text-[12.5px]/[normal] text-[#FFFFFFEB] font-semibold">$142</div>
                <div className="box-border w-[28px] shrink-0 h-[3px] flex flex-row justify-start items-start bg-[#FFFFFF2E] rounded-[999px] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: 17 }}
                    transition={{ duration: 1.2, delay: 0.8 }}
                    className="box-border h-[3px] bg-[#FFFFFFEB] rounded-[999px]"
                  />
                </div>
              </motion.div>

              <motion.div
                whileHover={{ y: -2, backgroundColor: "rgba(255,255,255,0.1)" }}
                className="box-border w-fit shrink-0 h-[34px] flex flex-row gap-[7px] p-[0px_14px_0px_12px] justify-start items-center bg-[#FFFFFF0D] rounded-[999px] cursor-pointer"
              >
                <svg viewBox="0 0 24 24" className="w-[14px] h-[14px]">
                  <path
                    d="M11 6l10 0m-10 6l10 0m-10 6l10 0m-18-10.60714c0 0 1 0.6518 1.5 1.60714 0 0 1.5-3.75 3.5-5m-5 14.3929c0 0 1 0.6518 1.5 1.6071 0 0 1.5-3.75 3.5-5"
                    fill="none"
                    stroke="#FFFFFF70"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="text-[12.5px]/[normal] text-[#FFFFFFA3] font-medium">
                  Next audit
                </div>
                <div className="text-[12.5px]/[normal] text-[#FFFFFFEB] font-semibold">2h</div>
                <div className="text-[12.5px]/[normal] text-[#FFFFFF70] font-medium">
                  · All within ceiling
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Hero Scene Under with auto-cycling steps */}
      <div
        data-pencil-id="RPa9N"
        data-pencil-name="Hero Scene Under"
        className="box-border w-full max-w-[1200px] mx-auto mt-6 px-4 flex flex-col gap-[14px] justify-start items-center relative [z-index:5]"
      >
        <div
          data-pencil-id="g25vL8"
          data-pencil-name="Scene Caption"
          className="text-[16px] sm:text-[19px]/[normal] box-border text-[#FFFFFF] font-[Geist,system-ui,sans-serif] font-medium tracking-[-0.38px] text-center"
        >
          Your autonomous command center, in plain sight.
        </div>
        <div
          data-pencil-id="pRVUy"
          data-pencil-name="Scene Steps"
          className="box-border w-fit h-fit shrink-0 flex flex-row gap-[10px] justify-start items-center"
        >
          {Array.from({ length: 8 }).map((_, i) => {
            const isActive = activeStep === i;
            return (
              <motion.div
                key={i}
                onClick={() => setActiveStep(i)}
                animate={{
                  width: isActive ? 18 : 6,
                  backgroundColor: isActive ? "#FFFFFF" : "rgba(255,255,255,0.4)",
                }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className="box-border shrink-0 h-[6px] rounded-[3px] cursor-pointer"
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
