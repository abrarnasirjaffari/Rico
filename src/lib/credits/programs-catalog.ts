import { CreditProgram } from "./types";

export const STARTUP_CREDITS_CATALOG: CreditProgram[] = [
  // 1. PostHog for Startups
  {
    id: "posthog-startups",
    name: "PostHog for Startups",
    provider: "PostHog",
    category: "ANALYTICS",
    maxCreditValueUsd: 50000,
    creditTermMonths: 12,
    programUrl: "https://posthog.com/startups",
    badge: "$50k Analytics & Telemetry",
    eligibility: {
      maxCompanyAgeYears: 2,
      maxFundingRaisedUsd: 5000000,
      allowedStages: ["BOOTSTRAPPED", "PRE_SEED", "SEED"],
      requiresWebsite: true,
    },
    overview:
      "Full access to PostHog product analytics, session replay, feature flags, A/B testing, and LLM observability telemetry.",
    sampleQuestions: [
      {
        id: "traction",
        question: "What is your product's current traction and user growth?",
        guideline: "Highlight monthly active users, beta signups, and transaction volume.",
      },
      {
        id: "use_case",
        question: "How will your team leverage PostHog to grow?",
        guideline: "Explain tracking AI latency, agent execution steps, and funnel conversions.",
      },
    ],
  },

  // 2. AWS Activate
  {
    id: "aws-activate",
    name: "AWS Activate Founders & Portfolio",
    provider: "Amazon Web Services",
    category: "CLOUD",
    maxCreditValueUsd: 25000,
    creditTermMonths: 24,
    programUrl: "https://aws.amazon.com/activate/",
    badge: "$25k Cloud Compute",
    eligibility: {
      maxCompanyAgeYears: 5,
      maxFundingRaisedUsd: 10000000,
      allowedStages: ["BOOTSTRAPPED", "PRE_SEED", "SEED", "SERIES_A"],
      requiresWebsite: true,
    },
    overview:
      "Cloud infrastructure credits applicable to EC2, S3, RDS, Amazon Bedrock generative AI, and AWS Business Support.",
    sampleQuestions: [
      {
        id: "architecture",
        question: "Describe your technical architecture and AWS services used.",
        guideline: "Detail containerization, serverless endpoints, and model inference setup.",
      },
      {
        id: "scalability",
        question: "What is your infrastructure roadmap over the next 12 months?",
        guideline: "Focus on multi-region low latency, telemetry ingestion, and data pipelines.",
      },
    ],
  },

  // 3. Microsoft for Startups Founders Hub / OpenAI
  {
    id: "microsoft-founders-hub",
    name: "Microsoft for Startups Founders Hub",
    provider: "Microsoft & OpenAI",
    category: "AI_COMPUTE",
    maxCreditValueUsd: 25000,
    creditTermMonths: 12,
    programUrl: "https://foundershub.startups.microsoft.com/",
    badge: "$25k Azure OpenAI Credits",
    eligibility: {
      maxCompanyAgeYears: 5,
      maxFundingRaisedUsd: 15000000,
      allowedStages: ["BOOTSTRAPPED", "PRE_SEED", "SEED", "SERIES_A"],
      requiresWebsite: true,
    },
    overview:
      "Up to $25k in Azure credits including high-throughput GPT-4o and OpenAI models, GitHub Enterprise, and Microsoft 365.",
    sampleQuestions: [
      {
        id: "ai_model",
        question: "How does your solution integrate large language models?",
        guideline: "Detail prompt workflows, tool execution calling, and safety guardrails.",
      },
      {
        id: "market_opportunity",
        question: "What market problem are you addressing with AI automation?",
        guideline: "Explain workflow friction, cost savings, and verifiable autonomous proof.",
      },
    ],
  },

  // 4. Notion for Startups
  {
    id: "notion-startups",
    name: "Notion for Startups",
    provider: "Notion",
    category: "PRODUCTIVITY",
    maxCreditValueUsd: 1000,
    creditTermMonths: 6,
    programUrl: "https://www.notion.so/startups",
    badge: "$1,000 Team Workspace",
    eligibility: {
      maxCompanyAgeYears: 3,
      allowedStages: ["BOOTSTRAPPED", "PRE_SEED", "SEED"],
      requiresWebsite: true,
    },
    overview:
      "Up to 6 months free of Notion Plus with unlimited Notion AI team members for company wikis, roadmaps, and sprint boards.",
    sampleQuestions: [
      {
        id: "team_size",
        question: "How many core team members and contractors are in your organization?",
        guideline: "List core engineers, product leads, and external advisors.",
      },
      {
        id: "collaboration",
        question: "How will Notion centralize your company knowledge base?",
        guideline: "Explain sprint tracking, architectural documentation, and investor memos.",
      },
    ],
  },

  // 5. Stripe Processing Fee Waiver
  {
    id: "stripe-startups",
    name: "Stripe Startup Processing Waiver",
    provider: "Stripe",
    category: "PAYMENT_PROCESSING",
    maxCreditValueUsd: 20000,
    creditTermMonths: 12,
    programUrl: "https://stripe.com/startups",
    badge: "$20k Fee-Free Processing",
    eligibility: {
      maxCompanyAgeYears: 3,
      maxFundingRaisedUsd: 5000000,
      allowedStages: ["BOOTSTRAPPED", "PRE_SEED", "SEED"],
      requiresWebsite: true,
    },
    overview:
      "Waives payment gateway processing fees on your first $20,000 of volume, plus prioritized onboarding.",
    sampleQuestions: [
      {
        id: "business_model",
        question: "What is your transaction flow and customer monetization model?",
        guideline: "Detail subscription SaaS recurring billing or autonomous agent checkout fees.",
      },
    ],
  },

  // 6. GitHub for Startups
  {
    id: "github-startups",
    name: "GitHub for Startups",
    provider: "GitHub",
    category: "DEVTOOLS",
    maxCreditValueUsd: 5000,
    creditTermMonths: 12,
    programUrl: "https://github.com/enterprise/startups",
    badge: "$5,000 Enterprise Dev",
    eligibility: {
      maxCompanyAgeYears: 3,
      maxFundingRaisedUsd: 10000000,
      allowedStages: ["BOOTSTRAPPED", "PRE_SEED", "SEED"],
      requiresWebsite: true,
    },
    overview:
      "20 free seats of GitHub Enterprise including GitHub Copilot, advanced security scans, and unlimited CI/CD runner minutes.",
    sampleQuestions: [
      {
        id: "open_source",
        question: "Do you maintain or utilize open-source components?",
        guideline: "Mention core Next.js, SQLite, or agent SDK open-source dependencies.",
      },
    ],
  },

  // 7. Google Cloud for Startups
  {
    id: "google-cloud-startups",
    name: "Google Cloud for Startups Program",
    provider: "Google Cloud",
    category: "CLOUD",
    maxCreditValueUsd: 25000,
    creditTermMonths: 12,
    programUrl: "https://cloud.google.com/startup",
    badge: "$2k Direct / $25k via NVIDIA Inception",
    eligibility: {
      maxCompanyAgeYears: 5,
      allowedStages: ["BOOTSTRAPPED", "PRE_SEED", "SEED"],
      requiresWebsite: true,
    },
    overview:
      "Cloud compute credits for Cloud Run, GKE, BigQuery, and Gemini AI. Direct bootstrapped applications cap at $2,000, whereas applying via NVIDIA Inception partner tier unlocks up to $25,000 even for bootstrapped founders.",
    sampleQuestions: [
      {
        id: "cloud_stack",
        question: "How do you plan to use Google Cloud and Gemini AI?",
        guideline: "Highlight high-throughput web automation and price verification pipelines.",
      },
    ],
  },

  // 8. NVIDIA Inception (Partner Cloud & AI Unlock)
  {
    id: "nvidia-inception",
    name: "NVIDIA Inception Partner Program",
    provider: "NVIDIA",
    category: "AI_COMPUTE",
    maxCreditValueUsd: 25000,
    creditTermMonths: 12,
    programUrl: "https://www.nvidia.com/en-us/startups/",
    badge: "90-95% Unlock: $25k AWS & $25k GCP",
    eligibility: {
      maxCompanyAgeYears: 10,
      allowedStages: ["BOOTSTRAPPED", "PRE_SEED", "SEED", "SERIES_A"],
      requiresWebsite: true,
    },
    overview:
      "Free AI & compute startup membership unlocking 90-95% approval on $10,000-$25,000 AWS Activate credits plus $25,000 Google Cloud credits for bootstrapped founders, alongside GPU cloud discounts.",
    sampleQuestions: [
      {
        id: "ai_workload",
        question: "How does your startup build with AI, machine learning, or accelerated computing?",
        guideline: "Describe multi-model inference pipelines, autonomous reasoning agents, and production GPU/cloud compute workloads.",
      },
    ],
  },

  // 9. Retool for Startups (Internal Tools + Partner Perks Bridge)
  {
    id: "retool-startups",
    name: "Retool for Startups",
    provider: "Retool",
    category: "DEVTOOLS",
    maxCreditValueUsd: 25000,
    creditTermMonths: 12,
    programUrl: "https://retool.com/startups",
    badge: "$25k Credits + Zendesk/AWS Partner Bridge",
    eligibility: {
      maxCompanyAgeYears: 5,
      maxFundingRaisedUsd: 10000000,
      allowedStages: ["BOOTSTRAPPED", "PRE_SEED", "SEED"],
      requiresWebsite: true,
    },
    overview:
      "Free Retool credits for internal ops dashboards plus access to Retool's Startup Partner Perks directory, unlocking streamlined partner entry into Zendesk for Startups and AWS $5k Organization-tier credits.",
    sampleQuestions: [
      {
        id: "internal_ops",
        question: "What internal operations or admin workflows are you building?",
        guideline: "Detail customer support, billing reconciliation, and ops monitoring workflows with a clear, focused startup idea.",
      },
    ],
  },

  // 10. Zendesk for Startups (Support Suite + AWS $5k Organization Partner)
  {
    id: "zendesk-startups",
    name: "Zendesk for Startups",
    provider: "Zendesk",
    category: "PRODUCTIVITY",
    maxCreditValueUsd: 6000,
    creditTermMonths: 6,
    programUrl: "https://www.zendesk.com/startups/",
    badge: "6 Months Free + AWS $5k Org Partner (80-95%)",
    eligibility: {
      maxCompanyAgeYears: 5,
      maxFundingRaisedUsd: 10000000,
      allowedStages: ["BOOTSTRAPPED", "PRE_SEED", "SEED"],
      requiresWebsite: true,
    },
    overview:
      "6 months of free Zendesk Suite plus official AWS Activate Partner Organization access, raising AWS $5,000 credit approval odds from ~10% cold to 80-95%.",
    sampleQuestions: [
      {
        id: "support_workflow",
        question: "How do you support early customers and manage onboarding tickets?",
        guideline: "Explain omnichannel customer onboarding and support ticketing as user volume scales.",
      },
    ],
  },

  // 11. Depot for Startups (Container & CI Builds via PostHog Perks)
  {
    id: "depot-startups",
    name: "Depot Startup Credits (via PostHog Partner Perks)",
    provider: "Depot",
    category: "DEVTOOLS",
    maxCreditValueUsd: 5000,
    creditTermMonths: 12,
    programUrl: "https://depot.dev",
    badge: "$5,000 Docker/CI Credits + Swag",
    eligibility: {
      maxCompanyAgeYears: 2,
      maxFundingRaisedUsd: 5000000,
      allowedStages: ["BOOTSTRAPPED", "PRE_SEED", "SEED"],
      requiresWebsite: true,
    },
    overview:
      "Accelerated Docker image builds and GitHub Actions runners ($5,000 credits + founder swag unlocked via PostHog for Startups). Skip completely if your startup does not use Docker or CI container builds.",
    sampleQuestions: [
      {
        id: "ci_containers",
        question: "Do your deployments rely on Docker container builds or GitHub Actions?",
        guideline: "Only claim if running Dockerfiles or heavy CI runner pipelines; skip otherwise.",
      },
    ],
  },

  // 12. GitHub Student Developer Pack (Education)
  {
    id: "github-student-pack",
    name: "GitHub Student Developer Pack",
    provider: "GitHub Education",
    category: "EDUCATION",
    maxCreditValueUsd: 200000,
    creditTermMonths: 24,
    programUrl: "https://education.github.com/pack",
    badge: "$200k Student Dev Suite",
    eligibility: {
      requiresEduEmail: true,
    },
    overview:
      "100% free access to GitHub Copilot ($228/yr), JetBrains IDEs, Figma Education, Canva, Namecheap domains, and DigitalOcean cloud credits for students.",
    sampleQuestions: [
      {
        id: "academic_status",
        question: "Provide your accredited university and expected graduation date.",
        guideline: "Include student enrollment proof or active .edu email domain.",
      },
    ],
  },

  // 13. PayPal AI Agentic Commerce Track
  {
    id: "paypal-agentic-commerce",
    name: "PayPal AI Agentic Commerce Fee Relief",
    provider: "PayPal",
    category: "PAYMENT_PROCESSING",
    maxCreditValueUsd: 10000,
    creditTermMonths: 12,
    programUrl: "https://developer.paypal.com",
    badge: "0% Agentic Processing Fee",
    eligibility: {
      allowedStages: ["BOOTSTRAPPED", "PRE_SEED", "SEED"],
      requiresWebsite: true,
    },
    overview:
      "Special hackathon and startup tier: zero merchant transaction fees for autonomous AI agent mandates and verified sandbox checkouts.",
    sampleQuestions: [
      {
        id: "agentic_flow",
        question: "How does your AI agent interact with the PayPal payments ecosystem?",
        guideline: "Detail dual-rail payment architecture, budget ceiling guardrails, and digital receipts.",
      },
    ],
  },
];
