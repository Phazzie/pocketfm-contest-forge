// Created: 2026-05-26 13:56

import { describe, expect, it } from 'vitest';
import { ModuleRunner } from '$lib/application/moduleRunner';
import { cliffhangerFuturesFixtureInput } from '$lib/story-modules/modules/cliffhanger-futures/fixtures';
import { cliffhangerFuturesModule } from '$lib/story-modules/modules/cliffhanger-futures/module';
import { createModuleFixtureContext } from '$lib/story-modules/testSupport';

describe('cliffhanger futures module', () => {
	it('prices cliffhangers with payoff warnings in fixture mode', async () => {
		const result = await new ModuleRunner().run(
			cliffhangerFuturesModule,
			createModuleFixtureContext(cliffhangerFuturesFixtureInput)
		);

		expect(result.status).toBe('success');
		expect(result.output).toBeDefined();

		if (!result.output) {
			throw new Error('Expected cliffhanger futures output.');
		}

		expect(result.output.recommendationId).toBe('enemy-knows-name');
		expect(result.output.candidates[0]?.futuresScore).toBeGreaterThan(80);
		expect(result.trackingEvents.map((event) => event.type)).toContain('promise-created');
	});
});
