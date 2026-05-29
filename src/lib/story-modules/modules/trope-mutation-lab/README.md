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
- repeatable episode pressure
- concrete relationship, public status, secret, trust, name, debt, or price cost
- scene proof with a playable place/action/cost

`trope-mutation-lab.v2` hardens the provider prompt after production smoke reached this module and
failed closed on weak `episodePressure` output. Every live `episodePressure` item must now begin with
`Every episode`, `Each episode`, or `Whenever`, and it must carry a concrete recurring cost word.
Tone-only advice, escalation language, or suspense-only pressure remains a prose-quality rejection.
