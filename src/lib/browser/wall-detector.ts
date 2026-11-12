import type { Page } from "playwright";
import type { HelpTheAgentWallState } from "./types";

export const DEFAULT_WALL_PAUSE_MS = 90_000;

/**
 * Zephium "Help-the-Agent" Login, 2FA & Bot-Challenge Wall Detector.
 * Inspects visible DOM controls, iframes, headings, and URL paths to detect when human assistance is helpful.
 */
export async function detectHelpWall(
  page: Page,
  tabId: string
): Promise<HelpTheAgentWallState | null> {
  const raw = await page
    .evaluate(() => {
      const title = (document.title || "").trim();
      const url = window.location.href || "";
      const bodySample = (document.body?.innerText || "").slice(0, 1800);

      const selectors = {
        turnstile:
          "iframe[src*='challenges.cloudflare.com'], #challenge-running, #cf-challenge-running",
        captcha:
          "iframe[src*='recaptcha'], iframe[src*='hcaptcha'], .g-recaptcha, .h-captcha",
        otp: "input[autocomplete='one-time-code'], input[name*='otp' i], input[name*='2fa' i], input[id*='otp' i], input[id*='two-factor' i], input[placeholder*='6-digit' i], input[placeholder*='verification code' i]",
        inputs: "input:not([type='hidden'])",
        passwords: "input[type='password']",
      };

      const counts: Record<keyof typeof selectors, number> = {
        turnstile: 0,
        captcha: 0,
        otp: 0,
        inputs: 0,
        passwords: 0,
      };

      for (const key of Object.keys(selectors) as Array<keyof typeof selectors>) {
        const list = Array.from(document.querySelectorAll(selectors[key]));
        for (const el of list) {
          const htmlEl = el as HTMLElement;
          const style = window.getComputedStyle(htmlEl);
          const rect = htmlEl.getBoundingClientRect();
          if (
            style.display !== "none" &&
            style.visibility !== "hidden" &&
            parseFloat(style.opacity || "1") > 0 &&
            rect.width > 0 &&
            rect.height > 0
          ) {
            counts[key]++;
          }
        }
      }

      return {
        title,
        url,
        bodySample,
        hasTurnstile: counts.turnstile > 0,
        hasCaptcha: counts.captcha > 0,
        hasOtpInput: counts.otp > 0,
        visibleInputCount: counts.inputs,
        hasPasswordInput: counts.passwords > 0,
      };
    })
    .catch(() => null);

  if (!raw) return null;

  const combinedTop = `${raw.title} ${raw.bodySample.slice(0, 600)}`;
  const now = Date.now();

  if (
    raw.hasTurnstile ||
    /just a moment|verify you are human|performing security verification|attention required/i.test(
      combinedTop
    )
  ) {
    return {
      detected: true,
      kind: "BOT_VERIFICATION",
      title: "Security verification wall",
      message:
        "This page asked to verify a human browser session. Complete the check in Pair mode, add +90s, or skip this page.",
      tabId,
      url: raw.url || page.url(),
      detectedAt: now,
      expiresAt: now + DEFAULT_WALL_PAUSE_MS,
      resolution: "pending",
    };
  }

  if (raw.hasCaptcha) {
    return {
      detected: true,
      kind: "CAPTCHA_CHALLENGE",
      title: "CAPTCHA challenge detected",
      message:
        "Solve the CAPTCHA directly on the canvas, then click Continue so Rico can resume.",
      tabId,
      url: raw.url || page.url(),
      detectedAt: now,
      expiresAt: now + DEFAULT_WALL_PAUSE_MS,
      resolution: "pending",
    };
  }

  const hasTwoFactorHeading =
    /\b(two[- ]factor|2-step verification|2fa|enter (the |your )?(6-digit |security |verification |authenticator )?code|verify your identity)\b/i.test(
      `${raw.title} ${raw.bodySample.slice(0, 900)}`
    );

  if (
    raw.hasOtpInput ||
    (hasTwoFactorHeading && raw.visibleInputCount > 0 && raw.visibleInputCount <= 8)
  ) {
    return {
      detected: true,
      kind: "TWO_FACTOR_AUTH",
      title: "2FA verification code required",
      message:
        "Enter your verification code directly in the live browser (all keystrokes stay redacted), then click Continue.",
      tabId,
      url: raw.url || page.url(),
      detectedAt: now,
      expiresAt: now + DEFAULT_WALL_PAUSE_MS,
      resolution: "pending",
    };
  }

  const isAuthPath = /\/(login|signin|sign-in|auth|session|sso)\b/i.test(raw.url);
  const hasLoginHeading =
    /\b(sign in|log in|welcome back|continue to your account)\b/i.test(
      `${raw.title} ${raw.bodySample.slice(0, 700)}`
    );

  if (
    raw.hasPasswordInput &&
    (isAuthPath || hasLoginHeading || raw.bodySample.length < 1400)
  ) {
    return {
      detected: true,
      kind: "LOGIN_WALL",
      title: "Sign-in wall detected",
      message:
        "Sign in using Pair browsing (passwords are redacted from snapshots and logs), then click Continue.",
      tabId,
      url: raw.url || page.url(),
      detectedAt: now,
      expiresAt: now + DEFAULT_WALL_PAUSE_MS,
      resolution: "pending",
    };
  }

  return null;
}
