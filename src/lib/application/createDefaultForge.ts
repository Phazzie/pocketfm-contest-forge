// Created: 2026-05-26 01:22

import { DeterministicStoryIntelligence } from '$lib/adapters/ai/deterministicStoryIntelligence';
import { InMemoryContestResearchRepository } from '$lib/adapters/research/inMemoryContestResearchRepository';
import { ForgeContestStory } from '$lib/application/forgeContestStory';
import type { ForgeRequest } from '$lib/core/contracts/contestForgeContract';
import { defaultStoryModuleRegistry } from '$lib/story-modules/registry';

export function createDefaultForge(): ForgeContestStory {
	return new ForgeContestStory(
		new InMemoryContestResearchRepository(),
		new DeterministicStoryIntelligence(),
		defaultStoryModuleRegistry
	);
}

export const defaultForgeRequest: ForgeRequest = {
	contestId: 'medieval-fantasy',
	riskTolerance: 4,
	selectedMechanisms: [
		'retention-black-box',
		'cliffhanger-futures',
		'desire-lattice',
		'binge-debt-ledger',
		'audio-mouthfeel',
		'trope-mutation-lab',
		'cold-open-split-test',
		'serial-dna'
	],
	seed: {
		workingTitle: 'The Crown That Eats Names',
		protagonistName: 'Mara Vey',
		logline:
			'A disgraced royal poisoner discovers the kingdom crown rewrites memory, then uses it to rescue the lover who helped erase them.',
		genre: 'medieval-fantasy',
		targetAudience:
			'Pocket FM listeners who binge power fantasy, forbidden love, and betrayal-heavy serials',
		emotionalPromise: 'Every victory makes desire more dangerous.',
		tabooLever: 'loving the person who benefited from your erasure',
		episodeCountTarget: 120,
		minutesPerEpisode: 9,
		compTitles: [
			'court betrayal serials',
			'romantasy revenge arcs',
			'system-like progression fantasies'
		],
		constraints: [
			'must work by ear',
			'no slow lore prologue',
			'must create a repeatable episode engine'
		]
	}
};
