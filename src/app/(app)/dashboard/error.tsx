"use client";

import { ErrorState } from "@/components/app/ErrorState";

/** Keeps the navigation panel on screen when one dashboard page fails. */
export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState error={error} reset={reset} homeHref="/dashboard" />;
}
