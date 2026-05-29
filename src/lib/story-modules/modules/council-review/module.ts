// Created: 2026-05-26 14:50

import {
	councilReviewInputSchema,
	councilReviewOutputSchema,
	type CouncilReviewInput,
	type CouncilReviewOutput
} from './contract';
import { councilReviewFixtureOutput } from './fixtures';
import { COUNCIL_REVIEW_PROMPT_VERSION } from './prompts';
import type { StoryModule } from '$lib/story-modules/types';
import { createFixtureProvenance, moduleCompletedEvent } from '$lib/story-modules/types';

export const councilReviewModule: StoryModule<CouncilReviewInput, CouncilReviewOutput> = {
	id: 'council-review',
	version: '1.0.0',
	label: 'Council Review',
	category: 'strategy',
	inputSchema: councilReviewInputSchema,
	outputSchema: councilReviewOutputSchema,
	requiredState: ['contestBrief', 'protagonist', 'desireTaboo', 'secrets', 'rules'],
	promptVersion: COUNCIL_REVIEW_PROMPT_VERSION,
	qualityGates: ['role-evidence', 'revision-move', 'contest-fit'],
	async run(context) {
		if (context.mode === 'live') {
			return {
				status: 'failed',
				summary: 'Council Review requires a live AI provider before production generation.',
				issues: [
					{
						code: 'PROVIDER_UNAVAILABLE',
						message: 'No live AI adapter is wired for Council Review.',
						severity: 'error'
					}
				],
				provenance: createFixtureProvenance(councilReviewModule, context),
				trackingEvents: [
					{
						type: 'quality-rejection',
						moduleId: 'council-review',
						subjectId: 'council-review',
						summary: 'Failed closed instead of substituting fixture council output in live mode.'
					}
				]
			};
		}

		return {
			status: 'success',
			output: councilReviewFixtureOutput,
			summary:
				'Six council roles reviewed the accepted story artifacts and named one revision move.',
			issues: [],
			provenance: createFixtureProvenance(councilReviewModule, context),
			trackingEvents: [
				moduleCompletedEvent('council-review', 'Council review fixture output accepted.')
			]
		};
	}
};
