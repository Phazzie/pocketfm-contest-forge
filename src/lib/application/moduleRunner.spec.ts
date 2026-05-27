// Created: 2026-05-26 13:55

import { describe, expect, it } from 'vitest';
import { DeterministicStoryIntelligence } from '$lib/adapters/ai/deterministicStoryIntelligence';
import { InMemoryContestResearchRepository } from '$lib/adapters/research/inMemoryContestResearchRepository';
import { defaultForgeRequest } from '$lib/application/createDefaultForge';
import { ModuleRunner } from '$lib/application/moduleRunner';
import { createStoryStateFromForgeRequest } from '$lib/core/story-state/storyStateValidation';
import { coldOpenLabFixtureInput } from '$lib/story-modules/modules/cold-open-lab/fixtures';
import { coldOpenLabModule } from '$lib/story-modules/modules/cold-open-lab/module';

describe('module runner', () => {
	it('returns typed success for a fixture-backed module', async () => {
		const context = createRunnerContext(coldOpenLabFixtureInput);
		const result = await new ModuleRunner().run(coldOpenLabModule, context);

		expect(result.status).toBe('success');
		expect(result.output?.variants).toHaveLength(3);
		expect(result.provenance.moduleId).toBe('cold-open-lab');
		expect(result.trackingEvents.length).toBeGreaterThan(0);
	});

	it('returns typed failure for invalid module input', async () => {
		const context = createRunnerContext({ ...coldOpenLabFixtureInput, protagonistName: '' });
		const result = await new ModuleRunner().run(coldOpenLabModule, context);

		expect(result.status).toBe('failed');
		expect(result.issues.map((issue) => issue.code)).toContain('INVALID_INPUT');
		expect(result.trackingEvents.map((event) => event.type)).toContain('quality-rejection');
	});
});

function createRunnerContext(input: unknown) {
	const brief = new InMemoryContestResearchRepository().findById(defaultForgeRequest.contestId);

	if (!brief) {
		throw new Error('Default contest brief missing.');
	}

	const pilot = new DeterministicStoryIntelligence().pilot(defaultForgeRequest, brief);
	const storyState = createStoryStateFromForgeRequest(defaultForgeRequest, brief, pilot);

	return {
		input,
		storyState,
		contestBrief: brief,
		mode: 'fixture' as const,
		now: new Date('2026-05-26T13:55:00.000Z')
	};
}
