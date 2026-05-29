<!-- Created: 2026-05-26 06:16 -->

# Changelog

## Unreleased

- Hardened `council-review.v2` after production smoke reached the final module and rejected role
  advice without concrete revision costs or specific risk-if-ignored cues.
- Hardened `trope-mutation-lab.v4` after production smoke rejected a mutation rule without a
  visible inversion/subversion cue; live mutation rules must now include an explicit rule-change
  word.
- Expanded the `trope-mutation-lab.v4` prompt regression so it asserts the full accepted
  rule-change cue list and rejects weak conjunction-only rules such as `but`.
- Hardened `cliffhanger-futures.v2` after production smoke rejected payoff warnings that described
  volatility without naming audience frustration; live warnings must now start with an audience-risk
  prefix.
- Hardened `trope-mutation-lab.v2` after production smoke reached the module and rejected weak
  episode pressure; live pressure items must now start with a repeat cue and carry concrete
  recurring costs.
- Made the live Story Studio runner respect selected mechanisms before provider execution, returning
  locked artifacts for deselected live tools instead of spending xAI calls.
- Excluded the live-only `council-review` module from fixture/demo forge output until that path has
  an explicit fixture input contract.
- Made idle Story Studio lane changes render the selected contest brief's locked artifacts instead
  of continuing to show the default medieval brief.
- Expanded trope-mutation live quality review with genre-aware scene terms so non-medieval contest
  lanes are not rejected by a medieval-only proof vocabulary.
- Declared the Vercel function max duration and bounded route-level Story Studio provider timeouts
  so sequential live module hangs fail closed inside the deployment budget.
- Increased the route-level Story Studio provider budget after production smoke proved 45 seconds
  was too tight for `grok-4.20-multi-agent` cold-open generation.
- Added a remaining-time guard to the live Story Studio runner so it locks the next artifact before
  starting a provider call that could outlast the Vercel request budget.
- Added the runtime-schema-backed Story Module Platform with Zod contracts, module registry, module runner, provenance, statuses, issues, and tracking events.
- Converted `cold-open-lab`, `cliffhanger-futures`, `binge-debt-ledger`, and `trope-mutation-lab` into first-class modules with owned contracts, prompts, fixtures, tests, and README files.
- Added story-state contracts for protagonist, antagonist, supporting cast, desire/taboo, secrets, mechanics, episode history, debt ledgers, continuity facts, writer decisions, and accepted/rejected AI suggestions.
- Added `npm run scaffold:module` for generating new story module folders and tests.
- Added guard scripts for repo hygiene, registered module shape, live-mode fallback prevention, docs drift, and one-command UI verification.
- Added installable git hook templates for pre-commit and pre-push checks.
- Added GitHub Actions CI for `npm run verify` and UI smoke verification.
- Added a manual `Live AI Smoke` GitHub Actions workflow for proving deployed Grok output from a
  public URL after the access-code secret is configured.
- Added `npm run deploy:readiness` to audit main CI, open PRs, GitHub workflow/secret setup, Vercel
  linkage, and deployed smoke URL before claiming demo readiness.
- Gave the scaffold-module subprocess test a named explicit timeout to avoid false local hook
  failures under full verification load.
- Added stricter TypeScript and ESLint quality gates with documented escape-hatch enforcement.
- Removed the final explicit `any` from executable app code and tightened the type-escape guard to
  allow zero approved explicit `any` lines while using `unknown` at heterogeneous story-module
  registry boundaries.
- Updated pinned GitHub Actions dependencies to Node 24-compatible action releases.
- Hardened quality guard scripts so they do not count their own diagnostic strings as violations.
- Hardened quality PR review fixes for inline ESLint disable detection, explicit type-escape scanning,
  UI verification timeout validation, bounded HTTP probes, bounded browser smoke commands, and pinned
  least-privilege CI actions.
- Switched CI UI smoke verification to production preview mode after the verified build.
- Hardened UI verification cleanup so preview/dev server process groups are terminated after smoke.
- Replaced `adapter-auto` with explicit Vercel adapter configuration on Node 22.
- Added Vercel deployment runbook and server-only environment variable guidance.
- Extended UI verification startup tolerance for slower cold Vite starts.
- Hardened pre-push checks so nested verification commands do not inherit Git hook stdin.
- Added a deterministic lint runner that disables Node compile cache for ESLint on runtimes where it can hang.
- Added repo-local OpenAI Cookbook-style ExecPlan governance in `.agent/PLANS.md`.
- Converted the next autonomous execution plan into a living ExecPlan with progress, discoveries, decisions, recovery, and validation criteria.
- Added a public hosted Grok MVP ExecPlan covering PRs, CI, Vercel, provider boundaries, quality gates, and public-demo abuse controls.
- Added a self-contained next autonomous execution plan for the first live-AI-capable story module path.
- Added a production Story Studio ExecPlan for replacing the remaining user-facing fixture/demo
  scaffold with live, fail-closed story artifacts and locked states.
- Updated execution plan workspace paths after repo consolidation so future work starts from
  `/Users/hbpheonix/pocketfm`.
- Added the production Story Studio contract and initial live runner, including locked artifact
  states for modules that do not yet have live quality gates.
- Extracted shared story-module input builders so fixture/demo forge output and live Story Studio
  execution use the same module input assembly.
- Replaced the live executor's broad supported-module set with a module-specific quality-gate
  registry that enables live modules only after module-specific gates are added.
- Made `binge-debt-ledger` live-capable through provider prompt builders, quality-gate registry
  support, and Story Studio execution from accepted cold-open variants.
- Made `cliffhanger-futures` live-capable through provider prompt builders, quality-gate registry
  support, and Story Studio execution from accepted cold-open and debt-ledger artifacts.
- Made `trope-mutation-lab` live-capable through a stronger output contract, provider prompt
  builders, quality-gate registry support, and Story Studio execution from accepted live artifacts.
- Added `council-review` as a registered story module with six required council roles, provider
  prompt builders, quality-gate registry support, and Story Studio execution after accepted live
  artifacts.
- Updated live story-state writer decisions so provenance describes the live Story Studio module
  chain instead of the earlier cold-open-only slice.
- Moved the default forge request into a pure application module so production routes can populate
  controls without importing deterministic fixture forge wiring.
- Replaced the production page's deterministic forge plan with locked/live `StoryStudioRun`
  rendering and a server-side `runLiveStudio` action backed by `RunLiveStoryStudio`.
- Updated browser and live AI smoke checks to target the Story Studio UI and `runLiveStudio` action
  instead of the retired cold-open-only route action.
- Added contest brief freshness metadata with retrieved/stale dates, curated-source warnings, and
  route/UI rendering for source freshness.
- Replaced locale-formatted contest freshness dates with stable ISO labels to avoid Svelte SSR/client
  hydration drift.
- Added the story module provider port, fake-provider live executor, JSON repair, schema validation,
  provider provenance, and deterministic prose quality gate for `cold-open-lab`.
- Hardened the live module boundary after review so markdown-fenced JSON can repair once, fixture
  provenance cannot pass as live output, prose gates ignore machine slugs, and live execution is
  restricted to modules with configured quality gates.
- Added an executor-level provider timeout so a hung live provider fails closed instead of blocking
  a module run indefinitely.
- Added a server-side xAI Responses API story-module provider for `grok-4.20-multi-agent` with env
  validation, provider metadata, timeout handling, nested output extraction, and secret-safe tests.
- Added the first server-side live Grok UI path for `cold-open-lab`, including access-code gating,
  per-client demo rate limiting, preserved submitted input, and live module success/failure
  rendering.
- Updated story-state creation so live cold-open runs record their limited provider-backed scope
  instead of carrying the older fixture-only writer decision.
- Hardened the live demo rate limiter to prune expired client buckets and styled failed live Grok
  panel results consistently with other failed modules.
- Hardened live access review findings so denied access-code attempts are rate-limited, successful
  quota is consumed only after request validation, and live output clears when the story seed changes.
- Added `npm run ai:smoke`, an opt-in live AI smoke script for deployed/local URLs that verifies an
  accepted `xai` `cold-open-lab` result without running by default in CI.
- Hardened the live AI smoke script so it uses the SvelteKit action request header, times out hung
  requests, reports transport failures before parsing action envelopes, and exits with clean failure
  messages.
- Hardened deployed live AI smoke requests to send the target deployment as the `Origin` header and
  validate request inputs before posting to the SvelteKit action.
- Hardened live AI smoke entrypoint detection so runtimes without `import.meta.main` do not
  silently skip the deployed smoke and malformed entrypoint metadata fails closed.
- Extended the live AI smoke request timeout beyond the provider timeout so deployed smoke captures
  real provider success/failure instead of aborting early.
- Hardened the live `cold-open-lab.v2` prompt so Grok must produce short audio-readable variant
  sentences, visible payoff paths, and no prose-gate generic writing-advice phrases.
- Added defensive cold-open prompt subject fallback text so malformed blank protagonist input does
  not leak awkward interpolation into provider instructions.
- Kept user-controlled protagonist names out of cold-open system prompts; names stay in the JSON
  input block so adversarial text remains data.
- Proved the public production Grok path with `npm run ai:smoke` against
  `https://pocketfm-contest-forge.vercel.app`, returning accepted `xai`
  `cold-open-lab.v2` output.
- Added root `DESIGN.md` for the colorful Serial Story Studio UI direction and linked it from
  agent instructions.
- Fixed review findings for explicit protagonist handling, unique mechanism validation, and root lockfile hygiene.
- Updated the Svelte workbench to render module run results and fixture-demo provenance.
- Added autonomous work spec for the Story Module Platform.
- Added documentation governance with root and nested `AGENTS.md` files.
- Added prose quality rubric and rejection rules.
- Added active tracking ledger for review findings, product risks, and future story-state tracking.
- Added AI orchestration plan for live AI council behavior and fail-closed provider handling.
- Added lessons learned from the heuristic prototype review.
- Added `npm run verify` as a single core verification command.

## 2026-05-26

- Created isolated SvelteKit app `pocketfm-contest-forge`.
- Added hexagonal folders for contracts, domain, ports, application, adapters, and routes.
- Added contract tests, scoring tests, application use-case tests, and browser smoke test.
- Added initial Pocket FM contest research notes.
- Added deterministic prototype adapter and AI council prompt contract.
- Added interactive Svelte workbench UI.
