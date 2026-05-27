// Created: 2026-05-26 13:44

import type { ContestBrief } from '$lib/core/contracts/contestForgeContract';
import type { StoryState, StoryStateRequirement } from '$lib/core/story-state/storyStateContract';
import type { z } from 'zod';

export type StoryModuleId =
	| 'cold-open-lab'
	| 'cliffhanger-futures'
	| 'binge-debt-ledger'
	| 'trope-mutation-lab'
	| (string & {});

export type StoryModuleCategory =
	| 'acquisition'
	| 'retention'
	| 'continuity'
	| 'trope'
	| 'archetype'
	| 'voice'
	| 'strategy';

export type QualityGateId =
	| 'first-minute-clarity'
	| 'genre-promise'
	| 'audio-readability'
	| 'no-fake-cliffhangers'
	| 'payoff-path-exists'
	| 'next-episode-pull'
	| 'no-debt-without-payoff'
	| 'stale-debt-escalates'
	| 'familiar-doorway'
	| 'strange-room';

export type ModuleExecutionMode = 'fixture' | 'demo' | 'live';
export type ModuleResultStatus = 'success' | 'partial' | 'failed';

export type ModuleIssueCode =
	| 'INVALID_INPUT'
	| 'MISSING_STORY_STATE'
	| 'PROVIDER_UNAVAILABLE'
	| 'PROVIDER_TIMEOUT'
	| 'SCHEMA_VALIDATION_FAILED'
	| 'PROSE_QUALITY_REJECTION'
	| 'PARTIAL_MODULE_RESULT'
	| 'UNEXPECTED_EXCEPTION';

export interface ModuleIssue {
	code: ModuleIssueCode;
	field?: string;
	message: string;
	severity: 'warning' | 'error';
}

export interface ModuleProvenance {
	moduleId: StoryModuleId;
	moduleVersion: string;
	promptVersion: string;
	provider: 'fixture' | 'demo-deterministic' | 'xai' | 'openai' | 'anthropic' | 'google' | 'none';
	model: string;
	mode: ModuleExecutionMode;
	latencyMs: number;
	sourceContestBriefId: string;
	sourceContestBriefVersion: string;
	generatedAt: string;
}

export type ModuleTrackingEventType =
	| 'story-debt-opened'
	| 'story-debt-paid'
	| 'story-debt-staled'
	| 'character-changed'
	| 'promise-created'
	| 'quality-rejection'
	| 'module-completed';

export interface ModuleTrackingEvent {
	type: ModuleTrackingEventType;
	moduleId: StoryModuleId;
	subjectId: string;
	summary: string;
	episodeNumber?: number;
	metadata?: Record<string, string | number | boolean>;
}

export interface ModuleRunContext<TInput> {
	input: TInput;
	storyState: StoryState;
	contestBrief: ContestBrief;
	mode: ModuleExecutionMode;
	now: Date;
}

export interface ModuleRunResult<TOutput> {
	status: ModuleResultStatus;
	output?: TOutput;
	summary: string;
	issues: ModuleIssue[];
	provenance: ModuleProvenance;
	trackingEvents: ModuleTrackingEvent[];
}

export interface StoryModule<TInput, TOutput> {
	id: StoryModuleId;
	version: string;
	label: string;
	category: StoryModuleCategory;
	inputSchema: z.ZodType<TInput>;
	outputSchema: z.ZodType<TOutput>;
	requiredState: StoryStateRequirement[];
	promptVersion: string;
	qualityGates: QualityGateId[];
	run(context: ModuleRunContext<TInput>): Promise<ModuleRunResult<TOutput>>;
}

// Heterogeneous registries need to keep concrete module generics intact at lookup boundaries.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyStoryModule = StoryModule<any, any>;

export function createFixtureProvenance(
	module: Pick<StoryModule<unknown, unknown>, 'id' | 'version' | 'promptVersion'>,
	context: Pick<ModuleRunContext<unknown>, 'contestBrief' | 'mode' | 'now'>,
	latencyMs = 0
): ModuleProvenance {
	return {
		moduleId: module.id,
		moduleVersion: module.version,
		promptVersion: module.promptVersion,
		provider: context.mode === 'live' ? 'none' : 'fixture',
		model: context.mode === 'live' ? 'unavailable' : 'deterministic-test-double',
		mode: context.mode,
		latencyMs,
		sourceContestBriefId: context.contestBrief.id,
		sourceContestBriefVersion: context.contestBrief.formatSignal,
		generatedAt: context.now.toISOString()
	};
}

export function moduleCompletedEvent(
	moduleId: StoryModuleId,
	summary: string
): ModuleTrackingEvent {
	return {
		type: 'module-completed',
		moduleId,
		subjectId: moduleId,
		summary
	};
}
