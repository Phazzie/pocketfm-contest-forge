<!-- Created: 2026-05-26 14:58 -->

# AGENTS.md - Story Modules

Story modules are pluggable creative tools. Keep them modular and schema-backed.

## Rules

- Every module owns `contract.ts`, `prompts.ts`, `fixtures.ts`, `module.ts`, `module.spec.ts`, and `README.md`.
- Use runtime schemas for input and output.
- Prompt text must be versioned and module-owned.
- Every result must include status, issues, provenance, and tracking events.
- `live` mode must fail closed until a real provider adapter exists.
- Do not register a scaffolded module until placeholders are replaced with useful contracts, fixtures, and tests.
