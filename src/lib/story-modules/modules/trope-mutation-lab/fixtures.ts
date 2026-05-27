// Created: 2026-05-26 13:52

import type { TropeMutationLabInput, TropeMutationLabOutput } from './contract';

export const tropeMutationLabFixtureInput: TropeMutationLabInput = {
	contestGenre: 'medieval-fantasy',
	contestName: 'Medieval Fantasy Power Hook',
	mandatoryElements: ['cursed crown', 'court betrayal'],
	seedPremise:
		'Mara Vey weaponizes a crown that devours the name of every ruler who lies, but every victory makes desire more dangerous.',
	emotionalPromise: 'Every victory makes desire more dangerous.',
	tabooLever: 'loving the person who benefited from your erasure',
	riskTolerance: 4
};

export const tropeMutationLabFixtureOutput: TropeMutationLabOutput = {
	expectedTrope: 'the rightful heir proves identity and reclaims the throne',
	mutationRule:
		'the crown only recognizes whoever can make the public believe the cruelest version of the truth',
	preservedPromise: 'the listener still gets court betrayal, cursed power, and public revenge.',
	confusionGuardrail:
		'State the rule through trial, punishment, and witness memory before adding royal history.',
	episodePressure: [
		'Every victory must cost Mara a witness, name, or intimate memory.',
		'Every public proof must create a private accusation.',
		'Every romantic advance must strengthen the antagonist legal claim.'
	],
	rejectionNote:
		'Do not invert the trope so far that the throne no longer matters; the familiar power fantasy must remain legible.'
};
