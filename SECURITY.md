# Security Policy

## Reporting a Vulnerability

Because **Rico** enforces financial guardrails, payment reservations, and authenticated sessions, we take security issues seriously.

**Please DO NOT report security vulnerabilities through public GitHub Issues.**

Instead, please report vulnerabilities privately via **[GitHub Private Vulnerability Reporting](https://github.com/abrarnasirjaffari/Rico/security/advisories/new)**.

### Scope of High-Priority Security Reports
- Bypassing Two-Step `confirmToken` HMAC verification (`/api/payments/quote` & `/api/payments/execute`)
- Bypassing hard budget ceilings, price-spike holds, or billing-period idempotency (`src/lib/safety/`)
- Cross-tenant mandate or transaction isolation leaks (`owner_id` enforcement)
- Session cookie (`rico_auth_session`) or webhook signature verification bypasses
- Exposure of vaulted payment credentials, tokens, or secrets in logs or prompts

We will acknowledge private reports promptly and work with you on verification and remediation before public disclosure.
