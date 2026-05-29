<!-- Created: 2026-05-27 06:08 -->

# ExecPlan: First Live-AI-Capable Story Module Path

This plan follows `.agent/PLANS.md`. It is a living document for a future autonomous run that moves
`pocketfm-contest-forge` from fixture-demo module output to the first fake-provider-backed live
module path. Keep this file current while executing it.

## Purpose / Big Picture

The app already demos a SvelteKit writing lab with fixture-backed story modules. The next outcome is
not "wire a real model." The next outcome is a trustworthy live-mode execution path for one module,
`cold-open-lab`, where provider output is accepted only after JSON parsing, schema validation, and
prose quality checks.

After this plan is complete, a user or reviewer can switch the module execution path to live mode in
tests, feed it fake provider responses, and observe success, provider failure, malformed JSON,
schema rejection, and prose rejection without requiring an API key. Fixture/demo mode must remain
unchanged in the UI.

## Progress

- [x] 2026-05-27 22:21 - Converted the earlier autonomous work outline into this strict ExecPlan.
- [x] 2026-05-28 03:44 - Ran baseline `npm run verify` from clean `main`; it passed before
      branch edits.
- [x] 2026-05-28 04:25 - Completed architecture review notes in `docs/TRACKING.md`.
- [x] 2026-05-28 04:25 - Added the provider port and fake-provider contract tests.
- [x] 2026-05-28 04:25 - Added `cold-open-lab` live execution through `LiveModuleExecutor`.
- [x] 2026-05-28 04:25 - Added the deterministic prose quality gate.
- [ ] Render live failure states only if a route-level live affordance is added.
- [x] 2026-05-28 04:25 - Updated docs for the live boundary.
- [x] 2026-05-28 03:54 - Ran final `npm run verify`; lint, guards, 34 unit tests, Svelte
      diagnostics, and production build passed.
- [x] 2026-05-28 03:55 - Ran `npm run guard:docs-drift`; it passed for eight changed app
      code/script files.
- [x] 2026-05-28 04:08 - Addressed automated review findings for markdown-fenced JSON, module
      gate selection, slug leakage in prose checks, single-word named subjects, and prompt enum samples.
      Final focused tests now cover 40 cases.
- [x] 2026-05-28 04:14 - Addressed follow-up review findings for blocked provider provenance and
      hung provider timeout behavior.

## Surprises & Discoveries

- 2026-05-27 22:21 - The previous plan was useful but not decision-complete: it allowed "or
  equivalent," an optional real provider adapter, and underspecified UI behavior. This version fixes
  those choices.
- 2026-05-28 04:25 - Strict optional property checks caught provenance/review object construction
  issues while the live executor was being added. Keeping `exactOptionalPropertyTypes` on is paying
  off at provider boundaries.
- 2026-05-28 04:08 - Review caught real boundary problems that green tests missed: model output often
  arrives in markdown fences, prompt examples can accidentally teach invalid enum values, and quality
  gates must not let IDs or metadata satisfy prose checks.

## Decision Log

- 2026-05-27 22:21 - Do not implement a real provider adapter in this plan. Rationale: the next
  architectural risk is provider-boundary correctness, not vendor selection or secrets handling.
- 2026-05-27 22:21 - Add `src/lib/core/ports/storyModuleProviderPort.ts` as the provider boundary.
  Rationale: ports belong in core and adapters can implement them later.
- 2026-05-27 22:21 - Add `src/lib/application/liveModuleExecutor.ts` rather than extending
  `ModuleRunner`. Rationale: `ModuleRunner` validates module-owned fixture/demo execution today;
  live provider orchestration needs a separate application service so provider diagnostics do not
  leak into module implementations.
- 2026-05-27 22:21 - Keep UI live-mode controls out of this plan unless the application service is
  already complete and verified. Rationale: live mode is not product-demo-ready until provider
  selection and user-facing retry/setup states are designed.

## Outcomes & Retrospective

Complete for the fake-provider live boundary. Fake-provider live execution now works for
`cold-open-lab` in unit tests. Observable paths include success, provider unavailable, provider
timeout, malformed JSON repaired once, malformed JSON rejected, schema-invalid JSON rejected, weak
prose rejected, and unexpected provider exception. A real provider adapter, UI live state, Vercel
auth/deploy verification, and public-demo abuse controls remain before MVP.

## Context and Orientation

Work in `/Users/hbpheonix/pocketfm`.

Read these files before editing:

- `AGENTS.md`
- `.agent/PLANS.md`
- `src/lib/story-modules/AGENTS.md`
- `docs/ARCHITECTURE.md`
- `docs/AI_ORCHESTRATION.md`
- `docs/PROSE_QUALITY.md`
- `docs/TRACKING.md`
- `docs/HOOKS_AND_AUTOMATION.md`
- `docs/AUTONOMOUS_WORK_SPEC.md`

Key terms:

- "fixture/demo mode" means deterministic local module output used for stable tests and demo UI.
- "live mode" means a provider-backed path. Live mode must fail closed when provider output is
  missing, malformed, low quality, or invalid.
- "module" means a runtime-schema-backed story tool under `src/lib/story-modules/modules`.
- "provider" means an adapter that returns raw model text plus diagnostics. It does not return
  accepted module output.

Current architecture:

- `src/lib/story-modules/types.ts` defines module IDs, execution modes, issues, provenance, tracking
  events, and `StoryModule`.
- `src/lib/application/moduleRunner.ts` validates story state, module input, module output, and
  unexpected module exceptions.
- `src/lib/story-modules/modules/cold-open-lab` owns the first target module contract, prompt
  version, fixture output, and demo module implementation.
- `src/routes/+page.svelte` renders fixture-demo forge output. Do not move domain rules into this
  route.

## Plan of Work

First, review the existing module platform and record real risks or confirmed non-issues in
`docs/TRACKING.md`. Fix only bugs that block the live boundary.

Second, add `src/lib/core/ports/storyModuleProviderPort.ts`. The port must expose one method,
`generateModuleJson(request)`, that accepts module ID, module version, prompt version, execution
mode, provider prompt messages, and a serializable provider input object. It returns a discriminated
union with either raw JSON text and diagnostics or one provider failure code.

Third, add `src/lib/application/liveModuleExecutor.ts`. This service takes a `StoryModule`, a
validated module context, prompt messages, and a `StoryModuleProvider`. It calls the provider,
performs one JSON repair attempt for malformed JSON, validates the parsed object with the module's
output schema, runs the prose quality gate, and returns a `ModuleRunResult`.

Fourth, make `cold-open-lab` the only live-capable module in this plan. Add prompt assembly beside
`cold-open-lab/prompts.ts`, use `coldOpenLabOutputSchema` as the only accepted output schema, and
write tests with fake provider responses. Do not add live paths for `cliffhanger-futures`,
`binge-debt-ledger`, or `trope-mutation-lab`.

Fifth, add a deterministic prose quality gate in `src/lib/core/domain/proseQuality.ts`. It is a
first-pass blocker for obviously generic output, not a replacement for human taste or later AI
council review.

Sixth, update docs and verification evidence. UI changes are allowed only when live failure state is
exposed through an application contract; if no UI contract changes, skip route edits and do not run
UI work merely for decoration.

## Concrete Steps

Run baseline commands from the app root:

    npm install
    npm run verify
    npm run verify:ui

Review these files and update `docs/TRACKING.md` with findings:

- `src/lib/application/moduleRunner.ts`
- `src/lib/story-modules/types.ts`
- `src/lib/story-modules/registry.ts`
- `src/lib/story-modules/modules/cold-open-lab/*`
- `scripts/guard-module-shape.mjs`
- `scripts/guard-no-live-fallback.mjs`

Create `src/lib/core/ports/storyModuleProviderPort.ts` with these exported types:

- `StoryModuleProviderRequest`
- `StoryModuleProviderSuccess`
- `StoryModuleProviderFailure`
- `StoryModuleProviderResult`
- `StoryModuleProvider`
- `StoryModuleProviderFailureCode`

Use these failure codes exactly: `PROVIDER_UNAVAILABLE`, `PROVIDER_TIMEOUT`, `MALFORMED_JSON`,
`SCHEMA_VALIDATION_FAILED`, `PROSE_QUALITY_REJECTION`, `PARTIAL_MODULE_RESULT`,
`UNEXPECTED_EXCEPTION`.

Create `src/lib/application/liveModuleExecutor.ts` and
`src/lib/application/liveModuleExecutor.spec.ts`. The executor must map provider and validation
failures to existing `ModuleIssueCode` values in `src/lib/story-modules/types.ts`. For malformed
JSON, perform exactly one repair attempt by extracting the first balanced JSON object from the raw
provider text. If no balanced object exists, fail closed with `SCHEMA_VALIDATION_FAILED`.

Create `src/lib/core/domain/proseQuality.ts` and `src/lib/core/domain/proseQuality.spec.ts`. The
gate should return accepted/warnings/rejections for these checks:

- protagonist or concrete subject is named;
- first-minute scene pressure is concrete;
- average sentence length is audio-readable or emits a warning;
- generic writing-advice phrases are rejected;
- a cliffhanger includes a payoff path when present;
- output includes at least one specific cost, debt, status wound, or relationship pressure.

Update `src/lib/story-modules/modules/cold-open-lab/prompts.ts` with a prompt assembly function that
returns provider messages and embeds `COLD_OPEN_LAB_PROMPT_VERSION`. Keep `contract.ts` as the
source of truth for accepted output.

Add fake provider tests covering:

- success with valid JSON;
- provider unavailable;
- timeout;
- malformed text that repair can recover;
- malformed text that repair cannot recover;
- schema-invalid JSON;
- weak prose rejected by the quality gate;
- unexpected provider exception.

Update docs:

- `docs/CHANGELOG.md`
- `docs/TRACKING.md`
- `docs/AI_ORCHESTRATION.md`
- `docs/ARCHITECTURE.md` if the new application service changes boundaries;
- `docs/LESSONS_LEARNED.md` only for durable process changes.

Suggested commits:

1. `Review live module architecture`
2. `Add story module provider port`
3. `Add cold open live executor path`
4. `Add prose quality gate`
5. `Update docs for live module execution`

## Validation and Acceptance

Run from the app root:

    npm run guard:module-shape
    npm run guard:no-live-fallback
    npm run guard:repo-hygiene
    npm run guard:docs-drift
    npm run verify

Run `npm run verify:ui` only if route files or user-visible UI state changed.

Acceptance criteria:

- Fixture/demo behavior is unchanged.
- Unit tests require no real API key and no network access.
- `cold-open-lab` fake-provider live success returns `status: "success"` with accepted output,
  provider/model/prompt version/latency provenance, and tracking events.
- Provider unavailable and timeout return `status: "failed"` without fixture output.
- Malformed JSON gets exactly one repair attempt and then fails closed if still invalid.
- Schema-invalid provider JSON returns `SCHEMA_VALIDATION_FAILED`.
- Weak prose returns `PROSE_QUALITY_REJECTION`.
- `guard:no-live-fallback` still passes.

## Idempotence and Recovery

All new tests should use fake providers and deterministic clocks. Re-running tests must not require
secrets, network access, or prior local state.

If a baseline command fails before edits, stop and record the failure in `Progress` and
`Surprises & Discoveries`. If a failure appears after edits, fix it unless it requires a product
decision, real API key, network-only test, or provider choice.

If the live executor design exposes a missing existing contract, update this ExecPlan before coding
the new direction. Do not hide that decision inside implementation.

## Artifacts and Notes

Keep concise evidence here while executing:

- command outputs that prove verification passed;
- any changed assumptions;
- links to commits or pull requests if the work is pushed.

No execution evidence yet.

## Interfaces and Dependencies

No new runtime dependency is expected for this plan. Use existing TypeScript, Zod, Vitest, and
SvelteKit tooling.

The provider port is internal TypeScript API only. It must not introduce a public HTTP API, new
environment variable, real provider SDK, or committed secret.

The UI contract remains fixture-demo unless a later ExecPlan explicitly designs live AI controls.
