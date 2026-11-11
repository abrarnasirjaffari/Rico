"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Mail,
  Loader2,
} from "lucide-react";

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
    clauseSnippet: "Agreement auto-renews for 12 months with a 20% price adjustment unless cancelled 30 days prior.",
  },
  {
    id: "cnt-snowflake",
    service: "Snowflake Enterprise Data Warehouse",
    vendorName: "Snowflake Computing",
    renewalDate: "Jan 15, 2027",
    noticeWindowDays: 60,
    currentAnnualCost: 4800.0,
    projectedEscalationPercent: 15,
    riskSeverity: "HIGH",
    status: "FLAGGED",
    clauseSnippet: "Capacity commitments automatically replenish with 15% tier escalator clause on annual cycle.",
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
    clauseSnippet: "Enterprise rate lock active through Q1 2027.",
  },
];

export function ContractWatchdogPanel() {
  const [contracts, setContracts] = useState<ContractAuditItem[]>(DEFAULT_CONTRACTS);
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
          contractId: contract.id,
          service: contract.service,
          strategy: "OPT_OUT_AUTO_RENEW",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setContracts((prev) =>
          prev.map((c) => (c.id === contract.id ? { ...c, status: "REMEDIATED" } : c))
        );
        setStatusMsg(`Remediation notice dispatched for ${contract.service}! Auto-renewal freeze logged.`);
      } else {
        setStatusMsg(data.error || "Remediation action failed.");
      }
    } catch {
      setStatusMsg("Network error during remediation.");
    } finally {
      setRemediatingId(null);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#F6FAFF] text-[#0F172A] overflow-y-auto p-4 space-y-4 font-[Inter,system-ui,sans-serif]">
      {/* Top Banner */}
      <div className="p-4 rounded-xl border border-[#C8DDF8] bg-white shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E2EEFD] border border-[#BFD7F7] flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#0F172A]">
                Contract Renewal &amp; Escalator Watchdog
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 text-[10px] font-semibold font-mono">
                Auto-Renewal Freeze Active
              </span>
            </div>
            <p className="text-xs text-[#52637A] mt-0.5">
              Continuously audit enterprise vendor agreements for hidden 15–25% price escalators, auto-renewal traps, and mandatory opt-out deadlines.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchStatus}
          className="h-8 px-3 rounded-lg border border-[#C8DDF8] bg-white hover:bg-[#E2EEFD] text-[#0F172A] text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Audit Agreements</span>
        </button>
      </div>

      {statusMsg && (
        <div className="p-3 rounded-lg text-xs flex items-center gap-2 border bg-emerald-50 text-emerald-800 border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Contracts Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-[#0F172A]">
            Monitored Vendor Contracts ({contracts.length})
          </span>
          <span className="text-[10px] text-[#52637A] font-mono">
            Notice Window Alerts: 30–60 Days Prior
          </span>
        </div>

        <div className="space-y-2.5">
          {contracts.map((c) => (
            <div
              key={c.id}
              className="p-4 rounded-xl border border-[#C8DDF8] bg-white shadow-2xs hover:border-[#93C5FD] transition-all space-y-3 text-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#0F172A]">{c.service}</span>
                    <span className="text-[11px] text-[#52637A]">({c.vendorName})</span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                        c.status === "REMEDIATED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : c.riskSeverity === "HIGH"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#52637A] mt-1 flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#64748B]" />
                      Renewal: <strong className="text-[#0F172A]">{c.renewalDate}</strong>
                    </span>
                    <span>•</span>
                    <span>Notice required: {c.noticeWindowDays} days prior</span>
                    <span>•</span>
                    <span className="text-red-600 font-bold font-mono">
                      +{c.projectedEscalationPercent}% auto-escalator
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm font-bold font-mono text-[#0F172A] block">
                    ${c.currentAnnualCost.toLocaleString()} / yr
                  </span>
                  <span className="text-[10px] text-red-600 font-mono font-medium">
                    +${((c.currentAnnualCost * c.projectedEscalationPercent) / 100).toFixed(0)} increase risk
                  </span>
                </div>
              </div>

              {/* Clause Quote */}
              <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#DCE9FA] text-[11px] text-[#475569] font-mono italic">
                &ldquo;{c.clauseSnippet}&rdquo;
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-[#52637A]">
                  Rico automated watchdog monitoring is active.
                </span>

                {c.status !== "REMEDIATED" ? (
                  <button
                    type="button"
                    onClick={() => handleRemediate(c)}
                    disabled={remediatingId === c.id}
                    className="h-8 px-3.5 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all disabled:opacity-50"
                  >
                    {remediatingId === c.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Mail className="w-3 h-3" />
                    )}
                    <span>1-Click Freeze &amp; Renegotiate</span>
                  </button>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Opt-Out Notice Sent</span>
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
