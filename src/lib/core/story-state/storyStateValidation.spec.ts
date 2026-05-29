// Created: 2026-05-26 13:55

import { describe, expect, it } from 'vitest';
import { DeterministicStoryIntelligence } from '$lib/adapters/ai/deterministicStoryIntelligence';
import { InMemoryContestResearchRepository } from '$lib/adapters/research/inMemoryContestResearchRepository';
import { defaultForgeRequest } from '$lib/application/createDefaultForge';
import {
	createStoryStateFromForgeRequest,
	validateStoryState
} from '$lib/core/story-state/storyStateValidation';

describe('story state validation', () => {
	it('creates a valid story state with protagonist, debts, and writer decisions', () => {
		const brief = new InMemoryContestResearchRepository().findById(defaultForgeRequest.contestId);
		expect(brief).toBeDefined();
		if (!brief) return;

		const pilot = new DeterministicStoryIntelligence().pilot(defaultForgeRequest, brief);
		const state = createStoryStateFromForgeRequest(defaultForgeRequest, brief, pilot);
		const result = validateStoryState(state);

		expect(result.success).toBe(true);
		expect(state.protagonist.name).toBe('Mara Vey');
		expect(state.debts.open.length).toBeGreaterThan(0);
		expect(state.aiSuggestions).toEqual([]);
	});

	it('records live Story Studio scope without claiming fixture-only execution', () => {
		const brief = new InMemoryContestResearchRepository().findById(defaultForgeRequest.contestId);
		expect(brief).toBeDefined();
		if (!brief) return;

		const state = createStoryStateFromForgeRequest(defaultForgeRequest, brief, undefined, {
			generationMode: 'live-ai'
		});
		const result = validateStoryState(state);

		expect(result.success).toBe(true);
		expect(state.writerDecisions[0]?.id).toBe('live-story-studio-chain');
		expect(state.writerDecisions[0]?.decision).toContain('provider-backed AI boundary');
		expect(state.writerDecisions[0]?.decision).not.toContain('fixture-backed');
	});
});
