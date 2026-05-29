// Created: 2026-05-26 01:22

import { describe, expect, it } from 'vitest';
import { allMechanismIds, validateForgeRequest, type MechanismId } from './contestForgeContract';
import { defaultForgeRequest } from '$lib/application/createDefaultForge';
import { contestBriefs } from '$lib/core/domain/contestResearch';

describe('contest forge contract', () => {
	it('accepts the default request because it has enough serial structure', () => {
		const issues = validateForgeRequest(defaultForgeRequest);

		expect(issues.filter((issue) => issue.severity === 'error')).toHaveLength(0);
	});

	it('rejects thin prompt-wrapper requests', () => {
		const request = {
			...defaultForgeRequest,
			selectedMechanisms: allMechanismIds().slice(0, 2),
			seed: { ...defaultForgeRequest.seed, logline: 'A fantasy happens.' }
		};

		const issues = validateForgeRequest(request);

		expect(issues.some((issue) => issue.severity === 'error')).toBe(true);
	});

	it('rejects repeated mechanisms even when the list has four entries', () => {
		const request = {
			...defaultForgeRequest,
			selectedMechanisms: [
				'retention-black-box',
				'retention-black-box',
				'retention-black-box',
				'retention-black-box'
			] as MechanismId[]
		};

		const issues = validateForgeRequest(request);

		expect(issues.some((issue) => issue.field === 'selectedMechanisms')).toBe(true);
		expect(issues.filter((issue) => issue.severity === 'error')).not.toHaveLength(0);
	});

	it('requires curated contest briefs to carry source freshness metadata', () => {
		for (const brief of contestBriefs) {
			expect(brief.freshness.source).toBe('curated');
			expect(brief.freshness.retrievedAt).toMatch(/^2026-05-29T/);
			expect(brief.freshness.staleAfter).toMatch(/^2026-06-05T/);
		}
	});
});
