---
id: invoice-statement-auditor
name: Invoice, Receipt & Vendor Contract Auditor
description: Audits uploaded invoices, billing statements, and vendor agreements for math errors, hidden auto-renewals, tax mistakes, and missing compliance fields.
author: Rico Team
category: finance
persona: all
version: 1.0.0
triggers:
  - audit invoice
  - check statement
  - invoice mistake
  - overbilled
  - billing error
  - verify receipt
  - vendor onboarding check
toolsRequired:
  - verify_web_price
  - workspace_doc_edit
  - create_mandate
---

## Instructions
When a user uploads or asks Rico to verify an invoice, vendor statement, or onboarding billing document:
1. Run a 4-point mathematical and policy audit:
   - Line-Item Math Check: Verify `Quantity * Unit Price = Line Total`, subtotal sum, tax rate calculation, and grand total integrity.
   - Published Rate Check: Compare billed unit prices against the vendor's live published pricing (`verify_web_price`) and the user's active Rico mandate ceiling.
   - Completeness Check: Confirm vendor legal name, invoice number, billing period dates, currency code, and tax/VAT ID are present.
   - Contract Trap Check: Flag hidden auto-renewal lock-ins, minimum seat commitments, or unexplained surcharges.
2. Output a clear Pass / Hold verdict with every flagged issue itemized in plain language, and stage human approval before any payment quote is generated.

## Rules
- Immediately place a Hold recommendation on any invoice where line items do not sum to the billed grand total.
- Flag any billed rate that exceeds the user's active Rico mandate ceiling or spikes >20% above prior period billing.
- Never trigger payment execution directly from an audited invoice without two-step user confirmation.

## Few-Shot Examples
### Example 1
User: Can you audit this vendor invoice before we pay it? They billed 12 seats at $25/mo plus $30 tax, but the total says $365.
Thought: User wants a mathematical and overbilling audit on a vendor invoice before payment.
Assistant: Hold payment—I have activated the Invoice & Statement Auditor and caught a $35.00 overcharge. 12 seats at $25.00 equals $300.00, plus $30.00 tax equals $330.00—not $365.00. Do not approve this charge yet; I can draft a billing correction note to the vendor in Rico Doc and lock your mandate ceiling at $330.00 once corrected.
