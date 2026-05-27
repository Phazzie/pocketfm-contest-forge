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

The Svelte route imports the use case, but the use case does not import Svelte. AI behavior is behind `StoryIntelligencePort`, and contest research is behind `ContestResearchPort`.
AI orchestration is explicit in the `AiCouncilPrompt` contract so Gemini, Claude, Grok, or another model can be used as replaceable advisors without changing the UI contract.

Story modules are pluggable runtime-schema-backed tools. Each module owns:

- `contract.ts` with Zod input/output schemas;
- `prompts.ts` with versioned prompt text;
- `fixtures.ts` for deterministic fixture/demo mode;
- `module.ts` with quality gates, required story state, provenance, issues, and tracking events;
- `module.spec.ts` and `README.md`.

`src/lib/story-modules/registry.ts` is the static registry. `src/lib/application/moduleRunner.ts` validates story state, module input, and module output before a result can be accepted. The use case maps accepted module runs into `ForgePlan.moduleResults` for the UI.

## Contract/Test Driven Development

The primary seam is `ForgeRequest -> ForgePlan`, defined in `contestForgeContract.ts`. Module-level seams are defined by each module's Zod schema and are validated at runtime.

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

The current app uses deterministic local adapters and fixture-backed modules so it can run and test without API credentials. This is labeled as `fixture-demo` output. Live mode fails closed until provider adapters exist; it must not silently replace failed AI with deterministic prose.
