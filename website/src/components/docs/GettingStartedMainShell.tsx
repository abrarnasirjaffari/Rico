import React from "react";
import Link from "next/link";

const SIDENAV_ITEMS = [
  {
    id: "VWdMm",
    name: "SideNav Getting started",
    iconId: "vuBWA",
    iconName: "Getting started Nav Icon",
    labelId: "vmmgM",
    labelName: "Getting started Nav Label",
    label: "Getting started",
    active: true,
    iconD:
      "M6.21875 11.618l-2.90686-0.3802c-0.59545-0.0772-0.99306-0.6537-0.72841-1.192 0.84175-1.71215 3.03602-3.69143 7.1564-3.36501m-3.52113 4.93721c1.0557-1.76374 2.353-3.61365 3.52113-4.93721m-3.52113 4.93721l5.66325 5.6632m-2.14212-10.60041c3.67062-4.09093 7.43462-4.95279 9.85382-4.61394 0.9571 0.13405 1.7054 0.88232 1.8395 1.83941 0.3388 2.41925-0.5231 6.18324-4.614 9.85384m-4.9372 3.5211l0.3802 2.9069c0.0772 0.5955 0.6537 0.9931 1.192 0.7284 1.7122-0.8417 3.6914-3.036 3.365-7.1564m-4.9372 3.5211c1.7637-1.0557 3.6136-2.353 4.9372-3.5211m0.6808-5.7601c0-1.10457-0.8954-2-2-2-1.1046 0-2 0.89543-2 2 0 1.10457 0.8954 2 2 2 1.1046 0 2-0.89543 2-2z m-13.5 14l4-4m-4-1l1.5-1.5",
  },
  {
    id: "DmwaV",
    name: "SideNav Browse",
    iconId: "i7JEyy",
    iconName: "Browse Nav Icon",
    labelId: "qX6IA",
    labelName: "Browse Nav Label",
    label: "Verification Engine",
    active: false,
    iconD:
      "M2 12a10 10 0 1 0 20 0 10 10 0 1 0-20 0z m6 0c0 6 4 10 4 10 0 0 4-4 4-10 0-6-4-10-4-10 0 0-4 4-4 10z m13 3h-18m18-6h-18",
  },
  {
    id: "f8rtq",
    name: "SideNav Ask RICO",
    iconId: "AbRTE",
    iconName: "Ask RICO Nav Icon",
    labelId: "V53kri",
    labelName: "Ask RICO Nav Label",
    label: "Ask RICO",
    active: false,
    iconD:
      "M15 2l0.5387 2.39157c0.457 2.02858 2.0411 3.61274 4.0697 4.0697l2.3916 0.53873-2.3916 0.53873c-2.0286 0.45696-3.6127 2.04107-4.0697 4.06967l-0.5387 2.3916-0.5387-2.3916c-0.457-2.0286-2.0411-3.61271-4.0697-4.06967l-2.3916-0.53873 2.3916-0.53873c2.0285-0.45696 3.6127-2.04112 4.0697-4.06969l0.5387-2.39158z m-8 10l0.38481 1.7083c0.3264 1.4489 1.45794 2.5805 2.90689 2.9069l1.7083 0.3848-1.7083 0.3848c-1.44895 0.3264-2.58049 1.4579-2.90689 2.9069l-0.38481 1.7083-0.38481-1.7083c-0.3264-1.449-1.45794-2.5805-2.90692-2.9069l-1.70827-0.3848 1.70827-0.3848c1.44898-0.3264 2.58052-1.4579 2.90692-2.9069l0.38481-1.7083z",
  },
  {
    id: "k69dPb",
    name: "SideNav Work and agents",
    iconId: "JmsW7",
    iconName: "Work and agents Nav Icon",
    labelId: "vNhMA",
    labelName: "Work and agents Nav Label",
    label: "Mandates & Guardrails",
    active: false,
    iconD:
      "M8.49869 6.50012c0-1.40446 0-2.10669 0.33706-2.61114 0.14592-0.21838 0.33342-0.40588 0.5518-0.5518 0.50444-0.33706 1.20665-0.33706 2.61115-0.33706 1.4045 0 2.1067 0 2.6111 0.33706 0.2184 0.14592 0.4059 0.33342 0.5518 0.5518 0.3371 0.50445 0.3371 1.20668 0.3371 2.61114m4.4994 0.00016l-15.99909-0.00016c-1.10446 0.00007-2.0001 0.89568-2.0002 2.00013 0.0001 2.20895 1.79139 4.00025 4.00035 4.00045h11.99884c2.2089-0.0001 4.0001-1.7913 4.0002-4.00028 0-1.10448-0.8956-2.00006-2.0001-2.00014z m-12.49941 4.49982v3m9.00001 0v-3m-14.49756-2.49998l-0.00215 5.49698c-0.00129 3.3009-0.00194 4.9514 1.02324 5.977 1.02518 1.0256 2.67566 1.0257 5.9766 1.0257l6.00107 0.0002c3.2993 0 4.949 0.0001 5.9741-1.0248 1.0251-1.0249 1.0254-2.6746 1.0261-5.9739l0.001-5.50118",
  },
  {
    id: "v0uMj",
    name: "SideNav Models and keys",
    iconId: "bh5rG",
    iconName: "Models and keys Nav Icon",
    labelId: "uW0QY",
    labelName: "Models and keys Nav Label",
    label: "Models and keys",
    active: false,
    iconD:
      "M4 12c0-3.77124 0-5.65685 1.17157-6.82843 1.17158-1.17157 3.05719-1.17157 6.82843-1.17157 3.7712 0 5.6569 0 6.8284 1.17157 1.1716 1.17158 1.1716 3.05719 1.1716 6.82843 0 3.7712 0 5.6569-1.1716 6.8284-1.1715 1.1716-3.0572 1.1716-6.8284 1.1716-3.77124 0-5.65685 0-6.82843-1.1716-1.17157-1.1715-1.17157-3.0572-1.17157-6.8284z m3.73223 4.2678c0.73224 0.7322 1.91075 0.7322 4.26777 0.7322 0.7898 0 1.4473 0 2-0.0276l2.9724-2.9724c0.0276-0.5527 0.0276-1.2102 0.0276-2 0-2.35702 0-3.53553-0.7322-4.26777-0.7323-0.73223-1.9108-0.73223-4.2678-0.73223-2.35702 0-3.53553 0-4.26777 0.73223-0.73223 0.73224-0.73223 1.91075-0.73223 4.26777 0 2.357 0 3.5355 0.73223 4.2678z m0.26777-14.2678v2m8-2v2m-4-2v2m-4 16v2m4-2v2m4-2v2m6-6h-2m-16-8h-2m2 8h-2m2-4h-2m20-4h-2m2 4h-2",
  },
  {
    id: "sKEjz",
    name: "SideNav Extensions",
    iconId: "owAQT",
    iconName: "Extensions Nav Icon",
    labelId: "V7x1I",
    labelName: "Extensions Nav Label",
    label: "Omnichannel Bots",
    active: false,
    iconD:
      "M12.828 6.00096c0.1108-0.31305 0.171-0.64997 0.171-1.00096 0-1.65685-1.3431-3-2.99996-3-1.65685 0-3 1.34315-3 3 0 0.35099 0.06028 0.68791 0.17104 1.00096-2.28476 0.00834-3.50407 0.08943-4.29236 0.87772-0.78821 0.78821-0.86936 2.00735-0.87772 4.29172 0.31251-0.1104 0.64876-0.1704 0.99904-0.1704 1.65686 0 3 1.3431 3 3 0 1.6569-1.34314 3-3 3-0.35028 0-0.68653-0.06-0.99904-0.1704 0.00836 2.2844 0.08951 3.5035 0.87772 4.2917 0.78821 0.7882 2.00736 0.8694 4.29169 0.8777-0.11033-0.3125-0.17037-0.6487-0.17037-0.999 0-1.6569 1.34315-3 3-3 1.65686 0 2.99996 1.3431 2.99996 3 0 0.3503-0.06 0.6865-0.1703 0.999 2.2843-0.0083 3.5035-0.0895 4.2917-0.8777 0.7882-0.7883 0.8693-2.0076 0.8777-4.2923 0.313 0.1107 0.6499 0.171 1.0009 0.171 1.6569 0 3-1.3431 3-3 0-1.6569-1.3431-3-3-3-0.351 0-0.6879 0.0603-1.0009 0.171-0.0084-2.28473-0.0895-3.50403-0.8777-4.29232-0.7883-0.78829-2.0076-0.86938-4.2924-0.87772z",
  },
  {
    id: "nWEfj",
    name: "SideNav Privacy and security",
    iconId: "NeD53",
    iconName: "Privacy and security Nav Icon",
    labelId: "tRrcd",
    labelName: "Privacy and security Nav Label",
    label: "Privacy and security",
    active: false,
    iconD:
      "M18.7088 3.49534c-1.8923-0.94152-4.2079-1.49534-6.7088-1.49534-2.5009 0-4.8165 0.55382-6.70884 1.49534-0.92798 0.46172-1.39197 0.69258-1.84156 1.41844-0.4496 0.72587-0.4496 1.4287-0.4496 2.83436v3.48896c0 5.6834 4.54236 8.8433 7.173 10.1967 0.7337 0.3775 1.1005 0.5662 1.827 0.5662 0.7265 0 1.0933-0.1887 1.8269-0.5662 2.6307-1.3534 7.1731-4.5133 7.1731-10.1967l0-3.48896c0-1.40565 0-2.10848-0.4496-2.83436-0.4496-0.72587-0.9136-0.95672-1.8416-1.41844z",
  },
  {
    id: "NoNpv",
    name: "SideNav Keyboard shortcuts",
    iconId: "IbmX2",
    iconName: "Keyboard shortcuts Nav Icon",
    labelId: "xvq1h",
    labelName: "Keyboard shortcuts Nav Label",
    label: "Keyboard shortcuts",
    active: false,
    iconD:
      "M14.5 7h-5c-3.28748 0-4.93122 0-6.03757 0.90796-0.20254 0.16622-0.38825 0.35193-0.55447 0.55447-0.90796 1.10635-0.90796 2.75007-0.90796 6.03757 0 3.2875 0 4.9312 0.90796 6.0376 0.16622 0.2025 0.35193 0.3882 0.55447 0.5544 1.10635 0.908 2.75009 0.908 6.03757 0.908h5c3.2875 0 4.9312 0 6.0376-0.908 0.2025-0.1662 0.3882-0.3519 0.5544-0.5544 0.908-1.1064 0.908-2.7501 0.908-6.0376 0-3.2875 0-4.93122-0.908-6.03757-0.1662-0.20254-0.3519-0.38825-0.5544-0.55447-1.1064-0.90796-2.7501-0.90796-6.0376-0.90796z m-2.5 0v-2c0-0.55228 0.4477-1 1-1 0.5523 0 1-0.44772 1-1v-1m-7 10l1 0m3.5 0l1 0m3.5 0l1 0m-10 5l10 0",
  },
];

export function GettingStartedMainShell() {
  return (
    <div
      data-pencil-id="ZM8oo"
      data-pencil-name="Docs Layout Shell"
      className="box-border w-[1440px] h-fit shrink-0 flex flex-row gap-[48px] p-[24px_120px_16px_120px] justify-start items-start bg-[#09090B]"
    >
      {/* Left SideNav */}
      <div
        data-pencil-id="F9uH7V"
        data-pencil-name="Docs SideNav"
        className="box-border w-[224px] shrink-0 h-fit flex flex-col gap-0 p-[12px_0px_0px_0px] justify-start items-start"
      >
        <div
          data-pencil-id="mz2tI"
          data-pencil-name="SideNav Heading Wrap"
          className="box-border w-fit h-fit shrink-0 flex flex-row gap-0 p-[0px_12px_10px_12px] justify-start items-start"
        >
          <div
            data-pencil-id="Nmf20"
            data-pencil-name="SideNav Heading"
            className="text-[12.5px]/[normal] box-border text-[#F4F4F66B] font-[Geist,system-ui,sans-serif] font-medium tracking-[0.25px] text-left [white-space:nowrap]"
          >
            Documentation
          </div>
        </div>
        <div
          data-pencil-id="HCRXh"
          data-pencil-name="SideNav List"
          className="box-border w-full h-fit shrink-0 flex flex-col gap-[2px] justify-start items-start"
        >
          {SIDENAV_ITEMS.map((item) => {
            const slugMap: Record<string, string> = {
              "Getting started": "/docs/getting-started",
              "Verification Engine": "/docs/verification-engine",
              "Ask RICO": "/docs/ask-rico",
              "Mandates & Guardrails": "/docs/mandates-and-guardrails",
              "Models and keys": "/docs/models-and-keys",
              "Omnichannel Bots": "/docs/omnichannel-bots",
              "Privacy and security": "/docs/privacy-and-security",
              "Keyboard shortcuts": "/docs/keyboard-shortcuts",
            };
            return (
              <Link
                key={item.id}
                href={slugMap[item.label] || "/docs/getting-started"}
                data-pencil-id={item.id}
                data-pencil-name={item.name}
                className={`box-border w-full h-[38px] shrink-0 flex flex-row gap-[10px] p-[8px_12px] justify-start items-center rounded-[12px] no-underline transition-colors ${
                  item.active ? "bg-[#FFFFFF14]" : "hover:bg-[#FFFFFF0A]"
                }`}
              >
                <svg
                  data-pencil-id={item.iconId}
                  data-pencil-name={item.iconName}
                  viewBox="0 0 24 24"
                  preserveAspectRatio="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="box-border w-[16px] shrink-0 h-[16px] overflow-visible"
                >
                  <path
                    d={item.iconD}
                    fill="none"
                    stroke={item.active ? "#F4F4F6" : "#F4F4F66B"}
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
                <div
                  data-pencil-id={item.labelId}
                  data-pencil-name={item.labelName}
                  className={`text-[14.5px]/[normal] box-border font-[Geist,system-ui,sans-serif] tracking-[-0.087px] text-left [white-space:nowrap] ${
                    item.active ? "text-[#F4F4F6] font-medium" : "text-[#F4F4F6A3] font-normal"
                  }`}
                >
                  {item.label}
                </div>
              </Link>
            );
          })}

          <div
            data-pencil-id="a2N0h"
            data-pencil-name="SideNav Building from source"
            className="box-border w-full h-[38px] shrink-0 flex flex-row gap-0 p-[8px_12px] justify-between items-center rounded-[12px]"
          >
            <div
              data-pencil-id="Ww2Ol"
              data-pencil-name="Building from source Left"
              className="box-border w-fit shrink-0 h-fit flex flex-row gap-[10px] justify-start items-center"
            >
              <svg
                data-pencil-id="MDSM3"
                data-pencil-name="Building from source Nav Icon"
                viewBox="0 0 24 24"
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
                className="box-border w-[16px] shrink-0 h-[16px] overflow-visible"
              >
                <path
                  d="M17 8l1.8398 1.85008c0.7735 0.77782 1.1602 1.16672 1.1602 1.64992 0 0.4832-0.3867 0.8721-1.1602 1.6499l-1.8398 1.8501m-10-7l-1.83981 1.85008c-0.77346 0.77782-1.16019 1.16672-1.16019 1.64992 0 0.4832 0.38673 0.8721 1.16019 1.6499l1.83981 1.8501m7.5-11l-5 16"
                  fill="none"
                  stroke="#F4F4F66B"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              <div
                data-pencil-id="s0Xddn"
                data-pencil-name="Building from source Nav Label"
                className="text-[14.5px]/[normal] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal tracking-[-0.087px] text-left [white-space:nowrap]"
              >
                Building from source
              </div>
            </div>
            <svg
              data-pencil-id="U504W6"
              data-pencil-name="Building from source Out Icon"
              viewBox="0 0 24 24"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
              className="box-border w-[14px] shrink-0 h-[14px] overflow-visible"
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
          </div>
        </div>
      </div>

      {/* Center Article Column */}
      <div
        data-pencil-id="lfEYL"
        data-pencil-name="Docs Article Column"
        className="box-border w-[680px] shrink-0 h-fit flex flex-col gap-0 p-[56px_0px_0px_0px] justify-start items-start bg-[#09090B]"
      >
        <div
          data-pencil-id="bTJmZ"
          data-pencil-name="Article Header"
          className="box-border w-full h-fit shrink-0 flex flex-col gap-0 justify-start items-start"
        >
          <div
            data-pencil-id="B2m9Im"
            data-pencil-name="Article Eyebrow Wrap"
            className="box-border w-fit h-fit shrink-0 flex flex-row gap-0 p-[0px_0px_14px_0px] justify-start items-start"
          >
            <Link
              href="/docs"
              data-pencil-id="Tb7r2"
              data-pencil-name="Article Eyebrow"
              className="text-[14px]/[normal] box-border text-[#F4F4F66B] font-[Geist,system-ui,sans-serif] font-medium text-left [white-space:nowrap] no-underline"
            >
              Docs
            </Link>
          </div>
          <div
            data-pencil-id="ntUQj"
            data-pencil-name="Article Title"
            className="text-[52px]/[53px] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-2.184px] text-left [white-space:nowrap]"
          >
            Getting started
          </div>
          <div
            data-pencil-id="AooVp"
            data-pencil-name="Article Lede Wrap"
            className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[18px_0px_0px_0px] justify-start items-start"
          >
            <div
              data-pencil-id="iAv3j"
              data-pencil-name="Article Lede"
              className="text-[20px]/[31px] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
            >
              RICO is a web workspace and API first. You can open the WebApp and
              <br />
              explore without installing anything. This page takes you from your
              <br />
              first session to your first active mandate.
            </div>
          </div>
        </div>

        <div
          data-pencil-id="m689z"
          data-pencil-name="Article Body"
          className="box-border w-full h-fit shrink-0 flex flex-col gap-[44px] p-[56px_0px_0px_0px] justify-start items-start"
        >
          {/* Section Launch RICO */}
          <div
            data-pencil-id="trNR4"
            data-pencil-name="Section Install RICO"
            className="box-border w-full h-fit shrink-0 flex flex-col gap-0 justify-start items-start"
          >
            <div
              data-pencil-id="aDHc2"
              data-pencil-name="Install RICO Heading"
              className="text-[28.8px]/[35px] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-0.864px] text-left [white-space:nowrap]"
            >
              Launch RICO
            </div>
            <div
              data-pencil-id="l8Z4sl"
              data-pencil-name="Install Intro Wrap"
              className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[18px_0px_0px_0px] justify-start items-start"
            >
              <div
                data-pencil-id="KU4Jn"
                data-pencil-name="Install Intro"
                className="text-[16.5px]/[28px] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
              >
                Access RICO directly via the hosted WebApp, or connect to the REST &amp; Webhook
                <br />
                API from your own environment.
              </div>
            </div>

            <div
              data-pencil-id="YIFAU"
              data-pencil-name="Install Table Outer"
              className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[16px_0px_0px_0px] justify-start items-start"
            >
              <div
                data-pencil-id="HmHL5"
                data-pencil-name="Install Table"
                className="box-border w-[680px] shrink-0 h-fit flex flex-col gap-0 justify-start items-start [outline:1px_solid_#FFFFFF17] [outline-offset:-0.5px] rounded-[12px] overflow-hidden"
              >
                <div
                  data-pencil-id="IXOC5"
                  data-pencil-name="Table Header Row"
                  className="box-border w-full h-[41px] shrink-0 flex flex-row gap-0 justify-start items-center bg-[#FFFFFF08]"
                >
                  <div
                    data-pencil-id="Jk4Wt"
                    data-pencil-name="TH System"
                    className="box-border w-[205px] shrink-0 h-fit flex flex-row gap-0 p-[11px_16px] justify-start items-center"
                  >
                    <div
                      data-pencil-id="RGWbl"
                      data-pencil-name="TH System Text"
                      className="text-[12.5px]/[normal] box-border text-[#F4F4F66B] font-[Geist,system-ui,sans-serif] font-medium tracking-[0.25px] text-left [white-space:nowrap]"
                    >
                      Interface
                    </div>
                  </div>
                  <div
                    data-pencil-id="Z7DDli"
                    data-pencil-name="TH Build"
                    className="box-border w-[170px] shrink-0 h-fit flex flex-row gap-0 p-[11px_16px] justify-start items-center"
                  >
                    <div
                      data-pencil-id="Aacpa"
                      data-pencil-name="TH Build Text"
                      className="text-[12.5px]/[normal] box-border text-[#F4F4F66B] font-[Geist,system-ui,sans-serif] font-medium tracking-[0.25px] text-left [white-space:nowrap]"
                    >
                      Runtime
                    </div>
                  </div>
                  <div
                    data-pencil-id="HJ4kK"
                    data-pencil-name="TH Requires"
                    className="box-border w-[305px] shrink-0 h-fit flex flex-row gap-0 p-[11px_16px] justify-start items-center"
                  >
                    <div
                      data-pencil-id="p5Zhsw"
                      data-pencil-name="TH Requires Text"
                      className="text-[12.5px]/[normal] box-border text-[#F4F4F66B] font-[Geist,system-ui,sans-serif] font-medium tracking-[0.25px] text-left [white-space:nowrap]"
                    >
                      Access
                    </div>
                  </div>
                </div>
                <div
                  data-pencil-id="d4ZxJ"
                  data-pencil-name="TR macOS"
                  className="[box-sizing:content-box] w-[680px] h-[46.5px] shrink-0 flex flex-row gap-0 justify-start items-center [border-width:1px_0px_0px_0px] [border-style:solid] [border-color:#FFFFFF17] [margin:-0.5px_0px_0px_0px]"
                >
                  <div
                    data-pencil-id="rX3L5"
                    data-pencil-name="macOS Col 1"
                    className="box-border w-[205px] shrink-0 h-fit flex flex-row gap-0 p-[12px_16px] justify-start items-center"
                  >
                    <div
                      data-pencil-id="JLsBY"
                      data-pencil-name="macOS Name"
                      className="text-[15px]/[normal] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-medium text-left [white-space:nowrap]"
                    >
                      Cloud WebApp
                    </div>
                  </div>
                  <div
                    data-pencil-id="k5e99U"
                    data-pencil-name="macOS Col 2"
                    className="box-border w-[170px] shrink-0 h-fit flex flex-row gap-0 p-[12px_16px] justify-start items-center"
                  >
                    <div
                      data-pencil-id="E4azE"
                      data-pencil-name="macOS Build"
                      className="text-[15px]/[normal] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                    >
                      Next.js 14 + CDP
                    </div>
                  </div>
                  <div
                    data-pencil-id="c6n2IN"
                    data-pencil-name="macOS Col 3"
                    className="box-border w-[305px] shrink-0 h-fit flex flex-row gap-0 p-[12px_16px] justify-start items-center"
                  >
                    <div
                      data-pencil-id="ZT02K"
                      data-pencil-name="macOS Requires"
                      className="text-[15px]/[normal] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                    >
                      Zero install (Web)
                    </div>
                  </div>
                </div>
                <div
                  data-pencil-id="sPv1m"
                  data-pencil-name="TR Windows"
                  className="[box-sizing:content-box] w-[680px] h-[46.5px] shrink-0 flex flex-row gap-0 justify-start items-center [border-width:1px_0px_0px_0px] [border-style:solid] [border-color:#FFFFFF17] [margin:-0.5px_0px_0px_0px]"
                >
                  <div
                    data-pencil-id="E3Uvz4"
                    data-pencil-name="Windows Col 1"
                    className="box-border w-[205px] shrink-0 h-fit flex flex-row gap-0 p-[12px_16px] justify-start items-center"
                  >
                    <div
                      data-pencil-id="aMSFd"
                      data-pencil-name="Windows Name"
                      className="text-[15px]/[normal] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-medium text-left [white-space:nowrap]"
                    >
                      REST &amp; Webhook API
                    </div>
                  </div>
                  <div
                    data-pencil-id="hSeip"
                    data-pencil-name="Windows Col 2"
                    className="box-border w-[170px] shrink-0 h-fit flex flex-row gap-0 p-[12px_16px] justify-start items-center"
                  >
                    <div
                      data-pencil-id="CHbwT"
                      data-pencil-name="Windows Build"
                      className="text-[15px]/[normal] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                    >
                      JSON + SSE
                    </div>
                  </div>
                  <div
                    data-pencil-id="i5PIP1"
                    data-pencil-name="Windows Col 3"
                    className="box-border w-[305px] shrink-0 h-fit flex flex-row gap-0 p-[12px_16px] justify-start items-center"
                  >
                    <div
                      data-pencil-id="f4E27"
                      data-pencil-name="Windows Requires"
                      className="text-[15px]/[normal] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                    >
                      Bearer API token
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              data-pencil-id="BH87k"
              data-pencil-name="Install Unsupported Note Wrap"
              className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[16px_0px_0px_0px] justify-start items-start"
            >
              <div
                data-pencil-id="eeTph"
                data-pencil-name="Install Unsupported Note"
                className="text-[16.5px]/[28px] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
              >
                Telegram, WhatsApp and Slack bots connect directly via webhook—no client installs
                <br />
                required.
              </div>
            </div>

            <div
              data-pencil-id="pzaEG"
              data-pencil-name="Install Steps List"
              className="box-border w-full h-fit shrink-0 flex flex-col gap-[14px] p-[16px_0px_0px_0px] justify-start items-start"
            >
              <div
                data-pencil-id="D4Z1TO"
                data-pencil-name="Install Step 1"
                className="box-border w-full h-fit shrink-0 flex flex-row gap-[14px] justify-start items-start"
              >
                <div
                  data-pencil-id="PF3ET"
                  data-pencil-name="Install Step 1 Badge"
                  className="box-border w-[26px] shrink-0 h-[26px] flex flex-row gap-0 justify-center items-center [outline:1px_solid_#FFFFFF24] [outline-offset:-0.5px] rounded-[999px]"
                >
                  <div
                    data-pencil-id="D8zSZ"
                    data-pencil-name="Install Step 1 Num"
                    className="text-[13px]/[normal] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-medium text-left [white-space:nowrap]"
                  >
                    1
                  </div>
                </div>
                <div
                  data-pencil-id="cqV5F"
                  data-pencil-name="Install Step 1 Text Col"
                  className="box-border [flex:1_1_0] h-fit flex flex-col gap-0 justify-start items-start"
                >
                  <div
                    data-pencil-id="K3wa1"
                    data-pencil-name="Install Step 1 Line 1"
                    className="box-border w-fit h-fit shrink-0 flex flex-row gap-[5px] justify-start items-center"
                  >
                    <div
                      data-pencil-id="BwWx6"
                      data-pencil-name="Install Step 1 Lead"
                      className="text-[16.5px]/[28px] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold text-left [white-space:nowrap]"
                    >
                      In the WebApp,
                    </div>
                    <div
                      data-pencil-id="j3h08"
                      data-pencil-name="Install Step 1 Rest 1"
                      className="text-[16.5px]/[28px] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                    >
                      open rico.app to launch the split-screen financial
                    </div>
                  </div>
                  <div
                    data-pencil-id="Ch6kZ"
                    data-pencil-name="Install Step 1 Rest 2"
                    className="text-[16.5px]/[28px] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                  >
                    command center.
                  </div>
                </div>
              </div>

              <div
                data-pencil-id="lS1CZ"
                data-pencil-name="Install Step 2"
                className="box-border w-full h-fit shrink-0 flex flex-row gap-[14px] justify-start items-start"
              >
                <div
                  data-pencil-id="c6txYW"
                  data-pencil-name="Install Step 2 Badge"
                  className="box-border w-[26px] shrink-0 h-[26px] flex flex-row gap-0 justify-center items-center [outline:1px_solid_#FFFFFF24] [outline-offset:-0.5px] rounded-[999px]"
                >
                  <div
                    data-pencil-id="XOwKl"
                    data-pencil-name="Install Step 2 Num"
                    className="text-[13px]/[normal] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-medium text-left [white-space:nowrap]"
                  >
                    2
                  </div>
                </div>
                <div
                  data-pencil-id="R7DUh"
                  data-pencil-name="Install Step 2 Text Col"
                  className="box-border [flex:1_1_0] h-fit flex flex-col gap-0 justify-start items-start"
                >
                  <div
                    data-pencil-id="wGl2D"
                    data-pencil-name="Install Step 2 Line 1"
                    className="box-border w-fit h-fit shrink-0 flex flex-row gap-[5px] justify-start items-center"
                  >
                    <div
                      data-pencil-id="vEUl6"
                      data-pencil-name="Install Step 2 Lead"
                      className="text-[16.5px]/[28px] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold text-left [white-space:nowrap]"
                    >
                      For API access,
                    </div>
                    <div
                      data-pencil-id="OEVAc"
                      data-pencil-name="Install Step 2 Rest 1"
                      className="text-[16.5px]/[28px] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                    >
                      generate an API token in Settings and call /api/mandates.
                    </div>
                  </div>
                </div>
              </div>

              <div
                data-pencil-id="V412zI"
                data-pencil-name="Install Step 3"
                className="box-border w-full h-fit shrink-0 flex flex-row gap-[14px] justify-start items-start"
              >
                <div
                  data-pencil-id="aiTPx"
                  data-pencil-name="Install Step 3 Badge"
                  className="box-border w-[26px] shrink-0 h-[26px] flex flex-row gap-0 justify-center items-center [outline:1px_solid_#FFFFFF24] [outline-offset:-0.5px] rounded-[999px]"
                >
                  <div
                    data-pencil-id="oY9XE"
                    data-pencil-name="Install Step 3 Num"
                    className="text-[13px]/[normal] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-medium text-left [white-space:nowrap]"
                  >
                    3
                  </div>
                </div>
                <div
                  data-pencil-id="kMSoZ"
                  data-pencil-name="Install Step 3 Text Col"
                  className="box-border [flex:1_1_0] h-fit flex flex-col gap-0 justify-start items-start"
                >
                  <div
                    data-pencil-id="WJT2n"
                    data-pencil-name="Install Step 3 Rest 1"
                    className="text-[16.5px]/[28px] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                  >
                    Choose Autonomous or Manual Approval mode in the top bar.
                  </div>
                </div>
              </div>
            </div>

            <div
              data-pencil-id="XSY2R"
              data-pencil-name="Careful Note Outer"
              className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[16px_0px_0px_0px] justify-start items-start"
            >
              <div
                data-pencil-id="t8Hl8"
                data-pencil-name="Careful Note Box"
                className="box-border [flex:1_1_0] h-fit flex flex-row gap-[12px] p-[16px_18px] justify-start items-start bg-[#FFFFFF09] [outline:1px_solid_#FFFFFF17] [outline-offset:-0.5px] rounded-[12px]"
              >
                <div
                  data-pencil-id="zNcoB"
                  data-pencil-name="Careful Icon Wrap"
                  className="box-border w-[18px] shrink-0 h-[22px] flex flex-row gap-0 p-[2px_0px_0px_0px] justify-center items-center"
                >
                  <svg
                    data-pencil-id="g95q8"
                    data-pencil-name="Careful Warning Icon"
                    viewBox="0 0 24 24"
                    preserveAspectRatio="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="box-border w-[18px] shrink-0 h-[18px] overflow-visible"
                  >
                    <path
                      d="M13.9248 21h-3.8496c-4.63044 0-6.94565 0-7.79884-1.5061-0.85319-1.506 0.331-3.5025 2.69938-7.4954l1.92483-3.24517c2.27502-3.83555 3.41253-5.75333 5.09943-5.75333 1.6869 0 2.8244 1.91777 5.0994 5.75332l1.9249 3.24518c2.3683 3.9929 3.5525 5.9894 2.6993 7.4954-0.8532 1.5061-3.1684 1.5061-7.7988 1.5061z m-1.9248-12v4m0.125 3.75h-0.125m0.25 0c0 0.1381-0.1119 0.25-0.25 0.25-0.1381 0-0.25-0.1119-0.25-0.25 0-0.1381 0.1119-0.25 0.25-0.25 0.1381 0 0.25 0.1119 0.25 0.25z"
                      fill="none"
                      stroke="#E6CB80"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                </div>
                <div
                  data-pencil-id="fHWlY"
                  data-pencil-name="Careful Note Text Col"
                  className="box-border [flex:1_1_0] h-fit flex flex-col gap-[2px] justify-start items-start"
                >
                  <div
                    data-pencil-id="vyLzq"
                    data-pencil-name="Careful Note Title"
                    className="text-[14.5px]/[normal] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-0.087px] text-left [white-space:nowrap]"
                  >
                    Sandbox mode is active by default
                  </div>
                  <div
                    data-pencil-id="JL7Pg"
                    data-pencil-name="Careful Note Body"
                    className="text-[15.5px]/[25px] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                  >
                    New workspaces start in Sandbox mode so you can test live price verification,
                    <br />
                    anomaly holds and generative receipts without real charges.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section The welcome flow */}
          <div
            data-pencil-id="OizLv"
            data-pencil-name="Section The welcome flow"
            className="[box-sizing:content-box] w-[680px] h-[562.5px] shrink-0 flex flex-col gap-0 p-[44px_0px_0px_0px] justify-start items-start bg-[#09090B] [border-width:1px_0px_0px_0px] [border-style:solid] [border-color:#FFFFFF17] [margin:-0.5px_0px_0px_0px]"
          >
            <div
              data-pencil-id="j56n1"
              data-pencil-name="The welcome flow Heading"
              className="text-[28.8px]/[35px] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-0.864px] text-left [white-space:nowrap]"
            >
              The welcome flow
            </div>
            <div
              data-pencil-id="M9iozq"
              data-pencil-name="Welcome Flow Intro Wrap"
              className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[18px_0px_0px_0px] justify-start items-start"
            >
              <div
                data-pencil-id="RbLpX"
                data-pencil-name="Welcome Flow Intro"
                className="text-[16.5px]/[28px] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
              >
                The first launch walks you through a few short steps. Every one can be skipped with
                Skip,
                <br />
                or all of them with Skip setup, and everything it sets up can be changed later in
                Settings.
              </div>
            </div>

            <div
              data-pencil-id="ahJXP"
              data-pencil-name="Welcome Steps"
              className="box-border w-full h-fit shrink-0 flex flex-col gap-[14px] p-[16px_0px_0px_0px] justify-start items-start"
            >
              {[
                {
                  id: "x0hrx",
                  badgeId: "wx1ru",
                  numId: "tBFlj",
                  colId: "molIV",
                  line1Id: "duYTy",
                  leadId: "NgQC5",
                  lead: "Your name.",
                  rest1Id: "VlYlE",
                  rest1: "RICO uses it as your profile's display name.",
                },
                {
                  id: "IriEs",
                  badgeId: "L9PpGR",
                  numId: "kSyf8",
                  colId: "HUBFs",
                  line1Id: "u9BXi",
                  leadId: "VAwM7",
                  lead: "Persona.",
                  rest1Id: "hoXgM",
                  rest1: "Pick Startup Founder, Student or SMB so RICO can probe eligible $50k credits",
                  rest2Id: "JSHMU",
                  rest2: "and 50% education discounts.",
                },
                {
                  id: "ERnCH",
                  badgeId: "UBHss",
                  numId: "oIMka",
                  colId: "g782E",
                  line1Id: "yQxa4",
                  leadId: "Qzkki",
                  lead: "Mandates.",
                  rest1Id: "Vx8HY",
                  rest1: "Add the recurring subscriptions you pay every month and set a hard budget",
                  rest2Id: "wzhxV",
                  rest2: "ceiling for each one.",
                },
                {
                  id: "YWBdN",
                  badgeId: "O218s",
                  numId: "I68T6",
                  colId: "zjrmy",
                  line1Id: "Y69VZ1",
                  leadId: "Nr6G9",
                  lead: "Command Launcher.",
                  rest1Id: "j3rsG9",
                  rest1: "Press ⌘K or Ctrl+K from anywhere in the workspace to trigger payments,",
                  rest2Id: "cRPBm",
                  rest2: "pause mandates or search audit logs.",
                },
                {
                  id: "fYpke",
                  badgeId: "K4GHnl",
                  numId: "qGq7Z",
                  colId: "goGtB",
                  line1Id: "aJNUP",
                  leadId: "EFMiS",
                  lead: "Guardrails.",
                  rest1Id: "C2hl8",
                  rest1: "Choose Autonomous mode or Strict Manual Approval mode for your wallet.",
                },
                {
                  id: "BGHEH",
                  badgeId: "miWU4",
                  numId: "ivfA8",
                  colId: "a0KN4y",
                  line1Id: "s7xEGY",
                  leadId: "rh38a",
                  lead: "Intelligence.",
                  rest1Id: "Chq4u",
                  rest1: "RICO AI, or your own Gemini, Anthropic or OpenAI key. Skip it if",
                  rest2Id: "q9xz85",
                  rest2: "you only want manual dashboard tracking.",
                },
              ].map((s, idx) => (
                <div
                  key={s.id}
                  data-pencil-id={s.id}
                  data-pencil-name={`Welcome Step ${idx + 1}`}
                  className="box-border w-full h-fit shrink-0 flex flex-row gap-[14px] justify-start items-start"
                >
                  <div
                    data-pencil-id={s.badgeId}
                    data-pencil-name={`Welcome Step ${idx + 1} Badge`}
                    className="box-border w-[26px] shrink-0 h-[26px] flex flex-row gap-0 justify-center items-center [outline:1px_solid_#FFFFFF24] [outline-offset:-0.5px] rounded-[999px]"
                  >
                    <div
                      data-pencil-id={s.numId}
                      data-pencil-name={`Welcome Step ${idx + 1} Num`}
                      className="text-[13px]/[normal] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-medium text-left [white-space:nowrap]"
                    >
                      {idx + 1}
                    </div>
                  </div>
                  <div
                    data-pencil-id={s.colId}
                    data-pencil-name={`Welcome Step ${idx + 1} Text Col`}
                    className="box-border [flex:1_1_0] h-fit flex flex-col gap-0 justify-start items-start"
                  >
                    <div
                      data-pencil-id={s.line1Id}
                      data-pencil-name={`Welcome Step ${idx + 1} Line 1`}
                      className="box-border w-fit h-fit shrink-0 flex flex-row gap-[5px] justify-start items-center"
                    >
                      <div
                        data-pencil-id={s.leadId}
                        data-pencil-name={`Welcome Step ${idx + 1} Lead`}
                        className="text-[16.5px]/[28px] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold text-left [white-space:nowrap]"
                      >
                        {s.lead}
                      </div>
                      <div
                        data-pencil-id={s.rest1Id}
                        data-pencil-name={`Welcome Step ${idx + 1} Rest 1`}
                        className="text-[16.5px]/[28px] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                      >
                        {s.rest1}
                      </div>
                    </div>
                    {s.rest2 && (
                      <div
                        data-pencil-id={s.rest2Id}
                        data-pencil-name={`Welcome Step ${idx + 1} Rest 2`}
                        className="text-[16.5px]/[28px] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                      >
                        {s.rest2}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div
              data-pencil-id="FHq0F"
              data-pencil-name="Welcome Flow Outro Wrap"
              className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[16px_0px_0px_0px] justify-start items-start"
            >
              <div
                data-pencil-id="Hos99"
                data-pencil-name="Welcome Flow Outro"
                className="text-[16.5px]/[28px] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
              >
                Choose Launch Command Center on the last step.
              </div>
            </div>
          </div>

          {/* Section Bring your subscriptions with you */}
          <div
            data-pencil-id="khDMO"
            data-pencil-name="Section Bring your browsing with you"
            className="[box-sizing:content-box] w-[680px] h-[478.5px] shrink-0 flex flex-col gap-0 p-[44px_0px_0px_0px] justify-start items-start bg-[#09090B] [border-width:1px_0px_0px_0px] [border-style:solid] [border-color:#FFFFFF17] [margin:-0.5px_0px_0px_0px]"
          >
            <div
              data-pencil-id="JhJnQ"
              data-pencil-name="Bring your browsing with you Heading"
              className="text-[28.8px]/[35px] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-0.864px] text-left [white-space:nowrap]"
            >
              Bring your subscriptions with you
            </div>
            <div
              data-pencil-id="sZF7x"
              data-pencil-name="Import Main Body Wrap"
              className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[18px_0px_0px_0px] justify-start items-start"
            >
              <div
                data-pencil-id="vxVVZ"
                data-pencil-name="Import Main Body"
                className="text-[16.5px]/[28px] box-border [flex:1_1_0] text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal text-left"
              >
                RICO imports recurring subscriptions from CSV or plain-text chat prompts. It sets up
                your merchant URLs, baseline prices and monthly billing dates in the AG Grid table.
                Raw card numbers are never imported—payment methods are linked via Zero-Knowledge
                Vault tokens.
              </div>
            </div>
            <div
              data-pencil-id="QWugs"
              data-pencil-name="Import After Lead Wrap"
              className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[14px_0px_0px_0px] justify-start items-start"
            >
              <div
                data-pencil-id="E1Wnu"
                data-pencil-name="Import After Lead"
                className="text-[16.5px]/[28px] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
              >
                To import subscriptions from Settings:
              </div>
            </div>
            <div
              data-pencil-id="G3m7i"
              data-pencil-name="Import Steps"
              className="box-border w-full h-fit shrink-0 flex flex-col gap-[14px] p-[16px_0px_0px_0px] justify-start items-start"
            >
              <div
                data-pencil-id="S2keaM"
                data-pencil-name="Import Step 1"
                className="box-border w-full h-fit shrink-0 flex flex-row gap-[14px] justify-start items-start"
              >
                <div
                  data-pencil-id="PfnpZ"
                  data-pencil-name="Import Step 1 Badge"
                  className="box-border w-[26px] shrink-0 h-[26px] flex flex-row gap-0 justify-center items-center [outline:1px_solid_#FFFFFF24] [outline-offset:-0.5px] rounded-[999px]"
                >
                  <div
                    data-pencil-id="nkhDz"
                    data-pencil-name="Import Step 1 Num"
                    className="text-[13px]/[normal] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-medium text-left [white-space:nowrap]"
                  >
                    1
                  </div>
                </div>
                <div
                  data-pencil-id="nU87I"
                  data-pencil-name="Import Step 1 Text Col"
                  className="box-border [flex:1_1_0] h-fit flex flex-col gap-0 justify-start items-start"
                >
                  <div
                    data-pencil-id="xe44w"
                    data-pencil-name="Import Step 1 Rest 1"
                    className="text-[16.5px]/[28px] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                  >
                    Export your recurring billing list or type your active subscriptions in chat.
                  </div>
                </div>
              </div>

              <div
                data-pencil-id="boWUD"
                data-pencil-name="Import Step 2"
                className="box-border w-full h-fit shrink-0 flex flex-row gap-[14px] justify-start items-start"
              >
                <div
                  data-pencil-id="pQMx4"
                  data-pencil-name="Import Step 2 Badge"
                  className="box-border w-[26px] shrink-0 h-[26px] flex flex-row gap-0 justify-center items-center [outline:1px_solid_#FFFFFF24] [outline-offset:-0.5px] rounded-[999px]"
                >
                  <div
                    data-pencil-id="l257jd"
                    data-pencil-name="Import Step 2 Num"
                    className="text-[13px]/[normal] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-medium text-left [white-space:nowrap]"
                  >
                    2
                  </div>
                </div>
                <div
                  data-pencil-id="vGG1l"
                  data-pencil-name="Import Step 2 Text Col"
                  className="box-border [flex:1_1_0] h-fit flex flex-col gap-0 justify-start items-start"
                >
                  <div
                    data-pencil-id="dXDg7"
                    data-pencil-name="Import Step 2 Key Row"
                    className="box-border w-fit h-fit shrink-0 flex flex-row gap-[5px] justify-start items-center"
                  >
                    <div
                      data-pencil-id="w3lP5x"
                      data-pencil-name="Step 2 Text Open Settings with"
                      className="text-[16.5px]/[28px] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                    >
                      Open Settings with
                    </div>
                    <div
                      data-pencil-id="V70NFC"
                      data-pencil-name="Key Pair ⌘"
                      className="box-border w-fit shrink-0 h-fit flex flex-row gap-[4px] justify-start items-center"
                    >
                      <div
                        data-pencil-id="CwAMy"
                        data-pencil-name="Kbd ⌘"
                        className="box-border w-fit shrink-0 h-[23px] flex flex-row gap-0 p-[0px_7px] justify-center items-center bg-[#111113] [outline:1px_solid_#FFFFFF24] [outline-offset:-0.5px] rounded-[6px]"
                      >
                        <div
                          data-pencil-id="q3FtaW"
                          data-pencil-name="Kbd Label ⌘"
                          className="text-[13.5px]/[normal] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-medium text-left [white-space:nowrap]"
                        >
                          ⌘
                        </div>
                      </div>
                      <div
                        data-pencil-id="jfjC8"
                        data-pencil-name="Kbd ,"
                        className="box-border w-fit shrink-0 h-[23px] flex flex-row gap-0 p-[0px_7px] justify-center items-center bg-[#111113] [outline:1px_solid_#FFFFFF24] [outline-offset:-0.5px] rounded-[6px]"
                      >
                        <div
                          data-pencil-id="GwWIr"
                          data-pencil-name="Kbd Label ,"
                          className="text-[13.5px]/[normal] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-medium text-left [white-space:nowrap]"
                        >
                          ,
                        </div>
                      </div>
                    </div>
                    <div
                      data-pencil-id="htNp9"
                      data-pencil-name="Step 2 Text on macOS or"
                      className="text-[16.5px]/[28px] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                    >
                      or
                    </div>
                    <div
                      data-pencil-id="f3o0sw"
                      data-pencil-name="Key Pair Ctrl"
                      className="box-border w-fit shrink-0 h-fit flex flex-row gap-[4px] justify-start items-center"
                    >
                      <div
                        data-pencil-id="yd6Rt"
                        data-pencil-name="Kbd Ctrl"
                        className="box-border w-fit shrink-0 h-[23px] flex flex-row gap-0 p-[0px_7px] justify-center items-center bg-[#111113] [outline:1px_solid_#FFFFFF24] [outline-offset:-0.5px] rounded-[6px]"
                      >
                        <div
                          data-pencil-id="tkhmr"
                          data-pencil-name="Kbd Label Ctrl"
                          className="text-[13.5px]/[normal] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-medium text-left [white-space:nowrap]"
                        >
                          Ctrl
                        </div>
                      </div>
                      <div
                        data-pencil-id="rm1R1"
                        data-pencil-name="Kbd ,"
                        className="box-border w-fit shrink-0 h-[23px] flex flex-row gap-0 p-[0px_7px] justify-center items-center bg-[#111113] [outline:1px_solid_#FFFFFF24] [outline-offset:-0.5px] rounded-[6px]"
                      >
                        <div
                          data-pencil-id="hASeZ"
                          data-pencil-name="Kbd Label ,"
                          className="text-[13.5px]/[normal] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-medium text-left [white-space:nowrap]"
                        >
                          ,
                        </div>
                      </div>
                    </div>
                    <div
                      data-pencil-id="JPmfz"
                      data-pencil-name="Step 2 Text on Windows, and go to"
                      className="text-[16.5px]/[28px] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                    >
                      in the WebApp, and go to
                    </div>
                    <div
                      data-pencil-id="Wozks"
                      data-pencil-name="Step 2 Text General."
                      className="text-[16.5px]/[28px] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold text-left [white-space:nowrap]"
                    >
                      General.
                    </div>
                  </div>
                </div>
              </div>

              <div
                data-pencil-id="yWUzE"
                data-pencil-name="Import Step 3"
                className="box-border w-full h-fit shrink-0 flex flex-row gap-[14px] justify-start items-start"
              >
                <div
                  data-pencil-id="t7UauO"
                  data-pencil-name="Import Step 3 Badge"
                  className="box-border w-[26px] shrink-0 h-[26px] flex flex-row gap-0 justify-center items-center [outline:1px_solid_#FFFFFF24] [outline-offset:-0.5px] rounded-[999px]"
                >
                  <div
                    data-pencil-id="wOqcX"
                    data-pencil-name="Import Step 3 Num"
                    className="text-[13px]/[normal] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-medium text-left [white-space:nowrap]"
                  >
                    3
                  </div>
                </div>
                <div
                  data-pencil-id="qEkLZ"
                  data-pencil-name="Import Step 3 Text Col"
                  className="box-border [flex:1_1_0] h-fit flex flex-col gap-0 justify-start items-start"
                >
                  <div
                    data-pencil-id="dbKz3"
                    data-pencil-name="Import Step 3 Rest 1"
                    className="text-[16.5px]/[28px] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                  >
                    Under Import mandates, paste your list or upload CSV, set your default budget
                  </div>
                  <div
                    data-pencil-id="kw4cc"
                    data-pencil-name="Import Step 3 Rest 2"
                    className="text-[16.5px]/[28px] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                  >
                    ceilings, and start the import.
                  </div>
                </div>
              </div>
            </div>

            <div
              data-pencil-id="WbfmB"
              data-pencil-name="Import macOS Note Wrap"
              className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[16px_0px_0px_0px] justify-start items-start"
            >
              <div
                data-pencil-id="GVuLA"
                data-pencil-name="Import macOS Note"
                className="text-[16.5px]/[28px] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
              >
                Every imported subscription runs an initial Playwright CDP price check so your
                baseline
                <br />
                prices are verified immediately.
              </div>
            </div>
          </div>

          {/* Section Connect your payment rails */}
          <div
            data-pencil-id="xdfE3"
            data-pencil-name="Section Make RICO your default browser"
            className="[box-sizing:content-box] w-[680px] h-[208.5px] shrink-0 flex flex-col gap-0 p-[44px_0px_0px_0px] justify-start items-start bg-[#09090B] [border-width:1px_0px_0px_0px] [border-style:solid] [border-color:#FFFFFF17] [margin:-0.5px_0px_0px_0px]"
          >
            <div
              data-pencil-id="P1nxn"
              data-pencil-name="Make RICO your default browser Heading"
              className="text-[28.8px]/[35px] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-0.864px] text-left [white-space:nowrap]"
            >
              Connect your payment rails
            </div>
            <div
              data-pencil-id="Nwjal"
              data-pencil-name="Default Browser Body Wrap"
              className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[18px_0px_0px_0px] justify-start items-start"
            >
              <div
                data-pencil-id="MxWor"
                data-pencil-name="Default Browser Body"
                className="text-[16.5px]/[28px] box-border [flex:1_1_0] text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal text-left"
              >
                Open Settings › Vault and link your primary wallet and optional backup Visa or
                Mastercard. RICO stores only opaque vault tokens in SQLite—the AI model never sees
                raw PAN or CVV data. Enable Auto-Failover if you want backup rails to cover
                direct-card merchants.
              </div>
            </div>
          </div>

          {/* Section Do I need an account? */}
          <div
            data-pencil-id="HoiU9"
            data-pencil-name="Section Do I need an account?"
            className="[box-sizing:content-box] w-[680px] h-[222.5px] shrink-0 flex flex-col gap-0 p-[44px_0px_0px_0px] justify-start items-start bg-[#09090B] [border-width:1px_0px_0px_0px] [border-style:solid] [border-color:#FFFFFF17] [margin:-0.5px_0px_0px_0px]"
          >
            <div
              data-pencil-id="wtYOA"
              data-pencil-name="Do I need an account? Heading"
              className="text-[28.8px]/[35px] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-0.864px] text-left [white-space:nowrap]"
            >
              Do I need an account?
            </div>
            <div
              data-pencil-id="KC8My"
              data-pencil-name="Account Body 1 Wrap"
              className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[18px_0px_0px_0px] justify-start items-start"
            >
              <div
                data-pencil-id="pJcSr"
                data-pencil-name="Account Body 1"
                className="text-[16.5px]/[28px] box-border [flex:1_1_0] text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal text-left"
              >
                No. Exploring the WebApp, Calm Pricing Lens and local mandate simulations need no
                account, and neither does running with your own Gemini, Anthropic or OpenAI API
                keys.
              </div>
            </div>
            <div
              data-pencil-id="DAq6J"
              data-pencil-name="Account Body 2 Wrap"
              className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[14px_0px_0px_0px] justify-start items-start"
            >
              <div
                data-pencil-id="yTM09"
                data-pencil-name="Account Body 2"
                className="text-[16.5px]/[28px] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
              >
                An account is only for RICO AI, our hosted models, and it is free to start. See
                Models
                <br />
                and keys for plans and credits.
              </div>
            </div>
          </div>

          {/* Section Updates */}
          <div
            data-pencil-id="b1eCm4"
            data-pencil-name="Section Updates"
            className="[box-sizing:content-box] w-[680px] h-[180.5px] shrink-0 flex flex-col gap-0 p-[44px_0px_0px_0px] justify-start items-start bg-[#09090B] [border-width:1px_0px_0px_0px] [border-style:solid] [border-color:#FFFFFF17] [margin:-0.5px_0px_0px_0px]"
          >
            <div
              data-pencil-id="hZzyh"
              data-pencil-name="Updates Heading"
              className="text-[28.8px]/[35px] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-0.864px] text-left [white-space:nowrap]"
            >
              Updates
            </div>
            <div
              data-pencil-id="smoOx"
              data-pencil-name="Updates Body Wrap"
              className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[18px_0px_0px_0px] justify-start items-start"
            >
              <div
                data-pencil-id="sbatu"
                data-pencil-name="Updates Body"
                className="text-[16.5px]/[28px] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
              >
                RICO applies updates in the background and activates them when you choose
                <br />
                Reload to update. To check right now, open Settings › About and choose Check now.
                <br />
                What changed in each release is in the changelog.
              </div>
            </div>
          </div>

          {/* Section Where to go next */}
          <div
            data-pencil-id="AZrXU"
            data-pencil-name="Section Where to go next"
            className="[box-sizing:content-box] w-[680px] h-[232.5px] shrink-0 flex flex-col gap-0 p-[44px_0px_0px_0px] justify-start items-start bg-[#09090B] [border-width:1px_0px_0px_0px] [border-style:solid] [border-color:#FFFFFF17] [margin:-0.5px_0px_0px_0px]"
          >
            <div
              data-pencil-id="TqYCd"
              data-pencil-name="Where to go next Heading"
              className="text-[28.8px]/[35px] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-0.864px] text-left [white-space:nowrap]"
            >
              Where to go next
            </div>
            <div
              data-pencil-id="Z0ghRL"
              data-pencil-name="Where to go next List"
              className="box-border w-full h-fit shrink-0 flex flex-col gap-[8px] p-[18px_0px_0px_0px] justify-start items-start"
            >
              {[
                {
                  id: "TAnbD",
                  wrapId: "VRSwh",
                  dotId: "Q05sV",
                  rowId: "gus77",
                  linkId: "n62MPT",
                  link: "Verification Engine",
                  restId: "U7zBhF",
                  rest: "covers the 30 FPS viewport, Calm Pricing Lens and Parallel Helpers.",
                },
                {
                  id: "xZLPS",
                  wrapId: "V14lh",
                  dotId: "kYRfH",
                  rowId: "XT4YE",
                  linkId: "esJk4",
                  link: "Ask RICO",
                  restId: "e51la",
                  rest: "is the assistant that reads the page in front of you.",
                },
                {
                  id: "q66hw",
                  wrapId: "kWNK7",
                  dotId: "WwmDB",
                  rowId: "RoNkK",
                  linkId: "W25szL",
                  link: "Work and agents",
                  restId: "sCugL",
                  rest: "explains the canvas and what agents may do.",
                },
                {
                  id: "RBOHa",
                  wrapId: "cTWgv",
                  dotId: "PVGpz",
                  rowId: "yfuYN",
                  linkId: "AamCN",
                  link: "Keyboard shortcuts",
                  restId: "R7wcUk",
                  rest: "lists every default key.",
                },
              ].map((b, idx) => (
                <div
                  key={b.id}
                  data-pencil-id={b.id}
                  data-pencil-name={`Next Bullet ${idx + 1}`}
                  className="box-border w-full h-fit shrink-0 flex flex-row gap-[10px] justify-start items-center"
                >
                  <div
                    data-pencil-id={b.wrapId}
                    data-pencil-name={`Next Dot Wrap ${idx + 1}`}
                    className="box-border w-[10px] shrink-0 h-[24px] flex flex-row gap-0 p-[10px_0px_0px_4px] justify-start items-start"
                  >
                    <div
                      data-pencil-id={b.dotId}
                      data-pencil-name={`Next Dot ${idx + 1}`}
                      className="box-border w-[5px] shrink-0 h-[5px] bg-[#F4F4F66B] rounded-[50%]"
                    />
                  </div>
                  <div
                    data-pencil-id={b.rowId}
                    data-pencil-name={`Next Text Row ${idx + 1}`}
                    className="box-border w-fit shrink-0 h-fit flex flex-row gap-[5px] justify-start items-center"
                  >
                    <div
                      data-pencil-id={b.linkId}
                      data-pencil-name={`Next Link ${idx + 1}`}
                      className="text-[16.5px]/[28px] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                    >
                      {b.link}
                    </div>
                    <div
                      data-pencil-id={b.restId}
                      data-pencil-name={`Next Rest ${idx + 1}`}
                      className="text-[16.5px]/[28px] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                    >
                      {b.rest}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          data-pencil-id="O3dcpj"
          data-pencil-name="Article Pager Outer"
          className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[72px_0px_0px_0px] justify-end items-center bg-[#09090B]"
        >
          <Link
            href="/docs/verification-engine"
            data-pencil-id="SA3Kh"
            data-pencil-name="Pager Next Card"
            className="box-border w-[334px] shrink-0 h-[82px] flex flex-row gap-0 p-[18px_20px] justify-between items-center [outline:1px_solid_#FFFFFF24] [outline-offset:-0.5px] rounded-[20px] hover:bg-[#FFFFFF08] transition-colors no-underline"
          >
            <div
              data-pencil-id="x5ZDs"
              data-pencil-name="Pager Left Spacer"
              className="box-border w-[1px] shrink-0 h-[1px] flex flex-row gap-0 justify-start items-start"
            />
            <div
              data-pencil-id="KoVsS"
              data-pencil-name="Pager Next Right"
              className="box-border w-fit shrink-0 h-fit flex flex-row gap-[14px] justify-start items-center"
            >
              <div
                data-pencil-id="Qiuln"
                data-pencil-name="Pager Next Text Col"
                className="box-border w-fit shrink-0 h-fit flex flex-col gap-[2px] justify-start items-end"
              >
                <div
                  data-pencil-id="eErjQ"
                  data-pencil-name="Pager Next Small"
                  className="text-[13px]/[normal] box-border text-[#F4F4F66B] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
                >
                  Next
                </div>
                <div
                  data-pencil-id="HHkyI"
                  data-pencil-name="Pager Next Title"
                  className="text-[16px]/[normal] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-0.192px] text-left [white-space:nowrap]"
                >
                  Verification Engine
                </div>
              </div>
              <svg
                data-pencil-id="WL4uK"
                data-pencil-name="Pager Next Chevron"
                viewBox="0 0 24 24"
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
                className="box-border w-[18px] shrink-0 h-[18px] overflow-visible"
              >
                <path
                  d="M9.00005 6c0 0 5.99995 4.4189 5.99995 6 0 1.5812-6 6-6 6"
                  fill="none"
                  stroke="#F4F4F66B"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>
          </Link>
        </div>

        <div
          data-pencil-id="ONCPG"
          data-pencil-name="Article Feedback Wrap"
          className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[40px_0px_0px_0px] justify-start items-start bg-[#09090B]"
        >
          <div
            data-pencil-id="A2lyW"
            data-pencil-name="Article Feedback Text"
            className="text-[14.5px]/[23px] box-border text-[#F4F4F66B] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
          >
            Something wrong or missing on this page? Tell us on GitHub or in the Discord, or write
            to
            <br />
            support@rico.app.
          </div>
        </div>
      </div>

      {/* Right Outline Column */}
      <div
        data-pencil-id="W5aiBy"
        data-pencil-name="Docs Outline Column"
        className="box-border w-[200px] shrink-0 h-fit flex flex-col gap-0 p-[68px_0px_0px_0px] justify-start items-start"
      >
        <div
          data-pencil-id="VugSM"
          data-pencil-name="Outline Heading Wrap"
          className="box-border w-fit h-fit shrink-0 flex flex-row gap-0 p-[0px_14px_10px_14px] justify-start items-start"
        >
          <div
            data-pencil-id="cX1aC"
            data-pencil-name="Outline Heading"
            className="text-[12.5px]/[normal] box-border text-[#F4F4F66B] font-[Geist,system-ui,sans-serif] font-medium tracking-[0.25px] text-left [white-space:nowrap]"
          >
            On this page
          </div>
        </div>
        <div
          data-pencil-id="FVofV"
          data-pencil-name="Outline List"
          className="[box-sizing:content-box] w-[199.5px] h-[241px] shrink-0 flex flex-col gap-0 justify-start items-start [border-width:0px_0px_0px_1px] [border-style:solid] [border-color:#FFFFFF17] [margin:0px_0px_0px_-0.5px]"
        >
          <div
            data-pencil-id="D2i6gT"
            data-pencil-name="Outline Item 1"
            className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[5px_14px] justify-start items-start"
          >
            <div
              data-pencil-id="N8UhI"
              data-pencil-name="Outline Link 1"
              className="text-[13.5px]/[19px] box-border text-[#F4F4F66B] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
            >
              Launch RICO
            </div>
          </div>
          <div
            data-pencil-id="UAgpP"
            data-pencil-name="Outline Item 2"
            className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[5px_14px] justify-start items-start"
          >
            <div
              data-pencil-id="avwl8"
              data-pencil-name="Outline Link 2"
              className="text-[13.5px]/[19px] box-border text-[#F4F4F66B] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
            >
              The welcome flow
            </div>
          </div>
          <div
            data-pencil-id="FRLFS"
            data-pencil-name="Outline Item 3"
            className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[5px_14px] justify-start items-start"
          >
            <div
              data-pencil-id="L7X0s"
              data-pencil-name="Outline Link 3"
              className="text-[13.5px]/[19px] box-border text-[#F4F4F66B] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
            >
              Bring your subscriptions
              <br />
              with you
            </div>
          </div>
          <div
            data-pencil-id="H6ctR"
            data-pencil-name="Outline Item 4"
            className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[5px_14px] justify-start items-start"
          >
            <div
              data-pencil-id="ISmaW"
              data-pencil-name="Outline Link 4"
              className="text-[13.5px]/[19px] box-border text-[#F4F4F66B] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
            >
              Connect your
              <br />
              payment rails
            </div>
          </div>
          <div
            data-pencil-id="O37Yx"
            data-pencil-name="Outline Item 5"
            className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[5px_14px] justify-start items-start"
          >
            <div
              data-pencil-id="KhiUW"
              data-pencil-name="Outline Link 5"
              className="text-[13.5px]/[19px] box-border text-[#F4F4F66B] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
            >
              Do I need an account?
            </div>
          </div>
          <div
            data-pencil-id="SYzHn"
            data-pencil-name="Outline Item 6"
            className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[5px_14px] justify-start items-start"
          >
            <div
              data-pencil-id="SZYMy"
              data-pencil-name="Outline Link 6"
              className="text-[13.5px]/[19px] box-border text-[#F4F4F66B] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
            >
              Updates
            </div>
          </div>
          <div
            data-pencil-id="U31RN"
            data-pencil-name="Outline Item 7"
            className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[5px_14px] justify-start items-start"
          >
            <div
              data-pencil-id="M9vw5"
              data-pencil-name="Outline Link 7"
              className="text-[13.5px]/[19px] box-border text-[#F4F4F66B] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
            >
              Where to go next
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
