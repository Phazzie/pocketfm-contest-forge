<!-- Created: 2026-05-29 04:42 -->

# DESIGN.md - Serial Story Studio

This file governs the production UI direction for `pocketfm-contest-forge`.
Agents working on UI must treat this as the design source of truth alongside
`AGENTS.md`.

## Selected Direction

Use the **Serial Story Studio** concept: a colorful, tactile, slightly
unconventional writing-room interface where generated strategy appears as
story artifacts instead of generic dashboard cards.

The app should feel like a professional room where writers pin, compare, judge,
and keep story materials. It should not feel like a marketing page, a fantasy
poster, or a generic analytics dashboard.

## Product Job

The UI helps a writer:

1. enter or revise a story seed;
2. run live Grok cold-open generation;
3. compare accepted and rejected story artifacts;
4. understand quality gates, provider provenance, and failure reasons;
5. track story promises, debts, payoff windows, and writer decisions.

The first screen must be the working product. Do not add a landing hero before
the tool.

## Personality

Quirky in language, artifacts, rhythm, and color.

Conventional in controls, accessibility, navigation, validation, and failure
handling.

The UI may invert or subvert common dashboard patterns, but it must not make
forms, buttons, loading states, or errors hard to understand.

## Visual Principles

- Treat story output as objects: cold-open cards, pinned debt notes, episode
  timeline strips, judge stamps, and keeper/rejection piles.
- Use color to organize meaning, not decoration.
- Prefer a writer-room board over a metric dashboard.
- Keep controls recognizable: inputs, selects, buttons, toggles, tabs, dialogs,
  and accordions should behave conventionally.
- Make state visible: locked, running, accepted, rejected, partial, stale, and
  unavailable states need distinct styling.
- Keep density purposeful. Writers should scan quickly without reading every
  word.
- Avoid nested card stacks. A story artifact can be a card; page sections
  should not become cards inside cards.
- Avoid decorative gradient blobs, orbs, stock-like atmosphere, and fantasy
  illustrations that do not reveal the actual product state.

## Color

Use a colorful studio palette with controlled contrast:

| Token       | Hex       | Use                                         |
| ----------- | --------- | ------------------------------------------- |
| `ink`       | `#191713` | Primary text and dark surfaces              |
| `paper`     | `#fff8ea` | Main warm canvas                            |
| `parchment` | `#f2e3bf` | Secondary artifact surfaces                 |
| `coral`     | `#e9543f` | Primary action, urgent rejection marks      |
| `teal`      | `#0f8f83` | Accepted/live success and stable provenance |
| `plum`      | `#6f3c7b` | Taboo/desire/story pressure accents         |
| `gold`      | `#d89b27` | Winner, keeper, selected artifact           |
| `blue`      | `#2f6fbb` | System metadata, provider, prompt version   |
| `ash`       | `#e7e0d2` | Borders, dividers, inactive tracks          |

Rules:

- Do not let the page become beige-only, purple-only, or dark-blue-only.
- Use coral, teal, plum, gold, and blue as meaning-coded accents.
- Error states use coral plus plain text. Success states use teal plus plain
  text. Winner/selected states use gold.
- Color cannot be the only indicator; pair it with text, icon, or shape.

## Typography

- Use a clean sans-serif for UI and controls.
- Use one expressive display treatment only for artifact titles or section
  names. It must stay readable.
- Body prose must be highly legible because the product evaluates writing.
- Do not use viewport-scaled type.
- Do not use negative letter spacing.
- Keep metadata compact and readable.

Suggested scale:

- Page title: 28-34px.
- Section title: 18-24px.
- Artifact title: 16-20px.
- Body: 14-16px.
- Metadata: 12-13px.

## Layout

Default desktop layout:

1. **Studio rail**: seed controls, contest lane, risk, mechanisms, live access.
2. **Story board**: cold-open variants, pilot timeline, debt ledger, keeper
   selection.
3. **Judge rail**: quality gates, provider provenance, module status, retry or
   failure explanation.

Mobile layout:

1. Seed.
2. Live Grok action.
3. Accepted cold opens.
4. Pilot timeline.
5. Debt ledger.
6. Quality/provenance.
7. Supporting contest material.

Use tabs or segmented controls on mobile instead of stacking every advanced
panel above the main result.

## Core Components

### Seed Panel

Purpose: edit the writer's input without taking over the screen.

Rules:

- Group fields into collapsible sections: Story, Contest, Runtime.
- Keep the live access code near the Grok action, not buried.
- Show validation inline and preserve user input on failure.

### Cold Open Board

Purpose: compare live Grok variants.

Rules:

- Each variant is a story artifact with text, first-minute question, audio note,
  rejection risk, and selection/winner state.
- Winner state must be obvious without relying only on color.
- Rejection notes should feel like judge marks, not generic error banners.

### Pilot Timeline

Purpose: show how the first episode moves by minute.

Rules:

- Use a horizontal timeline on desktop and vertical timeline on mobile.
- Every beat shows minute, function, beat text, and unresolved question.
- The timeline should make drop-off risk and curiosity movement visible.

### Debt Ledger

Purpose: track promises and payoff windows.

Rules:

- Open, paid, and stale debts must be visibly different.
- Payoff window is required whenever available.
- Use pinned-note styling lightly; do not make it messy.

### Quality Gate Panel

Purpose: explain what passed or failed.

Rules:

- Show status, issue code, human explanation, and next action.
- AI failure must not be hidden behind a generic error.
- Do not show heuristic output as a replacement for failed live AI.

### Provenance Strip

Purpose: make live AI auditable.

Rules:

- Always show provider, model, prompt version, generation mode, latency, and
  repair attempts when available.
- Keep it compact and legible.
- Use blue/teal accents for system metadata.

## Interaction Rules

- Primary action: "Run Grok cold open".
- Secondary actions: edit seed, compare variants, inspect gate, copy/export
  later.
- Loading state should show the live module being run and preserve the current
  seed.
- Failure state should preserve input, show failure reason, and allow retry.
- Do not auto-overwrite accepted writer choices.
- Do not generate creative strategy in Svelte components.

## AI And Failure Rules

- Live creative generation must be AI-first and fail closed.
- Fixture/demo output can exist only when clearly labeled as fixture/demo.
- If live AI fails, show a clear failed state and preserve the draft.
- Do not substitute deterministic or heuristic prose for a failed live run.
- Quality-gate rejection is a product event, not a UI embarrassment. Make it
  visible and useful.

## Accessibility And Responsiveness

- Meet WCAG 2.2 AA intent for contrast, focus, target size, and keyboard use.
- All controls need visible labels.
- Focus states must be obvious on dark and light surfaces.
- Touch targets should be at least 44px where practical.
- Text must not overflow buttons, cards, notes, or timeline items.
- Mobile must be designed, not just collapsed desktop.

## Agent Workflow For UI Work

Before changing UI:

1. Read `AGENTS.md`, `src/routes/AGENTS.md`, and this file.
2. Identify the target component and state coverage.
3. Update or add component tests when behavior changes.
4. Run `npm run verify`.
5. For visible UI changes, run browser smoke and capture desktop/mobile
   screenshots before handoff.

Acceptance checks:

- The screen looks like a working app, not a landing page.
- The primary Grok action is easy to find.
- Live success, live failure, fixture/demo, and locked states are visually
  distinct.
- No story artifact, button, or form field has clipped text.
- No nested card soup.
- No decorative element competes with the story output.
