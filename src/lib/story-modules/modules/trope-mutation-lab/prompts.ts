// Created: 2026-05-26 13:52

import type { TropeMutationLabInput } from './contract';
import type {
	SerializableProviderInput,
	StoryModuleProviderMessage
} from '$lib/core/ports/storyModuleProviderPort';

export const TROPE_MUTATION_LAB_PROMPT_VERSION = 'trope-mutation-lab.v1';

export const tropeMutationLabPrompt = {
	system:
		'Mutate one familiar genre trope without breaking the listener promise. The doorway must be familiar; the room must be strange, playable, and serial.',
	user: 'Given the contest genre, mandatory elements, premise, emotional promise, and taboo lever, return expected trope, mutation rule, preserved promise, confusion guardrail, serial engine, scene proof, episode pressure, and rejection note.'
};

export function buildTropeMutationLabProviderInput(
	input: TropeMutationLabInput
): SerializableProviderInput {
	return {
		contestGenre: input.contestGenre,
		contestName: input.contestName,
		mandatoryElements: input.mandatoryElements,
		seedPremise: input.seedPremise,
		emotionalPromise: input.emotionalPromise,
		tabooLever: input.tabooLever,
		riskTolerance: input.riskTolerance
	};
}

export function buildTropeMutationLabProviderMessages(
	input: TropeMutationLabInput
): StoryModuleProviderMessage[] {
	return [
		{
			role: 'system',
			content: [
				tropeMutationLabPrompt.system,
				`Prompt version: ${TROPE_MUTATION_LAB_PROMPT_VERSION}.`,
				'Return only valid JSON. Do not wrap the JSON in markdown.',
				'Do not include comments, markdown, bullets outside JSON, or extra prose.',
				'The expectedTrope must name a familiar genre doorway the target audience recognizes.',
				'The mutationRule must invert or subvert that trope while preserving the contest lane.',
				'The preservedPromise must name how the mandatory contest elements still remain legible.',
				'The serialEngine must explain the repeatable episode machine created by the mutation.',
				'The sceneProof must be one concrete playable scene with named people, place, action, and cost.',
				'The episodePressure array must include at least three repeatable episode pressures.',
				'Do not use generic craft phrases such as strong hook, raise the stakes, emotional stakes, or build suspense.'
			].join('\n')
		},
		{
			role: 'user',
			content: [
				tropeMutationLabPrompt.user,
				'Output shape:',
				JSON.stringify(
					{
						expectedTrope: 'The familiar genre trope being used as the doorway.',
						mutationRule:
							'The new rule that twists the trope without breaking the listener promise.',
						preservedPromise:
							'How the genre lane and mandatory contest elements stay recognizable.',
						confusionGuardrail:
							'The line the writer must not cross before the audience understands the twist.',
						serialEngine:
							'How the mutation creates a repeatable episode-by-episode pressure machine.',
						sceneProof:
							'One concrete scene proving the mutation through action, public cost, and relationship pressure.',
						episodePressure: [
							'Pressure one that can recur in later episodes.',
							'Pressure two that escalates the mutation.',
							'Pressure three that protects the familiar promise.'
						],
						rejectionNote: 'Why this mutation might fail contest readers if pushed too far.'
					},
					null,
					2
				),
				'Input:',
				JSON.stringify(buildTropeMutationLabProviderInput(input), null, 2)
			].join('\n')
		}
	];
}
