function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null && !Array.isArray(val);
}

/**
 * Client-safe summary of A2UI v1.0 wire messages for multi-turn conversation history,
 * so the LLM remembers the exact headings, tabs, inputs, and actions it rendered.
 */
export function summarizeA2uiWireForHistory(
  messages: Record<string, unknown>[] | undefined
): string {
  if (!messages || messages.length === 0) return "";

  const surfaces = new Map<
    string,
    {
      headings: string[];
      tabs: string[];
      inputs: string[];
      buttons: string[];
      components: Map<string, Record<string, unknown>>;
    }
  >();

  const ensure = (id: string) => {
    let s = surfaces.get(id);
    if (!s) {
      s = { headings: [], tabs: [], inputs: [], buttons: [], components: new Map() };
      surfaces.set(id, s);
    }
    return s;
  };

  for (const msg of messages) {
    if (isRecord(msg.deleteSurface) && typeof msg.deleteSurface.surfaceId === "string") {
      surfaces.delete(msg.deleteSurface.surfaceId);
      continue;
    }
    const cs = isRecord(msg.createSurface) ? msg.createSurface : null;
    const uc = isRecord(msg.updateComponents) ? msg.updateComponents : null;
    const container = cs || uc;
    if (!container || typeof container.surfaceId !== "string") continue;
    const acc = ensure(container.surfaceId);
    const comps = Array.isArray(container.components) ? container.components : [];
    for (const c of comps) {
      if (isRecord(c) && typeof c.id === "string") {
        acc.components.set(c.id, c);
      }
    }
  }

  if (surfaces.size === 0) return "";

  const lines: string[] = [];
  for (const [id, acc] of Array.from(surfaces.entries())) {
    for (const c of Array.from(acc.components.values())) {
      const type = String(c.component || "");
      if (type === "Text" && typeof c.text === "string" && /^#{1,4}\s+/.test(c.text.trim())) {
        acc.headings.push(c.text.trim().replace(/^#{1,4}\s+/, ""));
      } else if (type === "Tabs" && Array.isArray(c.tabs)) {
        for (const t of c.tabs) {
          if (isRecord(t) && typeof t.title === "string" && t.title.trim()) {
            acc.tabs.push(t.title.trim());
          }
        }
      } else if (
        (type === "TextField" ||
          type === "Slider" ||
          type === "ChoicePicker" ||
          type === "CheckBox" ||
          type === "DateTimeInput") &&
        typeof c.label === "string" &&
        c.label.trim()
      ) {
        acc.inputs.push(c.label.trim());
      } else if (type === "Button" && typeof c.child === "string") {
        const child = acc.components.get(c.child);
        if (child && typeof child.text === "string" && child.text.trim()) {
          acc.buttons.push(child.text.trim());
        }
      }
    }

    const bits: string[] = [];
    if (acc.headings.length > 0) bits.push(acc.headings[0]);
    if (acc.tabs.length > 0) bits.push(`tabs: ${acc.tabs.join(", ")}`);
    if (acc.inputs.length > 0) bits.push(`inputs: ${acc.inputs.join(", ")}`);
    if (acc.buttons.length > 0) bits.push(`actions: ${acc.buttons.join(", ")}`);
    lines.push(`[Interactive A2UI "${id}": ${bits.join(" | ") || "interactive controls"}]`);
  }

  return lines.join(" ");
}
