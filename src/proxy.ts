import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Every path except static files, images and the API routes (which check auth themselves when they need it).
    "/((?!_next/static|_next/image|api/|favicon.ico|robots.txt|sitemap.xml|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
