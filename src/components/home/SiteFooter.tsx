"use client";

import React from "react";
import { motion } from "framer-motion";

export function SiteFooter() {
  return (
    <footer
      data-pencil-id="MCZSw"
      data-pencil-name="Site Footer"
      className="box-border w-full bg-[#09090B]"
    >
      <div className="w-full max-w-[1248px] mx-auto px-4 sm:px-6 flex flex-col">
        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
          data-pencil-id="f6Sl7W"
          data-pencil-name="Footer CTA Section"
          className="box-border w-full h-fit shrink-0 flex flex-row gap-0 pt-20 pb-12 sm:pt-[140px] sm:pb-[72px] justify-between items-end"
        >
          <div
            data-pencil-id="XtF67"
            data-pencil-name="Footer CTA Headline Stack"
            className="box-border w-full flex flex-col gap-[4px] justify-start items-start"
          >
            <div
              data-pencil-id="QNScC"
              data-pencil-name="Footer CTA Line 1"
              className="text-[32px]/[36px] sm:text-[48px]/[50px] lg:text-[68px]/[69px] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-1.6px] sm:tracking-[-2.4px] lg:tracking-[-3.4px] text-left"
            >
              Your autonomous CFO.
            </div>
            <div
              data-pencil-id="tm1ra"
              data-pencil-name="Footer CTA Line 2"
              className="text-[32px]/[36px] sm:text-[48px]/[50px] lg:text-[68px]/[69px] box-border text-[#F4F4F661] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-1.6px] sm:tracking-[-2.4px] lg:tracking-[-3.4px] text-left"
            >
              Your last payment workspace.
            </div>
          </div>
        </motion.div>

        {/* Giant Wordmark with sharp contrast + motion glow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ scale: 1.02 }}
          data-pencil-id="x8NFzs"
          data-pencil-name="Footer Giant Wordmark Wrap"
          className="box-border w-full py-6 sm:h-[164px] shrink-0 overflow-hidden relative flex justify-center items-center"
        >
          <motion.svg
            animate={{
              filter: [
                "drop-shadow(0px 8px 28px rgba(226, 238, 251, 0.14))",
                "drop-shadow(0px 8px 44px rgba(180, 207, 238, 0.28))",
                "drop-shadow(0px 8px 28px rgba(226, 238, 251, 0.14))",
              ],
            }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            data-pencil-id="SEBk1"
            data-pencil-name="Footer Giant Wordmark"
            viewBox="0 0 960 200"
            preserveAspectRatio="xMidYMid meet"
            xmlns="http://www.w3.org/2000/svg"
            className="box-border w-full max-w-[760px] h-auto max-h-[148px] overflow-visible select-none"
          >
            <defs>
              <linearGradient id="g-SEBk1-fill-sharp" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.92" />
                <stop offset="55%" stopColor="#E2EEFB" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#B4CFEE" stopOpacity="0.18" />
              </linearGradient>
              <linearGradient id="g-SEBk1-stroke-sharp" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
                <stop offset="60%" stopColor="#E2EEFB" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.15" />
              </linearGradient>
            </defs>
            <path
              d="M60 16h126c36 0 60 22 60 52 0 26-18 46-48 51l52 65h-38l-48-62h-72v62h-32V16zm32 28v50h90c20 0 32-10 32-25 0-15-12-25-32-25H92z M320 16h34v168h-34V16z M608 64h-34c-8-16-28-22-54-22-44 0-64 24-64 58 0 34 20 58 64 58 26 0 46-6 54-22h34c-10 32-42 50-88 50-64 0-98-34-98-86 0-52 34-86 98-86 46 0 78 18 88 50z M788 14c68 0 106 34 106 86 0 52-38 86-106 86-68 0-106-34-106-86 0-52 38-86 106-86zm0 28c-48 0-72 24-72 58 0 34 24 58 72 58 48 0 72-24 72-58 0-34-24-58-72-58z"
              fill="url(#g-SEBk1-fill-sharp)"
              fillRule="evenodd"
              stroke="url(#g-SEBk1-stroke-sharp)"
              strokeWidth="1.5"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </motion.svg>
        </motion.div>

        {/* Footer Top Columns */}
        <div
          data-pencil-id="R40ETM"
          data-pencil-name="Footer Top Columns"
          className="w-full shrink-0 grid grid-cols-2 md:grid-cols-4 lg:flex lg:flex-row gap-10 lg:gap-0 py-12 sm:pt-[64px] sm:pb-[56px] justify-between items-start border-t border-[#FFFFFF1F]"
        >
          <div
            data-pencil-id="aQ7cz"
            data-pencil-name="Footer Brand Column"
            className="col-span-2 md:col-span-4 lg:w-[420px] shrink-0 h-fit flex flex-col gap-0 justify-start items-start"
          >
            <div className="box-border w-fit h-fit shrink-0 flex flex-row gap-[10px] justify-start items-center">
              <div className="box-border w-[30px] shrink-0 h-[28px] bg-[url('/assets/brand-rico-mark-transparent.png')] bg-no-repeat bg-contain bg-center" />
              <div className="text-[16px]/[normal] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-0.32px] text-left">
                RICO
              </div>
            </div>
            <div className="box-border w-full max-w-[320px] p-[16px_0px_22px_0px]">
              <div className="text-[14px]/[22px] box-border text-[#F4F4F66B] font-[Geist,system-ui,sans-serif] font-normal text-left">
                An autonomous financial agent, reimagined for you and your payments.
              </div>
            </div>

            <div className="box-border w-fit h-fit shrink-0 flex flex-row gap-[8px] justify-start items-center">
              {[
                "M12 0.297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385 0.6 0.113 0.82-0.258 0.82-0.577 0-0.285-0.01-1.04-0.015-2.04-3.338 0.724-4.042-1.61-4.042-1.61-0.546-1.385-1.335-1.755-1.335-1.755-1.087-0.744 0.084-0.729 0.084-0.729 1.205 0.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495 0.998 0.108-0.776 0.417-1.305 0.76-1.605-2.665-0.3-5.466-1.332-5.466-5.93 0-1.31 0.465-2.38 1.235-3.22-0.135-0.303-0.54-1.523 0.105-3.176 0 0 1.005-0.322 3.3 1.23 0.96-0.267 1.98-0.399 3-0.405 1.02 0.006 2.04 0.138 3 0.405 2.28-1.552 3.285-1.23 3.285-1.23 0.645 1.653 0.24 2.873 0.12 3.176 0.765 0.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92 0.42 0.36 0.81 1.096 0.81 2.22 0 1.606-0.015 2.896-0.015 3.286 0 0.315 0.21 0.69 0.825 0.57 4.801-1.574 8.236-6.074 8.236-11.369 0-6.627-5.373-12-12-12",
                "M14.234 10.162l8.743-10.162h-2.072l-7.591 8.824-6.063-8.824h-6.993l9.168 13.343-9.168 10.657h2.072l8.016-9.318 6.403 9.318h6.993z m-2.837 3.299l-0.929-1.329-7.392-10.572h3.182l5.965 8.532 0.929 1.329 7.754 11.09h-3.182z",
                "M20.317 4.3698a19.7913 19.7913 0 0 0-4.8851-1.5152 0.0741 0.0741 0 0 0-0.0785 0.0371c-0.211 0.3753-0.4447 0.8648-0.6083 1.2495-1.8447-0.2762-3.68-0.2762-5.4868 0-0.1636-0.3933-0.4058-0.8742-0.6177-1.2495a0.077 0.077 0 0 0-0.0785-0.037 19.7363 19.7363 0 0 0-4.8852 1.515 0.0699 0.0699 0 0 0-0.0321 0.0277c-3.1114 4.6484-3.9638 9.1825-3.5456 13.6604a0.0824 0.0824 0 0 0 0.0312 0.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a0.0777 0.0777 0 0 0 0.0842-0.0276c0.4616-0.6304 0.8731-1.2952 1.226-1.9942a0.076 0.076 0 0 0-0.0416-0.1057c-0.6528-0.2476-1.2743-0.5495-1.8722-0.8923a0.077 0.077 0 0 1-0.0076-0.1277c0.1258-0.0943 0.2517-0.1923 0.3718-0.2914a0.0743 0.0743 0 0 1 0.0776-0.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a0.0739 0.0739 0 0 1 0.0785 0.0095c0.1202 0.099 0.246 0.1981 0.3728 0.2924a0.077 0.077 0 0 1-0.0066 0.1276 12.2986 12.2986 0 0 1-1.873 0.8914 0.0766 0.0766 0 0 0-0.0407 0.1067c0.3604 0.698 0.7719 1.3628 1.225 1.9932a0.076 0.076 0 0 0 0.0842 0.0286c1.961-0.6067 3.9495-1.5219 6.0023-3.0294a0.077 0.077 0 0 0 0.0313-0.0552c0.5004-5.177-0.8382-9.6739-3.5485-13.6604a0.061 0.061 0 0 0-0.0312-0.0286z m-12.297 10.9614c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332 0.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-0.9555 2.4189-2.1569 2.4189z m7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332 0.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-0.946 2.4189-2.1568 2.4189z",
                "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136c-1.871-0.505-9.376-0.505-9.376-0.505s-7.505 0-9.377 0.505a3.017 3.017 0 0 0-2.121 2.136c-0.502 1.884-0.502 5.814-0.502 5.814s0 3.93 0.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871 0.505 9.376 0.505 9.376 0.505s7.505 0 9.377-0.505a3.015 3.015 0 0 0 2.122-2.136c0.501-1.884 0.501-5.814 0.501-5.814s0-3.93-0.502-5.814z m-13.953 9.382v-7.136l6.273 3.568-6.273 3.568z",
                "M13.604 8.4h-3.405v3.6h3.405c0.995 0 1.801-0.806 1.801-1.801 0-0.993-0.805-1.799-1.801-1.799z m-1.604-8.4c-6.628 0-12 5.372-12 12s5.372 12 12 12 12-5.372 12-12-5.372-12-12-12z m1.604 14.4h-3.405v3.6h-2.398v-12h5.804c2.319 0 4.2 1.88 4.2 4.199 0 2.321-1.881 4.201-4.201 4.201z",
              ].map((d, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -3, scale: 1.08, backgroundColor: "rgba(255,255,255,0.08)" }}
                  whileTap={{ scale: 0.94 }}
                  className="box-border w-[36px] shrink-0 h-[36px] flex flex-row gap-0 justify-center items-center [outline:1px_solid_#FFFFFF24] [outline-offset:-0.5px] rounded-[999px] cursor-pointer"
                >
                  <svg viewBox="0 0 24 24" className="w-[16px] h-[16px]">
                    <path d={d} fill="#F4F4F6A3" />
                  </svg>
                </motion.div>
              ))}
            </div>
          </div>

          <div
            data-pencil-id="W2D69"
            data-pencil-name="Footer Col Product"
            className="box-border lg:w-[260px] shrink-0 h-fit flex flex-col gap-[16px] justify-start items-start"
          >
            <div className="text-[13px]/[normal] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold text-left">
              Product
            </div>
            <div className="box-border w-fit h-fit shrink-0 flex flex-col gap-[10px] justify-start items-start">
              {["Workflows", "Pricing", "Roadmap", "Changelog", "FAQ"].map((item) => (
                <motion.div
                  key={item}
                  whileHover={{ x: 3, color: "#F4F4F6" }}
                  className="text-[14px]/[normal] box-border text-[#F4F4F66B] cursor-pointer font-[Geist,system-ui,sans-serif] font-normal text-left"
                >
                  {item}
                </motion.div>
              ))}
            </div>
          </div>

          <div
            data-pencil-id="BrKHH"
            data-pencil-name="Footer Col Resources"
            className="box-border lg:w-[260px] shrink-0 h-fit flex flex-col gap-[16px] justify-start items-start"
          >
            <div className="text-[13px]/[normal] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold text-left">
              Resources
            </div>
            <div className="box-border w-fit h-fit shrink-0 flex flex-col gap-[10px] justify-start items-start">
              {[
                "Docs",
                "About",
                "Support",
                "Source code",
                "Backend source",
                "Website source",
                "Report an issue",
              ].map((item) => (
                <motion.div
                  key={item}
                  whileHover={{ x: 3, color: "#F4F4F6" }}
                  className="text-[14px]/[normal] box-border text-[#F4F4F66B] cursor-pointer font-[Geist,system-ui,sans-serif] font-normal text-left"
                >
                  {item}
                </motion.div>
              ))}
            </div>
          </div>

          <div
            data-pencil-id="E5Emy"
            data-pencil-name="Footer Col Legal"
            className="box-border lg:w-[260px] shrink-0 h-fit flex flex-col gap-[16px] justify-start items-start"
          >
            <div className="text-[13px]/[normal] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold text-left">
              Legal
            </div>
            <div className="box-border w-fit h-fit shrink-0 flex flex-col gap-[10px] justify-start items-start">
              {["Privacy", "Terms", "Commercial licensing", "MIT License"].map((item) => (
                <motion.div
                  key={item}
                  whileHover={{ x: 3, color: "#F4F4F6" }}
                  className="text-[14px]/[normal] box-border text-[#F4F4F66B] cursor-pointer font-[Geist,system-ui,sans-serif] font-normal text-left"
                >
                  {item}
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Base Bar */}
        <div
          data-pencil-id="BRtqM"
          data-pencil-name="Footer Base Bar"
          className="w-full min-h-[66.5px] shrink-0 flex flex-col sm:flex-row gap-3 sm:gap-0 py-[22px] justify-between items-start sm:items-center border-t border-[#FFFFFF14]"
        >
          <div className="text-[13px]/[normal] box-border text-[#F4F4F66B] font-[Geist,system-ui,sans-serif] font-normal text-left">
            © 2026 RICO. Open-source autonomous financial agent under MIT License.
          </div>
          <div className="box-border w-fit shrink-0 h-fit flex flex-row gap-[4px] justify-start items-center">
            <div className="text-[13px]/[normal] box-border text-[#F4F4F66B] font-[Geist,system-ui,sans-serif] font-normal text-left">
              Made by
            </div>
            <div className="text-[13px]/[normal] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal text-left">
              Abrar Nasir
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
