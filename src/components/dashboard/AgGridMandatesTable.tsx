"use client";

import React, { useMemo, useState } from "react";
import { Mandate } from "./types";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Download,
  Plus,
  Search,
  X,
} from "lucide-react";
import { formatFiat, formatRawDecimal } from "@/lib/format-number";

interface AgGridMandatesTableProps {
  mandates: Mandate[];
  onTriggerMandate: (id: string) => void;
  onCreateRule?: () => void;
  isDarkMode?: boolean;
}

type SortKey = "service" | "lastScrapedPrice" | "budgetCeiling" | "headroom" | "nextRun" | "status";
type SortDirection = "asc" | "desc";
type StatusFilter = "ALL" | "ACTIVE" | "ANOMALY_HOLD" | "PAUSED";

function escapeCsvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function AgGridMandatesTable({
  mandates,
  onTriggerMandate,
  onCreateRule,
}: AgGridMandatesTableProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("service");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");

  const statusCounts = useMemo(() => {
    return {
      ALL: mandates.length,
      ACTIVE: mandates.filter((m) => m.status === "ACTIVE").length,
      ANOMALY_HOLD: mandates.filter((m) => m.status === "ANOMALY_HOLD").length,
      PAUSED: mandates.filter((m) => m.status === "PAUSED").length,
    };
  }, [mandates]);

  const filteredAndSorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = mandates.filter((item) => {
      if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
      if (!q) return true;
      return (
        item.service.toLowerCase().includes(q) ||
        (item.category || "").toLowerCase().includes(q) ||
        item.recurrence.toLowerCase().includes(q) ||
        item.nextRun.toLowerCase().includes(q)
      );
    });

    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "service") {
        cmp = a.service.localeCompare(b.service);
      } else if (sortKey === "lastScrapedPrice") {
        cmp = a.lastScrapedPrice - b.lastScrapedPrice;
      } else if (sortKey === "budgetCeiling") {
        cmp = a.budgetCeiling - b.budgetCeiling;
      } else if (sortKey === "headroom") {
        cmp =
          a.budgetCeiling -
          a.lastScrapedPrice -
          (b.budgetCeiling - b.lastScrapedPrice);
      } else if (sortKey === "nextRun") {
        cmp = a.nextRun.localeCompare(b.nextRun);
      } else if (sortKey === "status") {
        cmp = a.status.localeCompare(b.status);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [mandates, query, statusFilter, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "service" || key === "nextRun" || key === "status" ? "asc" : "desc");
    }
  };

  const handleExportCsv = () => {
    const headers = [
      "Vendor",
      "Category",
      "Schedule",
      "Next Billing",
      "Verified Price",
      "Budget Cap",
      "Headroom",
      "Currency",
      "Status",
    ];
    const rows = filteredAndSorted.map((m) => [
      escapeCsvCell(m.service),
      escapeCsvCell(m.category || "Subscription"),
      escapeCsvCell(m.recurrence),
      escapeCsvCell(m.nextRun),
      formatRawDecimal(m.lastScrapedPrice),
      formatRawDecimal(m.budgetCeiling),
      formatRawDecimal(m.budgetCeiling - m.lastScrapedPrice),
      escapeCsvCell(m.currency || "USD"),
      escapeCsvCell(m.status),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rico-spending-rules-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) {
      return (
        <ArrowUpDown
          className="w-3 h-3 text-[var(--rico-text-muted)] opacity-60 group-hover:opacity-100 shrink-0"
          aria-hidden="true"
        />
      );
    }
    return sortDir === "asc" ? (
      <ArrowUp
        className="w-3 h-3 text-[var(--rico-text-strong)] shrink-0"
        aria-hidden="true"
      />
    ) : (
      <ArrowDown
        className="w-3 h-3 text-[var(--rico-text-strong)] shrink-0"
        aria-hidden="true"
      />
    );
  };

  const filterTabs: Array<{ id: StatusFilter; label: string; count: number }> = [
    { id: "ALL", label: "All", count: statusCounts.ALL },
    { id: "ACTIVE", label: "Active", count: statusCounts.ACTIVE },
    { id: "ANOMALY_HOLD", label: "On hold", count: statusCounts.ANOMALY_HOLD },
    { id: "PAUSED", label: "Paused", count: statusCounts.PAUSED },
  ];

  if (mandates.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--rico-border-weak)] bg-[var(--rico-surface-elevated)] px-6 py-14 text-center">
        <h3 className="m-0 text-[15px] font-semibold tracking-[-0.01em] text-[var(--rico-text-strong)]">
          No spending rules yet
        </h3>
        <p className="m-0 mt-1.5 text-[13px] text-[var(--rico-text-base)] max-w-md mx-auto leading-relaxed">
          Set a vendor cap and billing schedule so Rico verifies live pricing before preparing any payment.
        </p>
        {onCreateRule && (
          <div className="mt-5">
            <button
              type="button"
              onClick={onCreateRule}
              className="h-10 sm:h-9 px-4 rounded-lg bg-[var(--rico-primary-bg)] text-[var(--rico-primary-fg)] text-[13px] font-medium inline-flex items-center gap-1.5 hover:opacity-90 active:translate-y-px transition-opacity duration-100 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/40"
            >
              <Plus className="w-4 h-4 stroke-[2]" aria-hidden="true" />
              <span>Create first rule</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--rico-border-weak)] bg-[var(--rico-surface-elevated)] overflow-hidden">
      {/* Ledger Toolbar */}
      <div className="px-4 py-3 border-b border-[var(--rico-border-weak)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
          <div className="relative w-full sm:w-64">
            <label htmlFor="rico-rules-search" className="sr-only">
              Filter spending rules
            </label>
            <Search
              className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--rico-text-muted)] pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="rico-rules-search"
              type="search"
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter vendor or schedule..."
              className="w-full h-10 sm:h-8 pl-8 pr-7 rounded-lg border border-[var(--rico-border-base)] bg-[var(--rico-bg-stronger)] text-[13px] text-[var(--rico-text-strong)] placeholder:text-[var(--rico-text-muted)] transition-colors duration-100 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/35 focus-visible:border-[var(--rico-accent)]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear rule search"
                className="w-7 h-7 absolute right-1 top-1/2 -translate-y-1/2 rounded-md flex items-center justify-center text-[var(--rico-text-base)] hover:text-[var(--rico-text-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/35"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          <div
            role="group"
            aria-label="Filter rules by status"
            className="inline-flex items-center p-0.5 rounded-lg bg-[var(--rico-bg-base)] border border-[var(--rico-border-weak)] overflow-x-auto max-w-full no-scrollbar"
          >
            {filterTabs.map((tab) => {
              if (tab.id !== "ALL" && tab.count === 0 && statusFilter !== tab.id) {
                return null;
              }
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`min-h-[36px] sm:min-h-0 sm:h-7 px-2.5 rounded-md text-[12px] font-medium inline-flex items-center gap-1.5 whitespace-nowrap transition-colors duration-100 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/35 ${
                    active
                      ? "bg-[var(--rico-surface-elevated)] text-[var(--rico-text-strong)] shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                      : "text-[var(--rico-text-base)] hover:text-[var(--rico-text-strong)]"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="font-mono tabular-nums text-[var(--rico-text-muted)]">
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="h-10 sm:h-8 px-3 rounded-lg border border-[var(--rico-border-weak)] bg-[var(--rico-surface-elevated)] hover:bg-[var(--rico-bg-base)] hover:border-[var(--rico-border-base)] active:translate-y-px text-[12.5px] font-medium text-[var(--rico-text-base)] hover:text-[var(--rico-text-strong)] inline-flex items-center justify-center gap-1.5 shrink-0 transition-colors duration-100 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/35"
        >
          <Download className="w-3.5 h-3.5 stroke-[1.8]" aria-hidden="true" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Semantic Ledger Table */}
      {filteredAndSorted.length === 0 ? (
        <div className="px-6 py-12 text-center space-y-3">
          <p className="m-0 text-[13.5px] font-medium text-[var(--rico-text-strong)]">
            No rules match your current filter
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setStatusFilter("ALL");
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
                  aria-sort={
                    sortKey === "service"
                      ? sortDir === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                  className="py-2.5 pl-4 pr-3 text-[12px] font-medium text-[var(--rico-text-base)]"
                >
                  <button
                    type="button"
                    onClick={() => handleSort("service")}
                    className="group inline-flex items-center gap-1.5 hover:text-[var(--rico-text-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/35 rounded"
                  >
                    <span>Vendor</span>
                    {renderSortIcon("service")}
                  </button>
                </th>

                <th
                  scope="col"
                  aria-sort={
                    sortKey === "nextRun"
                      ? sortDir === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                  className="py-2.5 px-3 text-[12px] font-medium text-[var(--rico-text-base)] hidden sm:table-cell"
                >
                  <button
                    type="button"
                    onClick={() => handleSort("nextRun")}
                    className="group inline-flex items-center gap-1.5 hover:text-[var(--rico-text-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/35 rounded"
                  >
                    <span>Schedule</span>
                    {renderSortIcon("nextRun")}
                  </button>
                </th>

                <th
                  scope="col"
                  aria-sort={
                    sortKey === "lastScrapedPrice"
                      ? sortDir === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                  className="py-2.5 px-3 text-[12px] font-medium text-[var(--rico-text-base)] text-right"
                >
                  <button
                    type="button"
                    onClick={() => handleSort("lastScrapedPrice")}
                    className="group inline-flex items-center justify-end gap-1.5 ml-auto hover:text-[var(--rico-text-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/35 rounded"
                  >
                    <span>Verified</span>
                    {renderSortIcon("lastScrapedPrice")}
                  </button>
                </th>

                <th
                  scope="col"
                  aria-sort={
                    sortKey === "budgetCeiling"
                      ? sortDir === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                  className="py-2.5 px-3 text-[12px] font-medium text-[var(--rico-text-base)] text-right"
                >
                  <button
                    type="button"
                    onClick={() => handleSort("budgetCeiling")}
                    className="group inline-flex items-center justify-end gap-1.5 ml-auto hover:text-[var(--rico-text-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/35 rounded"
                  >
                    <span>Cap</span>
                    {renderSortIcon("budgetCeiling")}
                  </button>
                </th>

                <th
                  scope="col"
                  aria-sort={
                    sortKey === "headroom"
                      ? sortDir === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                  className="py-2.5 px-3 text-[12px] font-medium text-[var(--rico-text-base)] text-right hidden md:table-cell"
                >
                  <button
                    type="button"
                    onClick={() => handleSort("headroom")}
                    className="group inline-flex items-center justify-end gap-1.5 ml-auto hover:text-[var(--rico-text-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/35 rounded"
                  >
                    <span>Headroom</span>
                    {renderSortIcon("headroom")}
                  </button>
                </th>

                <th
                  scope="col"
                  aria-sort={
                    sortKey === "status"
                      ? sortDir === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                  className="py-2.5 px-3 text-[12px] font-medium text-[var(--rico-text-base)]"
                >
                  <button
                    type="button"
                    onClick={() => handleSort("status")}
                    className="group inline-flex items-center gap-1.5 hover:text-[var(--rico-text-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/35 rounded"
                  >
                    <span>Status</span>
                    {renderSortIcon("status")}
                  </button>
                </th>

                <th
                  scope="col"
                  className="py-2.5 pl-3 pr-4 text-[12px] font-medium text-[var(--rico-text-base)] text-right"
                >
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--rico-surface-base)]">
              {filteredAndSorted.map((mandate) => {
                const headroom = mandate.budgetCeiling - mandate.lastScrapedPrice;
                const isExceeded = headroom < 0;

                const statusLabel =
                  mandate.status === "ACTIVE"
                    ? "Active"
                    : mandate.status === "ANOMALY_HOLD"
                    ? "On hold"
                    : "Paused";

                const statusDotClass =
                  mandate.status === "ACTIVE"
                    ? "bg-emerald-600"
                    : mandate.status === "ANOMALY_HOLD"
                    ? "bg-red-600"
                    : "bg-[var(--rico-text-muted)]";

                return (
                  <tr
                    key={mandate.id}
                    className="hover:bg-[var(--rico-bg-base)]/60 transition-colors duration-100 motion-reduce:transition-none"
                  >
                    <td className="py-3.5 pl-4 pr-3 align-middle">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          aria-hidden="true"
                          className="w-8 h-8 rounded-md bg-[var(--rico-surface-base)] border border-[var(--rico-border-weak)] flex items-center justify-center text-[12px] font-semibold text-[var(--rico-text-strong)] shrink-0"
                        >
                          {mandate.service.trim().charAt(0).toUpperCase() || "R"}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[13.5px] font-medium text-[var(--rico-text-strong)] truncate max-w-[180px] sm:max-w-[240px]">
                            {mandate.service}
                          </div>
                          <div className="text-[12px] text-[var(--rico-text-base)] truncate">
                            {mandate.category || "Subscription"}
                            <span className="sm:hidden"> · {mandate.recurrence}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 align-middle hidden sm:table-cell">
                      <div className="text-[13px] text-[var(--rico-text-strong)]">
                        {mandate.recurrence}
                      </div>
                      <div className="text-[12px] font-mono tabular-nums text-[var(--rico-text-base)]">
                        Next {mandate.nextRun}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 align-middle text-right font-mono tabular-nums text-[13px]">
                      <span
                        className={
                          isExceeded
                            ? "font-medium text-red-700"
                            : "font-medium text-[var(--rico-text-strong)]"
                        }
                      >
                        {formatFiat(mandate.lastScrapedPrice)}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 align-middle text-right font-mono tabular-nums text-[13px] text-[var(--rico-text-base)]">
                      {formatFiat(mandate.budgetCeiling)}
                    </td>

                    <td className="py-3.5 px-3 align-middle text-right font-mono tabular-nums text-[13px] hidden md:table-cell">
                      <span
                        className={
                          isExceeded
                            ? "font-medium text-red-700"
                            : "text-[var(--rico-text-base)]"
                        }
                      >
                        {formatFiat(headroom, { signed: isExceeded })}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 align-middle whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[12.5px] ${
                          mandate.status === "ANOMALY_HOLD"
                            ? "font-medium text-red-700"
                            : "text-[var(--rico-text-strong)]"
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDotClass}`}
                        />
                        <span>{statusLabel}</span>
                      </span>
                    </td>

                    <td className="py-3.5 pl-3 pr-4 align-middle text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onTriggerMandate(mandate.id)}
                        aria-label={`Run spending rule for ${mandate.service}`}
                        className="min-h-[40px] sm:min-h-0 sm:h-8 px-3 rounded-lg border border-[var(--rico-border-base)] bg-[var(--rico-surface-elevated)] hover:bg-[var(--rico-bg-base)] active:translate-y-px text-[12.5px] font-medium text-[var(--rico-text-strong)] transition-colors duration-100 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/35"
                      >
                        Run
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
