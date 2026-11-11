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
import { Check, X } from "lucide-react";

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
      <DialogContent className="sm:max-w-md bg-[#F6FAFF] border border-[#BFD7F7] text-[#0F172A] shadow-xl font-[Inter,system-ui,sans-serif]">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-[#0F172A]">
            {request.confirmToken ? "Confirm Payment" : "Manual Approval Required"}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#52637A]">
            {request.confirmToken
              ? "Review the details below. Nothing is charged until you approve."
              : "Safety guardrail paused execution for review"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
            <p className="font-bold mb-1">Reason for Hold:</p>
            <p className="text-[#334155]">{request.reason}</p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-[#C8DDF8] space-y-2 shadow-2xs">
            <div className="flex justify-between items-center text-[#52637A]">
              <span>Service</span>
              <span className="font-semibold text-[#0F172A]">{request.service}</span>
            </div>
            <div className="flex justify-between items-center text-[#52637A]">
              <span>Verified Web Price</span>
              <span className="font-bold text-[#0F172A] text-sm font-mono">
                ${request.detectedPrice.toFixed(2)} {request.currency}
              </span>
            </div>
            <div className="flex justify-between items-center text-[#52637A]">
              <span>Authorized Ceiling</span>
              <span className="text-[#0F172A] font-mono">
                ${request.budgetCeiling.toFixed(2)} {request.currency}
              </span>
            </div>
            {request.periodLabel && (
              <div className="flex justify-between items-center text-[#52637A]">
                <span>Billing Period</span>
                <span className="text-[#0F172A] font-mono">{request.periodLabel}</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="sm:justify-between border-t border-[#D6E8FD] pt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onReject}
            className="h-8 px-3 rounded-lg border border-[#BFD7F7] bg-white text-[#52637A] hover:bg-[#E2EEFD] text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Decline &amp; Cancel</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onApprove("BACKUP_CARD")}
              className="h-8 px-3 rounded-lg bg-blue-600 text-white hover:bg-blue-500 text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <span>Route to Visa (•••• 4242)</span>
            </button>

            <button
              type="button"
              onClick={() => onApprove("PAYPAL")}
              className="h-8 px-3.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Approve (PayPal)</span>
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
