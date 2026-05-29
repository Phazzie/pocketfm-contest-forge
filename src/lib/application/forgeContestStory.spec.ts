// Created: 2026-05-26 01:22

import { describe, expect, it } from 'vitest';
import { createDefaultForge, defaultForgeRequest } from './createDefaultForge';

describe('forge contest story use case', () => {
	it('returns a research-backed forge plan with unconventional mechanisms', async () => {
		const result = await createDefaultForge().forge(defaultForgeRequest);

		expect(result.success).toBe(true);
		if (!result.success) return;

		expect(result.data.brief.evidence.length).toBeGreaterThan(0);
		expect(result.data.mechanisms.map((mechanism) => mechanism.id)).toContain(
			'cliffhanger-futures'
		);
		expect(result.data.mechanisms.map((mechanism) => mechanism.id)).toContain(
			'retention-black-box'
		);
		expect(result.data.pilot.bingeDebtAdded.length).toBeGreaterThanOrEqual(3);
		expect(result.data.aiCouncil.map((prompt) => prompt.role)).toContain('Listener Saboteur');
		expect(result.data.moduleResults.map((module) => module.moduleId)).toContain('cold-open-lab');
		expect(result.data.moduleResults.map((module) => module.moduleId)).not.toContain(
			'council-review'
		);
		expect(result.data.moduleResults.every((module) => module.status !== 'failed')).toBe(true);
	});

	it('keeps the application use case independent from Svelte components', async () => {
		const sourceShape = await createDefaultForge().forge(defaultForgeRequest);

		expect(JSON.stringify(sourceShape)).not.toContain('.svelte');
	});

	it('uses the explicit protagonist instead of deriving a lead from the title', async () => {
		const result = await createDefaultForge().forge(defaultForgeRequest);

		expect(result.success).toBe(true);
		if (!result.success) return;

		expect(result.data.oneSentencePremise).toContain('Mara Vey weaponizes');
		expect(result.data.oneSentencePremise).not.toContain('Crown weaponizes a crown');
		expect(result.data.pilot.beats[0]?.text).toContain('Mara Vey wakes');
	});

	it('fails closed for live mode until a real AI adapter exists', async () => {
		const result = await createDefaultForge().forge(defaultForgeRequest, 'live');

		expect(result.success).toBe(false);
		if (result.success) return;

		expect(result.error.code).toBe('AI_PROVIDER_UNAVAILABLE');
		expect(result.error.message).toContain('will not substitute deterministic prose');
	});
});
