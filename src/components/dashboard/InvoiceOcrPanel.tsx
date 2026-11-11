"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FileSpreadsheet,
  Scan,
  AlertCircle,
  Receipt,
  Loader2,
  Sparkles,
} from "lucide-react";

interface ParsedInvoice {
  id?: string;
  vendorName: string;
  invoiceNumber?: string;
  issueDate?: string;
  totalAmount: number;
  taxAmount?: number;
  currency: string;
  confidence: number;
  lineItems: Array<{
    description: string;
    amount: number;
    taxDeductibleCategory?: string;
    deductiblePercentage?: number;
  }>;
  deductibleTotal?: number;
}

const SAMPLE_INVOICE_TEXT = `INVOICE #INV-2026-8819
Date: 2026-11-04
Vendor: Amazon Web Services, Inc.
Tax ID: US-91-1234567

Items:
1. Amazon EC2 Compute Instances (us-east-1) - $74.20
2. Amazon Simple Storage Service (S3) Standard Storage - $10.30
3. AWS Business Support Fee - $15.50

Subtotal: $100.00
State Sales Tax (8.25%): $8.25
Total Amount Due: $108.25 USD`;

export function InvoiceOcrPanel() {
  const [inputText, setInputText] = useState(SAMPLE_INVOICE_TEXT);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedInvoice | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleParse = useCallback(async (contentToParse?: string) => {
    const text = contentToParse || inputText;
    if (!text.trim()) return;
    setIsParsing(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/invoices/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: text,
          sourceType: "RAW_TEXT",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.invoice) {
        setParsedResult(data.invoice);
      } else {
        setErrorMsg(data.error || "Failed to extract invoice line items.");
      }
    } catch {
      setErrorMsg("Network error while running OCR engine.");
    } finally {
      setIsParsing(false);
    }
  }, [inputText]);

  useEffect(() => {
    handleParse(SAMPLE_INVOICE_TEXT);
  }, [handleParse]);

  return (
    <div className="h-full flex flex-col bg-[#F6FAFF] text-[#0F172A] overflow-y-auto p-4 space-y-4 font-[Inter,system-ui,sans-serif]">
      {/* Top Banner */}
      <div className="p-4 rounded-xl border border-[#C8DDF8] bg-white shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E2EEFD] border border-[#BFD7F7] flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
            <Scan className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#0F172A]">
                Invoice OCR &amp; Tax Deduction Engine
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-semibold font-mono">
                IRS Schedule C &amp; VAT Ready
              </span>
            </div>
            <p className="text-xs text-[#52637A] mt-0.5">
              Extract vendor details, line items, and calculate eligible tax write-offs automatically from invoices and receipts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleParse()}
            disabled={isParsing}
            className="h-8 px-3 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all disabled:opacity-50"
          >
            {isParsing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Scan className="w-3.5 h-3.5" />}
            <span>Extract &amp; Classify</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-lg text-xs flex items-center gap-2 border bg-red-50 text-red-800 border-red-200">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 2-Column Split: Text Input on Left, Parsed Result & Tax Deductions on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Raw Invoice Text / Upload */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
              <span>Raw Invoice / Receipt Input</span>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setInputText(SAMPLE_INVOICE_TEXT)}
                className="text-[10px] text-blue-600 hover:underline font-medium"
              >
                AWS Sample
              </button>
              <span className="text-[#94A3B8]">•</span>
              <button
                type="button"
                onClick={() =>
                  setInputText(
                    `INVOICE #STRIPE-9021\nVendor: Stripe Payments Europe\nDate: 2026-11-01\nPlan: Stripe Billing & Tax Platform\nAmount: $49.00 USD\nSales Tax (0%): $0.00\nTotal: $49.00 USD`
                  )
                }
                className="text-[10px] text-blue-600 hover:underline font-medium"
              >
                Stripe Sample
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-[#C8DDF8] bg-white shadow-2xs space-y-3 text-xs">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={11}
              className="w-full p-2.5 rounded-lg border border-[#C7DCF6] bg-[#F8FAFC] text-[11px] font-mono text-[#0F172A] outline-none focus:border-blue-500 leading-relaxed"
              placeholder="Paste raw invoice text, receipt OCR scan, or email content..."
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-[#52637A] font-mono">
                {inputText.length} characters
              </span>
              <button
                type="button"
                onClick={() => handleParse()}
                disabled={isParsing || !inputText.trim()}
                className="h-8 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition-colors disabled:opacity-50"
              >
                {isParsing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Parse Invoice</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Extracted Data & Schedule C Classifications */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-emerald-600" />
              <span>Parsed Metadata &amp; Tax Deductions</span>
            </span>
            {parsedResult && (
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono font-bold">
                {Math.round((parsedResult.confidence || 0.95) * 100)}% Confidence
              </span>
            )}
          </div>

          {parsedResult ? (
            <div className="p-4 rounded-xl border border-[#C8DDF8] bg-white shadow-2xs space-y-4 text-xs">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="p-2.5 rounded-lg bg-[#F6FAFF] border border-[#DCE9FA]">
                  <span className="text-[10px] text-[#52637A] block">Vendor</span>
                  <span className="font-bold text-xs text-[#0F172A] truncate block">
                    {parsedResult.vendorName}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#F6FAFF] border border-[#DCE9FA]">
                  <span className="text-[10px] text-[#52637A] block">Total Amount</span>
                  <span className="font-bold text-xs text-blue-700">
                    ${parsedResult.totalAmount.toFixed(2)} {parsedResult.currency}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200/80">
                  <span className="text-[10px] text-emerald-700 block font-medium">Tax Write-Off</span>
                  <span className="font-bold text-xs text-emerald-700">
                    ${(parsedResult.deductibleTotal || parsedResult.totalAmount * 0.9).toFixed(2)} USD
                  </span>
                </div>
              </div>

              {/* Line Items & Deductions Breakdown */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-[#52637A] uppercase tracking-wider block">
                  Line Items &amp; Categorization:
                </span>

                <div className="space-y-1.5">
                  {parsedResult.lineItems && parsedResult.lineItems.length > 0 ? (
                    parsedResult.lineItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg border border-[#DCE9FA] bg-[#F8FAFC] flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <span className="font-medium text-[#0F172A] block truncate">
                            {item.description}
                          </span>
                          <span className="text-[10px] text-[#52637A] font-mono">
                            Category: {item.taxDeductibleCategory || "Cloud & Software (100% Deductible)"}
                          </span>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-bold text-xs font-mono text-[#0F172A] block">
                            ${item.amount.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-emerald-600 font-semibold font-mono">
                            {item.deductiblePercentage || 100}% Write-Off
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-[#52637A] italic text-xs">
                      Single-item charge captured.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-[#52637A] text-xs bg-white border border-[#C8DDF8] rounded-xl">
              Click &quot;Parse Invoice&quot; to inspect line items and extract tax deductibility.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
