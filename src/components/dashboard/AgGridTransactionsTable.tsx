"use client";

import React, { useMemo, useState } from "react";
import { Transaction } from "./types";
import { ReceiptData } from "./ReceiptDialog";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  Copy,
  Download,
  Search,
  X,
} from "lucide-react";
import { formatFiat, formatRawDecimal } from "@/lib/format-number";

interface AgGridTransactionsTableProps {
  transactions: Transaction[];
  onViewReceipt: (receipt: ReceiptData) => void;
  isDarkMode?: boolean;
}

type SortKey = "service" | "orderId" | "timestamp" | "amount" | "status";
type SortDirection = "asc" | "desc";
type TxStatusFilter = "ALL" | "COMPLETED" | "PENDING" | "BLOCKED";

function escapeCsvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatPaymentMethod(tx: Transaction): string {
  const rail = tx.receiptData?.fundingRail || "PAYPAL";
  const lastFour = tx.receiptData?.cardLastFour;
  const failoverSuffix = tx.receiptData?.isCascaded ? " (failover)" : "";

  if (rail === "VISA") {
    return `Visa ${lastFour ? `•••• ${lastFour}` : ""}${failoverSuffix}`.trim();
  }
  if (rail === "MASTERCARD") {
    return `Mastercard ${lastFour ? `•••• ${lastFour}` : ""}${failoverSuffix}`.trim();
  }
  return "PayPal";
}

export function AgGridTransactionsTable({
  transactions,
  onViewReceipt,
}: AgGridTransactionsTableProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TxStatusFilter>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("timestamp");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyOrderId = (orderId: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(orderId);
      setCopiedId(orderId);
      setTimeout(() => setCopiedId((curr) => (curr === orderId ? null : curr)), 1500);
    }
  };

  const statusCounts = useMemo(() => {
    return {
      ALL: transactions.length,
      COMPLETED: transactions.filter((t) => t.status === "COMPLETED").length,
      PENDING: transactions.filter((t) => t.status === "PENDING").length,
      BLOCKED: transactions.filter((t) => t.status === "BLOCKED").length,
    };
  }, [transactions]);

  const filteredAndSorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = transactions.filter((tx) => {
      if (statusFilter !== "ALL" && tx.status !== statusFilter) return false;
      if (!q) return true;
      return (
        tx.service.toLowerCase().includes(q) ||
        tx.orderId.toLowerCase().includes(q) ||
        (tx.receiptData?.planName || "").toLowerCase().includes(q) ||
        formatPaymentMethod(tx).toLowerCase().includes(q)
      );
    });

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "service") {
        cmp = a.service.localeCompare(b.service);
      } else if (sortKey === "orderId") {
        cmp = a.orderId.localeCompare(b.orderId);
      } else if (sortKey === "amount") {
        cmp = a.amount - b.amount;
      } else if (sortKey === "status") {
        cmp = a.status.localeCompare(b.status);
      } else {
        const ta = Date.parse(a.timestamp);
        const tb = Date.parse(b.timestamp);
        if (!Number.isNaN(ta) && !Number.isNaN(tb)) {
          cmp = ta - tb;
        } else {
          cmp = a.timestamp.localeCompare(b.timestamp);
        }
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [transactions, query, statusFilter, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "service" || key === "orderId" ? "asc" : "desc");
    }
  };

  const handleExportCsv = () => {
    const headers = [
      "Order ID",
      "Vendor",
      "Plan",
      "Method",
      "Date",
      "Status",
      "Amount",
      "Currency",
    ];
    const rows = filteredAndSorted.map((tx) => [
      escapeCsvCell(tx.orderId),
      escapeCsvCell(tx.service),
      escapeCsvCell(tx.receiptData?.planName || ""),
      escapeCsvCell(formatPaymentMethod(tx)),
      escapeCsvCell(tx.timestamp),
      escapeCsvCell(tx.status),
      formatRawDecimal(tx.amount),
      escapeCsvCell(tx.currency || "USD"),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rico-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
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

  const filterTabs: Array<{ id: TxStatusFilter; label: string; count: number }> = [
    { id: "ALL", label: "All", count: statusCounts.ALL },
    { id: "COMPLETED", label: "Captured", count: statusCounts.COMPLETED },
    { id: "PENDING", label: "Pending", count: statusCounts.PENDING },
    { id: "BLOCKED", label: "Blocked", count: statusCounts.BLOCKED },
  ];

  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--rico-border-weak)] bg-[var(--rico-surface-elevated)] px-6 py-14 text-center">
        <h3 className="m-0 text-[15px] font-semibold tracking-[-0.01em] text-[var(--rico-text-strong)]">
          No transactions yet
        </h3>
        <p className="m-0 mt-1.5 text-[13px] text-[var(--rico-text-base)] max-w-md mx-auto leading-relaxed">
          Verified PayPal and backup card charges will appear here with downloadable receipts.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--rico-border-weak)] bg-[var(--rico-surface-elevated)] overflow-hidden">
      {/* Ledger Toolbar */}
      <div className="px-4 py-3 border-b border-[var(--rico-border-weak)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
          <div className="relative w-full sm:w-64">
            <label htmlFor="rico-tx-search" className="sr-only">
              Filter transactions
            </label>
            <Search
              className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--rico-text-muted)] pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="rico-tx-search"
              type="search"
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter vendor or order ID..."
              className="w-full h-10 sm:h-8 pl-8 pr-7 rounded-lg border border-[var(--rico-border-base)] bg-[var(--rico-bg-stronger)] text-[13px] text-[var(--rico-text-strong)] placeholder:text-[var(--rico-text-muted)] transition-colors duration-100 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/35 focus-visible:border-[var(--rico-accent)]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear transaction search"
                className="w-7 h-7 absolute right-1 top-1/2 -translate-y-1/2 rounded-md flex items-center justify-center text-[var(--rico-text-base)] hover:text-[var(--rico-text-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/35"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          <div
            role="group"
            aria-label="Filter transactions by status"
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

      {filteredAndSorted.length === 0 ? (
        <div className="px-6 py-12 text-center space-y-3">
          <p className="m-0 text-[13.5px] font-medium text-[var(--rico-text-strong)]">
            No transactions match your current filter
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
                    sortKey === "orderId"
                      ? sortDir === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                  className="py-2.5 px-3 text-[12px] font-medium text-[var(--rico-text-base)] hidden md:table-cell"
                >
                  <button
                    type="button"
                    onClick={() => handleSort("orderId")}
                    className="group inline-flex items-center gap-1.5 hover:text-[var(--rico-text-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/35 rounded"
                  >
                    <span>Order ID</span>
                    {renderSortIcon("orderId")}
                  </button>
                </th>

                <th
                  scope="col"
                  className="py-2.5 px-3 text-[12px] font-medium text-[var(--rico-text-base)] hidden lg:table-cell"
                >
                  Method
                </th>

                <th
                  scope="col"
                  aria-sort={
                    sortKey === "timestamp"
                      ? sortDir === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                  className="py-2.5 px-3 text-[12px] font-medium text-[var(--rico-text-base)] hidden sm:table-cell"
                >
                  <button
                    type="button"
                    onClick={() => handleSort("timestamp")}
                    className="group inline-flex items-center gap-1.5 hover:text-[var(--rico-text-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/35 rounded"
                  >
                    <span>Date</span>
                    {renderSortIcon("timestamp")}
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
                  aria-sort={
                    sortKey === "amount"
                      ? sortDir === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                  className="py-2.5 px-3 text-[12px] font-medium text-[var(--rico-text-base)] text-right"
                >
                  <button
                    type="button"
                    onClick={() => handleSort("amount")}
                    className="group inline-flex items-center justify-end gap-1.5 ml-auto hover:text-[var(--rico-text-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/35 rounded"
                  >
                    <span>Amount</span>
                    {renderSortIcon("amount")}
                  </button>
                </th>

                <th
                  scope="col"
                  className="py-2.5 pl-3 pr-4 text-[12px] font-medium text-[var(--rico-text-base)] text-right"
                >
                  <span className="sr-only">Receipt</span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--rico-surface-base)]">
              {filteredAndSorted.map((tx) => {
                const isCopied = copiedId === tx.orderId;
                const statusLabel =
                  tx.status === "COMPLETED"
                    ? "Captured"
                    : tx.status === "BLOCKED"
                    ? "Blocked"
                    : "Pending";
                const statusDotClass =
                  tx.status === "COMPLETED"
                    ? "bg-emerald-600"
                    : tx.status === "BLOCKED"
                    ? "bg-red-600"
                    : "bg-amber-500";

                return (
                  <tr
                    key={tx.id}
                    className="hover:bg-[var(--rico-bg-base)]/60 transition-colors duration-100 motion-reduce:transition-none"
                  >
                    <td className="py-3.5 pl-4 pr-3 align-middle">
                      <div className="text-[13.5px] font-medium text-[var(--rico-text-strong)] truncate max-w-[180px] sm:max-w-[230px]">
                        {tx.service}
                      </div>
                      <div className="text-[12px] text-[var(--rico-text-base)] truncate max-w-[220px]">
                        {tx.receiptData?.planName || formatPaymentMethod(tx)}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 align-middle hidden md:table-cell">
                      <div className="inline-flex items-center gap-1.5 font-mono tabular-nums text-[12.5px] text-[var(--rico-text-base)]">
                        <span title={tx.orderId} className="truncate max-w-[140px]">
                          {tx.orderId}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyOrderId(tx.orderId)}
                          aria-label={isCopied ? "Order ID copied" : `Copy order ID ${tx.orderId}`}
                          className="min-w-[28px] min-h-[28px] rounded-md inline-flex items-center justify-center gap-1 px-1 text-[var(--rico-text-muted)] hover:text-[var(--rico-text-strong)] hover:bg-[var(--rico-surface-base)] transition-colors duration-100 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/35"
                        >
                          {isCopied ? (
                            <>
                              <Check
                                className="w-3.5 h-3.5 text-emerald-700"
                                aria-hidden="true"
                              />
                              <span className="font-sans text-[11.5px] font-medium text-emerald-700">
                                Copied
                              </span>
                            </>
                          ) : (
                            <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 align-middle text-[13px] text-[var(--rico-text-base)] hidden lg:table-cell whitespace-nowrap">
                      {formatPaymentMethod(tx)}
                    </td>

                    <td className="py-3.5 px-3 align-middle font-mono tabular-nums text-[12.5px] text-[var(--rico-text-base)] hidden sm:table-cell whitespace-nowrap">
                      {tx.timestamp}
                    </td>

                    <td className="py-3.5 px-3 align-middle whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[12.5px] ${
                          tx.status === "BLOCKED"
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

                    <td className="py-3.5 px-3 align-middle text-right font-mono tabular-nums text-[13.5px] font-medium text-[var(--rico-text-strong)] whitespace-nowrap">
                      {formatFiat(tx.amount)}
                    </td>

                    <td className="py-3.5 pl-3 pr-4 align-middle text-right whitespace-nowrap">
                      {tx.receiptData ? (
                        <button
                          type="button"
                          onClick={() => tx.receiptData && onViewReceipt(tx.receiptData)}
                          aria-label={`Open receipt for ${tx.service}`}
                          className="min-h-[40px] sm:min-h-0 sm:h-8 px-2.5 rounded-lg border border-[var(--rico-border-weak)] hover:border-[var(--rico-border-base)] bg-[var(--rico-surface-elevated)] hover:bg-[var(--rico-bg-base)] active:translate-y-px text-[12.5px] font-medium text-[var(--rico-text-base)] hover:text-[var(--rico-text-strong)] transition-colors duration-100 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/35"
                        >
                          Receipt
                        </button>
                      ) : (
                        <span className="text-[12px] font-mono text-[var(--rico-text-muted)]">
                          --
                        </span>
                      )}
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
