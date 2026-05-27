<!-- Created: 2026-05-26 06:16 -->

# AGENTS.md - Core

This folder contains contracts, domain rules, and ports. Keep it pure.

## Rules

- No Svelte imports.
- No network calls.
- No filesystem calls.
- No provider SDK imports.
- No UI text that only exists for presentation styling.
- No heuristic creative output positioned as production AI.

## Contracts

Update contracts before implementation. Every contract should describe:

- input shape
- output shape
- error shape
- tracking or evidence fields when decisions are research-backed

Validation belongs close to contracts. When validating lists of selected features, validate uniqueness as well as length.

## Domain Logic

Domain logic can score, validate, classify, and transform. It should not pretend to be creative judgment. If a result needs taste, prose, or story invention, represent that as a port boundary.

## Tests

Every core rule needs a focused unit test. Tests should prove failure cases, not only happy paths.
