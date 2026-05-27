// Created: 2026-05-26 01:22

import type { MechanismId } from '$lib/core/contracts/contestForgeContract';

export interface MechanismDefinition {
	id: MechanismId;
	label: string;
	shortLabel: string;
	purpose: string;
	unconventionalMove: string;
	defaultArtifact: string;
	risk: string;
}

export const mechanismCatalog: MechanismDefinition[] = [
	{
		id: 'retention-black-box',
		label: 'Retention Black Box',
		shortLabel: 'Drop-off simulator',
		purpose:
			'Predict where a mobile audio listener mentally leaves, then rewrite the minute before it happens.',
		unconventionalMove:
			'Treat every scene as a survival test against a bored commuter, not as prose waiting to be admired.',
		defaultArtifact: 'Minute-by-minute heat curve with a required rupture before minute two.',
		risk: 'Can make scenes feel breathless if no intimacy beats are preserved.'
	},
	{
		id: 'cliffhanger-futures',
		label: 'Cliffhanger Futures Market',
		shortLabel: 'Ending market',
		purpose:
			'Generate multiple endings and rank them by curiosity debt, emotional debt, and next-episode liquidity.',
		unconventionalMove:
			'Make writers bet on which unanswered question will still hurt tomorrow morning.',
		defaultArtifact: 'Three episode endings with a futures price and volatility warning.',
		risk: 'High-volatility endings can erode trust if payoffs never arrive.'
	},
	{
		id: 'desire-lattice',
		label: 'Desire Lattice',
		shortLabel: 'Obsession graph',
		purpose:
			'Cross-wire what each major character wants, hides, needs, and is punished for wanting.',
		unconventionalMove: 'Build plot from incompatible hungers instead of from a list of events.',
		defaultArtifact: 'Four-character desire grid with one impossible bargain per episode.',
		risk: 'Too many hidden motives can blur the ear-level story.'
	},
	{
		id: 'binge-debt-ledger',
		label: 'Binge Debt Ledger',
		shortLabel: 'Promise ledger',
		purpose: 'Track every promise, reveal, secret, object, and humiliation that must be repaid.',
		unconventionalMove:
			'Run the story like a debt market: unresolved promises accrue interest and must either pay off or default.',
		defaultArtifact: 'Debt list with age, payoff window, and default penalty.',
		risk: 'Over-ledgering can make a draft mechanical unless surprise defaults are allowed.'
	},
	{
		id: 'audio-mouthfeel',
		label: 'Audio Mouthfeel Meter',
		shortLabel: 'Ear test',
		purpose: 'Score whether a line can be understood, remembered, and performed by voice actors.',
		unconventionalMove:
			'Optimize for spoken shape: short motives, named stakes, repeatable phrases, and breath-aware sentences.',
		defaultArtifact: 'Dialogue-to-narration ratio, repeatable hook phrases, and breath breaks.',
		risk: 'May flatten literary texture if every sentence is over-optimized.'
	},
	{
		id: 'trope-mutation-lab',
		label: 'Trope Mutation Lab',
		shortLabel: 'Trope inverter',
		purpose:
			'Keep the genre promise while making one sacred trope behave in a wrong but irresistible way.',
		unconventionalMove:
			'Do not avoid tropes. Put the most familiar trope under one bizarre legal, magical, or social constraint.',
		defaultArtifact: 'Expected trope, mutation rule, listener promise, and confusion guardrail.',
		risk: 'Mutation can become gimmick if it does not pressure the protagonist every episode.'
	},
	{
		id: 'cold-open-split-test',
		label: 'Cold Open Split Test',
		shortLabel: 'First-minute lab',
		purpose: 'Draft competing first-minute openings for shock, intimacy, status, and mystery.',
		unconventionalMove:
			'Write the first minute as if the listener can abandon the show with one thumb movement.',
		defaultArtifact: 'Three cold opens with different emotional acquisition strategies.',
		risk: 'A great cold open can overpromise a weaker series engine.'
	},
	{
		id: 'serial-dna',
		label: 'Serial DNA',
		shortLabel: 'Repeatable ritual',
		purpose:
			'Install a signature object, line, ritual, or sound cue that makes the series instantly recognizable.',
		unconventionalMove:
			'Create a tiny repeatable ritual listeners can anticipate before the plot earns a fandom.',
		defaultArtifact: 'Signature ritual, forbidden variation, and escalation schedule.',
		risk: 'Rituals become cheesy if they do not change meaning under pressure.'
	}
];

export function findMechanism(id: MechanismId): MechanismDefinition {
	const mechanism = mechanismCatalog.find((candidate) => candidate.id === id);

	if (!mechanism) {
		throw new Error(`Unknown mechanism: ${id}`);
	}

	return mechanism;
}
