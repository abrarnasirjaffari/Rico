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
    maxCreditValueUsd: 2000,
    creditTermMonths: 12,
    programUrl: "https://cloud.google.com/startup",
    badge: "$2,000 - $100k GCP Credits",
    eligibility: {
      maxCompanyAgeYears: 5,
      allowedStages: ["BOOTSTRAPPED", "PRE_SEED", "SEED"],
      requiresWebsite: true,
    },
    overview:
      "Cloud compute credits applicable to Google Kubernetes Engine, Cloud Run, BigQuery, and Gemini multimodal models.",
    sampleQuestions: [
      {
        id: "cloud_stack",
        question: "How do you plan to use Google Cloud and Gemini AI?",
        guideline: "Highlight high-throughput web automation and price verification pipelines.",
      },
    ],
  },

  // 8. GitHub Student Developer Pack (Education)
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

  // 9. PayPal AI Agentic Commerce Track
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

  // 10. Cloudflare for Startups — Tier 3 ($10k)
  {
    id: "cloudflare-startups-tier-3",
    name: "Cloudflare for Startups (Tier 3: Bootstrapped / Self-Funded)",
    provider: "Cloudflare",
    category: "CLOUD",
    maxCreditValueUsd: 10000,
    creditTermMonths: 12,
    programUrl: "https://www.cloudflare.com/startups/",
    badge: "Up to $10k Cloud & Edge Credits",
    tierName: "Tier 3",
    exclusiveGroupId: "cloudflare-for-startups",
    serviceCaps: [
      "R2 Object Storage: covered up to a $10,000 credit cap (overages are automatically billed).",
    ],
    excludedServices: [
      "Workers AI: Effective Dec 1 and for all incoming startups, Workers AI is not covered by credits (for existing startups until Dec 1: covered up to $2,500 for Tier 3, $10,000 for Tier 2, and $50,000 for Tier 1).",
      "AI Gateway: Temporarily not covered by credits.",
      "Registrar Services: Domain registration and renewal fees are excluded and must be paid in full using the payment method on file.",
      "Enterprise Feature Add-Ons: Excluded by default (must request manual access via startups@cloudflare.com or support ticket).",
      "Premium Network Services: Magic Transit, Enterprise Spectrum, Dedicated IPs, and China Network are excluded and require a dedicated contracted plan.",
    ],
    termsAndBillingNotes: [
      "Credits are valid for 1 year (12 months) or until fully consumed, whichever comes first; extensions are not approved.",
      "Requires creating a Cloudflare account with a valid payment method on file.",
      "Credits are non-transferable, nonrefundable, and non-redeemable for cash; applicant is responsible for any applicable taxes.",
      "Automatic billing warning: Any overages (including exceeding the $10,000 R2 cap or using excluded services) and any continued usage after credit expiration will be automatically billed to the payment method on file unless domains are downgraded to the Free plan or moved to a prepaid contract.",
    ],
    eligibility: {
      maxCompanyAgeYears: 10,
      requiresExactIncorporationDateAtBoundary: true,
      maxFundingRaisedUsd: 1000000,
      strictMaxFundingRaised: true,
      allowedStages: ["BOOTSTRAPPED", "PRE_SEED", "SEED", "SERIES_A", "SERIES_B"],
      requiresWebsite: true,
      requiresBootstrappedOrSelfFunded: true,
      requiresFundingWithinMonths: 12,
      requiresFirstTimeRedemption: true,
      requiresTechnologyProduct: true,
      requiresForProfitBusiness: true,
      requiresDomainMatchedBusinessEmail: true,
      requiresSocialPresence: true,
      disallowsExistingEnterpriseCustomer: true,
    },
    overview:
      "Up to $10,000 in Cloudflare developer platform credits for 1 year for bootstrapped or self-funded startups with under $1M raised. Covers Workers, Durable Objects, Workflows, Workers KV, D1, Queues, Vectorize, R2 (capped at $10,000), Pages, Images, Stream, Cache Reserve, and Argo Smart Routing, plus 3 Enterprise domains and core security/CDN features included at no cost. Excludes Workers AI (effective Dec 1 for incoming startups), AI Gateway, Registrar, and Premium Network Services.",
    sampleQuestions: [
      {
        id: "architecture",
        question: "How will your startup use Cloudflare's developer platform (Workers, D1, KV, R2, Pages)?",
        guideline: "Detail your edge compute architecture, storage workloads (noting the $10k R2 cap), and global traffic requirements.",
      },
      {
        id: "traction",
        question: "Describe your company's current stage, self-funding structure, and technology product.",
        guideline: "Confirm bootstrapped or self-funded status under $1M raised, live product website, domain-matched business email, and public social presence.",
      },
    ],
  },

  // 11. Cloudflare for Startups — Tier 2 ($100k)
  {
    id: "cloudflare-startups-tier-2",
    name: "Cloudflare for Startups (Tier 2: Partner-Funded <$5M)",
    provider: "Cloudflare",
    category: "CLOUD",
    maxCreditValueUsd: 100000,
    creditTermMonths: 12,
    programUrl: "https://www.cloudflare.com/startups/",
    badge: "Up to $100k Cloud & Edge Credits",
    tierName: "Tier 2",
    exclusiveGroupId: "cloudflare-for-startups",
    serviceCaps: [
      "R2 Object Storage: covered up to a $10,000 credit cap (overages are automatically billed).",
    ],
    excludedServices: [
      "Workers AI: Effective Dec 1 and for all incoming startups, Workers AI is not covered by credits (for existing startups until Dec 1: covered up to $2,500 for Tier 3, $10,000 for Tier 2, and $50,000 for Tier 1).",
      "AI Gateway: Temporarily not covered by credits.",
      "Registrar Services: Domain registration and renewal fees are excluded and must be paid in full using the payment method on file.",
      "Enterprise Feature Add-Ons: Excluded by default (must request manual access via startups@cloudflare.com or support ticket).",
      "Premium Network Services: Magic Transit, Enterprise Spectrum, Dedicated IPs, and China Network are excluded and require a dedicated contracted plan.",
    ],
    termsAndBillingNotes: [
      "Credits are valid for 1 year (12 months) or until fully consumed, whichever comes first; extensions are not approved.",
      "Requires creating a Cloudflare account with a valid payment method on file.",
      "Credits are non-transferable, nonrefundable, and non-redeemable for cash; applicant is responsible for any applicable taxes.",
      "Automatic billing warning: Any overages (including exceeding the $10,000 R2 cap or using excluded services) and any continued usage after credit expiration will be automatically billed to the payment method on file unless domains are downgraded to the Free plan or moved to a prepaid contract.",
    ],
    eligibility: {
      maxCompanyAgeYears: 10,
      requiresExactIncorporationDateAtBoundary: true,
      maxFundingRaisedUsd: 5000000,
      strictMaxFundingRaised: true,
      allowedStages: ["BOOTSTRAPPED", "PRE_SEED", "SEED", "SERIES_A", "SERIES_B"],
      requiresWebsite: true,
      requiresPartnerAffiliation: true,
      requiresFundingWithinMonths: 12,
      requiresFirstTimeRedemption: true,
      requiresTechnologyProduct: true,
      requiresForProfitBusiness: true,
      requiresDomainMatchedBusinessEmail: true,
      requiresSocialPresence: true,
      disallowsExistingEnterpriseCustomer: true,
    },
    overview:
      "Up to $100,000 in Cloudflare credits for 1 year for startups with under $5M raised that are funded by an affiliated Cloudflare partner, plus case-dependent account manager access and technical sessions. Covers Workers, Durable Objects, Workflows, Workers KV, D1, Queues, Vectorize, R2 (capped at $10,000), Pages, Images, Stream, Cache Reserve, and Argo Smart Routing, plus 3 Enterprise domains. Excludes Workers AI (effective Dec 1 for incoming startups), AI Gateway, Registrar, and Premium Network Services.",
    sampleQuestions: [
      {
        id: "architecture",
        question: "How will your team scale on Cloudflare's developer platform and edge network?",
        guideline: "Detail your serverless Workers, D1/KV/Queues data pipelines, R2 storage usage (within the $10k cap), and security setup.",
      },
      {
        id: "traction",
        question: "Provide your affiliated partner details and most recent funding round information.",
        guideline: "Confirm affiliated partner backing, total funding under $5M raised within the last 12 months, and technology product traction.",
      },
    ],
  },

  // 12. Cloudflare for Startups — Tier 1 ($350k)
  {
    id: "cloudflare-startups-tier-1",
    name: "Cloudflare for Startups (Tier 1: Partner-Funded $5M+)",
    provider: "Cloudflare",
    category: "CLOUD",
    maxCreditValueUsd: 350000,
    creditTermMonths: 12,
    programUrl: "https://www.cloudflare.com/startups/",
    badge: "Up to $350k Cloud & Edge Credits",
    tierName: "Tier 1",
    exclusiveGroupId: "cloudflare-for-startups",
    serviceCaps: [
      "R2 Object Storage: covered up to a $10,000 credit cap (overages are automatically billed).",
    ],
    excludedServices: [
      "Workers AI: Effective Dec 1 and for all incoming startups, Workers AI is not covered by credits (for existing startups until Dec 1: covered up to $2,500 for Tier 3, $10,000 for Tier 2, and $50,000 for Tier 1).",
      "AI Gateway: Temporarily not covered by credits.",
      "Registrar Services: Domain registration and renewal fees are excluded and must be paid in full using the payment method on file.",
      "Enterprise Feature Add-Ons: Excluded by default (must request manual access via startups@cloudflare.com or support ticket).",
      "Premium Network Services: Magic Transit, Enterprise Spectrum, Dedicated IPs, and China Network are excluded and require a dedicated contracted plan.",
    ],
    termsAndBillingNotes: [
      "Credits are valid for 1 year (12 months) or until fully consumed, whichever comes first; extensions are not approved.",
      "Requires creating a Cloudflare account with a valid payment method on file.",
      "Credits are non-transferable, nonrefundable, and non-redeemable for cash; applicant is responsible for any applicable taxes.",
      "Automatic billing warning: Any overages (including exceeding the $10,000 R2 cap or using excluded services) and any continued usage after credit expiration will be automatically billed to the payment method on file unless domains are downgraded to the Free plan or moved to a prepaid contract.",
    ],
    eligibility: {
      maxCompanyAgeYears: 10,
      requiresExactIncorporationDateAtBoundary: true,
      minFundingRaisedUsd: 5000000,
      allowedStages: ["PRE_SEED", "SEED", "SERIES_A", "SERIES_B"],
      requiresWebsite: true,
      requiresPartnerAffiliation: true,
      requiresFundingWithinMonths: 12,
      requiresFirstTimeRedemption: true,
      requiresTechnologyProduct: true,
      requiresForProfitBusiness: true,
      requiresDomainMatchedBusinessEmail: true,
      requiresSocialPresence: true,
      disallowsExistingEnterpriseCustomer: true,
    },
    overview:
      "Up to $350,000 in Cloudflare credits for 1 year for startups with $5M+ raised (up to Series B) funded by an affiliated Cloudflare partner, including an account manager, priority technical support, and bi-weekly Solutions Architect office hours. Covers Workers, Durable Objects, Workflows, Workers KV, D1, Queues, Vectorize, R2 (capped at $10,000), Pages, Images, Stream, Cache Reserve, and Argo Smart Routing, plus 3 Enterprise domains. Excludes Workers AI (effective Dec 1 for incoming startups), AI Gateway, Registrar, and Premium Network Services.",
    sampleQuestions: [
      {
        id: "architecture",
        question: "Describe your global production architecture and how Cloudflare will support your scaling roadmap.",
        guideline: "Outline multi-region Workers compute, Durable Objects, D1/Vectorize workloads, R2 usage (noting the $10k cap), and enterprise security needs.",
      },
      {
        id: "scalability",
        question: "Provide your affiliated partner backing, Series A/B funding details ($5M+ within 12 months), and growth projections.",
        guideline: "Include affiliated partner details, recent round date within the last 12 months, and key engineering milestones.",
      },
    ],
  },
];
