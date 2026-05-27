// Created: 2026-05-26 01:22

import type {
	ContestBrief,
	EpisodeBlueprint,
	ForgeRequest,
	MechanismOutput,
	RetentionSimulation
} from '$lib/core/contracts/contestForgeContract';

export interface StoryIntelligencePort {
	premise(request: ForgeRequest, brief: ContestBrief): string;
	thesis(request: ForgeRequest, brief: ContestBrief): string;
	mechanisms(request: ForgeRequest, brief: ContestBrief): MechanismOutput[];
	pilot(request: ForgeRequest, brief: ContestBrief): EpisodeBlueprint;
	score(
		request: ForgeRequest,
		pilot: EpisodeBlueprint,
		mechanisms: MechanismOutput[]
	): RetentionSimulation;
}
