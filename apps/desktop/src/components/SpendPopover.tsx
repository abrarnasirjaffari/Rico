import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  ShieldAlert,
  TrendingUp,
  XCircle,
} from "lucide-react";
import type {
  Mandate,
  PendingAlert,
  PopoverSnapshot,
  WatchdogAuditItem,
} from "../lib/ricoClient";
import { remediateTrialAlert, resolveHeldPayment } from "../lib/ricoClient";

interface SpendPopoverProps {
  serverUrl: string;
  snapshot: PopoverSnapshot | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
  onUnauthorized: () => void;
}

interface HeldPaymentItem {
  key: string;
  mandateId: string;
  alertId?: string;
  service: string;
  amount: number;
  budgetCeiling: number;
  currency: string;
  jumpPercent?: number;
  note: string;
}

interface TrialExpiryItem {
  key: string;
  mandateId?: string;
  service: string;
  amount: number;
  currency: string;
  daysLeft: number;
  renewalDate: string;
}

function formatMoney(amount: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

function isSameMonth(isoOrDate: string, now: Date): boolean {
  const parsed = new Date(isoOrDate);
  if (Number.isNaN(parsed.getTime())) return false;
  return (
    parsed.getUTCFullYear() === now.getUTCFullYear() &&
    parsed.getUTCMonth() === now.getUTCMonth()
  );
}

function buildHeldPayments(
  pendingAlerts: PendingAlert[],
  mandates: Mandate[]
): HeldPaymentItem[] {
  const byMandate = new Map<string, HeldPaymentItem>();

  for (const alert of pendingAlerts) {
    if (alert.status !== "PENDING") continue;
    byMandate.set(alert.mandateId, {
      key: `alert-${alert.id}`,
      mandateId: alert.mandateId,
      alertId: alert.id,
      service: alert.service,
      amount: alert.newPrice,
      budgetCeiling: alert.budgetCeiling,
      currency: alert.currency || "USD",
      jumpPercent: alert.jumpPercent,
      note:
        alert.jumpPercent > 0
          ? `+${alert.jumpPercent.toFixed(0)}% above baseline ($${alert.oldPrice.toFixed(2)})`
          : "Price Sentinel hold awaiting approval",
    });
  }

  for (const mandate of mandates) {
    if (mandate.status !== "ANOMALY_HOLD") continue;
    if (byMandate.has(mandate.id)) continue;
    const amount =
      mandate.lastScrapedPrice > 0
        ? mandate.lastScrapedPrice
        : mandate.budgetCeiling;
    byMandate.set(mandate.id, {
      key: `mandate-${mandate.id}`,
      mandateId: mandate.id,
      service: mandate.service,
      amount,
      budgetCeiling: mandate.budgetCeiling,
      currency: mandate.currency || "USD",
      note: "Mandate held for anomalous price spike",
    });
  }

  return Array.from(byMandate.values());
}

function buildTrialExpiries(
  audits: WatchdogAuditItem[],
  mandates: Mandate[]
): TrialExpiryItem[] {
  const items: TrialExpiryItem[] = [];
  const seenServices = new Set<string>();

  for (const audit of audits) {
    const isTrial =
      audit.contract.type === "FREE_TRIAL" ||
      audit.recommendedActions.some((a) => a.type === "CANCEL_TRIAL") ||
      audit.service.toLowerCase().includes("trial");
    const within24h = audit.contract.daysUntilRenewal <= 1;

    if ((isTrial && audit.contract.daysUntilRenewal <= 2) || within24h) {
      seenServices.add(audit.service.toLowerCase());
      items.push({
        key: `wd-${audit.id}`,
        mandateId: audit.matchedMandateId,
        service: audit.service,
        amount: audit.contract.currentPrice,
        currency: audit.contract.currency || "USD",
        daysLeft: Math.max(0, audit.contract.daysUntilRenewal),
        renewalDate: audit.contract.renewalDate,
      });
    }
  }

  // Fallback check on mandates whose category/nextRun signals a 24h trial renewal
  for (const m of mandates) {
    if (m.status === "PAUSED") continue;
    if (seenServices.has(m.service.toLowerCase())) continue;

    const lowerCat = m.category.toLowerCase();
    const lowerNext = m.nextRun.toLowerCase();
    const looksLikeTrial =
      lowerCat.includes("trial") || m.service.toLowerCase().includes("trial");

    const parsedNext = new Date(m.nextRun);
    const hoursUntil = Number.isNaN(parsedNext.getTime())
      ? null
      : (parsedNext.getTime() - Date.now()) / (1000 * 60 * 60);

    const isSoon =
      lowerNext.includes("today") ||
      lowerNext.includes("tomorrow") ||
      lowerNext.includes("24h") ||
      (hoursUntil !== null && hoursUntil >= -6 && hoursUntil <= 24);

    if (looksLikeTrial && isSoon) {
      items.push({
        key: `m-trial-${m.id}`,
        mandateId: m.id,
        service: m.service,
        amount: m.lastScrapedPrice > 0 ? m.lastScrapedPrice : m.budgetCeiling,
        currency: m.currency || "USD",
        daysLeft: hoursUntil !== null && hoursUntil <= 12 ? 0 : 1,
        renewalDate: m.nextRun,
      });
    }
  }

  return items;
}

export function SpendPopover({
  serverUrl,
  snapshot,
  loading,
  error,
  onRefresh,
  onUnauthorized,
}: SpendPopoverProps) {
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const summary = useMemo(() => {
    const mandates = snapshot?.mandates ?? [];
    const transactions = snapshot?.transactions ?? [];
    const now = new Date();

    const activeMandates = mandates.filter((m) => m.status !== "PAUSED");
    const totalMonthlyCap = activeMandates.reduce(
      (sum, m) => sum + (Number(m.budgetCeiling) || 0),
      0
    );
    const completedThisMonth = transactions
      .filter((t) => t.status === "COMPLETED" && isSameMonth(t.timestamp, now))
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const projectedBurn = activeMandates.reduce((sum, m) => {
      const price =
        m.lastScrapedPrice > 0 ? m.lastScrapedPrice : m.budgetCeiling;
      return sum + (Number(price) || 0);
    }, 0);

    const burnValue =
      completedThisMonth > 0 ? completedThisMonth : projectedBurn;
    const burnLabel =
      completedThisMonth > 0 ? "Paid this month" : "Projected monthly burn";
    const utilization =
      totalMonthlyCap > 0
        ? Math.min(100, Math.round((burnValue / totalMonthlyCap) * 100))
        : 0;

    return {
      activeCount: activeMandates.length,
      totalMonthlyCap,
      burnValue,
      burnLabel,
      projectedBurn,
      utilization,
    };
  }, [snapshot]);

  const heldPayments = useMemo(
    () =>
      buildHeldPayments(
        snapshot?.pendingAlerts ?? [],
        snapshot?.mandates ?? []
      ),
    [snapshot]
  );

  const trialExpiries = useMemo(
    () =>
      buildTrialExpiries(
        snapshot?.watchdogAudits ?? [],
        snapshot?.mandates ?? []
      ),
    [snapshot]
  );

  const handleHeldDecision = async (
    item: HeldPaymentItem,
    action: "approve" | "cancel"
  ) => {
    setBusyKey(`${item.key}:${action}`);
    setFeedback(null);
    try {
      const res = await resolveHeldPayment(serverUrl, {
        action,
        mandateId: item.mandateId,
        alertId: item.alertId,
      });
      setFeedback({ type: "success", text: res.message });
      await onRefresh();
    } catch (err) {
      if (err instanceof Error && err.name === "UnauthorizedError") {
        onUnauthorized();
        return;
      }
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to process action.",
      });
    } finally {
      setBusyKey(null);
    }
  };

  const handleCancelTrial = async (item: TrialExpiryItem) => {
    setBusyKey(`${item.key}:cancel-trial`);
    setFeedback(null);
    try {
      await remediateTrialAlert(serverUrl, {
        mandateId: item.mandateId,
        service: item.service,
        action: "CANCEL_TRIAL",
        reason: "Cancelled before 24h trial conversion via Rico Desktop",
      });
      setFeedback({
        type: "success",
        text: `Paused ${item.service} before trial renewal.`,
      });
      await onRefresh();
    } catch (err) {
      setFeedback({
        type: "error",
        text:
          err instanceof Error ? err.message : "Could not cancel trial alert.",
      });
    } finally {
      setBusyKey(null);
    }
  };

  if (loading && !snapshot) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-xs text-[#52637A]">
        <Loader2 className="h-5 w-5 animate-spin text-[#2563EB]" />
        <span>Loading live burn &amp; holds…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3.5">
      {error && (
        <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-[11px] text-[#B91C1C]">
          {error}
        </div>
      )}

      {feedback && (
        <div
          className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-[11px] leading-snug ${
            feedback.type === "success"
              ? "border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]"
              : "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          ) : (
            <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* 1. Live Monthly Burn Summary */}
      <section className="rounded-2xl border border-[#DCE7F3] bg-white p-3.5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#52637A]">
            <TrendingUp className="h-3.5 w-3.5 text-[#2563EB]" />
            {summary.burnLabel}
          </span>
          <span className="rounded-full bg-[#EFF6FF] px-2 py-0.5 text-[10px] font-semibold text-[#1D4ED8]">
            {summary.activeCount} active
          </span>
        </div>

        <div className="mt-1.5 flex items-baseline justify-between">
          <p className="font-mono text-2xl font-semibold tracking-tight tabular-nums text-[#0F172A]">
            {formatMoney(summary.burnValue)}
          </p>
          <p className="font-mono text-[11px] tabular-nums text-[#64748B]">
            / {formatMoney(summary.totalMonthlyCap)} cap
          </p>
        </div>

        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[#EDF3FA]">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              summary.utilization >= 90 ? "bg-[#DC2626]" : "bg-[#2563EB]"
            }`}
            style={{ width: `${summary.utilization}%` }}
          />
        </div>

        <div className="mt-1.5 flex items-center justify-between text-[10px] text-[#64748B]">
          <span>{summary.utilization}% of monthly mandate ceiling</span>
          <span className="font-mono tabular-nums">
            Est. {formatMoney(summary.projectedBurn)}/mo
          </span>
        </div>
      </section>

      {/* 2. Held Payments Needing Approval */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#52637A]">
            <ShieldAlert className="h-3.5 w-3.5 text-[#D97706]" />
            Held Payments
          </h2>
          <span className="text-[11px] font-medium text-[#64748B]">
            {heldPayments.length} pending
          </span>
        </div>

        {heldPayments.length === 0 ? (
          <div className="flex items-center gap-2 rounded-xl border border-[#E2ECF6] bg-white px-3 py-2.5 text-xs text-[#52637A]">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#16A34A]" />
            <span>No held payments — all guardrails clear.</span>
          </div>
        ) : (
          heldPayments.map((item) => {
            const approving = busyKey === `${item.key}:approve`;
            const cancelling = busyKey === `${item.key}:cancel`;
            const isBusy = approving || cancelling;

            return (
              <div
                key={item.key}
                className="rounded-2xl border border-[#FDE68A] bg-[#FFFBEB]/60 p-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-[#0F172A]">
                      {item.service}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#92400E]">
                      {item.note}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-semibold tabular-nums text-[#0F172A]">
                      {formatMoney(item.amount, item.currency)}
                    </p>
                    <p className="font-mono text-[10px] tabular-nums text-[#64748B]">
                      Cap {formatMoney(item.budgetCeiling, item.currency)}
                    </p>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleHeldDecision(item, "approve")}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#2563EB] px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-[#1D4ED8] disabled:opacity-60"
                  >
                    {approving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    Approve Once
                  </button>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleHeldDecision(item, "cancel")}
                    className="flex items-center justify-center rounded-lg border border-[#DCE7F3] bg-white px-3 py-1.5 text-xs font-medium text-[#52637A] transition hover:border-[#FCA5A5] hover:bg-[#FEF2F2] hover:text-[#B91C1C] disabled:opacity-60"
                  >
                    {cancelling ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      "Cancel"
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* 3. Upcoming 24-Hour Free-Trial Expiration Alerts */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#52637A]">
            <Clock className="h-3.5 w-3.5 text-[#2563EB]" />
            24h Trial Expirations
          </h2>
          <span className="text-[11px] font-medium text-[#64748B]">
            {trialExpiries.length} alert{trialExpiries.length === 1 ? "" : "s"}
          </span>
        </div>

        {trialExpiries.length === 0 ? (
          <div className="rounded-xl border border-[#E2ECF6] bg-white px-3 py-2.5 text-xs text-[#64748B]">
            No free trials expiring in the next 24 hours.
          </div>
        ) : (
          trialExpiries.map((trial) => {
            const cancelling = busyKey === `${trial.key}:cancel-trial`;
            return (
              <div
                key={trial.key}
                className="flex items-center justify-between gap-2 rounded-xl border border-[#FED7AA] bg-[#FFF7ED] px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-1 truncate text-xs font-semibold text-[#0F172A]">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-[#EA580C]" />
                    <span className="truncate">{trial.service}</span>
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#9A3412]">
                    {trial.daysLeft === 0
                      ? "Renews today"
                      : `Renews within 24h (${trial.renewalDate})`}{" "}
                    · {formatMoney(trial.amount, trial.currency)}
                  </p>
                </div>

                {trial.mandateId && (
                  <button
                    type="button"
                    disabled={cancelling}
                    onClick={() => handleCancelTrial(trial)}
                    className="shrink-0 rounded-lg border border-[#FDBA74] bg-white px-2.5 py-1 text-[11px] font-medium text-[#C2410C] transition hover:bg-[#FFEDD5] disabled:opacity-60"
                  >
                    {cancelling ? "…" : "Cancel Trial"}
                  </button>
                )}
              </div>
            );
          })
        )}
      </section>

      {/* 4. Compact Mandates List */}
      {(snapshot?.mandates?.length ?? 0) > 0 && (
        <section className="space-y-1.5">
          <h2 className="px-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#52637A]">
            Mandates ({snapshot?.mandates.length})
          </h2>
          <div className="divide-y divide-[#EDF3FA] overflow-hidden rounded-2xl border border-[#DCE7F3] bg-white">
            {snapshot?.mandates.slice(0, 5).map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between px-3 py-2 text-xs"
              >
                <div className="min-w-0 pr-2">
                  <p className="truncate font-medium text-[#0F172A]">
                    {m.service}
                  </p>
                  <p className="truncate text-[10px] text-[#64748B]">
                    {m.recurrence}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] tabular-nums text-[#0F172A]">
                    {formatMoney(
                      m.lastScrapedPrice > 0
                        ? m.lastScrapedPrice
                        : m.budgetCeiling,
                      m.currency
                    )}
                  </span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                      m.status === "ACTIVE"
                        ? "bg-[#DCFCE7] text-[#15803D]"
                        : m.status === "ANOMALY_HOLD"
                        ? "bg-[#FEF3C7] text-[#B45309]"
                        : "bg-[#F1F5F9] text-[#64748B]"
                    }`}
                  >
                    {m.status === "ANOMALY_HOLD" ? "HOLD" : m.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
