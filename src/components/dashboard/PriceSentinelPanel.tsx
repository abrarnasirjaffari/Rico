"use client";

import React, { useState, useEffect } from "react";
import {
  Bot,
  CheckCircle2,
  CreditCard,
  XCircle,
  RefreshCw,
  Smartphone,
  MessageSquare,
  ShieldAlert,
  Zap,
  Sparkles,
  Activity,
  History,
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

  const monitoringLabel = {
    scheduled: { badge: "SCHEDULED", status: "Scheduled (daily)" },
    awaiting_run: { badge: "CONFIGURED", status: "Configured, awaiting run" },
    manual_only: { badge: "MANUAL ONLY", status: "Manual audit ready" },
  }[stats.monitoringMode];

  const [activeChannel, setActiveChannel] = useState<"telegram" | "whatsapp" | "slack">("telegram");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [runningAudit, setRunningAudit] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Default demo spike values
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
        oldPrice: first.lastScrapedPrice > 0 ? first.lastScrapedPrice : first.budgetCeiling * 0.8,
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
            lastScheduledRunAt: data.sentinel.monitoring?.lastScheduledRunAt ?? null,
            telegramMode: data.sentinel.channels?.telegram?.mode ?? "SIMULATED_MOCK",
            totalAuditsRun: data.sentinel.totalAuditsRun || prev.totalAuditsRun,
            anomaliesDetected: data.sentinel.anomaliesDetected || prev.anomaliesDetected,
            savingsIdentified: data.sentinel.savingsIdentified || prev.savingsIdentified,
            lastRunAt: data.sentinel.lastRunAt || prev.lastRunAt,
            pendingAlertsCount: data.sentinel.pendingAlertsCount ?? prev.pendingAlertsCount,
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

  const handleRemoteButtonAction = async (action: "approve" | "backup_card" | "cancel") => {
    setLoadingAction(action);
    setActionSuccessMsg(null);

    try {
      let targetMandateId = demoAlert.mandateId;
      const matched = mandates.find(
        (m) =>
          m.id === targetMandateId ||
          m.service.toLowerCase().includes(demoAlert.service.toLowerCase().slice(0, 5))
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
        setActionSuccessMsg(`Error: ${data.error || "Action execution failed"}`);
      }
    } catch (err) {
      setActionSuccessMsg(`Network error: ${err instanceof Error ? err.message : String(err)}`);
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
          anomaliesDetected: prev.anomaliesDetected + data.summary.anomaliesDetected,
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
        setActionSuccessMsg(`Audit failed: ${data.error || "Please try again."}`);
      }
    } catch (err) {
      setActionSuccessMsg(`Audit failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setRunningAudit(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#F6FAFF] text-[#0F172A] overflow-y-auto p-4 space-y-4 font-[Inter,system-ui,sans-serif]">
      {/* Header Banner */}
      <div className="p-4 rounded-xl border border-[#C8DDF8] bg-white flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E2EEFD] border border-[#BFD7F7] flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
            <Bot className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#0F172A]">
                Price Sentinel &amp; Omnichannel Monitoring
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 text-[10px] font-semibold font-mono">
                {monitoringLabel.badge}
              </span>
            </div>
            <p className="text-xs text-[#52637A] mt-0.5">
              Autonomous 24/7 background audits detect price spikes, auto-pause unauthorized increases, and route 1-click approvals via Telegram, WhatsApp, and Slack.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={runningAudit}
            onClick={() => handleTriggerAudit(false)}
            className="h-8 px-3 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${runningAudit ? "animate-spin" : ""}`} />
            <span>Run Audit Now</span>
          </button>

          <button
            type="button"
            disabled={runningAudit}
            onClick={() => handleTriggerAudit(true)}
            className="h-8 px-3 text-xs font-semibold rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white transition-all flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
            title="Simulate +57% Adobe Creative Cloud price spike anomaly"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulate Spike (+57%)</span>
          </button>
        </div>
      </div>

      {/* Sentinel Live Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-xl border border-[#C8DDF8] bg-white shadow-2xs">
          <div className="flex items-center justify-between text-[#52637A] text-[11px] mb-1">
            <span>Daemon Status</span>
            <Activity className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-sm font-bold text-blue-700 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span>{monitoringLabel.status}</span>
          </div>
          <span className="text-[10px] text-[#52637A] mt-1 block font-mono">
            {stats.lastScheduledRunAt
              ? `Last: ${new Date(stats.lastScheduledRunAt).toLocaleTimeString()}`
              : "On-demand execution ready"}
          </span>
        </div>

        <div className="p-3 rounded-xl border border-[#C8DDF8] bg-white shadow-2xs">
          <div className="flex items-center justify-between text-[#52637A] text-[11px] mb-1">
            <span>Total Audits</span>
            <History className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="text-sm font-bold text-[#0F172A]">
            {stats.totalAuditsRun} checks completed
          </div>
          <span className="text-[10px] text-[#52637A] mt-1 block">
            {stats.lastRunAt || "Recently active"}
          </span>
        </div>

        <div className="p-3 rounded-xl border border-[#C8DDF8] bg-white shadow-2xs">
          <div className="flex items-center justify-between text-[#52637A] text-[11px] mb-1">
            <span>Anomalies Flagged</span>
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-sm font-bold text-amber-700">
            {stats.anomaliesDetected} on hold
          </div>
          <span className="text-[10px] text-[#52637A] mt-1 block">
            {stats.pendingAlertsCount} pending user review
          </span>
        </div>

        <div className="p-3 rounded-xl border border-[#C8DDF8] bg-white shadow-2xs">
          <div className="flex items-center justify-between text-[#52637A] text-[11px] mb-1">
            <span>Reclaimed Savings</span>
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-sm font-bold text-emerald-700">
            ${stats.savingsIdentified.toFixed(2)} USD
          </div>
          <span className="text-[10px] text-[#52637A] mt-1 block font-mono">
            Autonomous price drops
          </span>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Main 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        {/* Left Column: Omnichannel Mobile Interactive Alert */}
        <div className="lg:col-span-6 flex flex-col space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-blue-600" />
              <span>Omnichannel Interactive Notification</span>
            </span>

            {/* Channel Tabs */}
            <div className="flex items-center gap-1 bg-[#E2EEFD] border border-[#C8DDF8] rounded-lg p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setActiveChannel("telegram")}
                className={`px-2.5 py-0.5 rounded font-semibold transition-all ${
                  activeChannel === "telegram"
                    ? "bg-[#2563EB] text-white shadow-2xs"
                    : "text-[#334155] hover:text-[#0F172A]"
                }`}
              >
                Telegram
              </button>
              <button
                type="button"
                onClick={() => setActiveChannel("whatsapp")}
                className={`px-2.5 py-0.5 rounded font-semibold transition-all ${
                  activeChannel === "whatsapp"
                    ? "bg-[#2563EB] text-white shadow-2xs"
                    : "text-[#334155] hover:text-[#0F172A]"
                }`}
              >
                WhatsApp
              </button>
              <button
                type="button"
                onClick={() => setActiveChannel("slack")}
                className={`px-2.5 py-0.5 rounded font-semibold transition-all ${
                  activeChannel === "slack"
                    ? "bg-[#2563EB] text-white shadow-2xs"
                    : "text-[#334155] hover:text-[#0F172A]"
                }`}
              >
                Slack
              </button>
            </div>
          </div>

          {/* Telegram Phone Mockup */}
          {activeChannel === "telegram" && (
            <div className="rounded-2xl border border-[#C8DDF8] bg-white p-3.5 shadow-2xs flex flex-col max-w-[400px] mx-auto w-full space-y-3">
              {/* Telegram Header */}
              <div className="rounded-xl bg-[#F6FAFF] px-3 py-2 flex items-center justify-between border border-[#DCE9FA]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#0088cc] flex items-center justify-center text-white text-sm font-bold shadow-2xs">
                    R
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                      <span>Rico Sentinel Bot</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    </div>
                    <div className="text-[10px] text-[#0088cc] font-medium">
                      Live Notification Preview
                    </div>
                  </div>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono font-bold">
                  Verified
                </span>
              </div>

              {/* Message Bubble */}
              <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                  <span className="font-bold text-red-600 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                    <span>Price Spike Detected</span>
                  </span>
                  <span className="text-[10px] text-[#64748B] font-mono">Today, 03:00 AM</span>
                </div>

                <div className="space-y-1 leading-relaxed">
                  <div>
                    <span className="text-[#64748B]">Service:</span>{" "}
                    <strong className="text-[#0F172A]">{demoAlert.service}</strong>
                  </div>
                  <div className="text-[11px] text-[#334155] space-y-0.5 pl-2 border-l-2 border-blue-400">
                    <div>
                      • Previous Scraped Price:{" "}
                      <span className="font-mono text-[#64748B]">${demoAlert.oldPrice.toFixed(2)}/mo</span>
                    </div>
                    <div>
                      • New Detected Price:{" "}
                      <strong className="text-red-600 font-mono">${demoAlert.newPrice.toFixed(2)}/mo (+{demoAlert.jumpPercent}%)</strong>
                    </div>
                    <div>
                      • Authorized Ceiling:{" "}
                      <span className="text-emerald-700 font-mono font-bold">${demoAlert.budgetCeiling.toFixed(2)}/mo</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200 mt-2 font-medium">
                    Payment is currently on hold. Choose an autonomous action below:
                  </p>
                </div>

                {/* Action Buttons */}
                {demoAlert.status === "PENDING" ? (
                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      disabled={loadingAction !== null}
                      onClick={() => handleRemoteButtonAction("approve")}
                      className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all disabled:opacity-50"
                    >
                      {loadingAction === "approve" ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Approve One-Time (${demoAlert.newPrice.toFixed(2)})</span>
                    </button>

                    <button
                      type="button"
                      disabled={loadingAction !== null}
                      onClick={() => handleRemoteButtonAction("backup_card")}
                      className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all disabled:opacity-50"
                    >
                      {loadingAction === "backup_card" ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CreditCard className="w-3.5 h-3.5" />
                      )}
                      <span>Pay via Backup Card (Visa •••• 4242)</span>
                    </button>

                    <button
                      type="button"
                      disabled={loadingAction !== null}
                      onClick={() => handleRemoteButtonAction("cancel")}
                      className="w-full py-2 px-3 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all disabled:opacity-50"
                    >
                      {loadingAction === "cancel" ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                      <span>Pause &amp; Refuse Charge</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-center space-y-1">
                    <div className="text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Action Executed: {demoAlert.status}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDemoAlert((p) => ({ ...p, status: "PENDING" }))}
                      className="text-[11px] text-blue-600 hover:underline pt-1 inline-block font-semibold"
                    >
                      Reset Demo Alert
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeChannel === "whatsapp" && (
            <div className="rounded-xl border border-[#C8DDF8] bg-white p-4 space-y-2.5 shadow-2xs text-xs">
              <div className="flex items-center gap-2 text-emerald-700 font-bold">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>WhatsApp Cloud Interactive Quick-Replies</span>
              </div>
              <p className="text-[11px] text-[#52637A] leading-relaxed">
                Connect your business WhatsApp number via Cloud API to allow founders to approve anomalies by texting &ldquo;Yes&rdquo;, &ldquo;Freeze&rdquo;, or &ldquo;Status&rdquo;.
              </p>
            </div>
          )}

          {activeChannel === "slack" && (
            <div className="rounded-xl border border-[#C8DDF8] bg-white p-4 space-y-2.5 shadow-2xs text-xs">
              <div className="flex items-center gap-2 text-indigo-700 font-bold">
                <Bot className="w-4 h-4 text-indigo-600" />
                <span>Slack Enterprise Block Kit Integration</span>
              </div>
              <p className="text-[11px] text-[#52637A] leading-relaxed">
                Dispatches interactive approval blocks directly to <code>#finance-alerts</code> with role-gated manager approvals.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Sentinel Architecture */}
        <div className="lg:col-span-6 flex flex-col space-y-3">
          <span className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5 px-1">
            <Zap className="w-3.5 h-3.5 text-blue-600" />
            <span>Sentinel Execution Flow</span>
          </span>

          <div className="space-y-2.5">
            <div className="p-3 rounded-xl border border-[#C8DDF8] bg-white shadow-2xs flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-[#E2EEFD] border border-[#BFD7F7] flex items-center justify-center text-blue-700 font-mono text-xs font-bold shrink-0">
                1
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#0F172A]">
                  Scheduled Audit Trigger
                </h4>
                <p className="text-[11px] text-[#52637A] mt-0.5 leading-relaxed">
                  Triggers daily audits across all active spending rules. Paused rules are skipped, and an audit never executes unconfirmed payments.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-[#C8DDF8] bg-white shadow-2xs flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-[#E2EEFD] border border-[#BFD7F7] flex items-center justify-center text-purple-700 font-mono text-xs font-bold shrink-0">
                2
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#0F172A]">
                  Playwright Headless Price Verification
                </h4>
                <p className="text-[11px] text-[#52637A] mt-0.5 leading-relaxed">
                  Headless browser helper visits merchant pricing DOM, reads live checkout amounts, and compares against historical baselines.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-[#C8DDF8] bg-white shadow-2xs flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-[#E2EEFD] border border-[#BFD7F7] flex items-center justify-center text-amber-700 font-mono text-xs font-bold shrink-0">
                3
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#0F172A]">
                  Anomaly Engine &amp; Safeguard Hold
                </h4>
                <p className="text-[11px] text-[#52637A] mt-0.5 leading-relaxed">
                  Any price increase exceeding thresholds automatically transitions the mandate to <code>ANOMALY_HOLD</code> and halts checkout.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-[#C8DDF8] bg-white shadow-2xs flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-[#E2EEFD] border border-[#BFD7F7] flex items-center justify-center text-emerald-700 font-mono text-xs font-bold shrink-0">
                4
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#0F172A]">
                  Cryptographic Approval &amp; Payment Execution
                </h4>
                <p className="text-[11px] text-[#52637A] mt-0.5 leading-relaxed">
                  Approving dispatches a signed confirmation token to <code>/api/payments/execute</code>, ensuring atomic PayPal capture.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
