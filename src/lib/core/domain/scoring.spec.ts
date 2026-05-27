// Created: 2026-05-26 01:22

import { describe, expect, it } from 'vitest';
import { createDefaultForge, defaultForgeRequest } from '$lib/application/createDefaultForge';
import { buildRetentionHeatmap } from './scoring';

describe('retention scoring', () => {
	it('prioritizes early rupture and cliffhanger pull', async () => {
		const result = await createDefaultForge().forge(defaultForgeRequest);

		expect(result.success).toBe(true);
		if (!result.success) return;

		expect(result.data.score.firstMinuteGrip).toBeGreaterThanOrEqual(80);
		expect(result.data.score.cliffhangerPull).toBeGreaterThanOrEqual(85);
	});

	it('creates a heat point for every episode beat', async () => {
		const result = await createDefaultForge().forge(defaultForgeRequest);

		expect(result.success).toBe(true);
		if (!result.success) return;

		expect(buildRetentionHeatmap(result.data.pilot)).toHaveLength(result.data.pilot.beats.length);
	});
});
