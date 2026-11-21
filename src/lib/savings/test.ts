import { db, mandates, transactions, users } from "@/db";
import { eq } from "drizzle-orm";
import { personaSavingsOptimizer } from "./savings-engine";
import { PERSONA_DEALS_MATRIX } from "./deal-matrix";

async function runPersonaSavingsTests() {
  console.log("==================================================");
  console.log("💡 Testing Persona-Based Savings & Credits Optimizer");
  console.log("==================================================");

  // 1. Verify Deal Matrix Integrity
  console.log("\n[Test 1] Verifying Deal Matrix Programs...");
  console.log(`   Total Programs Configured: ${PERSONA_DEALS_MATRIX.length}`);
  const startupDeals = PERSONA_DEALS_MATRIX.filter((d) => d.persona === "STARTUP_FOUNDER");
  const studentDeals = PERSONA_DEALS_MATRIX.filter((d) => d.persona === "STUDENT");
  const devDeals = PERSONA_DEALS_MATRIX.filter((d) => d.persona === "DEVELOPER_SMB");

  console.log(`   • Startup Deals: ${startupDeals.length} ($50k PostHog, Notion, AWS)`);
  console.log(`   • Student Deals: ${studentDeals.length} (Spotify, Adobe, GitHub)`);
  console.log(`   • Developer / SMB Deals: ${devDeals.length} (Coupons, Arbitrage)`);

  if (startupDeals.length < 3 || studentDeals.length < 3 || devDeals.length < 2) {
    throw new Error("Deal matrix missing required programs!");
  }
  console.log("✅ Deals matrix loaded with high-fidelity programs.");

  // 2. Test Startup Founder: PostHog $50k Credits Probe
  console.log("\n[Test 2] Testing Startup Founder Persona: PostHog Probe...");
  const posthogProbe = await personaSavingsOptimizer.probePersonaSavings({
    serviceName: "PostHog Analytics & Session Replay",
    currentPrice: 120.0,
    persona: "STARTUP_FOUNDER",
  });

  console.log("   PostHog Probe Result:", {
    hasDeals: posthogProbe.hasDeals,
    bestDeal: posthogProbe.bestDeal?.headline,
    reclaimedCredits: posthogProbe.reclaimedCredits,
  });

  if (!posthogProbe.hasDeals || posthogProbe.reclaimedCredits !== 50000) {
    throw new Error("Failed to detect $50,000 PostHog startup credits for Startup Founder!");
  }
  console.log("✅ Startup Founder correctly intercepted with $50,000 in PostHog credits.");

  // 2b. Test Linear for Startups: Catalog Metadata, Eligibility & Verification
  console.log("\n[Test 2b] Testing Linear for Startups: Catalog Metadata & Eligibility Rules...");
  const linearDeal = PERSONA_DEALS_MATRIX.find((d) => d.id === "deal-linear-startup");
  if (!linearDeal) {
    throw new Error("Linear for Startups deal (deal-linear-startup) missing from catalog!");
  }
  const uniqueIds = new Set(PERSONA_DEALS_MATRIX.map((d) => d.id));
  if (uniqueIds.size !== PERSONA_DEALS_MATRIX.length) {
    throw new Error("Duplicate deal IDs detected in PERSONA_DEALS_MATRIX!");
  }

  // 1. Catalog metadata assertions
  if (
    linearDeal.service !== "Linear Business" ||
    linearDeal.serviceKey !== "linear" ||
    linearDeal.persona !== "STARTUP_FOUNDER" ||
    linearDeal.dealType !== "STARTUP_CREDITS" ||
    linearDeal.regularPrice !== 16.0 ||
    linearDeal.discountedPrice !== 0.0 ||
    linearDeal.reclaimedCreditValue !== 0.0 ||
    linearDeal.savingsPercentage !== 100 ||
    linearDeal.claimUrl !== "https://linear.app/startups" ||
    linearDeal.badge !== "Up to 6 Months Free"
  ) {
    throw new Error("Linear for Startups catalog metadata does not match official specification!");
  }

  const reqs = linearDeal.eligibilityRequirements;
  if (
    !reqs ||
    reqs.requiresPartnerAffiliation !== true ||
    reqs.maxEmployeesExclusive !== 50 ||
    reqs.requiresNonPayingCustomer !== true ||
    reqs.requiresWorkspaceAdmin !== true ||
    reqs.requiresPartnerLinkOrCode !== true ||
    reqs.maxDurationMonths !== 6
  ) {
    throw new Error("Linear for Startups structured eligibilityRequirements are missing or incorrect!");
  }

  if (
    !linearDeal.description.includes("standard rate") ||
    !linearDeal.description.includes("renew") ||
    !linearDeal.eligibilityCriteria.toLowerCase().includes("partner") ||
    !linearDeal.eligibilityCriteria.includes("50") ||
    !linearDeal.instructions.toLowerCase().includes("workspace admin") ||
    !linearDeal.instructions.toLowerCase().includes("partner")
  ) {
    throw new Error("Linear for Startups descriptive terms or renewal conditions are incomplete!");
  }
  console.log("   • Linear catalog metadata & terms verified.");

  // 2. Fully eligible startup
  const fullyEligibleProbe = await personaSavingsOptimizer.probePersonaSavings({
    serviceName: "Linear Business",
    currentPrice: 16.0,
    persona: "STARTUP_FOUNDER",
    eligibilityContext: {
      isPartnerAffiliated: true,
      employeeCount: 20,
      isCurrentlyPayingCustomer: false,
      isWorkspaceAdmin: true,
      hasPartnerLinkOrCode: true,
    },
  });

  if (
    !fullyEligibleProbe.hasDeals ||
    fullyEligibleProbe.verificationStatus !== "ELIGIBLE" ||
    fullyEligibleProbe.discountedPrice !== 0.0 ||
    fullyEligibleProbe.directSavings !== 16.0 ||
    fullyEligibleProbe.reclaimedCredits !== 0.0
  ) {
    throw new Error("Fully eligible Linear startup probe failed!");
  }
  console.log("   • Fully eligible startup passed (status: ELIGIBLE, price: $0.00).");

  // 3. Employee count boundary: 49 employees (eligible)
  const probe49 = await personaSavingsOptimizer.probePersonaSavings({
    serviceName: "Linear Business",
    currentPrice: 16.0,
    persona: "STARTUP_FOUNDER",
    eligibilityContext: {
      isPartnerAffiliated: true,
      employeeCount: 49,
      isCurrentlyPayingCustomer: false,
      isWorkspaceAdmin: true,
      hasPartnerLinkOrCode: true,
    },
  });
  if (probe49.verificationStatus !== "ELIGIBLE" || probe49.discountedPrice !== 0.0) {
    throw new Error("Startup with 49 employees (< 50) must be ELIGIBLE!");
  }
  console.log("   • Employee count boundary 49 (< 50) passed (status: ELIGIBLE).");

  // 4. Employee count boundary: exactly 50 employees (ineligible)
  const probe50 = await personaSavingsOptimizer.probePersonaSavings({
    serviceName: "Linear Business",
    currentPrice: 16.0,
    persona: "STARTUP_FOUNDER",
    eligibilityContext: {
      isPartnerAffiliated: true,
      employeeCount: 50,
      isCurrentlyPayingCustomer: false,
      isWorkspaceAdmin: true,
      hasPartnerLinkOrCode: true,
    },
  });
  if (
    probe50.hasDeals ||
    probe50.verificationStatus !== "INELIGIBLE" ||
    probe50.discountedPrice !== 16.0 ||
    probe50.directSavings !== 0 ||
    !probe50.disqualificationReasons?.some((r) => r.includes("50"))
  ) {
    throw new Error("Startup with exactly 50 employees must be INELIGIBLE!");
  }
  console.log("   • Employee count boundary 50 passed (status: INELIGIBLE).");

  // 5. Employee count above 50: e.g. 75 employees (ineligible)
  const probe75 = await personaSavingsOptimizer.probePersonaSavings({
    serviceName: "Linear Business",
    currentPrice: 16.0,
    persona: "STARTUP_FOUNDER",
    eligibilityContext: {
      isPartnerAffiliated: true,
      employeeCount: 75,
      isCurrentlyPayingCustomer: false,
      isWorkspaceAdmin: true,
      hasPartnerLinkOrCode: true,
    },
  });
  if (
    probe75.hasDeals ||
    probe75.verificationStatus !== "INELIGIBLE" ||
    probe75.discountedPrice !== 16.0 ||
    probe75.directSavings !== 0
  ) {
    throw new Error("Startup with 75 employees must be INELIGIBLE!");
  }
  console.log("   • Employee count 75 (> 50) passed (status: INELIGIBLE).");

  // 6. No official partner affiliation (ineligible)
  const probeNoPartner = await personaSavingsOptimizer.probePersonaSavings({
    serviceName: "Linear Business",
    currentPrice: 16.0,
    persona: "STARTUP_FOUNDER",
    eligibilityContext: {
      isPartnerAffiliated: false,
      employeeCount: 10,
      isCurrentlyPayingCustomer: false,
      isWorkspaceAdmin: true,
      hasPartnerLinkOrCode: true,
    },
  });
  if (
    probeNoPartner.hasDeals ||
    probeNoPartner.verificationStatus !== "INELIGIBLE" ||
    probeNoPartner.discountedPrice !== 16.0 ||
    probeNoPartner.directSavings !== 0 ||
    !probeNoPartner.disqualificationReasons?.some((r) => r.toLowerCase().includes("partner"))
  ) {
    throw new Error("Startup with isPartnerAffiliated=false must be INELIGIBLE!");
  }
  console.log("   • Unaffiliated startup passed (status: INELIGIBLE).");

  // 7. Already paying Linear customer (ineligible)
  const probePaying = await personaSavingsOptimizer.probePersonaSavings({
    serviceName: "Linear Business",
    currentPrice: 16.0,
    persona: "STARTUP_FOUNDER",
    eligibilityContext: {
      isPartnerAffiliated: true,
      employeeCount: 10,
      isCurrentlyPayingCustomer: true,
      isWorkspaceAdmin: true,
      hasPartnerLinkOrCode: true,
    },
  });
  if (
    probePaying.hasDeals ||
    probePaying.verificationStatus !== "INELIGIBLE" ||
    probePaying.discountedPrice !== 16.0 ||
    probePaying.directSavings !== 0 ||
    !probePaying.disqualificationReasons?.some((r) => r.toLowerCase().includes("non-paying"))
  ) {
    throw new Error("Currently paying Linear customer must be INELIGIBLE!");
  }
  console.log("   • Already paying customer passed (status: INELIGIBLE).");

  // 8. Not a workspace admin (ineligible)
  const probeNotAdmin = await personaSavingsOptimizer.probePersonaSavings({
    serviceName: "Linear Business",
    currentPrice: 16.0,
    persona: "STARTUP_FOUNDER",
    eligibilityContext: {
      isPartnerAffiliated: true,
      employeeCount: 10,
      isCurrentlyPayingCustomer: false,
      isWorkspaceAdmin: false,
      hasPartnerLinkOrCode: true,
    },
  });
  if (
    probeNotAdmin.hasDeals ||
    probeNotAdmin.verificationStatus !== "INELIGIBLE" ||
    probeNotAdmin.discountedPrice !== 16.0 ||
    probeNotAdmin.directSavings !== 0 ||
    !probeNotAdmin.disqualificationReasons?.some((r) => r.toLowerCase().includes("admin"))
  ) {
    throw new Error("Redeemer who is not a workspace admin must be INELIGIBLE!");
  }
  console.log("   • Non-admin redeemer passed (status: INELIGIBLE).");

  // 9. No partner link or code (ineligible)
  const probeNoLink = await personaSavingsOptimizer.probePersonaSavings({
    serviceName: "Linear Business",
    currentPrice: 16.0,
    persona: "STARTUP_FOUNDER",
    eligibilityContext: {
      isPartnerAffiliated: true,
      employeeCount: 10,
      isCurrentlyPayingCustomer: false,
      isWorkspaceAdmin: true,
      hasPartnerLinkOrCode: false,
    },
  });
  if (
    probeNoLink.hasDeals ||
    probeNoLink.verificationStatus !== "INELIGIBLE" ||
    probeNoLink.discountedPrice !== 16.0 ||
    probeNoLink.directSavings !== 0 ||
    !probeNoLink.disqualificationReasons?.some((r) => r.toLowerCase().includes("link") || r.toLowerCase().includes("code"))
  ) {
    throw new Error("Redeemer without partner link/code must be INELIGIBLE!");
  }
  console.log("   • Missing partner link/code passed (status: INELIGIBLE).");

  // 10. Missing eligibility context (verification required)
  const probeMissingContext = await personaSavingsOptimizer.probePersonaSavings({
    serviceName: "Linear Business",
    currentPrice: 16.0,
    persona: "STARTUP_FOUNDER",
  });
  if (
    probeMissingContext.hasDeals ||
    probeMissingContext.verificationStatus !== "VERIFICATION_REQUIRED" ||
    probeMissingContext.discountedPrice !== 16.0 ||
    probeMissingContext.directSavings !== 0 ||
    !probeMissingContext.missingRequirements?.length
  ) {
    throw new Error("Linear probe with missing context must report VERIFICATION_REQUIRED without applied discount!");
  }
  console.log("   • Completely missing context passed (status: VERIFICATION_REQUIRED).");

  // 11. Partial eligibility context (verification required)
  const probePartialContext = await personaSavingsOptimizer.probePersonaSavings({
    serviceName: "Linear Business",
    currentPrice: 16.0,
    persona: "STARTUP_FOUNDER",
    eligibilityContext: {
      isPartnerAffiliated: true,
      // employeeCount missing
      isCurrentlyPayingCustomer: false,
    },
  });
  if (
    probePartialContext.hasDeals ||
    probePartialContext.verificationStatus !== "VERIFICATION_REQUIRED" ||
    probePartialContext.discountedPrice !== 16.0 ||
    probePartialContext.directSavings !== 0 ||
    !probePartialContext.missingRequirements?.some((m) => m.toLowerCase().includes("employee"))
  ) {
    throw new Error("Linear probe with partial context must report VERIFICATION_REQUIRED for missing fields!");
  }
  console.log("   • Partial context passed (status: VERIFICATION_REQUIRED).");

  // 11a. Missing workspace admin confirmation in isolation (verification required)
  const probeMissingAdmin = await personaSavingsOptimizer.probePersonaSavings({
    serviceName: "Linear Business",
    currentPrice: 16.0,
    persona: "STARTUP_FOUNDER",
    eligibilityContext: {
      isPartnerAffiliated: true,
      employeeCount: 10,
      isCurrentlyPayingCustomer: false,
      isWorkspaceAdmin: undefined,
      hasPartnerLinkOrCode: true,
    },
  });
  if (
    probeMissingAdmin.hasDeals ||
    probeMissingAdmin.verificationStatus !== "VERIFICATION_REQUIRED" ||
    probeMissingAdmin.discountedPrice !== 16.0 ||
    probeMissingAdmin.directSavings !== 0 ||
    probeMissingAdmin.missingRequirements?.length !== 1 ||
    !probeMissingAdmin.missingRequirements.some((m) => m.toLowerCase().includes("workspace admin"))
  ) {
    throw new Error("Linear probe with missing workspace admin confirmation must report VERIFICATION_REQUIRED!");
  }
  console.log("   • Missing workspace admin confirmation passed (status: VERIFICATION_REQUIRED).");

  // 11b. Missing partner link/code confirmation in isolation (verification required)
  const probeMissingLink = await personaSavingsOptimizer.probePersonaSavings({
    serviceName: "Linear Business",
    currentPrice: 16.0,
    persona: "STARTUP_FOUNDER",
    eligibilityContext: {
      isPartnerAffiliated: true,
      employeeCount: 10,
      isCurrentlyPayingCustomer: false,
      isWorkspaceAdmin: true,
      hasPartnerLinkOrCode: undefined,
    },
  });
  if (
    probeMissingLink.hasDeals ||
    probeMissingLink.verificationStatus !== "VERIFICATION_REQUIRED" ||
    probeMissingLink.discountedPrice !== 16.0 ||
    probeMissingLink.directSavings !== 0 ||
    probeMissingLink.missingRequirements?.length !== 1 ||
    !probeMissingLink.missingRequirements.some(
      (m) => m.toLowerCase().includes("partner") && (m.toLowerCase().includes("link") || m.toLowerCase().includes("code"))
    )
  ) {
    throw new Error("Linear probe with missing partner link/code confirmation must report VERIFICATION_REQUIRED!");
  }
  console.log("   • Missing partner link/code confirmation passed (status: VERIFICATION_REQUIRED).");

  // 11c. Both redemption requirements missing simultaneously (verification required)
  const probeMissingBothRedemption = await personaSavingsOptimizer.probePersonaSavings({
    serviceName: "Linear Business",
    currentPrice: 16.0,
    persona: "STARTUP_FOUNDER",
    eligibilityContext: {
      isPartnerAffiliated: true,
      employeeCount: 10,
      isCurrentlyPayingCustomer: false,
      isWorkspaceAdmin: undefined,
      hasPartnerLinkOrCode: undefined,
    },
  });
  if (
    probeMissingBothRedemption.hasDeals ||
    probeMissingBothRedemption.verificationStatus !== "VERIFICATION_REQUIRED" ||
    probeMissingBothRedemption.discountedPrice !== 16.0 ||
    probeMissingBothRedemption.directSavings !== 0 ||
    probeMissingBothRedemption.missingRequirements?.length !== 2 ||
    !probeMissingBothRedemption.missingRequirements.some((m) => m.toLowerCase().includes("workspace admin")) ||
    !probeMissingBothRedemption.missingRequirements.some(
      (m) => m.toLowerCase().includes("partner") && (m.toLowerCase().includes("link") || m.toLowerCase().includes("code"))
    )
  ) {
    throw new Error("Linear probe with both redemption requirements missing must report VERIFICATION_REQUIRED with both items!");
  }
  console.log("   • Both redemption requirements missing passed (status: VERIFICATION_REQUIRED).");

  // 12. Invalid employee count (not eligible)
  for (const invalidCount of [NaN, -5, Infinity]) {
    const probeInvalid = await personaSavingsOptimizer.probePersonaSavings({
      serviceName: "Linear Business",
      currentPrice: 16.0,
      persona: "STARTUP_FOUNDER",
      eligibilityContext: {
        isPartnerAffiliated: true,
        employeeCount: invalidCount,
        isCurrentlyPayingCustomer: false,
        isWorkspaceAdmin: true,
        hasPartnerLinkOrCode: true,
      },
    });
    if (
      probeInvalid.hasDeals ||
      probeInvalid.verificationStatus !== "INELIGIBLE" ||
      probeInvalid.discountedPrice !== 16.0
    ) {
      throw new Error(`Invalid employee count (${invalidCount}) must result in INELIGIBLE!`);
    }
  }
  console.log("   • Invalid employee counts (NaN, -5, Infinity) passed (status: INELIGIBLE).");
  console.log("✅ All Linear for Startups eligibility and verification rules passed.");

  // 3. Test Student Profile: Spotify 50% Off & Adobe 64% Off
  console.log("\n[Test 3] Testing Student Profile Persona: Spotify & Adobe Probes...");
  const spotifyProbe = await personaSavingsOptimizer.probePersonaSavings({
    serviceName: "Spotify Premium",
    currentPrice: 11.99,
    persona: "STUDENT",
  });

  console.log("   Spotify Student Result:", {
    originalPrice: spotifyProbe.originalPrice,
    discountedPrice: spotifyProbe.discountedPrice,
    directSavings: spotifyProbe.directSavings,
  });

  if (spotifyProbe.discountedPrice !== 5.99 || spotifyProbe.directSavings !== 6.0) {
    throw new Error("Spotify student discount calculation failed!");
  }
  console.log("✅ Spotify student rate correctly reduced from $11.99 to $5.99/mo (50% off).");

  const adobeProbe = await personaSavingsOptimizer.probePersonaSavings({
    serviceName: "Adobe Creative Cloud",
    currentPrice: 54.99,
    persona: "STUDENT",
  });

  if (adobeProbe.discountedPrice !== 19.99) {
    throw new Error("Adobe student discount calculation failed!");
  }
  console.log("✅ Adobe student rate correctly reduced from $54.99 to $19.99/mo (64% off).");

  // 4. Test Developer / SMB: Active Promo Code (SAVE20)
  console.log("\n[Test 4] Testing Developer / SMB Persona: Promo Code & Arbitrage...");
  const chatgptProbe = await personaSavingsOptimizer.probePersonaSavings({
    serviceName: "ChatGPT Plus",
    currentPrice: 20.0,
    persona: "DEVELOPER_SMB",
  });

  if (chatgptProbe.discountedPrice !== 16.0 || chatgptProbe.bestDeal?.couponCode !== "SAVE20") {
    throw new Error("Coupon code application failed for Developer / SMB!");
  }
  console.log("✅ Promo code SAVE20 applied: $20.00 -> $16.00 (20% off).");

  // 5. Test Discounted PayPal Payment Execution via Sandbox MCP
  console.log("\n[Test 5] Executing Discounted PayPal Capture via applySavingsPayment()...");
  const savingsOwnerId = "usr_savings_test";
  db.insert(users).values({ id: savingsOwnerId, email: "savings-test@example.test" }).onConflictDoNothing().run();
  const savingsMandateId = `mandate-savings-${Date.now()}`;
  db.insert(mandates).values({
    id: savingsMandateId,
    ownerId: savingsOwnerId,
    service: "Spotify Premium Student",
    budgetCeiling: 15.0,
    lastScrapedPrice: 11.99,
    recurrence: "Monthly",
    nextRun: "Dec 1, 2026",
  }).run();
  const paymentExecution = await personaSavingsOptimizer.applySavingsPayment({
    serviceName: "Spotify Premium Student",
    discountedPrice: 5.99,
    mandateId: savingsMandateId,
    ownerId: savingsOwnerId,
    dealId: "deal-spotify-student",
    fundingRail: "PAYPAL",
  });

  console.log("   Payment Result:", {
    success: paymentExecution.success,
    orderId: paymentExecution.orderId,
    dollarsSaved: paymentExecution.dollarsSaved,
    receiptPrice: paymentExecution.receipt.verifiedPrice,
  });

  if (
    !paymentExecution.success ||
    paymentExecution.receipt.verifiedPrice !== 5.99 ||
    paymentExecution.dollarsSaved !== 6.0
  ) {
    throw new Error("Payment execution for discounted total failed!");
  }

  // Verify transaction in SQLite
  const tx = db
    .select()
    .from(transactions)
    .where(eq(transactions.orderId, paymentExecution.orderId))
    .get();

  if (!tx || tx.amount !== 5.99) {
    throw new Error("Transaction record missing or incorrect in SQLite transactions table!");
  }
  console.log("✅ Discounted payment captured and recorded in SQLite transactions:", tx.id);

  console.log("\n==================================================");
  console.log("🎉 All Persona Savings & Credits Optimizer Tests PASSED!");
  console.log("==================================================");
  process.exit(0);
}

runPersonaSavingsTests().catch((err) => {
  console.error("Persona savings test failed:", err);
  process.exit(1);
});
