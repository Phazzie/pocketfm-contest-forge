// Created: 2026-05-29 10:59

import type {
	ContestBrief,
	ContractIssue,
	StoryModulePlanIssue,
	StoryModulePlanProvenance,
	StoryModulePlanResult,
	StoryModulePlanTrackingEvent
} from '$lib/core/contracts/contestForgeContract';

export const storyStudioArtifactIds = [
	'cold-open-lab',
	'binge-debt-ledger',
	'cliffhanger-futures',
	'trope-mutation-lab',
	'council-review'
] as const;

export type StoryStudioMode = 'production' | 'fixture-demo';
export type StoryStudioArtifactId = (typeof storyStudioArtifactIds)[number];
export type StoryStudioArtifactStatus =
	| 'locked'
	| 'running'
	| 'accepted'
	| 'rejected'
	| 'failed'
	| 'stale';

export type ContestFreshnessStatus = 'fresh' | 'stale' | 'unknown';
export type ContestFreshnessSource = 'curated' | 'live-research';

export type StoryStudioErrorCode =
	| 'ACCESS_DENIED'
	| 'ACCESS_NOT_CONFIGURED'
	| 'RATE_LIMITED'
	| 'CONTRACT_INVALID'
	| 'CONTEST_NOT_FOUND'
	| 'PROVIDER_UNAVAILABLE'
	| 'STUDIO_RUN_FAILED';

export interface StoryStudioNextAction {
	label: string;
	reason: string;
	retryable: boolean;
}

export interface StoryStudioArtifact {
	id: StoryStudioArtifactId;
	label: string;
	status: StoryStudioArtifactStatus;
	summary: string;
	result?: StoryModulePlanResult;
	issues: StoryModulePlanIssue[];
	provenance?: StoryModulePlanProvenance;
	nextAction?: StoryStudioNextAction;
}

export interface StoryStudioQualitySummary {
	accepted: number;
	rejected: number;
	failed: number;
	locked: number;
	stale: number;
	running: number;
}

export interface ContestFreshness {
	source: ContestFreshnessSource;
	status: ContestFreshnessStatus;
	retrievedAt?: string;
	staleAfter?: string;
	warning?: string;
}

export interface StoryStudioRun {
	generationMode: 'live-ai';
	mode: StoryStudioMode;
	brief: ContestBrief;
	requestedAt: string;
	artifacts: StoryStudioArtifact[];
	qualitySummary: StoryStudioQualitySummary;
	contestFreshness: ContestFreshness;
	trackingEvents: StoryModulePlanTrackingEvent[];
}

export type StoryStudioResponse =
	| { success: true; data: StoryStudioRun }
	| {
			success: false;
			error: {
				code: StoryStudioErrorCode;
				message: string;
				issues?: ContractIssue[];
				retryAfterSeconds?: number;
			};
	  };

export const storyStudioArtifactLabels: Record<StoryStudioArtifactId, string> = {
	'cold-open-lab': 'Cold open lab',
	'binge-debt-ledger': 'Binge debt ledger',
	'cliffhanger-futures': 'Cliffhanger futures',
	'trope-mutation-lab': 'Trope mutation lab',
	'council-review': 'Council review'
};

export function isStoryStudioArtifactId(value: string): value is StoryStudioArtifactId {
	return storyStudioArtifactIds.includes(value as StoryStudioArtifactId);
}

export function storyStudioStatusFromModuleResult(
	status: StoryModulePlanResult['status']
): StoryStudioArtifactStatus {
	switch (status) {
		case 'success':
			return 'accepted';
		case 'partial':
			return 'rejected';
		case 'failed':
			return 'failed';
	}
}

export function storyModuleResultToStudioArtifact(
	id: StoryStudioArtifactId,
	result: StoryModulePlanResult
): StoryStudioArtifact {
	const artifact: StoryStudioArtifact = {
		id,
		label: result.label,
		status: storyStudioStatusFromModuleResult(result.status),
		summary: result.summary,
		result,
		issues: result.issues,
		provenance: result.provenance
	};

	return artifact;
}

export function createLockedStoryStudioArtifact(input: {
	id: StoryStudioArtifactId;
	summary?: string;
	nextAction: StoryStudioNextAction;
	issues?: StoryModulePlanIssue[];
}): StoryStudioArtifact {
	return {
		id: input.id,
		label: storyStudioArtifactLabels[input.id],
		status: 'locked',
		summary:
			input.summary ??
			`${storyStudioArtifactLabels[input.id]} is locked until its live AI quality gate is ready.`,
		issues: input.issues ?? [],
		nextAction: input.nextAction
	};
}

export function createUnknownContestFreshness(): ContestFreshness {
	return {
		source: 'curated',
		status: 'unknown',
		warning: 'Contest brief freshness is not tracked yet.'
	};
}

export function summarizeStoryStudioArtifacts(
	artifacts: StoryStudioArtifact[]
): StoryStudioQualitySummary {
	const summary: StoryStudioQualitySummary = {
		accepted: 0,
		rejected: 0,
		failed: 0,
		locked: 0,
		stale: 0,
		running: 0
	};

	for (const artifact of artifacts) {
		summary[artifact.status] += 1;
	}

	return summary;
}
