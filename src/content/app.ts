/**
 * Dashboard navigation, plan details and SAMPLE DATA for the logged-in app.
 * Everything under "Sample data" is placeholder content so the screens have
 * something to show. Replace it with real queries (Supabase, Stripe, Notion,
 * YouTube) when the backend is connected.
 */

export const appNav = [
  { href: "/dashboard", label: "Overview", icon: "home" },
  { href: "/dashboard/profile", label: "My Profile", icon: "user" },
  { href: "/dashboard/analytics", label: "Analytics", icon: "chart" },
  { href: "/dashboard/billing", label: "Billing", icon: "card" },
  { href: "/dashboard/connections", label: "Connections", icon: "plug" },
  { href: "/dashboard/field-mapping", label: "Field Mapping", icon: "map" },
] as const;

export type AppIcon = (typeof appNav)[number]["icon"];

/** The one plan offered at launch. Keep in sync with the Stripe price. */
export const plan = {
  name: "Monthly",
  price: "$12.00",
  priceShort: "$12",
  interval: "month",
  seats: "1 user",
  features: [
    "Connect one Notion workspace and one YouTube channel",
    "Up to 100 videos a month",
    "Map title, description, tags, visibility and schedule",
    "Automatic uploads when a status changes",
    "Upload history and analytics",
  ],
};

/* ------------------------------------------------------------------ */
/* Sample data                                                         */
/* ------------------------------------------------------------------ */

export const sampleUser = {
  name: "Jordan Lee",
  email: "jordan@example.com",
  initials: "JL",
  timezone: "America/Edmonton",
};

export type UploadStatus = "Uploaded" | "Scheduled" | "Failed";

export const sampleUploads: { title: string; status: UploadStatus; date: string; detail: string }[] = [
  { title: "5 Notion tips for creators", status: "Scheduled", date: "Oct 16, 9:00 AM", detail: "Goes live on YouTube at the scheduled time" },
  { title: "Studio tour: behind the scenes", status: "Uploaded", date: "Oct 4, 2:12 PM", detail: "Public" },
  { title: "Q&A livestream recap", status: "Failed", date: "Oct 3, 11:40 AM", detail: "Video file missing on the Notion page" },
  { title: "How I plan a month of videos", status: "Uploaded", date: "Sep 29, 8:05 AM", detail: "Public" },
  { title: "Editing workflow, start to finish", status: "Uploaded", date: "Sep 22, 10:30 AM", detail: "Unlisted" },
];

/** Uploads per week, oldest first. */
export const sampleWeekly = [
  { week: "Aug 18", uploads: 2 },
  { week: "Aug 25", uploads: 3 },
  { week: "Sep 1", uploads: 1 },
  { week: "Sep 8", uploads: 4 },
  { week: "Sep 15", uploads: 3 },
  { week: "Sep 22", uploads: 5 },
  { week: "Sep 29", uploads: 4 },
  { week: "Oct 6", uploads: 2 },
];

/**
 * The user's saved automation settings: what Field Mapping saves and the Overview's
 * Automation card reads. One source, so the two pages always agree.
 * TODO (Supabase): load this from the user's settings row instead.
 */
export type AutomationSettings = {
  databaseUrl: string; // the link the user pastes
  database: string; // the database name we read from Notion
  filter: { property: string; type: string; value: string } | null; // null = every page
  trigger: { property: string; value: string; doneValue: string; scheduledValue: string; failedValue: string }; // "" = leave unchanged
  mapping: Record<string, string>; // YouTube field id -> Notion property name ("" = not used)
  defaultPrivacy: "private" | "unlisted" | "public";
};

export const sampleAutomation: AutomationSettings = {
  databaseUrl: "https://www.notion.so/creatorstudio/Content-calendar-8f3a2c71d4e94b0b9a6e5f12c3d4e5f6",
  database: "Content calendar",
  filter: { property: "Platform", type: "Multi-select", value: "YouTube" },
  trigger: { property: "Status", value: "Ready to Upload", doneValue: "Published", scheduledValue: "Scheduled", failedValue: "Upload Failed" },
  mapping: {
    video: "Final cut",
    title: "Name",
    description: "Script summary",
    tags: "Keywords",
    publishAt: "Publish date",
    privacy: "Visibility",
  },
  defaultPrivacy: "private",
};

/** Plain-English version of the page filter, e.g. "Platform includes YouTube". */
export function describeFilter(f: AutomationSettings["filter"]) {
  if (!f) return "Every page in the database";
  if (f.type === "Checkbox") return `${f.property} is checked`;
  return `${f.property} ${f.type === "Multi-select" ? "includes" : "is"} ${f.value}`;
}

/** Whether setup was finished in an earlier session (hides the Overview's Setup card). */
export const sampleSetup = { completedBeforeThisSession: false };

export const sampleStats = {
  uploadedThisMonth: 6,
  scheduled: 2,
  needsAttention: 1,
};

export const sampleConnections = {
  notion: { connected: true, account: "Creator Studio workspace", database: "Content calendar", connectedOn: "Sep 12, 2026" },
  youtube: { connected: true, account: "Creator Studio channel", database: null as string | null, connectedOn: "Sep 12, 2026" },
};

export const sampleSubscription = {
  status: "active" as "active" | "none" | "past_due" | "canceled",
  renewsOn: "Nov 12, 2026",
  card: { brand: "Visa", last4: "4242", expires: "08/28" },
  invoices: [
    { date: "Oct 12, 2026", amount: "$12.00", status: "Paid" },
    { date: "Sep 12, 2026", amount: "$12.00", status: "Paid" },
  ],
};

/** Properties found in the connected Notion database (name + Notion type). */
export const sampleNotionProperties = [
  { name: "Name", type: "Title" },
  { name: "Script summary", type: "Text" },
  { name: "Keywords", type: "Multi-select" },
  { name: "Final cut", type: "Files" },
  { name: "Publish date", type: "Date" },
  { name: "Visibility", type: "Select" },
  { name: "Status", type: "Status" },
  { name: "Platform", type: "Multi-select" },
  { name: "Channel", type: "Select" },
  { name: "Post to YouTube", type: "Checkbox" },
];

/** Options inside the select / multi-select properties above (sample). */
export const sampleOptionValues: Record<string, string[]> = {
  Platform: ["YouTube", "Instagram", "TikTok", "LinkedIn"],
  Channel: ["YouTube", "Instagram", "Podcast"],
  Visibility: ["Public", "Unlisted", "Private"],
};

/** YouTube upload fields the user maps. `required` fields must be mapped to save. */
export const youtubeFields = [
  { id: "video", label: "Video file", hint: "The video to upload", required: true, accepts: ["Files", "URL"], default: "Final cut" },
  { id: "title", label: "Title", hint: "Up to 100 characters", required: true, accepts: ["Title", "Text"], default: "Name" },
  { id: "description", label: "Description", hint: "Up to 5,000 characters", required: false, accepts: ["Text"], default: "Script summary" },
  { id: "tags", label: "Tags", hint: "Each option becomes a tag", required: false, accepts: ["Multi-select", "Text"], default: "Keywords" },
  { id: "publishAt", label: "Scheduled time", hint: "Leave empty to publish on upload", required: false, accepts: ["Date"], default: "Publish date" },
  { id: "privacy", label: "Visibility", hint: "Public, unlisted or private", required: false, accepts: ["Select"], default: "Visibility" },
];

export const sampleStatusOptions = ["Idea", "Scripting", "Filming", "Editing", "Ready to Upload", "Scheduled", "Published", "Upload Failed"];
