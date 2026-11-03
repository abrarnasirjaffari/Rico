import React from "react";
import Link from "next/link";

export const DOCS_SIDENAV_ITEMS = [
  {
    slug: "getting-started",
    href: "/docs/getting-started",
    id: "VWdMm",
    name: "SideNav Getting started",
    iconId: "vuBWA",
    iconName: "Getting started Nav Icon",
    labelId: "vmmgM",
    labelName: "Getting started Nav Label",
    label: "Getting started",
    iconD:
      "M6.21875 11.618l-2.90686-0.3802c-0.59545-0.0772-0.99306-0.6537-0.72841-1.192 0.84175-1.71215 3.03602-3.69143 7.1564-3.36501m-3.52113 4.93721c1.0557-1.76374 2.353-3.61365 3.52113-4.93721m-3.52113 4.93721l5.66325 5.6632m-2.14212-10.60041c3.67062-4.09093 7.43462-4.95279 9.85382-4.61394 0.9571 0.13405 1.7054 0.88232 1.8395 1.83941 0.3388 2.41925-0.5231 6.18324-4.614 9.85384m-4.9372 3.5211l0.3802 2.9069c0.0772 0.5955 0.6537 0.9931 1.192 0.7284 1.7122-0.8417 3.6914-3.036 3.365-7.1564m-4.9372 3.5211c1.7637-1.0557 3.6136-2.353 4.9372-3.5211m0.6808-5.7601c0-1.10457-0.8954-2-2-2-1.1046 0-2 0.89543-2 2 0 1.10457 0.8954 2 2 2 1.1046 0 2-0.89543 2-2z m-13.5 14l4-4m-4-1l1.5-1.5",
  },
  {
    slug: "verification-engine",
    href: "/docs/verification-engine",
    id: "DmwaV",
    name: "SideNav Browse",
    iconId: "i7JEyy",
    iconName: "Browse Nav Icon",
    labelId: "qX6IA",
    labelName: "Browse Nav Label",
    label: "Verification Engine",
    iconD:
      "M2 12a10 10 0 1 0 20 0 10 10 0 1 0-20 0z m6 0c0 6 4 10 4 10 0 0 4-4 4-10 0-6-4-10-4-10 0 0-4 4-4 10z m13 3h-18m18-6h-18",
  },
  {
    slug: "ask-rico",
    href: "/docs/ask-rico",
    id: "f8rtq",
    name: "SideNav Ask RICO",
    iconId: "AbRTE",
    iconName: "Ask RICO Nav Icon",
    labelId: "V53kri",
    labelName: "Ask RICO Nav Label",
    label: "Ask RICO",
    iconD:
      "M15 2l0.5387 2.39157c0.457 2.02858 2.0411 3.61274 4.0697 4.0697l2.3916 0.53873-2.3916 0.53873c-2.0286 0.45696-3.6127 2.04107-4.0697 4.06967l-0.5387 2.3916-0.5387-2.3916c-0.457-2.0286-2.0411-3.61271-4.0697-4.06967l-2.3916-0.53873 2.3916-0.53873c2.0285-0.45696 3.6127-2.04112 4.0697-4.06969l0.5387-2.39158z m-8 10l0.38481 1.7083c0.3264 1.4489 1.45794 2.5805 2.90689 2.9069l1.7083 0.3848-1.7083 0.3848c-1.44895 0.3264-2.58049 1.4579-2.90689 2.9069l-0.38481 1.7083-0.38481-1.7083c-0.3264-1.449-1.45794-2.5805-2.90692-2.9069l-1.70827-0.3848 1.70827-0.3848c1.44898-0.3264 2.58052-1.4579 2.90692-2.9069l0.38481-1.7083z",
  },
  {
    slug: "mandates-and-guardrails",
    href: "/docs/mandates-and-guardrails",
    id: "k69dPb",
    name: "SideNav Work and agents",
    iconId: "JmsW7",
    iconName: "Work and agents Nav Icon",
    labelId: "vNhMA",
    labelName: "Work and agents Nav Label",
    label: "Mandates & Guardrails",
    iconD:
      "M8.49869 6.50012c0-1.40446 0-2.10669 0.33706-2.61114 0.14592-0.21838 0.33342-0.40588 0.5518-0.5518 0.50444-0.33706 1.20665-0.33706 2.61115-0.33706 1.4045 0 2.1067 0 2.6111 0.33706 0.2184 0.14592 0.4059 0.33342 0.5518 0.5518 0.3371 0.50445 0.3371 1.20668 0.3371 2.61114m4.4994 0.00016l-15.99909-0.00016c-1.10446 0.00007-2.0001 0.89568-2.0002 2.00013 0.0001 2.20895 1.79139 4.00025 4.00035 4.00045h11.99884c2.2089-0.0001 4.0001-1.7913 4.0002-4.00028 0-1.10448-0.8956-2.00006-2.0001-2.00014z m-12.49941 4.49982v3m9.00001 0v-3m-14.49756-2.49998l-0.00215 5.49698c-0.00129 3.3009-0.00194 4.9514 1.02324 5.977 1.02518 1.0256 2.67566 1.0257 5.9766 1.0257l6.00107 0.0002c3.2993 0 4.949 0.0001 5.9741-1.0248 1.0251-1.0249 1.0254-2.6746 1.0261-5.9739l0.001-5.50118",
  },
  {
    slug: "models-and-keys",
    href: "/docs/models-and-keys",
    id: "v0uMj",
    name: "SideNav Models and keys",
    iconId: "bh5rG",
    iconName: "Models and keys Nav Icon",
    labelId: "uW0QY",
    labelName: "Models and keys Nav Label",
    label: "Models and keys",
    iconD:
      "M4 12c0-3.77124 0-5.65685 1.17157-6.82843 1.17158-1.17157 3.05719-1.17157 6.82843-1.17157 3.7712 0 5.6569 0 6.8284 1.17157 1.1716 1.17158 1.1716 3.05719 1.1716 6.82843 0 3.7712 0 5.6569-1.1716 6.8284-1.1715 1.1716-3.0572 1.1716-6.8284 1.1716-3.77124 0-5.65685 0-6.82843-1.1716-1.17157-1.1715-1.17157-3.0572-1.17157-6.8284z m3.73223 4.2678c0.73224 0.7322 1.91075 0.7322 4.26777 0.7322 0.7898 0 1.4473 0 2-0.0276l2.9724-2.9724c0.0276-0.5527 0.0276-1.2102 0.0276-2 0-2.35702 0-3.53553-0.7322-4.26777-0.7323-0.73223-1.9108-0.73223-4.2678-0.73223-2.35702 0-3.53553 0-4.26777 0.73223-0.73223 0.73224-0.73223 1.91075-0.73223 4.26777 0 2.357 0 3.5355 0.73223 4.2678z m0.26777-14.2678v2m8-2v2m-4-2v2m-4 16v2m4-2v2m4-2v2m6-6h-2m-16-8h-2m2 8h-2m2-4h-2m20-4h-2m2 4h-2",
  },
  {
    slug: "omnichannel-bots",
    href: "/docs/omnichannel-bots",
    id: "sKEjz",
    name: "SideNav Extensions",
    iconId: "owAQT",
    iconName: "Extensions Nav Icon",
    labelId: "V7x1I",
    labelName: "Extensions Nav Label",
    label: "Omnichannel Bots",
    iconD:
      "M12.828 6.00096c0.1108-0.31305 0.171-0.64997 0.171-1.00096 0-1.65685-1.3431-3-2.99996-3-1.65685 0-3 1.34315-3 3 0 0.35099 0.06028 0.68791 0.17104 1.00096-2.28476 0.00834-3.50407 0.08943-4.29236 0.87772-0.78821 0.78821-0.86936 2.00735-0.87772 4.29172 0.31251-0.1104 0.64876-0.1704 0.99904-0.1704 1.65686 0 3 1.3431 3 3 0 1.6569-1.34314 3-3 3-0.35028 0-0.68653-0.06-0.99904-0.1704 0.00836 2.2844 0.08951 3.5035 0.87772 4.2917 0.78821 0.7882 2.00736 0.8694 4.29169 0.8777-0.11033-0.3125-0.17037-0.6487-0.17037-0.999 0-1.6569 1.34315-3 3-3 1.65686 0 2.99996 1.3431 2.99996 3 0 0.3503-0.06 0.6865-0.1703 0.999 2.2843-0.0083 3.5035-0.0895 4.2917-0.8777 0.7882-0.7883 0.8693-2.0076 0.8777-4.2923 0.313 0.1107 0.6499 0.171 1.0009 0.171 1.6569 0 3-1.3431 3-3 0-1.6569-1.3431-3-3-3-0.351 0-0.6879 0.0603-1.0009 0.171-0.0084-2.28473-0.0895-3.50403-0.8777-4.29232-0.7883-0.78829-2.0076-0.86938-4.2924-0.87772z",
  },
  {
    slug: "privacy-and-security",
    href: "/docs/privacy-and-security",
    id: "nWEfj",
    name: "SideNav Privacy and security",
    iconId: "NeD53",
    iconName: "Privacy and security Nav Icon",
    labelId: "tRrcd",
    labelName: "Privacy and security Nav Label",
    label: "Privacy and security",
    iconD:
      "M18.7088 3.49534c-1.8923-0.94152-4.2079-1.49534-6.7088-1.49534-2.5009 0-4.8165 0.55382-6.70884 1.49534-0.92798 0.46172-1.39197 0.69258-1.84156 1.41844-0.4496 0.72587-0.4496 1.4287-0.4496 2.83436v3.48896c0 5.6834 4.54236 8.8433 7.173 10.1967 0.7337 0.3775 1.1005 0.5662 1.827 0.5662 0.7265 0 1.0933-0.1887 1.8269-0.5662 2.6307-1.3534 7.1731-4.5133 7.1731-10.1967l0-3.48896c0-1.40565 0-2.10848-0.4496-2.83436-0.4496-0.72587-0.9136-0.95672-1.8416-1.41844z",
  },
  {
    slug: "keyboard-shortcuts",
    href: "/docs/keyboard-shortcuts",
    id: "NoNpv",
    name: "SideNav Keyboard shortcuts",
    iconId: "IbmX2",
    iconName: "Keyboard shortcuts Nav Icon",
    labelId: "xvq1h",
    labelName: "Keyboard shortcuts Nav Label",
    label: "Keyboard shortcuts",
    iconD:
      "M14.5 7h-5c-3.28748 0-4.93122 0-6.03757 0.90796-0.20254 0.16622-0.38825 0.35193-0.55447 0.55447-0.90796 1.10635-0.90796 2.75007-0.90796 6.03757 0 3.2875 0 4.9312 0.90796 6.0376 0.16622 0.2025 0.35193 0.3882 0.55447 0.5544 1.10635 0.908 2.75009 0.908 6.03757 0.908h5c3.2875 0 4.9312 0 6.0376-0.908 0.2025-0.1662 0.3882-0.3519 0.5544-0.5544 0.908-1.1064 0.908-2.7501 0.908-6.0376 0-3.2875 0-4.93122-0.908-6.03757-0.1662-0.20254-0.3519-0.38825-0.5544-0.55447-1.1064-0.90796-2.7501-0.90796-6.0376-0.90796z m-2.5 0v-2c0-0.55228 0.4477-1 1-1 0.5523 0 1-0.44772 1-1v-1m-7 10l1 0m3.5 0l1 0m3.5 0l1 0m-10 5l10 0",
  },
];

export const LEGAL_SIDENAV_ITEMS: SideNavItem[] = [
  {
    slug: "privacy",
    href: "/privacy",
    id: "leg-priv",
    label: "Privacy Policy",
    iconD:
      "M18.7088 3.49534c-1.8923-0.94152-4.2079-1.49534-6.7088-1.49534-2.5009 0-4.8165 0.55382-6.70884 1.49534-0.92798 0.46172-1.39197 0.69258-1.84156 1.41844-0.4496 0.72587-0.4496 1.4287-0.4496 2.83436v3.48896c0 5.6834 4.54236 8.8433 7.173 10.1967 0.7337 0.3775 1.1005 0.5662 1.827 0.5662 0.7265 0 1.0933-0.1887 1.8269-0.5662 2.6307-1.3534 7.1731-4.5133 7.1731-10.1967l0-3.48896c0-1.40565 0-2.10848-0.4496-2.83436-0.4496-0.72587-0.9136-0.95672-1.8416-1.41844z",
  },
  {
    slug: "terms",
    href: "/terms",
    id: "leg-terms",
    label: "Terms of Service",
    iconD:
      "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  {
    slug: "commercial-licensing",
    href: "/commercial-licensing",
    id: "leg-comm",
    label: "Commercial Licensing",
    iconD:
      "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  },
  {
    slug: "mit-license",
    href: "/mit-license",
    id: "leg-mit",
    label: "MIT License",
    iconD:
      "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  },
];

export const SUPPORT_SIDENAV_ITEMS: SideNavItem[] = [
  {
    slug: "support",
    href: "/support",
    id: "res-support",
    label: "Support & Help",
    iconD:
      "M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z",
  },
  {
    slug: "faq",
    href: "/faq",
    id: "res-faq",
    label: "Questions & FAQ",
    iconD:
      "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    slug: "docs",
    href: "/docs",
    id: "res-docs",
    label: "Documentation",
    iconD:
      "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  },
  {
    slug: "about",
    href: "/about",
    id: "res-about",
    label: "About RICO",
    iconD:
      "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
];

export const FAQ_SIDENAV_ITEMS: SideNavItem[] = [
  {
    slug: "faq",
    href: "/faq",
    id: "faq-overview",
    label: "FAQ Overview",
    iconD:
      "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    slug: "support",
    href: "/support",
    id: "faq-support",
    label: "Support & Help",
    iconD:
      "M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z",
  },
  {
    slug: "docs",
    href: "/docs",
    id: "faq-docs",
    label: "Documentation",
    iconD:
      "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  },
  {
    slug: "pricing",
    href: "/pricing",
    id: "faq-pricing",
    label: "Pricing & Plans",
    iconD:
      "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
];

export interface OutlineItem {
  id: string;
  label: React.ReactNode;
}

export interface PagerLink {
  title: string;
  href: string;
}

export interface SideNavItem {
  slug: string;
  href: string;
  id?: string;
  name?: string;
  iconId?: string;
  iconName?: string;
  labelId?: string;
  labelName?: string;
  label: string;
  iconD: string;
}

export function DocsKbd({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-[23px] px-[7px] justify-center items-center bg-[#111113] [outline:1px_solid_#FFFFFF24] [outline-offset:-0.5px] rounded-[6px] text-[13.5px]/[normal] text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-medium align-middle mx-[2px]">
      {children}
    </span>
  );
}

export function DocsSection({
  id,
  title,
  first = false,
  children,
}: {
  id: string;
  title: string;
  first?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      id={id}
      className={`box-border w-[680px] shrink-0 flex flex-col gap-0 justify-start items-start bg-[#09090B] scroll-mt-24 ${
        first
          ? ""
          : "pt-[44px] [border-width:1px_0px_0px_0px] [border-style:solid] [border-color:#FFFFFF17]"
      }`}
    >
      <div className="text-[28.8px]/[35px] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-0.864px] text-left">
        {title}
      </div>
      {children}
    </div>
  );
}

export function DocsParagraph({
  children,
  topPadding = "pt-[18px]",
}: {
  children: React.ReactNode;
  topPadding?: string;
}) {
  return (
    <div className={`box-border w-full h-fit shrink-0 flex flex-row gap-0 ${topPadding} justify-start items-start`}>
      <div className="text-[16.5px]/[28px] box-border [flex:1_1_0] text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal text-left">
        {children}
      </div>
    </div>
  );
}

export function DocsTable({
  headers,
  rows,
  colWidths = ["w-[205px]", "w-[170px]", "w-[305px]"],
}: {
  headers: string[];
  rows: React.ReactNode[][];
  colWidths?: string[];
}) {
  return (
    <div className="box-border w-full h-fit shrink-0 flex flex-row gap-0 pt-[16px] justify-start items-start">
      <div className="box-border w-[680px] shrink-0 h-fit flex flex-col gap-0 justify-start items-start [outline:1px_solid_#FFFFFF17] [outline-offset:-0.5px] rounded-[12px] overflow-hidden">
        <div className="box-border w-full h-[41px] shrink-0 flex flex-row gap-0 justify-start items-center bg-[#FFFFFF08]">
          {headers.map((h, i) => (
            <div
              key={i}
              className={`box-border ${colWidths[i] || "flex-1"} shrink-0 h-fit flex flex-row gap-0 p-[11px_16px] justify-start items-center`}
            >
              <div className="text-[12.5px]/[normal] box-border text-[#F4F4F66B] font-[Geist,system-ui,sans-serif] font-medium tracking-[0.25px] text-left [white-space:nowrap]">
                {h}
              </div>
            </div>
          ))}
        </div>
        {rows.map((r, rIdx) => (
          <div
            key={rIdx}
            className="box-border w-[680px] min-h-[46.5px] shrink-0 flex flex-row gap-0 justify-start items-center border-t border-[#FFFFFF17]"
          >
            {r.map((cell, cIdx) => (
              <div
                key={cIdx}
                className={`box-border ${colWidths[cIdx] || "flex-1"} shrink-0 h-fit flex flex-row gap-0 p-[12px_16px] justify-start items-center`}
              >
                <div
                  className={`text-[15px]/[22px] box-border font-[Geist,system-ui,sans-serif] text-left ${
                    cIdx === 0 ? "text-[#F4F4F6] font-medium" : "text-[#F4F4F6A3] font-normal"
                  }`}
                >
                  {cell}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DocsSteps({
  steps,
}: {
  steps: { lead?: string; body: React.ReactNode }[];
}) {
  return (
    <div className="box-border w-full h-fit shrink-0 flex flex-col gap-[14px] pt-[16px] justify-start items-start">
      {steps.map((s, idx) => (
        <div
          key={idx}
          className="box-border w-full h-fit shrink-0 flex flex-row gap-[14px] justify-start items-start"
        >
          <div className="box-border w-[26px] shrink-0 h-[26px] mt-[1px] flex flex-row gap-0 justify-center items-center [outline:1px_solid_#FFFFFF24] [outline-offset:-0.5px] rounded-[999px]">
            <div className="text-[13px]/[normal] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-medium text-left [white-space:nowrap]">
              {idx + 1}
            </div>
          </div>
          <div className="box-border [flex:1_1_0] text-[16.5px]/[28px] text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal text-left">
            {s.lead && <span className="text-[#F4F4F6] font-semibold">{s.lead} </span>}
            {s.body}
          </div>
        </div>
      ))}
    </div>
  );
}

export function DocsBullets({
  items,
}: {
  items: { lead?: string; href?: string; body: React.ReactNode }[];
}) {
  return (
    <div className="box-border w-full h-fit shrink-0 flex flex-col gap-[8px] pt-[18px] justify-start items-start">
      {items.map((b, idx) => (
        <div
          key={idx}
          className="box-border w-full h-fit shrink-0 flex flex-row gap-[10px] justify-start items-start"
        >
          <div className="box-border w-[10px] shrink-0 h-[24px] flex flex-row gap-0 p-[11px_0px_0px_4px] justify-start items-start">
            <div className="box-border w-[5px] shrink-0 h-[5px] bg-[#F4F4F66B] rounded-[50%]" />
          </div>
          <div className="box-border [flex:1_1_0] text-[16.5px]/[28px] text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal text-left">
            {b.lead &&
              (b.href ? (
                <Link
                  href={b.href}
                  className="text-[#F4F4F6] font-normal hover:underline no-underline mr-[5px]"
                >
                  {b.lead}
                </Link>
              ) : (
                <span className="text-[#F4F4F6] font-semibold mr-[5px]">{b.lead}</span>
              ))}
            {b.body}
          </div>
        </div>
      ))}
    </div>
  );
}

export function DocsCallout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="box-border w-full h-fit shrink-0 flex flex-row gap-0 pt-[16px] justify-start items-start">
      <div className="box-border [flex:1_1_0] h-fit flex flex-row gap-[12px] p-[16px_18px] justify-start items-start bg-[#FFFFFF09] [outline:1px_solid_#FFFFFF17] [outline-offset:-0.5px] rounded-[12px]">
        <div className="box-border w-[18px] shrink-0 h-[22px] flex flex-row gap-0 p-[2px_0px_0px_0px] justify-center items-center">
          <svg
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
        <div className="box-border [flex:1_1_0] h-fit flex flex-col gap-[2px] justify-start items-start">
          <div className="text-[14.5px]/[normal] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-0.087px] text-left">
            {title}
          </div>
          <div className="text-[15.5px]/[25px] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal text-left">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DocsArticleLayout({
  activeSlug,
  title,
  lede,
  outline,
  prevPager,
  nextPager,
  sideNavHeading = "Documentation",
  sideNavHeadingHref = "/docs",
  sideNavItems = DOCS_SIDENAV_ITEMS,
  eyebrow = { label: "Docs", href: "/docs" },
  bottomFeedback,
  children,
}: {
  activeSlug: string;
  title: string;
  lede: React.ReactNode;
  outline: OutlineItem[];
  prevPager?: PagerLink;
  nextPager?: PagerLink;
  sideNavHeading?: string;
  sideNavHeadingHref?: string;
  sideNavItems?: SideNavItem[];
  eyebrow?: { label: string; href: string };
  bottomFeedback?: React.ReactNode;
  children: React.ReactNode;
}) {
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
          <Link
            href={sideNavHeadingHref}
            data-pencil-id="Nmf20"
            data-pencil-name="SideNav Heading"
            className="text-[12.5px]/[normal] box-border text-[#F4F4F66B] hover:text-[#F4F4F6] transition-colors font-[Geist,system-ui,sans-serif] font-medium tracking-[0.25px] text-left [white-space:nowrap] no-underline"
          >
            {sideNavHeading}
          </Link>
        </div>
        <div
          data-pencil-id="HCRXh"
          data-pencil-name="SideNav List"
          className="box-border w-full h-fit shrink-0 flex flex-col gap-[2px] justify-start items-start"
        >
          {sideNavItems.map((item) => {
            const isActive = item.slug === activeSlug;
            return (
              <Link
                key={item.id || item.href}
                href={item.href}
                data-pencil-id={item.id}
                data-pencil-name={item.name}
                className={`box-border w-full h-[38px] shrink-0 flex flex-row gap-[10px] p-[8px_12px] justify-start items-center rounded-[12px] no-underline transition-colors ${
                  isActive ? "bg-[#FFFFFF14]" : "hover:bg-[#FFFFFF0A]"
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
                    stroke={isActive ? "#F4F4F6" : "#F4F4F66B"}
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
                    isActive ? "text-[#F4F4F6] font-medium" : "text-[#F4F4F6A3] font-normal"
                  }`}
                >
                  {item.label}
                </div>
              </Link>
            );
          })}

          <a
            href="https://github.com/abrarnasirjaffari/Rico-Website"
            target="_blank"
            rel="noreferrer"
            data-pencil-id="a2N0h"
            data-pencil-name="SideNav Building from source"
            className="box-border w-full h-[38px] shrink-0 flex flex-row gap-0 p-[8px_12px] justify-between items-center rounded-[12px] hover:bg-[#FFFFFF0A] transition-colors no-underline"
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
          </a>
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
              href={eyebrow.href}
              data-pencil-id="Tb7r2"
              data-pencil-name="Article Eyebrow"
              className="text-[14px]/[normal] box-border text-[#F4F4F66B] hover:text-[#F4F4F6] transition-colors font-[Geist,system-ui,sans-serif] font-medium text-left [white-space:nowrap] no-underline"
            >
              {eyebrow.label}
            </Link>
          </div>
          <div
            data-pencil-id="ntUQj"
            data-pencil-name="Article Title"
            className="text-[52px]/[53px] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-2.184px] text-left [white-space:nowrap]"
          >
            {title}
          </div>
          <div
            data-pencil-id="AooVp"
            data-pencil-name="Article Lede Wrap"
            className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[18px_0px_0px_0px] justify-start items-start"
          >
            <div
              data-pencil-id="iAv3j"
              data-pencil-name="Article Lede"
              className="text-[20px]/[31px] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal text-left"
            >
              {lede}
            </div>
          </div>
        </div>

        <div
          data-pencil-id="m689z"
          data-pencil-name="Article Body"
          className="box-border w-full h-fit shrink-0 flex flex-col gap-[44px] p-[56px_0px_0px_0px] justify-start items-start"
        >
          {children}
        </div>

        {/* Pager Cards */}
        <div
          data-pencil-id="O3dcpj"
          data-pencil-name="Article Pager Outer"
          className="box-border w-full h-fit shrink-0 flex flex-row gap-[12px] p-[72px_0px_0px_0px] justify-between items-center bg-[#09090B]"
        >
          {prevPager ? (
            <Link
              href={prevPager.href}
              className="box-border w-[334px] shrink-0 h-[82px] flex flex-row gap-0 p-[18px_20px] justify-between items-center [outline:1px_solid_#FFFFFF24] [outline-offset:-0.5px] rounded-[20px] hover:bg-[#FFFFFF08] transition-colors no-underline"
            >
              <div className="box-border w-fit shrink-0 h-fit flex flex-row gap-[14px] justify-start items-center">
                <svg
                  viewBox="0 0 24 24"
                  preserveAspectRatio="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="box-border w-[18px] shrink-0 h-[18px] overflow-visible"
                >
                  <path
                    d="M15 6c0 0-5.99999 4.4189-6 6-0.00001 1.5812 6 6 6 6"
                    fill="none"
                    stroke="#F4F4F66B"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
                <div className="box-border w-fit shrink-0 h-fit flex flex-col gap-[2px] justify-start items-start">
                  <div className="text-[13px]/[normal] box-border text-[#F4F4F66B] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]">
                    Previous
                  </div>
                  <div className="text-[16px]/[normal] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-0.192px] text-left [white-space:nowrap]">
                    {prevPager.title}
                  </div>
                </div>
              </div>
              <div className="w-[1px] h-[1px]" />
            </Link>
          ) : (
            <div />
          )}

          {nextPager ? (
            <Link
              href={nextPager.href}
              data-pencil-id="SA3Kh"
              data-pencil-name="Pager Next Card"
              className="box-border w-[334px] shrink-0 h-[82px] flex flex-row gap-0 p-[18px_20px] justify-between items-center [outline:1px_solid_#FFFFFF24] [outline-offset:-0.5px] rounded-[20px] hover:bg-[#FFFFFF08] transition-colors no-underline"
            >
              <div className="w-[1px] h-[1px]" />
              <div className="box-border w-fit shrink-0 h-fit flex flex-row gap-[14px] justify-start items-center">
                <div className="box-border w-fit shrink-0 h-fit flex flex-col gap-[2px] justify-start items-end">
                  <div className="text-[13px]/[normal] box-border text-[#F4F4F66B] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]">
                    Next
                  </div>
                  <div className="text-[16px]/[normal] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-0.192px] text-left [white-space:nowrap]">
                    {nextPager.title}
                  </div>
                </div>
                <svg
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
          ) : (
            <div />
          )}
        </div>

        <div
          data-pencil-id="ONCPG"
          data-pencil-name="Article Feedback Wrap"
          className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[40px_0px_0px_0px] justify-start items-start bg-[#09090B]"
        >
          <div
            data-pencil-id="A2lyW"
            data-pencil-name="Article Feedback Text"
            className="text-[14.5px]/[23px] box-border text-[#F4F4F66B] font-[Geist,system-ui,sans-serif] font-normal text-left"
          >
            {bottomFeedback ?? (
              <>
                Something wrong or missing on this page? Tell us on GitHub or in the Discord, or write
                to{" "}
                <a
                  href="mailto:support@rico.app"
                  className="text-[#F4F4F6A3] hover:underline hover:text-[#F4F4F6]"
                >
                  support@rico.app
                </a>
                .
              </>
            )}
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
          className="[box-sizing:content-box] w-[199.5px] h-fit shrink-0 flex flex-col gap-0 justify-start items-start [border-width:0px_0px_0px_1px] [border-style:solid] [border-color:#FFFFFF17] [margin:0px_0px_0px_-0.5px]"
        >
          {outline.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[5px_14px] justify-start items-start no-underline group"
            >
              <div className="text-[13.5px]/[19px] box-border text-[#F4F4F66B] group-hover:text-[#F4F4F6] transition-colors font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]">
                {item.label}
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
