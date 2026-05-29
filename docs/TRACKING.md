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

| Status | Item                                                   | Next Action                                                                                                                                  |
| ------ | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Done   | Fake-provider live module boundary is absent.          | Added provider port, live executor, JSON repair, schema validation, prose gate, and fake-provider tests for `cold-open-lab`.                 |
| Done   | Real Grok provider adapter is still absent.            | Added xAI Responses API adapter behind the provider port with env validation, provider metadata, timeout handling, and secret-safe tests.    |
| Open   | Story-state contract is in-memory only.                | Add persistence after storage choice is made.                                                                                                |
| Open   | Fixture module prose still needs live quality review.  | Run prose rubric and AI council once provider output exists.                                                                                 |
| Open   | Future multi-hour work needs stricter execution plans. | Use `.agent/PLANS.md` and the global `exec-plan` skill for complex autonomous runs.                                                          |
| Done   | Type safety should enforce a literal no-`any` policy.  | Removed the registry `any` escape; heterogeneous module lookup uses `unknown`, and `guard:type-escape-budget` allows zero approved `any`.    |
| Done   | Main branch needs remote quality enforcement.          | Branch protection requires PRs, conversation resolution, and the `Verify` status check.                                                      |
| Open   | Low npm audit finding exists through SvelteKit cookie. | Track upstream fix; CI should fail on moderate and higher vulnerabilities.                                                                   |
| Doing  | Public MVP needs Vercel and Grok delivery plan.        | Public deployment, Grok transport, server action, and access gate exist; next step is stable deployed smoke with prose-gate-accepted output. |
| Open   | CI UI smoke currently relies on preview build output.  | Keep `npm run verify` before `npm run verify:ui` in CI or add an explicit build preflight.                                                   |
| Open   | CI UI smoke must not leave server children running.    | Keep process-group cleanup in `scripts/verify-ui.mjs` covered by local and remote smoke.                                                     |
| Done   | Vercel project is not yet proven from public URL.      | Production URL is deployed and `npm run deploy:readiness` passes against `https://pocketfm-contest-forge.vercel.app`.                        |
| Done   | Vercel CLI is not authenticated in the local shell.    | Vercel CLI is authenticated as `phazzie` and the local project link is active.                                                               |
| Doing  | Real deployed Grok smoke is not yet proven.            | The deployed action reaches xAI and fails closed on weak prose; harden `cold-open-lab.v2`, redeploy, and rerun smoke.                        |
| Done   | Live Grok adapter is not wired into UI/server action.  | Added server-only `runLiveColdOpen` action, preserves submitted input, and renders live module success/failure separately.                   |
| Done   | GitHub Actions warns about Node 20 action runtime.     | Updated pinned `actions/checkout` and `actions/setup-node` refs to Node 24-compatible releases.                                              |
| Done   | Deployed live smoke was blocked by SvelteKit CSRF.     | Smoke script now sends the target deployment as `Origin` while keeping the action header and access-code gate.                               |
| Done   | Local live smoke could false-pass on Node 23.          | Smoke script now falls back to resolved entrypoint detection when `import.meta.main` is unavailable.                                         |
| Done   | Live smoke client timed out before provider timeout.   | Smoke script timeout now exceeds the xAI provider timeout so failures come from the live action path.                                        |

## Architecture Review Notes

| Status | Item                                                         | Finding                                                                                                                                            | Follow-Up                                                                                               |
| ------ | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Done   | Provider diagnostics do not belong inside module fixtures.   | Kept provider orchestration in `LiveModuleExecutor` instead of expanding module `run()` implementations.                                           | Real adapters should implement `StoryModuleProvider` under `src/lib/adapters`.                          |
| Done   | JSON repair policy needed a single owner.                    | Live executor owns exactly one balanced-object repair attempt and records `repairAttempts` in provenance.                                          | Do not duplicate repair policy inside modules or provider adapters.                                     |
| Done   | Review found live boundary acceptance loopholes.             | Markdown-fenced JSON, blocked provider provenance, hung provider timeout, slug leakage, and unsupported module gates now have tests.               | Keep adding review-derived cases before introducing the real Grok adapter.                              |
| Done   | Provider adapter should not own JSON repair or acceptance.   | xAI adapter returns raw model text and diagnostics only; `LiveModuleExecutor` still owns repair, schema validation, prose quality, and provenance. | Keep provider adapters as transport code, not story-module policy.                                      |
| Done   | Public demo needs abuse control before paid AI calls.        | `runLiveColdOpen` requires `STORY_AI_ACCESS_CODE` and uses a small per-client in-memory rate limit before calling the provider.                    | Replace with durable auth/rate limiting before broader public usage.                                    |
| Done   | Review found live demo polish issues.                        | Expired in-memory rate buckets now prune once the demo map grows, and failed live Grok panels use the same failure styling as failed modules.      | Keep temporary demo controls small until durable auth is chosen.                                        |
| Done   | Review found live access quota loopholes.                    | Failed access-code attempts are rate-limited, paid-call quota is consumed after request validation, and stale live output clears when inputs edit. | Keep access and quota checks separate in future auth work.                                              |
| Open   | Prose quality gate is deterministic and intentionally crude. | It blocks obvious generic/prose-invalid output, but it is not a substitute for model critique or taste.                                            | Add AI council critique after Grok adapter exists; keep deterministic gate as minimum acceptance floor. |

## Tracking Targets

Future implementation should track:

- contest brief source, retrieval date, deadline, prize, rules, eligibility, prompt;
- story seed, protagonist, antagonist, desire, taboo, genre lane;
- episode beat maps, cliffhangers, payoff windows, and debt age;
- AI council prompts, model names, outputs, failures, and accepted changes;
- prose review scores and rejection reasons;
- decisions made by the writer versus suggestions made by AI.
