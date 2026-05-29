<!-- Created: 2026-05-26 13:50 -->

# Binge Debt Ledger

Tracks serial promises, partial payoffs, stale debt, and payoff windows.

Mode rules:

- `fixture` and `demo` may return deterministic fixture output.
- Direct `module.run(..., live)` fails closed instead of returning fixture output.
- Production live execution uses `LiveModuleExecutor`, `buildBingeDebtLedgerProviderMessages`,
  `buildBingeDebtLedgerProviderInput`, and the `LiveModuleQualityGateRegistry`.
- Prompt text is owned in `prompts.ts` and versioned by `BINGE_DEBT_LEDGER_PROMPT_VERSION`.

Quality gates:

- no debt without payoff
- stale debt escalates
