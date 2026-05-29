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
2. Resolve current contest brief and source freshness from `ContestBrief.freshness`.
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
- `trope-mutation-lab` can run through `LiveModuleExecutor` after accepted cold-open, binge-debt,
  and cliffhanger output;
- `council-review` can run through `LiveModuleExecutor` after the prior live artifacts are accepted.

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
`cliffhanger-futures`, `trope-mutation-lab`, and `council-review`; future modules must add a
module-specific review builder and acceptance rules before they can run through the provider
boundary. Provider JSON repair handles raw JSON, markdown-fenced JSON, or the first balanced JSON
object, but still records this as one repair attempt and fails closed if schema validation does not
pass.

The executor also enforces a configurable provider timeout. A hung provider returns a failed module
result with `PROVIDER_TIMEOUT`; it must not leave the request pending indefinitely or backfill with
fixture output.

Provider quota, billing, credit, monthly spend, and provider rate-limit blocks return
`PROVIDER_QUOTA_EXCEEDED`. This is still a failed artifact, not a fallback path. The UI should show
the issue and preserve the seed so the writer can retry after credits or spend limits are restored.
The xAI adapter normalizes common provider delimiter variants such as `rate-limit`, `rate_limit`,
and `usage_limit` before classifying those errors.

`cold-open-lab.v2` hardens the provider prompt against known prose-gate failures. It constrains
spoken variant sentences to 12-20 words, requires concrete first-minute pressure and payoff-path
language, and mirrors the deterministic gate's generic writing-advice phrase list so live output is
less likely to fail on abstract craft language such as "emotional stakes." Its prompt builder also
falls back to "the protagonist" if malformed blank name input reaches message construction, keeping
provider instructions readable without accepting invalid contracts. User-controlled names remain in
the JSON input block and are not interpolated into system instructions.

`trope-mutation-lab.v4` hardens the provider prompt after production Story Studio smoke reached the
module and failed closed on multiple `PROSE_QUALITY_REJECTION` cases. Each live `mutationRule` must
include a visible rule-change cue such as except, instead, invert, mutation, only, reverse, rule,
subvert, or twist; weak conjunctions such as but and while are not accepted cues. Each live
`episodePressure` item must start with a repeatable cue (`Every episode`, `Each episode`, or
`Whenever`) and include a concrete cost word such as betrayal, debt, family, lover, public,
relationship, reputation, secret, status, or trust. The live quality gate mirrors those rules so the
prompt and acceptance criteria stay aligned instead of weakening the gate. Regression coverage
asserts the full rule-change cue list so prompt drift cannot drop accepted cue words.

`cliffhanger-futures.v2` hardens payoff warning instructions after production Story Studio smoke
rejected candidate warnings that described volatility without naming audience frustration. Each live
`payoffWarning` must now start with `Audience frustration risk:` or `Audience trust risk:` and name
a delayed payoff, fake cliffhanger, confusion, trust break, abstract lore, or hidden-proof risk. The
live quality gate enforces the same prefix.

`council-review.v2` hardens final council critique instructions after production Story Studio smoke
reached the final module and failed closed on abstract revision moves and vague risks. Every live
role `revisionMove` must include an action cue and a concrete story cost word such as debt, name,
public, relationship, status, or trust. Every live `riskIfIgnored` must start with
`Specific risk:` or `Audience risk:` and name a concrete drop, trust, confusion, fake-payoff,
stale-debt, generic-lane, or rejection risk. The live quality gate enforces those rules so the
council cannot pass generic critique as useful serial advice.

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

Required provider account state:

- The xAI team tied to `XAI_API_KEY` must have available credits and monthly spend headroom.
- If xAI returns billing or permission `HTTP 403`, Story Studio must fail closed and the deployed
  smoke cannot prove an accepted live run until credits or spend limits are restored.

No xAI call is allowed from Svelte client code. The next public-MVP slice must instantiate this
adapter only from server-side load/action code or a server-only application service.

`src/routes/+page.server.ts` now exposes the production server-side live path through the
`runLiveStudio` form action. It passes private env values into the xAI adapter on the server,
authorizes the request with `STORY_AI_ACCESS_CODE`, applies a small per-client in-memory rate limit,
and returns a `StoryStudioResponse` for the UI to render. Provider failures remain visible as failed
or locked story artifacts; the action does not replace them with fixture prose.

The production action also respects the writer's selected mechanisms before spending provider calls.
`cold-open-lab`, `binge-debt-ledger`, `cliffhanger-futures`, and `trope-mutation-lab` run only when
their matching mechanism is selected; otherwise their artifacts remain locked and no xAI request is
made for that module. `council-review` runs only after the prior live artifacts are accepted.

The route uses a deployment-specific budget for the full Story Studio chain. The SvelteKit Vercel
adapter is configured with a 300-second function max duration, while the route's xAI transport
timeout is 55 seconds and the executor wrapper timeout is 56 seconds per module. That caps the
five-module worst case below the Vercel Fluid Compute default maximum while still failing closed
with visible module failures if a provider call hangs or times out. `RunLiveStoryStudio` also
checks the remaining request budget before starting each provider call and locks the next artifact
when less than 70 seconds remain in the 285-second application budget, so Vercel can return a typed
Story Studio response instead of a platform timeout page.

`src/lib/core/contracts/storyStudioContract.ts` now defines the production Story Studio response
shape. `src/lib/application/runLiveStoryStudio.ts` is the first application use case for that
contract: it runs the existing live `cold-open-lab` provider path, maps the module result into a
production artifact, runs `binge-debt-ledger` from accepted cold-open variants, runs
`cliffhanger-futures` from accepted cold-open and debt-ledger output, runs `trope-mutation-lab` from
accepted cold-open, debt-ledger, and cliffhanger output, and runs `council-review` after those live
artifacts are accepted. Locked artifacts are explicit product states, not fallback prose.

The Svelte page renders this `StoryStudioRun` contract directly. It no longer imports
`createDefaultForge()`, computes deterministic forge output in the browser, or shows heuristic
readiness scores as production advice. The default request lives in
`src/lib/application/defaultForgeRequest.ts` so the route can populate controls without importing
the deterministic fixture forge.

Submitted-request equality for live result display lives in
`src/lib/application/forgeRequestEquality.ts`, not in the Svelte route. The route can decide whether
the latest action response still matches visible controls without owning story/request comparison
rules.

Contest freshness is contract-backed rather than a UI string. Curated briefs carry `retrievedAt`,
`staleAfter`, and a source warning; `StoryStudioRun.contestFreshness` derives `fresh`, `stale`, or
`unknown` from those dates and keeps stale warnings visible while still allowing a live run.

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
