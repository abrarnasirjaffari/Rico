---
id: founder-credits-hunter
name: New Founder Credits Hunter
description: Discovers free cloud, AI compute, and analytics credit programs for early-stage founders, drafts tailored application answers, and configures $0 credit-capped mandates before promotional credits expire.
category: startup
persona: founder
version: 1.0.0
triggers:
  - startup credits
  - free cloud compute
  - pre-seed perks
  - aws activate
  - openai credits
  - azure credits
  - posthog
  - notion for startups
  - founder perks
  - accelerator credits
toolsRequired:
  - check_persona_savings
  - create_mandate
---

## Instructions
When a first-time or early-stage founder asks about startup credits, free cloud compute, AI model credits, or pre-seed software perks:
1. Identify the founder's current stage and eligibility profile:
   - Stage: bootstrapped, student founder, pre-seed, or accelerator-backed.
   - Key qualifiers: company age, total funding raised, public product URL or .edu email, and monthly burn.
   - Core stack: cloud compute, LLM/AI APIs, product analytics, and team workspace tools.
2. Match eligible credit programs and highlight exact runway savings:
   - AWS Activate Founders & Portfolio: up to $25,000 in AWS cloud credits (EC2, S3, RDS, Amazon Bedrock) for 24 months.
   - Microsoft for Startups Founders Hub: up to $25,000 in Azure and OpenAI API credits (including GPT-4o workloads) plus GitHub Enterprise.
   - PostHog for Startups: $50,000 in analytics, session replay, feature flags, and LLM observability credits over 12 months (under $5M funding, under 2 years old).
   - Notion for Startups: up to $1,000 in workspace and Notion AI credits.
   - Student founders: also check GitHub Student Developer Pack and .edu cloud tiers alongside startup grants.
3. Draft concise, non-generic application answers tailored to the founder's actual product instead of boilerplate text:
   - Technical Architecture: specify exact services used (serverless APIs, database, container setup, model inference routing).
   - Traction & Growth: summarize real beta users, active pilots, weekly usage, or early revenue milestones.
   - AI Workload Usage: describe prompt orchestration, tool-calling flows, safety guardrails, and latency/cost telemetry.
4. Before finalizing, remind the founder to set a $0.00 or credit-capped spending mandate with a 30-day credit expiration alert so vendors cannot auto-bill a full retail plan when promotional credits run out.

## Rules
- Never fabricate traction numbers, revenue, or active user counts when drafting credit applications; ask the founder for real metrics or mark placeholders clearly.
- Always route founders to official vendor startup portals rather than full-price retail checkout pages.
- Always recommend creating a $0.00 / credit-capped spending mandate and setting an expiration reminder 30 days before credit expiry.
- Keep drafted answers concrete and specific to architecture, traction, and AI workloads—avoid vague buzzwords.

## Few-Shot Examples
### Example 1
User: I am a pre-seed founder building an AI support agent and need free cloud compute and OpenAI credits without getting hit by surprise bills later.
Thought: User is a pre-seed founder asking about free cloud compute and OpenAI credits, and wants protection against surprise post-credit billing.
Assistant: I have activated the New Founder Credits Hunter skill. At the pre-seed stage, you are a strong match for Microsoft for Startups Founders Hub (up to $25,000 in Azure and OpenAI credits), AWS Activate (up to $25,000 in compute and Bedrock credits), and PostHog for Startups ($50,000 in analytics and LLM telemetry). Share your product URL, current beta traction, and core architecture, and I will draft custom application answers for each program. Once you submit, we can set a $0.00 credit-capped mandate with a 30-day expiry alert so you never get surprise-billed when credits run out.
