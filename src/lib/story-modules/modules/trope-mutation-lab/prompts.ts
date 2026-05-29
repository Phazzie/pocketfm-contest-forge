// Created: 2026-05-26 13:52

import type { TropeMutationLabInput } from './contract';
import type {
	SerializableProviderInput,
	StoryModuleProviderMessage
} from '$lib/core/ports/storyModuleProviderPort';

export const TROPE_MUTATION_LAB_PROMPT_VERSION = 'trope-mutation-lab.v4';

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
				'The mutationRule must include at least one explicit rule-change cue word: except, instead, invert, mutation, only, reverse, rule, subvert, or twist.',
				'Do not generate a mutationRule that only restates the premise, setting, emotion, or benefit without a visible rule-change cue.',
				'The preservedPromise must name how the mandatory contest elements still remain legible.',
				'The serialEngine must explain the repeatable episode machine created by the mutation.',
				'The sceneProof must be one concrete playable scene with named people, place, action, and cost.',
				'The episodePressure array must include at least three repeatable episode pressures.',
				'Every episodePressure item must start with "Every episode", "Each episode", or "Whenever".',
				'Every episodePressure item must include at least one concrete cost word: betrayal, cost, debt, family, lover, name, price, public, relationship, reputation, secret, shame, status, or trust.',
				'Do not generate episodePressure items that only describe tone, escalation, benefits, theme, or suspense without a recurring cost.',
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
							'The familiar power reward only works when each public victory exposes a relationship debt.',
						preservedPromise:
							'How the genre lane and mandatory contest elements stay recognizable.',
						confusionGuardrail:
							'The line the writer must not cross before the audience understands the twist.',
						serialEngine:
							'How the mutation creates a repeatable episode-by-episode pressure machine.',
						sceneProof:
							'One concrete scene proving the mutation through action, public cost, and relationship pressure.',
						episodePressure: [
							'Every episode victory costs the protagonist public status, lover trust, or a named witness debt.',
							'Each episode repeats the mutated rule by making a family secret buy one payoff and create one price.',
							'Whenever the familiar trope pays off, the mutation adds a relationship betrayal or reputation cost.'
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
