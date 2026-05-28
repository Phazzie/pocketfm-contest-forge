<!-- Created: 2026-05-27 22:21 -->

# Codex Execution Plans

This file defines the ExecPlan standard for `pocketfm-contest-forge`. Use it for complex features,
significant refactors, live AI provider work, story-module architecture changes, cross-boundary
contracts, or any multi-hour autonomous run.

An ExecPlan is a self-contained, living implementation plan. It must let a fresh agent or novice
human start from the current checkout and the plan file alone, understand why the work matters,
make the same decisions, implement the work, validate it, and hand it off cleanly.

## Required Behavior

Every ExecPlan must:

- explain the user-visible outcome and how to see it working;
- include all required repo context instead of relying on chat history;
- name exact files, modules, commands, and expected validation results;
- define terms of art in plain language the first time they appear;
- resolve architecture, schema, provider, interface, and testing decisions inside the plan;
- maintain `Progress`, `Surprises & Discoveries`, `Decision Log`, and
  `Outcomes & Retrospective` as living sections;
- keep fixture/demo behavior, fail-closed live behavior, and story-module contracts explicit when
  the work touches AI generation.

## Required Sections

Task-specific ExecPlans must contain these sections:

1. `Purpose / Big Picture`
2. `Progress`
3. `Surprises & Discoveries`
4. `Decision Log`
5. `Outcomes & Retrospective`
6. `Context and Orientation`
7. `Plan of Work`
8. `Concrete Steps`
9. `Validation and Acceptance`
10. `Idempotence and Recovery`
11. `Artifacts and Notes`
12. `Interfaces and Dependencies`

Use checkbox bullets only in `Progress`. Narrative sections should be prose-first, with short lists
only where they prevent ambiguity.

## Formatting

If a Markdown file contains only the ExecPlan, do not wrap it in a code fence. If an ExecPlan is
embedded inside another document, wrap the whole plan in a single `md` fenced block and do not nest
triple-backtick fences.

Use repository-relative paths. Show commands with the working directory. When a command has an
important expected result, include a short expected transcript or a sentence explaining how to
interpret success.

## Pocket FM Forge Defaults

For this repo, an ExecPlan must preserve these defaults unless the user explicitly changes them:

- `src/routes` may render state, but domain rules stay in `src/lib/core` or `src/lib/application`.
- Provider code stays behind `src/lib/core/ports` and `src/lib/adapters`.
- Story modules own runtime schemas, prompt versions, fixtures, provenance, and tracking events.
- Live AI must fail closed. It must not silently return fixture, deterministic, or heuristic
  creative output.
- Unit tests must not require a real API key.
- New or changed story modules should use `npm run scaffold:module` unless the plan explains why
  manual edits are safer.
- Run `npm run verify` before handoff. Run `npm run verify:ui` when UI changes.

## Living Document Rules

Update the ExecPlan while working:

- Add timestamped progress at every stopping point.
- Add discoveries with short evidence when behavior differs from expectations.
- Add every material decision and rationale to `Decision Log`.
- Add an outcome note when a milestone or the whole plan completes.
- If the implementation changes direction, update all affected sections before continuing.

The final handoff must summarize changed files, tests run, remaining risks, and the next best work.
