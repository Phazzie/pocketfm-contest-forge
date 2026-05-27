// Created: 2026-05-26 13:56

import { describe, expect, it } from 'vitest';
import { ModuleRunner } from '$lib/application/moduleRunner';
import { tropeMutationLabFixtureInput } from '$lib/story-modules/modules/trope-mutation-lab/fixtures';
import { tropeMutationLabModule } from '$lib/story-modules/modules/trope-mutation-lab/module';
import { createModuleFixtureContext } from '$lib/story-modules/testSupport';

describe('trope mutation lab module', () => {
	it('returns a familiar doorway and strange-room mutation in fixture mode', async () => {
		const result = await new ModuleRunner().run(
			tropeMutationLabModule,
			createModuleFixtureContext(tropeMutationLabFixtureInput)
		);

		expect(result.status).toBe('success');
		expect(result.output?.expectedTrope).toContain('rightful heir');
		expect(result.output?.mutationRule).toContain('public believe');
		expect(result.output?.episodePressure.length).toBeGreaterThanOrEqual(3);
		expect(result.provenance.moduleId).toBe('trope-mutation-lab');
	});
});
