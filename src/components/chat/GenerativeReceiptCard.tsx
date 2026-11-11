"use client";

import React, { useState } from "react";
import {
  Receipt,
  CheckCircle2,
  Copy,
  Check,
  FileText,
  Download,
} from "lucide-react";
import { ReceiptData } from "@/components/dashboard/ReceiptDialog";

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
      setTimeout(() => setCopiedId(false), 1800);
    }
  };

  const handleDownloadReceipt = () => {
    const receiptContent = `RICO — AUTONOMOUS PAYMENT RECEIPT
Order ID:          ${receipt.orderId}
Status:            ${receipt.status}
Merchant:          ${receipt.service} (${receipt.planName})
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
  const railLabel =
    receipt.fundingRail === "VISA"
      ? `Visa •••• ${receipt.cardLastFour || "4242"}`
      : receipt.fundingRail === "MASTERCARD"
      ? `Mastercard •••• ${receipt.cardLastFour || "4444"}`
      : "PayPal Primary";

  return (
    <div className="rounded-xl border border-[#DCE7F3] bg-white p-4 text-xs space-y-3.5 shadow-[0_1px_4px_rgba(15,23,42,0.04)] max-w-lg">
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#EDF3FA]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#EDF3FA] flex items-center justify-center text-[#0F172A] shrink-0">
            <Receipt className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-[#0F172A] text-sm truncate">
              {receipt.service}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#7B8BA1] font-mono">
              <span className="truncate">{receipt.orderId}</span>
              <button
                type="button"
                onClick={handleCopyOrderId}
                className="hover:text-[#0F172A] transition-colors duration-150"
                title="Copy Order ID"
              >
                {copiedId ? (
                  <Check className="w-3 h-3 text-emerald-600" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-medium shrink-0">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>Captured</span>
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-[#F8FAFC] border border-[#E8EFF7]">
        <div>
          <span className="text-[11px] text-[#7B8BA1] block">Paid</span>
          <span className="text-base font-semibold text-[#0F172A] font-mono tabular-nums">
            ${receipt.verifiedPrice.toFixed(2)}
          </span>
        </div>
        <div>
          <span className="text-[11px] text-[#7B8BA1] block">Ceiling</span>
          <span className="text-sm font-medium text-[#52637A] font-mono tabular-nums">
            ${receipt.budgetCeiling.toFixed(2)}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[11px] text-[#7B8BA1] block">Under Cap</span>
          <span className="text-sm font-medium text-emerald-700 font-mono tabular-nums">
            ${savings.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-[#52637A]">
        <span>{railLabel}</span>
        <span className="font-mono tabular-nums text-[#7B8BA1]">{receipt.timestamp}</span>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => onViewReceipt(receipt)}
          className="flex-1 h-8 px-3 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white font-medium text-xs transition-colors duration-150 flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>View Receipt</span>
        </button>
        <button
          type="button"
          onClick={handleDownloadReceipt}
          className="h-8 px-3 rounded-lg border border-[#DCE7F3] bg-white hover:bg-[#F5F8FC] text-[#334155] font-medium text-xs transition-colors duration-150 flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
        >
          {downloadSuccess ? (
            <Check className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          <span>{downloadSuccess ? "Saved" : "Export"}</span>
        </button>
      </div>
    </div>
  );
}
