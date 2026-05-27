<!-- Created: 2026-05-26 06:16 -->

# Lessons Learned

## Heuristic Creative Fallbacks Are Harmful

For this product, heuristic creative output is worse than no output. It can look structured while lacking real taste, novelty, or contest judgment.

Decision: deterministic story intelligence is allowed for tests, fixtures, and clearly labeled demos only. Production creative generation must use live AI or fail closed.

## Architecture Was Useful But Not Sufficient

The hexagonal split made the deterministic adapter replaceable, but the product experience still needs to be AI-first. A clean port is not the same as the correct default behavior.

Decision: future work should make `StoryIntelligencePort` production implementations live AI adapters and reserve deterministic adapters for non-production paths.

## Prose Needs Explicit Quality Gates

Passing tests does not prove good prose. Writing tools need taste checks, rejection criteria, and story-state tracking.

Decision: use `docs/PROSE_QUALITY.md` and AI council roles as gates before presenting creative recommendations as serious output.

## Track Review Findings Immediately

The review caught issues that were not visible in green tests: nonsensical default prose, duplicate mechanism validation, and platform-specific install metadata.

Decision: review findings go into `docs/TRACKING.md` until fixed and tested.

## Modules Need Runtime Schemas, Not Just Types

The old mechanism list was easy to extend but hard to govern. TypeScript alone cannot protect provider output, prompt drift, or malformed AI JSON.

Decision: every story module owns Zod input/output schemas, prompt versions, quality gates, provenance, and tracking events.

## Scaffolding Prevents Architecture Drift

Copying a module by hand invites missing prompts, fixtures, docs, or fail-closed behavior.

Decision: new story modules should start with `npm run scaffold:module -- --id <module-id> --category <category>` and then be edited into a real module before registration.
