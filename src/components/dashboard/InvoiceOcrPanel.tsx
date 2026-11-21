"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AlertCircle, Loader2, Plus } from "lucide-react";
import { formatFiat, formatPercent } from "@/lib/format-number";

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

interface InvoiceOcrPanelProps {
  onCreateRuleFromInvoice?: (
    service: string,
    price: number,
    planName: string
  ) => void;
}

const AWS_SAMPLE_TEXT = `INVOICE #INV-2026-8819
Date: 2026-11-04
Vendor: Amazon Web Services, Inc.

Items:
1. Amazon EC2 Compute Instances (us-east-1) - $74.20
2. Amazon S3 Standard Storage - $10.30
3. AWS Business Support - $15.50

Subtotal: $100.00
Sales Tax (8.25%): $8.25
Total Amount Due: $108.25 USD`;

const STRIPE_SAMPLE_TEXT = `INVOICE #STRIPE-9021
Vendor: Stripe, Inc.
Date: 2026-11-01
Items:
1. Stripe Billing Starter Plan - $49.00

Subtotal: $49.00
Total Amount Due: $49.00 USD`;

export function InvoiceOcrPanel({
  onCreateRuleFromInvoice,
}: InvoiceOcrPanelProps = {}) {
  const [inputText, setInputText] = useState(AWS_SAMPLE_TEXT);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedInvoice | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleParse = useCallback(
    async (contentToParse?: string) => {
      const text = contentToParse ?? inputText;
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
          setErrorMsg(
            data.error || "Could not extract line items. Check invoice format and retry."
          );
        }
      } catch {
        setErrorMsg("Network error while parsing invoice. Please retry.");
      } finally {
        setIsParsing(false);
      }
    },
    [inputText]
  );

  useEffect(() => {
    void handleParse(AWS_SAMPLE_TEXT);
    // Parse initial sample once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* Header & Sample Presets */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="m-0 text-[16px] font-semibold tracking-[-0.015em] text-[var(--rico-text-strong)]">
            Invoices &amp; receipts
          </h2>
          <p className="m-0 mt-1 text-[13px] text-[var(--rico-text-base)]">
            Extract vendor details, line items, and billing totals from raw invoice text.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setInputText(AWS_SAMPLE_TEXT);
              void handleParse(AWS_SAMPLE_TEXT);
            }}
            className="min-h-[38px] sm:min-h-0 sm:h-8 px-3 rounded-lg border border-[var(--rico-border-weak)] hover:border-[var(--rico-border-base)] bg-[var(--rico-surface-elevated)] hover:bg-[var(--rico-bg-base)] text-[12.5px] font-medium text-[var(--rico-text-base)] hover:text-[var(--rico-text-strong)] transition-colors duration-100 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/35"
          >
            AWS sample
          </button>
          <button
            type="button"
            onClick={() => {
              setInputText(STRIPE_SAMPLE_TEXT);
              void handleParse(STRIPE_SAMPLE_TEXT);
            }}
            className="min-h-[38px] sm:min-h-0 sm:h-8 px-3 rounded-lg border border-[var(--rico-border-weak)] hover:border-[var(--rico-border-base)] bg-[var(--rico-surface-elevated)] hover:bg-[var(--rico-bg-base)] text-[12.5px] font-medium text-[var(--rico-text-base)] hover:text-[var(--rico-text-strong)] transition-colors duration-100 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/35"
          >
            Stripe sample
          </button>
          {inputText && (
            <button
              type="button"
              onClick={() => {
                setInputText("");
                setParsedResult(null);
                setErrorMsg(null);
              }}
              className="min-h-[38px] sm:min-h-0 sm:h-8 px-3 rounded-lg text-[12.5px] font-medium text-[var(--rico-text-base)] hover:text-[var(--rico-text-strong)] hover:bg-[var(--rico-bg-base)] transition-colors duration-100 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/35"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="px-4 py-3 rounded-xl border border-red-200 bg-red-50/70 text-[13px] text-red-800 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" aria-hidden="true" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => void handleParse()}
            className="text-[12.5px] font-medium underline hover:no-underline shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/40 rounded"
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Raw Document Input */}
        <div className="lg:col-span-5 rounded-xl border border-[var(--rico-border-weak)] bg-[var(--rico-surface-elevated)] p-4 sm:p-5 space-y-3.5">
          <div>
            <label
              htmlFor="invoice-raw-textarea"
              className="block text-[13px] font-medium text-[var(--rico-text-strong)] mb-2"
            >
              Raw invoice or receipt text
            </label>
            <textarea
              id="invoice-raw-textarea"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={11}
              autoComplete="off"
              placeholder="Paste invoice text, OCR output, or email receipt..."
              className="w-full p-3 rounded-lg border border-[var(--rico-border-base)] bg-[var(--rico-bg-stronger)] text-[12.5px] font-mono text-[var(--rico-text-strong)] placeholder:text-[var(--rico-text-muted)] leading-relaxed transition-colors duration-100 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/35 focus-visible:border-[var(--rico-accent)]"
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-0.5">
            <span className="text-[12px] font-mono tabular-nums text-[var(--rico-text-base)]">
              {inputText.length.toLocaleString("en-US")} chars
            </span>
            <button
              type="button"
              onClick={() => void handleParse()}
              disabled={isParsing || !inputText.trim()}
              aria-busy={isParsing}
              className="min-h-[40px] sm:min-h-0 sm:h-9 px-4 rounded-lg bg-[var(--rico-primary-bg)] text-[var(--rico-primary-fg)] hover:opacity-90 active:translate-y-px font-medium text-[13px] inline-flex items-center gap-1.5 disabled:opacity-50 transition-opacity duration-100 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/40"
            >
              {isParsing && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              )}
              <span>Extract fields</span>
            </button>
          </div>
        </div>

        {/* Structured Extracted Invoice Sheet */}
        <div className="lg:col-span-7 rounded-xl border border-[var(--rico-border-weak)] bg-[var(--rico-surface-elevated)] overflow-hidden">
          {isParsing && !parsedResult ? (
            <div className="p-5 sm:p-6 space-y-4" aria-live="polite" aria-busy="true">
              <div className="h-5 w-48 rounded bg-[var(--rico-surface-base)] animate-pulse motion-reduce:animate-none" />
              <div className="h-4 w-32 rounded bg-[var(--rico-surface-base)] animate-pulse motion-reduce:animate-none" />
              <div className="space-y-2 pt-3 border-t border-[var(--rico-surface-base)]">
                <div className="h-9 w-full rounded bg-[var(--rico-surface-base)] animate-pulse motion-reduce:animate-none" />
                <div className="h-9 w-full rounded bg-[var(--rico-surface-base)] animate-pulse motion-reduce:animate-none" />
                <div className="h-9 w-full rounded bg-[var(--rico-surface-base)] animate-pulse motion-reduce:animate-none" />
              </div>
            </div>
          ) : parsedResult ? (
            <div>
              {/* Sheet Header */}
              <div className="px-5 py-4 border-b border-[var(--rico-border-weak)] flex flex-wrap items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <span className="block text-[12px] text-[var(--rico-text-base)]">
                    Vendor
                  </span>
                  <h3 className="m-0 mt-0.5 text-[16px] font-semibold tracking-[-0.015em] text-[var(--rico-text-strong)]">
                    {parsedResult.vendorName}
                  </h3>
                  {(parsedResult.invoiceNumber || parsedResult.issueDate) && (
                    <div className="mt-1 flex items-center gap-2 text-[12px] font-mono tabular-nums text-[var(--rico-text-base)]">
                      {parsedResult.invoiceNumber && (
                        <span>{parsedResult.invoiceNumber}</span>
                      )}
                      {parsedResult.invoiceNumber && parsedResult.issueDate && (
                        <span aria-hidden="true">·</span>
                      )}
                      {parsedResult.issueDate && <span>{parsedResult.issueDate}</span>}
                    </div>
                  )}
                </div>

                <span className="text-[12px] font-mono tabular-nums text-[var(--rico-text-base)]">
                  {formatPercent((parsedResult.confidence || 0.95) * 100, {
                    decimals: 0,
                  })}{" "}
                  match
                </span>
              </div>

              {/* Line Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[var(--rico-border-weak)] bg-[var(--rico-bg-base)]/75">
                      <th
                        scope="col"
                        className="py-2.5 pl-5 pr-3 text-[12px] font-medium text-[var(--rico-text-base)]"
                      >
                        Line item
                      </th>
                      <th
                        scope="col"
                        className="py-2.5 px-3 text-[12px] font-medium text-[var(--rico-text-base)] hidden sm:table-cell"
                      >
                        Category
                      </th>
                      <th
                        scope="col"
                        className="py-2.5 pl-3 pr-5 text-[12px] font-medium text-[var(--rico-text-base)] text-right"
                      >
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--rico-surface-base)]">
                    {parsedResult.lineItems && parsedResult.lineItems.length > 0 ? (
                      parsedResult.lineItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-3 pl-5 pr-3 text-[13px] text-[var(--rico-text-strong)]">
                            {item.description}
                          </td>
                          <td className="py-3 px-3 text-[12.5px] text-[var(--rico-text-base)] hidden sm:table-cell whitespace-nowrap">
                            {item.taxDeductibleCategory || "Software & Cloud"}
                          </td>
                          <td className="py-3 pl-3 pr-5 text-right font-mono tabular-nums text-[13px] text-[var(--rico-text-strong)] whitespace-nowrap">
                            {formatFiat(item.amount)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={3}
                          className="py-4 px-5 text-[13px] text-[var(--rico-text-base)]"
                        >
                          Consolidated invoice charge
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals & Rule Creation Footer */}
              <div className="px-5 py-4 border-t border-[var(--rico-border-weak)] bg-[var(--rico-bg-base)]/50 space-y-2.5">
                {typeof parsedResult.taxAmount === "number" &&
                  parsedResult.taxAmount > 0 && (
                    <div className="flex items-baseline justify-between text-[12.5px] text-[var(--rico-text-base)]">
                      <span>Tax</span>
                      <span className="font-mono tabular-nums">
                        {formatFiat(parsedResult.taxAmount)}
                      </span>
                    </div>
                  )}

                {typeof parsedResult.deductibleTotal === "number" &&
                  parsedResult.deductibleTotal > 0 && (
                    <div className="flex items-baseline justify-between text-[12.5px] text-[var(--rico-text-base)]">
                      <span>Eligible business expense</span>
                      <span className="font-mono tabular-nums text-[var(--rico-text-strong)]">
                        {formatFiat(parsedResult.deductibleTotal)}
                      </span>
                    </div>
                  )}

                <div className="flex items-baseline justify-between pt-2 border-t border-[var(--rico-border-weak)]">
                  <span className="text-[13px] font-medium text-[var(--rico-text-strong)]">
                    Total due ({parsedResult.currency || "USD"})
                  </span>
                  <span className="text-[16px] font-semibold font-mono tabular-nums text-[var(--rico-text-strong)]">
                    {formatFiat(parsedResult.totalAmount)}
                  </span>
                </div>

                {onCreateRuleFromInvoice && (
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        onCreateRuleFromInvoice(
                          parsedResult.vendorName,
                          parsedResult.totalAmount,
                          parsedResult.invoiceNumber
                            ? `Invoice ${parsedResult.invoiceNumber}`
                            : "Recurring invoice"
                        )
                      }
                      className="min-h-[40px] sm:min-h-0 sm:h-8 px-3.5 rounded-lg border border-[var(--rico-border-base)] bg-[var(--rico-surface-elevated)] hover:bg-[var(--rico-bg-base)] active:translate-y-px text-[12.5px] font-medium text-[var(--rico-text-strong)] inline-flex items-center gap-1.5 transition-colors duration-100 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/35"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2]" aria-hidden="true" />
                      <span>Set rule from invoice</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="px-6 py-16 text-center">
              <p className="m-0 text-[13.5px] font-medium text-[var(--rico-text-strong)]">
                No invoice loaded
              </p>
              <p className="m-0 mt-1 text-[12.5px] text-[var(--rico-text-base)]">
                Paste invoice text on the left and click Extract fields, or load a sample above.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
