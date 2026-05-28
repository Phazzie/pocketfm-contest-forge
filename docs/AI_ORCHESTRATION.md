<!-- Created: 2026-05-26 06:16 -->

# AI Orchestration

The app should be AI-native. The deterministic adapter is a test double, not the product.
The test double is still held to the same TypeScript safety standards as live provider code: no
implicit undefined reads, no unused parameters, and no undocumented type escapes.

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
