import { invoke } from "@tauri-apps/api/core";

export interface KeyringSession {
  serverUrl: string;
  email: string;
  cookieHeader: string;
}

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/**
 * Extracts `name=value` cookie pairs from Fetch `Headers`, handling multiple
 * Set-Cookie headers without splitting on `Expires=Sat, ...` date commas.
 */
export function extractCookieHeaderFromResponse(headers: Headers): string | null {
  const rawList: string[] = [];

  const maybeGetSetCookie = (
    headers as Headers & { getSetCookie?: () => string[] }
  ).getSetCookie;
  if (typeof maybeGetSetCookie === "function") {
    rawList.push(...maybeGetSetCookie.call(headers));
  } else {
    const single = headers.get("set-cookie");
    if (single) {
      // Split only when a comma is followed by a cookie `name=value` token
      rawList.push(...single.split(/,\s*(?=[^;,\s]+=)/));
    }
  }

  const pairs: string[] = [];
  for (const entry of rawList) {
    const firstPart = entry.split(";")[0]?.trim();
    if (!firstPart || !firstPart.includes("=")) continue;
    const eqIdx = firstPart.indexOf("=");
    const value = firstPart.slice(eqIdx + 1).trim();
    // Skip cleared cookies (e.g. Max-Age=0 logout headers with empty value)
    if (!value) continue;
    pairs.push(firstPart);
  }

  return pairs.length > 0 ? pairs.join("; ") : null;
}

/**
 * Saves session credentials in the native OS keyring:
 * - Windows: Credential Manager
 * - macOS: Keychain
 * - Linux: Secret Service (libsecret / GNOME Keyring / KDE Wallet)
 */
export async function saveSessionToKeyring(
  session: KeyringSession
): Promise<boolean> {
  if (!isTauriRuntime()) return false;
  await invoke("keyring_save_session", { session });
  return true;
}

export async function loadSessionFromKeyring(): Promise<KeyringSession | null> {
  if (!isTauriRuntime()) return null;
  return await invoke<KeyringSession | null>("keyring_load_session");
}

export async function clearSessionFromKeyring(): Promise<void> {
  if (!isTauriRuntime()) return;
  await invoke("keyring_clear_session");
}
