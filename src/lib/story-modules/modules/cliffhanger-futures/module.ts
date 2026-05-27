// Created: 2026-05-26 13:48

import {
	cliffhangerFuturesInputSchema,
	cliffhangerFuturesOutputSchema,
	type CliffhangerFuturesInput,
	type CliffhangerFuturesOutput
} from './contract';
import { cliffhangerFuturesFixtureOutput } from './fixtures';
import { CLIFFHANGER_FUTURES_PROMPT_VERSION } from './prompts';
import type { StoryModule } from '$lib/story-modules/types';
import { createFixtureProvenance, moduleCompletedEvent } from '$lib/story-modules/types';

export const cliffhangerFuturesModule: StoryModule<
	CliffhangerFuturesInput,
	CliffhangerFuturesOutput
> = {
	id: 'cliffhanger-futures',
	version: '1.0.0',
	label: 'Cliffhanger Futures',
	category: 'retention',
	inputSchema: cliffhangerFuturesInputSchema,
	outputSchema: cliffhangerFuturesOutputSchema,
	requiredState: ['episodeHistory', 'debts.open', 'contestBrief'],
	promptVersion: CLIFFHANGER_FUTURES_PROMPT_VERSION,
	qualityGates: ['no-fake-cliffhangers', 'payoff-path-exists', 'next-episode-pull'],
	async run(context) {
		if (context.mode === 'live') {
			return {
				status: 'failed',
				summary: 'Cliffhanger Futures requires a live AI provider before production generation.',
				issues: [
					{
						code: 'PROVIDER_UNAVAILABLE',
						message: 'No live AI adapter is wired for Cliffhanger Futures.',
						severity: 'error'
					}
				],
				provenance: createFixtureProvenance(cliffhangerFuturesModule, context),
				trackingEvents: [
					{
						type: 'quality-rejection',
						moduleId: 'cliffhanger-futures',
						subjectId: 'cliffhanger-futures',
						summary: 'Failed closed instead of creating fake cliffhanger prices.'
					}
				]
			};
		}

		return {
			status: 'success',
			output: personalizeOutput(cliffhangerFuturesFixtureOutput, context.input.episodeTitle),
			summary: 'Priced three cliffhangers and recommended the one with the strongest payoff path.',
			issues: [],
			provenance: createFixtureProvenance(cliffhangerFuturesModule, context),
			trackingEvents: [
				{
					type: 'promise-created',
					moduleId: 'cliffhanger-futures',
					subjectId: 'enemy-knows-name',
					summary:
						'The episode ending creates a high-value question with an episode-two payoff path.',
					episodeNumber: context.input.episodeNumber
				},
				moduleCompletedEvent(
					'cliffhanger-futures',
					'Cliffhanger futures fixture output accepted in demo mode.'
				)
			]
		};
	}
};

function personalizeOutput(
	output: CliffhangerFuturesOutput,
	episodeTitle: string
): CliffhangerFuturesOutput {
	return {
		...output,
		marketRationale: `${output.marketRationale} Source episode: ${episodeTitle}.`
	};
}
