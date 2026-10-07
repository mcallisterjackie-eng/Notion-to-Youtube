/**
 * Absolute URL for redirects inside the app. Uses the configured site address
 * (NEXT_PUBLIC_SITE_URL) rather than the incoming Host header, which proxies
 * can rewrite and attackers can spoof. Falls back to the request's own origin.
 */
export function appUrl(path: string, requestUrl: string): URL {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  return new URL(path, configured || requestUrl);
}
