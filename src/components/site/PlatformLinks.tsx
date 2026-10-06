import { socials } from "@/content/site";

export function PlatformLinks() {
  return (
    <div className="row" style={{ gap: "var(--space-2)" }}>
      {socials.map((s) => (
        <a key={s.platform} className="pill" href={s.href} target="_blank" rel="noopener noreferrer">
          {s.platform}
        </a>
      ))}
    </div>
  );
}
