import type { ReactNode } from "react";

/**
 * Groups one idea on a surface panel. `raised` for use on a surface section;
 * `accent` adds the gradient bar (one card per view, the featured one).
 */
export function Card({
  eyebrow,
  title,
  raised,
  accent,
  footer,
  className,
  children,
}: {
  eyebrow?: string;
  title?: ReactNode;
  raised?: boolean;
  accent?: boolean;
  footer?: ReactNode;
  className?: string;
  children?: ReactNode;
}) {
  const cls = ["sdl-card", raised && "sdl-card-raised", accent && "sdl-card-accent", className].filter(Boolean).join(" ");
  return (
    <div className={cls}>
      {eyebrow ? <p className="sdl-card-eyebrow">{eyebrow.toUpperCase()}</p> : null}
      {title ? <h3 className="sdl-card-title">{title}</h3> : null}
      {typeof children === "string" ? <p className="sdl-card-body">{children}</p> : children}
      {footer ? <div className="sdl-card-footer">{footer}</div> : null}
    </div>
  );
}
