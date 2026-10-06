# Front-end spec

**Source:** the supplied `tsdl-site` front-end design (imported unchanged in the
repository's first commit, "Import TSDL front-end design files and project specs").
It defines page structure, layouts and interactions for the marketing site, the
sign-in pages and the dashboard.

Some pages and elements will be redone as the SaaS is built, to match
`DESIGN_SPEC.md`. Every deviation from the supplied design is listed here.

## Decisions and deviations

| Phase | Change | Reason |
| --- | --- | --- |
| 1 | Price $10 → **$12/month, up to 100 videos/month** | Design Spec §18 (owner may amend before launch) |
| 1 | **Thumbnail** removed from mapping, plan features and marketing copy | Not in the Design Spec's YouTube fields (§10); owner decision |
| 1 | Marketing FAQ "Where does the video file come from?" answered: Google Drive link | Design Spec §4 (was a placeholder) |
| 1 | Mapping illustration: video file property type Files → URL | Design Spec §4, §6 |
| 1 | **Analytics** kept as a *basic* page: past uploads and their status (success/error). No audience/performance analytics | Owner decision; Design Spec §26 excludes advanced analytics |
| 1 | Navigation panel kept as designed, labels in Title Case | Owner decision |
| 1 | Light theme only | Owner decision |
| 1 | "Continue with Google" on log in and sign up | Owner decision |
| 1 | Sample-data banner on every dashboard page | Dashboard numbers are placeholders until later phases |
| 1 | Grids and table scroll areas fixed so no page scrolls sideways on phones | Bug found by the Phase 1 browser tests |
