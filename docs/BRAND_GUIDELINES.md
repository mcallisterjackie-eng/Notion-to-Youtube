# Brand guidelines

**Source of truth:** the design system **"The Systems Design Lab"** in Claude Artifacts
(<https://claude.ai/artifact/PLj9wGiDKBcTZk8qiRg9MF>), built from TSDL Brand Guidelines v1.0.
If anything here disagrees with that design system, the design system wins.

In code, the design system lives in:

- `src/styles/tokens.css`: every colour, type, spacing, radius, shadow and gradient token, with the same names and values as the design system's `tokens.json`
- `src/styles/sdl.css` + `src/components/ui/`: Button, Badge, Card, Input, Progress

## Rules every screen follows

- **Colour:** build UI from semantic tokens (`canvas`, `surface`, `ink`, `ink-muted`, `line`, `link`). Blue *text* is always `link`; `blue` is for fills. One spectrum colour carries emphasis per component.
- **Signature gradient:** at most one strong gradient element per view, and never behind text.
- **Type:** Montserrat (600–900) for headings only, Inter (400–600) for body and UI. Never paragraphs in Montserrat. Button labels use the `button` style (16px semibold) so white on blue passes contrast.
- **Case:** sentence case for headings, buttons and UI. **Project decision:** the dashboard navigation panel uses Title Case ("My Profile", "Field Mapping").
- **Spacing:** 8px grid with a 4px half-step; cards padded `space-6`; generous whitespace.
- **Corners:** `radius-sm` badges, `radius-md` buttons and inputs, `radius-lg` cards and panels, `radius-full` pills.
- **Focus:** every interactive element shows `focus-ring`.
- **Logo:** use the supplied files only (`public/brand/`). Full wordmark for introductions, flask icon for small placements. Never redraw, recolour or stretch.
- **Icons:** simple outlined icons, rounded caps and joins, `ink` / `ink-muted`; `blue` only for the active item. No emoji.
- **Voice:** clear, direct, practical, outcome first. No jargon, no hype.
- **Theme:** **light only** for now (project decision). Dark tokens exist in `tokens.css` but stay unused until a reversed logo is supplied.

## Product-specific rule (Design Spec §9)

Customers never see raw YouTube API names (`snippet.title`, `status.privacyStatus`…).
The UI always says "Video Title", "Visibility", "Made for Kids" and so on.
