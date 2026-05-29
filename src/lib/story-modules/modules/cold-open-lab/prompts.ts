// Created: 2026-05-26 13:46

import type { ColdOpenLabInput } from './contract';
import { GENERIC_WRITING_ADVICE_PHRASES } from '$lib/core/domain/proseQuality';
import type {
	SerializableProviderInput,
	StoryModuleProviderMessage
} from '$lib/core/ports/storyModuleProviderPort';

export const COLD_OPEN_LAB_PROMPT_VERSION = 'cold-open-lab.v2';

export const coldOpenLabPrompt = {
	system:
		'You are a serial-audio cold open editor. Return concrete first-minute story choices that can be performed aloud. Never give craft advice, praise, or abstract labels.',
	user: 'Use the supplied seed to create 3-5 usable cold-open variants. Every value must sound like a story-room note about this exact protagonist, seed-specific object, secret, room, witness, vow, debt, price, or public status wound.'
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
	const protagonistPromptName = promptSubjectName(input);

	return [
		{
			role: 'system',
			content: [
				coldOpenLabPrompt.system,
				`Prompt version: ${COLD_OPEN_LAB_PROMPT_VERSION}.`,
				'Return only valid JSON. Do not wrap the JSON in markdown.',
				'Do not include comments, markdown, bullets outside JSON, or extra prose.',
				'Use exactly one rejectionRisk value per variant: low, medium, or high.',
				'Each variant.text must be one complete sentence, 12-20 words, with no semicolon.',
				`Each variant.text must name ${protagonistPromptName} or another concrete subject, show first-minute scene pressure, and include a specific cost, debt, status wound, or relationship price.`,
				'Each firstMinuteQuestion must include its payoff path using a concrete clue, proof, cost, price, debt, consequence, or next-episode reveal.',
				'Every acquisitionStrategy, audioNote, winnerRationale, and rejectionNote must use scene-specific nouns from this seed, not general craft language.',
				`Never print these generic phrases in any JSON value: ${formatForbiddenGenericPhrases()}.`,
				'Produce usable story strategy: public action, private betrayal, concrete cost, and an audible image.'
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

function formatForbiddenGenericPhrases(): string {
	return GENERIC_WRITING_ADVICE_PHRASES.map((phrase) => `"${phrase}"`).join(', ');
}

function promptSubjectName(input: ColdOpenLabInput): string {
	return input.protagonistName.trim() || 'the protagonist';
}
