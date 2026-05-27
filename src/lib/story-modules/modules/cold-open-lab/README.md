<!-- Created: 2026-05-26 13:46 -->

# Cold Open Lab

Generates and evaluates first-minute opening variants for serial audio acquisition.

Mode rules:

- `fixture` and `demo` may return deterministic fixture output.
- `live` fails closed until a provider adapter exists.
- Prompt text is owned in `prompts.ts` and versioned by `COLD_OPEN_LAB_PROMPT_VERSION`.

Quality gates:

- first-minute clarity
- genre promise
- audio readability
