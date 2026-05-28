// Created: 2026-05-28 05:58

import { describe, expect, it } from 'vitest';
import { defaultForgeRequest } from '$lib/application/createDefaultForge';
import { RunLiveColdOpenLab } from '$lib/application/runLiveColdOpenLab';
import { InMemoryContestResearchRepository } from '$lib/adapters/research/inMemoryContestResearchRepository';
import type {
	StoryModuleProvider,
	StoryModuleProviderRequest,
	StoryModuleProviderResult
} from '$lib/core/ports/storyModuleProviderPort';
import type { ColdOpenLabOutput } from '$lib/story-modules/modules/cold-open-lab/contract';

const generatedAt = '2026-05-28T05:58:00.000Z';
const requestedAt = '2026-05-28T05:58:01.000Z';

class FakeStoryModuleProvider implements StoryModuleProvider {
	readonly requests: StoryModuleProviderRequest[] = [];

	constructor(private readonly result: StoryModuleProviderResult) {}

	async generateModuleJson(
		request: StoryModuleProviderRequest
	): Promise<StoryModuleProviderResult> {
		this.requests.push(request);
		return this.result;
	}
}

describe('run live cold open lab', () => {
	it('returns an accepted live cold-open module result from provider JSON', async () => {
		const provider = new FakeStoryModuleProvider(
			providerSuccess(JSON.stringify(validColdOpenOutput))
		);
		const result = await runUseCase(provider);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.generationMode).toBe('live-ai');
			expect(result.data.moduleResult.status).toBe('success');
			expect(result.data.moduleResult.provenance.provider).toBe('xai');
			expect(result.data.moduleResult.output).toMatchObject({
				winnerId: 'court-name-theft'
			});
		}
		expect(provider.requests).toHaveLength(1);
		expect(provider.requests[0]?.moduleId).toBe('cold-open-lab');
		expect(provider.requests[0]?.mode).toBe('live');
	});

	it('rejects invalid forge requests before calling the provider', async () => {
		const provider = new FakeStoryModuleProvider(
			providerSuccess(JSON.stringify(validColdOpenOutput))
		);
		const result = await runUseCase(provider, {
			...defaultForgeRequest,
			seed: {
				...defaultForgeRequest.seed,
				protagonistName: ''
			}
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.code).toBe('CONTRACT_INVALID');
			expect(result.error.issues?.map((issue) => issue.field)).toContain('seed.protagonistName');
		}
		expect(provider.requests).toHaveLength(0);
	});

	it('returns contest not found before calling the provider', async () => {
		const provider = new FakeStoryModuleProvider(
			providerSuccess(JSON.stringify(validColdOpenOutput))
		);
		const result = await runUseCase(provider, {
			...defaultForgeRequest,
			contestId: 'missing-contest' as typeof defaultForgeRequest.contestId
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.code).toBe('CONTEST_NOT_FOUND');
		}
		expect(provider.requests).toHaveLength(0);
	});

	it('surfaces provider failures as failed module results without fixture fallback', async () => {
		const provider = new FakeStoryModuleProvider(
			providerFailure('PROVIDER_UNAVAILABLE', 'XAI_API_KEY is not configured.')
		);
		const result = await runUseCase(provider);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.moduleResult.status).toBe('failed');
			expect(result.data.moduleResult.output).toBeUndefined();
			expect(result.data.moduleResult.issues.map((issue) => issue.code)).toContain(
				'PROVIDER_UNAVAILABLE'
			);
			expect(result.data.moduleResult.provenance.provider).toBe('xai');
		}
	});
});

async function runUseCase(
	provider: StoryModuleProvider,
	request = defaultForgeRequest
): Promise<Awaited<ReturnType<RunLiveColdOpenLab['run']>>> {
	return new RunLiveColdOpenLab(new InMemoryContestResearchRepository(), provider, {
		now: () => new Date(requestedAt)
	}).run(request);
}

function providerSuccess(rawText: string): StoryModuleProviderResult {
	return {
		success: true,
		rawText,
		provider: 'xai',
		model: 'fake-grok-4.20',
		latencyMs: 147,
		generatedAt
	};
}

function providerFailure(
	code: Exclude<StoryModuleProviderResult, { success: true }>['code'],
	message: string
): StoryModuleProviderResult {
	return {
		success: false,
		code,
		message,
		provider: 'xai',
		model: 'fake-grok-4.20',
		latencyMs: 3,
		generatedAt
	};
}

const validColdOpenOutput: ColdOpenLabOutput = {
	variants: [
		{
			id: 'court-name-theft',
			text: 'Mara Vey loses her public name in court because her lover brings proof of the stolen crown debt.',
			acquisitionStrategy: 'Public status wound before crown rules.',
			firstMinuteQuestion: 'What proof can force Mara to pay a debt everyone hears?',
			audioNote: 'Lead with the court, the lover, and the name loss.',
			rejectionRisk: 'low'
		},
		{
			id: 'lover-sentence',
			text: 'Mara Vey hears her execution sentence in the lover voice that erased her from the throne.',
			acquisitionStrategy: 'Relationship betrayal before lore.',
			firstMinuteQuestion: 'What clue proves the lover saved Mara only to collect a price?',
			audioNote: 'Keep execution, lover, and throne in the first breath.',
			rejectionRisk: 'medium'
		},
		{
			id: 'witness-crown',
			text: 'Mara Vey touches the crown and every witness remembers the vow she paid to hide.',
			acquisitionStrategy: 'Magic rule revealed through public shame.',
			firstMinuteQuestion: 'Which vow becomes the next episode cost?',
			audioNote: 'The witness chorus makes the reveal playable by ear.',
			rejectionRisk: 'medium'
		}
	],
	winnerId: 'court-name-theft',
	winnerRationale: 'Mara, the public shame, and the relationship betrayal are audible at once.',
	rejectionNotes: ['Do not explain crown lore before the court hears the accusation.']
};
