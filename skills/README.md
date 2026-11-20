# Rico Modular Skills Directory (`skills/`)

Rico automatically discovers and loads every `SKILL.md` file inside `skills/` at runtime via `SkillRegistry` (`src/lib/skills/registry.ts`). All skills in this directory are 100% open-source, native to Rico, and visible in Rico's in-app Skill Store.

## Folder Structure

```text
skills/
├── core/                         # Core spending, savings, tax & renewal guardrails
│   ├── startup-pitch/            # Startup Credit & Grant Application Drafter
│   ├── student-discount/         # Student 50% Discount Enforcer
│   ├── tax-deduction-ocr/        # IRS Schedule C Tax Deduction Classifier
│   └── saas-renewal-negotiator/  # Annual Lock-In & Zombie Seat Negotiator
│
├── finance-ops/                  # Autonomous FinOps, reconciliation & runway auditing
│   ├── payment-reconciler/       # PayPal, card & mandate variance reconciler
│   ├── monthly-spend-closer/     # Month-end close, accruals & variance commentary
│   ├── saas-unit-economics/      # Burn rate, runway & AI/cloud gross margin modeler
│   └── invoice-statement-auditor/# Line-item math, rate & billing error auditor
│
└── founder-playbooks/            # Real-world founder credit chains & approval patterns
    └── cloud-credit-domino/      # Stack-filtered partner chain ($50k PostHog -> $25k AWS & GCP)
```

## How Founder Playbooks Work

Skills inside `founder-playbooks/` encode battle-tested application sequences and partner-bridge routes that standard search results miss:

1. **Stack-Aware Filtering:** Rico checks what the startup actually builds first and **completely skips** any perk or tool the startup does not need (for example, skipping Docker/CI credits like Depot if the team does not use containers).
2. **Partner Domino Routing:** Instead of sending founders into high-rejection cold tiers (such as cold $1k AWS applications or $2k bootstrapped GCP caps), Rico routes founders through high-approval partner bridges (PostHog, Retool, Zendesk for Startups, NVIDIA Inception).
3. **Zero-Burn Mandate Protection:** Once credits are unlocked, Rico sets `$0.00` budget mandates and pre-expiration reminders so free credits never turn into surprise charges.

## Adding a New Skill or Founder Playbook

Create a new folder under `core/`, `finance-ops/`, or `founder-playbooks/` with a `SKILL.md` file containing:
- YAML metadata (`id`, `name`, `description`, `author: Rico Team`, `category`, `persona`, `triggers`, `toolsRequired`)
- `## Instructions`
- `## Rules`
- `## Few-Shot Examples`
