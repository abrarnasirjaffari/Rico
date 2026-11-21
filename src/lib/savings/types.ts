export type UserPersona = "STARTUP_FOUNDER" | "STUDENT" | "DEVELOPER_SMB";

export type SavingsDealType =
  | "STARTUP_CREDITS"
  | "STUDENT_DISCOUNT"
  | "ACTIVE_COUPON"
  | "ANNUAL_ARBITRAGE";

export type DealVerificationStatus =
  | "ELIGIBLE"
  | "VERIFICATION_REQUIRED"
  | "INELIGIBLE";

export interface SavingsEligibilityRequirements {
  requiresPartnerAffiliation?: boolean;
  maxEmployeesExclusive?: number;
  requiresNonPayingCustomer?: boolean;
  requiresWorkspaceAdmin?: boolean;
  requiresPartnerLinkOrCode?: boolean;
  maxDurationMonths?: number;
}

export interface SavingsEligibilityContext {
  isPartnerAffiliated?: boolean;
  employeeCount?: number;
  isCurrentlyPayingCustomer?: boolean;
  isWorkspaceAdmin?: boolean;
  hasPartnerLinkOrCode?: boolean;
}

export interface DealEligibilityEvaluation {
  isEligible: boolean;
  verificationStatus: DealVerificationStatus;
  disqualificationReasons: string[];
  missingRequirements: string[];
}

export interface PersonaSavingsDeal {
  id: string;
  service: string;
  serviceKey: string;
  persona: UserPersona;
  dealType: SavingsDealType;
  headline: string;
  regularPrice: number;
  discountedPrice: number;
  reclaimedCreditValue: number;
  savingsPercentage: number;
  couponCode?: string;
  claimUrl: string;
  badge: string;
  description: string;
  eligibilityCriteria: string;
  instructions: string;
  eligibilityRequirements?: SavingsEligibilityRequirements;
}

export interface SavingsAdvisoryData {
  service: string;
  persona: UserPersona;
  originalPrice: number;
  discountedPrice: number;
  reclaimedCredits: number;
  savingsEnforced: number;
  currency: string;
  appliedDealHeadline: string;
  couponCode?: string;
  claimUrl: string;
  dealType: SavingsDealType;
  timestamp: string;
  verificationStatus?: DealVerificationStatus;
  disqualificationReasons?: string[];
  missingRequirements?: string[];
}

export interface SavingsProbeResult {
  service: string;
  persona: UserPersona;
  hasDeals: boolean;
  deals: PersonaSavingsDeal[];
  bestDeal?: PersonaSavingsDeal;
  originalPrice: number;
  discountedPrice: number;
  reclaimedCredits: number;
  directSavings: number;
  recommendation: string;
  advisory?: SavingsAdvisoryData;
  verificationStatus?: DealVerificationStatus;
  disqualificationReasons?: string[];
  missingRequirements?: string[];
}
