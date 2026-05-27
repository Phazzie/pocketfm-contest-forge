<!-- Created: 2026-05-26 06:16 -->

# AGENTS.md - Pocket FM Contest Forge

This file governs the SvelteKit app in `pocketfm-contest-forge`. Ignore the older Angular app unless the user explicitly asks to work there.

## Product Mission

Build an AI-native writing lab for Pocket FM-style contest submissions. The product must help writers create stronger serial audio concepts, pilot episodes, cliffhangers, payoff ledgers, and contest strategies.

The product is not a generic story generator and not a checklist app.

## Non-Negotiables

1. Live creative generation must be AI-first.
2. Heuristic or deterministic generation is allowed only for tests, fixtures, and clearly labeled demos.
3. Do not silently fall back to heuristic creative output when AI is unavailable.
4. If AI is unavailable, fail closed: preserve user input, explain what is unavailable, and offer retry or setup.
5. Contracts come before implementation for every new boundary.
6. The Svelte UI must not own domain rules.
7. Generated prose must pass the prose quality rubric in `docs/PROSE_QUALITY.md`.
8. Every meaningful product decision, lesson, or unresolved risk must be tracked in docs.

## Architecture

Use hexagonal architecture:

- `src/lib/core/contracts`: type contracts and validation
- `src/lib/core/domain`: pure domain rules and scoring
- `src/lib/core/ports`: interfaces for external behavior
- `src/lib/application`: use cases
- `src/lib/adapters`: AI, research, persistence, and provider implementations
- `src/routes`: SvelteKit UI and route loading
- `scripts`: repeatable local automation
- `docs`: operating memory for humans and agents

Dependency direction:

`routes -> application -> ports/contracts/domain`

Adapters implement ports and may depend on provider SDKs or network clients. Core and application must not import Svelte components.

## Contract/Test Driven Development

For any new feature:

1. Add or update the contract.
2. Add tests for the contract and use case behavior.
3. Implement the domain/application code.
4. Wire adapters and UI.
5. Run `npm run verify`.

If a feature crosses AI, research, persistence, or UI boundaries, add an explicit port or contract.

## Prose Quality Rule

Do not accept AI output just because it is well formatted. Good output must be specific, surprising, playable by voice, emotionally legible, and useful for a serial contest strategy.

Use `docs/PROSE_QUALITY.md` before promoting any AI-generated text into a user-facing recommendation.

## Required Tracking

Update docs when relevant:

- `docs/CHANGELOG.md`: user-visible or architectural changes
- `docs/LESSONS_LEARNED.md`: mistakes, corrections, product principles
- `docs/TRACKING.md`: open issues, review findings, risks, decisions to revisit
- `docs/AI_ORCHESTRATION.md`: provider, prompt, schema, or AI council changes

## Verification

Run `npm run verify` before handing off code. If UI changed, also start the dev server and run `npm run test:browser`.

Known current correction: the app should be refactored so the deterministic story intelligence adapter is not the main user-facing creative path.
