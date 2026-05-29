// Created: 2026-05-29 10:59

import { describe, expect, it } from 'vitest';
import {
	createLockedStoryStudioArtifact,
	createUnknownContestFreshness,
	isStoryStudioArtifactId,
	storyModuleResultToStudioArtifact,
	summarizeStoryStudioArtifacts
} from './storyStudioContract';
import type {
	StoryModulePlanProvenance,
	StoryModulePlanResult
} from '$lib/core/contracts/contestForgeContract';

const generatedAt = '2026-05-29T10:59:00.000Z';

describe('story studio contract', () => {
	it('recognizes only production story studio artifact ids', () => {
		expect(isStoryStudioArtifactId('cold-open-lab')).toBe(true);
		expect(isStoryStudioArtifactId('council-review')).toBe(true);
		expect(isStoryStudioArtifactId('fixture-score')).toBe(false);
	});

	it('maps accepted module results into production artifacts with provenance preserved', () => {
		const result = moduleResult('success');
		const artifact = storyModuleResultToStudioArtifact('cold-open-lab', result);

		expect(artifact.status).toBe('accepted');
		expect(artifact.result?.moduleId).toBe('cold-open-lab');
		expect(artifact.provenance?.provider).toBe('xai');
		expect(artifact.nextAction).toBeUndefined();
	});

	it('maps failed module results into failed artifacts without inventing output', () => {
		const result = moduleResult('failed');
		const artifact = storyModuleResultToStudioArtifact('cold-open-lab', result);

		expect(artifact.status).toBe('failed');
		expect(artifact.result?.output).toBeUndefined();
		expect(artifact.issues.map((issue) => issue.code)).toContain('PROVIDER_UNAVAILABLE');
	});

	it('creates locked artifacts without provenance or generated result payloads', () => {
		const artifact = createLockedStoryStudioArtifact({
			id: 'binge-debt-ledger',
			nextAction: {
				label: 'Wait for live gate',
				reason: 'The live debt-ledger prompt and quality gate are not implemented yet.',
				retryable: false
			}
		});

		expect(artifact.status).toBe('locked');
		expect(artifact.result).toBeUndefined();
		expect(artifact.provenance).toBeUndefined();
		expect(artifact.nextAction?.retryable).toBe(false);
	});

	it('summarizes artifact statuses for the route quality panel', () => {
		const summary = summarizeStoryStudioArtifacts([
			storyModuleResultToStudioArtifact('cold-open-lab', moduleResult('success')),
			storyModuleResultToStudioArtifact('cliffhanger-futures', moduleResult('failed')),
			createLockedStoryStudioArtifact({
				id: 'council-review',
				nextAction: {
					label: 'Run live modules first',
					reason: 'Council review requires accepted story artifacts.',
					retryable: false
				}
			})
		]);

		expect(summary).toEqual({
			accepted: 1,
			rejected: 0,
			failed: 1,
			locked: 1,
			stale: 0,
			running: 0
		});
	});

	it('marks contest freshness as unknown until source dates are implemented', () => {
		expect(createUnknownContestFreshness()).toEqual({
			source: 'curated',
			status: 'unknown',
			warning: 'Contest brief freshness is not tracked yet.'
		});
	});
});

function moduleResult(status: StoryModulePlanResult['status']): StoryModulePlanResult {
	const result: StoryModulePlanResult = {
		moduleId: 'cold-open-lab',
		label: 'Cold open lab',
		category: 'acquisition',
		status,
		summary: status === 'success' ? 'Accepted live output.' : 'Provider was unavailable.',
		issues:
			status === 'success'
				? []
				: [
						{
							code: 'PROVIDER_UNAVAILABLE',
							message: 'XAI_API_KEY is not configured.',
							severity: 'error'
						}
					],
		provenance,
		trackingEvents: [],
		output: status === 'success' ? { winnerId: 'court-name-theft' } : undefined
	};

	if (status !== 'success') {
		delete result.output;
	}

	return result;
}

const provenance: StoryModulePlanProvenance = {
	moduleId: 'cold-open-lab',
	moduleVersion: '1.0.0',
	promptVersion: 'cold-open-lab.v2',
	provider: 'xai',
	model: 'fake-grok',
	mode: 'live',
	latencyMs: 120,
	sourceContestBriefId: 'medieval-fantasy',
	sourceContestBriefVersion: 'format-v1',
	generatedAt
};
