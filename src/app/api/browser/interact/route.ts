import { NextResponse } from "next/server";
import { browserTabPool, screencastManager, type KeyDispatchPayload } from "@/lib/browser";
import { posthogServer } from "@/lib/telemetry/posthog-server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    success: true,
    takeoverState: screencastManager.getTakeoverState(),
    status: screencastManager.getStatus(),
    pool: browserTabPool.listTabs(),
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      action,
      x,
      y,
      deltaX,
      deltaY,
      text,
      isActive,
      reason,
      challengeTitle,
      tabId,
      eventType,
      key,
      code,
      keyCode,
      modifiers,
      decision,
    } = body;

    // Action 1: Direct Human Canvas Click
    if (action === "click" && typeof x === "number" && typeof y === "number") {
      await screencastManager.handleHumanClick(x, y);
      return NextResponse.json({
        success: true,
        action: "click",
        coordinates: { x, y },
      });
    }

    // Action 1a: Live Mouse Hover (CDP Input.dispatchMouseEvent mouseMoved)
    if (action === "mouse_move" && typeof x === "number" && typeof y === "number") {
      const modMask = typeof modifiers === "number" ? modifiers : 0;
      const hoveredElement = browserTabPool.getFocusedTabId()
        ? await browserTabPool.dispatchMouseMove(x, y, modMask, tabId)
        : (await screencastManager.handleHumanMouseMove(x, y, modMask), null);

      return NextResponse.json({
        success: true,
        action: "mouse_move",
        hoveredElement,
      });
    }

    // Action 1b: Direct Human Wheel Scroll
    if (action === "scroll") {
      await screencastManager.handleHumanScroll(
        typeof deltaX === "number" ? deltaX : 0,
        typeof deltaY === "number" ? deltaY : 320
      );
      return NextResponse.json({
        success: true,
        action: "scroll",
      });
    }

    // Action 1c: Browser Back / Forward History (real CDP Page.getNavigationHistory)
    if (action === "back") {
      if (browserTabPool.getFocusedTabId()) {
        const info = await browserTabPool.goBack(tabId);
        return NextResponse.json({ success: true, action: "back", tab: info });
      }
      await screencastManager.handleHumanBack();
      return NextResponse.json({ success: true, action: "back" });
    }
    if (action === "forward") {
      if (browserTabPool.getFocusedTabId()) {
        const info = await browserTabPool.goForward(tabId);
        return NextResponse.json({ success: true, action: "forward", tab: info });
      }
      await screencastManager.handleHumanForward();
      return NextResponse.json({ success: true, action: "forward" });
    }

    // Action 2: Full CDP Keyboard Dispatch (keyDown / char / keyUp + windowsVirtualKeyCode)
    if (
      action === "key_event" &&
      (eventType === "keyDown" || eventType === "keyUp") &&
      typeof key === "string"
    ) {
      const payload: KeyDispatchPayload = {
        eventType,
        key,
        code: typeof code === "string" ? code : undefined,
        text: typeof text === "string" ? text : undefined,
        keyCode: typeof keyCode === "number" ? keyCode : undefined,
        modifiers:
          modifiers && typeof modifiers === "object"
            ? {
                alt: Boolean(modifiers.alt),
                ctrl: Boolean(modifiers.ctrl),
                meta: Boolean(modifiers.meta),
                shift: Boolean(modifiers.shift),
              }
            : undefined,
      };

      if (browserTabPool.getFocusedTabId()) {
        await browserTabPool.dispatchKeyEvent(payload, tabId);
      } else {
        await screencastManager.handleHumanKeyEvent(payload);
      }

      return NextResponse.json({
        success: true,
        action: "key_event",
        eventType,
      });
    }

    // Action 2b: Direct Human Keyboard Typing
    if (action === "type" && typeof text === "string") {
      await screencastManager.handleHumanType(text);
      return NextResponse.json({
        success: true,
        action: "type",
      });
    }

    // Action 3: Engage or Disengage Human Takeover Mode
    if (action === "set_takeover") {
      const state = {
        isActive: !!isActive,
        reason: reason || "MANUAL_TAKEOVER",
        challengeTitle: challengeTitle || "Live Human Takeover",
        startedAt: isActive ? Date.now() : undefined,
      };

      screencastManager.setTakeoverState(state);

      posthogServer.capture({
        distinctId: "server-agent",
        event: isActive ? "human_takeover_engaged" : "human_takeover_resolved",
        properties: {
          reason: state.reason,
          challenge_title: state.challengeTitle,
          timestamp: new Date().toISOString(),
        },
      });

      return NextResponse.json({
        success: true,
        takeoverState: state,
      });
    }

    // Action 4: Zephium Help-the-Agent Wall Decision (Continue / Skip / +90s)
    if (
      action === "wall_decision" &&
      (decision === "continue" || decision === "skip" || decision === "extend_90s")
    ) {
      const wall = await browserTabPool.resolveWall(decision, tabId);
      return NextResponse.json({
        success: true,
        decision,
        wall,
      });
    }

    // Action 5: Challenge Solved by Human (CAPTCHA / 2FA)
    if (action === "solve_challenge") {
      await browserTabPool.resolveWall("continue", tabId);
      screencastManager.setTakeoverState({
        isActive: false,
        isSolved: true,
        reason: reason || "CAPTCHA_CHALLENGE",
      });

      posthogServer.capture({
        distinctId: "server-agent",
        event: "human_takeover_resolved",
        properties: {
          resolution: "CHALLENGE_SOLVED_BY_HUMAN",
          resumed_agent: "Rico Autonomous Agent",
          timestamp: new Date().toISOString(),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Challenge resolved. Control returned to autonomous Rico agent.",
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action or parameters" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Takeover interaction error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Interaction failed",
      },
      { status: 500 }
    );
  }
}
