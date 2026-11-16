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

  // [Test 7] Supabase Startup Credits (via AWS Activate) Verification
  console.log("\n[Test 7] Verifying Supabase Startup Credits Catalog & Eligibility Rules...");
  const catalog = creditMatcherEngine.getCatalog();
  const ids = catalog.map((p) => p.id);
  const uniqueIds = new Set(ids);
  if (uniqueIds.size !== ids.length) {
    throw new Error("Test 7 Failed: Duplicate program IDs detected in catalog!");
  }

  const supabaseProgram = catalog.find((p) => p.id === "supabase-aws-activate");
  if (
    !supabaseProgram ||
    supabaseProgram.provider !== "Supabase" ||
    supabaseProgram.maxCreditValueUsd !== 300 ||
    supabaseProgram.programUrl !== "https://supabase.com/go/aws-activate-offer" ||
    supabaseProgram.creditTermMonths !== undefined ||
    supabaseProgram.eligibility.maxFundingRaisedUsd !== 5000000 ||
    supabaseProgram.eligibility.strictMaxFundingRaised !== true ||
    supabaseProgram.eligibility.allowedStages !== undefined ||
    supabaseProgram.eligibility.requiresWebsite !== undefined ||
    supabaseProgram.eligibility.requiresVcBacked !== true ||
    supabaseProgram.eligibility.requiresActiveAwsAccount !== true ||
    supabaseProgram.eligibility.requiresFirstTimeRedemption !== true
  ) {
    throw new Error("Test 7 Failed: Supabase catalog entry is missing or does not match official offer details!");
  }

  // 7a: Preliminary match when VC backing & AWS account are inferred from stage/funding/stack
  const supabaseMatchPreliminary = report1.topMatches.find(
    (m) => m.program.id === "supabase-aws-activate"
  );
  if (
    !supabaseMatchPreliminary ||
    !supabaseMatchPreliminary.isEligible ||
    supabaseMatchPreliminary.verificationStatus !== "PRELIMINARY" ||
    !supabaseMatchPreliminary.pendingVerificationRequirements?.length ||
    supabaseMatchPreliminary.estimatedValueUsd !== 300
  ) {
    throw new Error(
      "Test 7 Failed: Startup with inferred VC stage and AWS stack should be classified as a PRELIMINARY match with pending verification requirements!"
    );
  }

  // 7b: Confirmed VERIFIED eligibility when VC-backed, active AWS account, and no prior redemption are explicitly verified
  // Also verifies that websiteUrl is NOT required by the Supabase offer, and that VC-backed status works independently of fundingStage
  const confirmedVcStartup: FounderProfile = {
    ...aiStartup,
    companyName: "Confirmed VC Startup",
    websiteUrl: undefined,
    fundingStage: "BOOTSTRAPPED",
    totalFundingRaisedUsd: 250000,
    techStack: ["Next.js", "PostgreSQL"],
    isVcBacked: true,
    hasActiveAwsAccount: true,
    hasPreviouslyRedeemedProgramIds: [],
  };
  const confirmedReport = await creditMatcherEngine.matchProfile(confirmedVcStartup, 2026);
  const supabaseMatchVerified = confirmedReport.topMatches.find(
    (m) => m.program.id === "supabase-aws-activate"
  );
  if (
    !supabaseMatchVerified ||
    !supabaseMatchVerified.isEligible ||
    supabaseMatchVerified.verificationStatus !== "VERIFIED" ||
    (supabaseMatchVerified.pendingVerificationRequirements?.length ?? 0) !== 0 ||
    supabaseMatchVerified.estimatedValueUsd !== 300
  ) {
    throw new Error(
      "Test 7 Failed: Explicitly verified VC-backed startup with active AWS account (even without websiteUrl or AWS in techStack) must be VERIFIED eligible!"
    );
  }

  // 7c: Bootstrapped / non-VC-backed startup is disqualified
  const supabaseMatchBootstrapped = studentReport.topMatches.find(
    (m) => m.program.id === "supabase-aws-activate"
  );
  if (
    !supabaseMatchBootstrapped ||
    supabaseMatchBootstrapped.isEligible ||
    supabaseMatchBootstrapped.verificationStatus !== "INELIGIBLE"
  ) {
    throw new Error("Test 7 Failed: Bootstrapped startup must not be eligible for VC-backed Supabase offer!");
  }

  // Explicitly non-VC-backed SEED startup (e.g., angel/grant funded only, isVcBacked: false) is disqualified
  const nonVcSeedStartup: FounderProfile = {
    ...aiStartup,
    companyName: "Non-VC Seed Startup",
    isVcBacked: false,
    hasActiveAwsAccount: true,
  };
  const nonVcReport = await creditMatcherEngine.matchProfile(nonVcSeedStartup, 2026);
  const supabaseMatchNonVc = nonVcReport.topMatches.find(
    (m) => m.program.id === "supabase-aws-activate"
  );
  if (!supabaseMatchNonVc || supabaseMatchNonVc.isEligible) {
    throw new Error("Test 7 Failed: Startup with isVcBacked=false must be disqualified regardless of fundingStage!");
  }

  // 7d: $5M funding boundary & missing/invalid funding amount tests
  // Strictly less than $5,000,000 ($4,999,999) with all requirements confirmed -> VERIFIED
  const underFiveMillionStartup: FounderProfile = {
    ...confirmedVcStartup,
    companyName: "Under FiveM VC AI",
    totalFundingRaisedUsd: 4999999,
  };
  const underFiveMillionReport = await creditMatcherEngine.matchProfile(underFiveMillionStartup, 2026);
  const supabaseMatchUnderFiveM = underFiveMillionReport.topMatches.find(
    (m) => m.program.id === "supabase-aws-activate"
  );
  if (
    !supabaseMatchUnderFiveM ||
    !supabaseMatchUnderFiveM.isEligible ||
    supabaseMatchUnderFiveM.verificationStatus !== "VERIFIED"
  ) {
    throw new Error("Test 7 Failed: Confirmed startup with $4,999,999 (<$5M) funding must be VERIFIED eligible!");
  }

  // Fractional boundary test: $4,999,999.50 is strictly less than $5,000,000 -> VERIFIED
  const fractionalUnderFiveMillionStartup: FounderProfile = {
    ...confirmedVcStartup,
    companyName: "Fractional Under FiveM VC AI",
    totalFundingRaisedUsd: 4999999.50,
  };
  const fractionalReport = await creditMatcherEngine.matchProfile(fractionalUnderFiveMillionStartup, 2026);
  const supabaseMatchFractional = fractionalReport.topMatches.find(
    (m) => m.program.id === "supabase-aws-activate"
  );
  if (
    !supabaseMatchFractional ||
    !supabaseMatchFractional.isEligible ||
    supabaseMatchFractional.verificationStatus !== "VERIFIED"
  ) {
    throw new Error("Test 7 Failed: Confirmed startup with $4,999,999.50 (<$5M) funding must be VERIFIED eligible!");
  }

  // Exactly $5,000,000 must be rejected (INELIGIBLE)
  const fiveMillionStartup: FounderProfile = {
    ...confirmedVcStartup,
    companyName: "FiveM Funded AI",
    totalFundingRaisedUsd: 5000000,
  };
  const fiveMillionReport = await creditMatcherEngine.matchProfile(fiveMillionStartup, 2026);
  const supabaseMatchFiveM = fiveMillionReport.topMatches.find(
    (m) => m.program.id === "supabase-aws-activate"
  );
  if (
    !supabaseMatchFiveM ||
    supabaseMatchFiveM.isEligible ||
    supabaseMatchFiveM.verificationStatus !== "INELIGIBLE"
  ) {
    throw new Error("Test 7 Failed: Startup with exactly $5,000,000 funding must be rejected!");
  }

  // Above $5,000,000 ($5,000,000.50) must also be rejected (INELIGIBLE)
  const overFiveMillionStartup: FounderProfile = {
    ...confirmedVcStartup,
    companyName: "Over FiveM VC AI",
    totalFundingRaisedUsd: 5000000.50,
  };
  const overFiveMillionReport = await creditMatcherEngine.matchProfile(overFiveMillionStartup, 2026);
  const supabaseMatchOverFiveM = overFiveMillionReport.topMatches.find(
    (m) => m.program.id === "supabase-aws-activate"
  );
  if (!supabaseMatchOverFiveM || supabaseMatchOverFiveM.isEligible) {
    throw new Error("Test 7 Failed: Startup with > $5,000,000 funding must be rejected!");
  }

  // Missing / undefined funding amount must never result in VERIFIED
  const missingFundingConfirmedStartup: FounderProfile = {
    ...confirmedVcStartup,
    companyName: "Missing Funding VC AI",
    totalFundingRaisedUsd: undefined,
  };
  const missingFundingReport = await creditMatcherEngine.matchProfile(
    missingFundingConfirmedStartup,
    2026
  );
  const supabaseMatchMissingFunding = missingFundingReport.topMatches.find(
    (m) => m.program.id === "supabase-aws-activate"
  );
  if (
    !supabaseMatchMissingFunding ||
    supabaseMatchMissingFunding.verificationStatus === "VERIFIED" ||
    supabaseMatchMissingFunding.verificationStatus !== "PRELIMINARY" ||
    !supabaseMatchMissingFunding.pendingVerificationRequirements?.some((r) =>
      r.toLowerCase().includes("funding")
    )
  ) {
    throw new Error(
      "Test 7 Failed: Missing/undefined totalFundingRaisedUsd must never result in VERIFIED!"
    );
  }

  // Invalid funding amounts (NaN, negative, Infinity) must never result in VERIFIED
  for (const invalidValue of [NaN, -50000, Infinity, -Infinity]) {
    const invalidFundingStartup: FounderProfile = {
      ...confirmedVcStartup,
      companyName: `Invalid Funding (${invalidValue}) VC AI`,
      totalFundingRaisedUsd: invalidValue,
    };
    const invalidFundingReport = await creditMatcherEngine.matchProfile(invalidFundingStartup, 2026);
    const supabaseMatchInvalidFunding = invalidFundingReport.topMatches.find(
      (m) => m.program.id === "supabase-aws-activate"
    );
    if (
      !supabaseMatchInvalidFunding ||
      supabaseMatchInvalidFunding.verificationStatus === "VERIFIED" ||
      supabaseMatchInvalidFunding.verificationStatus !== "PRELIMINARY" ||
      !supabaseMatchInvalidFunding.pendingVerificationRequirements?.some((r) =>
        r.toLowerCase().includes("funding")
      )
    ) {
      throw new Error(`Test 7 Failed: Invalid totalFundingRaisedUsd (${invalidValue}) must never result in VERIFIED!`);
    }
  }

  // 7e: Startup without active AWS account (and without AWS in stack, or hasActiveAwsAccount: false) is disqualified
  const noAwsStartup: FounderProfile = {
    ...aiStartup,
    companyName: "GCP Only AI",
    techStack: ["Next.js", "TypeScript", "PostgreSQL", "GCP"],
    isVcBacked: true,
  };
  const noAwsReport = await creditMatcherEngine.matchProfile(noAwsStartup, 2026);
  const supabaseMatchNoAws = noAwsReport.topMatches.find(
    (m) => m.program.id === "supabase-aws-activate"
  );
  if (!supabaseMatchNoAws || supabaseMatchNoAws.isEligible) {
    throw new Error("Test 7 Failed: Startup without active AWS account must not qualify for AWS Activate Supabase offer!");
  }

  const inactiveAwsAccountStartup: FounderProfile = {
    ...aiStartup,
    companyName: "Inactive AWS Account AI",
    techStack: ["Next.js", "AWS"],
    isVcBacked: true,
    hasActiveAwsAccount: false,
  };
  const inactiveAwsReport = await creditMatcherEngine.matchProfile(inactiveAwsAccountStartup, 2026);
  const supabaseMatchInactiveAws = inactiveAwsReport.topMatches.find(
    (m) => m.program.id === "supabase-aws-activate"
  );
  if (!supabaseMatchInactiveAws || supabaseMatchInactiveAws.isEligible) {
    throw new Error("Test 7 Failed: Startup with hasActiveAwsAccount=false must be disqualified even if AWS is in techStack!");
  }

  // 7f: Startup that previously redeemed the offer is disqualified
  const redeemedStartup: FounderProfile = {
    ...confirmedVcStartup,
    companyName: "Previously Redeemed AI",
    hasPreviouslyRedeemedProgramIds: ["supabase-aws-activate"],
  };
  const redeemedReport = await creditMatcherEngine.matchProfile(redeemedStartup, 2026);
  const supabaseMatchRedeemed = redeemedReport.topMatches.find(
    (m) => m.program.id === "supabase-aws-activate"
  );
  if (!supabaseMatchRedeemed || supabaseMatchRedeemed.isEligible) {
    throw new Error("Test 7 Failed: Startup that previously redeemed the Supabase offer must be disqualified!");
  }

  // 7g: Application pitch drafting works for Supabase program
  const supabaseDraft = await creditMatcherEngine.draftPitch(aiStartup, "supabase-aws-activate");
  if (!supabaseDraft.answers["use_case"] || !supabaseDraft.answers["architecture"]) {
    throw new Error("Test 7 Failed: Expected generated pitch answers for Supabase Startup Credits!");
  }
  console.log("✅ Test 7 Passed: Supabase Startup Credits catalog, VC/AWS/redemption verification, and preliminary vs. confirmed eligibility verified.");

  // [Test 8] Regression Tests for Existing Catalog Entries & creditTermMonths Edge Cases
  console.log("\n[Test 8] Running Regression Tests for Existing Catalog & creditTermMonths Handling...");
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
      throw new Error(`Test 8 Failed: Existing catalog entry '${progId}' was mutated or regressed!`);
    }
  }

  // Verify stackCostBeforeCreditsUsd across existing eligible programs in report1
  // For aiStartup: 8 existing programs with defined positive creditTermMonths + Supabase with undefined creditTermMonths
  // Expected monthly stack cost before credits:
  // 50000/12 (4166.67) + 25000/24 (1041.67) + 25000/12 (2083.33) + 1000/6 (166.67) +
  // 20000/12 (1666.67) + 5000/12 (416.67) + 2000/12 (166.67) + 10000/12 (833.33) = 10541.68
  const expectedReport1StackCost = 10541.68;
  if (Math.abs(report1.stackCostBeforeCreditsUsd - expectedReport1StackCost) > 0.01) {
    throw new Error(
      `Test 8 Failed: Expected stackCostBeforeCreditsUsd to be ${expectedReport1StackCost}, got ${report1.stackCostBeforeCreditsUsd}`
    );
  }

  // Directly test creditTermMonths edge cases: undefined, 0, and valid positive number (12)
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
  // Total credits should include all 3 eligible programs: 1200 + 2400 + 3600 = 7200
  // stackCostBeforeCreditsUsd must ONLY include the positive term program: 3600 / 12 = 300
  if (
    termReport.totalEligiblePrograms !== 3 ||
    termReport.totalPotentialCreditsUsd !== 7200 ||
    termReport.stackCostBeforeCreditsUsd !== 300 ||
    !Number.isFinite(termReport.stackCostBeforeCreditsUsd)
  ) {
    throw new Error(
      `Test 8 Failed: Edge case duration handling failed! totalPotentialCreditsUsd=${termReport.totalPotentialCreditsUsd}, stackCostBeforeCreditsUsd=${termReport.stackCostBeforeCreditsUsd}`
    );
  }
  console.log("✅ Test 8 Passed: Existing catalog entries and creditTermMonths (undefined, 0, positive) regression tests verified.");

  console.log("\n==================================================");
  console.log("🎉 ALL 8 Startup Credit & Grant Matcher Tests PASSED!");
  console.log("==================================================");
}

runCreditsTests().catch((err) => {
  console.error("❌ Credits Tests Failed:", err);
  process.exit(1);
});
