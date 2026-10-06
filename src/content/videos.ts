import type { Platform } from "./site";

/**
 * Social videos. Each card links out to the video on its platform.
 *
 * SAMPLE DATA: replace with your real videos. For YouTube, add `youtubeId`
 * (the part after "v=" or after "youtu.be/") and the site will show the real
 * thumbnail and, for the featured video, an embedded player.
 */

export type Video = {
  slug: string;
  title: string;
  platform: Platform;
  /** Full link to the video on its platform. "#" until you have it. */
  url: string;
  topic: string;
  summary?: string;
  youtubeId?: string;
  featured?: boolean;
  tint: string;
  squares: [string, string];
};

export const videos: Video[] = [
  {
    slug: "notion-content-calendar",
    title: "Build a Notion content calendar in 15 minutes",
    platform: "YouTube",
    url: "#",
    topic: "Content planning",
    summary: "[One or two lines on what the viewer will learn.]",
    featured: true,
    tint: "var(--blue-soft)",
    squares: ["var(--blue)", "var(--cyan)"],
  },
  {
    slug: "status-workflow",
    title: "The status workflow that keeps videos moving",
    platform: "TikTok",
    url: "#",
    topic: "Workflow",
    tint: "var(--violet-soft)",
    squares: ["var(--violet)", "var(--magenta)"],
  },
  {
    slug: "stop-copy-pasting",
    title: "Stop copy-pasting YouTube descriptions",
    platform: "Instagram",
    url: "#",
    topic: "Publishing",
    tint: "var(--cloud)",
    squares: ["var(--orange)", "var(--yellow)"],
  },
  {
    slug: "batch-uploads",
    title: "Batch a month of uploads in one afternoon",
    platform: "LinkedIn",
    url: "#",
    topic: "Planning",
    tint: "var(--blue-soft)",
    squares: ["var(--cyan)", "var(--violet)"],
  },
  {
    slug: "map-notion-to-youtube",
    title: "Map Notion properties to YouTube fields",
    platform: "YouTube",
    url: "#",
    topic: "Setup",
    tint: "var(--violet-soft)",
    squares: ["var(--magenta)", "var(--coral)"],
  },
  {
    slug: "one-source-of-truth",
    title: "Titles, tags and thumbnails in one place",
    platform: "TikTok",
    url: "#",
    topic: "Publishing",
    tint: "var(--cloud)",
    squares: ["var(--blue)", "var(--cyan)"],
  },
  {
    slug: "month-of-content",
    title: "Plan a month of content in an hour",
    platform: "Instagram",
    url: "#",
    topic: "Content planning",
    tint: "var(--blue-soft)",
    squares: ["var(--orange)", "var(--violet)"],
  },
  {
    slug: "hand-off-editing",
    title: "Hand off editing without losing track",
    platform: "LinkedIn",
    url: "#",
    topic: "Collaboration",
    tint: "var(--violet-soft)",
    squares: ["var(--cyan)", "var(--yellow)"],
  },
];

export const featuredVideo = videos.find((v) => v.featured) ?? videos[0];
