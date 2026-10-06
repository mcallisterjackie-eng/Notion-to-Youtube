/**
 * Copy for the Notion to YouTube product. Edit here to change the landing page.
 */

export const product = {
  name: "Notion to YouTube", // TODO: replace with the product's final name
  status: "Early access",
  headline: "Publish to YouTube straight from Notion.",
  lead:
    "Connect the content calendar you already plan in, map its fields to YouTube once, and pick a status. When a video moves to Ready to Upload, it goes up to YouTube on its own.",
};

/** The manual routine the product replaces. */
export const oldWay = [
  "Download the final cut from wherever it lives",
  "Copy the title and description out of Notion",
  "Paste in the tags, one at a time",
  "Set the visibility and the schedule",
  "Go back to Notion and update the status",
];

export const steps = [
  { title: "Connect Notion and YouTube", body: "Sign in to both and choose the content calendar database you already plan in." },
  { title: "Map your fields once", body: "Match your Notion properties to YouTube’s upload fields. Your calendar stays exactly as it is." },
  { title: "Change the status", body: "Move a video to Ready to Upload, or any status you pick, and it uploads to YouTube automatically." },
];

export const mappingPoints = [
  "Works with the content calendar you already have. No rebuild.",
  "Map any Notion property to title, description, tags, visibility and schedule.",
  "You choose which status starts the upload.",
  "Shared calendar? Only pages marked for YouTube are uploaded.",
];

/** Example mapping shown in the illustration. Property names are examples. */
export const mappings = [
  { from: "Name", type: "Title", to: "Title" },
  { from: "Script summary", type: "Text", to: "Description" },
  { from: "Keywords", type: "Multi-select", to: "Tags" },
  { from: "Final cut", type: "URL", to: "Video file" },
  { from: "Publish date", type: "Date", to: "Scheduled time" },
];

/** Example rows for the hero's content-calendar illustration. */
export const calendarRows = [
  { title: "Studio tour: behind the scenes", date: "Oct 14", status: "Editing", ready: false },
  { title: "5 Notion tips for creators", date: "Oct 16", status: "Ready to Upload", ready: true },
  { title: "Q&A livestream recap", date: "Oct 21", status: "Scripting", ready: false },
];

// Answers in [brackets] are placeholders to confirm before launch.
export const faqs = [
  { q: "Do I need to change my content calendar?", a: "No. You connect the database you already use and map its existing properties to YouTube’s fields." },
  { q: "Which status starts the upload?", a: "Any one you choose. Ready to Upload is the default, but you can pick whichever status fits your workflow." },
  { q: "I plan Instagram and TikTok in the same calendar. Will those upload too?", a: "No. Point it at the property that says where a post is going, like a Platform column, and only pages marked YouTube are uploaded. Everything else is ignored." },
  { q: "Where does the video file come from?", a: "Your Google Drive. Put the video’s Google Drive link in a URL property on the Notion page. The video stays in your Drive; we never store it." },
  { q: "What does it cost?", a: "$12 a month for one user, with one Notion workspace, one YouTube channel and up to 100 videos a month. Cancel anytime." },
  { q: "Is my Notion and YouTube data safe?", a: "[Explain the access you request, what you store, and how people can disconnect at any time.]" },
];
