<!-- Created: 2026-05-26 06:16 -->

# Prose Quality

This app exists to improve contest-winning serial prose, not to produce plausible filler.

## Quality Bar

Good output must be:

- specific: names, stakes, objects, secrets, and costs are concrete;
- surprising: at least one familiar trope is mutated in a way that creates story pressure;
- playable by voice: sentences can be understood without visual context;
- serializable: the idea can generate many episodes without stalling;
- emotionally legible: desire, shame, fear, envy, status, or love is clear;
- contest-aware: the concept fits the current contest lane and genre promise;
- useful: the writer can act on it immediately.

## Rejection Rules

Reject or regenerate output when it:

- sounds like a generic writing-advice blog;
- praises the idea instead of improving it;
- uses abstract stakes without scene pressure;
- creates fake cliffhangers with no payoff path;
- adds lore before desire or conflict;
- produces prose that cannot be spoken cleanly;
- repeats the same character dynamic under new labels;
- hides uncertainty about contest rules or source freshness.

`src/lib/core/domain/proseQuality.ts` implements the current deterministic minimum gate for live
module output. It rejects obvious generic advice, abstract scene pressure, fake cliffhanger
questions without payoff paths, missing named/concrete subjects, and missing cost/debt/status or
relationship pressure. It may emit audio-readability warnings for long spoken sentences.

This gate is intentionally a floor, not a taste engine. Passing it means output is structurally
acceptable enough to show or critique; it does not prove that the story choice is excellent.

## AI Council Review

Before accepting major creative output, run or simulate these review roles:

- Listener Saboteur: where does a distracted listener leave?
- Trope Criminal: what familiar promise is being mutated?
- Debt Auditor: which promises are collectible, stale, or fraudulent?
- Voice Actor Ghost: can this be performed by ear?
- Contest Judge: does this satisfy the prompt while feeling more addictive than competitors?

## Prose Tracking

Track these story assets when they exist:

- protagonist wound and public status problem;
- core desire and taboo lever;
- central object, rule, or system mechanic;
- cold open variants and winner rationale;
- episode-end cliffhanger and payoff window;
- open promises and debt age;
- named characters, secrets, and relationship state;
- repeated ritual, phrase, sound cue, or serial DNA.
