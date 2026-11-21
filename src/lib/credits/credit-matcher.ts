import {
  CreditMatchingReport,
  CreditPitchDraft,
  CreditProgram,
  CreditVerificationStatus,
  FounderProfile,
  MatchedCredit,
} from "./types";
import { STARTUP_CREDITS_CATALOG } from "./programs-catalog";
import { batchQueueEngine } from "@/lib/batch";
import { posthogServer } from "@/lib/telemetry/posthog-server";

const PERSONAL_EMAIL_PROVIDERS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "gmx.com",
  "yandex.com",
  "mail.com",
  "zoho.com",
]);

const GENERIC_SECOND_LEVEL_LABELS = new Set([
  "co",
  "com",
  "org",
  "net",
  "edu",
  "gov",
  "ac",
  "mil",
]);

const ALLOWED_SOCIAL_HOSTS = new Set([
  "linkedin.com",
  "x.com",
  "twitter.com",
  "github.com",
]);

function parseStrictIsoDate(
  dateStr: string
): { year: number; month: number; day: number } | null {
  if (typeof dateStr !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return null;
  }
  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    year < 1900 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }

  const dt = new Date(Date.UTC(year, month - 1, day));
  if (
    dt.getUTCFullYear() !== year ||
    dt.getUTCMonth() + 1 !== month ||
    dt.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

function formatIsoDate(year: number, month: number, day: number): string {
  const maxDayInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const clampedDay = Math.min(day, maxDayInMonth);
  const y = String(year).padStart(4, "0");
  const m = String(month).padStart(2, "0");
  const d = String(clampedDay).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function subtractYearsFromIsoDate(
  parsedRef: { year: number; month: number; day: number },
  years: number
): string {
  return formatIsoDate(parsedRef.year - years, parsedRef.month, parsedRef.day);
}

function subtractMonthsFromIsoDate(
  parsedRef: { year: number; month: number; day: number },
  months: number
): string {
  const totalMonths = parsedRef.year * 12 + (parsedRef.month - 1) - months;
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonth = (totalMonths % 12) + 1;
  return formatIsoDate(targetYear, targetMonth, parsedRef.day);
}

function normalizeHostLabels(rawHost: string): string | null {
  const cleaned = rawHost.trim().toLowerCase().replace(/\.$/, "");
  const withoutWww = cleaned.startsWith("www.") ? cleaned.slice(4) : cleaned;
  if (!withoutWww || /\s/.test(withoutWww)) return null;

  const labels = withoutWww.split(".");
  if (labels.length < 2) return null;
  for (const label of labels) {
    if (!label || !/^[a-z0-9-]+$/.test(label) || label.startsWith("-") || label.endsWith("-")) {
      return null;
    }
  }
  const tld = labels[labels.length - 1];
  if (!/^[a-z]{2,}$/.test(tld)) return null;

  return withoutWww;
}

function parseValidHttpWebsiteHost(websiteUrl: string): string | null {
  if (typeof websiteUrl !== "string" || websiteUrl.trim() === "") {
    return null;
  }
  try {
    const parsed = new URL(websiteUrl.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return normalizeHostLabels(parsed.hostname);
  } catch {
    return null;
  }
}

function isClearTwoLabelParentDomain(domain: string): boolean {
  const labels = domain.split(".");
  if (labels.length !== 2) return false;
  const [firstLabel, tld] = labels;
  if (tld.length === 2 && GENERIC_SECOND_LEVEL_LABELS.has(firstLabel)) {
    return false;
  }
  return true;
}

function evaluateEmailAgainstWebsite(
  businessEmail: string | undefined,
  websiteHost: string | null,
  hasWebsiteInput: boolean
): {
  status: "PASSED" | "PRELIMINARY" | "INELIGIBLE";
  reason: string;
} {
  if (businessEmail === undefined) {
    return {
      status: "PRELIMINARY",
      reason: "Provide a for-profit business email address matching your startup's website domain",
    };
  }

  if (typeof businessEmail !== "string" || businessEmail.trim() === "") {
    return {
      status: "INELIGIBLE",
      reason: "Business email address cannot be empty",
    };
  }

  const trimmed = businessEmail.trim();
  if (/\s/.test(trimmed)) {
    return {
      status: "INELIGIBLE",
      reason: "Invalid business email format",
    };
  }

  const parts = trimmed.split("@");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return {
      status: "INELIGIBLE",
      reason: "Invalid business email format",
    };
  }

  const emailHost = normalizeHostLabels(parts[1]);
  if (!emailHost) {
    return {
      status: "INELIGIBLE",
      reason: "Invalid business email domain",
    };
  }

  if (PERSONAL_EMAIL_PROVIDERS.has(emailHost)) {
    return {
      status: "INELIGIBLE",
      reason: `Personal email domain (${emailHost}) is not eligible; a domain-matched business email is required`,
    };
  }

  if (!websiteHost) {
    if (!hasWebsiteInput) {
      return {
        status: "PRELIMINARY",
        reason: `Verify business email domain (${emailHost}) matches company website domain once website URL is provided`,
      };
    }
    return {
      status: "INELIGIBLE",
      reason: "Cannot validate business email domain because company website URL is invalid",
    };
  }

  // Rule A: Exact normalized domain match
  if (emailHost === websiteHost) {
    return {
      status: "PASSED",
      reason: `Verified business email domain (${emailHost}) matches company website domain (${websiteHost})`,
    };
  }

  // Rule B: Direct parent / subdomain relationship
  if (emailHost.endsWith(`.${websiteHost}`) || websiteHost.endsWith(`.${emailHost}`)) {
    const baseDomain = emailHost.length < websiteHost.length ? emailHost : websiteHost;
    const baseLabels = baseDomain.split(".");
    const baseTld = baseLabels[baseLabels.length - 1];

    if (isClearTwoLabelParentDomain(baseDomain)) {
      return {
        status: "PASSED",
        reason: `Verified business email domain (${emailHost}) matches company website domain (${websiteHost})`,
      };
    }

    if (baseLabels.length >= 2 && (baseTld.length === 2 || baseLabels.length >= 3)) {
      return {
        status: "PRELIMINARY",
        reason: `Confirm business email domain (${emailHost}) and website domain (${websiteHost}) belong to the same organization`,
      };
    }
  }

  // Rule C: Sibling subdomains of a clear 2-label parent domain
  const emailLabels = emailHost.split(".");
  const siteLabels = websiteHost.split(".");
  if (emailLabels.length >= 3 && siteLabels.length >= 3) {
    const emailParent2 = emailLabels.slice(-2).join(".");
    const siteParent2 = siteLabels.slice(-2).join(".");
    if (emailParent2 === siteParent2 && isClearTwoLabelParentDomain(emailParent2)) {
      return {
        status: "PRELIMINARY",
        reason: `Confirm sibling subdomain business email (${emailHost}) and website (${websiteHost}) belong to the same organization`,
      };
    }
  }

  return {
    status: "INELIGIBLE",
    reason: `Business email domain (${emailHost}) does not match company website domain (${websiteHost})`,
  };
}

function hasValidSocialProfileUrl(urls: string[]): boolean {
  for (const rawUrl of urls) {
    if (typeof rawUrl !== "string" || rawUrl.trim() === "") continue;
    try {
      const parsed = new URL(rawUrl.trim());
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") continue;
      const host = normalizeHostLabels(parsed.hostname);
      if (!host) continue;
      const matchesAllowedHost = Array.from(ALLOWED_SOCIAL_HOSTS).some(
        (allowed) => host === allowed || host.endsWith(`.${allowed}`)
      );
      const cleanPath = parsed.pathname.replace(/\/+/g, "").trim();
      if (matchesAllowedHost && cleanPath.length > 0) {
        return true;
      }
    } catch {
      continue;
    }
  }
  return false;
}

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
    referenceYear?: number,
    referenceDate?: string
  ): Promise<CreditMatchingReport> {
    const nowIsoDate = new Date().toISOString().slice(0, 10);
    const parsedNowDate = parseStrictIsoDate(nowIsoDate)!;

    if (
      referenceYear !== undefined &&
      (typeof referenceYear !== "number" ||
        !Number.isFinite(referenceYear) ||
        !Number.isInteger(referenceYear) ||
        referenceYear < 1900)
    ) {
      throw new Error(
        `Invalid referenceYear (${referenceYear}); must be an integer year >= 1900`
      );
    }

    let parsedReferenceDate: { year: number; month: number; day: number };

    if (referenceDate !== undefined) {
      const parsedSuppliedDate = parseStrictIsoDate(referenceDate);
      if (!parsedSuppliedDate) {
        throw new Error(
          `Invalid referenceDate (${referenceDate}); must be a valid ISO calendar date (YYYY-MM-DD)`
        );
      }
      if (referenceYear !== undefined && parsedSuppliedDate.year !== referenceYear) {
        throw new Error(
          `Mismatched referenceYear (${referenceYear}) and referenceDate (${referenceDate}); year components must match`
        );
      }
      parsedReferenceDate = parsedSuppliedDate;
    } else if (referenceYear !== undefined) {
      const derivedIsoDate = formatIsoDate(
        referenceYear,
        parsedNowDate.month,
        parsedNowDate.day
      );
      parsedReferenceDate = parseStrictIsoDate(derivedIsoDate)!;
    } else {
      parsedReferenceDate = parsedNowDate;
    }

    const effectiveReferenceYear = parsedReferenceDate.year;

    const matchedCredits: MatchedCredit[] = [];
    const monthlyBurn = profile.monthlyBurnRateUsd > 0 ? profile.monthlyBurnRateUsd : 5000;
    const assumedValuationUsd =
      profile.fundingStage === "SERIES_B"
        ? 50000000
        : profile.fundingStage === "SERIES_A"
        ? 20000000
        : profile.fundingStage === "SEED"
        ? 8000000
        : 4000000;

    const hasValidFundingNumber =
      typeof profile.totalFundingRaisedUsd === "number" &&
      Number.isFinite(profile.totalFundingRaisedUsd) &&
      profile.totalFundingRaisedUsd >= 0;

    const hasInvalidFundingInput =
      profile.totalFundingRaisedUsd !== undefined && !hasValidFundingNumber;

    const hasWebsiteInput = profile.websiteUrl !== undefined;
    const parsedWebsiteHost =
      profile.websiteUrl !== undefined ? parseValidHttpWebsiteHost(profile.websiteUrl) : null;

    for (const program of this.catalog) {
      const eligibilityReasons: string[] = [];
      const disqualificationReasons: string[] = [];
      const pendingVerificationRequirements: string[] = [];

      const elig = program.eligibility;

      // 1. Company Age / Incorporation Date check
      if (elig.maxCompanyAgeYears !== undefined) {
        if (profile.incorporatedDate !== undefined) {
          const parsedInc = parseStrictIsoDate(profile.incorporatedDate);
          const formattedRef = formatIsoDate(
            parsedReferenceDate.year,
            parsedReferenceDate.month,
            parsedReferenceDate.day
          );
          if (!parsedInc || profile.incorporatedDate > formattedRef) {
            disqualificationReasons.push(
              `Invalid or future incorporation date (${profile.incorporatedDate})`
            );
          } else {
            const cutoffDate = subtractYearsFromIsoDate(
              parsedReferenceDate,
              elig.maxCompanyAgeYears
            );
            if (profile.incorporatedDate < cutoffDate) {
              disqualificationReasons.push(
                `Company incorporation date (${profile.incorporatedDate}) exceeds program limit of ${elig.maxCompanyAgeYears} yrs as of ${formattedRef}`
              );
            } else {
              eligibilityReasons.push(
                `Incorporated on ${profile.incorporatedDate} (within ${elig.maxCompanyAgeYears}-year limit)`
              );
            }
          }
        } else if (profile.foundedYear === undefined) {
          pendingVerificationRequirements.push(
            `Confirm company was incorporated within the last ${elig.maxCompanyAgeYears} years`
          );
        } else if (
          typeof profile.foundedYear !== "number" ||
          !Number.isFinite(profile.foundedYear) ||
          !Number.isInteger(profile.foundedYear) ||
          profile.foundedYear <= 0 ||
          profile.foundedYear > effectiveReferenceYear
        ) {
          disqualificationReasons.push(
            `Invalid foundedYear (${profile.foundedYear}); must be a valid integer year not in the future`
          );
        } else {
          const companyAge = effectiveReferenceYear - profile.foundedYear;
          if (companyAge > elig.maxCompanyAgeYears) {
            disqualificationReasons.push(
              `Company age (${companyAge} yrs) exceeds program limit of ${elig.maxCompanyAgeYears} yrs`
            );
          } else if (
            companyAge === elig.maxCompanyAgeYears &&
            elig.requiresExactIncorporationDateAtBoundary
          ) {
            pendingVerificationRequirements.push(
              `Founded in ${profile.foundedYear} (borderline ${elig.maxCompanyAgeYears}-year limit); provide exact incorporation date (incorporatedDate) to confirm incorporation within the last ${elig.maxCompanyAgeYears} years`
            );
          } else {
            eligibilityReasons.push(
              `Founded in ${profile.foundedYear} (${companyAge} yrs old <= ${elig.maxCompanyAgeYears} yrs limit)`
            );
          }
        }
      }

      // 2. Funding Raised (min & max) check
      if (elig.minFundingRaisedUsd !== undefined || elig.maxFundingRaisedUsd !== undefined) {
        if (hasInvalidFundingInput) {
          disqualificationReasons.push(
            "Invalid totalFundingRaisedUsd; must be a finite non-negative number"
          );
        } else if (!hasValidFundingNumber) {
          const minDesc =
            elig.minFundingRaisedUsd !== undefined
              ? `>= $${elig.minFundingRaisedUsd.toLocaleString()}`
              : "";
          const maxDesc =
            elig.maxFundingRaisedUsd !== undefined
              ? `${elig.strictMaxFundingRaised ? "<" : "<="} $${elig.maxFundingRaisedUsd.toLocaleString()}`
              : "";
          const boundDesc = [minDesc, maxDesc].filter(Boolean).join(" and ");
          pendingVerificationRequirements.push(
            `Verify total funding raised is ${boundDesc}`
          );
        } else {
          const funding = profile.totalFundingRaisedUsd!;
          let fundingPassed = true;

          if (elig.minFundingRaisedUsd !== undefined && funding < elig.minFundingRaisedUsd) {
            fundingPassed = false;
            disqualificationReasons.push(
              `Funding raised ($${funding.toLocaleString()}) is below minimum requirement ($${elig.minFundingRaisedUsd.toLocaleString()})`
            );
          }

          if (elig.maxFundingRaisedUsd !== undefined) {
            const exceedsCap = elig.strictMaxFundingRaised
              ? funding >= elig.maxFundingRaisedUsd
              : funding > elig.maxFundingRaisedUsd;

            if (exceedsCap) {
              fundingPassed = false;
              disqualificationReasons.push(
                elig.strictMaxFundingRaised
                  ? `Funding raised ($${funding.toLocaleString()}) must be strictly less than $${elig.maxFundingRaisedUsd.toLocaleString()}`
                  : `Funding raised ($${funding.toLocaleString()}) exceeds maximum grant cap ($${elig.maxFundingRaisedUsd.toLocaleString()})`
              );
            }
          }

          if (fundingPassed) {
            eligibilityReasons.push(
              `Total funding ($${funding.toLocaleString()}) fits within program requirements`
            );
          }
        }
      }

      // 3. Allowed Stages check
      if (elig.allowedStages) {
        if (profile.fundingStage === undefined) {
          pendingVerificationRequirements.push(
            `Confirm funding stage is within allowed stages (${elig.allowedStages.join(", ")})`
          );
        } else if (!elig.allowedStages.includes(profile.fundingStage)) {
          disqualificationReasons.push(
            `Stage '${profile.fundingStage}' is not eligible (allowed: ${elig.allowedStages.join(", ")})`
          );
        } else {
          eligibilityReasons.push(`Stage '${profile.fundingStage}' is approved`);
        }
      }

      // 4. Student Requirement check
      if (elig.requiresEduEmail) {
        const hasEdu =
          profile.isStudentFounder === true ||
          (typeof profile.studentEmail === "string" &&
            profile.studentEmail.toLowerCase().includes(".edu"));
        if (!hasEdu) {
          disqualificationReasons.push(
            "Requires verified accredited student status or .edu institutional email"
          );
        } else {
          eligibilityReasons.push("Verified student founder eligibility");
        }
      }

      // 5. Website requirement
      if (elig.requiresWebsite) {
        if (profile.websiteUrl === undefined) {
          pendingVerificationRequirements.push(
            "Provide a valid, publicly accessible company website URL"
          );
        } else if (!parsedWebsiteHost) {
          disqualificationReasons.push(
            "Active, valid http(s) company website URL is required for validation"
          );
        } else {
          eligibilityReasons.push(`Verified active company website (${parsedWebsiteHost})`);
        }
      }

      // 6. Bootstrapped or Self-Funded requirement (Cloudflare Tier 3)
      if (elig.requiresBootstrappedOrSelfFunded) {
        if (profile.isBootstrappedOrSelfFunded === false) {
          disqualificationReasons.push(
            "Requires the startup to be bootstrapped or self-funded"
          );
        } else if (profile.isBootstrappedOrSelfFunded === true) {
          eligibilityReasons.push("Confirmed bootstrapped or self-funded startup status");
        } else {
          pendingVerificationRequirements.push(
            "Confirm startup is bootstrapped or self-funded"
          );
        }
      }

      // 7. Affiliated Partner requirement (Cloudflare Tier 1 & Tier 2)
      if (elig.requiresPartnerAffiliation) {
        if (profile.isPartnerAffiliated === false) {
          disqualificationReasons.push(
            "Requires funding from an affiliated program partner"
          );
        } else if (profile.isPartnerAffiliated === true) {
          if (hasValidFundingNumber && profile.totalFundingRaisedUsd === 0) {
            disqualificationReasons.push(
              "Partner-funded tier requires non-zero funding raised from an affiliated partner"
            );
          } else {
            eligibilityReasons.push("Confirmed funded by an affiliated partner");
          }
        } else {
          if (hasValidFundingNumber && profile.totalFundingRaisedUsd === 0) {
            disqualificationReasons.push(
              "Partner-funded tier requires external funding from an affiliated partner ($0 funding raised)"
            );
          } else {
            pendingVerificationRequirements.push(
              "Verify startup is funded by an affiliated partner"
            );
          }
        }
      }

      // 8. Funding Recency requirement (e.g., Funded within the last 12 months)
      if (elig.requiresFundingWithinMonths !== undefined) {
        const monthsLimit = elig.requiresFundingWithinMonths;
        const formattedRef = formatIsoDate(
          parsedReferenceDate.year,
          parsedReferenceDate.month,
          parsedReferenceDate.day
        );

        if (hasValidFundingNumber && profile.totalFundingRaisedUsd === 0) {
          if (profile.lastFundingDate !== undefined) {
            pendingVerificationRequirements.push(
              "Contradictory funding data: totalFundingRaisedUsd is $0 while lastFundingDate is provided; verify actual funding amount and recency with provider"
            );
          } else if (elig.requiresBootstrappedOrSelfFunded) {
            pendingVerificationRequirements.push(
              `Verify Tier 3 eligibility with Cloudflare: universal criteria list 'Funded within the last ${monthsLimit} months' while Tier 3 states 'no minimum funding required' for bootstrapped/self-funded startups ($0 raised)`
            );
          }
        } else if (profile.lastFundingDate === undefined) {
          pendingVerificationRequirements.push(
            `Provide most recent funding date (lastFundingDate) to confirm funding occurred within the last ${monthsLimit} months`
          );
        } else {
          const parsedFundingDate = parseStrictIsoDate(profile.lastFundingDate);
          if (!parsedFundingDate || profile.lastFundingDate > formattedRef) {
            disqualificationReasons.push(
              `Invalid or future lastFundingDate (${profile.lastFundingDate})`
            );
          } else {
            const cutoffFundingDate = subtractMonthsFromIsoDate(
              parsedReferenceDate,
              monthsLimit
            );
            if (profile.lastFundingDate < cutoffFundingDate) {
              disqualificationReasons.push(
                `Most recent funding date (${profile.lastFundingDate}) is more than ${monthsLimit} months before ${formattedRef}`
              );
            } else {
              eligibilityReasons.push(
                `Most recent funding (${profile.lastFundingDate}) occurred within the last ${monthsLimit} months`
              );
            }
          }
        }
      }

      // 9. First-Time Program Applicant / Redemption requirement
      if (elig.requiresFirstTimeRedemption) {
        if (profile.hasPreviouslyRedeemedProgramIds === undefined) {
          pendingVerificationRequirements.push(
            "Confirm startup has not previously been approved into this program (first-time applicants only)"
          );
        } else if (!Array.isArray(profile.hasPreviouslyRedeemedProgramIds)) {
          disqualificationReasons.push(
            "Invalid hasPreviouslyRedeemedProgramIds format"
          );
        } else {
          const siblingGroupProgramIds = program.exclusiveGroupId
            ? this.catalog
                .filter((p) => p.exclusiveGroupId === program.exclusiveGroupId)
                .map((p) => p.id)
            : [program.id];

          const alreadyApproved = profile.hasPreviouslyRedeemedProgramIds.some(
            (redeemedId) =>
              redeemedId === program.id ||
              (program.exclusiveGroupId !== undefined &&
                redeemedId === program.exclusiveGroupId) ||
              siblingGroupProgramIds.includes(redeemedId)
          );

          if (alreadyApproved) {
            disqualificationReasons.push(
              "Startup has previously been approved into this program (first-time applicants only)"
            );
          } else {
            eligibilityReasons.push("Confirmed first-time applicant to the program");
          }
        }
      }

      // 10. Technology Product requirement
      if (elig.requiresTechnologyProduct) {
        if (profile.isTechnologyProduct === false) {
          disqualificationReasons.push(
            "Requires actively building a technology product (educational institutions, personal blogs, consultancies, agencies, MSPs, and resellers are excluded)"
          );
        } else if (profile.isTechnologyProduct === true) {
          eligibilityReasons.push("Confirmed actively building a technology product");
        } else {
          pendingVerificationRequirements.push(
            "Confirm startup is actively building a technology product"
          );
        }
      }

      // 11. For-Profit Business requirement
      if (elig.requiresForProfitBusiness) {
        if (profile.isForProfitBusiness === false) {
          disqualificationReasons.push("Requires a for-profit business");
        } else if (profile.isForProfitBusiness === true) {
          eligibilityReasons.push("Confirmed for-profit business status");
        } else {
          pendingVerificationRequirements.push("Confirm startup is a for-profit business");
        }
      }

      // 12. Existing Enterprise Customer exclusion
      if (elig.disallowsExistingEnterpriseCustomer) {
        if (profile.isExistingEnterpriseCustomer === true) {
          disqualificationReasons.push(
            "Program may not be used by existing Enterprise customers"
          );
        } else if (profile.isExistingEnterpriseCustomer === false) {
          eligibilityReasons.push("Confirmed not an existing Enterprise customer");
        } else {
          pendingVerificationRequirements.push(
            "Confirm startup is not an existing Enterprise customer"
          );
        }
      }

      // 13. Domain-Matched Business Email requirement
      if (elig.requiresDomainMatchedBusinessEmail) {
        const emailEval = evaluateEmailAgainstWebsite(
          profile.businessEmail,
          parsedWebsiteHost,
          hasWebsiteInput
        );
        if (emailEval.status === "INELIGIBLE") {
          disqualificationReasons.push(emailEval.reason);
        } else if (emailEval.status === "PRELIMINARY") {
          pendingVerificationRequirements.push(emailEval.reason);
        } else {
          eligibilityReasons.push(emailEval.reason);
        }
      }

      // 14. Public Social Media Presence requirement (LinkedIn, X/Twitter, or GitHub)
      if (elig.requiresSocialPresence) {
        if (profile.hasPublicSocialPresence === false) {
          disqualificationReasons.push(
            "Requires an active public social media presence on LinkedIn, X (Twitter), or GitHub"
          );
        } else if (profile.socialProfileUrls !== undefined) {
          if (
            Array.isArray(profile.socialProfileUrls) &&
            hasValidSocialProfileUrl(profile.socialProfileUrls)
          ) {
            eligibilityReasons.push(
              "Verified active public presence on LinkedIn, X (Twitter), or GitHub"
            );
          } else {
            disqualificationReasons.push(
              "Social profile URLs must include a valid LinkedIn, X (Twitter), or GitHub profile URL"
            );
          }
        } else if (profile.hasPublicSocialPresence === true) {
          eligibilityReasons.push(
            "Confirmed active public social media presence on LinkedIn, X (Twitter), or GitHub"
          );
        } else {
          pendingVerificationRequirements.push(
            "Verify active public presence on LinkedIn, X (Twitter), or GitHub"
          );
        }
      }

      const verificationStatus: CreditVerificationStatus =
        disqualificationReasons.length > 0
          ? "INELIGIBLE"
          : pendingVerificationRequirements.length > 0
          ? "PRELIMINARY"
          : "VERIFIED";

      const isEligible = verificationStatus === "VERIFIED";

      // Calculate Match Score
      let matchScore = 0;
      if (verificationStatus === "VERIFIED") {
        matchScore = 85;
        const techMatch = profile.techStack.some(
          (t) =>
            program.overview.toLowerCase().includes(t.toLowerCase()) ||
            program.provider.toLowerCase().includes(t.toLowerCase())
        );
        if (techMatch) matchScore += 10;

        if (
          profile.productCategory.toLowerCase().includes("ai") &&
          program.category === "AI_COMPUTE"
        ) {
          matchScore += 5;
        }
        matchScore = Math.min(100, matchScore);
      } else if (verificationStatus === "PRELIMINARY") {
        matchScore = Math.max(
          55,
          75 - pendingVerificationRequirements.length * 3
        );
      } else {
        matchScore = Math.max(10, 50 - disqualificationReasons.length * 15);
      }

      matchedCredits.push({
        program,
        isEligible,
        verificationStatus,
        pendingVerificationRequirements,
        isSelectedForAggregation: verificationStatus !== "INELIGIBLE",
        matchScore,
        maxAdvertisedValueUsd: program.maxCreditValueUsd,
        estimatedValueUsd: 0,
        potentialPreliminaryValueUsd: 0,
        awardedValueUsd: null,
        runwayMonthsAdded: 0,
        dilutionEquivalentPercent: 0,
        eligibilityReasons,
        disqualificationReasons,
      });
    }

    // Resolve mutually exclusive program groups (e.g., Cloudflare Tier 1, Tier 2, Tier 3)
    const groups: Record<string, MatchedCredit[]> = {};
    for (const match of matchedCredits) {
      const groupId = match.program.exclusiveGroupId;
      if (!groupId) continue;
      if (!groups[groupId]) {
        groups[groupId] = [];
      }
      groups[groupId].push(match);
    }

    for (const groupMatches of Object.values(groups)) {
      const verifiedInGroup = groupMatches
        .filter((m) => m.verificationStatus === "VERIFIED")
        .sort((a, b) => b.program.maxCreditValueUsd - a.program.maxCreditValueUsd);

      const preliminaryInGroup = groupMatches.filter(
        (m) => m.verificationStatus === "PRELIMINARY"
      );

      let selectedMatch: MatchedCredit | undefined;

      if (verifiedInGroup.length > 0) {
        // Select the highest-value VERIFIED tier
        selectedMatch = verifiedInGroup[0];
      } else if (preliminaryInGroup.length > 0) {
        // Select the single most plausible PRELIMINARY tier without inflating unverified partner tiers
        if (profile.isPartnerAffiliated === true) {
          const partnerPrelim = [...preliminaryInGroup].sort(
            (a, b) => b.program.maxCreditValueUsd - a.program.maxCreditValueUsd
          );
          if (!hasValidFundingNumber) {
            // When funding amount is unknown, prefer the lower partner tier (Tier 2) over Tier 1
            const nonMinFundingPartner = partnerPrelim.filter(
              (m) => m.program.eligibility.minFundingRaisedUsd === undefined
            );
            selectedMatch =
              nonMinFundingPartner.length > 0
                ? nonMinFundingPartner[0]
                : partnerPrelim[partnerPrelim.length - 1];
          } else {
            selectedMatch = partnerPrelim[0];
          }
        } else {
          // Partner affiliation is unknown or not required: pick the lowest-value plausible PRELIMINARY tier
          const sortedLowToHigh = [...preliminaryInGroup].sort(
            (a, b) => a.program.maxCreditValueUsd - b.program.maxCreditValueUsd
          );
          selectedMatch = sortedLowToHigh[0];
        }
      }

      for (const match of groupMatches) {
        if (selectedMatch && match.program.id === selectedMatch.program.id) {
          match.isSelectedForAggregation = true;
        } else {
          match.isSelectedForAggregation = false;
          if (selectedMatch && match.verificationStatus !== "INELIGIBLE") {
            match.supersededByProgramId = selectedMatch.program.id;
            match.eligibilityReasons.push(
              `Independently ${match.verificationStatus}, but superseded for aggregation by ${selectedMatch.program.name}`
            );
          }
        }
      }
    }

    // Compute per-match financial figures and aggregate totals
    let totalEligiblePrograms = 0;
    let totalPreliminaryPrograms = 0;
    let totalPotentialCreditsUsd = 0;
    let totalPreliminaryPotentialCreditsUsd = 0;
    let stackCostBefore = 0;

    for (const match of matchedCredits) {
      if (match.verificationStatus === "VERIFIED" && match.isSelectedForAggregation) {
        match.estimatedValueUsd = match.program.maxCreditValueUsd;
        match.potentialPreliminaryValueUsd = 0;
        match.runwayMonthsAdded = Number(
          (match.estimatedValueUsd / monthlyBurn).toFixed(1)
        );
        match.dilutionEquivalentPercent = Number(
          ((match.estimatedValueUsd / assumedValuationUsd) * 100).toFixed(2)
        );

        totalEligiblePrograms += 1;
        totalPotentialCreditsUsd += match.estimatedValueUsd;

        if (
          typeof match.program.creditTermMonths === "number" &&
          Number.isFinite(match.program.creditTermMonths) &&
          match.program.creditTermMonths > 0
        ) {
          stackCostBefore = Number(
            (
              stackCostBefore +
              Number((match.estimatedValueUsd / match.program.creditTermMonths).toFixed(2))
            ).toFixed(2)
          );
        }
      } else if (
        match.verificationStatus === "PRELIMINARY" &&
        match.isSelectedForAggregation
      ) {
        match.estimatedValueUsd = 0;
        match.potentialPreliminaryValueUsd = match.program.maxCreditValueUsd;
        match.runwayMonthsAdded = 0;
        match.dilutionEquivalentPercent = 0;

        totalPreliminaryPrograms += 1;
        totalPreliminaryPotentialCreditsUsd += match.potentialPreliminaryValueUsd;
      } else {
        match.estimatedValueUsd = 0;
        match.potentialPreliminaryValueUsd = 0;
        match.runwayMonthsAdded = 0;
        match.dilutionEquivalentPercent = 0;
      }
    }

    // Sort: VERIFIED selected first, then VERIFIED superseded, then PRELIMINARY selected, then PRELIMINARY superseded, then INELIGIBLE
    matchedCredits.sort((a, b) => {
      const rank = (m: MatchedCredit): number => {
        if (m.verificationStatus === "VERIFIED" && m.isSelectedForAggregation) return 4;
        if (m.verificationStatus === "VERIFIED") return 3;
        if (m.verificationStatus === "PRELIMINARY" && m.isSelectedForAggregation) return 2;
        if (m.verificationStatus === "PRELIMINARY") return 1;
        return 0;
      };
      const rankDiff = rank(b) - rank(a);
      if (rankDiff !== 0) return rankDiff;
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      return b.program.maxCreditValueUsd - a.program.maxCreditValueUsd;
    });

    const totalRunwayExtension = Number(
      (totalPotentialCreditsUsd / monthlyBurn).toFixed(1)
    );
    const dilutionSaved = Number(
      ((totalPotentialCreditsUsd / assumedValuationUsd) * 100).toFixed(2)
    );

    const report: CreditMatchingReport = {
      profile,
      totalEligiblePrograms,
      totalPreliminaryPrograms,
      totalPotentialCreditsUsd,
      totalPreliminaryPotentialCreditsUsd,
      totalAwardedCreditsUsd: null,
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
        eligiblePrograms: totalEligiblePrograms,
        preliminaryPrograms: totalPreliminaryPrograms,
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
    const stageStr = profile.fundingStage || "EARLY_STAGE";
    const fundingStr =
      typeof profile.totalFundingRaisedUsd === "number" &&
      Number.isFinite(profile.totalFundingRaisedUsd) &&
      profile.totalFundingRaisedUsd >= 0
        ? `$${profile.totalFundingRaisedUsd.toLocaleString()} raised`
        : "funding details available upon verification";

    for (const q of program.sampleQuestions) {
      if (q.id === "traction") {
        answers[q.id] = `${profile.companyName} is in ${stageStr} stage with ${fundingStr}. Our product (${profile.tagline}) addresses ${profile.productCategory} with an active monthly burn of $${profile.monthlyBurnRateUsd.toLocaleString()}/mo.`;
      } else if (
        q.id === "use_case" ||
        q.id === "architecture" ||
        q.id === "ai_model" ||
        q.id === "cloud_stack"
      ) {
        answers[q.id] = `Our architecture is built on ${profile.techStack.join(", ")}. We plan to deploy ${program.provider} to power our production pipelines, monitor real-time AI latency, and scale to thousands of daily autonomous operations with zero infrastructure bottlenecks.`;
      } else if (q.id === "scalability" || q.id === "market_opportunity") {
        answers[q.id] = `${profile.companyName} targets ${profile.productCategory}. By reducing manual overhead through verified automation, we enable customers to operate with full financial confidence and measurable ROI. ${program.name} could extend our potential runway by up to ${Number((program.maxCreditValueUsd / (profile.monthlyBurnRateUsd || 5000)).toFixed(1))} months if approved.`;
      } else if (q.id === "academic_status") {
        answers[q.id] = `Enrolled at ${profile.universityName || "Accredited University"} with active student status verified via ${profile.studentEmail || "student edu email"}.`;
      } else if (q.id === "agentic_flow") {
        answers[q.id] = `${profile.companyName} executes autonomous web transactions under user-defined budget ceilings. We use PayPal sandbox APIs, dual-rail transaction cascades, and digital receipts to guarantee payment safety.`;
      } else {
        answers[q.id] = `${profile.description} Built using ${profile.techStack.join(", ")}. Applying for ${program.name} directly supports our production roadmap.`;
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
