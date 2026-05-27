<!-- Created: 2026-05-26 06:16 -->

# Tracking

Use this file for active issues, review findings, risks, and decisions that need follow-up.

## Active Review Findings

| Status | Priority | Item                                                                                   | Source       | Next Action                                                               |
| ------ | -------- | -------------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------- |
| Done   | P2       | Default protagonist is derived from title words, producing "Crown weaponizes a crown." | Review       | Added explicit protagonist input, safer fixture default, and sanity test. |
| Done   | P3       | Mechanism validation checks count, not uniqueness.                                     | Review       | Validates unique mechanism IDs and rejects duplicate selections.          |
| Done   | P3       | Root `node_modules/.package-lock.json` contains local macOS install state.             | Review       | Root installed-tree metadata is no longer modified in this patch.         |
| Done   | P3       | Root `package-lock.json` has accidental name casing churn.                             | Local status | Root package-lock is no longer modified in this patch.                    |

## Product Risks

| Status    | Risk                                          | Why It Matters                                                    | Mitigation                                                                                                 |
| --------- | --------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Mitigated | Heuristic creative output is user-facing.     | It can create false confidence and waste writer time.             | Current app labels output as fixture-demo and live mode fails closed; live AI adapter remains future work. |
| Done      | Story mechanisms are not first-class modules. | New story tools will become switch cases and ad hoc UI rendering. | Four initial modules now run through registry and runtime schemas.                                         |
| Open      | Contest data can drift.                       | Bad rules create bad submissions.                                 | Add research refresh workflow with retrieval dates and stale warnings.                                     |
| Open      | Scoring is heuristic.                         | Numeric confidence may look more authoritative than it is.        | Label scores as AI-audited only after live critique and calibration.                                       |
| Mitigated | No persistence/story bible yet.               | Serial writing needs continuity tracking.                         | Story-state contract exists; persistence remains a future storage decision.                                |

## Active Follow-Up

| Status | Item                                                  | Next Action                                                                                  |
| ------ | ----------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Open   | Live AI provider adapter is still absent.             | Choose provider/router and implement provider-facing module execution behind ports/adapters. |
| Open   | Story-state contract is in-memory only.               | Add persistence after storage choice is made.                                                |
| Open   | Fixture module prose still needs live quality review. | Run prose rubric and AI council once provider output exists.                                 |

## Tracking Targets

Future implementation should track:

- contest brief source, retrieval date, deadline, prize, rules, eligibility, prompt;
- story seed, protagonist, antagonist, desire, taboo, genre lane;
- episode beat maps, cliffhangers, payoff windows, and debt age;
- AI council prompts, model names, outputs, failures, and accepted changes;
- prose review scores and rejection reasons;
- decisions made by the writer versus suggestions made by AI.
