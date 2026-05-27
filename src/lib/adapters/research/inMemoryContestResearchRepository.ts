// Created: 2026-05-26 01:22

import type { ContestBrief, ContestGenre } from '$lib/core/contracts/contestForgeContract';
import type { ContestResearchPort } from '$lib/core/ports/contestResearchPort';
import { contestBriefs } from '$lib/core/domain/contestResearch';

export class InMemoryContestResearchRepository implements ContestResearchPort {
	private readonly briefs: ContestBrief[];

	constructor(briefs: ContestBrief[] = contestBriefs) {
		this.briefs = briefs;
	}

	findById(id: ContestGenre): ContestBrief | undefined {
		return this.briefs.find((brief) => brief.id === id);
	}

	list(): ContestBrief[] {
		return [...this.briefs];
	}
}
