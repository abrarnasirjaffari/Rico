import type { CDPSession, Page } from "playwright";
import type { KeyDispatchPayload } from "./types";

interface KeyMetadata {
  keyCode: number;
  code: string;
  text?: string;
}

const SPECIAL_KEY_MAP: Record<string, KeyMetadata> = {
  Backspace: { keyCode: 8, code: "Backspace" },
  Tab: { keyCode: 9, code: "Tab" },
  Enter: { keyCode: 13, code: "Enter", text: "\r" },
  Shift: { keyCode: 16, code: "ShiftLeft" },
  Control: { keyCode: 17, code: "ControlLeft" },
  Alt: { keyCode: 18, code: "AltLeft" },
  Escape: { keyCode: 27, code: "Escape" },
  " ": { keyCode: 32, code: "Space", text: " " },
  Space: { keyCode: 32, code: "Space", text: " " },
  PageUp: { keyCode: 33, code: "PageUp" },
  PageDown: { keyCode: 34, code: "PageDown" },
  End: { keyCode: 35, code: "End" },
  Home: { keyCode: 36, code: "Home" },
  ArrowLeft: { keyCode: 37, code: "ArrowLeft" },
  ArrowUp: { keyCode: 38, code: "ArrowUp" },
  ArrowRight: { keyCode: 39, code: "ArrowRight" },
  ArrowDown: { keyCode: 40, code: "ArrowDown" },
  Delete: { keyCode: 46, code: "Delete" },
};

export function computeModifierBitmask(
  modifiers?: KeyDispatchPayload["modifiers"]
): number {
  if (!modifiers) return 0;
  let mask = 0;
  if (modifiers.alt) mask |= 1;
  if (modifiers.ctrl) mask |= 2;
  if (modifiers.meta) mask |= 4;
  if (modifiers.shift) mask |= 8;
  return mask;
}

export function resolveVirtualKeyCode(payload: KeyDispatchPayload): KeyMetadata {
  if (SPECIAL_KEY_MAP[payload.key]) {
    const spec = SPECIAL_KEY_MAP[payload.key];
    return {
      keyCode: payload.keyCode || spec.keyCode,
      code: payload.code || spec.code,
      text: payload.text ?? spec.text,
    };
  }

  if (payload.key.length === 1) {
    const ch = payload.key;
    const upper = ch.toUpperCase();
    const charCode = upper.charCodeAt(0);
    let inferredCode = payload.code || "";
    if (!inferredCode) {
      if (charCode >= 65 && charCode <= 90) {
        inferredCode = `Key${upper}`;
      } else if (charCode >= 48 && charCode <= 57) {
        inferredCode = `Digit${ch}`;
      } else {
        inferredCode = "Unidentified";
      }
    }
    return {
      keyCode: payload.keyCode || charCode,
      code: inferredCode,
      text: payload.text ?? ch,
    };
  }

  return {
    keyCode: payload.keyCode || 0,
    code: payload.code || payload.key,
    text: payload.text,
  };
}

/**
 * Dispatches full CDP Input.dispatchKeyEvent (keyDown + printable char, or keyUp)
 * with accurate windowsVirtualKeyCode & modifier bitmask for live pair-browsing parity.
 */
export async function dispatchCdpKeyEvent(
  page: Page,
  cdp: CDPSession | null,
  payload: KeyDispatchPayload
): Promise<void> {
  const meta = resolveVirtualKeyCode(payload);
  const modifiers = computeModifierBitmask(payload.modifiers);
  const hasCommandMod = Boolean(payload.modifiers?.ctrl || payload.modifiers?.meta || payload.modifiers?.alt);

  let session = cdp;
  let ephemeral = false;
  try {
    if (!session) {
      session = await page.context().newCDPSession(page);
      ephemeral = true;
    }

    if (payload.eventType === "keyDown") {
      await session.send("Input.dispatchKeyEvent", {
        type: meta.text && !hasCommandMod ? "rawKeyDown" : "keyDown",
        key: payload.key,
        code: meta.code,
        windowsVirtualKeyCode: meta.keyCode,
        nativeVirtualKeyCode: meta.keyCode,
        modifiers,
      });

      if (meta.text && !hasCommandMod) {
        await session.send("Input.dispatchKeyEvent", {
          type: "char",
          key: payload.key,
          code: meta.code,
          text: meta.text,
          unmodifiedText: meta.text,
          windowsVirtualKeyCode: meta.keyCode,
          nativeVirtualKeyCode: meta.keyCode,
          modifiers,
        });
      }
    } else {
      await session.send("Input.dispatchKeyEvent", {
        type: "keyUp",
        key: payload.key,
        code: meta.code,
        windowsVirtualKeyCode: meta.keyCode,
        nativeVirtualKeyCode: meta.keyCode,
        modifiers,
      });
    }
  } finally {
    if (ephemeral && session) {
      await session.detach().catch(() => {});
    }
  }
}

/**
 * Dispatches CDP Input.dispatchMouseEvent (type: "mouseMoved") for live CSS :hover / menu triggers.
 */
export async function dispatchCdpMouseMove(
  page: Page,
  cdp: CDPSession | null,
  x: number,
  y: number,
  modifiers: number = 0
): Promise<void> {
  let session = cdp;
  let ephemeral = false;
  try {
    if (!session) {
      session = await page.context().newCDPSession(page);
      ephemeral = true;
    }
    await session.send("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x: Math.round(x),
      y: Math.round(y),
      modifiers,
      button: "none",
    });
  } catch {
    await page.mouse.move(Math.round(x), Math.round(y)).catch(() => {});
  } finally {
    if (ephemeral && session) {
      await session.detach().catch(() => {});
    }
  }
}
