// Created: 2026-05-26 13:46

import {
	coldOpenLabInputSchema,
	coldOpenLabOutputSchema,
	type ColdOpenLabInput,
	type ColdOpenLabOutput
} from './contract';
import { coldOpenLabFixtureOutput } from './fixtures';
import { COLD_OPEN_LAB_PROMPT_VERSION } from './prompts';
import type { StoryModule } from '$lib/story-modules/types';
import { createFixtureProvenance, moduleCompletedEvent } from '$lib/story-modules/types';

export const coldOpenLabModule: StoryModule<ColdOpenLabInput, ColdOpenLabOutput> = {
	id: 'cold-open-lab',
	version: '1.0.0',
	label: 'Cold Open Lab',
	category: 'acquisition',
	inputSchema: coldOpenLabInputSchema,
	outputSchema: coldOpenLabOutputSchema,
	requiredState: ['protagonist', 'desireTaboo', 'contestBrief'],
	promptVersion: COLD_OPEN_LAB_PROMPT_VERSION,
	qualityGates: ['first-minute-clarity', 'genre-promise', 'audio-readability'],
	async run(context) {
		if (context.mode === 'live') {
			return {
				status: 'failed',
				summary: 'Cold Open Lab requires a live AI provider before production generation.',
				issues: [
					{
						code: 'PROVIDER_UNAVAILABLE',
						message: 'No live AI adapter is wired for Cold Open Lab.',
						severity: 'error'
					}
				],
				provenance: createFixtureProvenance(coldOpenLabModule, context),
				trackingEvents: [
					{
						type: 'quality-rejection',
						moduleId: 'cold-open-lab',
						subjectId: 'cold-open-lab',
						summary: 'Failed closed instead of substituting deterministic cold opens.'
					}
				]
			};
		}

		return {
			status: 'success',
			output: personalizeOutput(coldOpenLabFixtureOutput, context.input.protagonistName),
			summary: 'Selected a public identity rupture as the highest-clarity cold open.',
			issues: [],
			provenance: createFixtureProvenance(coldOpenLabModule, context),
			trackingEvents: [
				{
					type: 'promise-created',
					moduleId: 'cold-open-lab',
					subjectId: 'public-name-theft',
					summary:
						'The first minute promises identity theft, public status damage, and intimate betrayal.',
					episodeNumber: 1
				},
				moduleCompletedEvent('cold-open-lab', 'Cold open fixture output accepted in demo mode.')
			]
		};
	}
};

function personalizeOutput(output: ColdOpenLabOutput, protagonistName: string): ColdOpenLabOutput {
	if (protagonistName === 'Mara Vey') return output;

	return {
		...output,
		variants: output.variants.map((variant) => ({
			...variant,
			text: variant.text.replaceAll('Mara Vey', protagonistName)
		})),
		winnerRationale: output.winnerRationale.replaceAll('Mara', protagonistName)
	};
}
