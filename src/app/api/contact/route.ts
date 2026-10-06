import { NextResponse } from "next/server";
import { cleanText, isEmail } from "@/lib/validate";

/**
 * Receives the contact form.
 * TODO: send the message somewhere. Common options on Vercel: Resend
 * (resend.com), Postmark, or a form service. Until then, messages are only
 * written to the server log (visible in Vercel under Logs).
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  // Honeypot field: real people never fill it in.
  if (cleanText(body.website, 200)) return NextResponse.json({ ok: true });

  const name = cleanText(body.name, 200);
  const email = body.email;
  const topic = cleanText(body.topic, 200);
  const message = cleanText(body.message, 5000);

  if (!name || !isEmail(email) || !message) {
    return NextResponse.json({ ok: false, error: "Name, a valid email and a message are required" }, { status: 400 });
  }

  console.log("[contact]", { name, email, topic, length: message.length });

  return NextResponse.json({ ok: true });
}
