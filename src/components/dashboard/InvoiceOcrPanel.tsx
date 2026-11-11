"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

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

Items:
1. Amazon EC2 Compute Instances (us-east-1) - $74.20
2. Amazon S3 Standard Storage - $10.30
3. AWS Business Support - $15.50

Subtotal: $100.00
Sales Tax (8.25%): $8.25
Total Amount Due: $108.25 USD`;

export function InvoiceOcrPanel() {
  const [inputText, setInputText] = useState(SAMPLE_INVOICE_TEXT);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedInvoice | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleParse = useCallback(
    async (contentToParse?: string) => {
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
          setErrorMsg(data.error || "Could not parse invoice line items.");
        }
      } catch {
        setErrorMsg("Network error while parsing invoice.");
      } finally {
        setIsParsing(false);
      }
    },
    [inputText]
  );

  useEffect(() => {
    handleParse(SAMPLE_INVOICE_TEXT);
  }, [handleParse]);

  return (
    <div className="h-full overflow-y-auto bg-[#F5F8FC] text-[#0F172A]">
      <div className="max-w-4xl mx-auto px-6 py-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-[#0F172A]">
              Invoice OCR &amp; Tax Deductions
            </h2>
            <p className="text-xs text-[#52637A] mt-1">
              Extract vendor totals, line items, and IRS Schedule C write-off eligibility.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setInputText(SAMPLE_INVOICE_TEXT)}
              className="h-8 px-3 rounded-lg border border-[#DCE7F3] bg-white hover:bg-[#FAFBFD] text-[#52637A] hover:text-[#0F172A] font-medium transition-colors duration-150"
            >
              AWS sample
            </button>
            <button
              type="button"
              onClick={() =>
                setInputText(
                  `INVOICE #STRIPE-9021\nVendor: Stripe, Inc.\nDate: 2026-11-01\nPlan: Stripe Billing Platform\nAmount: $49.00 USD\nTotal: $49.00 USD`
                )
              }
              className="h-8 px-3 rounded-lg border border-[#DCE7F3] bg-white hover:bg-[#FAFBFD] text-[#52637A] hover:text-[#0F172A] font-medium transition-colors duration-150"
            >
              Stripe sample
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl text-xs flex items-center gap-2 border bg-red-50 text-red-800 border-red-200">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Input */}
          <div className="lg:col-span-5 rounded-xl border border-[#DCE7F3] bg-white p-4 flex flex-col justify-between space-y-3 shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
            <div>
              <label
                htmlFor="invoice-raw-textarea"
                className="text-xs font-medium text-[#0F172A] block mb-2"
              >
                Invoice or receipt text
              </label>
              <textarea
                id="invoice-raw-textarea"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={11}
                className="w-full p-3 rounded-lg border border-[#E2ECF6] bg-[#FAFBFD] text-xs font-mono text-[#0F172A] outline-none focus:border-[#2563EB] leading-relaxed"
                placeholder="Paste raw invoice text or receipt OCR..."
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-[#7B8BA1] tabular-nums">
                {inputText.length} chars
              </span>
              <button
                type="button"
                onClick={() => handleParse()}
                disabled={isParsing || !inputText.trim()}
                className="h-9 px-4 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white font-medium text-xs flex items-center gap-1.5 transition-colors duration-150 disabled:opacity-50"
              >
                {isParsing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Parse invoice</span>
              </button>
            </div>
          </div>

          {/* Parsed Result */}
          <div className="lg:col-span-7 rounded-xl border border-[#DCE7F3] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
            {parsedResult ? (
              <div className="space-y-5 text-xs">
                <div className="flex items-baseline justify-between border-b border-[#EDF3FA] pb-4">
                  <div>
                    <span className="text-[11px] text-[#7B8BA1] block">Vendor</span>
                    <span className="text-base font-semibold text-[#0F172A]">
                      {parsedResult.vendorName}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#52637A] font-mono tabular-nums">
                    {Math.round((parsedResult.confidence || 0.95) * 100)}% confidence
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E8EFF7]">
                    <span className="text-[11px] text-[#7B8BA1] block">
                      Invoice total
                    </span>
                    <span className="text-base font-semibold text-[#0F172A] font-mono tabular-nums mt-0.5 block">
                      ${parsedResult.totalAmount.toFixed(2)} {parsedResult.currency}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E8EFF7]">
                    <span className="text-[11px] text-[#7B8BA1] block">
                      Estimated tax write-off
                    </span>
                    <span className="text-base font-semibold text-emerald-700 font-mono tabular-nums mt-0.5 block">
                      $
                      {(
                        parsedResult.deductibleTotal ||
                        parsedResult.totalAmount * 0.9
                      ).toFixed(2)}{" "}
                      USD
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-medium text-[#52637A] block">
                    Line items
                  </span>
                  <div className="divide-y divide-[#EDF3FA] border border-[#E8EFF7] rounded-lg">
                    {parsedResult.lineItems && parsedResult.lineItems.length > 0 ? (
                      parsedResult.lineItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <span className="font-medium text-[#0F172A] block truncate">
                              {item.description}
                            </span>
                            <span className="text-[11px] text-[#7B8BA1]">
                              {item.taxDeductibleCategory || "Cloud & Software"}
                            </span>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-medium font-mono tabular-nums text-[#0F172A] block">
                              ${item.amount.toFixed(2)}
                            </span>
                            <span className="text-[11px] text-emerald-700 tabular-nums">
                              {item.deductiblePercentage || 100}% deductible
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-[#7B8BA1]">
                        Single charge parsed.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center py-12 text-[#7B8BA1] text-xs">
                Paste an invoice on the left and click Parse invoice.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
