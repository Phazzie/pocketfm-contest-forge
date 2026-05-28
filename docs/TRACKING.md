<!-- Created: 2026-05-26 06:16 -->

# Tracking

Use this file for active issues, review findings, risks, and decisions that need follow-up.

## Active Review Findings

| Status | Priority | Item                                                                                   | Source       | Next Action                                                                                                           |
| ------ | -------- | -------------------------------------------------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------- |
| Done   | P2       | Default protagonist is derived from title words, producing "Crown weaponizes a crown." | Review       | Added explicit protagonist input, safer fixture default, and sanity test.                                             |
| Done   | P3       | Mechanism validation checks count, not uniqueness.                                     | Review       | Validates unique mechanism IDs and rejects duplicate selections.                                                      |
| Done   | P3       | Root `node_modules/.package-lock.json` contains local macOS install state.             | Review       | Root installed-tree metadata is no longer modified in this patch.                                                     |
| Done   | P3       | Root `package-lock.json` has accidental name casing churn.                             | Local status | Root package-lock is no longer modified in this patch.                                                                |
| Done   | P3       | Quality guards and CI need review-hardening before merge.                              | PR #1 review | Inline disable checks, type-escape scanning, UI probe/browser timeout validation, and pinned CI actions are hardened. |

## Product Risks

| Status    | Risk                                          | Why It Matters                                                    | Mitigation                                                                                                                          |
| --------- | --------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Mitigated | Heuristic creative output is user-facing.     | It can create false confidence and waste writer time.             | Current app labels output as fixture-demo; provider-bound live execution fails closed instead of substituting deterministic output. |
| Done      | Story mechanisms are not first-class modules. | New story tools will become switch cases and ad hoc UI rendering. | Four initial modules now run through registry and runtime schemas.                                                                  |
| Open      | Contest data can drift.                       | Bad rules create bad submissions.                                 | Add research refresh workflow with retrieval dates and stale warnings.                                                              |
| Open      | Scoring is heuristic.                         | Numeric confidence may look more authoritative than it is.        | Label scores as AI-audited only after live critique and calibration.                                                                |
| Mitigated | No persistence/story bible yet.               | Serial writing needs continuity tracking.                         | Story-state contract exists; persistence remains a future storage decision.                                                         |

## Active Follow-Up

| Status  | Item                                                   | Next Action                                                                                                                  |
| ------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Done    | Fake-provider live module boundary is absent.          | Added provider port, live executor, JSON repair, schema validation, prose gate, and fake-provider tests for `cold-open-lab`. |
| Open    | Real Grok provider adapter is still absent.            | Implement server-side xAI adapter behind the provider port with env validation and secret-safe tests.                        |
| Open    | Story-state contract is in-memory only.                | Add persistence after storage choice is made.                                                                                |
| Open    | Fixture module prose still needs live quality review.  | Run prose rubric and AI council once provider output exists.                                                                 |
| Open    | Future multi-hour work needs stricter execution plans. | Use `.agent/PLANS.md` and the global `exec-plan` skill for complex autonomous runs.                                          |
| Done    | Main branch needs remote quality enforcement.          | Branch protection requires PRs, conversation resolution, and the `Verify` status check.                                      |
| Open    | Low npm audit finding exists through SvelteKit cookie. | Track upstream fix; CI should fail on moderate and higher vulnerabilities.                                                   |
| Doing   | Public MVP needs Vercel and Grok delivery plan.        | Vercel adapter/config docs are in progress; Grok adapter remains a later PR.                                                 |
| Open    | CI UI smoke currently relies on preview build output.  | Keep `npm run verify` before `npm run verify:ui` in CI or add an explicit build preflight.                                   |
| Open    | CI UI smoke must not leave server children running.    | Keep process-group cleanup in `scripts/verify-ui.mjs` covered by local and remote smoke.                                     |
| Open    | Vercel project is not yet proven from public URL.      | Deploy this branch, verify preview URL, then connect production deployment from `main`.                                      |
| Blocked | Vercel CLI is not authenticated in the local shell.    | Run `vercel login` or provide `VERCEL_TOKEN`, then deploy from the repo root.                                                |

## Architecture Review Notes

| Status | Item                                                         | Finding                                                                                                                              | Follow-Up                                                                                               |
| ------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Done   | Provider diagnostics do not belong inside module fixtures.   | Kept provider orchestration in `LiveModuleExecutor` instead of expanding module `run()` implementations.                             | Real adapters should implement `StoryModuleProvider` under `src/lib/adapters`.                          |
| Done   | JSON repair policy needed a single owner.                    | Live executor owns exactly one balanced-object repair attempt and records `repairAttempts` in provenance.                            | Do not duplicate repair policy inside modules or provider adapters.                                     |
| Done   | Review found live boundary acceptance loopholes.             | Markdown-fenced JSON, blocked provider provenance, hung provider timeout, slug leakage, and unsupported module gates now have tests. | Keep adding review-derived cases before introducing the real Grok adapter.                              |
| Open   | Prose quality gate is deterministic and intentionally crude. | It blocks obvious generic/prose-invalid output, but it is not a substitute for model critique or taste.                              | Add AI council critique after Grok adapter exists; keep deterministic gate as minimum acceptance floor. |

## Tracking Targets

Future implementation should track:

- contest brief source, retrieval date, deadline, prize, rules, eligibility, prompt;
- story seed, protagonist, antagonist, desire, taboo, genre lane;
- episode beat maps, cliffhangers, payoff windows, and debt age;
- AI council prompts, model names, outputs, failures, and accepted changes;
- prose review scores and rejection reasons;
- decisions made by the writer versus suggestions made by AI.
