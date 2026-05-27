# Pocket FM Contest Forge

A SvelteKit writing lab for designing Pocket FM contest submissions with hexagonal architecture and contract/test driven development.

The app treats contest writing as a retention system: first-minute grip, cliffhanger pull, binge debt, audio mouthfeel, trope mutation, and repeatable serial DNA.

## Architecture

- `src/lib/core/contracts`: seam contracts, validation, and `ForgeRequest -> ForgePlan`
- `src/lib/core/domain`: contest research, mechanisms, and scoring
- `src/lib/core/story-state`: in-memory story bible and continuity contracts
- `src/lib/story-modules`: runtime-schema-backed story modules
- `src/lib/core/ports`: replaceable boundaries for research and story intelligence
- `src/lib/application`: use cases
- `src/lib/adapters`: deterministic local adapters
- `src/routes`: SvelteKit presentation

See `docs/ARCHITECTURE.md`, `docs/RESEARCH.md`, and `docs/SELF_REVIEW.md`.

## Commands

```sh
npm install
npm run dev -- --host 127.0.0.1 --port 5173
npm run lint
npm run test
npm run check
npm run build
npm run test:browser
npm run verify:ui
npm run scaffold:module -- --id villain-protagonist-engine --category archetype
npm run hooks:install
```

`npm run test:browser` expects the dev server to be running and verifies page content, key controls, error overlays, and browser console errors.
`npm run verify:ui` starts the dev server on an available local port and runs the same browser smoke check.

## Current AI Shape

The current app runs in fixture-demo mode so tests are stable and the UI can be inspected without credentials. Story modules own runtime schemas, prompt versions, quality gates, provenance, and tracking events.

Live AI mode intentionally fails closed until a provider adapter exists. A live Gemini, Claude, Grok, OpenAI, or provider-router adapter can implement the existing ports and module execution boundary without reshaping the UI contract.
