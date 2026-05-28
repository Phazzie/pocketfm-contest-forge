<!-- Created: 2026-05-26 06:16 -->

# Hooks And Automation

## Recommended Scripts

- `npm run verify`: run lint, unit tests, Svelte diagnostics, and production build.
- `npm run test:browser`: run browser smoke test against a running dev server.
- `npm run verify:ui`: start the dev server on an available local port and run browser smoke.
- `npm run format`: format source and docs.
- `npm run guard:repo-hygiene`: fail on generated output, root lockfile churn, and local install metadata.
- `npm run guard:module-shape`: fail when registered story modules are missing required files, schemas, quality gates, provenance, or tracking events.
- `npm run guard:no-live-fallback`: fail when live mode can silently return fixture/deterministic creative output.
- `npm run guard:eslint-disable-rationale`: fail when `eslint-disable` comments do not include a rationale.
- `npm run guard:type-escape-budget`: fail when executable app code contains explicit `any`.
- `npm run guard:docs-drift`: fail when code changes are not paired with expected docs updates.
- `npm run ai:smoke`: opt-in live AI smoke against a deployed or local URL. Skips unless
  `RUN_LIVE_AI_SMOKE=1`, `LIVE_AI_SMOKE_URL`, and `STORY_AI_ACCESS_CODE` are present.
- `npm run hooks:install`: install `.githooks/pre-commit` and `.githooks/pre-push` into the parent repo.

## Recommended Git Hooks

Hooks are repo-owned templates in `.githooks/`. Install them with:

```sh
npm run hooks:install
```

Pre-commit:

- `npm run format`
- `npm run guard:repo-hygiene`
- `npm run guard:module-shape`
- `npm run guard:no-live-fallback`
- `npm run guard:eslint-disable-rationale`
- `npm run guard:type-escape-budget`
- `npm run guard:docs-drift -- --staged`
- `npm run test`

Pre-push:

- `npm run guard:repo-hygiene`
- `npm run verify`
- `npm run verify:ui` when route changes are detected against upstream

UI change check:

- Run `npm run verify:ui`.

## CI

GitHub Actions runs on pull requests and pushes to `main`:

- `npm ci`
- `npx playwright install --with-deps chromium`
- `npm run verify`
- `npm run verify:ui`
- `npm audit --audit-level=moderate`

Use branch protection so pull requests cannot merge unless CI is green.

Manual deployed live AI smoke:

- Workflow: `Live AI Smoke`
- Trigger: GitHub Actions `workflow_dispatch`
- Input: deployed Vercel URL
- Required GitHub secret: `LIVE_AI_SMOKE_ACCESS_CODE`
- Behavior: installs dependencies, runs `npm run guard:no-live-fallback`, then runs
  `RUN_LIVE_AI_SMOKE=1 npm run ai:smoke` against the supplied URL.
- Expected result: an accepted `live-ai` `cold-open-lab` result from provider `xai`; fixture fallback,
  provider rejection, schema rejection, prose rejection, or missing access-code secret fails the job.

## Future Scripts

- `research:refresh`: pull current contest briefs and update retrieval dates.
- `story:lint`: inspect generated prose for generic phrasing, fake cliffhangers, missing payoff windows, and audio-readability failures.
- `ledger:check`: validate story bible continuity and unresolved promise age.
