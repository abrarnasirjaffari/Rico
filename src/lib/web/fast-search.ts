/**
 * Fast, Browserless Web Search & Web Fetch Engine
 *
 * Uses Exa Search (when EXA_API_KEY is configured), Firecrawl Search/Scrape
 * (when FIRECRAWL_API_KEY or FIRECRAWL_FIRST_KEY is configured), and fast
 * native HTTP fetch + DuckDuckGo HTML extraction — NEVER launching Playwright
 * Chromium or popping open the visual RICO-Browser pane.
 */

export interface FastWebSearchResultItem {
  title: string;
  url: string;
  snippet: string;
}

export interface FastWebSearchResponse {
  success: boolean;
  provider: "exa" | "firecrawl" | "http-ddg" | "http-wiki";
  query: string;
  results: FastWebSearchResultItem[];
  elapsedMs: number;
  error?: string;
}

export interface FastWebFetchResponse {
  success: boolean;
  provider: "http-fetch" | "firecrawl";
  url: string;
  title: string;
  content: string;
  elapsedMs: number;
  error?: string;
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_m, dec) => {
      const code = Number(dec);
      return Number.isFinite(code) ? String.fromCharCode(code) : "";
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, hex) => {
      const code = parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCharCode(code) : "";
    })
    .replace(/&amp;/g, "&");
}

const SKIP_SUBTREE_TAGS = new Set([
  "script",
  "style",
  "noscript",
  "svg",
  "nav",
  "footer",
]);

const LINE_BREAK_TAGS = new Set([
  "br",
  "/p",
  "/div",
  "/li",
  "/tr",
  "/h1",
  "/h2",
  "/h3",
  "/h4",
  "/h5",
  "/h6",
]);

function extractPlainTextLinear(htmlFragment: string): string {
  const chunks: string[] = [];
  let i = 0;
  const len = htmlFragment.length;
  while (i < len) {
    const lt = htmlFragment.indexOf("<", i);
    if (lt === -1) {
      chunks.push(htmlFragment.slice(i));
      break;
    }
    if (lt > i) {
      chunks.push(htmlFragment.slice(i, lt));
    }
    const gt = htmlFragment.indexOf(">", lt + 1);
    if (gt === -1) {
      break;
    }
    const rawTag = htmlFragment.slice(lt + 1, gt).trim();
    const spacePos = rawTag.search(/[\s/>]/);
    const tagName = (spacePos === -1 ? rawTag : rawTag.slice(0, spacePos)).toLowerCase();

    if (SKIP_SUBTREE_TAGS.has(tagName) && !rawTag.endsWith("/")) {
      const closeNeedle = `</${tagName}`;
      const lowerRest = htmlFragment.toLowerCase();
      const closeIdx = lowerRest.indexOf(closeNeedle, gt + 1);
      if (closeIdx === -1) {
        break;
      }
      const closeGt = htmlFragment.indexOf(">", closeIdx + closeNeedle.length);
      i = closeGt === -1 ? len : closeGt + 1;
      chunks.push(" ");
      continue;
    }

    if (LINE_BREAK_TAGS.has(tagName)) {
      chunks.push("\n");
    } else if (tagName === "li") {
      chunks.push("- ");
    } else {
      chunks.push(" ");
    }
    i = gt + 1;
  }
  return chunks.join("");
}

function stripHtmlToReadableText(html: string): { title: string; text: string } {
  const lower = html.toLowerCase();
  let title = "";
  const titleOpen = lower.indexOf("<title");
  if (titleOpen !== -1) {
    const titleStart = html.indexOf(">", titleOpen + 6);
    if (titleStart !== -1) {
      const titleClose = lower.indexOf("</title", titleStart + 1);
      if (titleClose !== -1) {
        title = decodeHtmlEntities(
          html.slice(titleStart + 1, titleClose).replace(/\s+/g, " ").trim()
        );
      }
    }
  }

  const withoutBoilerplate = extractPlainTextLinear(html);

  const text = decodeHtmlEntities(withoutBoilerplate)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  return { title, text };
}

function decodeDuckDuckGoHref(rawHref: string): string {
  if (!rawHref) return "";
  try {
    const normalized = rawHref.startsWith("//") ? `https:${rawHref}` : rawHref;
    const parsed = new URL(normalized, "https://html.duckduckgo.com");
    const uddg = parsed.searchParams.get("uddg");
    if (uddg) return decodeURIComponent(uddg);
    return parsed.href;
  } catch {
    return rawHref;
  }
}

export function isPublicHttpUrl(rawUrl: string): { ok: true; url: URL } | { ok: false; reason: string } {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return { ok: false, reason: "Invalid URL format." };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, reason: "Only http and https URLs are allowed." };
  }

  const host = parsed.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host === "[::1]" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
  ) {
    return { ok: false, reason: `Blocked private or local host: ${host}` };
  }

  return { ok: true, url: parsed };
}

async function searchWithExa(
  query: string,
  maxResults: number,
  apiKey: string
): Promise<FastWebSearchResultItem[] | null> {
  try {
    const res = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        query,
        numResults: maxResults,
        type: "auto",
        contents: {
          text: { maxCharacters: 700 },
        },
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as {
      results?: Array<{
        title?: string;
        url?: string;
        text?: string;
        highlights?: string[];
      }>;
    };

    const items = (data.results ?? [])
      .filter((r) => r.url && (r.title || r.text))
      .slice(0, maxResults)
      .map((r) => ({
        title: (r.title || r.url || "").trim(),
        url: String(r.url),
        snippet: (
          (Array.isArray(r.highlights) && r.highlights.join(" ")) ||
          r.text ||
          ""
        )
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 500),
      }));

    return items.length > 0 ? items : null;
  } catch {
    return null;
  }
}

async function searchWithFirecrawl(
  query: string,
  maxResults: number,
  apiKey: string
): Promise<FastWebSearchResultItem[] | null> {
  try {
    const res = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query,
        limit: maxResults,
      }),
      signal: AbortSignal.timeout(6500),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as {
      success?: boolean;
      data?: Array<{
        title?: string;
        url?: string;
        description?: string;
        markdown?: string;
      }>;
    };

    const items = (data.data ?? [])
      .filter((r) => r.url)
      .slice(0, maxResults)
      .map((r) => ({
        title: (r.title || r.url || "").trim(),
        url: String(r.url),
        snippet: (r.description || r.markdown || "")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 500),
      }));

    return items.length > 0 ? items : null;
  } catch {
    return null;
  }
}

async function searchWithHttpDuckDuckGo(
  query: string,
  maxResults: number
): Promise<FastWebSearchResultItem[]> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
    },
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) return [];
  const html = await res.text();
  const items: FastWebSearchResultItem[] = [];

  const readAttr = (tagAttrs: string, attrName: string): string => {
    const lowerAttrs = tagAttrs.toLowerCase();
    const needle = `${attrName}=`;
    const pos = lowerAttrs.indexOf(needle);
    if (pos === -1) return "";
    const valStart = pos + needle.length;
    const quote = tagAttrs[valStart];
    if (quote === '"' || quote === "'") {
      const endQuote = tagAttrs.indexOf(quote, valStart + 1);
      return endQuote === -1 ? "" : tagAttrs.slice(valStart + 1, endQuote);
    }
    const endSpace = tagAttrs.search(/\s/);
    return endSpace === -1 ? tagAttrs.slice(valStart) : tagAttrs.slice(valStart, endSpace);
  };

  const hasToken = (classValue: string, token: string): boolean =>
    classValue.split(/\s+/).includes(token);

  const isDuckDuckGoAdRedirect = (candidateUrl: string): boolean => {
    try {
      const u = new URL(candidateUrl);
      const host = u.hostname.toLowerCase();
      return (
        (host === "duckduckgo.com" || host.endsWith(".duckduckgo.com")) &&
        u.pathname === "/y.js"
      );
    } catch {
      return true;
    }
  };

  const links: Array<{ url: string; title: string }> = [];
  const snippets: string[] = [];
  const lowerHtml = html.toLowerCase();
  let cursor = 0;

  while (cursor < html.length && (links.length < maxResults + 2 || snippets.length < maxResults + 2)) {
    const lt = html.indexOf("<", cursor);
    if (lt === -1) break;
    const gt = html.indexOf(">", lt + 1);
    if (gt === -1) break;
    const rawInside = html.slice(lt + 1, gt).trim();
    cursor = gt + 1;
    if (!rawInside || rawInside.startsWith("/") || rawInside.startsWith("!")) {
      continue;
    }
    const spaceIdx = rawInside.search(/\s/);
    if (spaceIdx === -1) continue;
    const tag = rawInside.slice(0, spaceIdx).toLowerCase();
    if (tag !== "a" && tag !== "div" && tag !== "span") continue;

    const attrs = rawInside.slice(spaceIdx + 1);
    const classVal = readAttr(attrs, "class");
    if (!classVal) continue;

    if (tag === "a" && hasToken(classVal, "result__a") && links.length < maxResults + 2) {
      const closeIdx = lowerHtml.indexOf("</a>", gt + 1);
      if (closeIdx === -1) continue;
      const hrefVal = readAttr(attrs, "href");
      const cleanUrl = decodeDuckDuckGoHref(decodeHtmlEntities(hrefVal));
      const cleanTitle = decodeHtmlEntities(extractPlainTextLinear(html.slice(gt + 1, closeIdx)))
        .replace(/\s+/g, " ")
        .trim();
      if (
        cleanTitle &&
        (cleanUrl.startsWith("https://") || cleanUrl.startsWith("http://")) &&
        !isDuckDuckGoAdRedirect(cleanUrl)
      ) {
        links.push({ url: cleanUrl, title: cleanTitle });
      }
      cursor = closeIdx + 4;
    } else if (hasToken(classVal, "result__snippet") && snippets.length < maxResults + 2) {
      const closeTag = `</${tag}>`;
      const closeIdx = lowerHtml.indexOf(closeTag, gt + 1);
      if (closeIdx === -1) continue;
      snippets.push(
        decodeHtmlEntities(extractPlainTextLinear(html.slice(gt + 1, closeIdx)))
          .replace(/\s+/g, " ")
          .trim()
      );
      cursor = closeIdx + closeTag.length;
    }
  }

  for (let i = 0; i < Math.min(links.length, maxResults); i++) {
    items.push({
      title: links[i].title,
      url: links[i].url,
      snippet: snippets[i] || "",
    });
  }

  return items;
}

/**
 * Fast web search across Exa -> Firecrawl -> HTTP DuckDuckGo.
 * Never opens Playwright Chromium or the RICO-Browser pane.
 */
export async function fastWebSearch(
  rawQuery: string,
  maxResults = 8
): Promise<FastWebSearchResponse> {
  const start = Date.now();
  const query = rawQuery.trim();
  const limit = Math.max(1, Math.min(12, maxResults));

  if (!query) {
    return {
      success: false,
      provider: "http-ddg",
      query: "",
      results: [],
      elapsedMs: Date.now() - start,
      error: "Search query cannot be empty.",
    };
  }

  const exaKey = process.env.EXA_API_KEY?.trim();
  if (exaKey && exaKey.length > 8) {
    const exaResults = await searchWithExa(query, limit, exaKey);
    if (exaResults && exaResults.length > 0) {
      return {
        success: true,
        provider: "exa",
        query,
        results: exaResults,
        elapsedMs: Date.now() - start,
      };
    }
  }

  const firecrawlKey = (
    process.env.FIRECRAWL_API_KEY || process.env.FIRECRAWL_FIRST_KEY
  )?.trim();
  if (firecrawlKey && firecrawlKey.length > 8) {
    const fcResults = await searchWithFirecrawl(query, limit, firecrawlKey);
    if (fcResults && fcResults.length > 0) {
      return {
        success: true,
        provider: "firecrawl",
        query,
        results: fcResults,
        elapsedMs: Date.now() - start,
      };
    }
  }

  try {
    const ddgResults = await searchWithHttpDuckDuckGo(query, limit);
    return {
      success: ddgResults.length > 0,
      provider: "http-ddg",
      query,
      results: ddgResults,
      elapsedMs: Date.now() - start,
      error:
        ddgResults.length === 0
          ? "No public HTTP search snippets returned; synthesize from verified domain knowledge or retry with a broader query."
          : undefined,
    };
  } catch (err) {
    return {
      success: false,
      provider: "http-ddg",
      query,
      results: [],
      elapsedMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Fast HTTP web fetch (with optional Firecrawl Markdown fallback).
 * Never opens Playwright Chromium or the RICO-Browser pane.
 */
export async function fastWebFetch(
  rawUrl: string,
  maxChars = 6000
): Promise<FastWebFetchResponse> {
  const start = Date.now();
  const check = isPublicHttpUrl(rawUrl);
  if (!check.ok) {
    return {
      success: false,
      provider: "http-fetch",
      url: rawUrl,
      title: "",
      content: "",
      elapsedMs: Date.now() - start,
      error: check.reason,
    };
  }

  const targetUrl = check.url.href;

  try {
    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,text/plain,application/json",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const contentType = (res.headers.get("content-type") || "").toLowerCase();
      const rawBody = await res.text();
      if (contentType.includes("text/html") || contentType.includes("xhtml")) {
        const { title, text } = stripHtmlToReadableText(rawBody);
        if (text.length >= 160) {
          return {
            success: true,
            provider: "http-fetch",
            url: targetUrl,
            title: title || check.url.hostname,
            content: text.slice(0, maxChars),
            elapsedMs: Date.now() - start,
          };
        }
      } else {
        const cleanText = rawBody.trim().slice(0, maxChars);
        if (cleanText.length > 0) {
          return {
            success: true,
            provider: "http-fetch",
            url: targetUrl,
            title: check.url.hostname,
            content: cleanText,
            elapsedMs: Date.now() - start,
          };
        }
      }
    }
  } catch {
    // Fall through to Firecrawl if configured
  }

  const firecrawlKey = (
    process.env.FIRECRAWL_API_KEY || process.env.FIRECRAWL_FIRST_KEY
  )?.trim();
  if (firecrawlKey && firecrawlKey.length > 8) {
    try {
      const fcRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${firecrawlKey}`,
        },
        body: JSON.stringify({
          url: targetUrl,
          formats: ["markdown"],
        }),
        signal: AbortSignal.timeout(7000),
      });
      if (fcRes.ok) {
        const fcData = (await fcRes.json()) as {
          data?: { markdown?: string; metadata?: { title?: string } };
        };
        const md = (fcData.data?.markdown || "").trim();
        if (md) {
          return {
            success: true,
            provider: "firecrawl",
            url: targetUrl,
            title: fcData.data?.metadata?.title || check.url.hostname,
            content: md.slice(0, maxChars),
            elapsedMs: Date.now() - start,
          };
        }
      }
    } catch {
      // ignore
    }
  }

  return {
    success: false,
    provider: "http-fetch",
    url: targetUrl,
    title: check.url.hostname,
    content: "",
    elapsedMs: Date.now() - start,
    error: "Could not extract readable content via fast HTTP fetch.",
  };
}
