> **🎃💳 Hackathon Contributors Note (Kiroween 2026 & PayPal AI Hackathon):** Rico is actively competing in **Kiroween 2026** and the **PayPal AI Hackathon** (`main` is frozen for judging until both hackathons conclude). **Bug reports, stars, UI/mobile/desktop designs, and feature ideas in Issues are 100% welcome right now!** Please open external PRs against your issue's target branch (`dev`, `track/ui-design`, `track/sdk`, `track/desktop`, `track/android`, or `track/ios` — **not `main`**); all tracks will be merged into `main` right after judging finishes.

## 📋 Summary of Changes

<!-- Describe what this PR changes and why -->

## 🛡️ Pre-Review Verification Checklist (Required for AI / Vibe-Coded PRs)

Before a maintainer reviews this PR, our automated **6-Gate CI/CD Pipeline** will run and post a diagnostic comment on this PR. You can verify everything locally first:

- [ ] `npm run check:guardrails` passes (zero SQLite-only `.run()/.get()/.all()` in prod code, zero `@ts-ignore` in payment/safety/auth paths, zero leaked secrets)
- [ ] `npm run typecheck` passes across both root `Rico` and `website/`
- [ ] `npm run lint:all` passes with zero ESLint errors across both apps
- [ ] `npm run test:ci:sqlite` passes all 23 unit, guardrail, PayPal stub, and ownership isolation suites
- [ ] `npm run build` and `npm run build:website` succeed cleanly

## 🔒 Financial Safety & Database Impact

- [ ] Does this PR touch `src/lib/safety/`, `src/lib/payments/`, `src/lib/paypal/`, `src/db/`, or `drizzle/`?
  - If **yes**, confirm that PostgreSQL concurrency & fault-injection suites (`npm run test:ci:postgres`) and E2E auth (`npm run test:supabase-auth`) pass.
