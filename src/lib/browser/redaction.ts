/**
 * Zephium Password, Token & Secret Redaction Guards
 * Ensures sensitive values never leak into AXTree snapshots, SSE streams, or ring buffers.
 */

export interface SensitiveFieldHint {
  type?: string;
  name?: string;
  id?: string;
  autocomplete?: string;
  label?: string;
  placeholder?: string;
}

const SENSITIVE_AUTOCOMPLETE = new Set([
  "current-password",
  "new-password",
  "one-time-code",
  "cc-number",
  "cc-csc",
  "cc-exp",
]);

const SENSITIVE_FIELD_RE =
  /\b(pass(word|wd|code|phrase)?|secret|api[-_]?key|access[-_]?token|auth[-_]?token|refresh[-_]?token|client[-_]?secret|bearer|cvv|cvc|card[-_]?number|ssn|otp|2fa[-_]?code|pin)\b/i;

const TOKEN_VALUE_RE =
  /^(Bearer\s+[A-Za-z0-9._~+/-]+=*|eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}|(?:sk|pk|rk)_(?:live|test)_[A-Za-z0-9]{12,}|gh[pousr]_[A-Za-z0-9]{20,}|xox[baprs]-[A-Za-z0-9-]{16,})$/i;

export function isSensitiveField(hint?: SensitiveFieldHint): boolean {
  if (!hint) return false;
  const inputType = (hint.type || "").toLowerCase().trim();
  if (inputType === "password") return true;

  const ac = (hint.autocomplete || "").toLowerCase().trim();
  if (ac && SENSITIVE_AUTOCOMPLETE.has(ac)) return true;

  const combined = [
    hint.name || "",
    hint.id || "",
    hint.label || "",
    hint.placeholder || "",
  ].join(" ");

  return SENSITIVE_FIELD_RE.test(combined);
}

export function redactSensitiveValue(
  rawValue: string | undefined | null,
  hint?: SensitiveFieldHint
): { value: string; redacted: boolean } {
  const val = rawValue ?? "";
  if (!val) {
    return { value: "", redacted: isSensitiveField(hint) };
  }

  if (isSensitiveField(hint) || TOKEN_VALUE_RE.test(val.trim())) {
    return { value: "[REDACTED]", redacted: true };
  }

  const scrubbed = redactSecretsInText(val);
  return {
    value: scrubbed,
    redacted: scrubbed !== val,
  };
}

/**
 * Redacts inline tokens, Bearer headers, JWTs, and sensitive URL query params from logs/console/network URLs.
 */
export function redactSecretsInText(input: string): string {
  if (!input) return "";
  return input
    // Authorization headers / Bearer tokens
    .replace(/\b(Bearer|Basic)\s+[A-Za-z0-9._~+/-]{8,}=*/gi, "$1 [REDACTED]")
    // JWTs (header.payload.sig)
    .replace(
      /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g,
      "[REDACTED_JWT]"
    )
    // Provider secret tokens
    .replace(/\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{12,}\b/g, "[REDACTED_KEY]")
    .replace(/\bgh[pousr]_[A-Za-z0-9]{20,}\b/g, "[REDACTED_TOKEN]")
    .replace(/\bxox[baprs]-[A-Za-z0-9-]{16,}\b/g, "[REDACTED_TOKEN]")
    // Sensitive URL query params or key=value pairs
    .replace(
      /([?&]|^|\s)(password|passwd|secret|api_key|apikey|access_token|auth_token|refresh_token|client_secret|token)=([^&\s#"']+)/gi,
      "$1$2=[REDACTED]"
    );
}
