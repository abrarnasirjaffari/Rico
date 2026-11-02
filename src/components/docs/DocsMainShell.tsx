import React from "react";
import Link from "next/link";

const DOCS_ROWS = [
  {
    rowId: "a2Qah",
    rowName: "Docs Topics Row 1",
    cards: [
      {
        id: "rKXz0",
        name: "Docs Topic Getting started",
        markWrapId: "rEopG",
        markWrapName: "Getting started Mark Wrap",
        markBoxId: "EfCSi",
        markBoxName: "Getting started Mark Box",
        iconId: "KRGET",
        iconName: "Getting started Icon",
        iconD:
          "M6.21875 11.618l-2.90686-0.3802c-0.59545-0.0772-0.99306-0.6537-0.72841-1.192 0.84175-1.71215 3.03602-3.69143 7.1564-3.36501m-3.52113 4.93721c1.0557-1.76374 2.353-3.61365 3.52113-4.93721m-3.52113 4.93721l5.66325 5.6632m-2.14212-10.60041c3.67062-4.09093 7.43462-4.95279 9.85382-4.61394 0.9571 0.13405 1.7054 0.88232 1.8395 1.83941 0.3388 2.41925-0.5231 6.18324-4.614 9.85384m-4.9372 3.5211l0.3802 2.9069c0.0772 0.5955 0.6537 0.9931 1.192 0.7284 1.7122-0.8417 3.6914-3.036 3.365-7.1564m-4.9372 3.5211c1.7637-1.0557 3.6136-2.353 4.9372-3.5211m0.6808-5.7601c0-1.10457-0.8954-2-2-2-1.1046 0-2 0.89543-2 2 0 1.10457 0.8954 2 2 2 1.1046 0 2-0.89543 2-2z m-13.5 14l4-4m-4-1l1.5-1.5",
        titleRowId: "jXWRZ",
        titleRowName: "Getting started Title Row",
        titleId: "upnTQ",
        titleName: "Getting started Title",
        title: "Getting started",
        bodyWrapId: "Ii8Kz",
        bodyWrapName: "Getting started Body Wrap",
        bodyId: "Ez34Y",
        bodyName: "Getting started Body",
        lines: [
          "Open the RICO WebApp, connect your payment rails",
          "and set your first autonomous mandate.",
        ],
        href: "/docs/getting-started",
      },
      {
        id: "YOnAh",
        name: "Docs Topic Browse",
        markWrapId: "oWTcJ",
        markWrapName: "Browse Mark Wrap",
        markBoxId: "u9TaC",
        markBoxName: "Browse Mark Box",
        iconId: "uToAq",
        iconName: "Browse Icon",
        iconD:
          "M2 12a10 10 0 1 0 20 0 10 10 0 1 0-20 0z m6 0c0 6 4 10 4 10 0 0 4-4 4-10 0-6-4-10-4-10 0 0-4 4-4 10z m13 3h-18m18-6h-18",
        titleRowId: "pFc03",
        titleRowName: "Browse Title Row",
        titleId: "KYpUx",
        titleName: "Browse Title",
        title: "Verification Engine",
        bodyWrapId: "Abbrg",
        bodyWrapName: "Browse Body Wrap",
        bodyId: "N5YLT",
        bodyName: "Browse Body",
        lines: [
          "The 30 FPS CDP viewport, Parallel Helper Bots,",
          "Calm Pricing Lens and Live Human Takeover.",
        ],
        href: "/docs/getting-started",
      },
      {
        id: "wws1n",
        name: "Docs Topic Ask RICO",
        markWrapId: "SHx53",
        markWrapName: "Ask RICO Mark Wrap",
        markBoxId: "sb6Xr",
        markBoxName: "Ask RICO Mark Box",
        iconId: "s1d86",
        iconName: "Ask RICO Icon",
        iconD:
          "M15 2l0.5387 2.39157c0.457 2.02858 2.0411 3.61274 4.0697 4.0697l2.3916 0.53873-2.3916 0.53873c-2.0286 0.45696-3.6127 2.04107-4.0697 4.06967l-0.5387 2.3916-0.5387-2.3916c-0.457-2.0286-2.0411-3.61271-4.0697-4.06967l-2.3916-0.53873 2.3916-0.53873c2.0285-0.45696 3.6127-2.04112 4.0697-4.06969l0.5387-2.39158z m-8 10l0.38481 1.7083c0.3264 1.4489 1.45794 2.5805 2.90689 2.9069l1.7083 0.3848-1.7083 0.3848c-1.44895 0.3264-2.58049 1.4579-2.90689 2.9069l-0.38481 1.7083-0.38481-1.7083c-0.3264-1.449-1.45794-2.5805-2.90692-2.9069l-1.70827-0.3848 1.70827-0.3848c1.44898-0.3264 2.58052-1.4579 2.90692-2.9069l0.38481-1.7083z",
        titleRowId: "Olkm7",
        titleRowName: "Ask RICO Title Row",
        titleId: "BxCqP",
        titleName: "Ask RICO Title",
        title: "Ask RICO",
        bodyWrapId: "Vx3fF",
        bodyWrapName: "Ask RICO Body Wrap",
        bodyId: "yBu3R",
        bodyName: "Ask RICO Body",
        lines: [
          "The streaming chat assistant: create mandates in",
          "plain words, probe discounts and inspect receipts.",
        ],
        href: "/docs/getting-started",
      },
    ],
  },
  {
    rowId: "HGBQ7",
    rowName: "Docs Topics Row 2",
    cards: [
      {
        id: "F1keRI",
        name: "Docs Topic Work and agents",
        markWrapId: "B4Kww",
        markWrapName: "Work and agents Mark Wrap",
        markBoxId: "UjY82",
        markBoxName: "Work and agents Mark Box",
        iconId: "SBoW7",
        iconName: "Work and agents Icon",
        iconD:
          "M8.49869 6.50012c0-1.40446 0-2.10669 0.33706-2.61114 0.14592-0.21838 0.33342-0.40588 0.5518-0.5518 0.50444-0.33706 1.20665-0.33706 2.61115-0.33706 1.4045 0 2.1067 0 2.6111 0.33706 0.2184 0.14592 0.4059 0.33342 0.5518 0.5518 0.3371 0.50445 0.3371 1.20668 0.3371 2.61114m4.4994 0.00016l-15.99909-0.00016c-1.10446 0.00007-2.0001 0.89568-2.0002 2.00013 0.0001 2.20895 1.79139 4.00025 4.00035 4.00045h11.99884c2.2089-0.0001 4.0001-1.7913 4.0002-4.00028 0-1.10448-0.8956-2.00006-2.0001-2.00014z m-12.49941 4.49982v3m9.00001 0v-3m-14.49756-2.49998l-0.00215 5.49698c-0.00129 3.3009-0.00194 4.9514 1.02324 5.977 1.02518 1.0256 2.67566 1.0257 5.9766 1.0257l6.00107 0.0002c3.2993 0 4.949 0.0001 5.9741-1.0248 1.0251-1.0249 1.0254-2.6746 1.0261-5.9739l0.001-5.50118",
        titleRowId: "pcOJi",
        titleRowName: "Work and agents Title Row",
        titleId: "vj5K3",
        titleName: "Work and agents Title",
        title: "Mandates & Guardrails",
        bodyWrapId: "QYSld",
        bodyWrapName: "Work and agents Body Wrap",
        bodyId: "mTJ03",
        bodyName: "Work and agents Body",
        lines: [
          "Budget ceilings, 24/7 Price Sentinel, anomaly holds",
          "and how a run goes from rule to receipt.",
        ],
        href: "/docs/getting-started",
      },
      {
        id: "PNLtb",
        name: "Docs Topic Models and keys",
        markWrapId: "UcSjJ",
        markWrapName: "Models and keys Mark Wrap",
        markBoxId: "a3rx4Y",
        markBoxName: "Models and keys Mark Box",
        iconId: "j7b5k",
        iconName: "Models and keys Icon",
        iconD:
          "M4 12c0-3.77124 0-5.65685 1.17157-6.82843 1.17158-1.17157 3.05719-1.17157 6.82843-1.17157 3.7712 0 5.6569 0 6.8284 1.17157 1.1716 1.17158 1.1716 3.05719 1.1716 6.82843 0 3.7712 0 5.6569-1.1716 6.8284-1.1715 1.1716-3.0572 1.1716-6.8284 1.1716-3.77124 0-5.65685 0-6.82843-1.1716-1.17157-1.1715-1.17157-3.0572-1.17157-6.8284z m3.73223 4.2678c0.73224 0.7322 1.91075 0.7322 4.26777 0.7322 0.7898 0 1.4473 0 2-0.0276l2.9724-2.9724c0.0276-0.5527 0.0276-1.2102 0.0276-2 0-2.35702 0-3.53553-0.7322-4.26777-0.7323-0.73223-1.9108-0.73223-4.2678-0.73223-2.35702 0-3.53553 0-4.26777 0.73223-0.73223 0.73224-0.73223 1.91075-0.73223 4.26777 0 2.357 0 3.5355 0.73223 4.2678z m0.26777-14.2678v2m8-2v2m-4-2v2m-4 16v2m4-2v2m4-2v2m6-6h-2m-16-8h-2m2 8h-2m2-4h-2m20-4h-2m2 4h-2",
        titleRowId: "e5XXB",
        titleRowName: "Models and keys Title Row",
        titleId: "i9cM2u",
        titleName: "Models and keys Title",
        title: "Models and keys",
        bodyWrapId: "olMqk",
        bodyWrapName: "Models and keys Body Wrap",
        bodyId: "o6DKq",
        bodyName: "Models and keys Body",
        lines: [
          "RICO AI with 1,000 first-month credits and 250",
          "every month after, API keys, or your own OpenAI,",
          "Anthropic or Gemini key.",
        ],
        href: "/docs/getting-started",
      },
      {
        id: "SNf1G",
        name: "Docs Topic Extensions",
        markWrapId: "S2ZL9",
        markWrapName: "Extensions Mark Wrap",
        markBoxId: "R2cn4",
        markBoxName: "Extensions Mark Box",
        iconId: "k0Dbk7",
        iconName: "Extensions Icon",
        iconD:
          "M12.828 6.00096c0.1108-0.31305 0.171-0.64997 0.171-1.00096 0-1.65685-1.3431-3-2.99996-3-1.65685 0-3 1.34315-3 3 0 0.35099 0.06028 0.68791 0.17104 1.00096-2.28476 0.00834-3.50407 0.08943-4.29236 0.87772-0.78821 0.78821-0.86936 2.00735-0.87772 4.29172 0.31251-0.1104 0.64876-0.1704 0.99904-0.1704 1.65686 0 3 1.3431 3 3 0 1.6569-1.34314 3-3 3-0.35028 0-0.68653-0.06-0.99904-0.1704 0.00836 2.2844 0.08951 3.5035 0.87772 4.2917 0.78821 0.7882 2.00736 0.8694 4.29169 0.8777-0.11033-0.3125-0.17037-0.6487-0.17037-0.999 0-1.6569 1.34315-3 3-3 1.65686 0 2.99996 1.3431 2.99996 3 0 0.3503-0.06 0.6865-0.1703 0.999 2.2843-0.0083 3.5035-0.0895 4.2917-0.8777 0.7882-0.7883 0.8693-2.0076 0.8777-4.2923 0.313 0.1107 0.6499 0.171 1.0009 0.171 1.6569 0 3-1.3431 3-3 0-1.6569-1.3431-3-3-3-0.351 0-0.6879 0.0603-1.0009 0.171-0.0084-2.28473-0.0895-3.50403-0.8777-4.29232-0.7883-0.78829-2.0076-0.86938-4.2924-0.87772z",
        titleRowId: "JdzQu",
        titleRowName: "Extensions Title Row",
        titleId: "I2gJGX",
        titleName: "Extensions Title",
        title: "Omnichannel Bots",
        bodyWrapId: "A5BivX",
        bodyWrapName: "Extensions Body Wrap",
        bodyId: "c2eKKI",
        bodyName: "Extensions Body",
        lines: [
          "Connect Telegram, WhatsApp and Slack for 24/7",
          "price spike alerts and 1-tap mobile approvals.",
        ],
        href: "/docs/getting-started",
      },
    ],
  },
  {
    rowId: "BtqK5",
    rowName: "Docs Topics Row 3",
    cards: [
      {
        id: "LA9KO",
        name: "Docs Topic Privacy and security",
        markWrapId: "BiUeO",
        markWrapName: "Privacy and security Mark Wrap",
        markBoxId: "CRSKR",
        markBoxName: "Privacy and security Mark Box",
        iconId: "J3f6Om",
        iconName: "Privacy and security Icon",
        iconD:
          "M18.7088 3.49534c-1.8923-0.94152-4.2079-1.49534-6.7088-1.49534-2.5009 0-4.8165 0.55382-6.70884 1.49534-0.92798 0.46172-1.39197 0.69258-1.84156 1.41844-0.4496 0.72587-0.4496 1.4287-0.4496 2.83436v3.48896c0 5.6834 4.54236 8.8433 7.173 10.1967 0.7337 0.3775 1.1005 0.5662 1.827 0.5662 0.7265 0 1.0933-0.1887 1.8269-0.5662 2.6307-1.3534 7.1731-4.5133 7.1731-10.1967l0-3.48896c0-1.40565 0-2.10848-0.4496-2.83436-0.4496-0.72587-0.9136-0.95672-1.8416-1.41844z",
        titleRowId: "uQn8b",
        titleRowName: "Privacy and security Title Row",
        titleId: "kuJXn",
        titleName: "Privacy and security Title",
        title: "Privacy and security",
        bodyWrapId: "jTXGO",
        bodyWrapName: "Privacy and security Body Wrap",
        bodyId: "Bbp9h",
        bodyName: "Privacy and security Body",
        lines: [
          "Zero-Knowledge Vault tokenization, PCI-safe rails,",
          "PostHog telemetry and strict manual approval mode.",
        ],
        href: "/docs/getting-started",
      },
      {
        id: "saEBu",
        name: "Docs Topic Keyboard shortcuts",
        markWrapId: "ex7fJ",
        markWrapName: "Keyboard shortcuts Mark Wrap",
        markBoxId: "L0ZBqJ",
        markBoxName: "Keyboard shortcuts Mark Box",
        iconId: "DHoO5",
        iconName: "Keyboard shortcuts Icon",
        iconD:
          "M14.5 7h-5c-3.28748 0-4.93122 0-6.03757 0.90796-0.20254 0.16622-0.38825 0.35193-0.55447 0.55447-0.90796 1.10635-0.90796 2.75007-0.90796 6.03757 0 3.2875 0 4.9312 0.90796 6.0376 0.16622 0.2025 0.35193 0.3882 0.55447 0.5544 1.10635 0.908 2.75009 0.908 6.03757 0.908h5c3.2875 0 4.9312 0 6.0376-0.908 0.2025-0.1662 0.3882-0.3519 0.5544-0.5544 0.908-1.1064 0.908-2.7501 0.908-6.0376 0-3.2875 0-4.93122-0.908-6.03757-0.1662-0.20254-0.3519-0.38825-0.5544-0.55447-1.1064-0.90796-2.7501-0.90796-6.0376-0.90796z m-2.5 0v-2c0-0.55228 0.4477-1 1-1 0.5523 0 1-0.44772 1-1v-1m-7 10l1 0m3.5 0l1 0m3.5 0l1 0m-10 5l10 0",
        titleRowId: "G9kFfx",
        titleRowName: "Keyboard shortcuts Title Row",
        titleId: "YuyJC",
        titleName: "Keyboard shortcuts Title",
        title: "Keyboard shortcuts",
        bodyWrapId: "Oksm4",
        bodyWrapName: "Keyboard shortcuts Body Wrap",
        bodyId: "OYXQD",
        bodyName: "Keyboard shortcuts Body",
        lines: [
          "Every default shortcut in the RICO WebApp, including",
          "the ⌘K / Ctrl+K Quick Command Launcher.",
        ],
        href: "/docs/getting-started",
      },
      {
        id: "AkHNO",
        name: "Docs Topic Building from source",
        markWrapId: "M0sdY0",
        markWrapName: "Building from source Mark Wrap",
        markBoxId: "AybnB",
        markBoxName: "Building from source Mark Box",
        iconId: "b0RRI",
        iconName: "Building from source Icon",
        iconD:
          "M17 8l1.8398 1.85008c0.7735 0.77782 1.1602 1.16672 1.1602 1.64992 0 0.4832-0.3867 0.8721-1.1602 1.6499l-1.8398 1.8501m-10-7l-1.83981 1.85008c-0.77346 0.77782-1.16019 1.16672-1.16019 1.64992 0 0.4832 0.38673 0.8721 1.16019 1.6499l1.83981 1.8501m7.5-11l-5 16",
        titleRowId: "FHwAe",
        titleRowName: "Building from source Title Row",
        titleId: "k0NrnY",
        titleName: "Building from source Title",
        title: "Building from source",
        hasOutArrow: true,
        bodyWrapId: "fMeKN",
        bodyWrapName: "Building from source Body Wrap",
        bodyId: "U5uOSW",
        bodyName: "Building from source Body",
        lines: [
          "Toolchains, the development loop and how to",
          "open a pull request. It lives in the repository.",
        ],
        href: "https://github.com/abrarnasirjaffari/Rico-Website",
      },
    ],
  },
];

export function DocsMainShell() {
  return (
    <div
      data-pencil-id="SgwVj"
      data-pencil-name="Docs Main Shell"
      className="box-border w-[1440px] h-fit shrink-0 flex flex-col gap-0 p-[112px_120px_16px_120px] justify-start items-center bg-[#09090B]"
    >
      <div
        data-pencil-id="OzRHJ"
        data-pencil-name="Docs Content Container"
        className="box-border w-[1200px] h-fit shrink-0 flex flex-col gap-0 justify-start items-center bg-[#09090B]"
      >
        <div
          data-pencil-id="tUnbj"
          data-pencil-name="Docs Header"
          className="box-border w-[736px] h-fit shrink-0 flex flex-col gap-[20px] justify-start items-center"
        >
          <div
            data-pencil-id="jOZkB"
            data-pencil-name="Docs Title"
            className="text-[68px]/[68px] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-3.06px] text-center [white-space:nowrap]"
          >
            Docs
          </div>
          <div
            data-pencil-id="i2B4Qy"
            data-pencil-name="Docs Lede"
            className="text-[20px]/[30px] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal text-center [white-space:nowrap]"
          >
            How to use RICO: the WebApp, Verification Viewport, mandates
            <br />
            and guardrails, and the models behind them. Short pages, written
            <br />
            for doing.
          </div>
        </div>

        <div
          data-pencil-id="ZTqRi"
          data-pencil-name="Docs Topics Grid Outer"
          className="box-border w-[1200px] h-fit shrink-0 flex flex-row gap-0 p-[72px_0px_0px_0px] justify-start items-start"
        >
          <div
            data-pencil-id="Db4y6"
            data-pencil-name="Docs Topics Grid"
            className="box-border w-[1200px] shrink-0 h-fit flex flex-col gap-[1px] p-[1px] justify-start items-start bg-[#1C1C1F] [outline:1px_solid_#FFFFFF14] [outline-offset:-0.5px] rounded-[20px] overflow-hidden"
          >
            {DOCS_ROWS.map((row) => (
              <div
                key={row.rowId}
                data-pencil-id={row.rowId}
                data-pencil-name={row.rowName}
                className="box-border w-full h-fit shrink-0 flex flex-row gap-[1px] justify-start items-center"
              >
                {row.cards.map((card) => (
                  <Link
                    key={card.id}
                    href={card.href}
                    data-pencil-id={card.id}
                    data-pencil-name={card.name}
                    className="box-border [flex:1_1_0] h-[217px] flex flex-col gap-0 p-[28px] justify-start items-start bg-[#09090B] hover:bg-[#111114] transition-colors no-underline"
                  >
                    <div
                      data-pencil-id={card.markWrapId}
                      data-pencil-name={card.markWrapName}
                      className="box-border w-fit h-fit shrink-0 flex flex-row gap-0 p-[0px_0px_10px_0px] justify-start items-start"
                    >
                      <div
                        data-pencil-id={card.markBoxId}
                        data-pencil-name={card.markBoxName}
                        className="box-border w-[40px] shrink-0 h-[40px] flex flex-row gap-0 justify-center items-center bg-[#FFFFFF0D] [outline:1px_solid_#FFFFFF1F] [outline-offset:-0.5px] rounded-[12px]"
                      >
                        <svg
                          data-pencil-id={card.iconId}
                          data-pencil-name={card.iconName}
                          viewBox="0 0 24 24"
                          preserveAspectRatio="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="box-border w-[20px] shrink-0 h-[20px] overflow-visible"
                        >
                          <path
                            d={card.iconD}
                            fill="none"
                            stroke="#F4F4F6A3"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            vectorEffect="non-scaling-stroke"
                          />
                        </svg>
                      </div>
                    </div>
                    <div
                      data-pencil-id={card.titleRowId}
                      data-pencil-name={card.titleRowName}
                      className="box-border w-fit h-fit shrink-0 flex flex-row gap-[10px] p-[8px_0px_0px_0px] justify-start items-center"
                    >
                      <div
                        data-pencil-id={card.titleId}
                        data-pencil-name={card.titleName}
                        className="text-[17px]/[24px] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-0.255px] text-left [white-space:nowrap]"
                      >
                        {card.title}
                      </div>
                      {card.hasOutArrow && (
                        <svg
                          data-pencil-id="ktB3N"
                          data-pencil-name="Building from source Out Arrow"
                          viewBox="0 0 24 24"
                          preserveAspectRatio="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="box-border w-[16px] shrink-0 h-[16px] overflow-visible"
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
                      )}
                    </div>
                    <div
                      data-pencil-id={card.bodyWrapId}
                      data-pencil-name={card.bodyWrapName}
                      className="box-border w-fit h-fit shrink-0 flex flex-row gap-0 p-[8px_0px_0px_0px] justify-start items-start"
                    >
                      <div
                        data-pencil-id={card.bodyId}
                        data-pencil-name={card.bodyName}
                        className="text-[15px]/[23px] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                      >
                        {card.lines.map((line, i) => (
                          <React.Fragment key={i}>
                            {i > 0 && <br />}
                            {line}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div
          data-pencil-id="n4Jfwy"
          data-pencil-name="Docs Help Wrap"
          className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[32px_0px_0px_0px] justify-center items-center"
        >
          <div
            data-pencil-id="Z4h0v"
            data-pencil-name="Docs Help Text"
            className="text-[15px]/[23px] box-border text-[#F4F4F66B] font-[Geist,system-ui,sans-serif] font-normal text-center [white-space:nowrap]"
          >
            Not here? Ask on Discord, open an issue, or see support.
          </div>
        </div>
      </div>
    </div>
  );
}
