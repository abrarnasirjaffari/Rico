/** Base class for every error this SDK throws. */
export class RicoError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = new.target.name;
  }
}

/** The request never got an HTTP response (DNS, connection reset, timeout, abort). */
export class RicoNetworkError extends RicoError {}

/** Rico answered with a non-2xx status. */
export class RicoApiError extends RicoError {
  readonly status: number;
  readonly method: string;
  readonly path: string;
  /** Parsed JSON body, or the raw text when the body was not JSON. */
  readonly body: unknown;

  constructor(init: { message: string; status: number; method: string; path: string; body: unknown }) {
    super(init.message);
    this.status = init.status;
    this.method = init.method;
    this.path = init.path;
    this.body = init.body;
  }
}

/**
 * A guardrail stopped the action: a payment was rejected as a duplicate or over budget
 * (`status: "BLOCKED"`), or a mandate is held for review (`ANOMALY_HOLD`). Retrying the same
 * request will not succeed; a person needs to review it.
 */
export class RicoGuardrailHoldError extends RicoApiError {
  /** The guardrail status Rico reported, such as "BLOCKED" or "ANOMALY_HOLD". */
  readonly holdStatus: string;

  constructor(init: ConstructorParameters<typeof RicoApiError>[0] & { holdStatus: string }) {
    super(init);
    this.holdStatus = init.holdStatus;
  }
}
