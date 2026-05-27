// Created: 2026-05-26 13:56

import { describe, expect, it } from 'vitest';
import { ModuleRunner } from '$lib/application/moduleRunner';
import { coldOpenLabFixtureInput } from '$lib/story-modules/modules/cold-open-lab/fixtures';
import { coldOpenLabModule } from '$lib/story-modules/modules/cold-open-lab/module';
import { createModuleFixtureContext } from '$lib/story-modules/testSupport';

describe('cold open lab module', () => {
	it('returns provenance-capable cold open variants in fixture mode', async () => {
		const result = await new ModuleRunner().run(
			coldOpenLabModule,
			createModuleFixtureContext(coldOpenLabFixtureInput)
		);

		expect(result.status).toBe('success');
		expect(result.output?.variants.length).toBeGreaterThanOrEqual(3);
		expect(result.output?.winnerId).toBe('public-name-theft');
		expect(result.provenance.promptVersion).toBe('cold-open-lab.v1');
		expect(result.issues).toEqual([]);
	});

	it('fails closed in live mode while no provider exists', async () => {
		const context = {
			...createModuleFixtureContext(coldOpenLabFixtureInput),
			mode: 'live' as const
		};
		const result = await new ModuleRunner().run(coldOpenLabModule, context);

		expect(result.status).toBe('failed');
		expect(result.issues.map((issue) => issue.code)).toContain('PROVIDER_UNAVAILABLE');
	});
});
