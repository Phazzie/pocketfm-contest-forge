// Created: 2026-05-28 05:42

import type { StoryModulePlanResult } from '$lib/core/contracts/contestForgeContract';
import type { AnyStoryModule, ModuleRunResult } from '$lib/story-modules/types';

export function toStoryModulePlanResult<TOutput>(
	module: AnyStoryModule,
	result: ModuleRunResult<TOutput>
): StoryModulePlanResult {
	return {
		moduleId: module.id,
		label: module.label,
		category: module.category,
		status: result.status,
		summary: result.summary,
		issues: result.issues,
		provenance: result.provenance,
		trackingEvents: result.trackingEvents,
		output: result.output
	};
}
