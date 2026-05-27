// Created: 2026-05-26 13:56

import { DeterministicStoryIntelligence } from '$lib/adapters/ai/deterministicStoryIntelligence';
import { InMemoryContestResearchRepository } from '$lib/adapters/research/inMemoryContestResearchRepository';
import { defaultForgeRequest } from '$lib/application/createDefaultForge';
import { createStoryStateFromForgeRequest } from '$lib/core/story-state/storyStateValidation';

export function createModuleFixtureContext(input: unknown) {
	const brief = new InMemoryContestResearchRepository().findById(defaultForgeRequest.contestId);

	if (!brief) {
		throw new Error('Default contest brief missing.');
	}

	const pilot = new DeterministicStoryIntelligence().pilot(defaultForgeRequest, brief);

	return {
		input,
		storyState: createStoryStateFromForgeRequest(defaultForgeRequest, brief, pilot),
		contestBrief: brief,
		mode: 'fixture' as const,
		now: new Date('2026-05-26T13:56:00.000Z')
	};
}
