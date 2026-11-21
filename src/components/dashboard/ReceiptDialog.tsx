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
import { Check, Copy, Download } from "lucide-react";
import { formatFiat, formatRawDecimal } from "@/lib/format-number";

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
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = () => {
    const receiptContent = `RICO PAYMENT RECEIPT
Order ID:          ${receipt.orderId}
Status:            ${receipt.status}
Vendor:            ${receipt.service}
Plan:              ${receipt.planName}
Amount Paid:       ${formatRawDecimal(receipt.verifiedPrice)} ${receipt.currency}
Rule Cap:          ${formatRawDecimal(receipt.budgetCeiling)} ${receipt.currency}
Payment Method:    ${receipt.paymentMethod}
Authorization:     ${receipt.sandboxAuthCode}
Timestamp:         ${receipt.timestamp}
Payer:             ${receipt.payerEmail}
`;

    const blob = new Blob([receiptContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rico-receipt-${receipt.orderId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 1800);
  };

  const headroom = Math.max(0, receipt.budgetCeiling - receipt.verifiedPrice);
  const railText =
    receipt.fundingRail === "VISA"
      ? `Visa •••• ${receipt.cardLastFour || "4242"}`
      : receipt.fundingRail === "MASTERCARD"
      ? `Mastercard •••• ${receipt.cardLastFour || "4444"}`
      : "PayPal";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-[var(--rico-surface-elevated)] border border-[var(--rico-border-weak)] text-[var(--rico-text-strong)] p-6 space-y-4 rounded-xl shadow-[0_12px_32px_rgba(30,27,27,0.12)]">
        <DialogHeader className="space-y-1">
          <div className="flex items-center justify-between gap-3 pr-6">
            <DialogTitle className="text-[16px] font-semibold tracking-[-0.015em] text-[var(--rico-text-strong)]">
              Payment receipt
            </DialogTitle>
            <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--rico-text-strong)]">
              <span
                aria-hidden="true"
                className="w-1.5 h-1.5 rounded-full bg-emerald-600"
              />
              <span>Captured</span>
            </span>
          </div>
          <DialogDescription className="text-[13px] text-[var(--rico-text-base)]">
            {receipt.service} · {receipt.planName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-[13px]">
          <div className="rounded-lg border border-[var(--rico-border-weak)] bg-[var(--rico-bg-base)]/60 divide-y divide-[var(--rico-border-weak)]">
            <div className="px-4 py-3 flex items-baseline justify-between gap-3">
              <span className="text-[var(--rico-text-base)]">Amount paid</span>
              <span className="text-[16px] font-semibold font-mono tabular-nums text-[var(--rico-text-strong)]">
                {formatFiat(receipt.verifiedPrice)} {receipt.currency}
              </span>
            </div>

            <div className="px-4 py-2.5 flex items-baseline justify-between gap-3">
              <span className="text-[var(--rico-text-base)]">Rule cap</span>
              <span className="font-mono tabular-nums text-[var(--rico-text-base)]">
                {formatFiat(receipt.budgetCeiling)} {receipt.currency}
              </span>
            </div>

            {headroom > 0 && (
              <div className="px-4 py-2.5 flex items-baseline justify-between gap-3">
                <span className="text-[var(--rico-text-base)]">Headroom</span>
                <span className="font-mono tabular-nums text-emerald-700 font-medium">
                  {formatFiat(headroom)} under cap
                </span>
              </div>
            )}

            <div className="px-4 py-2.5 flex items-center justify-between gap-3">
              <span className="text-[var(--rico-text-base)]">Method</span>
              <span className="font-medium text-[var(--rico-text-strong)]">
                {railText}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--rico-border-weak)] bg-[var(--rico-surface-elevated)] px-4 py-3 space-y-2 text-[12px]">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[var(--rico-text-base)]">Order ID</span>
              <span className="font-mono tabular-nums text-[var(--rico-text-strong)] truncate max-w-[220px]">
                {receipt.orderId}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[var(--rico-text-base)]">Date</span>
              <span className="font-mono tabular-nums text-[var(--rico-text-base)]">
                {receipt.timestamp}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[var(--rico-text-base)]">Authorization</span>
              <span className="font-mono tabular-nums text-[var(--rico-text-base)]">
                {receipt.sandboxAuthCode}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between items-center gap-2 pt-2 border-t border-[var(--rico-border-weak)]">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopy}
              className="min-h-[40px] sm:min-h-0 sm:h-9 px-3 rounded-lg border border-[var(--rico-border-base)] bg-[var(--rico-surface-elevated)] hover:bg-[var(--rico-bg-base)] text-[12.5px] font-medium text-[var(--rico-text-strong)] inline-flex items-center justify-center gap-1.5 flex-1 sm:flex-initial transition-colors duration-100 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/35"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
              ) : (
                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              <span>{copied ? "Copied" : "Copy ID"}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="min-h-[40px] sm:min-h-0 sm:h-9 px-3 rounded-lg border border-[var(--rico-border-base)] bg-[var(--rico-surface-elevated)] hover:bg-[var(--rico-bg-base)] text-[12.5px] font-medium text-[var(--rico-text-strong)] inline-flex items-center justify-center gap-1.5 flex-1 sm:flex-initial transition-colors duration-100 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/35"
            >
              {downloadSuccess ? (
                <Check className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
              ) : (
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              <span>{downloadSuccess ? "Saved" : "Download"}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto min-h-[40px] sm:min-h-0 sm:h-9 px-4 rounded-lg bg-[var(--rico-primary-bg)] text-[var(--rico-primary-fg)] hover:opacity-90 active:translate-y-px text-[13px] font-medium transition-opacity duration-100 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/40"
          >
            Done
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
