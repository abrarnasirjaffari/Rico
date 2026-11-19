import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import type { PopoverSnapshot } from "../lib/ricoClient";

export interface DesktopAlertPayload {
  key: string;
  title: string;
  body: string;
}

const seenAlertKeys = new Set<string>();

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!isTauriRuntime()) {
    if (typeof Notification === "undefined") return false;
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;
    const perm = await Notification.requestPermission();
    return perm === "granted";
  }

  let granted = await isPermissionGranted();
  if (!granted) {
    const permission = await requestPermission();
    granted = permission === "granted";
  }
  return granted;
}

export async function sendDesktopNotification(
  title: string,
  body: string
): Promise<boolean> {
  const allowed = await ensureNotificationPermission();
  if (!allowed) return false;

  if (isTauriRuntime()) {
    sendNotification({ title, body });
    return true;
  }

  new Notification(title, { body });
  return true;
}

/**
 * Computes notification payloads for newly detected Price Sentinel holds
 * and 24-hour free-trial expiration alerts without re-alerting on repeat polls.
 */
export function collectNewAlertNotifications(
  snapshot: PopoverSnapshot,
  seen: Set<string> = seenAlertKeys
): DesktopAlertPayload[] {
  const currentKeys = new Set<string>();
  const notifications: DesktopAlertPayload[] = [];
  const heldMandateIds = new Set<string>();

  for (const alert of snapshot.pendingAlerts) {
    if (alert.status !== "PENDING") continue;
    heldMandateIds.add(alert.mandateId);
    const key = `hold-alert:${alert.id}`;
    currentKeys.add(key);

    if (!seen.has(key)) {
      const jump =
        alert.jumpPercent > 0 ? ` (+${alert.jumpPercent.toFixed(0)}%)` : "";
      notifications.push({
        key,
        title: `Rico Price Hold: ${alert.service}`,
        body: `Detected $${alert.newPrice.toFixed(2)}${jump} vs $${alert.budgetCeiling.toFixed(2)} cap. Open Rico to Approve Once or Cancel.`,
      });
    }
  }

  for (const mandate of snapshot.mandates) {
    if (mandate.status !== "ANOMALY_HOLD") continue;
    if (heldMandateIds.has(mandate.id)) continue;
    const key = `hold-mandate:${mandate.id}`;
    currentKeys.add(key);

    if (!seen.has(key)) {
      const price =
        mandate.lastScrapedPrice > 0
          ? mandate.lastScrapedPrice
          : mandate.budgetCeiling;
      notifications.push({
        key,
        title: `Rico Payment Held: ${mandate.service}`,
        body: `Charge of $${price.toFixed(2)} is awaiting approval (cap $${mandate.budgetCeiling.toFixed(2)}).`,
      });
    }
  }

  for (const audit of snapshot.watchdogAudits) {
    const isTrial =
      audit.contract.type === "FREE_TRIAL" ||
      audit.recommendedActions.some((a) => a.type === "CANCEL_TRIAL") ||
      audit.service.toLowerCase().includes("trial");
    if (!isTrial || audit.contract.daysUntilRenewal > 1) continue;

    const key = `trial-24h:${audit.id}`;
    currentKeys.add(key);
    if (!seen.has(key)) {
      notifications.push({
        key,
        title: `Trial Expiring Soon: ${audit.service}`,
        body: `Renews within 24h at $${audit.contract.currentPrice.toFixed(2)}. Open Rico to cancel before billing.`,
      });
    }
  }

  // Prune resolved keys so future holds on the same mandate re-notify
  for (const existing of Array.from(seen)) {
    if (!currentKeys.has(existing)) {
      seen.delete(existing);
    }
  }
  for (const key of currentKeys) {
    seen.add(key);
  }

  return notifications;
}

export async function notifySnapshotChanges(
  snapshot: PopoverSnapshot
): Promise<number> {
  const alerts = collectNewAlertNotifications(snapshot);
  let sent = 0;
  for (const item of alerts) {
    if (await sendDesktopNotification(item.title, item.body)) {
      sent += 1;
    }
  }
  return sent;
}

export async function sendTestSentinelNotification(): Promise<boolean> {
  return sendDesktopNotification(
    "Rico Price Sentinel Active",
    "Desktop alerts enabled: you will be notified here when a payment spike is held."
  );
}
