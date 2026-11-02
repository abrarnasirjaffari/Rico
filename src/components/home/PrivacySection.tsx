"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

const MODELS = ["Llama", "Mistral", "Your Key", "RICO AI", "Claude", "GPT", "Gemini"];

export function PrivacySection() {
  const [activeIndex, setActiveIndex] = useState(3); // Starts at "RICO AI"

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % MODELS.length);
    }, 2600);
    return () => clearInterval(timer);
  }, []);

  // Compute circular offset from activeIndex in range [-3, 3]
  const getRelativeOffset = (idx: number) => {
    const len = MODELS.length;
    let diff = (idx - activeIndex) % len;
    if (diff < -Math.floor(len / 2)) diff += len;
    if (diff > Math.floor(len / 2)) diff -= len;
    return diff;
  };

  const orderedSlots = [-3, -2, -1, 0, 1, 2, 3].map((slotOffset) => {
    const modelIdx = (activeIndex + slotOffset + MODELS.length) % MODELS.length;
    return { slotOffset, name: MODELS[modelIdx], modelIdx };
  });

  return (
    <section
      data-pencil-id="aLqL6"
      data-pencil-name="Privacy Section"
      className="box-border w-full py-16 sm:py-24 lg:py-[150px] bg-[#09090B]"
    >
      <div className="w-full max-w-[1248px] mx-auto px-4 sm:px-6 flex flex-col lg:flex-row gap-12 lg:gap-8 justify-between items-center">
        <motion.div
          initial={{ opacity: 0, x: -28 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          data-pencil-id="rVyAB"
          data-pencil-name="Privacy Left Column"
          className="box-border w-full lg:w-[480px] shrink-0 h-fit flex flex-col gap-[36px] lg:gap-[44px] justify-start items-start"
        >
          <div
            data-pencil-id="nDRHN"
            data-pencil-name="Privacy Header"
            className="box-border w-full h-fit shrink-0 flex flex-col gap-[20px] justify-start items-start"
          >
            <h2
              data-pencil-id="Q0nVAt"
              data-pencil-name="Privacy Heading"
              className="m-0 text-[34px]/[38px] sm:text-[42px]/[45px] lg:text-[48px]/[51px] box-border w-full text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-1.6px] lg:tracking-[-1.92px] text-left"
            >
              Autonomous mode.
              <br />
              Pause anytime.
              <br />
              Control every cap.
            </h2>
            <p
              data-pencil-id="SpZGK"
              data-pencil-name="Privacy Subtitle"
              className="m-0 text-[17px]/[26px] sm:text-[20px]/[30px] box-border w-full max-w-[384px] text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal tracking-[-0.24px] text-left"
            >
              Pick any model or approval mode. RICO never touches your raw card numbers.
            </p>
          </div>

          <div
            data-pencil-id="E7laBu"
            data-pencil-name="Privacy Facts List"
            className="w-full max-w-[448px] shrink-0 flex flex-col gap-0 justify-start items-start border-b border-[#FFFFFF14]"
          >
            {[
              {
                title: "Zero-knowledge vault",
                desc: "AI is 100% blind to raw card numbers and CVVs.",
                icon: "M19.439 15.439c0.9246-0.9178 1.6385-1.8299 2.105-2.484 0.304-0.4263 0.456-0.6395 0.456-0.955 0-0.3155-0.152-0.5287-0.456-0.955-1.3661-1.91556-4.8548-6.045-9.544-6.045-0.9078 0-1.7706 0.15476-2.58173 0.41827m-2.67085 1.32915c-2.01624 1.35978-3.50527 3.19524-4.29138 4.29758-0.30403 0.4263-0.45604 0.6395-0.45604 0.955 0 0.3155 0.15201 0.5287 0.45604 0.955 1.36606 1.9156 4.85474 6.045 9.54396 6.045 1.9908 0 3.7651-0.7443 5.2526-1.7474m-7.39474-7.2526c-0.53003 0.53-0.85786 1.2623-0.85786 2.0711 0 1.6176 1.3113 2.9289 2.9289 2.9289 0.8088 0 1.5411-0.3278 2.0711-0.8579m-11-11.1421l18 18",
              },
              {
                title: "Strict budget ceilings",
                desc: "Any price spike over your cap halts and asks you first.",
                icon: "M11.995 13.5663l-0.995-0.0663c-0.3554 0.0097-0.6866 0.0226-0.9992 0.0379-3.7008 0.1814-6.71663 3.2679-7.0008 6.9623m12-14.0002c0 2.20914-1.7909 4-4 4-2.20914 0-4-1.79086-4-4 0-2.20914 1.79086-4 4-4 2.2091 0 4 1.79086 4 4z m0.5 9.5l4 4m1.5-2c0-1.933-1.567-3.5-3.5-3.5-1.933 0-3.5 1.567-3.5 3.5 0 1.933 1.567 3.5 3.5 3.5 1.933 0 3.5-1.567 3.5-3.5z",
              },
              {
                title: "Open source",
                desc: "Every line is on GitHub, built in the open.",
                icon: "M17 8l1.8398 1.85008c0.7735 0.77782 1.1602 1.16672 1.1602 1.64992 0 0.4832-0.3867 0.8721-1.1602 1.6499l-1.8398 1.8501m-10-7l-1.83981 1.85008c-0.77346 0.77782-1.16019 1.16672-1.16019 1.64992 0 0.4832 0.38673 0.8721 1.16019 1.6499l1.83981 1.8501m7.5-11l-5 16",
              },
            ].map((fact, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.12 }}
                whileHover={{ x: 6 }}
                className="w-full min-h-[70.5px] shrink-0 flex flex-row gap-[14px] p-[15px_0px] justify-start items-start border-t border-[#FFFFFF14] cursor-default"
              >
                <div className="box-border w-fit shrink-0 h-fit flex flex-row gap-0 p-[2px_0px_0px_0px] justify-start items-start">
                  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]">
                    <path
                      d={fact.icon}
                      fill="none"
                      stroke="#F4F4F6A3"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="box-border flex-1 flex flex-col gap-[3px] justify-start items-start">
                  <div className="text-[15px]/[normal] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-medium tracking-[-0.09px] text-left">
                    {fact.title}
                  </div>
                  <div className="text-[15px]/[21px] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal tracking-[-0.09px] text-left">
                    {fact.desc}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Interactive Animated 3D Drum Model Wheel */}
        <motion.div
          initial={{ opacity: 0, x: 28 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          data-pencil-id="b4iOA"
          data-pencil-name="Model Wheel Column"
          className="box-border w-full lg:w-[52%] max-w-[620px] shrink-0 h-fit flex flex-col gap-[26px] justify-start items-center"
        >
          <div
            data-pencil-id="vlegR"
            data-pencil-name="Model Wheel Drum"
            className="box-border w-full max-w-[480px] h-[390px] sm:h-[444px] shrink-0 flex flex-col gap-[8px] justify-center items-center relative"
          >
            {/* Stationary Center Active Band Highlight */}
            <div className="pointer-events-none w-full max-w-[432px] h-[64px] sm:h-[74px] absolute top-1/2 -translate-y-1/2 bg-[#FFFFFF0E] [outline:1px_solid_#FFFFFF1A] [outline-offset:-0.5px] rounded-[20px] shadow-[0_0_40px_rgba(255,255,255,0.04)]" />

            {orderedSlots.map(({ slotOffset, name, modelIdx }) => {
              const abs = Math.abs(slotOffset);
              const sizeClass =
                abs === 0
                  ? "text-[38px] sm:text-[50px] text-[#F4F4F6] tracking-[-2px] h-[64px] sm:h-[74px]"
                  : abs === 1
                  ? "text-[30px] sm:text-[42px] text-[#F4F4F64D] tracking-[-1.6px] h-[50px] sm:h-[56px]"
                  : abs === 2
                  ? "text-[24px] sm:text-[34px] text-[#F4F4F62B] tracking-[-1.6px] h-[38px] sm:h-[44px]"
                  : "text-[18px] sm:text-[24px] text-[#F4F4F614] tracking-[-1.6px] h-[28px] sm:h-[32px]";

              return (
                <motion.div
                  key={name}
                  layout
                  onClick={() => setActiveIndex(modelIdx)}
                  transition={{ type: "spring", stiffness: 260, damping: 26 }}
                  className={`box-border w-full shrink-0 flex flex-row justify-center items-center cursor-pointer select-none font-[Geist,system-ui,sans-serif] font-semibold [white-space:nowrap] ${sizeClass}`}
                >
                  {name}
                </motion.div>
              );
            })}
          </div>

          <div
            data-pencil-id="LfU2s"
            data-pencil-name="Wheel Detail Caption"
            className="box-border w-full text-center text-[15px] sm:text-[16px]/[24px] text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif]"
          >
            <span className="text-[#F4F4F6] font-medium">Ours, if you like.</span> 1,000 free
            credits for your first month, then 250 every month.
          </div>
        </motion.div>
      </div>
    </section>
  );
}
