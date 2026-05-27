<!-- Created: 2026-05-26 06:16 -->

# AGENTS.md - Scripts

Scripts should make verification repeatable and boring.

## Rules

- Scripts must be deterministic.
- Scripts must exit nonzero on failure.
- Scripts must not mutate user data unless their name clearly says so.
- Browser scripts must report content, controls, overlays, and console/page errors.
- Prefer small Node scripts for cross-platform checks over shell-only workflows.

## Expected Commands

- `npm run verify`: core static and build gates
- `npm run test:browser`: browser smoke test against a running dev server
