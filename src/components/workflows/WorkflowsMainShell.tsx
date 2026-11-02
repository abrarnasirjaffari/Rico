import React from "react";

const ORB_DIM_D =
  "M10.65 11.43a0.27 0.27 0 1 0 0.54 0 0.27 0.27 0 1 0-0.54 0z m-2.14-2.63a0.27 0.27 0 1 0 0.54 0 0.27 0.27 0 1 0-0.54 0z m-0.77 2.82a0.27 0.27 0 1 0 0.54 0 0.27 0.27 0 1 0-0.54 0z m4.17-3.4a0.27 0.27 0 1 0 0.54 0 0.27 0.27 0 1 0-0.54 0z m-2.98 5.96a0.28 0.28 0 1 0 0.56 0 0.28 0.28 0 1 0-0.56 0z m4.93-3.18a0.28 0.28 0 1 0 0.56 0 0.28 0.28 0 1 0-0.56 0z m-8.4-1.07a0.28 0.28 0 1 0 0.56 0 0.28 0.28 0 1 0-0.56 0z m4.12-4.19a0.28 0.28 0 1 0 0.56 0 0.28 0.28 0 1 0-0.56 0z m2.77 8.36a0.3 0.3 0 1 0 0.6 0 0.3 0.3 0 1 0-0.6 0z m-6.11-7.52a0.28 0.28 0 1 0 0.56 0 0.28 0.28 0 1 0-0.56 0z m-0.52 6.67a0.28 0.28 0 1 0 0.56 0 0.28 0.28 0 1 0-0.56 0z m9.2-5.31a0.29 0.29 0 1 0 0.58 0 0.29 0.29 0 1 0-0.58 0z m-2.14-2.63a0.29 0.29 0 1 0 0.58 0 0.29 0.29 0 1 0-0.58 0z m3.32 5.18a0.29 0.29 0 1 0 0.58 0 0.29 0.29 0 1 0-0.58 0z m-5.58-6.85a0.29 0.29 0 1 0 0.58 0 0.29 0.29 0 1 0-0.58 0z m-0.17 12.86a0.35 0.35 0 1 0 0.7 0 0.35 0.35 0 1 0-0.7 0z m4.99-3.19a0.3 0.3 0 1 0 0.6 0 0.3 0.3 0 1 0-0.6 0z m-11.87-5.32a0.3 0.3 0 1 0 0.6 0 0.3 0.3 0 1 0-0.6 0z m4.12-4.18a0.3 0.3 0 1 0 0.6 0 0.3 0.3 0 1 0-0.6 0z m-0.63 12.28a0.31 0.31 0 1 0 0.62 0 0.31 0.31 0 1 0-0.62 0z m-3.78-4.65a0.3 0.3 0 1 0 0.6 0 0.3 0.3 0 1 0-0.6 0z m10.38 4.63a0.36 0.36 0 1 0 0.72 0 0.36 0.36 0 1 0-0.72 0z m-9.02-11.14a0.31 0.31 0 1 0 0.62 0 0.31 0.31 0 1 0-0.62 0z m-0.55 9.71a0.31 0.31 0 1 0 0.62 0 0.31 0.31 0 1 0-0.62 0z m11.42-9.3a0.31 0.31 0 1 0 0.62 0 0.31 0.31 0 1 0-0.62 0z m1.65 3.02a0.31 0.31 0 1 0 0.62 0 0.31 0.31 0 1 0-0.62 0z m-4.28-5.25a0.31 0.31 0 1 0 0.62 0 0.31 0.31 0 1 0-0.62 0z m4.53 8.58a0.32 0.32 0 1 0 0.64 0 0.32 0.32 0 1 0-0.64 0z m-7.74-9.51a0.32 0.32 0 1 0 0.64 0 0.32 0.32 0 1 0-0.64 0z m1.93 15.48a0.41 0.41 0 1 0 0.82 0 0.41 0.41 0 1 0-0.82 0z m-8.94-11.08a0.32 0.32 0 1 0 0.64 0 0.32 0.32 0 1 0-0.64 0z m6.06 11.31a0.38 0.38 0 1 0 0.76 0 0.38 0.38 0 1 0-0.76 0z m-6.87-8.5a0.32 0.32 0 1 0 0.64 0 0.32 0.32 0 1 0-0.64 0z m14.38 5.46a0.34 0.34 0 1 0 0.68 0 0.34 0.34 0 1 0-0.68 0z m-9.91-12.16a0.33 0.33 0 1 0 0.66 0 0.33 0.33 0 1 0-0.66 0z m-0.77 14.27a0.34 0.34 0 1 0 0.68 0 0.34 0.34 0 1 0-0.68 0z m-3.45-4.25a0.33 0.33 0 1 0 0.66 0 0.33 0.33 0 1 0-0.66 0z m1.22 2.53a0.34 0.34 0 1 0 0.68 0 0.34 0.34 0 1 0-0.68 0z m13.83-9.08a0.34 0.34 0 1 0 0.68 0 0.34 0.34 0 1 0-0.68 0z m-2.14-2.62a0.34 0.34 0 1 0 0.68 0 0.34 0.34 0 1 0-0.68 0z m-11.45 0.9a0.34 0.34 0 1 0 0.68 0 0.34 0.34 0 1 0-0.68 0z m14.56 5a0.34 0.34 0 1 0 0.68 0 0.34 0.34 0 1 0-0.68 0z m-6.12-7.52a0.34 0.34 0 1 0 0.68 0 0.34 0.34 0 1 0-0.68 0z m-10.16 5.27a0.35 0.35 0 1 0 0.7 0 0.35 0.35 0 1 0-0.7 0z m15.82 5.62a0.35 0.35 0 1 0 0.7 0 0.35 0.35 0 1 0-0.7 0z m-9.07-11.13a0.35 0.35 0 1 0 0.7 0 0.35 0.35 0 1 0-0.7 0z m-7.2 8.88a0.35 0.35 0 1 0 0.7 0 0.35 0.35 0 1 0-0.7 0z";

const ORB_BRIGHT_D =
  "M13.8 17.19a0.4 0.4 0 1 0 0.8 0 0.4 0.4 0 1 0-0.8 0z m-3.05 1.13a0.41 0.41 0 1 0 0.82 0 0.41 0.41 0 1 0-0.82 0z m-3.36-0.24a0.37 0.37 0 1 0 0.74 0 0.37 0.37 0 1 0-0.74 0z m8.44-2.52a0.37 0.37 0 1 0 0.74 0 0.37 0.37 0 1 0-0.74 0z m-11.44 0.9a0.36 0.36 0 1 0 0.72 0 0.36 0.36 0 1 0-0.72 0z m-2.14-2.62a0.36 0.36 0 1 0 0.72 0 0.36 0.36 0 1 0-0.72 0z m3.19-11.03a0.36 0.36 0 1 0 0.72 0 0.36 0.36 0 1 0-0.72 0z m10.64 1.95a0.36 0.36 0 1 0 0.72 0 0.36 0.36 0 1 0-0.72 0z m1.22 2.53a0.37 0.37 0 1 0 0.74 0 0.37 0.37 0 1 0-0.74 0z m-3.46-4.25a0.37 0.37 0 1 0 0.74 0 0.37 0.37 0 1 0-0.74 0z m-0.78 14.27a0.39 0.39 0 1 0 0.78 0 0.39 0.39 0 1 0-0.78 0z m-9.9-12.16a0.37 0.37 0 1 0 0.74 0 0.37 0.37 0 1 0-0.74 0z m14.4 5.46a0.37 0.37 0 1 0 0.74 0 0.37 0.37 0 1 0-0.74 0z m-6.93-8.5a0.37 0.37 0 1 0 0.74 0 0.37 0.37 0 1 0-0.74 0z m6.11 11.31a0.38 0.38 0 1 0 0.76 0 0.38 0.38 0 1 0-0.76 0z m-9.03-11.08a0.38 0.38 0 1 0 0.76 0 0.38 0.38 0 1 0-0.76 0z m2.01 15.48a0.39 0.39 0 1 0 0.78 0 0.39 0.39 0 1 0-0.78 0z m-7.73-9.51a0.38 0.38 0 1 0 0.76 0 0.38 0.38 0 1 0-0.76 0z m4.54 8.58a0.38 0.38 0 1 0 0.76 0 0.38 0.38 0 1 0-0.76 0z m-4.28-5.25a0.38 0.38 0 1 0 0.76 0 0.38 0.38 0 1 0-0.76 0z m1.64 3.02a0.39 0.39 0 1 0 0.78 0 0.39 0.39 0 1 0-0.78 0z m11.42-9.3a0.39 0.39 0 1 0 0.78 0 0.39 0.39 0 1 0-0.78 0z m-0.55 9.71a0.39 0.39 0 1 0 0.78 0 0.39 0.39 0 1 0-0.78 0z m-9.07-11.14a0.39 0.39 0 1 0 0.78 0 0.39 0.39 0 1 0-0.78 0z m10.43 4.63a0.4 0.4 0 1 0 0.8 0 0.4 0.4 0 1 0-0.8 0z m-3.79-4.65a0.4 0.4 0 1 0 0.8 0 0.4 0.4 0 1 0-0.8 0z m-0.62 12.28a0.4 0.4 0 1 0 0.8 0 0.4 0.4 0 1 0-0.8 0z m4.12-4.18a0.4 0.4 0 1 0 0.8 0 0.4 0.4 0 1 0-0.8 0z m-11.87-5.32a0.4 0.4 0 1 0 0.8 0 0.4 0.4 0 1 0-0.8 0z m4.94-3.19a0.4 0.4 0 1 0 0.8 0 0.4 0.4 0 1 0-0.8 0z m-0.11 12.86a0.4 0.4 0 1 0 0.8 0 0.4 0.4 0 1 0-0.8 0z m-5.58-6.85a0.4 0.4 0 1 0 0.8 0 0.4 0.4 0 1 0-0.8 0z m3.31 5.18a0.41 0.41 0 1 0 0.82 0 0.41 0.41 0 1 0-0.82 0z m-2.14-2.63a0.41 0.41 0 1 0 0.82 0 0.41 0.41 0 1 0-0.82 0z m9.21-5.31a0.41 0.41 0 1 0 0.82 0 0.41 0.41 0 1 0-0.82 0z m-0.52 6.67a0.41 0.41 0 1 0 0.82 0 0.41 0.41 0 1 0-0.82 0z m-6.13-7.52a0.41 0.41 0 1 0 0.82 0 0.41 0.41 0 1 0-0.82 0z m2.78 8.36a0.42 0.42 0 1 0 0.84 0 0.42 0.42 0 1 0-0.84 0z m4.12-4.19a0.42 0.42 0 1 0 0.84 0 0.42 0.42 0 1 0-0.84 0z m-8.4-1.07a0.42 0.42 0 1 0 0.84 0 0.42 0.42 0 1 0-0.84 0z m4.93-3.18a0.42 0.42 0 1 0 0.84 0 0.42 0.42 0 1 0-0.84 0z m-2.97 5.96a0.42 0.42 0 1 0 0.84 0 0.42 0.42 0 1 0-0.84 0z m4.16-3.4a0.43 0.43 0 1 0 0.86 0 0.43 0.43 0 1 0-0.86 0z m-0.77 2.82a0.43 0.43 0 1 0 0.86 0 0.43 0.43 0 1 0-0.86 0z m-2.14-2.63a0.43 0.43 0 1 0 0.86 0 0.43 0.43 0 1 0-0.86 0z";

interface WorkflowItem {
  id: string;
  name: string;
  prefix: string;
  textFirst: boolean;
  textColId: string;
  eyebrowId: string;
  eyebrow: string;
  headlineWrapId: string;
  headlineId: string;
  headlineLines: string[];
  bodyWrapId: string;
  bodyId: string;
  bodyText: React.ReactNode;
  bodyNowrap?: boolean;
  keepOuterId: string;
  keepBoxId: string;
  keepBoxHeight: string;
  keepLine1Id: string;
  keepLeadId: string;
  keepText1Id: string;
  keepText1: string;
  keepText2Id?: string;
  keepText2?: string;
  showcaseId: string;
  bgUrl: string;
  glassId: string;
  reqBarId: string;
  orbCircleId: string;
  orbDimId: string;
  orbBrightId: string;
  reqTextWrapId: string;
  reqPromptId: string;
  promptLines: string[];
  stepsListId: string;
  steps: {
    id: string;
    iconBoxId: string;
    iconId: string;
    iconD: string;
    textId: string;
    lines: string[];
  }[];
}

const WORKFLOW_ITEMS: WorkflowItem[] = [
  {
    id: "v6gTgU",
    name: "Workflow Travel",
    prefix: "Travel",
    textFirst: true,
    textColId: "TIoUl",
    eyebrowId: "gKui7",
    eyebrow: "Subscriptions",
    headlineWrapId: "S3jHg",
    headlineId: "tQIz1",
    headlineLines: ["Recurring bills on", "autopilot."],
    bodyWrapId: "fKOVu",
    bodyId: "T5MUkI",
    bodyText:
      "Helpers verify live prices before billing day. You get a strict ceiling check and a verified receipt for every charge.",
    keepOuterId: "E8KPAo",
    keepBoxId: "NqyDj",
    keepBoxHeight: "h-[63.5px]",
    keepLine1Id: "o9vC1n",
    keepLeadId: "hwclm",
    keepText1Id: "OHd8d",
    keepText1: "An active mandate, a verified price snapshot and a",
    keepText2Id: "dU7hl",
    keepText2: "structured audit receipt.",
    showcaseId: "ORbEH",
    bgUrl: "/assets/sky-workflow-travel.jpg",
    glassId: "iv9j7",
    reqBarId: "jQQX1",
    orbCircleId: "KRMwa",
    orbDimId: "dnOey",
    orbBrightId: "N9K1Gb",
    reqTextWrapId: "y83naT",
    reqPromptId: "nAYco",
    promptLines: [
      "Pay Netflix Standard HD on the 5th of every month,",
      "keep the ceiling at $20, and alert me if the plan price",
      "changes.",
    ],
    stepsListId: "MNu4m",
    steps: [
      {
        id: "Em1Dc",
        iconBoxId: "JuzZ6",
        iconId: "Wuig5",
        iconD:
          "M15.8667 3.7804c0.9264-0.74852 1.964-0.79396 3.0977-0.77807 0.5864 0.00822 0.8796 0.01234 1.1148 0.10355 0.3732 0.14472 0.6702 0.44176 0.8149 0.81493 0.0912 0.2352 0.0953 0.52839 0.1036 1.11476 0.0159 1.13369-0.0296 2.17129-0.7781 3.09769-0.6303 0.78011-1.7137 1.18775-2.235 2.04884-0.398 0.6574-0.2126 1.3382-0.0416 2.0388l1.2798 5.2453c0.2551 1.0453 0.061 1.7153-0.6699 2.4462-0.3889 0.3889-0.7124 0.3692-1.0278-0.1334l-3.8624-6.1541-1.8446 1.4662c-0.6688 0.5317-1.0032 0.7975-1.1789 1.1716-0.4116 0.8761-0.1503 2.192-0.137 3.1419 0.0074 0.525-0.4463 1.5598-1.08829 1.5947-0.39635 0.0216-0.53108-0.4525-0.6591-0.7435l-1.23247-2.8014c-0.29474-0.6699-0.30682-0.682-0.97678-0.9767l-2.80141-1.2325c-0.29097-0.128-0.76501-0.2628-0.74344-0.6591 0.03494-0.642 1.06965-1.0957 1.59465-1.0883 0.94996 0.0133 2.26586 0.2746 3.14198-0.137 0.37408-0.1757 0.6399-0.5101 1.17154-1.1789l1.46622-1.8446-6.15407-3.86241c-0.50258-0.31543-0.52231-0.63892-0.13348-1.02774 0.73095-0.73095 1.40096-0.92501 2.44622-0.66997l5.24533 1.27985c0.7006 0.17095 1.3814 0.3564 2.0388-0.04163 0.8611-0.52129 1.2687-1.60466 2.0488-2.235z",
        textId: "OQvMb",
        lines: [
          "Helpers open the live merchant plan page at 30 FPS and",
          "extract current tier pricing.",
        ],
      },
      {
        id: "HDMlp",
        iconBoxId: "h5d3Qb",
        iconId: "QQgSV",
        iconD: "M2 4h20m-2.5 0l2.5 16m-17.5-16l-2.5 16m2-11h16",
        textId: "f7SRY",
        lines: [
          "Verified price ($15.49) is checked against your $20.00",
          "hard budget ceiling.",
        ],
      },
      {
        id: "G8lkp",
        iconBoxId: "h43xo",
        iconId: "J9m2S",
        iconD:
          "M11 6l10 0m-10 6l10 0m-10 6l10 0m-18-10.60714c0 0 1 0.6518 1.5 1.60714 0 0 1.5-3.75 3.5-5m-5 14.3929c0 0 1 0.6518 1.5 1.6071 0 0 1.5-3.75 3.5-5",
        textId: "GntDL",
        lines: [
          "Payment executes safely and renders a generative receipt",
          "in chat and AG Grid.",
        ],
      },
    ],
  },
  {
    id: "siHGt",
    name: "Workflow Buying",
    prefix: "Buying",
    textFirst: false,
    textColId: "qQ6JV",
    eyebrowId: "PDG2G",
    eyebrow: "Cloud & SaaS",
    headlineWrapId: "PETNJ",
    headlineId: "Y0Kti",
    headlineLines: ["Simplify complex", "pricing,", "then lock it."],
    bodyWrapId: "I9naOt",
    bodyId: "gs1sm",
    bodyText:
      "Calm Pricing Lens reads complex SaaS tiers at once. Hidden traps end up in clean cards, not a dozen tabs.",
    keepOuterId: "WS3XR",
    keepBoxId: "nfDNB",
    keepBoxHeight: "h-[63.5px]",
    keepLine1Id: "p6mjx",
    keepLeadId: "MGTjy",
    keepText1Id: "W0xR5",
    keepText1: "A simplified tier comparison, a chart and a 1-click",
    keepText2Id: "yTcnJ",
    keepText2: "mandate with its ceiling.",
    showcaseId: "OeeNb",
    bgUrl: "/assets/sky-workflow-buying.jpg",
    glassId: "t9nYKW",
    reqBarId: "EzsiJ",
    orbCircleId: "swAc6",
    orbDimId: "d93zO",
    orbBrightId: "cWvUp",
    reqTextWrapId: "N8ERj",
    reqPromptId: "CsVZm",
    promptLines: [
      "Compare Stripe, AWS and PostHog pricing tiers for a",
      "10-person team, strip out hidden fees and deploy a",
      "mandate.",
    ],
    stepsListId: "hV3Nn",
    steps: [
      {
        id: "DthoR",
        iconBoxId: "W0J6cZ",
        iconId: "n2n2d",
        iconD:
          "M2 12a10 10 0 1 0 20 0 10 10 0 1 0-20 0z m6 0c0 6 4 10 4 10 0 0 4-4 4-10 0-6-4-10-4-10 0 0-4 4-4 10z m13 3h-18m18-6h-18",
        textId: "W4uePS",
        lines: [
          "Helpers open each pricing page and run Calm Pricing Lens",
          "in plain sight.",
        ],
      },
      {
        id: "K82r4p",
        iconBoxId: "E4ygQ",
        iconId: "rTZxr",
        iconD: "M2 4h20m-2.5 0l2.5 16m-17.5-16l-2.5 16m2-11h16",
        textId: "NWCvs",
        lines: [
          "Base cost, seat minimums and overage rates go into one",
          "clean table.",
        ],
      },
      {
        id: "DpqCL",
        iconBoxId: "K2dec",
        iconId: "xlOje",
        iconD:
          "M14 18v-12c0-0.46499 0-0.69748-0.0511-0.88823-0.1387-0.51764-0.543-0.92196-1.0607-1.06066-0.1907-0.05111-0.4232-0.05111-0.8882-0.05111-0.465 0-0.6975 0-0.8882 0.05111-0.5177 0.1387-0.922 0.54302-1.0607 1.06066-0.0511 0.19075-0.0511 0.42324-0.0511 0.88823v12c0 0.465 0 0.6975 0.0511 0.8882 0.1387 0.5177 0.543 0.922 1.0607 1.0607 0.1907 0.0511 0.4232 0.0511 0.8882 0.0511 0.465 0 0.6975 0 0.8882-0.0511 0.5177-0.1387 0.922-0.543 1.0607-1.0607 0.0511-0.1907 0.0511-0.4232 0.0511-0.8882z m7-10v-2c0-0.46499 0-0.69748-0.0511-0.88823-0.1387-0.51764-0.543-0.92196-1.0607-1.06066-0.1907-0.05111-0.4232-0.05111-0.8882-0.05111-0.465 0-0.6975 0-0.8882 0.05111-0.5177 0.1387-0.922 0.54302-1.0607 1.06066-0.0511 0.19075-0.0511 0.42324-0.0511 0.88823v2c0 0.46499 0 0.69748 0.0511 0.88823 0.1387-0.51764 0.543 0.92196 1.0607 1.06066 0.1907 0.05111 0.4232 0.05111 0.8882 0.05111 0.465 0 0.6975 0 0.8882-0.05111 0.5177-0.1387 0.922-0.54302 1.0607-1.06066 0.0511-0.19075 0.0511-0.42324 0.0511-0.88823z m-14 4v-6c0-0.46499 0-0.69748-0.05111-0.88823-0.1387-0.51764-0.54302-0.92196-1.06066-1.06066-0.19075-0.05111-0.42324-0.05111-0.88823-0.05111-0.46499 0-0.69748 0-0.88823 0.05111-0.51764 0.1387-0.92196 0.54302-1.06066 1.06066-0.05111 0.19075-0.05111 0.42324-0.05111 0.88823v6c0 0.465 0 0.6975 0.05111 0.8882 0.1387 0.5177 0.54302 0.922 1.06066 1.0607 0.19075 0.0511 0.42324 0.0511 0.88823 0.0511 0.46499 0 0.69748 0 0.88823-0.0511 0.51764-0.1387 0.92196-0.543 1.06066-1.0607 0.05111-0.1907 0.05111-0.4232 0.05111-0.8882z",
        textId: "ucrVL",
        lines: [
          "One click deploys the chosen plan into an active recurring",
          "mandate.",
        ],
      },
    ],
  },
  {
    id: "HScYj",
    name: "Workflow Research",
    prefix: "Research",
    textFirst: true,
    textColId: "QjV71",
    eyebrowId: "mq8nW",
    eyebrow: "Student Perks",
    headlineWrapId: "Ibb6F",
    headlineId: "NWTYA",
    headlineLines: ["Enforce 50% off", "before you pay."],
    bodyWrapId: "WLUhZ",
    bodyId: "cv8Fr",
    bodyNowrap: true,
    bodyText: (
      <>
        For students and educators: automatic education
        <br />
        discount probes before any full-price charge runs.
      </>
    ),
    keepOuterId: "mGF1F",
    keepBoxId: "FWnuG",
    keepBoxHeight: "h-[40.5px]",
    keepLine1Id: "z66Lij",
    keepLeadId: "p669s",
    keepText1Id: "q15wYK",
    keepText1: "A student mandate and annual savings log.",
    showcaseId: "JLinp",
    bgUrl: "/assets/sky-workflow-research.jpg",
    glassId: "t3gpP",
    reqBarId: "ac7HD",
    orbCircleId: "K0F1b",
    orbDimId: "fquQq",
    orbBrightId: "cny2J",
    reqTextWrapId: "QPqyP",
    reqPromptId: "W36Oq",
    promptLines: [
      "Audit my Spotify, Notion and GitHub Copilot mandates",
      "and switch every eligible plan to the Student tier.",
    ],
    stepsListId: "A3lYB",
    steps: [
      {
        id: "KH1uQ",
        iconBoxId: "dw852",
        iconId: "Qwh2o",
        iconD:
          "M2 12a10 10 0 1 0 20 0 10 10 0 1 0-20 0z m6 0c0 6 4 10 4 10 0 0 4-4 4-10 0-6-4-10-4-10 0 0-4 4-4 10z m13 3h-18m18-6h-18",
        textId: "bsKXL",
        lines: [
          "Helpers inspect each merchant's education pricing page",
          "in parallel.",
        ],
      },
      {
        id: "i5A3p",
        iconBoxId: "O1JKVx",
        iconId: "q11nEz",
        iconD:
          "M7 10.5a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0z m6 5a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0z m4-8a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0z m-1.5659 6.7963l2.5659-5.2963m-8.41749 2.5684l3.62129 2.7279m-10.2038 4.7037l4.58957-7.1208m12.41043 9.1208h-11c-3.29983 0-4.94975 0-5.97487-1.0251-1.02513-1.0252-1.02513-2.6751-1.02513-5.9749v-11",
        textId: "YK8gw",
        lines: [
          "Savings advisories show $11.99/mo dropping to $5.99/mo",
          "side by side.",
        ],
      },
      {
        id: "UoeW9",
        iconBoxId: "n2bj96",
        iconId: "neLQM",
        iconD:
          "M9.14339 10.691l0.20692-0.2069c1.97869-1.97878 5.18689-1.97878 7.16559 0 1.9788 1.9787 1.9788 5.1869 0 7.1656l-2.8662 2.8662c-1.9787 1.9788-5.18691 1.9788-7.16565 0-1.97873-1.9787-1.97873-5.1869 0-7.1656l0.46435-0.4643m10.1032-1.772l0.4643-0.4643c1.9788-1.97875 1.9788-5.18691 0-7.16565-1.9787-1.97873-5.1869-1.97873-7.1656 0l-2.86625 2.86626c-1.97873 1.97873-1.97873 5.18689 0 7.16559 1.97874 1.9788 5.18695 1.9788 7.16565 0l0.2069-0.2069",
        textId: "Q86Ov",
        lines: [
          "Approved student rates lock into your recurring payment",
          "mandate.",
        ],
      },
    ],
  },
  {
    id: "gTE41",
    name: "Workflow Job search",
    prefix: "Job search",
    textFirst: false,
    textColId: "kZ2Gc",
    eyebrowId: "wOdhP",
    eyebrow: "Price Sentinel",
    headlineWrapId: "R42sV",
    headlineId: "BDPBH",
    headlineLines: ["Catch every spike", "24/7."],
    bodyWrapId: "t0qPl",
    bodyId: "kHnH1",
    bodyText:
      "Nightly audits check every active subscription. If a price jumps past your cap, RICO halts until you approve.",
    keepOuterId: "MIhRI",
    keepBoxId: "x8qToJ",
    keepBoxHeight: "h-[63.5px]",
    keepLine1Id: "y3jTV",
    keepLeadId: "ZGZlI",
    keepText1Id: "UAD7N",
    keepText1: "A 24-hour price audit log and instant mobile alerts",
    keepText2Id: "S2guE",
    keepText2: "on Telegram and WhatsApp.",
    showcaseId: "t2Bk4J",
    bgUrl: "/assets/sky-workflow-jobs.jpg",
    glassId: "CLTPB",
    reqBarId: "ySMaN",
    orbCircleId: "hA5jy",
    orbDimId: "RB4JU",
    orbBrightId: "x4TjN",
    reqTextWrapId: "A7zr8",
    reqPromptId: "th7aY",
    promptLines: [
      "Watch my Adobe Creative Cloud subscription every 24h",
      "and hold payment if the monthly price jumps above $40.",
    ],
    stepsListId: "JilqT",
    steps: [
      {
        id: "l1tli",
        iconBoxId: "V7hUIF",
        iconId: "eUgPv",
        iconD:
          "M2.00127 8.5l-0.00216 5.497c-0.00129 3.3009-0.00194 4.9514 1.02324 5.977 1.02519 1.0256 2.67566 1.0256 5.9766 1.0257l6.00105 0.0001c3.2994 0.0001 4.949 0.0002 5.9741-1.0247 1.0251-1.0249 1.0255-2.6746 1.0261-5.9739l0.0011-5.5012m-13.50273-2c0-1.40446 0-2.10669 0.33706-2.61114 0.14591-0.21838 0.33341-0.40588 0.5518-0.5518 0.50444-0.33706 1.20667-0.33706 2.61117-0.33706 1.4044 0 2.1067 0 2.6111 0.33706 0.2184 0.14592 0.4059 0.33342 0.5518 0.5518 0.3371 0.50445 0.3371 1.20668 0.3371 2.61114m4.4994 0.00016l-15.99915-0.00016c-1.10445 0.00007-2.00009 0.89568-2.00019 2.00013 0.0001 2.20897 1.79139 4.00027 4.00035 4.00047h11.99879c2.209-0.0001 4.0002-1.7913 4.0003-4.0003-0.0001-1.10448-0.8957-2.00007-2.0001-2.00014z m-9.99943 5.99984v1c0 0.465 0 0.6975 0.05113 0.8882 0.1387 0.5177 0.543 0.922 1.0606 1.0607 0.1908 0.0511 0.4233 0.0511 0.8883 0.0511 0.465 0 0.6974 0 0.8882-0.0511 0.5176-0.1387 0.922-0.543 1.0607-1.0607 0.0511-0.1907 0.0511-0.4232 0.0511-0.8882v-1",
        textId: "WrQHR",
        lines: [
          "Nightly cron worker scrapes the live plan price ($54.99 vs",
          "$35.00 baseline).",
        ],
      },
      {
        id: "k9yKIr",
        iconBoxId: "RzJeR",
        iconId: "rME4b",
        iconD:
          "M2 19v-11.45098c0-1.44386 0-2.1658 0.24332-2.73255 0.30338-0.70662 0.86653-1.26977 1.57315-1.57315 0.56675-0.24332 1.28158-0.24332 2.73255-0.24332h0.49409c0.60508 0 1.17764 0.27394 1.5573 0.74509l1.81709 2.25491m0 0h5.5825c1.4001 0 2.1002 0 2.635 0.27248 0.4704 0.23969 0.8528 0.62214 1.0925 1.09254 0.2725 0.53478 0.2725 1.23485 0.2725 2.63498v1m-9.5825-5h-3.4175m-3.84198 9.5144l0.29841-0.7427c0.73386-1.8268 1.1008-2.7401 1.86597-3.2559 0.76517-0.5158 1.75317-0.5158 3.72917-0.5158h8.06033c2.6885 0 4.0327 0 4.6303 0.8787 0.5975 0.8788 0.0983 2.1215-0.9002 4.6069l-0.2984 0.7427c-0.7339 1.8268-1.1008 2.7401-1.866 3.2559-0.7652 0.5158-1.7532 0.5158-3.7292 0.5158h-8.06028c-2.68851 0-4.03277 0-4.6303-0.8787-0.59753-0.8788-0.09829-2.1215 0.9002-4.6069z",
        textId: "q48Pq",
        lines: [
          "Flags a +57% price anomaly and places the mandate on",
          "ANOMALY_HOLD.",
        ],
      },
      {
        id: "g5LdeC",
        iconBoxId: "oERlF",
        iconId: "e4QI5o",
        iconD:
          "M11 6l10 0m-10 6l10 0m-10 6l10 0m-18-10.60714c0 0 1 0.6518 1.5 1.60714 0 0 1.5-3.75 3.5-5m-5 14.3929c0 0 1 0.6518 1.5 1.6071 0 0 1.5-3.75 3.5-5",
        textId: "A3ElY",
        lines: [
          "Sends an interactive alert to Telegram to Approve, Switch",
          "Card or Cancel.",
        ],
      },
    ],
  },
  {
    id: "LvoWD",
    name: "Workflow Founders",
    prefix: "Founders",
    textFirst: true,
    textColId: "TxBJy",
    eyebrowId: "bR0NO",
    eyebrow: "Founders",
    headlineWrapId: "k8dGmp",
    headlineId: "AOWms",
    headlineLines: ["Claim $50k in", "startup credits."],
    bodyWrapId: "T1nnBY",
    bodyId: "v9ufe",
    bodyText:
      "Before charging your wallet, RICO probes startup programs across PostHog, Notion and cloud tools.",
    keepOuterId: "y2phRf",
    keepBoxId: "jocge",
    keepBoxHeight: "h-[40.5px]",
    keepLine1Id: "vjfMl",
    keepLeadId: "yrvVa",
    keepText1Id: "lb2gs",
    keepText1: "Claimed startup credits and a zero-dollar invoice.",
    showcaseId: "X3SoIm",
    bgUrl: "/assets/sky-workflow-founders.jpg",
    glassId: "VEoYe",
    reqBarId: "r9iANm",
    orbCircleId: "Z6RFFj",
    orbDimId: "v29qQ",
    orbBrightId: "pUXJb",
    reqTextWrapId: "BcHS8",
    reqPromptId: "E14WNN",
    promptLines: [
      "Probe our SaaS stack for founder credits and active promo",
      "codes before running this month's invoices.",
    ],
    stepsListId: "e8hAp",
    steps: [
      {
        id: "JvZvZ",
        iconBoxId: "SDoR3",
        iconId: "lD0f8",
        iconD:
          "M18.4995 20.5c-0.2332-2.9315-2.6578-5.2523-5.6915-5.4479l-0.8085-0.0521c-0.2888 0.0076-0.5579 0.0178-0.8118 0.0298-3.00695 0.1425-5.4573 2.5676-5.68819 5.4702m9.74999-11.25c0 1.7949-1.4551 3.25-3.25 3.25-1.7949 0-3.24998-1.4551-3.24998-3.25 0-1.79493 1.45508-3.25 3.24998-3.25 1.7949 0 3.25 1.45507 3.25 3.25z m-9.74701-0.75c-0.32341-0.50515-0.51091-1.10568-0.51091-1.75 0-1.79493 1.45507-3.25 3.24999-3.25 0.44595 0 0.87093 0.08982 1.25782 0.25235m8.99691 4.74765c0.3234-0.50515 0.5109-1.10568 0.5109-1.75 0-1.79493-1.4551-3.25-3.25-3.25-0.4459 0-0.8709 0.08982-1.2578 0.25235m7.5013 14.24725c-0.1799-2.2622-2.0012-4.4996-4.0012-4.9996m-16.00023 4.9996c0.17996-2.2622 2.00122-4.4996 4.00122-4.9996",
        textId: "WLBcU",
        lines: [
          "Helpers match each merchant against the Startup Credit",
          "Matrix in parallel.",
        ],
      },
      {
        id: "S4cKh",
        iconBoxId: "kh9B5",
        iconId: "gDQlz",
        iconD: "M2 4h20m-2.5 0l2.5 16m-17.5-16l-2.5 16m2-11h16",
        textId: "owYEO",
        lines: [
          "Identifies $50,000 PostHog credits and $1,000 Notion",
          "startup perks.",
        ],
      },
      {
        id: "lPrPG",
        iconBoxId: "s5cZlu",
        iconId: "gPihP",
        iconD:
          "M16.4249 4.60509l0.99-0.98999c0.8202-0.82013 2.1499-0.82013 2.97 0 0.8201 0.82014 0.8201 2.14983 0 2.96997l-0.99 0.98999m-2.97-2.96997l-6.65932 6.65931c-0.50751 0.5076-0.86754 1.1434-1.04161 1.8397l-0.72397 2.8959 2.8959-0.724c0.6963-0.174 1.3321-0.5341 1.8397-1.0416l6.6593-6.65934m-2.97-2.96997l2.97 2.96997m-0.395 5.92494c0 3.2875 0 4.9312-0.9079 6.0376-0.1662 0.2025-0.3519 0.3882-0.5545 0.5544-1.1063 0.908-2.7501 0.908-6.0376 0.908h-0.4999c-3.77124 0-5.65684 0-6.82841-1.1716-1.17156-1.1715-1.17159-3.0572-1.17159-6.8284v-0.5c0-3.28748 0-4.93121 0.90794-6.03756 0.16623-0.20254 0.35196-0.38827 0.5545-0.5545 1.10635-0.90794 2.75008-0.90794 6.03756-0.90794",
        textId: "W8nPNp",
        lines: [
          "Applies active promo codes and logs total dollars saved",
          "to telemetry.",
        ],
      },
    ],
  },
  {
    id: "CdJr2",
    name: "Workflow Marketing",
    prefix: "Marketing",
    textFirst: false,
    textColId: "bxBDt",
    eyebrowId: "gwGDY",
    eyebrow: "Dual-Rail Vault",
    headlineWrapId: "fjG5V",
    headlineId: "RqYoQ",
    headlineLines: ["Primary wallet,", "instant backup."],
    bodyWrapId: "vCJB2",
    bodyId: "sKhAQ",
    bodyText:
      "Zero-knowledge tokens keep AI 100% blind to raw cards, with instant failover to backup Visa or Mastercard.",
    keepOuterId: "vaQqt",
    keepBoxId: "tsbfb",
    keepBoxHeight: "h-[40.5px]",
    keepLine1Id: "eFudL",
    keepLeadId: "k5fpSd",
    keepText1Id: "qx0qR",
    keepText1: "Tokenized vault rails and uninterrupted renewals.",
    showcaseId: "sKXzb",
    bgUrl: "/assets/sky-workflow-marketing.jpg",
    glassId: "CChUT",
    reqBarId: "bOZBL",
    orbCircleId: "bXPwA",
    orbDimId: "vgJOg",
    orbBrightId: "qqRMi",
    reqTextWrapId: "v06KxF",
    reqPromptId: "Blfzi",
    promptLines: [
      "Set my primary payment rail and route any merchant that",
      "requires direct card billing to my backup Visa 4242.",
    ],
    stepsListId: "rwVEP",
    steps: [
      {
        id: "mp5m3",
        iconBoxId: "i5dX5",
        iconId: "INJzB",
        iconD:
          "M12.8809 7.01656l4.7729 1.27169m-5.796 2.52515l2.3864 0.6358m-2.2677 6.5172l0.9546 0.2544c2.6999 0.7193 4.0499 1.079 5.1134 0.4685 1.0635-0.6106 1.4253-1.953 2.1487-4.6377l1.0231-3.7968c0.7235-2.68475 1.0852-4.02712 0.4712-5.08464-0.614-1.05752-1.964-1.41721-4.664-2.13658l-0.9546-0.25434c-2.6999-0.71938-4.0499-1.07906-5.1134-0.4685-1.06354 0.61056-1.42527 1.95293-2.14872 4.63767l-1.02312 3.79679c-0.72346 2.6847-1.08518 4.0271-0.47116 5.0846 0.61402 1.0576 1.96401 1.4173 4.664 2.1366z m0.0235 2.9798l-0.9523 0.2593c-2.69367 0.7335-4.04048 1.1002-5.10151 0.4777-1.06102-0.6225-1.4219-1.9912-2.14366-4.7286l-1.02071-3.8713c-0.72176-2.7374-1.08264-4.10612-0.47005-5.18438 0.5299-0.93273 1.68823-0.89877 3.18823-0.89889",
        textId: "ARZnj",
        lines: [
          "Stores opaque vault tokens without exposing PAN or CVV",
          "to the model.",
        ],
      },
      {
        id: "T6GyH",
        iconBoxId: "hNt9c",
        iconId: "dHK2l",
        iconD:
          "M16.4249 4.60509l0.99-0.98999c0.8202-0.82013 2.1499-0.82013 2.97 0 0.8201 0.82014 0.8201 2.14983 0 2.96997l-0.99 0.98999m-2.97-2.96997l-6.65932 6.65931c-0.50751 0.5076-0.86754 1.1434-1.04161 1.8397l-0.72397 2.8959 2.8959-0.724c0.6963-0.174 1.3321-0.5341 1.8397-1.0416l6.6593-6.65934m-2.97-2.96997l2.97 2.96997m-0.395 5.92494c0 3.2875 0 4.9312-0.9079 6.0376-0.1662 0.2025-0.3519 0.3882-0.5545 0.5544-1.1063 0.908-2.7501 0.908-6.0376 0.908h-0.4999c-3.77124 0-5.65684 0-6.82841-1.1716-1.17156-1.1715-1.17159-3.0572-1.17159-6.8284v-0.5c0-3.28748 0-4.93121 0.90794-6.03756 0.16623-0.20254 0.35196-0.38827 0.5545-0.5545 1.10635-0.90794 2.75008-0.90794 6.03756-0.90794",
        textId: "i6kHx",
        lines: [
          "Executes primary checkout and detects if direct card",
          "processing is needed.",
        ],
      },
      {
        id: "uzQUD",
        iconBoxId: "U0oHl",
        iconId: "qTpYX",
        iconD:
          "M14 8v3m-4 0v-3m-1.99703 4.0267c-0.04485-0.5541 0.42341-1.0267 1.01712-1.0267h5.95981c0.5937 0 1.062 0.4726 1.0171 1.0267l-0.1225 1.5136c-0.0881 1.0882-0.4737 2.1368-1.1199 3.0453l-0.4005 0.5631c-0.3782 0.5318-1.0156 0.8513-1.6983 0.8513h-1.3116c-0.6827 0-1.3201-0.3195-1.69832-0.8513l-0.40053-0.5631c-0.64612-0.9085-1.03175-1.9571-1.11984-3.0453l-0.12254-1.5136z m7.99703 9.1842c3.5318-1.5465 6-5.0786 6-9.1885 0-5.5352-4.4772-10.0224-10-10.0224-5.52285 0-10 4.4872-10 10.0224 0 5.1975 3.94741 9.4709 9.0014 9.9731 0.5496 0.0546 0.9986-0.3993 0.9986-0.9529v-3.0067",
        textId: "J5bAT",
        lines: [
          "Fails over cleanly to backup Visa and logs the rail in",
          "AG Grid.",
        ],
      },
    ],
  },
  {
    id: "JHQ23",
    name: "Workflow Support",
    prefix: "Support",
    textFirst: true,
    textColId: "Jbu6N",
    eyebrowId: "J2wOD3",
    eyebrow: "Omnichannel",
    headlineWrapId: "BY17y",
    headlineId: "Z5kcbe",
    headlineLines: ["Approve or cancel", "from chat."],
    bodyWrapId: "M1uzxW",
    bodyId: "T2BnP",
    bodyText:
      "Connect Telegram, WhatsApp and Slack. RICO sends spike alerts and lets you approve or cancel in one tap.",
    keepOuterId: "t5rvi",
    keepBoxId: "qLdQj",
    keepBoxHeight: "h-[40.5px]",
    keepLine1Id: "WhI97",
    keepLeadId: "a2uYYs",
    keepText1Id: "i3Wsy",
    keepText1: "Mobile approvals and a synced audit trail.",
    showcaseId: "oE9yf",
    bgUrl: "/assets/sky-workflow-support.jpg",
    glassId: "L2AUuS",
    reqBarId: "L7q8d",
    orbCircleId: "D4CCF3",
    orbDimId: "c0Kk8f",
    orbBrightId: "tJz8d",
    reqTextWrapId: "E3cNe",
    reqPromptId: "BtcCO",
    promptLines: [
      "Send weekly spend summaries to Slack and ping my",
      "Telegram whenever a mandate needs manual approval.",
    ],
    stepsListId: "BHMeO",
    steps: [
      {
        id: "O7CVg",
        iconBoxId: "HoyRY",
        iconId: "S7gOJW",
        iconD:
          "M2 12a10 10 0 1 0 20 0 10 10 0 1 0-20 0z m6 0c0 6 4 10 4 10 0 0 4-4 4-10 0-6-4-10-4-10 0 0-4 4-4 10z m13 3h-18m18-6h-18",
        textId: "FDWWQ",
        lines: [
          "Dispatches formatted alerts with inline action buttons",
          "via webhook.",
        ],
      },
      {
        id: "pDhz2",
        iconBoxId: "tWsGO",
        iconId: "JO0yK",
        iconD: "M2 4h20m-2.5 0l2.5 16m-17.5-16l-2.5 16m2-11h16",
        textId: "fhNc5",
        lines: [
          "One tap approves a one-time spike, switches rails or",
          "cancels the subscription.",
        ],
      },
      {
        id: "LYGfu",
        iconBoxId: "p6zFK",
        iconId: "h0OF9",
        iconD:
          "M7.5 12h6m-6-4h3m-2 12c1.05038 0.8697 2.3145 1.4238 3.7635 1.5188 1.1417 0.0749 2.3336 0.0748 3.473 0 0.3923-0.0257 0.82-0.1181 1.1883-0.2678 0.4097-0.1665 0.6147-0.2498 0.7189-0.2372 0.1041 0.0126 0.2552 0.1226 0.5574 0.3425 0.5328 0.3877 1.204 0.6662 2.1994 0.6423 0.5033-0.0121 0.755-0.0182 0.8676-0.2077 0.1127-0.1896-0.0276-0.452-0.3083-0.9768-0.3892-0.7279-0.6358-1.5612-0.2621-2.2289 0.6436-0.9537 1.1902-2.0831 1.2701-3.3029 0.0429-0.6554 0.0429-1.3342 0-1.9896-0.0532-0.8128-0.2505-1.5854-0.5666-2.2927m-9.0562 6.4868c3.5556-0.2342 6.3878-3.0799 6.6208-6.6524 0.0456-0.6991 0.0456-1.42309 0-2.12221-0.233-3.5725-3.0652-6.41818-6.6208-6.65234-1.213-0.07988-2.47947-0.07972-3.69001 0-3.55556 0.23416-6.38774 3.07984-6.62079 6.65234-0.0456 0.69912-0.0456 1.42311 0 2.12221 0.08488 1.3012 0.66572 2.5059 1.34952 3.5232 0.39704 0.7121 0.13501 1.601-0.27854 2.3774-0.29818 0.5598-0.44727 0.8397-0.32756 1.0419 0.1197 0.2022 0.3871 0.2087 0.92189 0.2216 1.05761 0.0255 1.77077-0.2716 2.33687-0.6851 0.32106-0.2346 0.4816-0.3519 0.59224-0.3653 0.11064-0.0135 0.32838 0.0753 0.76379 0.253 0.39133 0.1597 0.84571 0.2582 1.26258 0.2857 1.21054 0.0797 2.47701 0.0798 3.69001 0z",
        textId: "QaARG",
        lines: [
          "Every decision syncs immediately back to the web command",
          "center.",
        ],
      },
    ],
  },
  {
    id: "BkJNN",
    name: "Workflow Developers",
    prefix: "Developers",
    textFirst: false,
    textColId: "yypaU",
    eyebrowId: "TPjQI",
    eyebrow: "Developers",
    headlineWrapId: "jO9BX",
    headlineId: "yHIcA",
    headlineLines: ["Inspect telemetry", "and audit logs."],
    bodyWrapId: "MkLyI",
    bodyId: "Ojvai",
    bodyText:
      "Every agent decision, token count, latency metric and guardrail halt streams live to PostHog and AG Grid.",
    keepOuterId: "LzarQ",
    keepBoxId: "iWT8k",
    keepBoxHeight: "h-[63.5px]",
    keepLine1Id: "kVsup",
    keepLeadId: "j4tOyB",
    keepText1Id: "AHera",
    keepText1: "Full LLM observability, visual proof snapshots",
    keepText2Id: "Lvs7a",
    keepText2: "and exportable CSV logs.",
    showcaseId: "uXvy1",
    bgUrl: "/assets/sky-workflow-developers.jpg",
    glassId: "Z7PKo",
    reqBarId: "wVtZz",
    orbCircleId: "EYe68",
    orbDimId: "bAnqN",
    orbBrightId: "PVV5P",
    reqTextWrapId: "VfB5u",
    reqPromptId: "V9pbq",
    promptLines: [
      "Inspect visual price proof for order ORD-84920491 and",
      "verify guardrail telemetry in PostHog.",
    ],
    stepsListId: "uw0Hm",
    steps: [
      {
        id: "yH8zh",
        iconBoxId: "xjjZa",
        iconId: "lcrja",
        iconD:
          "M2 19v-11.45098c0-1.44386 0-2.1658 0.24332-2.73255 0.30338-0.70662 0.86653-1.26977 1.57315-1.57315 0.56675-0.24332 1.28158-0.24332 2.73255-0.24332h0.49409c0.60508 0 1.17764 0.27394 1.5573 0.74509l1.81709 2.25491m0 0h5.5825c1.4001 0 2.1002 0 2.635 0.27248 0.4704 0.23969 0.8528 0.62214 1.0925 1.09254 0.2725 0.53478 0.2725 1.23485 0.2725 2.63498v1m-9.5825-5h-3.4175m-3.84198 9.5144l0.29841-0.7427c0.73386-1.8268 1.1008-2.7401 1.86597-3.2559 0.76517-0.5158 1.75317-0.5158 3.72917-0.5158h8.06033c2.6885 0 4.0327 0 4.6303 0.8787 0.5975 0.8788 0.0983 2.1215-0.9002 4.6069l-0.2984 0.7427c-0.7339 1.8268-1.1008 2.7401-1.866 3.2559-0.7652 0.5158-1.7532 0.5158-3.7292 0.5158h-8.06028c-2.68851 0-4.03277 0-4.6303-0.8787-0.59753-0.8788-0.09829-2.1215 0.9002-4.6069z",
        textId: "AIAHe",
        lines: [
          "Captures timestamped DOM and screenshot proof before",
          "any payment capture.",
        ],
      },
      {
        id: "d4nwzx",
        iconBoxId: "h6VZy",
        iconId: "YY14e",
        iconD:
          "M7.5 7.5l1.22654 1.05719c0.51564 0.44444 0.77346 0.66667 0.77346 0.94281 0 0.27614-0.25782 0.49836-0.77346 0.9428l-1.22654 1.0572m4 1h4m-3.5 8.5c3.7497 0 5.6246 0 6.9389-0.9549 0.4245-0.3084 0.7978-0.6817 1.1062-1.1062 0.9549-1.3143 0.9549-3.1892 0.9549-6.9389 0-3.74973 0-5.6246-0.9549-6.93893-0.3084-0.42447-0.6817-0.79776-1.1062-1.10616-1.3143-0.95491-3.1892-0.95491-6.9389-0.95491-3.74973 0-5.6246 0-6.93893 0.95491-0.42447 0.3084-0.79776 0.68169-1.10616 1.10616-0.95491 1.31433-0.95491 3.1892-0.95491 6.93893 0 3.7497 0 5.6246 0.95491 6.9389 0.3084 0.4245 0.68169 0.7978 1.10616 1.1062 1.31433 0.9549 3.1892 0.9549 6.93893 0.9549z",
        textId: "T21J1",
        lines: [
          "Logs reasoning latency, token cost and safety checks",
          "to PostHog.",
        ],
      },
      {
        id: "t7UY5E",
        iconBoxId: "IVqYp",
        iconId: "iUuyD",
        iconD:
          "M6 8l0 8m12 0v-4c0-2.82844 0-4.24265-0.8787-5.12133-0.8787-0.87868-2.2929-0.87868-5.1213-0.87868l-1 0m0 0c0-0.70023 1.9943-2.00847 2.5-2.5m-2.5 2.5c0 0.70023 1.9943 2.00847 2.5 2.5m-9.5 9.50001a2 2 0 1 0 4 0 2 2 0 1 0-4 0z m0-12a2 2 0 1 0 4 0 2 2 0 1 0-4 0z m12 12a2 2 0 1 0 4 0 2 2 0 1 0-4 0z",
        textId: "v3imuh",
        lines: [
          "Updates the AG Grid financial ledger in real time via",
          "WebApp and API.",
        ],
      },
    ],
  },
];

function renderTextColumn(w: WorkflowItem) {
  return (
    <div
      data-pencil-id={w.textColId}
      data-pencil-name={`${w.prefix} Text Column`}
      className="box-border w-[470px] shrink-0 h-fit flex flex-col gap-0 justify-start items-start"
    >
      <div
        data-pencil-id={w.eyebrowId}
        data-pencil-name={`${w.prefix} Eyebrow`}
        className="text-[14px]/[21px] box-border text-[#F4F4F66B] font-[Geist,system-ui,sans-serif] font-medium text-left [white-space:nowrap]"
      >
        {w.eyebrow}
      </div>
      <div
        data-pencil-id={w.headlineWrapId}
        data-pencil-name={`${w.prefix} Headline Wrap`}
        className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[10px_0px_0px_0px] justify-start items-start"
      >
        <div
          data-pencil-id={w.headlineId}
          data-pencil-name={`${w.prefix} Headline`}
          className="text-[56px]/[58px] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-2.24px] text-left [white-space:nowrap]"
        >
          {w.headlineLines.map((line, i) => (
            <React.Fragment key={i}>
              {i > 0 && <br />}
              {line}
            </React.Fragment>
          ))}
        </div>
      </div>
      <div
        data-pencil-id={w.bodyWrapId}
        data-pencil-name={`${w.prefix} Body Wrap`}
        className="box-border w-[448px] h-fit shrink-0 flex flex-row gap-0 p-[16px_0px_0px_0px] justify-start items-start"
      >
        <div
          data-pencil-id={w.bodyId}
          data-pencil-name={`${w.prefix} Body`}
          className={`text-[20px]/[30px] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal tracking-[-0.24px] text-left ${
            w.bodyNowrap ? "[white-space:nowrap]" : "[flex:1_1_0]"
          }`}
        >
          {w.bodyText}
        </div>
      </div>
      <div
        data-pencil-id={w.keepOuterId}
        data-pencil-name={`${w.prefix} Keep Outer`}
        className="box-border w-[448px] h-fit shrink-0 flex flex-row gap-0 p-[22px_0px_0px_0px] justify-start items-start"
      >
        <div
          data-pencil-id={w.keepBoxId}
          data-pencil-name={`${w.prefix} Keep Box`}
          className={`[box-sizing:content-box] [flex:1_1_0] ${w.keepBoxHeight} flex flex-col gap-0 p-[18px_0px_0px_0px] justify-start items-start [border-width:1px_0px_0px_0px] [border-style:solid] [border-color:#FFFFFF1A] [margin:-0.5px_0px_0px_0px] w-[448px]`}
        >
          <div
            data-pencil-id={w.keepLine1Id}
            data-pencil-name={`${w.prefix} Keep Line 1`}
            className="box-border w-fit h-fit shrink-0 flex flex-row gap-[5px] justify-start items-center"
          >
            <div
              data-pencil-id={w.keepLeadId}
              data-pencil-name={`${w.prefix} Keep Lead`}
              className="text-[15.5px]/[23px] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold text-left [white-space:nowrap]"
            >
              You keep
            </div>
            <div
              data-pencil-id={w.keepText1Id}
              data-pencil-name={`${w.prefix} Keep Text 1`}
              className="text-[15.5px]/[23px] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
            >
              {w.keepText1}
            </div>
          </div>
          {w.keepText2 && (
            <div
              data-pencil-id={w.keepText2Id}
              data-pencil-name={`${w.prefix} Keep Text 2`}
              className="text-[15.5px]/[23px] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
            >
              {w.keepText2}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function renderShowcaseColumn(w: WorkflowItem) {
  return (
    <div
      data-pencil-id={w.showcaseId}
      data-pencil-name={`${w.prefix} Desk Showcase`}
      style={{ backgroundImage: `url('${w.bgUrl}')` }}
      className="box-border w-[658px] shrink-0 h-fit flex flex-col gap-0 p-[64px_56px] justify-center items-center bg-no-repeat bg-cover bg-center [outline:1px_solid_#FFFFFF17] [outline-offset:-0.5px] rounded-[28px]"
    >
      <div
        data-pencil-id={w.glassId}
        data-pencil-name={`${w.prefix} Glass Panel`}
        className="box-border w-[470px] h-fit shrink-0 [box-shadow:0px_18px_50px_#08142838] [backdrop-filter:blur(14px)] flex flex-col gap-0 p-[8px] justify-start items-start bg-[#1A1E2894] [outline:1px_solid_#FFFFFF29] [outline-offset:-0.5px] rounded-[20px]"
      >
        <div
          data-pencil-id={w.reqBarId}
          data-pencil-name={`${w.prefix} Request Bar`}
          className="box-border w-full h-fit shrink-0 flex flex-row gap-[12px] p-[12px_14px_12px_10px] justify-start items-start bg-[#FFFFFF14] rounded-[14px]"
        >
          <div
            data-pencil-id={w.orbCircleId}
            data-pencil-name={`${w.prefix} Orb Circle`}
            className="box-border w-[30px] shrink-0 h-[30px] bg-[#FFFFFF14] rounded-[999px] relative"
          >
            <svg
              data-pencil-id={w.orbDimId}
              data-pencil-name={`${w.prefix} Orb Dots Dim`}
              viewBox="0 0 20 20"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
              className="box-border w-[20px] h-[20px] absolute left-[5px] top-[5px] overflow-visible [z-index:0]"
            >
              <path d={ORB_DIM_D} fill="#F4F4F633" />
            </svg>
            <svg
              data-pencil-id={w.orbBrightId}
              data-pencil-name={`${w.prefix} Orb Dots Bright`}
              viewBox="0 0 20 20"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
              className="box-border w-[20px] h-[20px] absolute left-[5px] top-[5px] overflow-visible [z-index:1]"
            >
              <path d={ORB_BRIGHT_D} fill="#F4F4F678" />
            </svg>
          </div>
          <div
            data-pencil-id={w.reqTextWrapId}
            data-pencil-name={`${w.prefix} Request Text Wrap`}
            className="box-border [flex:1_1_0] h-fit flex flex-row gap-0 p-[5px_0px_0px_0px] justify-start items-start"
          >
            <div
              data-pencil-id={w.reqPromptId}
              data-pencil-name={`${w.prefix} Request Prompt`}
              className="text-[14.5px]/[21px] box-border text-[#FFFFFF] font-[Geist,system-ui,sans-serif] font-normal tracking-[-0.145px] text-left [white-space:nowrap]"
            >
              {w.promptLines.map((line, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <br />}
                  {line}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
        <div
          data-pencil-id={w.stepsListId}
          data-pencil-name={`${w.prefix} Steps List`}
          className="box-border w-full h-fit shrink-0 flex flex-col gap-0 p-[6px_8px_4px_8px] justify-start items-start"
        >
          {w.steps.map((s, idx) => (
            <div
              key={s.id}
              data-pencil-id={s.id}
              data-pencil-name={`${w.prefix} Step ${idx + 1}`}
              className={
                idx === 0
                  ? "box-border w-full h-fit shrink-0 flex flex-row gap-[12px] p-[11px_2px] justify-start items-center"
                  : "[box-sizing:content-box] w-[438px] h-[61.5px] shrink-0 flex flex-row gap-[12px] p-[11px_2px] justify-start items-center [border-width:1px_0px_0px_0px] [border-style:solid] [border-color:#FFFFFF14] [margin:-0.5px_0px_0px_0px]"
              }
            >
              <div
                data-pencil-id={s.iconBoxId}
                data-pencil-name={`${w.prefix} Step ${idx + 1} Icon Box`}
                className="box-border w-[28px] shrink-0 h-[28px] flex flex-row gap-0 justify-center items-center bg-[#FFFFFF1A] rounded-[8px]"
              >
                <svg
                  data-pencil-id={s.iconId}
                  data-pencil-name={`${w.prefix} Step ${idx + 1} Icon`}
                  viewBox="0 0 24 24"
                  preserveAspectRatio="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="box-border w-[15px] shrink-0 h-[15px] overflow-visible"
                >
                  <path
                    d={s.iconD}
                    fill="none"
                    stroke="#FFFFFFD1"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              </div>
              <div
                data-pencil-id={s.textId}
                data-pencil-name={`${w.prefix} Step ${idx + 1} Text`}
                className="text-[14px]/[20px] box-border text-[#FFFFFFD1] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
              >
                {s.lines.map((line, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <br />}
                    {line}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function WorkflowsMainShell() {
  return (
    <div
      data-pencil-id="OAScK"
      data-pencil-name="Workflows Main Shell"
      className="box-border w-[1440px] h-fit shrink-0 flex flex-col gap-0 p-[112px_120px_160px_120px] justify-start items-center bg-[#09090B]"
    >
      <div
        data-pencil-id="x9t5Uy"
        data-pencil-name="Workflows Hero Block"
        className="box-border w-full h-fit shrink-0 flex flex-col gap-0 justify-start items-center bg-[#09090B]"
      >
        <div
          data-pencil-id="jbuIF"
          data-pencil-name="Workflows Header"
          className="box-border w-[736px] h-fit shrink-0 flex flex-col gap-[20px] justify-start items-center"
        >
          <div
            data-pencil-id="qfyqL"
            data-pencil-name="Workflows Title"
            className="text-[68px]/[68px] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-3.06px] text-center [white-space:nowrap]"
          >
            Workflows
          </div>
          <div
            data-pencil-id="dOzjR"
            data-pencil-name="Workflows Lede"
            className="text-[20px]/[30px] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal text-center [white-space:nowrap]"
          >
            One mandate, in your own words. Helpers open live merchant pages, verify
            <br />
            prices in plain sight and leave you verified receipts. Here is how
            <br />
            that looks across eight workflows.
          </div>
        </div>
        <div
          data-pencil-id="cODCN"
          data-pencil-name="Workflows Jump Nav"
          className="box-border w-full h-fit shrink-0 flex flex-col gap-[8px] p-[36px_0px_0px_0px] justify-start items-center"
        >
          <div
            data-pencil-id="KihDf"
            data-pencil-name="Jump Row 1"
            className="box-border w-fit h-fit shrink-0 flex flex-row gap-[8px] justify-center items-center"
          >
            <div
              data-pencil-id="IhpFW"
              data-pencil-name="Jump Pill Travel"
              className="box-border w-fit shrink-0 h-[34px] flex flex-row gap-0 p-[0px_14px] justify-center items-center bg-[#FFFFFF0F] [outline:1px_solid_#FFFFFF1F] [outline-offset:-0.5px] rounded-[999px]"
            >
              <div
                data-pencil-id="lIueJ"
                data-pencil-name="Travel Label"
                className="text-[14px]/[normal] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-medium text-left [white-space:nowrap]"
              >
                Subscriptions
              </div>
            </div>
            <div
              data-pencil-id="ZHPt4"
              data-pencil-name="Jump Pill Buying"
              className="box-border w-fit shrink-0 h-[34px] flex flex-row gap-0 p-[0px_14px] justify-center items-center bg-[#FFFFFF0F] [outline:1px_solid_#FFFFFF1F] [outline-offset:-0.5px] rounded-[999px]"
            >
              <div
                data-pencil-id="yJzgR"
                data-pencil-name="Buying Label"
                className="text-[14px]/[normal] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-medium text-left [white-space:nowrap]"
              >
                Cloud &amp; SaaS
              </div>
            </div>
            <div
              data-pencil-id="J5VIV"
              data-pencil-name="Jump Pill Research"
              className="box-border w-fit shrink-0 h-[34px] flex flex-row gap-0 p-[0px_14px] justify-center items-center bg-[#FFFFFF0F] [outline:1px_solid_#FFFFFF1F] [outline-offset:-0.5px] rounded-[999px]"
            >
              <div
                data-pencil-id="s8UwpX"
                data-pencil-name="Research Label"
                className="text-[14px]/[normal] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-medium text-left [white-space:nowrap]"
              >
                Student Perks
              </div>
            </div>
            <div
              data-pencil-id="jbe0i"
              data-pencil-name="Jump Pill Job search"
              className="box-border w-fit shrink-0 h-[34px] flex flex-row gap-0 p-[0px_14px] justify-center items-center bg-[#FFFFFF0F] [outline:1px_solid_#FFFFFF1F] [outline-offset:-0.5px] rounded-[999px]"
            >
              <div
                data-pencil-id="t8et1"
                data-pencil-name="Job search Label"
                className="text-[14px]/[normal] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-medium text-left [white-space:nowrap]"
              >
                Price Sentinel
              </div>
            </div>
            <div
              data-pencil-id="XuwwV"
              data-pencil-name="Jump Pill Founders"
              className="box-border w-fit shrink-0 h-[34px] flex flex-row gap-0 p-[0px_14px] justify-center items-center bg-[#FFFFFF0F] [outline:1px_solid_#FFFFFF1F] [outline-offset:-0.5px] rounded-[999px]"
            >
              <div
                data-pencil-id="O2ykf9"
                data-pencil-name="Founders Label"
                className="text-[14px]/[normal] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-medium text-left [white-space:nowrap]"
              >
                Founders
              </div>
            </div>
            <div
              data-pencil-id="oyIKc"
              data-pencil-name="Jump Pill Marketing"
              className="box-border w-fit shrink-0 h-[34px] flex flex-row gap-0 p-[0px_14px] justify-center items-center bg-[#FFFFFF0F] [outline:1px_solid_#FFFFFF1F] [outline-offset:-0.5px] rounded-[999px]"
            >
              <div
                data-pencil-id="PboLB"
                data-pencil-name="Marketing Label"
                className="text-[14px]/[normal] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-medium text-left [white-space:nowrap]"
              >
                Dual-Rail Vault
              </div>
            </div>
          </div>
          <div
            data-pencil-id="bOeKs"
            data-pencil-name="Jump Row 2"
            className="box-border w-fit h-fit shrink-0 flex flex-row gap-[8px] justify-center items-center"
          >
            <div
              data-pencil-id="IvOUj"
              data-pencil-name="Jump Pill Support"
              className="box-border w-fit shrink-0 h-[34px] flex flex-row gap-0 p-[0px_14px] justify-center items-center bg-[#FFFFFF0F] [outline:1px_solid_#FFFFFF1F] [outline-offset:-0.5px] rounded-[999px]"
            >
              <div
                data-pencil-id="G6xTv0"
                data-pencil-name="Support Label"
                className="text-[14px]/[normal] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-medium text-left [white-space:nowrap]"
              >
                Omnichannel
              </div>
            </div>
            <div
              data-pencil-id="IUWEv"
              data-pencil-name="Jump Pill Developers"
              className="box-border w-fit shrink-0 h-[34px] flex flex-row gap-0 p-[0px_14px] justify-center items-center bg-[#FFFFFF0F] [outline:1px_solid_#FFFFFF1F] [outline-offset:-0.5px] rounded-[999px]"
            >
              <div
                data-pencil-id="tqzD6"
                data-pencil-name="Developers Label"
                className="text-[14px]/[normal] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-medium text-left [white-space:nowrap]"
              >
                Developers
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        data-pencil-id="njri0"
        data-pencil-name="Workflows List"
        className="box-border w-full h-fit shrink-0 flex flex-col gap-[140px] p-[96px_0px_0px_0px] justify-start items-start bg-[#09090B]"
      >
        {WORKFLOW_ITEMS.map((w) => (
          <div
            key={w.id}
            data-pencil-id={w.id}
            data-pencil-name={w.name}
            className="box-border w-full h-fit shrink-0 flex flex-row gap-[72px] justify-start items-center bg-[#09090B]"
          >
            {w.textFirst ? (
              <>
                {renderTextColumn(w)}
                {renderShowcaseColumn(w)}
              </>
            ) : (
              <>
                {renderShowcaseColumn(w)}
                {renderTextColumn(w)}
              </>
            )}
          </div>
        ))}
      </div>

      <div
        data-pencil-id="bA7gZ"
        data-pencil-name="Workflows Close Outer"
        className="box-border w-full h-fit shrink-0 flex flex-col gap-0 p-[160px_0px_0px_0px] justify-start items-start bg-[#09090B]"
      >
        <div
          data-pencil-id="p3syO"
          data-pencil-name="Bring Your Own Work Aside"
          className="[box-sizing:content-box] w-[1200px] h-[331.5px] shrink-0 flex flex-col gap-0 p-[88px_0px_0px_0px] justify-start items-center [border-width:1px_0px_0px_0px] [border-style:solid] [border-color:#FFFFFF14] [margin:-0.5px_0px_0px_0px]"
        >
          <div
            data-pencil-id="h1ALA"
            data-pencil-name="Close Headline"
            className="text-[56px]/[58px] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-2.24px] text-center [white-space:nowrap]"
          >
            Bring your own mandates.
          </div>
          <div
            data-pencil-id="PAZs5"
            data-pencil-name="Close Body Wrap"
            className="box-border w-fit h-fit shrink-0 flex flex-row gap-0 p-[16px_0px_0px_0px] justify-center items-center"
          >
            <div
              data-pencil-id="oHPyz"
              data-pencil-name="Close Body"
              className="text-[20px]/[30px] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal text-center [white-space:nowrap]"
            >
              Every workflow runs in the RICO WebApp and API:
              <br />
              choose RICO AI, your keys for Gemini, Anthropic
              <br />
              or OpenAI, or strict manual approval mode.
            </div>
          </div>
          <div
            data-pencil-id="CEzTf"
            data-pencil-name="Close Actions Wrap"
            className="box-border w-fit h-fit shrink-0 flex flex-row gap-0 p-[32px_0px_0px_0px] justify-center items-center"
          >
            <div
              data-pencil-id="T07yt1"
              data-pencil-name="Read the docs Button"
              className="box-border w-fit shrink-0 h-[48px] flex flex-row gap-0 p-[0px_22px] justify-center items-center bg-[#FFFFFF14] [outline:1px_solid_#FFFFFF24] [outline-offset:-0.5px] rounded-[999px]"
            >
              <div
                data-pencil-id="u8q83p"
                data-pencil-name="Read the docs Label"
                className="text-[15.5px]/[normal] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-medium tracking-[-0.186px] text-left [white-space:nowrap]"
              >
                Read the docs
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
