// Created: 2026-05-29 12:20

import { describe, expect, it } from 'vitest';
import { createInitialStoryStudioRun } from '$lib/application/createInitialStoryStudioRun';
import { defaultForgeRequest } from '$lib/application/defaultForgeRequest';
import { InMemoryContestResearchRepository } from '$lib/adapters/research/inMemoryContestResearchRepository';
import { storyStudioArtifactIds } from '$lib/core/contracts/storyStudioContract';

describe('create initial Story Studio run', () => {
	it('returns locked production artifacts without fixture prose', () => {
		const brief = new InMemoryContestResearchRepository().findById(defaultForgeRequest.contestId);

		if (!brief) throw new Error('Expected default contest brief.');

		const run = createInitialStoryStudioRun(brief, new Date('2026-05-29T12:20:00.000Z'));

		expect(run.generationMode).toBe('live-ai');
		expect(run.mode).toBe('production');
		expect(run.artifacts.map((artifact) => artifact.id)).toEqual(storyStudioArtifactIds);
		expect(run.artifacts.every((artifact) => artifact.status === 'locked')).toBe(true);
		expect(run.artifacts.every((artifact) => artifact.result === undefined)).toBe(true);
		expect(run.qualitySummary.locked).toBe(storyStudioArtifactIds.length);
	});
});
