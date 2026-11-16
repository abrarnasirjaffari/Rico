import {
  CreditMatchingReport,
  CreditPitchDraft,
  CreditProgram,
  FounderProfile,
  MatchedCredit,
} from "./types";
import { STARTUP_CREDITS_CATALOG } from "./programs-catalog";
import { batchQueueEngine } from "@/lib/batch";
import { posthogServer } from "@/lib/telemetry/posthog-server";

export class CreditMatcherEngine {
  private catalog: CreditProgram[];

  constructor(customCatalog?: CreditProgram[]) {
    this.catalog = customCatalog ?? STARTUP_CREDITS_CATALOG;
  }

  public getCatalog(): CreditProgram[] {
    return [...this.catalog];
  }

  /**
   * Match a founder or student profile against the credit catalog
   */
  public async matchProfile(
    profile: FounderProfile,
    referenceYear: number = 2026
  ): Promise<CreditMatchingReport> {
    const matchedCredits: MatchedCredit[] = [];
    const companyAge = Math.max(0, referenceYear - profile.foundedYear);
    const monthlyBurn = profile.monthlyBurnRateUsd > 0 ? profile.monthlyBurnRateUsd : 5000;
    const assumedValuationUsd =
      profile.fundingStage === "SERIES_A"
        ? 20000000
        : profile.fundingStage === "SEED"
        ? 8000000
        : 4000000;

    let totalPotentialCreditsUsd = 0;
    let stackCostBefore = 0;

    for (const program of this.catalog) {
      const eligibilityReasons: string[] = [];
      const disqualificationReasons: string[] = [];
      const pendingVerificationRequirements: string[] = [];
      let isEligible = true;

      const elig = program.eligibility;

      // 1. Company Age check
      if (elig.maxCompanyAgeYears !== undefined && companyAge > elig.maxCompanyAgeYears) {
        isEligible = false;
        disqualificationReasons.push(
          `Company age (${companyAge} yrs) exceeds program limit of ${elig.maxCompanyAgeYears} yrs`
        );
      } else if (elig.maxCompanyAgeYears !== undefined) {
        eligibilityReasons.push(`Founded in ${profile.foundedYear} (${companyAge} yrs old <= ${elig.maxCompanyAgeYears} yrs limit)`);
      }

      // 2. Funding Raised check
      const hasKnownFundingAmount =
        typeof profile.totalFundingRaisedUsd === "number" &&
        Number.isFinite(profile.totalFundingRaisedUsd) &&
        profile.totalFundingRaisedUsd >= 0;

      if (elig.maxFundingRaisedUsd !== undefined) {
        if (!hasKnownFundingAmount) {
          eligibilityReasons.push(
            `Total funding amount not specified or invalid (must be verified ${
              elig.strictMaxFundingRaised ? "<" : "<="
            } $${elig.maxFundingRaisedUsd.toLocaleString()})`
          );
          pendingVerificationRequirements.push(
            `Verify total funding raised is ${
              elig.strictMaxFundingRaised ? "strictly less than" : "within"
            } $${elig.maxFundingRaisedUsd.toLocaleString()} limit`
          );
        } else {
          const exceedsCap = elig.strictMaxFundingRaised
            ? profile.totalFundingRaisedUsd! >= elig.maxFundingRaisedUsd
            : profile.totalFundingRaisedUsd! > elig.maxFundingRaisedUsd;

          if (exceedsCap) {
            isEligible = false;
            disqualificationReasons.push(
              elig.strictMaxFundingRaised
                ? `Funding raised ($${profile.totalFundingRaisedUsd!.toLocaleString()}) must be strictly less than maximum cap ($${elig.maxFundingRaisedUsd.toLocaleString()})`
                : `Funding raised ($${profile.totalFundingRaisedUsd!.toLocaleString()}) exceeds maximum grant cap ($${elig.maxFundingRaisedUsd.toLocaleString()})`
            );
          } else {
            eligibilityReasons.push(
              `Total funding ($${profile.totalFundingRaisedUsd!.toLocaleString()}) fits within program cap`
            );
          }
        }
      }

      // 3. Allowed Stages check
      if (elig.allowedStages && !elig.allowedStages.includes(profile.fundingStage)) {
        isEligible = false;
        disqualificationReasons.push(
          `Stage '${profile.fundingStage}' is not eligible (allowed: ${elig.allowedStages.join(", ")})`
        );
      } else if (elig.allowedStages) {
        eligibilityReasons.push(`Stage '${profile.fundingStage}' is approved`);
      }

      // 4. Student Requirement check
      if (elig.requiresEduEmail) {
        const hasEdu =
          profile.isStudentFounder ||
          (profile.studentEmail && profile.studentEmail.toLowerCase().includes(".edu"));
        if (!hasEdu) {
          isEligible = false;
          disqualificationReasons.push("Requires verified accredited student status or .edu institutional email");
        } else {
          eligibilityReasons.push("Verified student founder eligibility");
        }
      }

      // 5. Website requirement
      if (elig.requiresWebsite && !profile.websiteUrl) {
        isEligible = false;
        disqualificationReasons.push("Active company website URL is required for validation");
      }

      // 6. VC-Backed Requirement check
      if (elig.requiresVcBacked) {
        if (profile.isVcBacked === false) {
          isEligible = false;
          disqualificationReasons.push("Requires a VC-backed startup");
        } else if (profile.isVcBacked === true) {
          eligibilityReasons.push("Confirmed VC-backed startup status");
        } else if (
          profile.fundingStage === "BOOTSTRAPPED" ||
          !hasKnownFundingAmount ||
          profile.totalFundingRaisedUsd! <= 0
        ) {
          isEligible = false;
          disqualificationReasons.push(
            "Requires a VC-backed startup (profile is bootstrapped or has no external funding recorded)"
          );
        } else {
          eligibilityReasons.push(
            `Preliminary match: '${profile.fundingStage}' stage with $${profile.totalFundingRaisedUsd!.toLocaleString()} raised (requires VC-backing verification via AWS Activate)`
          );
          pendingVerificationRequirements.push(
            "Verify VC-backed startup status and AWS Activate eligibility"
          );
        }
      }

      // 7. Active AWS Account Requirement check
      if (elig.requiresActiveAwsAccount) {
        const hasAwsInStack = profile.techStack.some(
          (t) =>
            t.toLowerCase() === "aws" ||
            t.toLowerCase().includes("amazon web services") ||
            t.toLowerCase().includes("aws ")
        );
        if (profile.hasActiveAwsAccount === false) {
          isEligible = false;
          disqualificationReasons.push("Requires an active AWS account");
        } else if (profile.hasActiveAwsAccount === true) {
          eligibilityReasons.push("Confirmed active AWS account");
        } else {
          if (hasAwsInStack) {
            eligibilityReasons.push(
              "Preliminary match: AWS detected in tech stack (active AWS account required at application)"
            );
          } else {
            eligibilityReasons.push(
              "Preliminary match: active AWS account required for application validation"
            );
          }
          pendingVerificationRequirements.push("Verify active AWS account");
        }
      }

      // 8. First-Time Redemption Requirement check
      if (elig.requiresFirstTimeRedemption) {
        const alreadyRedeemed = profile.hasPreviouslyRedeemedProgramIds?.includes(program.id);
        if (alreadyRedeemed) {
          isEligible = false;
          disqualificationReasons.push("Startup has previously redeemed this offer");
        } else if (profile.hasPreviouslyRedeemedProgramIds !== undefined) {
          eligibilityReasons.push("Confirmed no prior redemption of this offer");
        } else {
          eligibilityReasons.push("Requires no prior redemption of this offer");
          pendingVerificationRequirements.push("Confirm offer has not been previously redeemed");
        }
      }

      const verificationStatus: "VERIFIED" | "PRELIMINARY" | "INELIGIBLE" = !isEligible
        ? "INELIGIBLE"
        : pendingVerificationRequirements.length > 0
        ? "PRELIMINARY"
        : "VERIFIED";

      // Calculate Match Score
      let matchScore = 0;
      if (isEligible) {
        matchScore = 85;
        // Bonus for tech stack keyword overlap
        const techMatch = profile.techStack.some((t) =>
          program.overview.toLowerCase().includes(t.toLowerCase()) ||
          program.provider.toLowerCase().includes(t.toLowerCase())
        );
        if (techMatch) matchScore += 10;

        // Bonus for product category
        if (profile.productCategory.toLowerCase().includes("ai") && program.category === "AI_COMPUTE") {
          matchScore += 5;
        }
        matchScore = Math.min(100, matchScore);
      } else {
        matchScore = Math.max(10, 50 - disqualificationReasons.length * 15);
      }

      const estimatedValueUsd = isEligible ? program.maxCreditValueUsd : 0;
      const runwayMonthsAdded = Number((estimatedValueUsd / monthlyBurn).toFixed(1));
      const dilutionEquivalentPercent = Number(
        ((estimatedValueUsd / assumedValuationUsd) * 100).toFixed(2)
      );

      if (isEligible) {
        totalPotentialCreditsUsd += estimatedValueUsd;
        if (program.creditTermMonths !== undefined && program.creditTermMonths > 0) {
          stackCostBefore = Number(
            (stackCostBefore + Number((estimatedValueUsd / program.creditTermMonths).toFixed(2))).toFixed(2)
          );
        }
      }

      matchedCredits.push({
        program,
        isEligible,
        verificationStatus,
        pendingVerificationRequirements,
        matchScore,
        estimatedValueUsd,
        runwayMonthsAdded,
        dilutionEquivalentPercent,
        eligibilityReasons,
        disqualificationReasons,
      });
    }

    // Sort by match score descending, then estimated value
    matchedCredits.sort((a, b) => {
      if (a.isEligible !== b.isEligible) return a.isEligible ? -1 : 1;
      return b.matchScore - a.matchScore;
    });

    const eligibleCount = matchedCredits.filter((m) => m.isEligible).length;
    const totalRunwayExtension = Number((totalPotentialCreditsUsd / monthlyBurn).toFixed(1));
    const dilutionSaved = Number(
      ((totalPotentialCreditsUsd / assumedValuationUsd) * 100).toFixed(2)
    );

    const report: CreditMatchingReport = {
      profile,
      totalEligiblePrograms: eligibleCount,
      totalPotentialCreditsUsd,
      runwayExtensionMonths: totalRunwayExtension,
      dilutionSavedPercent: dilutionSaved,
      topMatches: matchedCredits,
      stackCostBeforeCreditsUsd: stackCostBefore,
      stackCostAfterCreditsUsd: 0,
      generatedAt: new Date().toISOString(),
    };

    await posthogServer.capture({
      event: "startup_credits_matched",
      properties: {
        company: profile.companyName,
        stage: profile.fundingStage,
        eligiblePrograms: eligibleCount,
        totalPotentialUsd: totalPotentialCreditsUsd,
        runwayMonthsAdded: totalRunwayExtension,
      },
    });

    return report;
  }

  /**
   * Automatically generate compelling pitch and answers for a specific program application
   */
  public async draftPitch(
    profile: FounderProfile,
    programId: string
  ): Promise<CreditPitchDraft> {
    const program = this.catalog.find((p) => p.id === programId);
    if (!program) {
      throw new Error(`Credit program '${programId}' not found in catalog`);
    }

    const answers: Record<string, string> = {};

    for (const q of program.sampleQuestions) {
      if (q.id === "traction") {
        const fundingStr =
          typeof profile.totalFundingRaisedUsd === "number" && Number.isFinite(profile.totalFundingRaisedUsd)
            ? `$${profile.totalFundingRaisedUsd.toLocaleString()} raised`
            : "funding details available upon request";
        answers[q.id] = `${profile.companyName} is in ${profile.fundingStage} stage with ${fundingStr}. Our product (${profile.tagline}) addresses ${profile.productCategory} with an active monthly burn of $${profile.monthlyBurnRateUsd.toLocaleString()}/mo.`;
      } else if (q.id === "use_case" || q.id === "architecture" || q.id === "ai_model" || q.id === "cloud_stack") {
        answers[q.id] = `Our architecture is built on ${profile.techStack.join(", ")}. We plan to deploy ${program.provider} to power our production pipelines, monitor real-time AI latency, and scale to thousands of daily autonomous operations with zero infrastructure bottlenecks.`;
      } else if (q.id === "scalability" || q.id === "market_opportunity") {
        answers[q.id] = `${profile.companyName} targets ${profile.productCategory}. By reducing manual overhead through verified automation, we enable customers to operate with full financial confidence and measurable ROI. ${program.name} will extend our runway by ${Number((program.maxCreditValueUsd / (profile.monthlyBurnRateUsd || 5000)).toFixed(1))} months.`;
      } else if (q.id === "academic_status") {
        answers[q.id] = `Enrolled at ${profile.universityName || "Accredited University"} with active student status verified via ${profile.studentEmail || "student edu email"}.`;
      } else if (q.id === "agentic_flow") {
        answers[q.id] = `${profile.companyName} executes autonomous web transactions under user-defined budget ceilings. We use PayPal sandbox APIs, dual-rail transaction cascades, and digital receipts to guarantee payment safety.`;
      } else {
        answers[q.id] = `${profile.description} Built using ${profile.techStack.join(", ")}. Claiming ${program.name} directly supports our production roadmap.`;
      }
    }

    const oneLinerPitch = `${profile.companyName} — ${profile.tagline} (${profile.productCategory} built with ${profile.techStack.slice(0, 3).join(", ")})`;

    return {
      programId: program.id,
      programName: program.name,
      answers,
      oneLinerPitch,
      readinessScore: 95,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Batch match multiple startup profiles in parallel using BatchQueueEngine
   */
  public async batchMatch(
    profiles: FounderProfile[],
    options?: { priority?: "CRITICAL" | "HIGH" | "NORMAL" | "LOW" }
  ): Promise<CreditMatchingReport[]> {
    const jobs = await batchQueueEngine.addBatch(
      "CREDIT_GRANT_MATCH",
      profiles,
      {
        priority: options?.priority || "HIGH",
        maxRetries: 2,
      }
    );

    const completedJobs = await batchQueueEngine.waitForBatch<CreditMatchingReport>(
      jobs.map((j) => j.id),
      30000
    );

    return completedJobs
      .filter((j) => j.status === "COMPLETED" && j.result)
      .map((j) => j.result as CreditMatchingReport);
  }
}

export const creditMatcherEngine = new CreditMatcherEngine();
