import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/**
 * The design system's Button.
 * - primary: one per view, for the thing the page is for.
 * - spectrum: the single gradient-ringed hero call to action on a marketing page.
 * - secondary (default): everything else.  - ghost: low-emphasis links.
 * Pass `href` to render a link. Labels: short, verb first, sentence case.
 */
type Variant = "primary" | "spectrum" | "secondary" | "ghost";

type BaseProps = {
  variant?: Variant;
  size?: "md" | "sm";
  className?: string;
  children: ReactNode;
};

type ButtonAsLink = BaseProps & { href: string } & Omit<ComponentProps<typeof Link>, "href" | "className" | "children">;
type ButtonAsButton = BaseProps & { href?: undefined } & Omit<ComponentProps<"button">, "className" | "children">;

export function Button(props: ButtonAsLink | ButtonAsButton) {
  const { variant = "secondary", size = "md", className, children } = props;
  const cls = ["sdl-btn", `sdl-btn-${variant}`, size === "sm" && "sdl-btn-sm", className].filter(Boolean).join(" ");

  if (props.href !== undefined) {
    const { variant: _v, size: _s, className: _c, children: _ch, href, ...rest } = props as ButtonAsLink;
    const external = /^https?:\/\//.test(href);
    if (external) {
      return (
        <a href={href} className={cls} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={cls} {...rest}>
        {children}
      </Link>
    );
  }

  const { variant: _v, size: _s, className: _c, children: _ch, href: _h, ...rest } = props as ButtonAsButton;
  return (
    <button type="button" className={cls} {...rest}>
      {children}
    </button>
  );
}
