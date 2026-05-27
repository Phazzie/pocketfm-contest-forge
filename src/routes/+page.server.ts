// Created: 2026-05-26 01:35

import { createDefaultForge, defaultForgeRequest } from '$lib/application/createDefaultForge';
import { InMemoryContestResearchRepository } from '$lib/adapters/research/inMemoryContestResearchRepository';
import { mechanismCatalog } from '$lib/core/domain/mechanisms';

export async function load() {
	const forge = createDefaultForge();
	const initial = await forge.forge(defaultForgeRequest);
	const research = new InMemoryContestResearchRepository();

	if (!initial.success) {
		throw new Error(initial.error.message);
	}

	return {
		initialPlan: initial.data,
		defaultRequest: defaultForgeRequest,
		briefs: research.list(),
		mechanisms: mechanismCatalog
	};
}
