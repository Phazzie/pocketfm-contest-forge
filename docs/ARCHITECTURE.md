<!-- Created: 2026-05-26 01:35 -->

# Architecture

This app is intentionally shaped as a hexagonal SvelteKit application.

## Layers

- Core contracts: `src/lib/core/contracts`
- Core domain: `src/lib/core/domain`
- Core story state: `src/lib/core/story-state`
- Ports: `src/lib/core/ports`
- Application use cases: `src/lib/application`
- Story modules: `src/lib/story-modules`
- Adapters: `src/lib/adapters`
- Svelte presentation: `src/routes`

The Svelte route imports application use cases, but application code does not import Svelte.
Fixture/demo story intelligence is behind `StoryIntelligencePort`, provider-backed live modules are
behind `StoryModuleProvider`, and contest research is behind `ContestResearchPort`.

Story modules are pluggable runtime-schema-backed tools. Each module owns:

- `contract.ts` with Zod input/output schemas;
- `prompts.ts` with versioned prompt text;
- `fixtures.ts` for deterministic fixture/demo mode;
- `module.ts` with quality gates, required story state, provenance, issues, and tracking events;
- `module.spec.ts` and `README.md`.

`src/lib/story-modules/registry.ts` is the static registry. `src/lib/application/moduleRunner.ts`
validates fixture/demo story state, module input, and module output before a result can be accepted.
The fixture/demo forge use case maps accepted module runs into `ForgePlan.moduleResults`.

`src/lib/application/liveModuleExecutor.ts` is separate from `ModuleRunner`. It orchestrates
provider-backed module execution by calling the core provider port, repairing malformed JSON exactly
once, validating the module-owned output schema, applying the prose quality gate, and preserving
provider diagnostics in provenance/tracking events. Keeping this service separate prevents provider
diagnostics and repair policy from leaking into fixture/demo module implementations.

`src/lib/application/runLiveStoryStudio.ts` is the production live use case. It validates a
`ForgeRequest`, resolves the contest brief, builds story state, runs the live story modules in a
fixed order through `LiveModuleExecutor`, and returns a `StoryStudioResponse` with accepted,
failed, rejected, or locked artifacts. The Svelte page submits to `runLiveStudio`; the route layer
owns access-code/rate-limit checks and passes private env values to the xAI adapter without exposing
them to the browser.

## Contract/Test Driven Development

The fixture/demo seam is `ForgeRequest -> ForgePlan`, defined in `contestForgeContract.ts`. The
production live seam is `ForgeRequest -> StoryStudioResponse`, defined in
`storyStudioContract.ts`. Module-level seams are defined by each module's Zod schema and are
validated at runtime.

Tests assert:

- weak prompt-wrapper requests are rejected by contract validation;
- the default use case returns research-backed evidence;
- unconventional mechanisms such as `retention-black-box` and `cliffhanger-futures` are present;
- the AI council runbook is emitted as a contract artifact;
- initial story modules are discoverable through the registry and reject duplicate IDs;
- the module runner returns typed success and typed validation failures;
- the scaffold script creates complete module folders in a temp directory;
- retention scoring covers the full pilot beat map;
- application output is serializable and independent from Svelte components.

## Adapter Strategy

The fixture/demo app path uses deterministic local adapters and fixture-backed modules so tests can
run without API credentials. This is labeled as `fixture-demo` output and is not the production
creative path. Live mode fails closed until provider adapters and module-specific quality gates
exist; it must not silently replace failed AI with deterministic prose.

The provider boundary is testable with fake providers and is called by the server-side Story Studio
route action. Real adapters belong under `src/lib/adapters` and must implement the core port without
exposing provider keys to the browser.
