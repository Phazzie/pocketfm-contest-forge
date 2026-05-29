<!-- Created: 2026-05-26 06:16 -->

# AI Orchestration

The app should be AI-native. The deterministic adapter is a test double, not the product.
The test double is still held to the same TypeScript safety standards as live provider code: no
implicit undefined reads, no unused parameters, and no explicit `any` escapes in executable app
code. Heterogeneous story-module registries use `unknown` at lookup boundaries so module-specific
schemas still own input/output safety. Quality guards must scan only executable type escapes outside
comments and strings, while inline ESLint disable directives still require a rationale. This keeps
live provider work from hiding unsafe output normalization behind casual suppressions.

## Production Flow

1. Validate `ForgeRequest`.
2. Resolve current contest brief and source freshness.
3. Build story state from the seed, contest brief, and episode history.
4. Run registered story modules through runtime schemas and provider adapters.
5. Run AI council roles against the seed, story state, and module outputs.
6. Normalize provider outputs into production `StoryStudioRun` artifacts.
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

Current registered modules:

- `cold-open-lab` can run through `LiveModuleExecutor` and the xAI provider adapter;
- `binge-debt-ledger` can run through `LiveModuleExecutor` after accepted cold-open output;
- `cliffhanger-futures` can run through `LiveModuleExecutor` after accepted cold-open and
  binge-debt output;
- `trope-mutation-lab` still needs a live prompt, provider input, and quality gate.

Direct module `run()` methods still fail closed in live mode unless explicitly designed otherwise.
Provider-backed production execution should go through `LiveModuleExecutor`.

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
default live quality gate registry supports `cold-open-lab`, `binge-debt-ledger`, and
`cliffhanger-futures`; other modules must add a module-specific review builder and acceptance rules
before they can run through the provider boundary. Provider JSON repair handles raw JSON,
markdown-fenced JSON, or the first balanced JSON object, but still records this as one repair
attempt and fails closed if schema validation does not pass.

The executor also enforces a configurable provider timeout. A hung provider returns a failed module
result with `PROVIDER_TIMEOUT`; it must not leave the request pending indefinitely or backfill with
fixture output.

`cold-open-lab.v2` hardens the provider prompt against known prose-gate failures. It constrains
spoken variant sentences to 12-20 words, requires concrete first-minute pressure and payoff-path
language, and mirrors the deterministic gate's generic writing-advice phrase list so live output is
less likely to fail on abstract craft language such as "emotional stakes." Its prompt builder also
falls back to "the protagonist" if malformed blank name input reaches message construction, keeping
provider instructions readable without accepting invalid contracts. User-controlled names remain in
the JSON input block and are not interpolated into system instructions.

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

`src/routes/+page.server.ts` now exposes the first server-side live path through the
`runLiveColdOpen` form action. It passes private env values into the xAI adapter on the server,
authorizes the request with `STORY_AI_ACCESS_CODE`, applies a small per-client in-memory rate limit,
and returns a `LiveColdOpenResponse` for the UI to render. Provider failures remain visible as failed
module results; the action does not replace them with fixture prose.

`src/lib/core/contracts/storyStudioContract.ts` now defines the production Story Studio response
shape. `src/lib/application/runLiveStoryStudio.ts` is the first application use case for that
contract: it runs the existing live `cold-open-lab` provider path, maps the module result into a
production artifact, runs `binge-debt-ledger` from accepted cold-open variants, runs
`cliffhanger-futures` from accepted cold-open and debt-ledger output, and returns locked artifacts
for `trope-mutation-lab` and `council-review` until those modules have their own live prompts and
quality gates. Locked artifacts are explicit product states, not fallback prose.

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
- Deployed live smoke runs through the manual `Live AI Smoke` GitHub Actions workflow after Vercel
  env vars and the repo access-code secret are configured. The smoke request must post to the
  SvelteKit action with the target deployment origin so CSRF protection still rejects true
  cross-site form posts.
- Production smoke was locally proven on 2026-05-29 against
  `https://pocketfm-contest-forge.vercel.app` with accepted `xai`
  `cold-open-lab.v2` output.
- Browser tests should verify unavailable, loading, partial, and success states.
