// Created: 2026-05-26 13:46

import type { ColdOpenLabInput } from './contract';
import type {
	SerializableProviderInput,
	StoryModuleProviderMessage
} from '$lib/core/ports/storyModuleProviderPort';

export const COLD_OPEN_LAB_PROMPT_VERSION = 'cold-open-lab.v1';

export const coldOpenLabPrompt = {
	system:
		'Generate 3-5 first-minute openings for a serial audio contest submission. Preserve the genre promise, name concrete stakes, and reject generic atmosphere.',
	user: 'Given the seed, contest lane, protagonist, emotional promise, and taboo lever, produce cold open variants with acquisition strategy, first-minute question, audio note, rejection risk, winner rationale, and rejection notes.'
};

export function buildColdOpenLabProviderInput(input: ColdOpenLabInput): SerializableProviderInput {
	return {
		workingTitle: input.workingTitle,
		protagonistName: input.protagonistName,
		logline: input.logline,
		emotionalPromise: input.emotionalPromise,
		tabooLever: input.tabooLever,
		contestName: input.contestName,
		contestLane: input.contestLane,
		mandatoryElements: input.mandatoryElements,
		riskTolerance: input.riskTolerance
	};
}

export function buildColdOpenLabProviderMessages(
	input: ColdOpenLabInput
): StoryModuleProviderMessage[] {
	return [
		{
			role: 'system',
			content: [
				coldOpenLabPrompt.system,
				`Prompt version: ${COLD_OPEN_LAB_PROMPT_VERSION}.`,
				'Return only valid JSON. Do not wrap the JSON in markdown.',
				'Use exactly one rejectionRisk value per variant: low, medium, or high.',
				'Each variant must name the protagonist or another concrete subject, show first-minute scene pressure, and include a visible payoff path for any cliffhanger question.',
				'Reject generic writing advice. Produce usable story strategy, not encouragement.'
			].join('\n')
		},
		{
			role: 'user',
			content: [
				coldOpenLabPrompt.user,
				'Output shape:',
				JSON.stringify(
					{
						variants: [
							{
								id: 'speakable-slug',
								text: 'One concrete cold-open sentence.',
								acquisitionStrategy: 'Why this grabs a mobile audio listener.',
								firstMinuteQuestion: 'The question plus a payoff path.',
								audioNote: 'Performance note for voice clarity.',
								rejectionRisk: 'low'
							}
						],
						winnerId: 'id from variants',
						winnerRationale: 'Why this variant should lead the pilot.',
						rejectionNotes: ['Specific pitfalls to avoid.']
					},
					null,
					2
				),
				'Input:',
				JSON.stringify(buildColdOpenLabProviderInput(input), null, 2)
			].join('\n')
		}
	];
}
