import React from "react";

export function FaqSection() {
  const questions = [
    "How does RICO verify live merchant prices?",
    "Can the AI see my credit card numbers?",
    "What happens if a subscription price spikes?",
    "How do Startup and Student savings probes work?",
    "Can agents execute payments without me?",
    "Is RICO free and open source?",
    "Can I approve or cancel payments from Telegram or WhatsApp?",
  ];

  return (
    <section
      data-pencil-id="wmAJV"
      data-pencil-name="FAQ Section"
      className="box-border w-full py-16 sm:py-24 lg:py-[120px] bg-[#09090B]"
    >
      <div className="w-full max-w-[1248px] mx-auto px-4 sm:px-6 flex flex-col lg:flex-row gap-10 lg:gap-[64px] justify-between items-start">
        <div
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
        </div>

        <div
          data-pencil-id="lgw15"
          data-pencil-name="FAQ Accordion List"
          className="w-full lg:w-[60%] max-w-[664px] shrink-0 flex flex-col gap-0 justify-start items-start border-t border-[#FFFFFF1F]"
        >
          {questions.map((q, idx) => (
            <div
              key={idx}
              className="w-full min-h-[66.5px] shrink-0 flex flex-row gap-4 py-[22px] justify-between items-center border-b border-[#FFFFFF1F] cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="text-[16px]/[24px] sm:text-[18px]/[normal] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-medium tracking-[-0.27px] text-left">
                {q}
              </div>
              <svg
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
              </svg>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
