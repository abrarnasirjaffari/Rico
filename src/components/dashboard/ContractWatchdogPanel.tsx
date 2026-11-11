"use client";

import React, { useState, useEffect } from "react";
import { Calendar, CheckCircle2, RefreshCw, Loader2 } from "lucide-react";

interface ContractAuditItem {
  id: string;
  service: string;
  vendorName: string;
  renewalDate: string;
  noticeWindowDays: number;
  currentAnnualCost: number;
  projectedEscalationPercent: number;
  riskSeverity: "HIGH" | "MEDIUM" | "LOW";
  status: "FLAGGED" | "REMEDIATED" | "PROTECTED";
  clauseSnippet: string;
}

const DEFAULT_CONTRACTS: ContractAuditItem[] = [
  {
    id: "cnt-adobe-cc",
    service: "Adobe Creative Cloud Teams",
    vendorName: "Adobe Inc.",
    renewalDate: "Dec 01, 2026",
    noticeWindowDays: 30,
    currentAnnualCost: 1200.0,
    projectedEscalationPercent: 20,
    riskSeverity: "HIGH",
    status: "FLAGGED",
    clauseSnippet:
      "Auto-renews for 12 months with a 20% price adjustment unless cancelled 30 days prior.",
  },
  {
    id: "cnt-snowflake",
    service: "Snowflake Enterprise Warehouse",
    vendorName: "Snowflake Computing",
    renewalDate: "Jan 15, 2027",
    noticeWindowDays: 60,
    currentAnnualCost: 4800.0,
    projectedEscalationPercent: 15,
    riskSeverity: "HIGH",
    status: "FLAGGED",
    clauseSnippet:
      "Capacity commitments replenish automatically with a 15% annual escalator clause.",
  },
  {
    id: "cnt-twilio",
    service: "Twilio Communications API",
    vendorName: "Twilio Inc.",
    renewalDate: "Feb 10, 2027",
    noticeWindowDays: 45,
    currentAnnualCost: 2400.0,
    projectedEscalationPercent: 10,
    riskSeverity: "MEDIUM",
    status: "PROTECTED",
    clauseSnippet: "Rate lock active through Q1 2027.",
  },
];

export function ContractWatchdogPanel() {
  const [contracts, setContracts] =
    useState<ContractAuditItem[]>(DEFAULT_CONTRACTS);
  const [loading, setLoading] = useState(false);
  const [remediatingId, setRemediatingId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/contracts/watchdog/status");
      if (res.ok) {
        const data = await res.json();
        if (data.contracts && data.contracts.length > 0) {
          setContracts(data.contracts);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleRemediate = async (contract: ContractAuditItem) => {
    setRemediatingId(contract.id);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/contracts/watchdog/remediate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mandateId: contract.id,
          service: contract.service,
          action: "PAUSE_MANDATE",
          reason: "Opt-out auto-renewal requested via Contract Watchdog",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setContracts((prev) =>
          prev.map((c) =>
            c.id === contract.id ? { ...c, status: "REMEDIATED" } : c
          )
        );
        setStatusMsg(
          `Opt-out notice queued for ${contract.service}. Auto-renewal frozen.`
        );
      } else {
        setStatusMsg(data.error || "Remediation failed.");
      }
    } catch {
      setStatusMsg("Network error during remediation.");
    } finally {
      setRemediatingId(null);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[#F5F8FC] text-[#0F172A]">
      <div className="max-w-4xl mx-auto px-6 py-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-[#0F172A]">
              Contract Watchdog
            </h2>
            <p className="text-xs text-[#52637A] mt-1">
              Track notice windows, auto-renewal traps, and annual price escalators.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchStatus}
            className="h-9 px-3.5 rounded-lg border border-[#DCE7F3] bg-white hover:bg-[#FAFBFD] text-[#0F172A] text-xs font-medium flex items-center gap-1.5 transition-colors duration-150 self-start"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh audit</span>
          </button>
        </div>

        {statusMsg && (
          <div className="px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2 border bg-emerald-50/80 text-emerald-800 border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        <div className="rounded-xl border border-[#DCE7F3] bg-white divide-y divide-[#EDF3FA] shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
          {contracts.map((c) => (
            <div key={c.id} className="p-5 space-y-3 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-semibold text-sm text-[#0F172A]">
                      {c.service}
                    </span>
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        c.status === "REMEDIATED"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : c.riskSeverity === "HIGH"
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-[#F2F6FC] text-[#52637A]"
                      }`}
                    >
                      {c.status === "REMEDIATED"
                        ? "Opt-out sent"
                        : c.status === "FLAGGED"
                        ? `+${c.projectedEscalationPercent}% escalator`
                        : "Protected"}
                    </span>
                  </div>

                  <div className="text-[#52637A] flex flex-wrap items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#7B8BA1]" />
                      <span>Renews {c.renewalDate}</span>
                    </span>
                    <span>·</span>
                    <span className="tabular-nums">
                      {c.noticeWindowDays}-day notice window
                    </span>
                  </div>
                </div>

                <div className="sm:text-right shrink-0">
                  <span className="text-sm font-semibold font-mono tabular-nums text-[#0F172A] block">
                    ${c.currentAnnualCost.toLocaleString()}/yr
                  </span>
                  <span className="text-[11px] text-[#7B8BA1] font-mono tabular-nums">
                    +$
                    {(
                      (c.currentAnnualCost * c.projectedEscalationPercent) /
                      100
                    ).toFixed(0)}{" "}
                    projected increase
                  </span>
                </div>
              </div>

              <p className="m-0 p-3 rounded-lg bg-[#FAFBFD] border border-[#E8EFF7] text-xs text-[#52637A] leading-relaxed">
                {c.clauseSnippet}
              </p>

              <div className="flex items-center justify-end pt-0.5">
                {c.status !== "REMEDIATED" ? (
                  <button
                    type="button"
                    onClick={() => handleRemediate(c)}
                    disabled={remediatingId === c.id}
                    className="h-8 px-3.5 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-medium flex items-center gap-1.5 transition-colors duration-150 disabled:opacity-50"
                  >
                    {remediatingId === c.id && (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    )}
                    <span>Freeze auto-renewal</span>
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Notice recorded</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
