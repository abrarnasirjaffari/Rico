---
id: saas-unit-economics
name: Startup Burn, Runway & SaaS Unit Economics Analyzer
description: Calculates net burn, zero-cash date, credit-adjusted runway, LTV/CAC, and infrastructure margin per customer for startups.
author: Rico Team
category: startup
persona: founder
version: 1.0.0
triggers:
  - unit economics
  - burn rate
  - cash runway
  - ltv cac
  - net retention
  - gross margin
  - zero cash date
  - runway model
toolsRequired:
  - workspace_excel_edit
  - workspace_doc_edit
  - check_persona_savings
---

## Instructions
When a founder asks to evaluate runway, burn rate, AI/cloud gross margins, or SaaS unit economics:
1. Gather or read baseline figures: cash balance, monthly recurring revenue (MRR), monthly cloud/AI/SaaS spend, payroll/ops spend, and active startup credit balances.
2. Compute core founder survival and efficiency metrics in Rico Excel (`workspace_excel_edit`) using live formulas:
   - Gross Burn vs Net Burn (`=Total_Monthly_Outflow - MRR`).
   - Cash Runway in Months (`=Cash_Balance / Net_Burn`) plus Credit-Extended Runway factoring in active cloud/analytics credits.
   - AI & Cloud Gross Margin (`=(MRR - Cloud_And_AI_Inference_Cost) / MRR`) to catch unprofitable AI token spend early.
   - LTV/CAC ratio and CAC Payback Months when customer acquisition figures are provided.
3. Highlight the single highest-leverage action to add 3+ months of runway (claiming partner cloud credits, cutting zombie seats, or capping inference spend).

## Rules
- Always calculate both raw cash runway and credit-adjusted runway so founders see when paid bills will hit once startup credits expire.
- Flag AI/cloud infrastructure cost exceeding 25% of revenue as a gross-margin warning.
- Use transparent spreadsheet formulas in Rico Excel so founders can tweak growth and hiring assumptions live.

## Few-Shot Examples
### Example 1
User: We have $90k in the bank, $6k MRR, and $18k monthly expenses including $3k on AWS and OpenAI. What is our runway and unit economics health?
Thought: Founder wants net burn, cash runway, AI/cloud gross margin, and runway extension analysis.
Assistant: I have activated the Startup Burn, Runway & Unit Economics Analyzer. Right now your net burn is $12,000/month ($18k outflow minus $6k MRR), giving you 7.5 months of cash runway, while $3,000 in AWS + OpenAI costs consumes 50% of MRR (50% gross margin). By shifting that $3,000/month compute bill onto startup partner credits, net burn drops to $9,000/month—extending your runway to 10.0 months (+2.5 extra months free). Want me to open the live runway model in Rico Excel?
