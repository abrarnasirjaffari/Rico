import React from "react";

export function FilmSection() {
  return (
    <section
      data-pencil-id="L98kbp"
      data-pencil-name="Film Section"
      className="box-border w-full py-16 sm:py-24 lg:pt-[140px] lg:pb-[60px] bg-[#09090B]"
    >
      <div className="w-full max-w-[1248px] mx-auto px-4 sm:px-6 flex flex-col gap-10 sm:gap-[56px] items-center">
        <div
          data-pencil-id="uNPOq"
          data-pencil-name="Film Header"
          className="box-border w-full max-w-[460px] h-fit shrink-0 flex flex-col gap-[14px] justify-start items-center"
        >
          <h2
            data-pencil-id="dY7kv"
            data-pencil-name="Film Heading"
            className="m-0 text-[34px]/[38px] sm:text-[46px]/[48px] lg:text-[56px]/[57px] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-1.8px] lg:tracking-[-2.5px] text-center"
          >
            See it in motion.
          </h2>
          <p
            data-pencil-id="fMXT7"
            data-pencil-name="Film Subtitle"
            className="m-0 text-[17px]/[26px] sm:text-[20px]/[30px] box-border w-full max-w-[420px] text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal tracking-[-0.24px] text-center"
          >
            The launch film: autonomous mandates, price guardrails, and how RICO protects your
            wallet.
          </p>
        </div>

        <div
          data-pencil-id="SCSWS"
          data-pencil-name="Film Poster Frame"
          className="box-border w-full max-w-[1120px] aspect-[16/9] shrink-0 [filter:drop-shadow(0px_30px_45px_#1450A059)] [outline:1px_solid_#FFFFFF24] [outline-offset:-0.5px] rounded-[20px] sm:rounded-[28px] overflow-hidden relative flex justify-center items-center"
        >
          <div
            data-pencil-id="haOrC"
            data-pencil-name="Film Poster Image"
            className="box-border w-full h-full absolute inset-0 bg-[url('/assets/film-poster-2560.jpg')] bg-no-repeat bg-cover bg-center [z-index:0]"
          />
          <div
            data-pencil-id="iVeeE"
            data-pencil-name="Film Play Button"
            className="box-border w-[68px] h-[68px] sm:w-[88px] sm:h-[88px] [box-shadow:0px_20px_50px_#06184680] [backdrop-filter:blur(9px)] relative flex flex-row gap-0 p-[0px_0px_0px_3px] justify-center items-center bg-[#FFFFFF2E] [outline:1px_solid_#FFFFFF80] [outline-offset:-0.5px] rounded-[999px] [z-index:1] hover:scale-105 transition-transform cursor-pointer"
          >
            <svg
              viewBox="0 0 24 24"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
              className="box-border w-[22px] h-[22px] sm:w-[26px] sm:h-[26px] shrink-0 overflow-visible"
            >
              <path
                d="M18.8906 12.846c-0.3535 1.343-2.0239 2.292-5.3649 4.1901-3.2297 1.8348-4.8445 2.7523-6.14587 2.3835-0.53803-0.1525-1.02824-0.442-1.42359-0.8409-0.95624-0.9648-0.95624-2.8361-0.95624-6.5787 0-3.7426 0-5.6139 0.95624-6.57868 0.39535-0.39887 0.88556-0.68844 1.42359-0.8409 1.30137-0.36877 2.91617 0.54865 6.14587 2.38351 3.341 1.89804 5.0114 2.84707 5.3649 4.19007 0.1459 0.5544 0.1459 1.1376 0 1.692z"
                fill="#FFFFFF"
              />
            </svg>
          </div>
          <div
            data-pencil-id="xjB2v"
            data-pencil-name="Film Meta Pill"
            className="box-border w-fit h-[34px] [backdrop-filter:blur(8px)] absolute left-4 bottom-4 sm:left-[24px] sm:bottom-[24px] flex flex-row gap-[10px] p-[0px_14px] justify-start items-center bg-[#0A0E186B] [outline:1px_solid_#FFFFFF33] [outline-offset:-0.5px] rounded-[999px] [z-index:2]"
          >
            <div className="text-[14px]/[normal] box-border text-[#FFFFFF] font-[Geist,system-ui,sans-serif] font-semibold">
              Introducing RICO
            </div>
            <div className="text-[14px]/[normal] box-border text-[#FFFFFFB3] font-[Geist,system-ui,sans-serif] font-normal">
              4:20
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
