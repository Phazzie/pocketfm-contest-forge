<!-- Created: 2026-05-26 13:52 -->

# Trope Mutation Lab

Keeps a familiar genre doorway while changing one trope rule enough to create repeatable episode pressure.

Mode rules:

- `fixture` and `demo` may return deterministic fixture output.
- Direct `module.run(..., live)` fails closed instead of returning fixture output.
- Production live execution uses `LiveModuleExecutor`, `buildTropeMutationLabProviderMessages`,
  `buildTropeMutationLabProviderInput`, and the `LiveModuleQualityGateRegistry`.
- Prompt text is owned in `prompts.ts` and versioned by `TROPE_MUTATION_LAB_PROMPT_VERSION`.

Quality gates:

- familiar doorway
- strange room
- genre promise
