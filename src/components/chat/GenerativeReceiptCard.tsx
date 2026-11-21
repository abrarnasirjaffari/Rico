"use client";

import React, { useState } from "react";
import { Check, Copy, Download, FileText } from "lucide-react";
import { ReceiptData } from "@/components/dashboard/ReceiptDialog";
import { formatFiat, formatRawDecimal } from "@/lib/format-number";

interface GenerativeReceiptCardProps {
  receipt: ReceiptData;
  onViewReceipt: (receipt: ReceiptData) => void;
}

export function GenerativeReceiptCard({
  receipt,
  onViewReceipt,
}: GenerativeReceiptCardProps) {
  const [copiedId, setCopiedId] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleCopyOrderId = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(receipt.orderId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 1500);
    }
  };

  const handleDownloadReceipt = () => {
    const receiptContent = `RICO PAYMENT RECEIPT
Order ID:          ${receipt.orderId}
Status:            ${receipt.status}
Vendor:            ${receipt.service} (${receipt.planName})
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

  const savings = Math.max(0, receipt.budgetCeiling - receipt.verifiedPrice);
  const railLabel =
    receipt.fundingRail === "VISA"
      ? `Visa •••• ${receipt.cardLastFour || "4242"}`
      : receipt.fundingRail === "MASTERCARD"
      ? `Mastercard •••• ${receipt.cardLastFour || "4444"}`
      : "PayPal";

  return (
    <div className="rounded-xl border border-[var(--rico-border-weak)] bg-[var(--rico-surface-elevated)] p-4 text-[12.5px] space-y-3.5 max-w-lg">
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-[var(--rico-surface-base)]">
        <div className="min-w-0">
          <div className="font-semibold text-[var(--rico-text-strong)] text-[14px] truncate">
            {receipt.service}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-[var(--rico-text-base)] font-mono tabular-nums">
            <span className="truncate">{receipt.orderId}</span>
            <button
              type="button"
              onClick={handleCopyOrderId}
              aria-label={copiedId ? "Order ID copied" : "Copy Order ID"}
              className="hover:text-[var(--rico-text-strong)] transition-colors duration-100 rounded p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/35"
            >
              {copiedId ? (
                <Check className="w-3 h-3 text-emerald-600" aria-hidden="true" />
              ) : (
                <Copy className="w-3 h-3" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--rico-text-strong)] shrink-0">
          <span
            aria-hidden="true"
            className="w-1.5 h-1.5 rounded-full bg-emerald-600"
          />
          <span>Captured</span>
        </span>
      </div>

      <div className="grid grid-cols-3 divide-x divide-[var(--rico-border-weak)] rounded-lg bg-[var(--rico-bg-base)]/60 border border-[var(--rico-border-weak)]">
        <div className="p-2.5">
          <span className="text-[11px] text-[var(--rico-text-base)] block">
            Paid
          </span>
          <span className="text-[14px] font-semibold text-[var(--rico-text-strong)] font-mono tabular-nums">
            {formatFiat(receipt.verifiedPrice)}
          </span>
        </div>
        <div className="p-2.5">
          <span className="text-[11px] text-[var(--rico-text-base)] block">
            Cap
          </span>
          <span className="text-[13px] font-medium text-[var(--rico-text-base)] font-mono tabular-nums">
            {formatFiat(receipt.budgetCeiling)}
          </span>
        </div>
        <div className="p-2.5 text-right">
          <span className="text-[11px] text-[var(--rico-text-base)] block">
            Headroom
          </span>
          <span className="text-[13px] font-medium text-emerald-700 font-mono tabular-nums">
            {formatFiat(savings)}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11.5px] text-[var(--rico-text-base)]">
        <span>{railLabel}</span>
        <span className="font-mono tabular-nums">{receipt.timestamp}</span>
      </div>

      <div className="flex items-center gap-2 pt-0.5">
        <button
          type="button"
          onClick={() => onViewReceipt(receipt)}
          className="flex-1 h-8 px-3 rounded-lg bg-[var(--rico-primary-bg)] text-[var(--rico-primary-fg)] hover:opacity-90 active:translate-y-px font-medium text-[12px] transition-opacity duration-100 inline-flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/40"
        >
          <FileText className="w-3.5 h-3.5" aria-hidden="true" />
          <span>View receipt</span>
        </button>
        <button
          type="button"
          onClick={handleDownloadReceipt}
          className="h-8 px-3 rounded-lg border border-[var(--rico-border-base)] bg-[var(--rico-surface-elevated)] hover:bg-[var(--rico-bg-base)] text-[var(--rico-text-strong)] font-medium text-[12px] transition-colors duration-100 inline-flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/35"
        >
          {downloadSuccess ? (
            <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
          ) : (
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
          )}
          <span>{downloadSuccess ? "Saved" : "Download"}</span>
        </button>
      </div>
    </div>
  );
}
