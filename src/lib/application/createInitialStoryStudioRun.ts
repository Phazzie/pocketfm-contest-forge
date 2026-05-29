// Created: 2026-05-29 12:20

import type { ContestBrief } from '$lib/core/contracts/contestForgeContract';
import {
	createContestFreshnessFromBrief,
	createLockedStoryStudioArtifact,
	storyStudioArtifactIds,
	storyStudioArtifactLabels,
	summarizeStoryStudioArtifacts,
	type StoryStudioRun
} from '$lib/core/contracts/storyStudioContract';

export function createInitialStoryStudioRun(
	brief: ContestBrief,
	requestedAt = new Date()
): StoryStudioRun {
	const artifacts = storyStudioArtifactIds.map((id) =>
		createLockedStoryStudioArtifact({
			id,
			summary: `${storyStudioArtifactLabels[id]} is waiting for a live Story Studio run.`,
			nextAction: {
				label: 'Run Story Studio',
				reason: 'This artifact is produced only by the live provider-backed Story Studio path.',
				retryable: true
			}
		})
	);

	return {
		generationMode: 'live-ai',
		mode: 'production',
		brief,
		requestedAt: requestedAt.toISOString(),
		artifacts,
		qualitySummary: summarizeStoryStudioArtifacts(artifacts),
		contestFreshness: createContestFreshnessFromBrief(brief, requestedAt),
		trackingEvents: []
	};
}
