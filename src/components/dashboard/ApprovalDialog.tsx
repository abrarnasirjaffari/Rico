"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Check } from "lucide-react";
import { formatFiat } from "@/lib/format-number";

export interface ApprovalRequest {
  id: string;
  service: string;
  detectedPrice: number;
  budgetCeiling: number;
  reason: string;
  currency: string;
  baselinePrice?: number;
  spikePercentage?: number;
  fundingRail?: "PAYPAL" | "VISA" | "MASTERCARD";
  anomalyType?: "PRICE_SPIKE" | "STRICT_MODE" | "BUDGET_CEILING_EXCEEDED";
  riskLevel?: "warning" | "danger" | "critical";
  /** Server-signed confirmation for a quoted payment. Only this lets the server charge. */
  confirmToken?: string;
  mandateId?: string;
  periodLabel?: string;
}

interface ApprovalDialogProps {
  request: ApprovalRequest | null;
  isOpen: boolean;
  onApprove: (fundingSource?: "PAYPAL" | "BACKUP_CARD") => void;
  onReject: () => void;
}

export function ApprovalDialog({
  request,
  isOpen,
  onApprove,
  onReject,
}: ApprovalDialogProps) {
  if (!request) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onReject()}>
      <DialogContent className="sm:max-w-md bg-[var(--rico-surface-elevated)] border border-[var(--rico-border-weak)] text-[var(--rico-text-strong)] rounded-xl shadow-[0_12px_32px_rgba(30,27,27,0.12)]">
        <DialogHeader>
          <DialogTitle className="text-[16px] font-semibold tracking-[-0.015em] text-[var(--rico-text-strong)]">
            {request.confirmToken ? "Confirm payment" : "Approval required"}
          </DialogTitle>
          <DialogDescription className="text-[13px] text-[var(--rico-text-base)]">
            {request.confirmToken
              ? "Review the verified quote below. Nothing is charged until you confirm."
              : "A spending guardrail held this charge for your review."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-[13px]">
          <div className="p-3.5 rounded-lg bg-[var(--rico-bg-base)] border border-[var(--rico-border-weak)] text-[var(--rico-text-strong)] leading-relaxed">
            {request.reason}
          </div>

          <div className="rounded-lg border border-[var(--rico-border-weak)] bg-[var(--rico-surface-elevated)] divide-y divide-[var(--rico-surface-base)]">
            <div className="px-4 py-2.5 flex justify-between items-center gap-3">
              <span className="text-[var(--rico-text-base)]">Vendor</span>
              <span className="font-medium text-[var(--rico-text-strong)]">
                {request.service}
              </span>
            </div>

            <div className="px-4 py-2.5 flex justify-between items-baseline gap-3">
              <span className="text-[var(--rico-text-base)]">Verified amount</span>
              <span className="font-semibold text-[15px] font-mono tabular-nums text-[var(--rico-text-strong)]">
                {formatFiat(request.detectedPrice)} {request.currency}
              </span>
            </div>

            <div className="px-4 py-2.5 flex justify-between items-baseline gap-3">
              <span className="text-[var(--rico-text-base)]">Rule cap</span>
              <span className="font-mono tabular-nums text-[var(--rico-text-base)]">
                {formatFiat(request.budgetCeiling)} {request.currency}
              </span>
            </div>

            {request.periodLabel && (
              <div className="px-4 py-2.5 flex justify-between items-center gap-3">
                <span className="text-[var(--rico-text-base)]">Billing period</span>
                <span className="font-mono tabular-nums text-[12.5px] text-[var(--rico-text-strong)]">
                  {request.periodLabel}
                </span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="sm:justify-between border-t border-[var(--rico-border-weak)] pt-3.5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onReject}
            className="min-h-[40px] sm:min-h-0 sm:h-9 px-3.5 rounded-lg border border-[var(--rico-border-base)] bg-[var(--rico-surface-elevated)] hover:bg-[var(--rico-bg-base)] text-[13px] font-medium text-[var(--rico-text-base)] hover:text-[var(--rico-text-strong)] transition-colors duration-100 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/35"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onApprove("BACKUP_CARD")}
              className="min-h-[40px] sm:min-h-0 sm:h-9 px-3.5 rounded-lg border border-[var(--rico-border-base)] bg-[var(--rico-bg-base)] hover:bg-[var(--rico-surface-base)] active:translate-y-px text-[13px] font-medium text-[var(--rico-text-strong)] transition-colors duration-100 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/35"
            >
              Visa •••• 4242
            </button>

            <button
              type="button"
              onClick={() => onApprove("PAYPAL")}
              className="min-h-[40px] sm:min-h-0 sm:h-9 px-4 rounded-lg bg-[var(--rico-primary-bg)] text-[var(--rico-primary-fg)] hover:opacity-90 active:translate-y-px text-[13px] font-medium inline-flex items-center gap-1.5 transition-opacity duration-100 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/40"
            >
              <Check className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Confirm with PayPal</span>
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
