<!-- Created: 2026-05-26 14:50 -->

# Council Review

Runs six live critique roles against accepted Story Studio artifacts:

- Listener Saboteur
- Trope Criminal
- Debt Auditor
- Voice Actor Ghost
- Contest Judge
- Continuity Keeper

Mode rules:

- `fixture` and `demo` may return deterministic fixture output.
- Direct `module.run(..., live)` fails closed instead of returning fixture output.
- Production live execution uses `LiveModuleExecutor`, `buildCouncilReviewProviderMessages`,
  `buildCouncilReviewProviderInput`, and the `LiveModuleQualityGateRegistry`.
- Prompt text is owned in `prompts.ts` and versioned by `COUNCIL_REVIEW_PROMPT_VERSION`.

Quality gates:

- role evidence
- revision move
- contest fit
