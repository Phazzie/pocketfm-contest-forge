<!-- Created: 2026-05-27 06:08 -->

# Next Autonomous Execution Plan

This plan is self-contained. A future agent should be able to start from a fresh checkout of
`pocketfm-contest-forge`, read this file plus the referenced repo docs, and work for several
hours without needing chat context.

## Mission

Move the app from a fixture-demo story module platform toward the first live-AI-capable module
without breaking the architecture:

- keep fixture/demo behavior stable;
- keep live mode fail-closed unless provider output is valid and accepted;
- implement the provider boundary and failure handling before expanding product scope;
- prove the path with `cold-open-lab` only;
- document every architectural decision and remaining risk.

## Required Reading

Read these files before editing:

- `AGENTS.md`
- `src/lib/story-modules/AGENTS.md`
- `docs/ARCHITECTURE.md`
- `docs/AI_ORCHESTRATION.md`
- `docs/PROSE_QUALITY.md`
- `docs/TRACKING.md`
- `docs/HOOKS_AND_AUTOMATION.md`
- `docs/AUTONOMOUS_WORK_SPEC.md`

Use local Codex skills when available:

- `pocketfm-story-module`
- `pocketfm-live-ai-adapter`
- `pocketfm-prose-quality-review`
- `pocketfm-story-state-continuity`

## Non-Negotiables

- Core must not import Svelte.
- UI must not own domain rules.
- Provider-facing code must stay behind ports/adapters.
- Module contracts must use runtime schemas.
- Prompt text must be versioned and module-owned.
- Every module result must include status, issues, provenance, and tracking events.
- Live mode must never silently return fixture, deterministic, or heuristic creative output.
- Do not add a second module to live AI until `cold-open-lab` is correct.
- Do not require a real API key for unit tests.

## Baseline Commands

Run before meaningful edits:

```sh
npm install
npm run verify
npm run verify:ui
```

If `verify:ui` uses a port other than `5173`, that is acceptable. The script chooses an
available local port.

## Work Package A: Hostile Architecture Review

Goal: identify issues before adding provider complexity.

Tasks:

1. Review `src/lib/application/moduleRunner.ts`.
2. Review `src/lib/story-modules/types.ts`.
3. Review `src/lib/story-modules/registry.ts`.
4. Review the four registered module implementations.
5. Review all guard scripts under `scripts/`.
6. Add findings to `docs/TRACKING.md`.
7. Add durable lessons to `docs/LESSONS_LEARNED.md` only when the finding changes future behavior.

Acceptance:

- `docs/TRACKING.md` has any new risks, decisions, or confirmed non-issues.
- No code changes are made merely for style.
- If a real bug is found, fix it with a focused test.

## Work Package B: Provider Port And Result Contract

Goal: define the live AI boundary without binding the product to one provider yet.

Add or update:

- `src/lib/core/ports/storyModuleProviderPort.ts`
- `src/lib/application/liveModuleExecutor.ts` or equivalent if it fits better than extending
  `ModuleRunner`.
- Provider result/error types for:
  - unavailable provider;
  - timeout;
  - malformed JSON;
  - schema validation failure;
  - prose quality rejection;
  - partial provider output;
  - unexpected provider exception.

Rules:

- Contracts first.
- Runtime schema validation remains module-owned.
- Provider adapters return diagnostics, not accepted module output.
- Accepted module output must still pass the module runner's output schema.

Tests:

- fake provider success;
- fake provider unavailable;
- fake provider timeout;
- malformed JSON;
- schema failure;
- unexpected exception.

Acceptance:

- Live provider boundary exists.
- No real API key is required.
- `npm run verify` passes.

## Work Package C: Cold Open Lab Live Path

Goal: make `cold-open-lab` the first live-capable module.

Tasks:

1. Keep `cold-open-lab/contract.ts` as the source output schema.
2. Add provider prompt assembly using `cold-open-lab/prompts.ts`.
3. Add a fake provider adapter for tests.
4. Add an optional real provider adapter only if it can be implemented without committing secrets.
5. Add one schema repair pass for malformed provider JSON.
6. Preserve fixture/demo mode behavior exactly.
7. In live mode:
   - call provider;
   - parse/repair output;
   - validate against Zod schema;
   - run prose quality checks;
   - return accepted output or failed result with issues.

Acceptance:

- `cold-open-lab` live success works with fake provider.
- provider unavailable returns failed result, not fixture output.
- malformed JSON tries one repair pass and then fails closed if still invalid.
- accepted result records provider/model/prompt version/latency.
- `guard:no-live-fallback` still passes.

## Work Package D: Prose Quality Gate

Goal: stop generic prose from becoming accepted advice.

Implement a lightweight deterministic quality gate first. Do not pretend this replaces human taste or
AI council review.

Possible files:

- `src/lib/core/domain/proseQuality.ts`
- `src/lib/core/domain/proseQuality.spec.ts`

Minimum checks:

- named protagonist or concrete subject;
- first-minute scene pressure;
- audio-readable sentence length warning;
- no generic writing-advice phrases;
- cliffhanger has a payoff path when applicable;
- output contains a specific cost, debt, status wound, or relationship pressure.

Acceptance:

- quality gate can reject weak fake provider output in tests;
- rejected output becomes module issue `PROSE_QUALITY_REJECTION`;
- docs explain this is a first-pass guard, not final creative judgment.

## Work Package E: UI Failure States

Goal: show live AI failure states without hiding user input.

Tasks:

1. Add UI affordance for generation mode if not already sufficient.
2. Show module statuses clearly: success, partial, failed.
3. Show provider unavailable/schema/prose issues without overwriting the draft.
4. Keep module output rendering dense and inspectable.
5. Add or update browser smoke assertions if the UI changes materially.

Acceptance:

- `npm run verify:ui` passes.
- The page visibly distinguishes fixture-demo from live failure.
- No domain rules move into Svelte.

## Work Package F: Documentation And Hooks

Update:

- `docs/CHANGELOG.md`
- `docs/TRACKING.md`
- `docs/AI_ORCHESTRATION.md`
- `docs/ARCHITECTURE.md` if boundaries changed
- `docs/LESSONS_LEARNED.md` for durable process changes

Run:

```sh
npm run guard:module-shape
npm run guard:no-live-fallback
npm run guard:repo-hygiene
npm run guard:docs-drift
npm run verify
npm run verify:ui
```

## Suggested Commit Sequence

Prefer small commits:

1. `Review module platform architecture`
2. `Add story module provider port`
3. `Add cold open live provider path`
4. `Add prose quality gate`
5. `Render live module failure states`
6. `Update docs for live AI module path`

## Stop Conditions

Stop and report clearly if:

- a real provider API key is required to continue;
- provider choice changes architecture materially;
- tests require network access;
- a guard blocks but the correct fix is a product decision rather than a code decision;
- GitHub auth or remote permissions fail.

Do not stop merely because a test is failing. Fix it unless the failure exposes one of the stop
conditions above.

## Final Handoff Requirements

Before final response:

- `git status --short` is understood and only intentional changes remain.
- `npm run verify` passes.
- `npm run verify:ui` passes if UI changed.
- Summarize:
  - changed files;
  - provider boundary decisions;
  - tests run;
  - remaining risks;
  - next recommended work package.
