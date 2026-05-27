<!-- Created: 2026-05-26 13:08 -->

# Autonomous Work Spec

This spec defines the next large autonomous build chunk for Pocket FM Contest Forge.

## Implementation Status

Status as of 2026-05-26: Phase 1 is implemented in fixture-demo form.

- Four initial story modules are registered and test-covered.
- Module input/output validation uses Zod runtime schemas.
- Module results include status, issues, provenance, and tracking events.
- Story-state contracts exist without persistence.
- The scaffold script exists as `npm run scaffold:module`.
- Local Codex skill exists at `~/.codex/skills/pocketfm-story-module/`.
- Live AI remains intentionally unwired and must fail closed until a provider adapter is implemented.

## Current Code State

The app has:

- SvelteKit UI workbench;
- hexagonal folders for core, ports, application, adapters, and routes;
- contracts for `ForgeRequest` and `ForgePlan`;
- a deterministic prototype adapter;
- tests for contracts, scoring, and the forge use case;
- browser smoke test;
- governance docs and agent instructions.

The app does not yet have:

- a real story module system;
- runtime schemas for AI/provider boundaries;
- live AI provider adapters;
- async run lifecycle;
- persistence/story bible;
- module scaffolding script;
- user-facing fail-closed AI states.

## Work Package: Story Module Platform

Build the modular foundation that lets us add story tools quickly without turning the app into one giant generator.

### Goal

Create a typed story module architecture where every creative tool is a pluggable module with:

- metadata;
- input schema;
- output schema;
- prompt assets;
- quality gates;
- test fixtures;
- registry entry;
- execution status;
- provenance metadata.

### Non-Goals

- Do not wire live AI provider calls in this work package unless the module boundary is already stable.
- Do not add persistence database dependencies yet.
- Do not add user accounts.
- Do not create a generic chatbot.

## Target Architecture

Add these folders:

```text
src/lib/story-modules/
  registry.ts
  types.ts
  scaffold-fixtures/
  modules/
    cold-open-lab/
    cliffhanger-futures/
    binge-debt-ledger/
    trope-mutation-lab/

src/lib/core/story-state/
  storyStateContract.ts
  storyStateValidation.ts

src/lib/application/moduleRunner.ts
scripts/scaffold-story-module.mjs
```

### Module Contract

Each module should satisfy a shape close to:

```ts
interface StoryModule<TInput, TOutput> {
	id: StoryModuleId;
	version: string;
	label: string;
	category: StoryModuleCategory;
	inputSchema: RuntimeSchema<TInput>;
	outputSchema: RuntimeSchema<TOutput>;
	requiredState: StoryStateRequirement[];
	promptVersion: string;
	qualityGates: QualityGateId[];
	run(context: ModuleRunContext<TInput>): Promise<ModuleRunResult<TOutput>>;
}
```

Use Zod or a comparable runtime schema library. TypeScript interfaces alone are not enough for AI boundaries.

### Module Run Result

Every module result needs:

- `status`: `success`, `partial`, or `failed`;
- `output` when successful;
- `issues` for validation/prose/provider problems;
- `provenance`: module ID, module version, prompt version, provider, model, latency, source contest brief version;
- `trackingEvents`: story debt opened, debt paid, character changed, promise created, quality rejection, etc.

## Initial Modules To Convert

Convert existing mechanism ideas into real modules in this order:

1. `cold-open-lab`
   - Input: story seed, contest brief, optional protagonist.
   - Output: 3-5 cold opens, acquisition strategy, winner rationale, rejection notes.
   - Quality gates: first-minute clarity, genre promise, audio readability.
2. `cliffhanger-futures`
   - Input: episode beat map, unresolved debts, contest lane.
   - Output: candidate cliffhangers, futures score, volatility, payoff warning.
   - Quality gates: no fake cliffhangers, payoff path exists, next-episode pull.
3. `binge-debt-ledger`
   - Input: episode beats, secrets, promises, prior ledger.
   - Output: opened debts, paid debts, stale debts, payoff windows.
   - Quality gates: no debt without payoff path, no stale debt without escalation.
4. `trope-mutation-lab`
   - Input: contest genre, mandatory elements, seed premise.
   - Output: expected trope, mutation rule, preserved promise, confusion guardrail.
   - Quality gates: familiar doorway, strange room.

## Scaffolding Script

Add:

```sh
npm run scaffold:module -- --id villain-protagonist-engine --category archetype
```

The script should create:

- `module.ts`;
- `contract.ts`;
- `prompts.ts`;
- `fixtures.ts`;
- `module.spec.ts`;
- `README.md`;
- registry TODO or automatic registry update.

The scaffold must include a failing placeholder test until the module is implemented, or a skipped test with explicit TODO. Prefer a minimal passing smoke test if the scaffold creates a valid no-op module.

## Codex Skill

Create a local Codex skill after the repo script exists:

```text
~/.codex/skills/pocketfm-story-module/
  SKILL.md
  scripts/
```

The skill should be thin. It should tell agents to:

1. read `pocketfm-contest-forge/AGENTS.md`;
2. run the repo scaffold script;
3. implement the generated module contract;
4. add tests and fixtures;
5. update docs and tracking.

The repo script remains the source of truth.

## Story State Model

Add a story-state contract that can eventually persist:

- contest brief;
- protagonist;
- antagonist;
- supporting cast;
- desire lattice;
- secrets;
- rules/magic/system mechanics;
- episode history;
- open debts;
- paid debts;
- stale debts;
- continuity facts;
- writer decisions;
- AI suggestions accepted/rejected.

Do not add a database yet. Use in-memory fixtures and contracts first.

## Error Handling Requirements

Module runner must distinguish:

- invalid input;
- missing story state;
- provider unavailable;
- provider timeout;
- schema validation failure;
- prose quality rejection;
- partial module result;
- unexpected module exception.

No module may silently substitute heuristic prose for failed AI output in production mode.

## Tests Required

Add tests for:

- registry rejects duplicate module IDs;
- registry can find each initial module;
- module runner returns typed success for fixture mode;
- module runner returns typed failure for invalid input;
- duplicate mechanism validation is fixed;
- default protagonist output no longer says "Crown weaponizes a crown";
- scaffold script creates expected files in a temp directory;
- `npm run verify` passes.

## Acceptance Criteria

This work package is complete when:

- four initial story modules are registered and test-covered;
- existing mechanisms are no longer only switch cases in `DeterministicStoryIntelligence`;
- module scaffold script works and is documented;
- runtime schemas validate module inputs and outputs;
- story-state contract exists with tests;
- known review findings are fixed or explicitly deferred with reasons;
- `npm run verify` passes;
- `npm run test:browser` passes after UI changes.

## Suggested Execution Order

1. Fix review findings that can poison tests: protagonist derivation and unique mechanism validation.
2. Clean root package lock churn.
3. Add runtime schema dependency.
4. Add module types and registry.
5. Add module runner.
6. Convert `cold-open-lab`.
7. Convert `cliffhanger-futures`.
8. Convert `binge-debt-ledger`.
9. Convert `trope-mutation-lab`.
10. Add story-state contracts.
11. Add scaffold script.
12. Update UI to render module results, not raw mechanism switch output.
13. Add browser checks.
14. Update changelog, tracking, lessons learned.

## Open Decisions

- Runtime schema library: likely Zod.
- Initial live AI provider: Claude for prose quality, OpenAI for structured outputs, Gemini for long-context continuity, or a provider router.
- Persistence: local file, SQLite, Postgres, or hosted database later.
- Workflow engine: hand-rolled run lifecycle first, or formal durable workflow later.
- Whether modules are loaded statically at build time or dynamically from a registry manifest.
