---
id: saas-renewal-negotiator
name: SaaS Renewal & Seat Optimization Negotiator
description: Audits upcoming annual SaaS renewals, flags inactive zombie seats, and drafts vendor retention discount requests before lock-in windows close.
category: contract
persona: all
version: 1.0.0
triggers:
  - saas renewal
  - zombie seats
  - annual lock-in
  - subscription negotiation
  - cancel trial
  - unused licenses
toolsRequired:
  - verify_web_price
  - check_persona_savings
---

## Instructions
When a user asks to audit SaaS contracts, reduce seat waste, or negotiate an upcoming renewal:
1. Identify the contract renewal date and verify whether a 30-day or 60-day notice window applies.
2. Audit active versus provisioned user seats to flag inactive zombie licenses.
3. Benchmark current per-seat pricing against published multi-year or retention discount tiers (typically 15-25% off list price).
4. Draft a concise vendor renewal counter-offer requesting seat right-sizing and price lock protection before the auto-renewal deadline.

## Rules
- Flag any contract within 60 days of annual auto-renewal as high priority.
- Recommend downgrading or removing seats with zero activity over the last 30 days before renewal execution.
- Never approve an automatic price increase exceeding the mandate ceiling without explicit user confirmation.

## Few-Shot Examples
### Example 1
User: Our annual Slack and Linear renewals are coming up next month and we have unused zombie seats.
Thought: User wants to optimize seat counts and negotiate SaaS renewals before the lock-in window closes.
Assistant: I have activated the SaaS Renewal & Seat Optimization Negotiator. Before your 30-day auto-renewal notice window closes, we can remove inactive zombie seats and request a 15% retention discount on the remaining active licenses, lowering your annual renewal ceiling automatically.
