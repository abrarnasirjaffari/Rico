"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  CreditCard,
  XCircle,
  RefreshCw,
  Zap,
  Check,
} from "lucide-react";
import { Mandate } from "./types";

interface PriceSentinelPanelProps {
  mandates: Mandate[];
  onRefreshData?: () => void;
}

interface SentinelStats {
  monitoringMode: "scheduled" | "awaiting_run" | "manual_only";
  lastScheduledRunAt: string | null;
  telegramMode: string;
  intervalMinutes: number;
  totalAuditsRun: number;
  anomaliesDetected: number;
  savingsIdentified: number;
  lastRunAt: string | null;
  pendingAlertsCount: number;
}

export function PriceSentinelPanel({
  mandates,
  onRefreshData,
}: PriceSentinelPanelProps) {
  const [stats, setStats] = useState<SentinelStats>({
    monitoringMode: "manual_only",
    lastScheduledRunAt: null,
    telegramMode: "SIMULATED_MOCK",
    intervalMinutes: 1440,
    totalAuditsRun: 0,
    anomaliesDetected: 0,
    savingsIdentified: 0,
    lastRunAt: "Not run yet",
    pendingAlertsCount: 0,
  });

  const monitoringStatus = {
    scheduled: "Daily scheduled audits",
    awaiting_run: "Scheduler configured",
    manual_only: "On-demand audits",
  }[stats.monitoringMode];

  const [activeChannel, setActiveChannel] = useState<
    "telegram" | "whatsapp" | "slack"
  >("telegram");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [runningAudit, setRunningAudit] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const [demoAlert, setDemoAlert] = useState({
    mandateId: "mandate-adobe-cc",
    service: "Adobe Creative Cloud",
    oldPrice: 35.0,
    newPrice: 54.99,
    jumpPercent: 57,
    budgetCeiling: 40.0,
    status: "PENDING" as "PENDING" | "APPROVED" | "BACKUP_PAID" | "CANCELLED",
  });

  useEffect(() => {
    const adobe = mandates.find((m) =>
      m.service.toLowerCase().includes("adobe")
    );
    if (adobe) {
      setDemoAlert((prev) => ({
        ...prev,
        mandateId: adobe.id,
        budgetCeiling: adobe.budgetCeiling,
        oldPrice: adobe.lastScrapedPrice > 0 ? adobe.lastScrapedPrice : 35.0,
      }));
    } else if (mandates.length > 0) {
      const first = mandates[0];
      setDemoAlert((prev) => ({
        ...prev,
        mandateId: first.id,
        service: first.service,
        budgetCeiling: first.budgetCeiling,
        oldPrice:
          first.lastScrapedPrice > 0
            ? first.lastScrapedPrice
            : first.budgetCeiling * 0.8,
      }));
    }
  }, [mandates]);

  const fetchSentinelStatus = async () => {
    try {
      const res = await fetch("/api/sentinel/status");
      if (res.ok) {
        const data = await res.json();
        if (data.sentinel) {
          setStats((prev) => ({
            ...prev,
            monitoringMode: data.sentinel.monitoring?.mode ?? "manual_only",
            lastScheduledRunAt:
              data.sentinel.monitoring?.lastScheduledRunAt ?? null,
            telegramMode:
              data.sentinel.channels?.telegram?.mode ?? "SIMULATED_MOCK",
            totalAuditsRun:
              data.sentinel.totalAuditsRun || prev.totalAuditsRun,
            anomaliesDetected:
              data.sentinel.anomaliesDetected || prev.anomaliesDetected,
            savingsIdentified:
              data.sentinel.savingsIdentified || prev.savingsIdentified,
            lastRunAt: data.sentinel.lastRunAt || prev.lastRunAt,
            pendingAlertsCount:
              data.sentinel.pendingAlertsCount ?? prev.pendingAlertsCount,
          }));
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchSentinelStatus();
  }, []);

  const handleRemoteButtonAction = async (
    action: "approve" | "backup_card" | "cancel"
  ) => {
    setLoadingAction(action);
    setActionSuccessMsg(null);

    try {
      let targetMandateId = demoAlert.mandateId;
      const matched = mandates.find(
        (m) =>
          m.id === targetMandateId ||
          m.service
            .toLowerCase()
            .includes(demoAlert.service.toLowerCase().slice(0, 5))
      );
      if (matched) {
        targetMandateId = matched.id;
      }

      const res = await fetch("/api/sentinel/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          mandateId: targetMandateId,
          price: demoAlert.newPrice,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setDemoAlert((prev) => ({
          ...prev,
          status:
            action === "approve"
              ? "APPROVED"
              : action === "backup_card"
              ? "BACKUP_PAID"
              : "CANCELLED",
        }));
        setActionSuccessMsg(data.result.message);
        if (onRefreshData) onRefreshData();
        fetchSentinelStatus();
      } else {
        setActionSuccessMsg(data.error || "Action failed.");
      }
    } catch (err) {
      setActionSuccessMsg(
        `Network error: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setLoadingAction(null);
    }
  };

  const handleTriggerAudit = async (forceSpike: boolean = false) => {
    setRunningAudit(true);
    setActionSuccessMsg(null);
    try {
      const res = await fetch("/api/sentinel/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          forceSpike,
          service: forceSpike ? "Adobe" : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.summary) {
        setStats((prev) => ({
          ...prev,
          totalAuditsRun: prev.totalAuditsRun + data.summary.totalAudited,
          anomaliesDetected:
            prev.anomaliesDetected + data.summary.anomaliesDetected,
          lastRunAt: "Just now",
        }));
        if (forceSpike) {
          setDemoAlert((prev) => ({
            ...prev,
            status: "PENDING",
            newPrice: 54.99,
            jumpPercent: 57,
          }));
        }
        setActionSuccessMsg(data.message);
        if (onRefreshData) onRefreshData();
        fetchSentinelStatus();
      } else {
        setActionSuccessMsg(data.error || "Audit could not run.");
      }
    } catch (err) {
      setActionSuccessMsg(
        `Audit failed: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setRunningAudit(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[#F5F8FC] text-[#0F172A]">
      <div className="max-w-4xl mx-auto px-6 py-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-[#0F172A]">
              Price Sentinel
            </h2>
            <p className="text-xs text-[#52637A] mt-1 tabular-nums">
              {monitoringStatus} · {stats.totalAuditsRun} checks ·{" "}
              {stats.anomaliesDetected} holds
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={runningAudit}
              onClick={() => handleTriggerAudit(true)}
              className="h-9 px-3.5 text-xs font-medium rounded-lg border border-[#DCE7F3] bg-white hover:bg-[#FAFBFD] text-[#334155] transition-colors duration-150 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              <span>Simulate +57% spike</span>
            </button>

            <button
              type="button"
              disabled={runningAudit}
              onClick={() => handleTriggerAudit(false)}
              className="h-9 px-3.5 text-xs font-medium rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white transition-colors duration-150 flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${runningAudit ? "animate-spin" : ""}`}
              />
              <span>Run audit</span>
            </button>
          </div>
        </div>

        {actionSuccessMsg && (
          <div className="px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50/80 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Interactive Alert Preview */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#52637A]">
                Alert preview
              </span>

              <div className="flex items-center gap-1 bg-[#EDF3FA] border border-[#DCE7F3] rounded-lg p-0.5 text-xs">
                {(["telegram", "whatsapp", "slack"] as const).map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setActiveChannel(ch)}
                    className={`px-2.5 py-1 rounded-md capitalize font-medium transition-colors duration-150 ${
                      activeChannel === ch
                        ? "bg-white text-[#0F172A] shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
                        : "text-[#52637A] hover:text-[#0F172A]"
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>

            {activeChannel === "telegram" ? (
              <div className="rounded-xl border border-[#DCE7F3] bg-white p-5 space-y-4 shadow-[0_1px_3px_rgba(15,23,42,0.03)] text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-[#EDF3FA]">
                  <div>
                    <div className="font-semibold text-sm text-[#0F172A]">
                      Price spike hold — {demoAlert.service}
                    </div>
                    <div className="text-[11px] text-[#7B8BA1] mt-0.5">
                      {stats.telegramMode === "LIVE_BOT"
                        ? "Telegram bot connected"
                        : "Interactive preview"}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-medium tabular-nums">
                    +{demoAlert.jumpPercent}%
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5 p-3 rounded-lg bg-[#FAFBFD] border border-[#E8EFF7] font-mono tabular-nums">
                  <div>
                    <span className="text-[11px] text-[#7B8BA1] font-sans block">
                      Previous
                    </span>
                    <span className="text-[#52637A]">
                      ${demoAlert.oldPrice.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#7B8BA1] font-sans block">
                      Detected
                    </span>
                    <span className="font-semibold text-red-600">
                      ${demoAlert.newPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-[#7B8BA1] font-sans block">
                      Rule cap
                    </span>
                    <span className="text-[#0F172A] font-medium">
                      ${demoAlert.budgetCeiling.toFixed(2)}
                    </span>
                  </div>
                </div>

                {demoAlert.status === "PENDING" ? (
                  <div className="space-y-2">
                    <button
                      type="button"
                      disabled={loadingAction !== null}
                      onClick={() => handleRemoteButtonAction("approve")}
                      className="w-full h-9 px-3 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors duration-150 disabled:opacity-50"
                    >
                      {loadingAction === "approve" ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span className="tabular-nums">
                        Approve one-time (${demoAlert.newPrice.toFixed(2)})
                      </span>
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={loadingAction !== null}
                        onClick={() => handleRemoteButtonAction("backup_card")}
                        className="h-9 px-3 rounded-lg border border-[#DCE7F3] bg-white hover:bg-[#FAFBFD] text-[#0F172A] font-medium text-xs flex items-center justify-center gap-1.5 transition-colors duration-150 disabled:opacity-50"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-[#52637A]" />
                        <span>Visa •••• 4242</span>
                      </button>

                      <button
                        type="button"
                        disabled={loadingAction !== null}
                        onClick={() => handleRemoteButtonAction("cancel")}
                        className="h-9 px-3 rounded-lg border border-[#DCE7F3] bg-white hover:bg-red-50 text-[#52637A] hover:text-red-700 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors duration-150 disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Pause rule</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2ECF6] flex items-center justify-between">
                    <span className="text-xs font-medium text-[#0F172A]">
                      Status: {demoAlert.status}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setDemoAlert((p) => ({ ...p, status: "PENDING" }))
                      }
                      className="text-xs text-[#2563EB] hover:underline font-medium"
                    >
                      Reset preview
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-[#DCE7F3] bg-white p-5 space-y-2 shadow-[0_1px_3px_rgba(15,23,42,0.03)] text-xs">
                <div className="font-semibold text-sm text-[#0F172A] capitalize">
                  {activeChannel} integration
                </div>
                <p className="text-[#52637A] leading-relaxed m-0">
                  {activeChannel === "whatsapp"
                    ? "Delivers interactive quick-reply buttons to WhatsApp Cloud so holds can be approved or paused from mobile."
                    : "Posts Block Kit approval cards directly to finance Slack channels when cloud or SaaS bills exceed rule caps."}
                </p>
              </div>
            )}
          </div>

          {/* Clean 4-Step Audit Pipeline */}
          <div className="lg:col-span-6 space-y-3">
            <span className="text-xs font-medium text-[#52637A] block">
              How background audits work
            </span>

            <div className="rounded-xl border border-[#DCE7F3] bg-white divide-y divide-[#EDF3FA] shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
              {[
                {
                  step: "01",
                  title: "Read-only price check",
                  body: "Audits inspect active spending rules without ever initiating a payment.",
                },
                {
                  step: "02",
                  title: "Headless DOM verification",
                  body: "Playwright reads current merchant pricing and compares against the last verified rate.",
                },
                {
                  step: "03",
                  title: "Automatic anomaly hold",
                  body: "Any spike or cap breach places the rule on hold before renewal day.",
                },
                {
                  step: "04",
                  title: "Guarded confirmation",
                  body: "Approvals route through signed confirmation tokens and atomic PayPal capture.",
                },
              ].map((s) => (
                <div key={s.step} className="p-4 flex items-start gap-3.5 text-xs">
                  <span className="font-mono text-[11px] text-[#7B8BA1] pt-0.5 tabular-nums">
                    {s.step}
                  </span>
                  <div>
                    <div className="font-medium text-[#0F172A]">{s.title}</div>
                    <p className="text-[#52637A] mt-0.5 leading-relaxed m-0">
                      {s.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
