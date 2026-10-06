"use client";

import { ErrorState } from "@/components/app/ErrorState";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="container">
      <ErrorState error={error} reset={reset} />
    </main>
  );
}
