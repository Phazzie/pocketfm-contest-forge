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
- payoff warning starts with `Audience frustration risk:` or `Audience trust risk:`
- warning names a delayed payoff, fake cliffhanger, audience confusion, trust break, abstract lore,
  or hidden-proof risk

`cliffhanger-futures.v2` hardens the provider prompt after production smoke rejected warnings that
described volatility without naming the audience-frustration risk. The live quality gate enforces
the same warning prefix so a candidate cannot pass with a warning that only describes tone, romance,
theme, or general stakes.
