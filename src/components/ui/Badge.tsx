import type { ReactNode } from "react";

/**
 * One or two words of status or category. Use one coloured badge per card.
 * neutral: plain status · action: live/actionable · product: product names, premium
 * highlight: momentum ("New") · attention: small cues ("Due soon")
 */
export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: "neutral" | "action" | "product" | "highlight" | "attention";
  className?: string;
  children: ReactNode;
}) {
  const cls = ["sdl-badge", tone !== "neutral" && `sdl-badge-${tone}`, className].filter(Boolean).join(" ");
  return <span className={cls}>{children}</span>;
}
