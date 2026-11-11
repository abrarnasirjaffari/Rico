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
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const receiptContent = `==================================================
RICO — OFFICIAL AUTONOMOUS PAYMENT RECEIPT
PayPal AI Agent Sandbox Verification & Capture
==================================================

Order ID:          ${receipt.orderId}
Transaction Status: ${receipt.status}
Merchant / Service:${receipt.service}
Plan Name:         ${receipt.planName}

Financial Breakdown:
--------------------------------------------------
Verified Price:    $${receipt.verifiedPrice.toFixed(2)} ${receipt.currency}
Budget Ceiling:    $${receipt.budgetCeiling.toFixed(2)} ${receipt.currency}
Savings Enforced:  $${(receipt.budgetCeiling - receipt.verifiedPrice).toFixed(2)} ${receipt.currency}
Payment Method:    ${receipt.paymentMethod}
Authorization:     ${receipt.sandboxAuthCode}

Metadata:
--------------------------------------------------
Timestamp:         ${receipt.timestamp}
Payer Account:     ${receipt.payerEmail}
Verification Tool: Playwright CDP Headless Engine
MCP Server:        https://mcp.sandbox.paypal.com/sse

Status: 100% VERIFIED & CAPTURED ON PAYPAL SANDBOX
==================================================`;

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
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  const savings = Math.max(0, receipt.budgetCeiling - receipt.verifiedPrice);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-[#F6FAFF] border border-[#BFD7F7] text-[#0F172A] p-6 space-y-4 shadow-xl font-[Inter,system-ui,sans-serif]">
        <DialogHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#E2EEFD] border border-[#BFD7F7] flex items-center justify-center text-blue-600">
                <Receipt className="w-4 h-4" />
              </div>
              <DialogTitle className="text-base font-bold text-[#0F172A]">
                PayPal Sandbox Receipt
              </DialogTitle>
            </div>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Verified &amp; Captured</span>
            </span>
          </div>
          <DialogDescription className="text-xs text-[#52637A]">
            Autonomous execution audit proof captured via PayPal MCP Server
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1 text-xs">
          {/* Service & Price */}
          <div className="bg-white p-3.5 rounded-xl border border-[#C8DDF8] space-y-2 shadow-2xs">
            <div className="flex justify-between items-center text-[#52637A]">
              <span>Merchant Service</span>
              <span className="font-semibold text-[#0F172A] text-xs">
                {receipt.service}
              </span>
            </div>
            <div className="flex justify-between items-center text-[#52637A]">
              <span>Plan Selected</span>
              <span className="text-[#0F172A]">
                {receipt.planName}
              </span>
            </div>
            <div className="flex justify-between items-center text-[#52637A] pt-1 border-t border-[#DCE9FA]">
              <span>Verified Amount</span>
              <span className="text-emerald-700 font-bold text-base font-mono">
                ${receipt.verifiedPrice.toFixed(2)} {receipt.currency}
              </span>
            </div>
            <div className="flex justify-between items-center text-[#52637A]">
              <span>Authorized Budget Ceiling</span>
              <span className="text-[#0F172A] font-mono">
                ${receipt.budgetCeiling.toFixed(2)} {receipt.currency}
              </span>
            </div>
            {savings > 0 && (
              <div className="flex justify-between items-center text-emerald-700 font-semibold pt-1 border-t border-[#DCE9FA]">
                <span>Savings Enforced</span>
                <span className="font-mono">
                  +${savings.toFixed(2)} {receipt.currency}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center text-[#52637A] pt-1 border-t border-[#DCE9FA]">
              <span>Payment Rail</span>
              <span className="font-sans font-medium flex items-center gap-1.5">
                {receipt.fundingRail === "VISA" ? (
                  <span className="border border-blue-200 bg-blue-50 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                    VISA (•••• {receipt.cardLastFour || "4242"})
                  </span>
                ) : receipt.fundingRail === "MASTERCARD" ? (
                  <span className="border border-amber-200 bg-amber-50 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                    MASTERCARD (•••• {receipt.cardLastFour || "4444"})
                  </span>
                ) : (
                  <span className="border border-sky-200 bg-sky-50 text-sky-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                    PAYPAL PRIMARY
                  </span>
                )}
                {receipt.isCascaded && (
                  <span className="text-[10px] text-purple-700 font-medium">
                    (Auto-Cascaded)
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Sandbox Meta */}
          <div className="bg-white p-3.5 rounded-xl border border-[#C8DDF8] space-y-2 font-mono text-[11px] shadow-2xs">
            <div className="flex justify-between items-center text-[#52637A]">
              <span>PayPal Order ID</span>
              <span className="text-[#0F172A] font-bold truncate max-w-[180px]">
                {receipt.orderId}
              </span>
            </div>
            <div className="flex justify-between items-center text-[#52637A]">
              <span>Execution Time</span>
              <span className="text-[#0F172A] font-sans">
                {receipt.timestamp}
              </span>
            </div>
            <div className="flex justify-between items-center text-[#52637A]">
              <span>Payer Account</span>
              <span className="text-[#0F172A] truncate max-w-[180px]">
                {receipt.payerEmail}
              </span>
            </div>
            <div className="flex justify-between items-center text-[#52637A]">
              <span>Auth Code</span>
              <span className="text-[#0F172A]">
                {receipt.sandboxAuthCode}
              </span>
            </div>
            <div className="flex justify-between items-center text-[#52637A]">
              <span>MCP Endpoint</span>
              <span className="text-blue-700 font-sans text-[10px]">
                mcp.sandbox.paypal.com/sse
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between items-center gap-2 pt-2 border-t border-[#D6E8FD]">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopy}
              className="h-8 px-3 rounded-lg border border-[#BFD7F7] bg-white text-[#0F172A] hover:bg-[#E2EEFD] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors flex-1 sm:flex-initial"
              title="Copy Order ID"
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
              className="h-8 px-3 rounded-lg border border-[#BFD7F7] bg-white text-[#0F172A] hover:bg-[#E2EEFD] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors flex-1 sm:flex-initial"
              title="Download Receipt TXT"
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
            className="w-full sm:w-auto h-8 px-4 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold transition-all shadow-2xs"
          >
            Close
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
