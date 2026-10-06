/**
 * Site-wide settings. Edit this file to change the company details,
 * contact email and social links shown across the site.
 */

// The live domain comes from an environment variable so it can change
// without touching code. See .env.example.
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const site = {
  name: "The Systems Design Lab",
  shortName: "TSDL",
  tagline: "Complex workflows, made simple.",
  description:
    "Publish to YouTube straight from your Notion content calendar. Map your fields once, change a status, and the video uploads itself.",
  url: siteUrl,
  email: "hello@example.com", // TODO: replace once the domain is set up
  replyTime: "two business days", // TODO: confirm
} as const;

export type Platform = "YouTube" | "TikTok" | "Instagram" | "LinkedIn";

/** Your channel/profile links. Replace "#" with the real URLs. */
export const socials: { platform: Platform; href: string }[] = [
  { platform: "YouTube", href: "#" },
  { platform: "TikTok", href: "#" },
  { platform: "Instagram", href: "#" },
  { platform: "LinkedIn", href: "#" },
];

export const mainNav = [
  { href: "/products", label: "Products" },
  { href: "/videos", label: "Videos" },
  { href: "/about", label: "About us" },
  { href: "/contact", label: "Contact" },
] as const;
