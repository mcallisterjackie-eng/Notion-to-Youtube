"use client";

import "@fontsource-variable/inter";
import "@fontsource-variable/montserrat";
import "./globals.css";
import { ErrorState } from "@/components/app/ErrorState";

/** Last resort: replaces the root layout when it fails, so it renders its own html and body. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main id="main" className="container">
          <ErrorState error={error} reset={reset} />
        </main>
      </body>
    </html>
  );
}
