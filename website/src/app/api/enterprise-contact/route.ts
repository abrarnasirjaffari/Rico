import { NextResponse } from "next/server";

interface EnterpriseContactPayload {
  name?: string;
  email?: string;
  company?: string;
  teamSize?: string;
  message?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as EnterpriseContactPayload;

    const name = (body.name ?? "").trim();
    const email = (body.email ?? "").trim();
    const company = (body.company ?? "").trim();
    const teamSize = (body.teamSize ?? "10–50").trim();
    const message = (body.message ?? "").trim();

    const fieldErrors: Record<string, string> = {};

    if (name.length < 2) {
      fieldErrors.name = "Enter your full name.";
    }
    if (!EMAIL_PATTERN.test(email)) {
      fieldErrors.email = "Enter a valid work email (for example, alex@company.com).";
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

    console.info("[enterprise-contact] Received inquiry", {
      inquiryId,
      name,
      email,
      company,
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
        error: "Unable to submit your inquiry right now. Please try again or email licensing@rico.app.",
      },
      { status: 400 }
    );
  }
}
