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
      <DialogContent className="sm:max-w-md bg-white border border-[#DCE7F3] text-[#0F172A] rounded-2xl shadow-[0_12px_36px_rgba(15,23,42,0.1)]">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold tracking-tight text-[#0F172A]">
            {request.confirmToken ? "Confirm payment" : "Approval required"}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#52637A]">
            {request.confirmToken
              ? "Review the verified amount below. Nothing is charged until you confirm."
              : "A safety guardrail paused this charge for your review."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          <div className="p-3 bg-[#FAFBFD] border border-[#E2ECF6] rounded-xl text-[#334155] leading-relaxed">
            {request.reason}
          </div>

          <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2ECF6] space-y-2.5">
            <div className="flex justify-between items-center text-[#52637A]">
              <span>Service</span>
              <span className="font-medium text-[#0F172A]">{request.service}</span>
            </div>
            <div className="flex justify-between items-baseline text-[#52637A]">
              <span>Verified amount</span>
              <span className="font-semibold text-[#0F172A] text-sm font-mono tabular-nums">
                ${request.detectedPrice.toFixed(2)} {request.currency}
              </span>
            </div>
            <div className="flex justify-between items-baseline text-[#52637A]">
              <span>Rule cap</span>
              <span className="text-[#0F172A] font-mono tabular-nums">
                ${request.budgetCeiling.toFixed(2)} {request.currency}
              </span>
            </div>
            {request.periodLabel && (
              <div className="flex justify-between items-center text-[#52637A]">
                <span>Billing period</span>
                <span className="text-[#0F172A] font-mono">{request.periodLabel}</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="sm:justify-between border-t border-[#EDF3FA] pt-3.5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onReject}
            className="h-9 px-3.5 rounded-lg border border-[#DCE7F3] bg-white text-[#52637A] hover:text-[#0F172A] hover:bg-[#F5F8FC] text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onApprove("BACKUP_CARD")}
              className="h-9 px-3.5 rounded-lg border border-[#DCE7F3] bg-[#F5F8FC] hover:bg-[#EBF2FB] text-[#0F172A] text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
            >
              Visa •••• 4242
            </button>

            <button
              type="button"
              onClick={() => onApprove("PAYPAL")}
              className="h-9 px-4 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-medium transition-colors duration-150 flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Confirm with PayPal</span>
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
