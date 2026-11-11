"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Receipt,
  CheckCircle2,
  Copy,
  Check,
  Download,
} from "lucide-react";

export interface ReceiptData {
  orderId: string;
  service: string;
  planName: string;
  verifiedPrice: number;
  budgetCeiling: number;
  currency: string;
  paymentMethod: string;
  status: string;
  timestamp: string;
  payerEmail: string;
  sandboxAuthCode: string;
  fundingRail?: "PAYPAL" | "VISA" | "MASTERCARD";
  cardLastFour?: string;
  routedGateway?: string;
  isCascaded?: boolean;
}

interface ReceiptDialogProps {
  receipt: ReceiptData | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ReceiptDialog({ receipt, isOpen, onClose }: ReceiptDialogProps) {
  const [copied, setCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!receipt) return null;

  const handleCopy = () => {
    navigator.clipboard?.writeText(receipt.orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleDownload = () => {
    const receiptContent = `RICO — OFFICIAL AUTONOMOUS PAYMENT RECEIPT
Order ID:          ${receipt.orderId}
Status:            ${receipt.status}
Merchant:          ${receipt.service}
Plan:              ${receipt.planName}
Verified Price:    $${receipt.verifiedPrice.toFixed(2)} ${receipt.currency}
Budget Ceiling:    $${receipt.budgetCeiling.toFixed(2)} ${receipt.currency}
Payment Method:    ${receipt.paymentMethod}
Authorization:     ${receipt.sandboxAuthCode}
Timestamp:         ${receipt.timestamp}
Payer:             ${receipt.payerEmail}
`;

    const blob = new Blob([receiptContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Rico-Receipt-${receipt.orderId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2000);
  };

  const savings = Math.max(0, receipt.budgetCeiling - receipt.verifiedPrice);
  const railText =
    receipt.fundingRail === "VISA"
      ? `Visa •••• ${receipt.cardLastFour || "4242"}`
      : receipt.fundingRail === "MASTERCARD"
      ? `Mastercard •••• ${receipt.cardLastFour || "4444"}`
      : "PayPal Primary";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-white border border-[#DCE7F3] text-[#0F172A] p-6 space-y-4 rounded-2xl shadow-[0_12px_36px_rgba(15,23,42,0.1)]">
        <DialogHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#EDF3FA] flex items-center justify-center text-[#0F172A]">
                <Receipt className="w-4 h-4" />
              </div>
              <DialogTitle className="text-base font-semibold tracking-tight text-[#0F172A]">
                Payment receipt
              </DialogTitle>
            </div>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-medium px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Captured</span>
            </span>
          </div>
          <DialogDescription className="text-xs text-[#52637A]">
            Verified and recorded via PayPal Sandbox MCP.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-xs">
          <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2ECF6] space-y-2.5">
            <div className="flex justify-between items-center text-[#52637A]">
              <span>Merchant</span>
              <span className="font-medium text-[#0F172A]">{receipt.service}</span>
            </div>
            <div className="flex justify-between items-center text-[#52637A]">
              <span>Plan</span>
              <span className="text-[#0F172A]">{receipt.planName}</span>
            </div>
            <div className="flex justify-between items-baseline text-[#52637A] pt-2 border-t border-[#E8EFF7]">
              <span>Amount paid</span>
              <span className="text-[#0F172A] font-semibold text-base font-mono tabular-nums">
                ${receipt.verifiedPrice.toFixed(2)} {receipt.currency}
              </span>
            </div>
            <div className="flex justify-between items-baseline text-[#52637A]">
              <span>Rule cap</span>
              <span className="text-[#52637A] font-mono tabular-nums">
                ${receipt.budgetCeiling.toFixed(2)} {receipt.currency}
              </span>
            </div>
            {savings > 0 && (
              <div className="flex justify-between items-baseline text-[#52637A]">
                <span>Under cap</span>
                <span className="text-emerald-700 font-medium font-mono tabular-nums">
                  ${savings.toFixed(2)} {receipt.currency}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center text-[#52637A] pt-2 border-t border-[#E8EFF7]">
              <span>Payment rail</span>
              <span className="font-medium text-[#0F172A]">{railText}</span>
            </div>
          </div>

          <div className="bg-[#FAFBFD] p-3.5 rounded-xl border border-[#E2ECF6] space-y-2 text-[11px]">
            <div className="flex justify-between items-center text-[#7B8BA1]">
              <span>Order ID</span>
              <span className="text-[#0F172A] font-mono tabular-nums truncate max-w-[200px]">
                {receipt.orderId}
              </span>
            </div>
            <div className="flex justify-between items-center text-[#7B8BA1]">
              <span>Timestamp</span>
              <span className="text-[#334155] tabular-nums">{receipt.timestamp}</span>
            </div>
            <div className="flex justify-between items-center text-[#7B8BA1]">
              <span>Authorization</span>
              <span className="text-[#334155] font-mono">{receipt.sandboxAuthCode}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between items-center gap-2 pt-2 border-t border-[#EDF3FA]">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopy}
              className="h-9 px-3 rounded-lg border border-[#DCE7F3] bg-white text-[#334155] hover:bg-[#F5F8FC] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors duration-150 flex-1 sm:flex-initial focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copied ? "Copied" : "Copy ID"}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="h-9 px-3 rounded-lg border border-[#DCE7F3] bg-white text-[#334155] hover:bg-[#F5F8FC] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors duration-150 flex-1 sm:flex-initial focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
            >
              {downloadSuccess ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{downloadSuccess ? "Saved" : "Export"}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto h-9 px-4 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
          >
            Done
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
