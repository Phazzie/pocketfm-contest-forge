<!-- Created: 2026-05-26 06:16 -->

# Changelog

## Unreleased

- Added the runtime-schema-backed Story Module Platform with Zod contracts, module registry, module runner, provenance, statuses, issues, and tracking events.
- Converted `cold-open-lab`, `cliffhanger-futures`, `binge-debt-ledger`, and `trope-mutation-lab` into first-class modules with owned contracts, prompts, fixtures, tests, and README files.
- Added story-state contracts for protagonist, antagonist, supporting cast, desire/taboo, secrets, mechanics, episode history, debt ledgers, continuity facts, writer decisions, and accepted/rejected AI suggestions.
- Added `npm run scaffold:module` for generating new story module folders and tests.
- Added guard scripts for repo hygiene, registered module shape, live-mode fallback prevention, docs drift, and one-command UI verification.
- Added installable git hook templates for pre-commit and pre-push checks.
- Added GitHub Actions CI for `npm run verify` and UI smoke verification.
- Added stricter TypeScript and ESLint quality gates with documented escape-hatch enforcement.
- Hardened quality guard scripts so they do not count their own diagnostic strings as violations.
- Extended UI verification startup tolerance for slower cold Vite starts.
- Hardened pre-push checks so nested verification commands do not inherit Git hook stdin.
- Added a deterministic lint runner that disables Node compile cache for ESLint on runtimes where it can hang.
- Added repo-local OpenAI Cookbook-style ExecPlan governance in `.agent/PLANS.md`.
- Converted the next autonomous execution plan into a living ExecPlan with progress, discoveries, decisions, recovery, and validation criteria.
- Added a public hosted Grok MVP ExecPlan covering PRs, CI, Vercel, provider boundaries, quality gates, and public-demo abuse controls.
- Added a self-contained next autonomous execution plan for the first live-AI-capable story module path.
- Fixed review findings for explicit protagonist handling, unique mechanism validation, and root lockfile hygiene.
- Updated the Svelte workbench to render module run results and fixture-demo provenance.
- Added autonomous work spec for the Story Module Platform.
- Added documentation governance with root and nested `AGENTS.md` files.
- Added prose quality rubric and rejection rules.
- Added active tracking ledger for review findings, product risks, and future story-state tracking.
- Added AI orchestration plan for live AI council behavior and fail-closed provider handling.
- Added lessons learned from the heuristic prototype review.
- Added `npm run verify` as a single core verification command.

## 2026-05-26

- Created isolated SvelteKit app `pocketfm-contest-forge`.
- Added hexagonal folders for contracts, domain, ports, application, adapters, and routes.
- Added contract tests, scoring tests, application use-case tests, and browser smoke test.
- Added initial Pocket FM contest research notes.
- Added deterministic prototype adapter and AI council prompt contract.
- Added interactive Svelte workbench UI.
