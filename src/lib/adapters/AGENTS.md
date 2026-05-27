<!-- Created: 2026-05-26 06:16 -->

# AGENTS.md - Adapters

Adapters connect ports to external systems or local test doubles.

## AI Adapters

Production creative behavior belongs in live AI adapters. A deterministic adapter may exist only for tests, fixtures, and local demo rendering.

Production AI adapters must:

- return contract-shaped data;
- preserve raw provider errors in logs or diagnostics;
- fail closed when unavailable;
- mark partial results clearly;
- never silently replace failed AI output with heuristic creative text;
- expose model/provider metadata where useful for auditability.

## Research Adapters

Research-backed claims need source names, URLs, and confidence labels. If contest rules can drift, record retrieval date or mark the claim as stale-risk.

## Provider Changes

When adding Gemini, Claude, Grok, OpenAI, or another provider:

1. Implement a port.
2. Add a fake/test adapter.
3. Add provider error tests.
4. Update `docs/AI_ORCHESTRATION.md`.
5. Update `docs/CHANGELOG.md`.
