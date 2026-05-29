// Created: 2026-05-26 14:50

import { describe, expect, it } from 'vitest';
import { ModuleRunner } from '$lib/application/moduleRunner';
import { councilRoleIds } from '$lib/story-modules/modules/council-review/contract';
import { councilReviewFixtureInput } from '$lib/story-modules/modules/council-review/fixtures';
import { councilReviewModule } from '$lib/story-modules/modules/council-review/module';
import { createModuleFixtureContext } from '$lib/story-modules/testSupport';

describe('council-review module', () => {
	it('returns all six council roles in fixture mode', async () => {
		const result = await new ModuleRunner().run(
			councilReviewModule,
			createModuleFixtureContext(councilReviewFixtureInput)
		);

		expect(result.status).toBe('success');
		expect(result.output?.roles.map((role) => role.role)).toEqual(councilRoleIds);
		expect(result.output?.topRevisionMove).toContain('court witness');
		expect(result.provenance.moduleId).toBe('council-review');
	});
});
