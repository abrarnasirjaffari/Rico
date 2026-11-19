import {
  getSavedServerUrl,
  restoreSessionFromKeyring,
  ricoFetch,
  UnauthorizedError,
} from "../lib/ricoClient";

export interface LauncherQuote {
  mandateId: string;
  service: string;
  amount: number;
  currency: string;
  budgetCeiling: number;
  periodLabel: string;
  confirmToken: string;
  expiresAt: number;
}

export interface LauncherReply {
  text: string;
  quote?: LauncherQuote;
}

interface SseEvent {
  type?: string;
  text?: string;
  error?: string;
  quote?: Partial<LauncherQuote>;
}

export function parseChatSsePayload(rawBody: string): LauncherReply {
  let streamedTokens = "";
  let doneText = "";
  let quote: LauncherQuote | undefined;

  for (const block of rawBody.split("\n\n")) {
    for (const line of block.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const jsonText = trimmed.slice(5).trim();
      if (!jsonText) continue;

      try {
        const evt = JSON.parse(jsonText) as SseEvent;
        if (evt.type === "error" && evt.error) {
          throw new Error(evt.error);
        }
        if (evt.type === "token" && typeof evt.text === "string") {
          streamedTokens += evt.text;
        } else if (evt.type === "done" && typeof evt.text === "string") {
          doneText = evt.text;
        } else if (
          evt.type === "payment_confirmation" &&
          evt.quote &&
          typeof evt.quote.confirmToken === "string" &&
          typeof evt.quote.service === "string"
        ) {
          quote = {
            mandateId: String(evt.quote.mandateId ?? ""),
            service: evt.quote.service,
            amount: Number(evt.quote.amount ?? 0),
            currency: String(evt.quote.currency ?? "USD"),
            budgetCeiling: Number(evt.quote.budgetCeiling ?? 0),
            periodLabel: String(evt.quote.periodLabel ?? "Current period"),
            confirmToken: evt.quote.confirmToken,
            expiresAt: Number(evt.quote.expiresAt ?? Date.now() + 300_000),
          };
        }
      } catch (err) {
        if (err instanceof Error && !err.message.includes("JSON")) {
          throw err;
        }
      }
    }
  }

  return {
    text: (doneText || streamedTokens || "Done.").trim(),
    quote,
  };
}

export async function askRicoLauncher(
  prompt: string,
  serverUrlOverride?: string
): Promise<LauncherReply> {
  const initialUrl = serverUrlOverride || getSavedServerUrl();
  // Ensure keyring cookie is hydrated in this window context
  const session = await restoreSessionFromKeyring(initialUrl);
  if (!session.user) {
    throw new UnauthorizedError(
      "Sign in from the Rico tray popover first to run commands."
    );
  }

  const res = await ricoFetch(session.serverUrl, "/api/chat", {
    method: "POST",
    body: JSON.stringify({ message: prompt.trim() }),
  });

  if (res.status === 401) {
    throw new UnauthorizedError(
      "Session expired. Sign in again from the Rico tray popover."
    );
  }

  if (!res.ok) {
    const errJson = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(errJson.error || `Command failed (HTTP ${res.status})`);
  }

  const rawText = await res.text();
  return parseChatSsePayload(rawText);
}

export async function confirmLauncherQuote(
  confirmToken: string,
  serverUrlOverride?: string
): Promise<string> {
  const initialUrl = serverUrlOverride || getSavedServerUrl();
  const session = await restoreSessionFromKeyring(initialUrl);
  if (!session.user) {
    throw new UnauthorizedError("Please sign in from the Rico tray popover.");
  }

  const res = await ricoFetch(session.serverUrl, "/api/payments/execute", {
    method: "POST",
    body: JSON.stringify({ confirmToken, fundingRail: "PAYPAL" }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    message?: string;
    error?: string;
    orderId?: string;
  };

  if (!res.ok) {
    throw new Error(data.error || `Payment rejected (HTTP ${res.status})`);
  }

  return (
    data.message ||
    `Payment confirmed${data.orderId ? ` (Order ${data.orderId})` : ""}.`
  );
}
