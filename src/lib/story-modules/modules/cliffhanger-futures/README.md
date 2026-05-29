<!-- Created: 2026-05-26 13:48 -->

# Cliffhanger Futures

Ranks episode endings by curiosity debt, volatility, and payoff path.

Mode rules:

- `fixture` and `demo` may return deterministic fixture output.
- Direct `module.run(..., live)` fails closed instead of returning fixture output.
- Production live execution uses `LiveModuleExecutor`, `buildCliffhangerFuturesProviderMessages`,
  `buildCliffhangerFuturesProviderInput`, and the `LiveModuleQualityGateRegistry`.
- Prompt text is owned in `prompts.ts` and versioned by `CLIFFHANGER_FUTURES_PROMPT_VERSION`.

Quality gates:

- no fake cliffhangers
- payoff path exists
- next-episode pull
