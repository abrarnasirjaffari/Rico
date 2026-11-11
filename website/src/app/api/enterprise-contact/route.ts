import { NextResponse } from "next/server";

interface EnterpriseContactPayload {
  name?: unknown;
  email?: unknown;
  company?: unknown;
  teamSize?: unknown;
  message?: unknown;
}

/** Linear-time O(n) email format check with strict RFC length bounds (avoids ReDoS). */
function isValidEmail(raw: string): boolean {
  if (raw.length < 5 || raw.length > 254) return false;
  for (let i = 0; i < raw.length; i++) {
    const code = raw.charCodeAt(i);
    if (code <= 32 || code === 127) return false;
  }
  const atIndex = raw.indexOf("@");
  if (atIndex <= 0 || atIndex !== raw.lastIndexOf("@") || atIndex > 64) {
    return false;
  }
  const domain = raw.slice(atIndex + 1);
  if (domain.length < 3 || domain.startsWith(".") || domain.endsWith(".")) {
    return false;
  }
  const dotIndex = domain.indexOf(".");
  if (dotIndex <= 0 || domain.includes("..")) {
    return false;
  }
  return true;
}

function toSafeString(value: unknown, maxLen: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLen);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as EnterpriseContactPayload;

    const name = toSafeString(body.name, 120);
    const email = toSafeString(body.email, 254);
    const company = toSafeString(body.company, 160);
    const teamSize = toSafeString(body.teamSize, 32) || "10–50";
    const message = toSafeString(body.message, 2000);

    const fieldErrors: Record<string, string> = {};

    if (name.length < 2) {
      fieldErrors.name = "Enter your full name.";
    }
    if (!isValidEmail(email)) {
      fieldErrors.email =
        "Enter a valid work email (for example, alex@company.com).";
    }
    if (company.length < 2) {
      fieldErrors.company = "Enter your company or organization name.";
    }
    if (message.length < 8) {
      fieldErrors.message = "Share a few details about how we can help.";
    }

    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "Please check the highlighted fields and try again.",
          fieldErrors,
        },
        { status: 400 }
      );
    }

    const inquiryId = `ent_${Date.now().toString(36)}`;

    console.info("[enterprise-contact] Inquiry recorded", {
      inquiryId,
      teamSize,
      receivedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      inquiryId,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Unable to submit your inquiry right now. Please try again or email licensing@rico.app.",
      },
      { status: 400 }
    );
  }
}
