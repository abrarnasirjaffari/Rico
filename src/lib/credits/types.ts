export type FundingStage =
  | "BOOTSTRAPPED"
  | "PRE_SEED"
  | "SEED"
  | "SERIES_A"
  | "SERIES_B";

export type ProgramCategory =
  | "CLOUD"
  | "ANALYTICS"
  | "AI_COMPUTE"
  | "PAYMENT_PROCESSING"
  | "PRODUCTIVITY"
  | "DEVTOOLS"
  | "EDUCATION";

export type CreditVerificationStatus =
  | "VERIFIED"
  | "PRELIMINARY"
  | "INELIGIBLE";

export interface FounderProfile {
  name: string;
  companyName: string;
  websiteUrl?: string;
  foundedYear?: number;
  incorporatedDate?: string; // ISO YYYY-MM-DD
  fundingStage?: FundingStage;
  totalFundingRaisedUsd?: number;
  lastFundingDate?: string; // ISO YYYY-MM-DD
  monthlyBurnRateUsd: number;
  cashRunwayMonths?: number;
  techStack: string[];
  productCategory: string;
  tagline: string;
  description: string;
  isStudentFounder?: boolean;
  universityName?: string;
  studentEmail?: string;
  isBootstrappedOrSelfFunded?: boolean;
  isPartnerAffiliated?: boolean;
  isTechnologyProduct?: boolean;
  isForProfitBusiness?: boolean;
  isExistingEnterpriseCustomer?: boolean;
  businessEmail?: string;
  hasPublicSocialPresence?: boolean;
  socialProfileUrls?: string[];
  hasPreviouslyRedeemedProgramIds?: string[];
}

export interface CreditProgram {
  id: string;
  name: string;
  provider: string;
  category: ProgramCategory;
  maxCreditValueUsd: number;
  creditTermMonths?: number;
  programUrl: string;
  badge: string;
  tierName?: string;
  exclusiveGroupId?: string;
  serviceCaps?: string[];
  excludedServices?: string[];
  termsAndBillingNotes?: string[];
  eligibility: {
    maxCompanyAgeYears?: number;
    requiresExactIncorporationDateAtBoundary?: boolean;
    minFundingRaisedUsd?: number;
    maxFundingRaisedUsd?: number;
    strictMaxFundingRaised?: boolean;
    allowedStages?: FundingStage[];
    requiresWebsite?: boolean;
    requiresEduEmail?: boolean;
    requiresBootstrappedOrSelfFunded?: boolean;
    requiresPartnerAffiliation?: boolean;
    requiresFundingWithinMonths?: number;
    requiresFirstTimeRedemption?: boolean;
    requiresTechnologyProduct?: boolean;
    requiresForProfitBusiness?: boolean;
    requiresDomainMatchedBusinessEmail?: boolean;
    requiresSocialPresence?: boolean;
    disallowsExistingEnterpriseCustomer?: boolean;
  };
  overview: string;
  sampleQuestions: Array<{
    id: string;
    question: string;
    guideline: string;
  }>;
}

export interface MatchedCredit {
  program: CreditProgram;
  isEligible: boolean;
  verificationStatus: CreditVerificationStatus;
  pendingVerificationRequirements: string[];
  isSelectedForAggregation: boolean;
  supersededByProgramId?: string;
  matchScore: number; // 0 to 100
  maxAdvertisedValueUsd: number;
  estimatedValueUsd: number;
  potentialPreliminaryValueUsd: number;
  awardedValueUsd: number | null;
  runwayMonthsAdded: number;
  dilutionEquivalentPercent: number;
  eligibilityReasons: string[];
  disqualificationReasons: string[];
}

export interface CreditPitchDraft {
  programId: string;
  programName: string;
  answers: Record<string, string>;
  oneLinerPitch: string;
  readinessScore: number;
  generatedAt: string;
}

export interface CreditMatchingReport {
  profile: FounderProfile;
  totalEligiblePrograms: number;
  totalPreliminaryPrograms: number;
  totalPotentialCreditsUsd: number;
  totalPreliminaryPotentialCreditsUsd: number;
  totalAwardedCreditsUsd: number | null;
  runwayExtensionMonths: number;
  dilutionSavedPercent: number;
  topMatches: MatchedCredit[];
  stackCostBeforeCreditsUsd: number;
  stackCostAfterCreditsUsd: number;
  generatedAt: string;
}
