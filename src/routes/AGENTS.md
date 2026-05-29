<!-- Created: 2026-05-26 06:16 -->

# AGENTS.md - Routes and UI

Svelte routes are presentation and interaction layers. Keep business logic in application/core.

## UI Rules

- Read `DESIGN.md` before visible UI changes. The selected direction is Serial Story Studio:
  colorful, tactile story artifacts with conventional controls and accessible flow.
- Do not generate creative strategy directly in components.
- Do not hide AI/provider failures.
- Show unavailable AI states clearly.
- Keep user input visible and preserved during errors.
- Use dense workbench UI rather than landing-page marketing.
- Make controls operational, not decorative.

## Error States

The UI must distinguish:

- validation errors;
- AI provider unavailable;
- provider timeout;
- partial AI council completion;
- research data stale or unavailable;
- browser/client failure.

## Browser Verification

After UI changes:

1. Start dev server: `npm run dev -- --host 127.0.0.1 --port 5173`
2. Run `npm run test:browser`
3. Confirm meaningful content, expected controls, no overlay, and no browser errors.
