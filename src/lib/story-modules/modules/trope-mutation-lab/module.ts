// Created: 2026-05-26 13:52

import {
	tropeMutationLabInputSchema,
	tropeMutationLabOutputSchema,
	type TropeMutationLabInput,
	type TropeMutationLabOutput
} from './contract';
import { tropeMutationLabFixtureOutput } from './fixtures';
import { TROPE_MUTATION_LAB_PROMPT_VERSION } from './prompts';
import type { StoryModule } from '$lib/story-modules/types';
import { createFixtureProvenance, moduleCompletedEvent } from '$lib/story-modules/types';

export const tropeMutationLabModule: StoryModule<TropeMutationLabInput, TropeMutationLabOutput> = {
	id: 'trope-mutation-lab',
	version: '1.0.0',
	label: 'Trope Mutation Lab',
	category: 'trope',
	inputSchema: tropeMutationLabInputSchema,
	outputSchema: tropeMutationLabOutputSchema,
	requiredState: ['contestBrief', 'protagonist', 'desireTaboo', 'rules'],
	promptVersion: TROPE_MUTATION_LAB_PROMPT_VERSION,
	qualityGates: ['familiar-doorway', 'strange-room', 'genre-promise'],
	async run(context) {
		if (context.mode === 'live') {
			return {
				status: 'failed',
				summary: 'Trope Mutation Lab requires a live AI provider before production generation.',
				issues: [
					{
						code: 'PROVIDER_UNAVAILABLE',
						message: 'No live AI adapter is wired for Trope Mutation Lab.',
						severity: 'error'
					}
				],
				provenance: createFixtureProvenance(tropeMutationLabModule, context),
				trackingEvents: [
					{
						type: 'quality-rejection',
						moduleId: 'trope-mutation-lab',
						subjectId: 'trope-mutation-lab',
						summary: 'Failed closed instead of inventing trope mutation without AI taste.'
					}
				]
			};
		}

		return {
			status: 'success',
			output: tropeMutationLabFixtureOutput,
			summary: 'Preserved the rightful-heir doorway while mutating how public belief crowns power.',
			issues: [],
			provenance: createFixtureProvenance(tropeMutationLabModule, context),
			trackingEvents: [
				{
					type: 'promise-created',
					moduleId: 'trope-mutation-lab',
					subjectId: 'belief-crowns-power',
					summary:
						'A familiar heir trope becomes a public belief rule with repeatable episode pressure.',
					episodeNumber: 1
				},
				moduleCompletedEvent(
					'trope-mutation-lab',
					'Trope mutation fixture output accepted in demo mode.'
				)
			]
		};
	}
};
