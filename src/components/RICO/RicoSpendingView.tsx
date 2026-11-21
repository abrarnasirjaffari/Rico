"use client";

import React, { useMemo, useRef, useState } from "react";
import { Download, Plus, Search, X } from "lucide-react";
import { AuditLog, Mandate, Transaction } from "@/components/dashboard/types";
import { ReceiptData } from "@/components/dashboard/ReceiptDialog";
import { AgGridMandatesTable } from "@/components/dashboard/AgGridMandatesTable";
import { AgGridTransactionsTable } from "@/components/dashboard/AgGridTransactionsTable";
import { PersonaSavingsPanel } from "@/components/dashboard/PersonaSavingsPanel";
import { InvoiceOcrPanel } from "@/components/dashboard/InvoiceOcrPanel";
import { formatFiat } from "@/lib/format-number";

export type SpendingTabId =
  | "rules"
  | "transactions"
  | "audit"
  | "savings"
  | "invoices";

interface RicoSpendingViewProps {
  activeTab: SpendingTabId;
  onSelectTab: (tab: SpendingTabId) => void;
  onClose: () => void;
  mandates: Mandate[];
  transactions: Transaction[];
  auditLogs: AuditLog[];
  strictMode: boolean;
  onToggleStrictMode: () => void;
  onCreateMandateClick: () => void;
  onTriggerMandate: (id: string) => void;
  onViewReceipt: (receipt: ReceiptData) => void;
  onDeployPlanMandate: (service: string, price: number, planName: string) => void;
  onRefreshData?: () => void;
}

type AuditFilter = "ALL" | "PAYMENTS" | "VERIFICATIONS" | "HOLDS";

function formatEventLabel(eventType: AuditLog["eventType"]): string {
  switch (eventType) {
    case "PAYMENT_CAPTURED":
      return "Payment captured";
    case "PRICE_VERIFIED":
      return "Price verified";
    case "GUARDRAIL_BLOCKED":
      return "Guardrail hold";
    case "MANDATE_CREATED":
      return "Rule created";
    default:
      return eventType;
  }
}

function escapeCsvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function RicoSpendingView({
  activeTab,
  onSelectTab,
  onClose,
  mandates,
  transactions,
  auditLogs,
  strictMode,
  onToggleStrictMode,
  onCreateMandateClick,
  onTriggerMandate,
  onViewReceipt,
  onDeployPlanMandate,
  onRefreshData,
}: RicoSpendingViewProps) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [auditQuery, setAuditQuery] = useState("");
  const [auditFilter, setAuditFilter] = useState<AuditFilter>("ALL");

  const tabs: Array<{
    id: SpendingTabId;
    label: string;
    count?: number;
  }> = [
    { id: "rules", label: "Rules", count: mandates.length },
    { id: "transactions", label: "Transactions", count: transactions.length },
    { id: "audit", label: "Activity", count: auditLogs.length },
    { id: "savings", label: "Credits & rates" },
    { id: "invoices", label: "Invoices" },
  ];

  const rulesSummary = useMemo(() => {
    const active = mandates.filter((m) => m.status === "ACTIVE");
    const verifiedTotal = active.reduce((sum, m) => sum + m.lastScrapedPrice, 0);
    const capTotal = active.reduce((sum, m) => sum + m.budgetCeiling, 0);
    const headroomTotal = capTotal - verifiedTotal;
    const holdCount = mandates.filter((m) => m.status === "ANOMALY_HOLD").length;
    return {
      activeCount: active.length,
      totalCount: mandates.length,
      verifiedTotal,
      capTotal,
      headroomTotal,
      holdCount,
    };
  }, [mandates]);

  const txSummary = useMemo(() => {
    const captured = transactions.filter((t) => t.status === "COMPLETED");
    const totalCaptured = captured.reduce((sum, t) => sum + t.amount, 0);
    const avgCharge = captured.length > 0 ? totalCaptured / captured.length : null;
    const heldCount = transactions.filter((t) => t.status !== "COMPLETED").length;
    return {
      capturedCount: captured.length,
      totalCount: transactions.length,
      totalCaptured,
      avgCharge,
      heldCount,
    };
  }, [transactions]);

  const filteredAuditLogs = useMemo(() => {
    const q = auditQuery.trim().toLowerCase();
    return auditLogs.filter((log) => {
      if (auditFilter === "PAYMENTS" && log.eventType !== "PAYMENT_CAPTURED") {
        return false;
      }
      if (auditFilter === "VERIFICATIONS" && log.eventType !== "PRICE_VERIFIED") {
        return false;
      }
      if (auditFilter === "HOLDS" && log.eventType !== "GUARDRAIL_BLOCKED") {
        return false;
      }
      if (!q) return true;
      return (
        log.service.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        formatEventLabel(log.eventType).toLowerCase().includes(q)
      );
    });
  }, [auditLogs, auditQuery, auditFilter]);

  const handleTabKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    let nextIndex = -1;
    if (e.key === "ArrowRight") {
      nextIndex = (index + 1) % tabs.length;
    } else if (e.key === "ArrowLeft") {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = tabs.length - 1;
    }

    if (nextIndex !== -1) {
      e.preventDefault();
      onSelectTab(tabs[nextIndex].id);
      tabRefs.current[nextIndex]?.focus();
    }
  };

  const handleExportAuditCsv = () => {
    const headers = ["Event", "Vendor", "Details", "Severity", "Timestamp"];
    const rows = filteredAuditLogs.map((log) => [
      escapeCsvCell(formatEventLabel(log.eventType)),
      escapeCsvCell(log.service),
      escapeCsvCell(log.details),
      escapeCsvCell(log.severity),
      escapeCsvCell(log.timestamp),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rico-activity-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[var(--rico-bg-stronger)] text-[var(--rico-text-strong)]">
      {/* Top Section Header */}
      <header className="min-h-[56px] px-4 sm:px-6 lg:px-8 py-3 border-b border-[var(--rico-border-weak)] bg-[var(--rico-bg-stronger)] flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="m-0 text-[16px] sm:text-[17px] font-semibold tracking-[-0.015em] text-[var(--rico-text-strong)]">
            Spending
          </h1>

          <button
            type="button"
            aria-pressed={strictMode}
            onClick={onToggleStrictMode}
            title="Toggle manual confirmation before every charge"
            className="hidden sm:inline-flex h-7 px-2.5 rounded-md border border-[var(--rico-border-weak)] hover:border-[var(--rico-border-base)] bg-[var(--rico-surface-elevated)] hover:bg-[var(--rico-bg-base)] items-center gap-1.5 text-[12px] font-medium text-[var(--rico-text-base)] hover:text-[var(--rico-text-strong)] transition-colors duration-100 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/35"
          >
            <span
              aria-hidden="true"
              className={`w-1.5 h-1.5 rounded-full ${
                strictMode ? "bg-amber-500" : "bg-emerald-600"
              }`}
            />
            <span>
              {strictMode ? "Manual approval on" : "Auto-pay within cap"}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onCreateMandateClick}
            className="min-h-[40px] sm:min-h-0 sm:h-9 px-3.5 rounded-lg bg-[var(--rico-primary-bg)] text-[var(--rico-primary-fg)] hover:opacity-90 active:translate-y-px text-[13px] font-medium inline-flex items-center gap-1.5 transition-opacity duration-100 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/40"
          >
            <Plus className="w-4 h-4 stroke-[2]" aria-hidden="true" />
            <span>New rule</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Spending and return home"
            title="Back to home (Esc)"
            className="w-10 h-10 sm:w-9 sm:h-9 rounded-full bg-[var(--rico-surface-base)] hover:bg-[var(--rico-border-weak)] text-[var(--rico-text-strong)] flex items-center justify-center shrink-0 transition-colors duration-100 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/35"
          >
            <X className="w-[18px] h-[18px] stroke-[2]" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Underline Content Navigation */}
      <div className="border-b border-[var(--rico-border-weak)] bg-[var(--rico-bg-stronger)] px-4 sm:px-6 lg:px-8 shrink-0">
        <div
          role="tablist"
          aria-label="Spending sections"
          className="w-full max-w-5xl xl:max-w-6xl mx-auto flex items-center gap-5 sm:gap-6 overflow-x-auto no-scrollbar"
        >
          {tabs.map((tab, idx) => {
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  tabRefs.current[idx] = el;
                }}
                id={`rico-spending-tab-${tab.id}`}
                type="button"
                role="tab"
                tabIndex={selected ? 0 : -1}
                aria-selected={selected}
                aria-controls={`rico-spending-panel-${tab.id}`}
                onClick={() => onSelectTab(tab.id)}
                onKeyDown={(e) => handleTabKeyDown(e, idx)}
                className={`min-h-[42px] py-2.5 border-b-2 text-[13px] font-medium inline-flex items-center gap-1.5 whitespace-nowrap transition-colors duration-100 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--rico-accent)]/35 ${
                  selected
                    ? "border-[var(--rico-text-strong)] text-[var(--rico-text-strong)]"
                    : "border-transparent text-[var(--rico-text-base)] hover:text-[var(--rico-text-strong)]"
                }`}
              >
                <span>{tab.label}</span>
                {typeof tab.count === "number" && (
                  <span
                    className={`font-mono tabular-nums text-[12px] ${
                      selected
                        ? "text-[var(--rico-text-strong)]"
                        : "text-[var(--rico-text-muted)]"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto rico-scroller">
        {activeTab === "rules" && (
          <section
            id="rico-spending-panel-rules"
            role="tabpanel"
            aria-labelledby="rico-spending-tab-rules"
            className="w-full max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5"
          >
            {mandates.length > 0 && (
              <div className="rounded-xl border border-[var(--rico-border-weak)] bg-[var(--rico-surface-elevated)] grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 sm:divide-x divide-[var(--rico-border-weak)]">
                <div className="px-4 py-3.5">
                  <span className="block text-[12px] text-[var(--rico-text-base)]">
                    Active rules
                  </span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-mono tabular-nums text-[18px] font-semibold tracking-[-0.02em] text-[var(--rico-text-strong)]">
                      {rulesSummary.activeCount}
                    </span>
                    <span className="text-[12px] font-mono tabular-nums text-[var(--rico-text-base)]">
                      / {rulesSummary.totalCount}
                    </span>
                  </div>
                </div>

                <div className="px-4 py-3.5">
                  <span className="block text-[12px] text-[var(--rico-text-base)]">
                    Verified monthly
                  </span>
                  <span className="mt-1 block font-mono tabular-nums text-[18px] font-semibold tracking-[-0.02em] text-[var(--rico-text-strong)]">
                    {formatFiat(rulesSummary.verifiedTotal)}
                  </span>
                </div>

                <div className="px-4 py-3.5">
                  <span className="block text-[12px] text-[var(--rico-text-base)]">
                    Authorized cap
                  </span>
                  <span className="mt-1 block font-mono tabular-nums text-[18px] font-semibold tracking-[-0.02em] text-[var(--rico-text-strong)]">
                    {formatFiat(rulesSummary.capTotal)}
                  </span>
                </div>

                <div className="px-4 py-3.5">
                  <span className="block text-[12px] text-[var(--rico-text-base)]">
                    Available headroom
                  </span>
                  <span
                    className={`mt-1 block font-mono tabular-nums text-[18px] font-semibold tracking-[-0.02em] ${
                      rulesSummary.headroomTotal < 0
                        ? "text-red-700"
                        : "text-[var(--rico-text-strong)]"
                    }`}
                  >
                    {formatFiat(rulesSummary.headroomTotal, {
                      signed: rulesSummary.headroomTotal < 0,
                    })}
                  </span>
                </div>
              </div>
            )}

            <AgGridMandatesTable
              mandates={mandates}
              onTriggerMandate={onTriggerMandate}
              onCreateRule={onCreateMandateClick}
              isDarkMode={false}
            />
          </section>
        )}

        {activeTab === "transactions" && (
          <section
            id="rico-spending-panel-transactions"
            role="tabpanel"
            aria-labelledby="rico-spending-tab-transactions"
            className="w-full max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5"
          >
            {transactions.length > 0 && (
              <div className="rounded-xl border border-[var(--rico-border-weak)] bg-[var(--rico-surface-elevated)] grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 sm:divide-x divide-[var(--rico-border-weak)]">
                <div className="px-4 py-3.5">
                  <span className="block text-[12px] text-[var(--rico-text-base)]">
                    Captured charges
                  </span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-mono tabular-nums text-[18px] font-semibold tracking-[-0.02em] text-[var(--rico-text-strong)]">
                      {txSummary.capturedCount}
                    </span>
                    <span className="text-[12px] font-mono tabular-nums text-[var(--rico-text-base)]">
                      / {txSummary.totalCount}
                    </span>
                  </div>
                </div>

                <div className="px-4 py-3.5">
                  <span className="block text-[12px] text-[var(--rico-text-base)]">
                    Total captured
                  </span>
                  <span className="mt-1 block font-mono tabular-nums text-[18px] font-semibold tracking-[-0.02em] text-[var(--rico-text-strong)]">
                    {formatFiat(txSummary.totalCaptured)}
                  </span>
                </div>

                <div className="px-4 py-3.5">
                  <span className="block text-[12px] text-[var(--rico-text-base)]">
                    Average charge
                  </span>
                  <span className="mt-1 block font-mono tabular-nums text-[18px] font-semibold tracking-[-0.02em] text-[var(--rico-text-strong)]">
                    {formatFiat(txSummary.avgCharge)}
                  </span>
                </div>

                <div className="px-4 py-3.5">
                  <span className="block text-[12px] text-[var(--rico-text-base)]">
                    Held or pending
                  </span>
                  <span className="mt-1 block font-mono tabular-nums text-[18px] font-semibold tracking-[-0.02em] text-[var(--rico-text-strong)]">
                    {txSummary.heldCount}
                  </span>
                </div>
              </div>
            )}

            <AgGridTransactionsTable
              transactions={transactions}
              onViewReceipt={onViewReceipt}
              isDarkMode={false}
            />
          </section>
        )}

        {activeTab === "audit" && (
          <section
            id="rico-spending-panel-audit"
            role="tabpanel"
            aria-labelledby="rico-spending-tab-audit"
            className="w-full max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
          >
            {auditLogs.length === 0 ? (
              <div className="rounded-xl border border-[var(--rico-border-weak)] bg-[var(--rico-surface-elevated)] px-6 py-14 text-center">
                <h3 className="m-0 text-[15px] font-semibold tracking-[-0.01em] text-[var(--rico-text-strong)]">
                  No activity recorded yet
                </h3>
                <p className="m-0 mt-1.5 text-[13px] text-[var(--rico-text-base)] max-w-md mx-auto leading-relaxed">
                  Price checks, guardrail holds, and payment confirmations appear here in chronological order.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-[var(--rico-border-weak)] bg-[var(--rico-surface-elevated)] overflow-hidden">
                {/* Activity Toolbar */}
                <div className="px-4 py-3 border-b border-[var(--rico-border-weak)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
                    <div className="relative w-full sm:w-64">
                      <label htmlFor="rico-audit-search" className="sr-only">
                        Filter activity log
                      </label>
                      <Search
                        className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--rico-text-muted)] pointer-events-none"
                        aria-hidden="true"
                      />
                      <input
                        id="rico-audit-search"
                        type="search"
                        autoComplete="off"
                        value={auditQuery}
                        onChange={(e) => setAuditQuery(e.target.value)}
                        placeholder="Filter vendor or event..."
                        className="w-full h-10 sm:h-8 pl-8 pr-7 rounded-lg border border-[var(--rico-border-base)] bg-[var(--rico-bg-stronger)] text-[13px] text-[var(--rico-text-strong)] placeholder:text-[var(--rico-text-muted)] transition-colors duration-100 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/35 focus-visible:border-[var(--rico-accent)]"
                      />
                      {auditQuery && (
                        <button
                          type="button"
                          onClick={() => setAuditQuery("")}
                          aria-label="Clear activity search"
                          className="w-7 h-7 absolute right-1 top-1/2 -translate-y-1/2 rounded-md flex items-center justify-center text-[var(--rico-text-base)] hover:text-[var(--rico-text-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/35"
                        >
                          <X className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      )}
                    </div>

                    <div
                      role="group"
                      aria-label="Filter activity by event type"
                      className="inline-flex items-center p-0.5 rounded-lg bg-[var(--rico-bg-base)] border border-[var(--rico-border-weak)] overflow-x-auto max-w-full no-scrollbar"
                    >
                      {(
                        [
                          { id: "ALL", label: "All" },
                          { id: "PAYMENTS", label: "Payments" },
                          { id: "VERIFICATIONS", label: "Price checks" },
                          { id: "HOLDS", label: "Holds" },
                        ] as const
                      ).map((item) => {
                        const selected = auditFilter === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => setAuditFilter(item.id)}
                            className={`min-h-[36px] sm:min-h-0 sm:h-7 px-2.5 rounded-md text-[12px] font-medium whitespace-nowrap transition-colors duration-100 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/35 ${
                              selected
                                ? "bg-[var(--rico-surface-elevated)] text-[var(--rico-text-strong)] shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                                : "text-[var(--rico-text-base)] hover:text-[var(--rico-text-strong)]"
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleExportAuditCsv}
                    className="h-10 sm:h-8 px-3 rounded-lg border border-[var(--rico-border-weak)] bg-[var(--rico-surface-elevated)] hover:bg-[var(--rico-bg-base)] hover:border-[var(--rico-border-base)] active:translate-y-px text-[12.5px] font-medium text-[var(--rico-text-base)] hover:text-[var(--rico-text-strong)] inline-flex items-center justify-center gap-1.5 shrink-0 transition-colors duration-100 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/35"
                  >
                    <Download className="w-3.5 h-3.5 stroke-[1.8]" aria-hidden="true" />
                    <span>Export CSV</span>
                  </button>
                </div>

                {filteredAuditLogs.length === 0 ? (
                  <div className="px-6 py-12 text-center space-y-3">
                    <p className="m-0 text-[13.5px] font-medium text-[var(--rico-text-strong)]">
                      No activity matches your current filter
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setAuditQuery("");
                        setAuditFilter("ALL");
                      }}
                      className="h-9 px-3.5 rounded-lg border border-[var(--rico-border-base)] bg-[var(--rico-surface-elevated)] hover:bg-[var(--rico-bg-base)] text-[12.5px] font-medium text-[var(--rico-text-strong)] transition-colors duration-100 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/35"
                    >
                      Reset filters
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto rico-scroller">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-[var(--rico-border-weak)] bg-[var(--rico-bg-base)]/75">
                          <th
                            scope="col"
                            className="py-2.5 pl-4 pr-3 text-[12px] font-medium text-[var(--rico-text-base)] whitespace-nowrap"
                          >
                            Event
                          </th>
                          <th
                            scope="col"
                            className="py-2.5 px-3 text-[12px] font-medium text-[var(--rico-text-base)] whitespace-nowrap"
                          >
                            Vendor
                          </th>
                          <th
                            scope="col"
                            className="py-2.5 px-3 text-[12px] font-medium text-[var(--rico-text-base)]"
                          >
                            Details
                          </th>
                          <th
                            scope="col"
                            className="py-2.5 pl-3 pr-4 text-[12px] font-medium text-[var(--rico-text-base)] text-right whitespace-nowrap hidden sm:table-cell"
                          >
                            Time
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--rico-surface-base)]">
                        {filteredAuditLogs.map((log) => {
                          const dotClass =
                            log.severity === "danger"
                              ? "bg-red-600"
                              : log.severity === "warning"
                              ? "bg-amber-500"
                              : log.severity === "success"
                              ? "bg-emerald-600"
                              : "bg-[var(--rico-accent)]";

                          return (
                            <tr
                              key={log.id}
                              className="hover:bg-[var(--rico-bg-base)]/60 transition-colors duration-100 motion-reduce:transition-none"
                            >
                              <td className="py-3.5 pl-4 pr-3 align-top whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center gap-1.5 text-[12.5px] font-medium ${
                                    log.severity === "danger"
                                      ? "text-red-700"
                                      : "text-[var(--rico-text-strong)]"
                                  }`}
                                >
                                  <span
                                    aria-hidden="true"
                                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`}
                                  />
                                  <span>{formatEventLabel(log.eventType)}</span>
                                </span>
                              </td>

                              <td className="py-3.5 px-3 align-top text-[13px] font-medium text-[var(--rico-text-strong)] whitespace-nowrap">
                                {log.service}
                              </td>

                              <td className="py-3.5 px-3 align-top text-[13px] text-[var(--rico-text-base)] leading-relaxed">
                                <div>{log.details}</div>
                                <div className="mt-1 font-mono tabular-nums text-[11.5px] text-[var(--rico-text-muted)] sm:hidden">
                                  {log.timestamp}
                                </div>
                              </td>

                              <td className="py-3.5 pl-3 pr-4 align-top text-right font-mono tabular-nums text-[12px] text-[var(--rico-text-base)] whitespace-nowrap hidden sm:table-cell">
                                {log.timestamp}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {activeTab === "savings" && (
          <section
            id="rico-spending-panel-savings"
            role="tabpanel"
            aria-labelledby="rico-spending-tab-savings"
          >
            <PersonaSavingsPanel
              onDeployPlanMandate={onDeployPlanMandate}
              onRefreshData={onRefreshData}
            />
          </section>
        )}

        {activeTab === "invoices" && (
          <section
            id="rico-spending-panel-invoices"
            role="tabpanel"
            aria-labelledby="rico-spending-tab-invoices"
          >
            <InvoiceOcrPanel onCreateRuleFromInvoice={onDeployPlanMandate} />
          </section>
        )}
      </div>
    </div>
  );
}
