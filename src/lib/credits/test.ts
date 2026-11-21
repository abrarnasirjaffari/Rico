import { CreditMatcherEngine, creditMatcherEngine } from "./credit-matcher";
import { CreditProgram, FounderProfile } from "./types";

async function runCreditsTests() {
  console.log("==================================================");
  console.log("⚡ Testing 2.9 Startup Credit & Grant Matcher Engine");
  console.log("==================================================");

  // [Test 1] Seed AI Startup Profile Matching
  console.log("\n[Test 1] Testing Early-Stage AI Startup Profile Matching...");
  const aiStartup: FounderProfile = {
    name: "Alex Mercer",
    companyName: "Rico AI",
    websiteUrl: "https://rico.ai",
    foundedYear: 2025,
    fundingStage: "SEED",
    totalFundingRaisedUsd: 500000,
    monthlyBurnRateUsd: 12000,
    techStack: ["Next.js", "TypeScript", "PostgreSQL", "DeepSeek", "Gemini", "AWS"],
    productCategory: "AI Agentic Commerce",
    tagline: "Autonomous financial agent for businesses",
    description: "Multi-agent autonomous financial platform with verified budget ceilings and digital receipts.",
  };

  const report1 = await creditMatcherEngine.matchProfile(aiStartup, 2026);
  console.log("   Company:", report1.profile.companyName);
  console.log("   Eligible Programs:", `${report1.totalEligiblePrograms} / ${report1.topMatches.length}`);
  console.log("   Total Potential Credits:", `$${report1.totalPotentialCreditsUsd.toLocaleString()}`);
  console.log("   Runway Extension:", `${report1.runwayExtensionMonths} months`);
  console.log("   Dilution Saved:", `${report1.dilutionSavedPercent}% equity preserved`);
  console.log("   Top 3 Matches:", report1.topMatches.slice(0, 3).map((m) => `${m.program.name} ($${m.estimatedValueUsd.toLocaleString()})`));

  if (
    report1.totalEligiblePrograms < 5 ||
    report1.totalPotentialCreditsUsd < 100000 ||
    report1.runwayExtensionMonths <= 0
  ) {
    throw new Error("Test 1 Failed: Expected early-stage AI startup to match at least 5 programs and $100k+ in credits!");
  }
  console.log("✅ Test 1 Passed: Early-stage startup matched premier credits ($100k+) and extended runway.");

  // [Test 2] Student Founder Profile Matching
  console.log("\n[Test 2] Testing Student Founder Matching (.edu email verification)...");
  const studentProfile: FounderProfile = {
    name: "Maya Lin",
    companyName: "StudySprint",
    websiteUrl: "https://studysprint.app",
    foundedYear: 2026,
    fundingStage: "BOOTSTRAPPED",
    totalFundingRaisedUsd: 0,
    monthlyBurnRateUsd: 500,
    techStack: ["React", "Python", "FastAPI"],
    productCategory: "EdTech",
    tagline: "AI study session coordinator",
    description: "App helping university students organize group study sessions.",
    isStudentFounder: true,
    universityName: "Stanford University",
    studentEmail: "mlin@stanford.edu",
  };

  const studentReport = await creditMatcherEngine.matchProfile(studentProfile, 2026);
  const studentPack = studentReport.topMatches.find((m) => m.program.id === "github-student-pack");

  console.log("   Student Eligible Programs:", studentReport.totalEligiblePrograms);
  console.log("   GitHub Student Pack Matched:", !!studentPack?.isEligible);
  console.log("   Student Dev Suite Value:", `$${studentPack?.estimatedValueUsd.toLocaleString()}`);

  if (!studentPack || !studentPack.isEligible) {
    throw new Error("Test 2 Failed: Student founder with .edu email must be eligible for GitHub Student Developer Pack!");
  }
  console.log("✅ Test 2 Passed: Student founder successfully matched GitHub Student Developer Pack & education grants.");

  // [Test 3] Disqualification & Criteria Validation
  console.log("\n[Test 3] Testing Disqualification Logic (Over-Funded & Aged Startup)...");
  const matureCompany: FounderProfile = {
    name: "Enterprise Founder",
    companyName: "Legacy SaaS Corp",
    websiteUrl: "https://legacysaas.com",
    foundedYear: 2018, // 8 years old!
    fundingStage: "SERIES_A",
    totalFundingRaisedUsd: 25000000, // $25M raised (exceeds PostHog $5M cap and AWS $10M cap)
    monthlyBurnRateUsd: 150000,
    techStack: ["Java", "Oracle"],
    productCategory: "Legacy ERP",
    tagline: "Enterprise database connectors",
    description: "Mature ERP migration systems.",
  };

  const matureReport = await creditMatcherEngine.matchProfile(matureCompany, 2026);
  const posthogMatch = matureReport.topMatches.find((m) => m.program.id === "posthog-startups");

  console.log("   Mature Company Eligible Programs:", matureReport.totalEligiblePrograms);
  console.log("   PostHog Eligible:", posthogMatch?.isEligible);
  console.log("   PostHog Disqualification Reasons:", posthogMatch?.disqualificationReasons);

  if (posthogMatch?.isEligible) {
    throw new Error("Test 3 Failed: Mature startup with $25M funding should be disqualified from PostHog startup program!");
  }
  console.log("✅ Test 3 Passed: Ineligible startup correctly disqualified with clear explanation.");

  // [Test 4] Application Pitch & Essay Drafter
  console.log("\n[Test 4] Testing Application Pitch & Essay Drafter...");
  const draft = await creditMatcherEngine.draftPitch(aiStartup, "posthog-startups");

  console.log("   Program Name:", draft.programName);
  console.log("   One-Liner:", draft.oneLinerPitch);
  console.log("   Readiness Score:", `${draft.readinessScore}%`);
  console.log("   Sample Answer [use_case]:", draft.answers["use_case"]);

  if (!draft.answers["use_case"] || !draft.oneLinerPitch || draft.readinessScore < 90) {
    throw new Error("Test 4 Failed: Expected generated pitch answers and high readiness score!");
  }
  console.log("✅ Test 4 Passed: Tailored pitch application drafted with architectural details.");

  // [Test 5] Runway Extension & Dilution Equivalent Calculation
  console.log("\n[Test 5] Testing Dilution & Runway Math...");
  // $100,000 in credits at $10,000/mo burn = exactly 10 months runway added!
  const mathProfile: FounderProfile = {
    name: "Math Test",
    companyName: "Math Test Corp",
    websiteUrl: "https://mathtest.io",
    foundedYear: 2025,
    fundingStage: "BOOTSTRAPPED",
    totalFundingRaisedUsd: 0,
    monthlyBurnRateUsd: 10000,
    techStack: ["Next.js"],
    productCategory: "Fintech",
    tagline: "Testing math",
    description: "Testing math.",
  };

  const mathReport = await creditMatcherEngine.matchProfile(mathProfile, 2026);
  console.log(`   Monthly Burn: $10,000/mo | Credits: $${mathReport.totalPotentialCreditsUsd.toLocaleString()}`);
  console.log(`   Calculated Runway Extension: ${mathReport.runwayExtensionMonths} months`);
  console.log(`   Dilution Preserved: ${mathReport.dilutionSavedPercent}%`);

  if (mathReport.runwayExtensionMonths <= 0 || mathReport.dilutionSavedPercent <= 0) {
    throw new Error("Test 5 Failed: Runway and dilution calculation must be positive non-zero!");
  }
  console.log("✅ Test 5 Passed: Runway months and equity dilution math verified.");

  // [Test 6] Parallel High-Throughput Batch Matching via Worker Pool
  console.log("\n[Test 6] Testing Parallel Batch Matching (3 Profiles via BatchQueueEngine)...");
  const batchProfiles = [
    aiStartup,
    studentProfile,
    {
      name: "Bio Founder",
      companyName: "BioGen",
      websiteUrl: "https://biogen.health",
      foundedYear: 2025,
      fundingStage: "PRE_SEED" as const,
      totalFundingRaisedUsd: 100000,
      monthlyBurnRateUsd: 8000,
      techStack: ["Python", "TensorFlow", "Next.js"],
      productCategory: "BioTech AI",
      tagline: "Genomics sequencing acceleration",
      description: "AI platform for clinical gene analysis.",
    },
  ];

  const batchResults = await creditMatcherEngine.batchMatch(batchProfiles, { priority: "HIGH" });
  console.log("   Batch Profiles Processed:", batchResults.length);
  console.log("   Companies Matched:", batchResults.map((r) => `${r.profile.companyName} ($${r.totalPotentialCreditsUsd.toLocaleString()})`));

  if (batchResults.length !== 3) {
    throw new Error("Test 6 Failed: Batch matching failed to process all 3 profiles!");
  }
  console.log("✅ Test 6 Passed: High-throughput batch credit matching verified across worker pool.");

  // [Test 7] Cloudflare for Startups — Tiers, Boundaries, Verification, & Financial Safety
  console.log("\n[Test 7] Verifying Cloudflare for Startups Tiers, Eligibility Rules, & Financial Safety...");
  const catalog = creditMatcherEngine.getCatalog();
  const catalogIds = catalog.map((p) => p.id);
  if (new Set(catalogIds).size !== catalogIds.length) {
    throw new Error("Test 7a Failed: Duplicate program IDs detected in catalog!");
  }

  // [Test 7a] Catalog Registration & Official Offer Metadata
  const cfTier3 = catalog.find((p) => p.id === "cloudflare-startups-tier-3");
  const cfTier2 = catalog.find((p) => p.id === "cloudflare-startups-tier-2");
  const cfTier1 = catalog.find((p) => p.id === "cloudflare-startups-tier-1");

  if (
    !cfTier3 ||
    !cfTier2 ||
    !cfTier1 ||
    cfTier3.maxCreditValueUsd !== 10000 ||
    cfTier2.maxCreditValueUsd !== 100000 ||
    cfTier1.maxCreditValueUsd !== 350000 ||
    cfTier3.creditTermMonths !== 12 ||
    cfTier2.creditTermMonths !== 12 ||
    cfTier1.creditTermMonths !== 12 ||
    cfTier3.programUrl !== "https://www.cloudflare.com/startups/" ||
    cfTier2.programUrl !== "https://www.cloudflare.com/startups/" ||
    cfTier1.programUrl !== "https://www.cloudflare.com/startups/" ||
    cfTier3.exclusiveGroupId !== "cloudflare-for-startups" ||
    cfTier2.exclusiveGroupId !== "cloudflare-for-startups" ||
    cfTier1.exclusiveGroupId !== "cloudflare-for-startups" ||
    cfTier3.eligibility.maxFundingRaisedUsd !== 1000000 ||
    cfTier3.eligibility.strictMaxFundingRaised !== true ||
    cfTier3.eligibility.requiresBootstrappedOrSelfFunded !== true ||
    cfTier2.eligibility.maxFundingRaisedUsd !== 5000000 ||
    cfTier2.eligibility.strictMaxFundingRaised !== true ||
    cfTier2.eligibility.requiresPartnerAffiliation !== true ||
    cfTier1.eligibility.minFundingRaisedUsd !== 5000000 ||
    cfTier1.eligibility.requiresPartnerAffiliation !== true
  ) {
    throw new Error("Test 7a Failed: Cloudflare tiers are missing or do not match official offer specifications!");
  }

  for (const cfTier of [cfTier3, cfTier2, cfTier1]) {
    const hasR2Cap = cfTier.serviceCaps?.some((s) => s.includes("R2") && s.includes("$10,000"));
    const hasWorkersAiDec1Exclusion = cfTier.excludedServices?.some(
      (s) => s.includes("Workers AI") && s.includes("Dec 1") && s.includes("not covered")
    );
    const hasAiGatewayExclusion = cfTier.excludedServices?.some((s) => s.includes("AI Gateway"));
    const hasRegistrarExclusion = cfTier.excludedServices?.some((s) => s.includes("Registrar"));
    const hasEnterpriseAddOnsExclusion = cfTier.excludedServices?.some((s) =>
      s.includes("Enterprise Feature Add-Ons")
    );
    const hasPremiumNetworkExclusion = cfTier.excludedServices?.some((s) =>
      s.includes("Magic Transit")
    );
    const hasAutoBillingWarning = cfTier.termsAndBillingNotes?.some(
      (n) => n.toLowerCase().includes("automatically billed") && n.toLowerCase().includes("payment method")
    );

    if (
      !hasR2Cap ||
      !hasWorkersAiDec1Exclusion ||
      !hasAiGatewayExclusion ||
      !hasRegistrarExclusion ||
      !hasEnterpriseAddOnsExclusion ||
      !hasPremiumNetworkExclusion ||
      !hasAutoBillingWarning
    ) {
      throw new Error(
        `Test 7a Failed: Cloudflare tier '${cfTier.id}' is missing required caps, Dec 1 Workers AI exclusion, or billing warnings!`
      );
    }
  }

  // Base confirmed universal Cloudflare profile helper (referenceDate: "2026-11-21")
  const baseVerifiedCloudflareProfile: FounderProfile = {
    name: "Elena Vance",
    companyName: "EdgePulse",
    websiteUrl: "https://www.rico.ai",
    foundedYear: 2024,
    incorporatedDate: "2024-03-15",
    fundingStage: "PRE_SEED",
    totalFundingRaisedUsd: 500000,
    lastFundingDate: "2026-06-01",
    monthlyBurnRateUsd: 10000,
    techStack: ["Cloudflare", "Workers", "TypeScript", "Next.js"],
    productCategory: "Cloud Edge Security",
    tagline: "Zero-trust edge telemetry",
    description: "Serverless edge observability built on Cloudflare Workers.",
    isTechnologyProduct: true,
    isForProfitBusiness: true,
    isExistingEnterpriseCustomer: false,
    businessEmail: "founder@rico.ai",
    hasPublicSocialPresence: true,
    socialProfileUrls: ["https://github.com/rico-ai", "https://linkedin.com/company/rico-ai"],
    hasPreviouslyRedeemedProgramIds: [],
  };

  // [Test 7b] Separation of Eligibility vs. Advertised Max vs. Actual Awarded Credits (null)
  // In report1 (basic aiStartup profile without Cloudflare verification fields):
  // Cloudflare tiers must NEVER be VERIFIED and must NEVER add to totalPotentialCreditsUsd or totalEligiblePrograms!
  const report1CfMatches = report1.topMatches.filter(
    (m) => m.program.exclusiveGroupId === "cloudflare-for-startups"
  );
  if (
    report1CfMatches.length !== 3 ||
    report1CfMatches.some((m) => m.verificationStatus === "VERIFIED" || m.isEligible) ||
    report1CfMatches.some((m) => m.estimatedValueUsd !== 0 || m.awardedValueUsd !== null) ||
    report1.totalAwardedCreditsUsd !== null
  ) {
    throw new Error(
      "Test 7b Failed: Unverified basic profile must never mark Cloudflare tiers as VERIFIED or report non-zero estimatedValueUsd / awardedValueUsd!"
    );
  }

  // [Test 7c] Tier 3 Bootstrapped/Self-Funded Requirement & Independent Tier 3 vs. Tier 2 Evaluation
  // 7c-1: $500k raised, universal requirements confirmed, but isBootstrappedOrSelfFunded is undefined and isPartnerAffiliated is undefined
  const unconfirmedSourceReport = await creditMatcherEngine.matchProfile(
    {
      ...baseVerifiedCloudflareProfile,
      isBootstrappedOrSelfFunded: undefined,
      isPartnerAffiliated: undefined,
    },
    2026,
    "2026-11-21"
  );
  const t3Unconfirmed = unconfirmedSourceReport.topMatches.find(
    (m) => m.program.id === "cloudflare-startups-tier-3"
  );
  const t2Unconfirmed = unconfirmedSourceReport.topMatches.find(
    (m) => m.program.id === "cloudflare-startups-tier-2"
  );
  const t1Unconfirmed = unconfirmedSourceReport.topMatches.find(
    (m) => m.program.id === "cloudflare-startups-tier-1"
  );
  if (
    !t3Unconfirmed ||
    t3Unconfirmed.verificationStatus !== "PRELIMINARY" ||
    t3Unconfirmed.isEligible !== false ||
    t3Unconfirmed.isSelectedForAggregation !== true ||
    t3Unconfirmed.estimatedValueUsd !== 0 ||
    t3Unconfirmed.potentialPreliminaryValueUsd !== 10000 ||
    !t2Unconfirmed ||
    t2Unconfirmed.verificationStatus !== "PRELIMINARY" ||
    t2Unconfirmed.isSelectedForAggregation !== false ||
    t2Unconfirmed.potentialPreliminaryValueUsd !== 0 ||
    !t1Unconfirmed ||
    t1Unconfirmed.verificationStatus !== "INELIGIBLE"
  ) {
    throw new Error(
      "Test 7c-1 Failed: Tier 3 without confirmed isBootstrappedOrSelfFunded must remain PRELIMINARY (and be selected as conservative preliminary tier over Tier 2)!"
    );
  }

  // 7c-2: $500k raised, isBootstrappedOrSelfFunded: true, lastFundingDate within 12 months, isPartnerAffiliated: undefined
  // Unknown Tier 2 partner affiliation must NOT prevent Tier 3 from being VERIFIED!
  const tier3VerifiedReport = await creditMatcherEngine.matchProfile(
    {
      ...baseVerifiedCloudflareProfile,
      isBootstrappedOrSelfFunded: true,
      isPartnerAffiliated: undefined,
    },
    2026,
    "2026-11-21"
  );
  const t3Verified = tier3VerifiedReport.topMatches.find(
    (m) => m.program.id === "cloudflare-startups-tier-3"
  );
  const t2PendingPartner = tier3VerifiedReport.topMatches.find(
    (m) => m.program.id === "cloudflare-startups-tier-2"
  );
  if (
    !t3Verified ||
    t3Verified.verificationStatus !== "VERIFIED" ||
    t3Verified.isEligible !== true ||
    t3Verified.isSelectedForAggregation !== true ||
    t3Verified.maxAdvertisedValueUsd !== 10000 ||
    t3Verified.estimatedValueUsd !== 10000 ||
    t3Verified.awardedValueUsd !== null ||
    !t2PendingPartner ||
    t2PendingPartner.verificationStatus !== "PRELIMINARY" ||
    t2PendingPartner.isSelectedForAggregation !== false ||
    t2PendingPartner.supersededByProgramId !== "cloudflare-startups-tier-3" ||
    t2PendingPartner.estimatedValueUsd !== 0 ||
    t2PendingPartner.potentialPreliminaryValueUsd !== 0
  ) {
    throw new Error(
      "Test 7c-2 Failed: Tier 3 with confirmed bootstrapped/self-funded status must be VERIFIED even when Tier 2 partner affiliation is unknown!"
    );
  }

  // 7c-3: Explicitly isBootstrappedOrSelfFunded: false -> Tier 3 is INELIGIBLE
  const notSelfFundedReport = await creditMatcherEngine.matchProfile(
    {
      ...baseVerifiedCloudflareProfile,
      isBootstrappedOrSelfFunded: false,
      isPartnerAffiliated: false,
    },
    2026,
    "2026-11-21"
  );
  const t3NotSelfFunded = notSelfFundedReport.topMatches.find(
    (m) => m.program.id === "cloudflare-startups-tier-3"
  );
  if (!t3NotSelfFunded || t3NotSelfFunded.verificationStatus !== "INELIGIBLE") {
    throw new Error("Test 7c-3 Failed: Tier 3 must be INELIGIBLE when isBootstrappedOrSelfFunded is false!");
  }

  // [Test 7d] Verified Lower Tier Superseded by Verified Higher Tier (Preserving Independent Eligibility)
  const bothVerifiedReport = await creditMatcherEngine.matchProfile(
    {
      ...baseVerifiedCloudflareProfile,
      totalFundingRaisedUsd: 500000,
      isBootstrappedOrSelfFunded: true,
      isPartnerAffiliated: true,
    },
    2026,
    "2026-11-21"
  );
  const t2Selected = bothVerifiedReport.topMatches.find(
    (m) => m.program.id === "cloudflare-startups-tier-2"
  );
  const t3Superseded = bothVerifiedReport.topMatches.find(
    (m) => m.program.id === "cloudflare-startups-tier-3"
  );
  if (
    !t2Selected ||
    t2Selected.verificationStatus !== "VERIFIED" ||
    t2Selected.isEligible !== true ||
    t2Selected.isSelectedForAggregation !== true ||
    t2Selected.estimatedValueUsd !== 100000 ||
    t2Selected.awardedValueUsd !== null ||
    !t3Superseded ||
    t3Superseded.verificationStatus !== "VERIFIED" ||
    t3Superseded.isEligible !== true ||
    t3Superseded.isSelectedForAggregation !== false ||
    t3Superseded.supersededByProgramId !== "cloudflare-startups-tier-2" ||
    t3Superseded.estimatedValueUsd !== 0 ||
    t3Superseded.maxAdvertisedValueUsd !== 10000
  ) {
    throw new Error(
      "Test 7d Failed: Superseded lower tier must preserve verificationStatus='VERIFIED' and isEligible=true while setting isSelectedForAggregation=false and estimatedValueUsd=0!"
    );
  }

  // [Test 7e] $2M Raised / Unknown Partner Affiliation Scenario (Case B Tier Selection)
  const twoMillionUnknownPartnerReport = await creditMatcherEngine.matchProfile(
    {
      ...baseVerifiedCloudflareProfile,
      fundingStage: "SEED",
      totalFundingRaisedUsd: 2000000,
      isPartnerAffiliated: undefined,
    },
    2026,
    "2026-11-21"
  );
  const t3At2M = twoMillionUnknownPartnerReport.topMatches.find(
    (m) => m.program.id === "cloudflare-startups-tier-3"
  );
  const t2At2M = twoMillionUnknownPartnerReport.topMatches.find(
    (m) => m.program.id === "cloudflare-startups-tier-2"
  );
  const t1At2M = twoMillionUnknownPartnerReport.topMatches.find(
    (m) => m.program.id === "cloudflare-startups-tier-1"
  );
  if (
    !t3At2M ||
    t3At2M.verificationStatus !== "INELIGIBLE" ||
    !t1At2M ||
    t1At2M.verificationStatus !== "INELIGIBLE" ||
    !t2At2M ||
    t2At2M.verificationStatus !== "PRELIMINARY" ||
    t2At2M.isSelectedForAggregation !== true ||
    t2At2M.potentialPreliminaryValueUsd !== 100000 ||
    t2At2M.estimatedValueUsd !== 0
  ) {
    throw new Error(
      "Test 7e Failed: At $2M raised with unknown partner affiliation, Tier 3 and Tier 1 must be INELIGIBLE and Tier 2 ($100k) must be selected as the active PRELIMINARY tier!"
    );
  }

  // [Test 7f] Funding Amount Boundaries, Zero-Raised Tier 3 Ambiguity, & Invalid Funding Values
  // 1) $0 raised with isBootstrappedOrSelfFunded: true -> must remain PRELIMINARY (never VERIFIED due to 12-month funding recency ambiguity)
  const zeroRaisedNoDateReport = await creditMatcherEngine.matchProfile(
    {
      ...baseVerifiedCloudflareProfile,
      fundingStage: "BOOTSTRAPPED",
      totalFundingRaisedUsd: 0,
      lastFundingDate: undefined,
      isBootstrappedOrSelfFunded: true,
    },
    2026,
    "2026-11-21"
  );
  const t3ZeroNoDate = zeroRaisedNoDateReport.topMatches.find(
    (m) => m.program.id === "cloudflare-startups-tier-3"
  );
  const t2ZeroNoDate = zeroRaisedNoDateReport.topMatches.find(
    (m) => m.program.id === "cloudflare-startups-tier-2"
  );
  if (
    !t3ZeroNoDate ||
    t3ZeroNoDate.verificationStatus !== "PRELIMINARY" ||
    t3ZeroNoDate.isEligible !== false ||
    !t2ZeroNoDate ||
    t2ZeroNoDate.verificationStatus !== "INELIGIBLE"
  ) {
    throw new Error(
      "Test 7f-1 Failed: $0-raised startup must remain PRELIMINARY for Tier 3 (and INELIGIBLE for Tier 2) until Cloudflare's 12-month rule for $0-raised startups is verified!"
    );
  }

  // Even if lastFundingDate is provided alongside $0 raised (contradictory), Tier 3 must remain PRELIMINARY
  const zeroRaisedWithDateReport = await creditMatcherEngine.matchProfile(
    {
      ...baseVerifiedCloudflareProfile,
      fundingStage: "BOOTSTRAPPED",
      totalFundingRaisedUsd: 0,
      lastFundingDate: "2026-05-01",
      isBootstrappedOrSelfFunded: true,
    },
    2026,
    "2026-11-21"
  );
  const t3ZeroWithDate = zeroRaisedWithDateReport.topMatches.find(
    (m) => m.program.id === "cloudflare-startups-tier-3"
  );
  if (!t3ZeroWithDate || t3ZeroWithDate.verificationStatus !== "PRELIMINARY") {
    throw new Error(
      "Test 7f-2 Failed: Contradictory $0 raised with lastFundingDate must remain PRELIMINARY and never become VERIFIED!"
    );
  }

  // 2) Tier 3 upper boundary: $999,999.99 (< $1M) -> VERIFIED; $1,000,000 -> INELIGIBLE for Tier 3
  const under1MReport = await creditMatcherEngine.matchProfile(
    {
      ...baseVerifiedCloudflareProfile,
      totalFundingRaisedUsd: 999999.99,
      isBootstrappedOrSelfFunded: true,
      isPartnerAffiliated: false,
    },
    2026,
    "2026-11-21"
  );
  const t3Under1M = under1MReport.topMatches.find(
    (m) => m.program.id === "cloudflare-startups-tier-3"
  );
  if (!t3Under1M || t3Under1M.verificationStatus !== "VERIFIED") {
    throw new Error("Test 7f-3 Failed: $999,999.99 must be VERIFIED for Tier 3!");
  }

  const exact1MReport = await creditMatcherEngine.matchProfile(
    {
      ...baseVerifiedCloudflareProfile,
      totalFundingRaisedUsd: 1000000,
      isBootstrappedOrSelfFunded: true,
      isPartnerAffiliated: true,
    },
    2026,
    "2026-11-21"
  );
  const t3Exact1M = exact1MReport.topMatches.find(
    (m) => m.program.id === "cloudflare-startups-tier-3"
  );
  const t2Exact1M = exact1MReport.topMatches.find(
    (m) => m.program.id === "cloudflare-startups-tier-2"
  );
  if (
    !t3Exact1M ||
    t3Exact1M.verificationStatus !== "INELIGIBLE" ||
    !t2Exact1M ||
    t2Exact1M.verificationStatus !== "VERIFIED"
  ) {
    throw new Error(
      "Test 7f-4 Failed: Exactly $1,000,000 must be INELIGIBLE for Tier 3 (<$1M) and VERIFIED for partner-affiliated Tier 2 (<$5M)!"
    );
  }

  // 3) Tier 2 / Tier 1 boundary at $5,000,000: $4,999,999.99 -> Tier 2 VERIFIED, Tier 1 INELIGIBLE; $5,000,000 -> Tier 2 INELIGIBLE, Tier 1 VERIFIED
  const under5MReport = await creditMatcherEngine.matchProfile(
    {
      ...baseVerifiedCloudflareProfile,
      fundingStage: "SERIES_A",
      totalFundingRaisedUsd: 4999999.99,
      isPartnerAffiliated: true,
    },
    2026,
    "2026-11-21"
  );
  const t2Under5M = under5MReport.topMatches.find(
    (m) => m.program.id === "cloudflare-startups-tier-2"
  );
  const t1Under5M = under5MReport.topMatches.find(
    (m) => m.program.id === "cloudflare-startups-tier-1"
  );
  if (
    !t2Under5M ||
    t2Under5M.verificationStatus !== "VERIFIED" ||
    !t1Under5M ||
    t1Under5M.verificationStatus !== "INELIGIBLE"
  ) {
    throw new Error("Test 7f-5 Failed: $4,999,999.99 must be VERIFIED for Tier 2 and INELIGIBLE for Tier 1!");
  }

  const exact5MReport = await creditMatcherEngine.matchProfile(
    {
      ...baseVerifiedCloudflareProfile,
      fundingStage: "SERIES_B",
      totalFundingRaisedUsd: 5000000,
      isPartnerAffiliated: true,
    },
    2026,
    "2026-11-21"
  );
  const t2Exact5M = exact5MReport.topMatches.find(
    (m) => m.program.id === "cloudflare-startups-tier-2"
  );
  const t1Exact5M = exact5MReport.topMatches.find(
    (m) => m.program.id === "cloudflare-startups-tier-1"
  );
  if (
    !t2Exact5M ||
    t2Exact5M.verificationStatus !== "INELIGIBLE" ||
    !t1Exact5M ||
    t1Exact5M.verificationStatus !== "VERIFIED" ||
    t1Exact5M.estimatedValueUsd !== 350000 ||
    t1Exact5M.awardedValueUsd !== null
  ) {
    throw new Error("Test 7f-6 Failed: Exactly $5,000,000 (Series B) must be INELIGIBLE for Tier 2 and VERIFIED for Tier 1 ($350k)!");
  }

  // 4) Missing funding (undefined) -> PRELIMINARY (never treated as $0)
  const missingFundingReport = await creditMatcherEngine.matchProfile(
    {
      ...baseVerifiedCloudflareProfile,
      totalFundingRaisedUsd: undefined,
      isBootstrappedOrSelfFunded: true,
      isPartnerAffiliated: true,
    },
    2026,
    "2026-11-21"
  );
  for (const tierId of [
    "cloudflare-startups-tier-3",
    "cloudflare-startups-tier-2",
    "cloudflare-startups-tier-1",
  ]) {
    const match = missingFundingReport.topMatches.find((m) => m.program.id === tierId);
    if (
      !match ||
      match.verificationStatus !== "PRELIMINARY" ||
      match.isEligible !== false ||
      !match.pendingVerificationRequirements.some((r) => r.toLowerCase().includes("funding"))
    ) {
      throw new Error(`Test 7f-7 Failed: Missing totalFundingRaisedUsd must be PRELIMINARY for ${tierId}!`);
    }
  }

  // 5) Invalid funding values (-1, -50000, NaN, Infinity, -Infinity) -> INELIGIBLE
  for (const invalidVal of [-1, -50000, NaN, Infinity, -Infinity]) {
    const invalidReport = await creditMatcherEngine.matchProfile(
      {
        ...baseVerifiedCloudflareProfile,
        totalFundingRaisedUsd: invalidVal,
        isBootstrappedOrSelfFunded: true,
        isPartnerAffiliated: true,
      },
      2026,
      "2026-11-21"
    );
    for (const tierId of [
      "cloudflare-startups-tier-3",
      "cloudflare-startups-tier-2",
      "cloudflare-startups-tier-1",
    ]) {
      const match = invalidReport.topMatches.find((m) => m.program.id === tierId);
      if (!match || match.verificationStatus !== "INELIGIBLE" || match.isEligible) {
        throw new Error(
          `Test 7f-8 Failed: Invalid totalFundingRaisedUsd (${invalidVal}) must be INELIGIBLE for ${tierId}!`
        );
      }
    }
  }

  // [Test 7g] Company Age & Incorporation Date Boundaries (10-Year Limit, referenceDate = "2026-11-21")
  // Exact 10-year anniversary ("2016-11-21") -> VERIFIED
  const exact10YrIncReport = await creditMatcherEngine.matchProfile(
    {
      ...baseVerifiedCloudflareProfile,
      foundedYear: 2016,
      incorporatedDate: "2016-11-21",
      isBootstrappedOrSelfFunded: true,
    },
    2026,
    "2026-11-21"
  );
  const t3Exact10YrInc = exact10YrIncReport.topMatches.find(
    (m) => m.program.id === "cloudflare-startups-tier-3"
  );
  if (!t3Exact10YrInc || t3Exact10YrInc.verificationStatus !== "VERIFIED") {
    throw new Error("Test 7g-1 Failed: Exact 10-year incorporation date (2016-11-21) must be VERIFIED!");
  }

  // 10 years + 1 day old ("2016-11-20") -> INELIGIBLE
  const over10YrIncReport = await creditMatcherEngine.matchProfile(
    {
      ...baseVerifiedCloudflareProfile,
      foundedYear: 2016,
      incorporatedDate: "2016-11-20",
      isBootstrappedOrSelfFunded: true,
    },
    2026,
    "2026-11-21"
  );
  const t3Over10YrInc = over10YrIncReport.topMatches.find(
    (m) => m.program.id === "cloudflare-startups-tier-3"
  );
  if (!t3Over10YrInc || t3Over10YrInc.verificationStatus !== "INELIGIBLE") {
    throw new Error("Test 7g-2 Failed: Incorporation date 2016-11-20 (>10 years before 2026-11-21) must be INELIGIBLE!");
  }

  // Year-only borderline 10th year (foundedYear: 2016, incorporatedDate: undefined) -> PRELIMINARY
  const borderlineYearOnlyReport = await creditMatcherEngine.matchProfile(
    {
      ...baseVerifiedCloudflareProfile,
      foundedYear: 2016,
      incorporatedDate: undefined,
      isBootstrappedOrSelfFunded: true,
    },
    2026,
    "2026-11-21"
  );
  const t3BorderlineYear = borderlineYearOnlyReport.topMatches.find(
    (m) => m.program.id === "cloudflare-startups-tier-3"
  );
  if (!t3BorderlineYear || t3BorderlineYear.verificationStatus !== "PRELIMINARY") {
    throw new Error(
      "Test 7g-3 Failed: Year-only foundedYear=2016 at 10-year boundary without incorporatedDate must be PRELIMINARY!"
    );
  }

  // Year-only 9 years old (foundedYear: 2017, incorporatedDate: undefined) -> VERIFIED
  const nineYearOnlyReport = await creditMatcherEngine.matchProfile(
    {
      ...baseVerifiedCloudflareProfile,
      foundedYear: 2017,
      incorporatedDate: undefined,
      isBootstrappedOrSelfFunded: true,
    },
    2026,
    "2026-11-21"
  );
  const t3NineYear = nineYearOnlyReport.topMatches.find(
    (m) => m.program.id === "cloudflare-startups-tier-3"
  );
  if (!t3NineYear || t3NineYear.verificationStatus !== "VERIFIED") {
    throw new Error("Test 7g-4 Failed: Year-only foundedYear=2017 (9 yrs old) must be VERIFIED!");
  }

  // Year-only 11 years old (foundedYear: 2015) -> INELIGIBLE
  const elevenYearOnlyReport = await creditMatcherEngine.matchProfile(
    {
      ...baseVerifiedCloudflareProfile,
      foundedYear: 2015,
      incorporatedDate: undefined,
      isBootstrappedOrSelfFunded: true,
    },
    2026,
    "2026-11-21"
  );
  const t3ElevenYear = elevenYearOnlyReport.topMatches.find(
    (m) => m.program.id === "cloudflare-startups-tier-3"
  );
  if (!t3ElevenYear || t3ElevenYear.verificationStatus !== "INELIGIBLE") {
    throw new Error("Test 7g-5 Failed: Year-only foundedYear=2015 (11 yrs old) must be INELIGIBLE!");
  }

  // Missing both foundedYear and incorporatedDate -> PRELIMINARY
  const missingAgeReport = await creditMatcherEngine.matchProfile(
    {
      ...baseVerifiedCloudflareProfile,
      foundedYear: undefined,
      incorporatedDate: undefined,
      isBootstrappedOrSelfFunded: true,
    },
    2026,
    "2026-11-21"
  );
  const t3MissingAge = missingAgeReport.topMatches.find(
    (m) => m.program.id === "cloudflare-startups-tier-3"
  );
  if (!t3MissingAge || t3MissingAge.verificationStatus !== "PRELIMINARY") {
    throw new Error("Test 7g-6 Failed: Missing foundedYear and incorporatedDate must be PRELIMINARY!");
  }

  // Invalid foundedYear / future incorporatedDate -> INELIGIBLE
  for (const badYear of [2028, 0, -2020, NaN]) {
    const badYearReport = await creditMatcherEngine.matchProfile(
      {
        ...baseVerifiedCloudflareProfile,
        foundedYear: badYear,
        incorporatedDate: undefined,
        isBootstrappedOrSelfFunded: true,
      },
      2026,
      "2026-11-21"
    );
    const t3BadYear = badYearReport.topMatches.find(
      (m) => m.program.id === "cloudflare-startups-tier-3"
    );
    if (!t3BadYear || t3BadYear.verificationStatus !== "INELIGIBLE") {
      throw new Error(`Test 7g-7 Failed: Invalid foundedYear (${badYear}) must be INELIGIBLE!`);
    }
  }

  for (const badDate of ["2027-01-01", "2024-02-30", "not-a-date"]) {
    const badDateReport = await creditMatcherEngine.matchProfile(
      {
        ...baseVerifiedCloudflareProfile,
        incorporatedDate: badDate,
        isBootstrappedOrSelfFunded: true,
      },
      2026,
      "2026-11-21"
    );
    const t3BadDate = badDateReport.topMatches.find(
      (m) => m.program.id === "cloudflare-startups-tier-3"
    );
    if (!t3BadDate || t3BadDate.verificationStatus !== "INELIGIBLE") {
      throw new Error(`Test 7g-8 Failed: Invalid incorporatedDate (${badDate}) must be INELIGIBLE!`);
    }
  }

  // [Test 7h] Simplified Conservative Email-Domain Matching & Universal Requirements
  // 1) Subdomain email matching clear 2-label parent website (founder@mail.rico.ai vs https://www.rico.ai) -> VERIFIED
  const subdomainEmailReport = await creditMatcherEngine.matchProfile(
    {
      ...baseVerifiedCloudflareProfile,
      websiteUrl: "https://www.rico.ai",
      businessEmail: "founder@mail.rico.ai",
      isBootstrappedOrSelfFunded: true,
    },
    2026,
    "2026-11-21"
  );
  const t3SubdomainEmail = subdomainEmailReport.topMatches.find(
    (m) => m.program.id === "cloudflare-startups-tier-3"
  );
  if (!t3SubdomainEmail || t3SubdomainEmail.verificationStatus !== "VERIFIED") {
    throw new Error("Test 7h-1 Failed: Subdomain business email founder@mail.rico.ai with https://www.rico.ai must be VERIFIED!");
  }

  // 2) Sibling subdomains (founder@mail.rico.ai vs https://app.rico.ai) -> PRELIMINARY
  const siblingSubdomainReport = await creditMatcherEngine.matchProfile(
    {
      ...baseVerifiedCloudflareProfile,
      websiteUrl: "https://app.rico.ai",
      businessEmail: "founder@mail.rico.ai",
      isBootstrappedOrSelfFunded: true,
    },
    2026,
    "2026-11-21"
  );
  const t3SiblingSubdomain = siblingSubdomainReport.topMatches.find(
    (m) => m.program.id === "cloudflare-startups-tier-3"
  );
  if (!t3SiblingSubdomain || t3SiblingSubdomain.verificationStatus !== "PRELIMINARY") {
    throw new Error(
      "Test 7h-2 Failed: Sibling subdomains (founder@mail.rico.ai vs https://app.rico.ai) must be PRELIMINARY!"
    );
  }

  // 3) Country-code parent/subdomain relationship (founder@mail.company.co.uk vs https://company.co.uk) -> PRELIMINARY
  const ccTldSubdomainReport = await creditMatcherEngine.matchProfile(
    {
      ...baseVerifiedCloudflareProfile,
      websiteUrl: "https://company.co.uk",
      businessEmail: "founder@mail.company.co.uk",
      isBootstrappedOrSelfFunded: true,
    },
    2026,
    "2026-11-21"
  );
  const t3CcTldSubdomain = ccTldSubdomainReport.topMatches.find(
    (m) => m.program.id === "cloudflare-startups-tier-3"
  );
  if (!t3CcTldSubdomain || t3CcTldSubdomain.verificationStatus !== "PRELIMINARY") {
    throw new Error(
      "Test 7h-3 Failed: Country-code subdomain relationship (founder@mail.company.co.uk vs https://company.co.uk) must be PRELIMINARY!"
    );
  }

  // 4) Suffix spoofing (founder@evilrico.ai), mismatched domain (founder@otherdomain.com), and personal email (founder@gmail.com) -> INELIGIBLE
  for (const invalidEmail of [
    "founder@evilrico.ai",
    "founder@otherdomain.com",
    "founder@gmail.com",
    "not-an-email",
    "",
  ]) {
    const badEmailReport = await creditMatcherEngine.matchProfile(
      {
        ...baseVerifiedCloudflareProfile,
        websiteUrl: "https://www.rico.ai",
        businessEmail: invalidEmail,
        isBootstrappedOrSelfFunded: true,
      },
      2026,
      "2026-11-21"
    );
    const t3BadEmail = badEmailReport.topMatches.find(
      (m) => m.program.id === "cloudflare-startups-tier-3"
    );
    if (!t3BadEmail || t3BadEmail.verificationStatus !== "INELIGIBLE") {
      throw new Error(`Test 7h-4 Failed: Invalid/mismatched email '${invalidEmail}' must be INELIGIBLE!`);
    }
  }

  // 5) Universal requirement checks: website, social presence, first-time applicant, tech product, for-profit, non-Enterprise, 12-month funding date
  // Missing website -> PRELIMINARY; invalid website -> INELIGIBLE
  const missingWebsiteReport = await creditMatcherEngine.matchProfile(
    {
      ...baseVerifiedCloudflareProfile,
      websiteUrl: undefined,
      isBootstrappedOrSelfFunded: true,
    },
    2026,
    "2026-11-21"
  );
  if (
    missingWebsiteReport.topMatches.find((m) => m.program.id === "cloudflare-startups-tier-3")
      ?.verificationStatus !== "PRELIMINARY"
  ) {
    throw new Error("Test 7h-5 Failed: undefined websiteUrl must be PRELIMINARY!");
  }

  const invalidWebsiteReport = await creditMatcherEngine.matchProfile(
    {
      ...baseVerifiedCloudflareProfile,
      websiteUrl: "ftp://invalid-site",
      isBootstrappedOrSelfFunded: true,
    },
    2026,
    "2026-11-21"
  );
  if (
    invalidWebsiteReport.topMatches.find((m) => m.program.id === "cloudflare-startups-tier-3")
      ?.verificationStatus !== "INELIGIBLE"
  ) {
    throw new Error("Test 7h-6 Failed: non-http(s) websiteUrl must be INELIGIBLE!");
  }

  // Social presence: false or invalid URL -> INELIGIBLE; undefined -> PRELIMINARY
  const noSocialReport = await creditMatcherEngine.matchProfile(
    {
      ...baseVerifiedCloudflareProfile,
      hasPublicSocialPresence: false,
      socialProfileUrls: undefined,
      isBootstrappedOrSelfFunded: true,
    },
    2026,
    "2026-11-21"
  );
  if (
    noSocialReport.topMatches.find((m) => m.program.id === "cloudflare-startups-tier-3")
      ?.verificationStatus !== "INELIGIBLE"
  ) {
    throw new Error("Test 7h-7 Failed: hasPublicSocialPresence=false must be INELIGIBLE!");
  }

  const invalidSocialUrlReport = await creditMatcherEngine.matchProfile(
    {
      ...baseVerifiedCloudflareProfile,
      hasPublicSocialPresence: undefined,
      socialProfileUrls: ["https://example.com/not-linkedin-or-github"],
      isBootstrappedOrSelfFunded: true,
    },
    2026,
    "2026-11-21"
  );
  if (
    invalidSocialUrlReport.topMatches.find((m) => m.program.id === "cloudflare-startups-tier-3")
      ?.verificationStatus !== "INELIGIBLE"
  ) {
    throw new Error("Test 7h-8 Failed: Unsupported social profile URL must be INELIGIBLE!");
  }

  // Previously approved into ANY Cloudflare tier or group -> INELIGIBLE across all Cloudflare tiers
  const priorApprovedReport = await creditMatcherEngine.matchProfile(
    {
      ...baseVerifiedCloudflareProfile,
      hasPreviouslyRedeemedProgramIds: ["cloudflare-startups-tier-3"],
      isPartnerAffiliated: true,
      isBootstrappedOrSelfFunded: true,
    },
    2026,
    "2026-11-21"
  );
  for (const tierId of [
    "cloudflare-startups-tier-3",
    "cloudflare-startups-tier-2",
    "cloudflare-startups-tier-1",
  ]) {
    if (
      priorApprovedReport.topMatches.find((m) => m.program.id === tierId)?.verificationStatus !==
      "INELIGIBLE"
    ) {
      throw new Error(
        `Test 7h-9 Failed: Prior approval in any Cloudflare tier must disqualify ${tierId}!`
      );
    }
  }

  // Non-tech product, non-profit, existing Enterprise customer, and funding older than 12 months -> INELIGIBLE
  const agencyReport = await creditMatcherEngine.matchProfile(
    {
      ...baseVerifiedCloudflareProfile,
      isTechnologyProduct: false,
      isBootstrappedOrSelfFunded: true,
    },
    2026,
    "2026-11-21"
  );
  const nonProfitReport = await creditMatcherEngine.matchProfile(
    {
      ...baseVerifiedCloudflareProfile,
      isForProfitBusiness: false,
      isBootstrappedOrSelfFunded: true,
    },
    2026,
    "2026-11-21"
  );
  const enterpriseCustomerReport = await creditMatcherEngine.matchProfile(
    {
      ...baseVerifiedCloudflareProfile,
      isExistingEnterpriseCustomer: true,
      isBootstrappedOrSelfFunded: true,
    },
    2026,
    "2026-11-21"
  );
  const staleFundingReport = await creditMatcherEngine.matchProfile(
    {
      ...baseVerifiedCloudflareProfile,
      lastFundingDate: "2025-11-20", // >12 months before 2026-11-21
      isBootstrappedOrSelfFunded: true,
    },
    2026,
    "2026-11-21"
  );
  for (const [label, rep] of [
    ["isTechnologyProduct=false", agencyReport],
    ["isForProfitBusiness=false", nonProfitReport],
    ["isExistingEnterpriseCustomer=true", enterpriseCustomerReport],
    ["lastFundingDate older than 12 months", staleFundingReport],
  ] as const) {
    if (
      rep.topMatches.find((m) => m.program.id === "cloudflare-startups-tier-3")
        ?.verificationStatus !== "INELIGIBLE"
    ) {
      throw new Error(`Test 7h-10 Failed: ${label} must be INELIGIBLE!`);
    }
  }

  // Pitch drafting for all 3 Cloudflare tiers
  for (const tierId of [
    "cloudflare-startups-tier-3",
    "cloudflare-startups-tier-2",
    "cloudflare-startups-tier-1",
  ]) {
    const cfDraft = await creditMatcherEngine.draftPitch(baseVerifiedCloudflareProfile, tierId);
    if (!cfDraft.answers["architecture"] || !cfDraft.oneLinerPitch) {
      throw new Error(`Test 7i Failed: Expected generated pitch answers for ${tierId}!`);
    }
  }
  console.log("✅ Test 7 Passed: Cloudflare for Startups tiers, boundaries, domain normalization, and financial safety verified.");

  // [Test 8] Existing Catalog Regression, Incomplete Profile Safety, & Duration Edge Cases
  console.log("\n[Test 8] Running Regression Tests for Existing Catalog, Incomplete Profiles, & Duration Handling...");
  const existingExpectedTerms: Record<string, { value: number; term: number }> = {
    "posthog-startups": { value: 50000, term: 12 },
    "aws-activate": { value: 25000, term: 24 },
    "microsoft-founders-hub": { value: 25000, term: 12 },
    "notion-startups": { value: 1000, term: 6 },
    "stripe-startups": { value: 20000, term: 12 },
    "github-startups": { value: 5000, term: 12 },
    "google-cloud-startups": { value: 2000, term: 12 },
    "github-student-pack": { value: 200000, term: 24 },
    "paypal-agentic-commerce": { value: 10000, term: 12 },
  };

  for (const [progId, expected] of Object.entries(existingExpectedTerms)) {
    const entry = catalog.find((p) => p.id === progId);
    if (
      !entry ||
      entry.maxCreditValueUsd !== expected.value ||
      entry.creditTermMonths !== expected.term
    ) {
      throw new Error(`Test 8a Failed: Existing catalog entry '${progId}' was mutated or regressed!`);
    }
  }

  // Verify stackCostBeforeCreditsUsd in report1 matches exact sum of the 8 verified existing programs
  const expectedReport1StackCost = 10541.68;
  if (Math.abs(report1.stackCostBeforeCreditsUsd - expectedReport1StackCost) > 0.01) {
    throw new Error(
      `Test 8b Failed: Expected stackCostBeforeCreditsUsd to be ${expectedReport1StackCost}, got ${report1.stackCostBeforeCreditsUsd}`
    );
  }

  // Verify existing programs (e.g., PostHog, AWS Activate) evaluate safely to PRELIMINARY when profile information is missing
  const incompleteProfile: FounderProfile = {
    name: "Incomplete Founder",
    companyName: "Stealth Co",
    websiteUrl: undefined,
    foundedYear: undefined,
    fundingStage: undefined,
    totalFundingRaisedUsd: undefined,
    monthlyBurnRateUsd: 5000,
    techStack: ["Next.js"],
    productCategory: "SaaS",
    tagline: "Stealth SaaS",
    description: "Early stealth concept.",
  };
  const incompleteReport = await creditMatcherEngine.matchProfile(incompleteProfile, 2026);
  const posthogIncomplete = incompleteReport.topMatches.find(
    (m) => m.program.id === "posthog-startups"
  );
  const awsIncomplete = incompleteReport.topMatches.find((m) => m.program.id === "aws-activate");
  if (
    !posthogIncomplete ||
    posthogIncomplete.verificationStatus !== "PRELIMINARY" ||
    posthogIncomplete.isEligible !== false ||
    posthogIncomplete.estimatedValueUsd !== 0 ||
    !awsIncomplete ||
    awsIncomplete.verificationStatus !== "PRELIMINARY" ||
    awsIncomplete.isEligible !== false ||
    awsIncomplete.estimatedValueUsd !== 0 ||
    incompleteReport.totalEligiblePrograms !== 0 ||
    incompleteReport.totalPotentialCreditsUsd !== 0
  ) {
    throw new Error(
      "Test 8c Failed: Existing catalog entries with missing foundedYear, fundingStage, totalFundingRaisedUsd, and websiteUrl must evaluate to PRELIMINARY with 0 verified credits!"
    );
  }

  // Verify creditTermMonths edge cases: undefined, 0, and valid positive number (12)
  const customCatalog: CreditProgram[] = [
    {
      id: "term-undefined",
      name: "Undefined Term Program",
      provider: "TestProvider",
      category: "CLOUD",
      maxCreditValueUsd: 1200,
      creditTermMonths: undefined,
      programUrl: "https://example.com/undefined",
      badge: "$1,200 Credits",
      eligibility: {},
      overview: "Program with unspecified duration.",
      sampleQuestions: [],
    },
    {
      id: "term-zero",
      name: "Zero Term Program",
      provider: "TestProvider",
      category: "CLOUD",
      maxCreditValueUsd: 2400,
      creditTermMonths: 0,
      programUrl: "https://example.com/zero",
      badge: "$2,400 Credits",
      eligibility: {},
      overview: "Program with zero duration.",
      sampleQuestions: [],
    },
    {
      id: "term-positive",
      name: "Positive Term Program",
      provider: "TestProvider",
      category: "CLOUD",
      maxCreditValueUsd: 3600,
      creditTermMonths: 12,
      programUrl: "https://example.com/positive",
      badge: "$3,600 Credits",
      eligibility: {},
      overview: "Program with 12-month duration.",
      sampleQuestions: [],
    },
  ];
  const testEngine = new CreditMatcherEngine(customCatalog);
  const termReport = await testEngine.matchProfile(aiStartup, 2026);
  if (
    termReport.totalEligiblePrograms !== 3 ||
    termReport.totalPotentialCreditsUsd !== 7200 ||
    termReport.stackCostBeforeCreditsUsd !== 300 ||
    !Number.isFinite(termReport.stackCostBeforeCreditsUsd)
  ) {
    throw new Error(
      `Test 8d Failed: Duration edge case handling failed! totalPotentialCreditsUsd=${termReport.totalPotentialCreditsUsd}, stackCostBeforeCreditsUsd=${termReport.stackCostBeforeCreditsUsd}`
    );
  }
  console.log("✅ Test 8 Passed: Existing catalog entries, incomplete profile safety, and creditTermMonths handling verified.");

  console.log("\n==================================================");
  console.log("🎉 ALL 8 Startup Credit & Grant Matcher Tests PASSED!");
  console.log("==================================================");
}

runCreditsTests().catch((err) => {
  console.error("❌ Credits Tests Failed:", err);
  process.exit(1);
});
