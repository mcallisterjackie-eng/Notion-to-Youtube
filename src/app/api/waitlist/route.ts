import { NextResponse } from "next/server";
import { isEmail } from "@/lib/validate";

/**
 * Adds an email to the SaaS waitlist.
 * TODO: connect a list provider (ConvertKit/Kit, Mailchimp, Beehiiv, Resend
 * Audiences) or a database. Until then, sign-ups are only written to the
 * server log.
 */
export async function POST(request: Request) {
  let body: { email?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  if (!isEmail(body.email)) {
    return NextResponse.json({ ok: false, error: "A valid email is required" }, { status: 400 });
  }

  console.log("[waitlist] new sign-up");

  return NextResponse.json({ ok: true });
}
