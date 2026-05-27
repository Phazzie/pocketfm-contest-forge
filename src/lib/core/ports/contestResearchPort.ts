// Created: 2026-05-26 01:22

import type { ContestBrief, ContestGenre } from '$lib/core/contracts/contestForgeContract';

export interface ContestResearchPort {
	findById(id: ContestGenre): ContestBrief | undefined;
	list(): ContestBrief[];
}
