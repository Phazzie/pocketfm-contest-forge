<!-- Created: 2026-05-26 06:16 -->

# AI Orchestration

The app should be AI-native. The deterministic adapter is a test double, not the product.
The test double is still held to the same TypeScript safety standards as live provider code: no
implicit undefined reads, no unused parameters, and no undocumented type escapes.
Quality guards must scan only executable type escapes outside comments and strings, while inline
ESLint disable directives still require a rationale. This keeps live provider work from hiding
unsafe output normalization behind casual suppressions.

## Production Flow

1. Validate `ForgeRequest`.
2. Resolve current contest brief and source freshness.
3. Build story state from the seed, contest brief, and episode history.
4. Run registered story modules through runtime schemas and provider adapters.
5. Run AI council roles against the seed, story state, and module outputs.
6. Normalize provider outputs into the `ForgePlan` contract.
7. Run prose quality checks.
8. Return accepted, partial, or failed AI results with clear metadata.

## Required AI Roles

- Listener Saboteur: predicts drop-off and weak curiosity points.
- Trope Criminal: mutates familiar genre promises.
- Debt Auditor: tracks promises, payoff windows, stale debts, and fake cliffhangers.
- Voice Actor Ghost: rewrites for audio clarity and performance.
- Contest Judge: compares output against prompt/rules and likely competitor patterns.
- Continuity Keeper: tracks names, secrets, relationships, objects, and unresolved reveals across episodes.

## Failure Handling

No provider key:

- Disable serious forge generation.
- Show setup guidance.
- Preserve draft input.
- Do not emit heuristic creative output.

Timeout:

- Preserve draft input.
- Show retry.
- Mark incomplete council roles.

Partial provider failure:

- Return completed role outputs only.
- Clearly mark missing roles.
- Do not backfill missing roles with heuristic prose.

Schema failure:

- Attempt one repair pass.
- If repair fails, show provider output as diagnostic only, not accepted advice.

## Story Module Boundary

Each story module owns its prompt version and runtime schema. The module runner must validate:

- module input;
- required story-state fields;
- module output;
- status, issues, provenance, and tracking events.

Current modules run in fixture/demo mode only:

- `cold-open-lab`;
- `cliffhanger-futures`;
- `binge-debt-ledger`;
- `trope-mutation-lab`.

Live mode must fail closed until a provider adapter exists.

`src/lib/core/ports/storyModuleProviderPort.ts` is the provider-facing contract for module JSON
generation. Providers return raw model text plus diagnostics; they do not return accepted module
output. `src/lib/application/liveModuleExecutor.ts` is the first live boundary implementation for
fake-provider tests: it validates provider requests/results, performs one balanced-object JSON repair
attempt, validates module output with the module-owned Zod schema, runs the prose quality gate, and
returns a normal `ModuleRunResult`.

The executor is not a fallback path. When a provider is unavailable, times out, throws, returns
malformed JSON, returns schema-invalid JSON, or produces weak prose, the module result is failed and
no fixture/demo output is substituted.

Current live execution is intentionally enabled only for modules with configured quality gates. The
default executor supports `cold-open-lab`; other modules must add module-specific prose extraction
and acceptance rules before they can run through the provider boundary. Provider JSON repair handles
raw JSON, markdown-fenced JSON, or the first balanced JSON object, but still records this as one
repair attempt and fails closed if schema validation does not pass.

The executor also enforces a configurable provider timeout. A hung provider returns a failed module
result with `PROVIDER_TIMEOUT`; it must not leave the request pending indefinitely or backfill with
fixture output.

## xAI Grok Adapter

`src/lib/adapters/ai/xaiStoryModuleProvider.ts` implements `StoryModuleProvider` for the xAI
Responses API. It is a transport adapter only: it posts module prompt messages, receives raw model
text, validates the provider response shape, and returns provider diagnostics. It does not parse,
repair, or accept story-module JSON; that remains owned by `LiveModuleExecutor` and the module-owned
schemas.

The default adapter configuration is:

- endpoint: `https://api.x.ai/v1/responses`;
- model: `grok-4.20-multi-agent`;
- reasoning effort: `medium`;
- timeout: 120 seconds.

Official xAI documentation verified on 2026-05-28 says `grok-4.20-multi-agent` is supported by the
Responses API and that REST `reasoning.effort` accepts `low`, `medium`, `high`, or `xhigh`.
`low`/`medium` use the lower-cost 4-agent setup; `high`/`xhigh` use the higher-cost 16-agent setup.
The adapter intentionally does not enable xAI built-in tools for the MVP path because tool calls add
cost and are unnecessary for module JSON generation.

Required server-side environment:

- `XAI_API_KEY`
- `STORY_AI_PROVIDER=xai` when the provider variable is set
- `STORY_AI_MODEL=grok-4.20-multi-agent` unless overridden for a deliberate test
- `STORY_AI_REASONING_EFFORT=medium` unless deliberately testing costlier reasoning

No xAI call is allowed from Svelte client code. The next public-MVP slice must instantiate this
adapter only from server-side load/action code or a server-only application service.

## Provider Tracking

Every live AI result should record:

- provider;
- model;
- prompt version;
- contest brief version or retrieval date;
- latency;
- completion status;
- schema repair attempts;
- user-accepted changes.

Every module result should additionally record module ID, module version, quality gate status, story-state events, and whether the result opened, paid, or staled any serial debt.

## Test Strategy

- Unit tests use deterministic test doubles.
- Contract tests assert schema and error behavior.
- Integration tests may use live providers behind explicit env flags.
- Browser tests should verify unavailable, loading, partial, and success states.
