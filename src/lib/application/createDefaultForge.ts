// Created: 2026-05-26 01:22

import { DeterministicStoryIntelligence } from '$lib/adapters/ai/deterministicStoryIntelligence';
import { InMemoryContestResearchRepository } from '$lib/adapters/research/inMemoryContestResearchRepository';
import { ForgeContestStory } from '$lib/application/forgeContestStory';
import { defaultForgeRequest } from '$lib/application/defaultForgeRequest';
import { defaultStoryModuleRegistry } from '$lib/story-modules/registry';

export function createDefaultForge(): ForgeContestStory {
	return new ForgeContestStory(
		new InMemoryContestResearchRepository(),
		new DeterministicStoryIntelligence(),
		defaultStoryModuleRegistry
	);
}

export { defaultForgeRequest };
