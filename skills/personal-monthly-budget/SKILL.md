---
id: personal-monthly-budget
name: Personal Monthly Budget Planner
description: Help individuals, students and freelancers plan monthly spending, savings goals and safe subscription limits without making payments.
version: "1.0.0"
author: Rico Contributors
category: finance
persona: all
triggers:
  - monthly budget
  - budget planning
  - budget my salary
  - student budget
  - personal finance
  - monthly expenses
  - subscription budget
  - spending limit
  - savings goal
tags:
  - budget
  - savings
  - subscriptions
  - spending guardrails
---

# Personal Monthly Budget Planner

Use this skill when someone wants a realistic monthly budget or asks how much of their income can safely go toward subscriptions. Explain trade-offs in plain language; do not assume a fixed 50/30/20 split works for everyone.

## Instructions

1. **Collect only the inputs needed.** Ask for monthly take-home income and its currency, essential fixed costs (such as rent, food, transport and utilities), minimum debt payments, expected irregular expenses, savings target, and current subscriptions. If income varies, ask for a conservative monthly baseline or show a low-income scenario. Accept estimates and clearly mark unknown values.
2. **Normalize the time period.** Convert weekly or annual expenses to monthly equivalents using `weekly * 52 / 12` and `annual / 12`. Show the assumptions. Keep all amounts in the user's stated currency; never invent exchange rates.
3. **Calculate the available balance.** Compute `available = monthly take-home income - essential costs - planned irregular-expense reserve - minimum debt payments`. Treat any negative balance as a shortfall; do not recommend extra subscriptions or promise savings from money that is not available.
4. **Propose a practical plan.** First cover essentials and minimum obligations. Then allocate an achievable savings amount and a clearly labeled discretionary budget, based on the user's own priorities. Use percentages only as optional examples, not requirements.
5. **Set a subscription ceiling.** List current recurring subscriptions, their monthly equivalent costs and renewal dates if known. Recommend a monthly ceiling that fits *inside* discretionary funds after the chosen savings amount. Clearly distinguish current committed subscriptions from the user's remaining subscription allowance.
6. **Suggest spending guardrails.** Offer a hard monthly cap, a renewal reminder, and a review of any price increase. If the person wants Rico mandates, describe a proposed cap for their approval; do not claim that a mandate was created or a payment was stopped without a successful authorized action.
7. **Check edge cases.** For a shortfall, prioritize essentials and suggest reducing or pausing optional expenses. For irregular income, provide a conservative baseline and an optional better-month scenario. For missing data, explain that the plan is provisional.
8. **Present an actionable result.** Show a simple monthly table with income, essentials, irregular reserve, debt minimums, savings, discretionary spending, subscriptions and money left unassigned. Include a clear next step and one check-in date chosen by the user.

## Rules

- Never invent income, expenses, prices, renewal dates, eligibility, or existing Rico mandates. Label estimates as estimates.
- Never suggest a subscription cap above the money actually available for discretionary spending after essentials and the chosen savings allocation.
- Never initiate, approve, cancel, or capture payments, alter mandates, or connect accounts without the user's informed permission and an authorized tool flow.
- Do not bypass Rico's quote, confirmation-token or other financial guardrails; this skill only plans and explains.
- Do not request passwords, full card numbers, account credentials or other unnecessary sensitive information.
- Do not present budget illustrations as guaranteed savings or individualized investment, tax or debt advice.
- If expenses exceed income, show the shortfall honestly and help prioritize essentials before optional purchases.
- Be respectful and practical: avoid shaming the user for spending choices.

## Examples

### Example 1
User: I take home $1,200 per month. Essentials are $800, debt minimums are $100, I want to save $150 and I pay $35 for subscriptions. Can I add a $40 monthly tool?
Assistant: After essentials and minimum debt payments, $300 remains. Setting aside your $150 savings goal leaves $150 for discretionary spending. Your existing $35 subscriptions leave $115 before other discretionary purchases. The new $40 tool would raise subscriptions to $75, which fits within that $150 pool, but only if your other optional spending stays within the remaining $75. Would you like to use $75 as a proposed subscription cap? I have not created any mandate or approved any charge.

### Example 2
User: I earn around 90,000 PKR a month, but some months I earn less. How should I budget?
Assistant: We should plan using a conservative income figure rather than your best month. What was a typical lower-income month, and roughly how much do rent, food, transport, utilities and minimum debt payments cost? Once we have those estimates, I can show a baseline budget, savings options and a subscription cap in PKR.
