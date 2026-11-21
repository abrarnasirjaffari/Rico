/**
 * Resolves verified official URLs when a model omits `url` or uses an alias field,
 * and normalizes action labels so cryptic strings like "Draft App" never appear.
 */

const OFFICIAL_URLS: Array<[RegExp, string]> = [
  [/\b(y\s*combinator|\byc\b)\b/i, "https://www.ycombinator.com/apply"],
  [/\btechstars\b/i, "https://www.techstars.com/accelerators"],
  [/\b500\s*(global|startups)\b/i, "https://500.co/accelerators"],
  [/\bspeedrun|a16z\b/i, "https://speedrun.a16z.com/"],
  [/\bsequoia\s*arc\b/i, "https://www.sequoiacap.com/arc/"],
  [/\bposthog\b/i, "https://posthog.com/startups"],
  [/\baws\s*activate|\bamazon\s*web\s*services|\baws\b/i, "https://aws.amazon.com/activate/"],
  [/\bgoogle\s*(cloud\s*)?for\s*startups|\bgoogle\s*cloud|\bgcp\b/i, "https://cloud.google.com/startup"],
  [/\bfounders\s*hub|\bmicrosoft\s*for\s*startups|\bazure\b/i, "https://foundershub.startups.microsoft.com/"],
  [/\bnvidia\s*inception|\bnvidia\b/i, "https://www.nvidia.com/en-us/startups/"],
  [/\bnotion\b/i, "https://www.notion.so/startups"],
  [/\bstripe\b/i, "https://stripe.com/startups"],
  [/\bgithub\s*student\b/i, "https://education.github.com/pack"],
  [/\bgithub\s*for\s*startups|\bgithub\s*enterprise\b/i, "https://github.com/enterprise/startups"],
  [/\bgithub\s*copilot|\bcopilot\b/i, "https://github.com/features/copilot/plans"],
  [/\bretool\b/i, "https://retool.com/startups"],
  [/\bzendesk\b/i, "https://www.zendesk.com/startups/"],
  [/\bdepot\b/i, "https://depot.dev/startups"],
  [/\bpaypal\b/i, "https://developer.paypal.com/"],
  [/\bvercel\b/i, "https://vercel.com/pricing"],
  [/\bsupabase\b/i, "https://supabase.com/pricing"],
  [/\bcloudflare\b/i, "https://www.cloudflare.com/forstartups/"],
  [/\bdigitalocean|\bhatch\b/i, "https://www.digitalocean.com/hatch"],
  [/\bmongodb\b/i, "https://www.mongodb.com/startups"],
  [/\bhubspot\b/i, "https://www.hubspot.com/startups"],
  [/\bfigma\b/i, "https://www.figma.com/pricing/"],
  [/\blinear\b/i, "https://linear.app/pricing"],
  [/\bslack\b/i, "https://slack.com/pricing"],
  [/\bnetflix\b/i, "https://www.netflix.com/signup/planform"],
  [/\bspotify\b/i, "https://www.spotify.com/us/premium/"],
  [/\badobe\b/i, "https://www.adobe.com/creativecloud/plans.html"],
  [/\bchatgpt|\bopenai\b/i, "https://openai.com/chatgpt/pricing/"],
  [/\banthropic|\bclaude\b/i, "https://www.anthropic.com/pricing"],
];

export function sanitizeHttpUrl(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^https?:\/\/[^\s<>"]+$/i.test(trimmed)) return trimmed;
  if (/^www\.[a-z0-9.-]+\.[a-z]{2,}/i.test(trimmed)) return `https://${trimmed}`;
  return "";
}

export function resolveOfficialUrl(
  name: string,
  explicitRaw?: unknown
): string {
  const direct = sanitizeHttpUrl(explicitRaw);
  if (direct) return direct;
  const target = (name || "").trim();
  if (!target) return "";
  for (const [pattern, url] of OFFICIAL_URLS) {
    if (pattern.test(target)) return url;
  }
  return "";
}

export function normalizeCardActionLabel(rawLabel: unknown): string {
  if (typeof rawLabel !== "string") return "";
  const trimmed = rawLabel.trim();
  if (!trimmed) return "";
  if (/^draft\s+app$/i.test(trimmed)) return "Application guide";
  if (/^draft\s+in\s+doc$/i.test(trimmed)) return "";
  return trimmed;
}
