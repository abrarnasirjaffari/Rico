import type { Page } from "playwright";
import { redactSecretsInText, redactSensitiveValue } from "./redaction";
import { extractAllGroundedPricesFromDom } from "./page-guards";
import { detectHelpWall } from "./wall-detector";
import type {
  SemanticActionRequest,
  SemanticActionResult,
  SemanticElementNode,
  SemanticSnapshotResult,
} from "./types";

export class StaleElementRefError extends Error {
  public readonly code = "STALE_ELEMENT_REF";
  public readonly ref?: string;
  public readonly expectedGeneration: number;
  public readonly receivedGeneration?: number;

  constructor(
    message: string,
    opts: {
      ref?: string;
      expectedGeneration: number;
      receivedGeneration?: number;
    }
  ) {
    super(message);
    this.name = "StaleElementRefError";
    this.ref = opts.ref;
    this.expectedGeneration = opts.expectedGeneration;
    this.receivedGeneration = opts.receivedGeneration;
  }
}

export function normalizeElementRef(rawRef: string): {
  atRef: string;
  bareRef: string;
  numericId: number;
} {
  const cleaned = rawRef.trim().replace(/^@/, "").toLowerCase();
  const match = cleaned.match(/^e(\d+)$/);
  if (!match) {
    throw new Error(`Invalid semantic element reference "${rawRef}". Expected format @e1..@eN.`);
  }
  const num = parseInt(match[1], 10);
  return {
    atRef: `@e${num}`,
    bareRef: `e${num}`,
    numericId: num,
  };
}

interface RawEvaluatedNode {
  bareRef: string;
  role: string;
  name: string;
  tagName: string;
  inputType?: string;
  rawValue?: string;
  placeholder?: string;
  autocomplete?: string;
  fieldName?: string;
  fieldId?: string;
  checked?: boolean;
  disabled?: boolean;
  href?: string;
  isCursorPointer?: boolean;
  rect: { x: number; y: number; width: number; height: number };
}

/**
 * Walks the live DOM (Accessibility roles + native controls + CSS cursor:pointer interactive elements)
 * and mints monotonic @e1..@eN references bound to the current page generation.
 */
export async function captureSemanticSnapshot(
  page: Page,
  opts: {
    tabId: string;
    generation: number;
    nextRefCounter: { value: number };
    maxNodes?: number;
  }
): Promise<SemanticSnapshotResult> {
  const maxNodes = opts.maxNodes ?? 120;
  const startCounter = Math.max(1, opts.nextRefCounter.value);

    const evalResult = await page.evaluate(
    ({
      gen,
      initialCounter,
      limit,
    }: {
      gen: number;
      initialCounter: number;
      limit: number;
    }) => {
      let counter = initialCounter;
      const genStr = String(gen);
      const collected: RawEvaluatedNode[] = [];
      const capturedElements = new Set<Element>();

      const INTERACTIVE_ROLES = new Set([
        "button",
        "link",
        "textbox",
        "searchbox",
        "combobox",
        "checkbox",
        "radio",
        "switch",
        "tab",
        "menuitem",
        "option",
      ]);

      const root = document.body || document.documentElement;
      if (!root) {
        return { nodes: [] as RawEvaluatedNode[], nextCounter: counter };
      }

      const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
      let current: Element | null = walker.currentNode as Element | null;

      while (current && collected.length < limit) {
        const el = current as HTMLElement;
        const tag = el.tagName?.toLowerCase() || "";

        if (
          tag &&
          tag !== "body" &&
          tag !== "html" &&
          tag !== "script" &&
          tag !== "style" &&
          tag !== "noscript" &&
          tag !== "svg" &&
          tag !== "path"
        ) {
          const style = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          const isVisible =
            style.display !== "none" &&
            style.visibility !== "hidden" &&
            parseFloat(style.opacity || "1") > 0 &&
            rect.width >= 2 &&
            rect.height >= 2;

          if (isVisible) {
            const explicitRole = (el.getAttribute("role") || "").trim().toLowerCase();
            const isNativeInteractive =
              tag === "button" ||
              (tag === "a" && el.hasAttribute("href")) ||
              (tag === "input" &&
                ((el as HTMLInputElement).type || "").toLowerCase() !== "hidden") ||
              tag === "select" ||
              tag === "textarea" ||
              tag === "summary" ||
              el.getAttribute("contenteditable") === "true" ||
              INTERACTIVE_ROLES.has(explicitRole);

            let isPointerRoot = false;
            if (!isNativeInteractive && style.cursor === "pointer") {
              const parentStyle = el.parentElement
                ? window.getComputedStyle(el.parentElement)
                : null;
              const parentIsPointer = parentStyle?.cursor === "pointer";
              if (
                !parentIsPointer ||
                el.hasAttribute("onclick") ||
                el.hasAttribute("tabindex")
              ) {
                isPointerRoot = true;
              }
            }

            const isSemanticHeading =
              !isNativeInteractive &&
              !isPointerRoot &&
              (/^h[1-3]$/.test(tag) ||
                (el.getAttribute("data-testid") || "").toLowerCase().includes("price"));

            let hasInteractiveAncestor = false;
            if (!isNativeInteractive) {
              let p = el.parentElement;
              while (p) {
                if (capturedElements.has(p)) {
                  const pTag = p.tagName.toLowerCase();
                  const pRole = (p.getAttribute("role") || "").toLowerCase();
                  if (
                    pTag === "button" ||
                    pTag === "a" ||
                    pTag === "label" ||
                    pTag === "summary" ||
                    INTERACTIVE_ROLES.has(pRole) ||
                    p.hasAttribute("data-rico-pointer-root")
                  ) {
                    hasInteractiveAncestor = true;
                    break;
                  }
                }
                p = p.parentElement;
              }
            }

            if (
              (isNativeInteractive || isPointerRoot || isSemanticHeading) &&
              !hasInteractiveAncestor
            ) {
              // Compute accessible name inline (no inner named function so tsx/esbuild never injects __name)
              let name = (el.getAttribute("aria-label") || "").trim();
              if (!name) {
                const labelledBy = el.getAttribute("aria-labelledby");
                if (labelledBy) {
                  name = labelledBy
                    .split(/\s+/)
                    .map((id) => document.getElementById(id)?.textContent?.trim() || "")
                    .filter(Boolean)
                    .join(" ");
                }
              }
              if (!name && el.id) {
                const assocLabel = document.querySelector(
                  `label[for="${CSS.escape(el.id)}"]`
                );
                if (assocLabel?.textContent?.trim()) {
                  name = assocLabel.textContent.replace(/\s+/g, " ").trim();
                }
              }
              if (!name) {
                const wrappingLabel = el.closest("label");
                if (wrappingLabel && wrappingLabel !== el) {
                  const cloneText = (wrappingLabel.textContent || "")
                    .replace(/\s+/g, " ")
                    .trim();
                  if (cloneText) name = cloneText.slice(0, 120);
                }
              }
              if (!name && (tag === "input" || tag === "textarea")) {
                const inp = el as HTMLInputElement;
                if (
                  (inp.type === "submit" || inp.type === "button" || inp.type === "reset") &&
                  inp.value?.trim()
                ) {
                  name = inp.value.trim();
                } else if (inp.placeholder?.trim()) {
                  name = inp.placeholder.trim();
                } else if (inp.name?.trim()) {
                  name = inp.name.trim();
                }
              }
              if (!name) {
                const text = (el.innerText || el.textContent || "")
                  .replace(/\s+/g, " ")
                  .trim();
                if (text) name = text.slice(0, 140);
              }
              if (!name) {
                name = (el.getAttribute("title") || el.getAttribute("alt") || "")
                  .trim()
                  .slice(0, 120);
              }

              if (isNativeInteractive || name.length > 0) {
                let bareRef = el.getAttribute("data-rico-ref") || "";
                const existingGen = el.getAttribute("data-rico-gen");

                if (!/^e\d+$/.test(bareRef) || existingGen !== genStr) {
                  bareRef = `e${counter++}`;
                  el.setAttribute("data-rico-ref", bareRef);
                  el.setAttribute("data-rico-gen", genStr);
                } else {
                  const num = parseInt(bareRef.slice(1), 10);
                  if (num >= counter) counter = num + 1;
                }

                if (isPointerRoot) {
                  el.setAttribute("data-rico-pointer-root", "1");
                }
                capturedElements.add(el);

                // Infer role inline
                let role = explicitRole;
                if (!role) {
                  if (tag === "button" || tag === "summary") role = "button";
                  else if (tag === "a" && el.hasAttribute("href")) role = "link";
                  else if (tag === "select") role = "combobox";
                  else if (tag === "textarea") role = "textbox";
                  else if (/^h[1-6]$/.test(tag)) role = "heading";
                  else if (tag === "input") {
                    const t = ((el as HTMLInputElement).type || "text").toLowerCase();
                    if (t === "checkbox") role = "checkbox";
                    else if (t === "radio") role = "radio";
                    else if (t === "submit" || t === "button" || t === "reset")
                      role = "button";
                    else if (t === "search") role = "searchbox";
                    else role = "textbox";
                  } else if (el.getAttribute("contenteditable") === "true") {
                    role = "textbox";
                  } else if (isPointerRoot) {
                    role = "button";
                  } else {
                    role = tag;
                  }
                }

                const inputEl = el as HTMLInputElement;
                const selectEl = el as HTMLSelectElement;

                let rawValue: string | undefined;
                if (tag === "input" || tag === "textarea") {
                  rawValue = inputEl.value ?? "";
                } else if (tag === "select") {
                  rawValue = selectEl.value ?? "";
                } else if (el.getAttribute("contenteditable") === "true") {
                  rawValue = (el.textContent || "").trim();
                }

                let checked: boolean | undefined;
                if (
                  tag === "input" &&
                  (inputEl.type === "checkbox" || inputEl.type === "radio")
                ) {
                  checked = Boolean(inputEl.checked);
                } else if (
                  explicitRole === "checkbox" ||
                  explicitRole === "switch" ||
                  explicitRole === "radio"
                ) {
                  checked = el.getAttribute("aria-checked") === "true";
                }

                const disabled =
                  Boolean((el as HTMLButtonElement).disabled) ||
                  el.getAttribute("aria-disabled") === "true";

                collected.push({
                  bareRef,
                  role,
                  name,
                  tagName: tag,
                  inputType:
                    tag === "input" ? (inputEl.type || "text").toLowerCase() : undefined,
                  rawValue,
                  placeholder: inputEl.placeholder || undefined,
                  autocomplete: el.getAttribute("autocomplete") || undefined,
                  fieldName: el.getAttribute("name") || undefined,
                  fieldId: el.id || undefined,
                  checked,
                  disabled: disabled || undefined,
                  href:
                    tag === "a"
                      ? (el as HTMLAnchorElement).getAttribute("href") || undefined
                      : undefined,
                  isCursorPointer: isPointerRoot || undefined,
                  rect: {
                    x: Math.round(rect.left),
                    y: Math.round(rect.top),
                    width: Math.round(rect.width),
                    height: Math.round(rect.height),
                  },
                });
              }
            }
          }
        }
        current = walker.nextNode() as Element | null;
      }

      return { nodes: collected, nextCounter: counter };
    },
    { gen: opts.generation, initialCounter: startCounter, limit: maxNodes }
  );

  opts.nextRefCounter.value = Math.max(opts.nextRefCounter.value, evalResult.nextCounter);

  const elements: SemanticElementNode[] = evalResult.nodes.map((raw) => {
    const redaction =
      raw.rawValue !== undefined
        ? redactSensitiveValue(raw.rawValue, {
            type: raw.inputType,
            name: raw.fieldName,
            id: raw.fieldId,
            autocomplete: raw.autocomplete,
            label: raw.name,
            placeholder: raw.placeholder,
          })
        : undefined;

    return {
      ref: `@${raw.bareRef}`,
      generation: opts.generation,
      role: raw.role,
      name: redactSecretsInText(raw.name),
      tagName: raw.tagName,
      inputType: raw.inputType,
      value: redaction?.value,
      placeholder: raw.placeholder,
      checked: raw.checked,
      disabled: raw.disabled,
      href: raw.href ? redactSecretsInText(raw.href) : undefined,
      isCursorPointer: raw.isCursorPointer,
      isSensitive: redaction?.redacted || raw.inputType === "password" || undefined,
      rect: raw.rect,
    };
  });

  const url = redactSecretsInText(page.url() || "about:blank");
  const title = (await page.title().catch(() => "")) || url;
  const [wall, groundedPrices] = await Promise.all([
    detectHelpWall(page, opts.tabId),
    extractAllGroundedPricesFromDom(page, 6),
  ]);

  const treeLines: string[] = [
    `[page] "${title}" (${url}) · tab=${opts.tabId} · gen=${opts.generation}`,
  ];
  if (wall?.detected) {
    treeLines.push(`[wall:${wall.kind}] ${wall.title} — ${wall.message}`);
  }
  for (const el of elements) {
    const parts = [
      el.ref,
      `[${el.inputType === "password" ? `${el.role}:password` : el.role}]`,
    ];
    if (el.name) parts.push(`"${el.name}"`);
    if (el.value !== undefined && el.value !== "") {
      parts.push(`value=${el.value === "[REDACTED]" ? "[REDACTED]" : `"${el.value.slice(0, 60)}"`}`);
    }
    if (typeof el.checked === "boolean") {
      parts.push(el.checked ? "[checked]" : "[unchecked]");
    }
    if (el.disabled) parts.push("[disabled]");
    if (el.href) parts.push(`href="${el.href.slice(0, 80)}"`);
    if (el.isCursorPointer) parts.push("(cursor:pointer)");
    treeLines.push(parts.join(" "));
  }

  return {
    tabId: opts.tabId,
    url,
    title,
    generation: opts.generation,
    capturedAt: new Date().toISOString(),
    elements,
    treeText: treeLines.join("\n"),
    wall,
    groundedPrices,
  };
}

/**
 * Executes a multi-turn semantic browser action (`snapshot`, `click`, `fill`, `select`, `check`, `press`, `wait`)
 * with monotonic @eN element resolution, generation stale-ref guard, and Zephium secret redaction.
 */
export async function executeSemanticAction(
  page: Page,
  req: SemanticActionRequest,
  tabCtx: {
    tabId: string;
    getGeneration: () => number;
    nextRefCounter: { value: number };
    onCursorMove?: (x: number, y: number, action: "move" | "click" | "type", label: string) => Promise<void>;
  }
): Promise<SemanticActionResult> {
  const currentGen = tabCtx.getGeneration();

  if (req.action === "snapshot") {
    const snap = await captureSemanticSnapshot(page, {
      tabId: tabCtx.tabId,
      generation: currentGen,
      nextRefCounter: tabCtx.nextRefCounter,
    });
    return {
      ok: true,
      tabId: tabCtx.tabId,
      action: "snapshot",
      generation: snap.generation,
      url: snap.url,
      title: snap.title,
      summary: `Captured AXTree snapshot (${snap.elements.length} semantic nodes, gen=${snap.generation})`,
      snapshot: snap,
      wall: snap.wall,
    };
  }

  // Enforce generation stale-ref guard before mutating DOM
  if (req.generation !== undefined && req.generation !== currentGen) {
    throw new StaleElementRefError(
      `Stale element generation: action requested generation ${req.generation}, but tab ${tabCtx.tabId} is now at generation ${currentGen}. Run snapshot first.`,
      {
        ref: req.ref,
        expectedGeneration: currentGen,
        receivedGeneration: req.generation,
      }
    );
  }

  if (req.action === "wait") {
    if (req.text) {
      await page
        .getByText(req.text)
        .first()
        .waitFor({ state: "visible", timeout: Math.min(10000, req.ms ?? 5000) });
      const genAfter = tabCtx.getGeneration();
      return {
        ok: true,
        tabId: tabCtx.tabId,
        action: "wait",
        generation: genAfter,
        url: redactSecretsInText(page.url()),
        title: await page.title().catch(() => ""),
        summary: `Waited until text "${req.text}" became visible`,
        wall: await detectHelpWall(page, tabCtx.tabId),
      };
    }
    if (req.selector) {
      await page
        .locator(req.selector)
        .first()
        .waitFor({ state: "visible", timeout: Math.min(10000, req.ms ?? 5000) });
      const genAfter = tabCtx.getGeneration();
      return {
        ok: true,
        tabId: tabCtx.tabId,
        action: "wait",
        generation: genAfter,
        url: redactSecretsInText(page.url()),
        title: await page.title().catch(() => ""),
        summary: `Waited until selector "${req.selector}" became visible`,
        wall: await detectHelpWall(page, tabCtx.tabId),
      };
    }
    const waitMs = Math.max(25, Math.min(10000, req.ms ?? 500));
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    const genAfter = tabCtx.getGeneration();
    return {
      ok: true,
      tabId: tabCtx.tabId,
      action: "wait",
      generation: genAfter,
      url: redactSecretsInText(page.url()),
      title: await page.title().catch(() => ""),
      summary: `Waited ${waitMs}ms`,
      wall: await detectHelpWall(page, tabCtx.tabId),
    };
  }

  // Resolve optional or required @eN reference
  const resolveLocator = async (rawRef: string) => {
    const { atRef, bareRef } = normalizeElementRef(rawRef);
    const selector = `[data-rico-ref="${bareRef}"][data-rico-gen="${currentGen}"]`;
    const locator = page.locator(selector).first();
    const count = await locator.count();
    if (count === 0) {
      throw new StaleElementRefError(
        `Element reference ${atRef} was not found in generation ${currentGen} (the DOM changed or navigated). Run snapshot to mint fresh @eN refs.`,
        {
          ref: atRef,
          expectedGeneration: currentGen,
          receivedGeneration: req.generation,
        }
      );
    }
    return { atRef, bareRef, locator };
  };

  if (req.action === "press") {
    const key = req.key || "Enter";
    let atRefUsed: string | undefined;
    if (req.ref) {
      const { atRef, locator } = await resolveLocator(req.ref);
      atRefUsed = atRef;
      await locator.focus({ timeout: 3000 });
    }
    await page.keyboard.press(key);
    await new Promise((r) => setTimeout(r, 80));
    const genAfter = tabCtx.getGeneration();
    return {
      ok: true,
      tabId: tabCtx.tabId,
      action: "press",
      ref: atRefUsed,
      generation: genAfter,
      url: redactSecretsInText(page.url()),
      title: await page.title().catch(() => ""),
      summary: atRefUsed ? `Pressed ${key} on ${atRefUsed}` : `Pressed ${key}`,
      wall: await detectHelpWall(page, tabCtx.tabId),
    };
  }

  if (!req.ref) {
    throw new Error(`Action "${req.action}" requires a semantic element reference (e.g. "@e1").`);
  }

  const { atRef, locator } = await resolveLocator(req.ref);
  await locator.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {});

  const meta = await locator
    .evaluate((el) => {
      const htmlEl = el as HTMLInputElement;
      const rect = htmlEl.getBoundingClientRect();
      return {
        tagName: htmlEl.tagName.toLowerCase(),
        type: (htmlEl.type || "").toLowerCase(),
        name: htmlEl.getAttribute("name") || "",
        id: htmlEl.id || "",
        autocomplete: htmlEl.getAttribute("autocomplete") || "",
        ariaLabel: htmlEl.getAttribute("aria-label") || "",
        placeholder: htmlEl.placeholder || "",
        labelText: (htmlEl.innerText || htmlEl.textContent || "").replace(/\s+/g, " ").trim().slice(0, 60),
        centerX: Math.round(rect.left + rect.width / 2),
        centerY: Math.round(rect.top + rect.height / 2),
      };
    })
    .catch(() => ({
      tagName: "element",
      type: "",
      name: "",
      id: "",
      autocomplete: "",
      ariaLabel: "",
      placeholder: "",
      labelText: "",
      centerX: 480,
      centerY: 360,
    }));

  if (req.action === "click") {
    if (tabCtx.onCursorMove) {
      await tabCtx.onCursorMove(
        meta.centerX,
        meta.centerY,
        "click",
        `Click ${atRef}${meta.labelText ? ` "${meta.labelText.slice(0, 28)}"` : ""}`
      );
    }
    await locator.click({ timeout: 5000 });
    await new Promise((r) => setTimeout(r, 120));
    const genAfter = tabCtx.getGeneration();
    return {
      ok: true,
      tabId: tabCtx.tabId,
      action: "click",
      ref: atRef,
      generation: genAfter,
      url: redactSecretsInText(page.url()),
      title: await page.title().catch(() => ""),
      summary: `Clicked ${atRef}${meta.labelText ? ` ("${meta.labelText.slice(0, 40)}")` : ""}`,
      wall: await detectHelpWall(page, tabCtx.tabId),
    };
  }

  if (req.action === "fill") {
    const fillVal = req.value ?? "";
    const redactedCheck = redactSensitiveValue(fillVal, {
      type: meta.type,
      name: meta.name,
      id: meta.id,
      autocomplete: meta.autocomplete,
      label: meta.ariaLabel || meta.labelText,
      placeholder: meta.placeholder,
    });

    if (tabCtx.onCursorMove) {
      await tabCtx.onCursorMove(
        meta.centerX,
        meta.centerY,
        "type",
        `Fill ${atRef}: ${redactedCheck.redacted ? "[REDACTED]" : `"${fillVal.slice(0, 24)}"`}`
      );
    }

    await locator.fill(fillVal, { timeout: 5000 });
    const genAfter = tabCtx.getGeneration();
    return {
      ok: true,
      tabId: tabCtx.tabId,
      action: "fill",
      ref: atRef,
      generation: genAfter,
      url: redactSecretsInText(page.url()),
      title: await page.title().catch(() => ""),
      redacted: redactedCheck.redacted,
      summary: `Filled ${atRef} with ${
        redactedCheck.redacted ? "[REDACTED]" : `"${redactedCheck.value.slice(0, 48)}"`
      }`,
      wall: await detectHelpWall(page, tabCtx.tabId),
    };
  }

  if (req.action === "select") {
    const optionVal = req.value ?? "";
    if (meta.tagName === "select") {
      try {
        await locator.selectOption({ value: optionVal }, { timeout: 3000 });
      } catch {
        await locator.selectOption({ label: optionVal }, { timeout: 3000 });
      }
    } else {
      await locator.click({ timeout: 3000 });
      await page.getByRole("option", { name: optionVal }).first().click({ timeout: 3000 });
    }
    const genAfter = tabCtx.getGeneration();
    return {
      ok: true,
      tabId: tabCtx.tabId,
      action: "select",
      ref: atRef,
      generation: genAfter,
      url: redactSecretsInText(page.url()),
      title: await page.title().catch(() => ""),
      summary: `Selected "${redactSecretsInText(optionVal)}" on ${atRef}`,
      wall: await detectHelpWall(page, tabCtx.tabId),
    };
  }

  if (req.action === "check") {
    const desired = req.checked !== false;
    if (meta.tagName === "input" && (meta.type === "checkbox" || meta.type === "radio")) {
      if (desired) {
        await locator.check({ timeout: 4000 });
      } else {
        await locator.uncheck({ timeout: 4000 });
      }
    } else {
      const currentChecked = await locator
        .evaluate((el) => el.getAttribute("aria-checked") === "true")
        .catch(() => false);
      if (currentChecked !== desired) {
        await locator.click({ timeout: 4000 });
      }
    }
    const genAfter = tabCtx.getGeneration();
    return {
      ok: true,
      tabId: tabCtx.tabId,
      action: "check",
      ref: atRef,
      generation: genAfter,
      url: redactSecretsInText(page.url()),
      title: await page.title().catch(() => ""),
      summary: `${desired ? "Checked" : "Unchecked"} ${atRef}`,
      wall: await detectHelpWall(page, tabCtx.tabId),
    };
  }

  throw new Error(`Unsupported semantic action: ${String(req.action)}`);
}
