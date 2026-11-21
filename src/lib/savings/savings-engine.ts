import { db, auditLogs, mandates } from "@/db";
import { and, eq } from "drizzle-orm";
import { executeMandatePayment, type PayPalReceipt } from "@/lib/paypal";
import { executeAtomicPaymentTransaction } from "@/lib/safety/atomic-transaction";
import { mandatePeriodKey } from "@/lib/safety/billing-period";
import { posthogServer } from "@/lib/telemetry/posthog-server";
import { PERSONA_DEALS_MATRIX } from "./deal-matrix";
import {
  UserPersona,
  PersonaSavingsDeal,
  SavingsProbeResult,
  SavingsAdvisoryData,
  SavingsEligibilityContext,
  DealEligibilityEvaluation,
} from "./types";

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

export class PersonaSavingsOptimizer {
  private activePersona: UserPersona = "STARTUP_FOUNDER";

  public getActivePersona(): UserPersona {
    return this.activePersona;
  }

  public setActivePersona(persona: UserPersona): void {
    this.activePersona = persona;
  }

  /**
   * Finds all deals matching a merchant service name and user persona
   */
  public findDeals(serviceName: string, persona: UserPersona = this.activePersona): PersonaSavingsDeal[] {
    const term = serviceName.toLowerCase().trim();

    return PERSONA_DEALS_MATRIX.filter((deal) => {
      const matchesPersona = deal.persona === persona;
      const matchesService =
        term.includes(deal.serviceKey) ||
        deal.serviceKey.includes(term) ||
        deal.service.toLowerCase().includes(term);

      return matchesPersona && matchesService;
    });
  }

  /**
   * Evaluates structured eligibility requirements for a deal against provided context.
   * If a deal defines no structured requirements, it is treated as ELIGIBLE.
   */
  public evaluateDealEligibility(
    deal: PersonaSavingsDeal,
    context?: SavingsEligibilityContext
  ): DealEligibilityEvaluation {
    const req = deal.eligibilityRequirements;
    if (!req) {
      return {
        isEligible: true,
        verificationStatus: "ELIGIBLE",
        disqualificationReasons: [],
        missingRequirements: [],
      };
    }

    const disqualificationReasons: string[] = [];
    const missingRequirements: string[] = [];

    // 1. Partner affiliation requirement
    if (req.requiresPartnerAffiliation) {
      if (context?.isPartnerAffiliated === false) {
        disqualificationReasons.push(
          "Startup must be affiliated with an official program partner"
        );
      } else if (context?.isPartnerAffiliated !== true) {
        missingRequirements.push(
          "Verify affiliation with an official program partner"
        );
      }
    }

    // 2. Employee count limit (strictly below threshold)
    if (req.maxEmployeesExclusive !== undefined) {
      const count = context?.employeeCount;
      if (count === undefined) {
        missingRequirements.push(
          `Confirm employee count is fewer than ${req.maxEmployeesExclusive}`
        );
      } else if (typeof count !== "number" || !Number.isFinite(count) || count < 0) {
        disqualificationReasons.push(
          "Invalid employee count provided"
        );
      } else if (count >= req.maxEmployeesExclusive) {
        disqualificationReasons.push(
          `Company has ${count} employees (must have fewer than ${req.maxEmployeesExclusive})`
        );
      }
    }

    // 3. Non-paying customer requirement
    if (req.requiresNonPayingCustomer) {
      if (context?.isCurrentlyPayingCustomer === true) {
        disqualificationReasons.push(
          "Offer is only valid for non-paying users"
        );
      } else if (context?.isCurrentlyPayingCustomer !== false) {
        missingRequirements.push(
          "Confirm account is currently a non-paying user"
        );
      }
    }

    // 4. Workspace admin role requirement
    if (req.requiresWorkspaceAdmin) {
      if (context?.isWorkspaceAdmin === false) {
        disqualificationReasons.push(
          "Redemption must be completed by a workspace admin"
        );
      } else if (context?.isWorkspaceAdmin !== true) {
        missingRequirements.push(
          "Confirm redeeming user is a workspace admin"
        );
      }
    }

    // 5. Dedicated partner link or code requirement
    if (req.requiresPartnerLinkOrCode) {
      if (context?.hasPartnerLinkOrCode === false) {
        disqualificationReasons.push(
          "Redemption requires a dedicated partner link or partner code"
        );
      } else if (context?.hasPartnerLinkOrCode !== true) {
        missingRequirements.push(
          "Obtain dedicated partner redemption link or partner code"
        );
      }
    }

    if (disqualificationReasons.length > 0) {
      return {
        isEligible: false,
        verificationStatus: "INELIGIBLE",
        disqualificationReasons,
        missingRequirements,
      };
    }

    if (missingRequirements.length > 0) {
      return {
        isEligible: false,
        verificationStatus: "VERIFICATION_REQUIRED",
        disqualificationReasons: [],
        missingRequirements,
      };
    }

    return {
      isEligible: true,
      verificationStatus: "ELIGIBLE",
      disqualificationReasons: [],
      missingRequirements: [],
    };
  }

  /**
   * Pre-payment savings probe: checks credit databases and active coupons
   * before a PayPal payment is authorized or captured.
   */
  public async probePersonaSavings(params: {
    serviceName: string;
    currentPrice: number;
    persona?: UserPersona;
    mandateId?: string;
    eligibilityContext?: SavingsEligibilityContext;
  }): Promise<SavingsProbeResult> {
    const persona = params.persona || this.activePersona;
    const { serviceName, currentPrice, eligibilityContext } = params;

    const matchedDeals = this.findDeals(serviceName, persona);

    if (matchedDeals.length === 0) {
      return {
        service: serviceName,
        persona,
        hasDeals: false,
        deals: [],
        originalPrice: currentPrice,
        discountedPrice: currentPrice,
        reclaimedCredits: 0,
        directSavings: 0,
        recommendation: `No specific ${persona} subsidies or active coupons found for ${serviceName}. Charging standard verified price $${currentPrice.toFixed(
          2
        )}.`,
      };
    }

    // Sort to pick best deal (highest credit value or highest percentage discount)
    const sorted = [...matchedDeals].sort((a, b) => {
      if (b.reclaimedCreditValue !== a.reclaimedCreditValue) {
        return b.reclaimedCreditValue - a.reclaimedCreditValue;
      }
      return b.savingsPercentage - a.savingsPercentage;
    });

    const bestDeal = sorted[0];
    const evaluation = this.evaluateDealEligibility(bestDeal, eligibilityContext);

    let discountedPrice = currentPrice;
    let directSavings = 0;
    let reclaimedCredits = 0;
    let recommendation = "";

    if (evaluation.verificationStatus === "ELIGIBLE") {
      discountedPrice = Math.min(currentPrice, bestDeal.discountedPrice);
      directSavings = Number(Math.max(0, currentPrice - discountedPrice).toFixed(2));
      reclaimedCredits = bestDeal.reclaimedCreditValue;

      if (bestDeal.dealType === "STARTUP_CREDITS") {
        if (reclaimedCredits > 0) {
          recommendation = `💡 WAIT! Before paying $${currentPrice.toFixed(
            2
          )}/mo, you qualify for ${bestDeal.headline}! You can claim up to $${reclaimedCredits.toLocaleString()} in credits and waive this charge entirely.`;
        } else {
          recommendation = `💡 WAIT! Before paying $${currentPrice.toFixed(
            2
          )}/mo, you qualify for ${bestDeal.headline}! Verified eligible rate drops from $${currentPrice.toFixed(
            2
          )} to $${discountedPrice.toFixed(2)}/mo (Saving $${directSavings.toFixed(2)}/mo).`;
        }
      } else if (bestDeal.dealType === "STUDENT_DISCOUNT") {
        recommendation = `🎓 Student Perk Detected: You qualify for ${bestDeal.headline}. Verified price drops from $${currentPrice.toFixed(
          2
        )} to $${discountedPrice.toFixed(2)}/mo (Saving $${directSavings.toFixed(2)}/mo).`;
      } else {
        recommendation = `🏷️ Promo/Arbitrage Applied: ${bestDeal.headline}. Price discounted to $${discountedPrice.toFixed(
          2
        )} (Saving $${directSavings.toFixed(2)}).`;
      }
    } else if (evaluation.verificationStatus === "VERIFICATION_REQUIRED") {
      recommendation = `📋 Verification Required for ${bestDeal.headline}: Not universally available. To qualify, you must confirm: ${evaluation.missingRequirements.join(
        "; "
      )}. Standard price remains $${currentPrice.toFixed(2)}.`;
    } else {
      recommendation = `⚠️ Ineligible for ${bestDeal.headline}: ${evaluation.disqualificationReasons.join(
        "; "
      )}. Charging standard price $${currentPrice.toFixed(2)}.`;
    }

    const advisory: SavingsAdvisoryData = {
      service: serviceName,
      persona,
      originalPrice: currentPrice,
      discountedPrice,
      reclaimedCredits,
      savingsEnforced: directSavings,
      currency: "USD",
      appliedDealHeadline: bestDeal.headline,
      couponCode: bestDeal.couponCode,
      claimUrl: bestDeal.claimUrl,
      dealType: bestDeal.dealType,
      timestamp: new Date().toISOString(),
      verificationStatus: evaluation.verificationStatus,
      disqualificationReasons:
        evaluation.disqualificationReasons.length > 0
          ? evaluation.disqualificationReasons
          : undefined,
      missingRequirements:
        evaluation.missingRequirements.length > 0
          ? evaluation.missingRequirements
          : undefined,
    };

    // Telemetry: Log pre-payment savings intercept event to PostHog
    await posthogServer.capture({
      event: "savings_intercept_triggered",
      properties: {
        service: serviceName,
        persona,
        original_price: currentPrice,
        discounted_price: discountedPrice,
        dollars_saved: directSavings,
        reclaimed_credits: reclaimedCredits,
        deal_id: bestDeal.id,
        verification_status: evaluation.verificationStatus,
      },
    });

    // Persistent audit log
    await db.insert(auditLogs).values({
      id: generateId("log"),
      mandateId: params.mandateId,
      eventType: "PRICE_VERIFIED",
      service: serviceName,
      details: `Pre-Payment Savings Probe: Intercepted ${serviceName}. Found deal: ${bestDeal.headline} (Status: ${evaluation.verificationStatus}, Reclaimed: $${reclaimedCredits.toLocaleString()}, Discounted to: $${discountedPrice.toFixed(
        2
      )}).`,
      severity: evaluation.verificationStatus === "ELIGIBLE" ? "success" : "info",
      metadata: {
        dealId: bestDeal.id,
        persona,
        originalPrice: currentPrice,
        discountedPrice,
        reclaimedCredits,
        verificationStatus: evaluation.verificationStatus,
        disqualificationReasons: evaluation.disqualificationReasons,
        missingRequirements: evaluation.missingRequirements,
      },
    });

    return {
      service: serviceName,
      persona,
      hasDeals: evaluation.verificationStatus === "ELIGIBLE",
      deals: matchedDeals,
      bestDeal,
      originalPrice: currentPrice,
      discountedPrice,
      reclaimedCredits,
      directSavings,
      recommendation,
      advisory,
      verificationStatus: evaluation.verificationStatus,
      disqualificationReasons:
        evaluation.disqualificationReasons.length > 0
          ? evaluation.disqualificationReasons
          : undefined,
      missingRequirements:
        evaluation.missingRequirements.length > 0
          ? evaluation.missingRequirements
          : undefined,
    };
  }

  /**
   * Executes PayPal capture for the discounted amount and saves savings audit record.
   * The amount, deal and ceiling all come from server data; the client's price is only compared.
   */
  public async applySavingsPayment(params: {
    serviceName: string;
    discountedPrice: number;
    mandateId?: string;
    dealId?: string;
    fundingRail?: "PAYPAL" | "VISA" | "MASTERCARD" | "AUTO";
    /** The verified user paying. Never taken from the request body. */
    ownerId: string;
  }): Promise<{
    success: boolean;
    orderId: string;
    captureId: string;
    receipt: PayPalReceipt;
    dollarsSaved: number;
    message: string;
  }> {
    const { serviceName, mandateId, fundingRail, dealId, ownerId } = params;

    const candidates = mandateId
      ? await db.select().from(mandates).where(and(eq(mandates.id, mandateId), eq(mandates.ownerId, ownerId))).limit(1)
      : (await db.select().from(mandates).where(and(eq(mandates.status, "ACTIVE"), eq(mandates.ownerId, ownerId)))).filter(
          (m) => m.service.toLowerCase() === serviceName.toLowerCase()
        );
    if (candidates.length !== 1) {
      throw new Error(`GUARDRAIL BLOCKED: Could not identify one mandate for ${serviceName}.`);
    }
    const mandate = candidates[0];

    const matchedDeal = dealId
      ? PERSONA_DEALS_MATRIX.find((d) => d.id === dealId)
      : [...this.findDeals(mandate.service)].sort(
          (a, b) => b.reclaimedCreditValue - a.reclaimedCreditValue
        )[0];
    const term = mandate.service.toLowerCase();
    if (!matchedDeal || !term.includes(matchedDeal.serviceKey)) {
      throw new Error(`GUARDRAIL BLOCKED: No valid savings deal applies to ${mandate.service}.`);
    }

    const originalPrice =
      mandate.lastScrapedPrice > 0 ? mandate.lastScrapedPrice : matchedDeal.regularPrice;
    const discountedPrice = Math.min(originalPrice, matchedDeal.discountedPrice);
    if (discountedPrice <= 0) {
      throw new Error(`GUARDRAIL BLOCKED: ${matchedDeal.headline} requires no payment.`);
    }
    if (Math.abs(discountedPrice - params.discountedPrice) >= 0.005) {
      throw new Error(
        `GUARDRAIL BLOCKED: Requested $${params.discountedPrice.toFixed(2)} does not match server price $${discountedPrice.toFixed(2)}.`
      );
    }

    const budgetCeiling = mandate.budgetCeiling;
    const dollarsSaved = Number(Math.max(0, originalPrice - discountedPrice).toFixed(2));
    // Shares the mandate's billing-period key with every other payment path, so applying a deal
    // can never add a second charge for the same period.
    const idempotencyKey = mandatePeriodKey(mandate);

    // 1. Reserve, capture and record through the guarded payment path
    const atomicResult = await executeAtomicPaymentTransaction({
      mandateId: mandate.id,
      ownerId,
      orderId: `ORD-${Date.now()}`,
      idempotencyKey,
      serviceName: mandate.service,
      amount: discountedPrice,
      budgetCeiling,
      allowedMandateStatuses: ["ACTIVE"],
      auditDetails: `Savings Applied: Paid discounted total of $${discountedPrice.toFixed(
        2
      )} (Saved $${dollarsSaved.toFixed(2)} via ${matchedDeal.headline}).`,
      auditMetadata: { discountedPrice, originalPrice, dollarsSaved, dealId: matchedDeal.id },
      executePaymentFn: async () => {
        const payment = await executeMandatePayment({
          serviceName: mandate.service,
          verifiedPrice: discountedPrice,
          budgetCeiling,
          mandateId: mandate.id,
          fundingRail: fundingRail || "PAYPAL",
          paymentAttemptKey: idempotencyKey,
        });
        return {
          ...payment,
          receipt: {
            ...payment.receipt,
            savingsEnforced: dollarsSaved,
            claimedCredits: matchedDeal.reclaimedCreditValue,
          },
        };
      },
    });

    if (!atomicResult.success) {
      throw new Error(atomicResult.message);
    }

    const paymentResult = {
      orderId: atomicResult.orderId,
      captureId: atomicResult.captureId || "",
      receipt: atomicResult.receiptData as unknown as PayPalReceipt,
    };

    // 5. Telemetry
    await posthogServer.trackPaymentCompleted({
      service: mandate.service,
      amount: discountedPrice,
      orderId: paymentResult.orderId,
      budgetCeiling,
      savingsEnforced: dollarsSaved,
      paymentMethod:
        paymentResult.receipt.fundingRail === "PAYPAL"
          ? "PayPal Sandbox Wallet (Discount Applied)"
          : "Vaulted Card (Discount Applied)",
    });

    return {
      success: true,
      orderId: paymentResult.orderId,
      captureId: paymentResult.captureId,
      receipt: paymentResult.receipt,
      dollarsSaved,
      message: `Discounted payment captured: $${discountedPrice.toFixed(
        2
      )} paid via PayPal (Reclaimed $${dollarsSaved.toFixed(2)} in savings!).`,
    };
  }
}

export const personaSavingsOptimizer = new PersonaSavingsOptimizer();
