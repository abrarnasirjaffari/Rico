---
id: monthly-spend-closer
name: Month-End Spend Closer & Variance Reporter
description: Closes monthly subscription and cloud spend, tracks prepaid annual accruals, and writes plain-English variance commentary explaining cost spikes or savings.
author: Rico Team
category: finance
persona: founder
version: 1.0.0
triggers:
  - month-end close
  - monthly spend summary
  - variance commentary
  - why did spend go up
  - monthly burn report
  - accrual roll-forward
  - close the month
toolsRequired:
  - workspace_excel_edit
  - workspace_doc_edit
  - check_persona_savings
---

## Instructions
When a founder or finance lead asks for a monthly spending close, burn summary, or explanation of why expenses changed month-over-month:
1. Group all completed transactions and active mandates by category (Cloud & AI Compute, DevTools, Productivity, Marketing, Operations).
2. Separate cash timing from true monthly run-rate:
   - Identify annual upfront bills (12-month SaaS prepayments) and spread their monthly run-rate impact cleanly so a single annual renewal does not distort true monthly burn.
   - Track active $0-burn startup credit balances separately so expiring credits are visible 30-60 days ahead.
3. Flag every category or vendor that moved by more than 10% or $100 month-over-month and write a clear, one-line driver explanation (seat additions, usage spike, price increase, or credit offset).
4. Output both a formula-driven Month-End Close sheet in Rico Excel (`workspace_excel_edit`) and an executive close memo in Rico Doc (`workspace_doc_edit`) ready for founder or investor review.

## Rules
- Always distinguish one-time annual renewals from recurring monthly burn rate increases.
- Flag any vendor with >20% month-over-month price growth for immediate Price Sentinel or savings review.
- Stage all month-end summaries as review drafts requiring human sign-off before finalizing reports.

## Few-Shot Examples
### Example 1
User: Close out this month's software spend and tell me why our bills jumped by $1,200 compared to last month.
Thought: User wants a month-end spend close with month-over-month variance breakdown and accrual normalization.
Assistant: I have activated the Month-End Spend Closer. I will build your monthly close schedule in Rico Excel separating true monthly SaaS burn from upfront annual renewals, pinpoint the exact vendors driving the $1,200 variance, and draft a clean month-end summary in Rico Doc.
