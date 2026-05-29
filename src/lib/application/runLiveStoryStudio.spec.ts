// Created: 2026-05-29 11:08

import { describe, expect, it } from 'vitest';
import { defaultForgeRequest } from '$lib/application/createDefaultForge';
import { RunLiveStoryStudio } from '$lib/application/runLiveStoryStudio';
import { InMemoryContestResearchRepository } from '$lib/adapters/research/inMemoryContestResearchRepository';
import type {
	StoryModuleProvider,
	StoryModuleProviderRequest,
	StoryModuleProviderResult
} from '$lib/core/ports/storyModuleProviderPort';
import { createStoryModuleRegistry, defaultStoryModules } from '$lib/story-modules/registry';
import type { ColdOpenLabOutput } from '$lib/story-modules/modules/cold-open-lab/contract';
import type { BingeDebtLedgerOutput } from '$lib/story-modules/modules/binge-debt-ledger/contract';
import type { CliffhangerFuturesOutput } from '$lib/story-modules/modules/cliffhanger-futures/contract';

const generatedAt = '2026-05-29T11:08:00.000Z';
const requestedAt = '2026-05-29T11:08:01.000Z';

class FakeStoryModuleProvider implements StoryModuleProvider {
	readonly requests: StoryModuleProviderRequest[] = [];
	private readonly results: StoryModuleProviderResult[];

	constructor(result: StoryModuleProviderResult | StoryModuleProviderResult[]) {
		this.results = Array.isArray(result) ? result : [result];
	}

	async generateModuleJson(
		request: StoryModuleProviderRequest
	): Promise<StoryModuleProviderResult> {
		const result = this.results[this.requests.length];
		this.requests.push(request);

		if (!result) {
			throw new Error(`No fake provider result configured for request ${this.requests.length}.`);
		}

		return result;
	}
}

describe('run live story studio', () => {
	it('returns accepted cold-open, debt-ledger, and cliffhanger artifacts', async () => {
		const provider = new FakeStoryModuleProvider([
			providerSuccess(JSON.stringify(validColdOpenOutput)),
			providerSuccess(JSON.stringify(validBingeDebtLedgerOutput)),
			providerSuccess(JSON.stringify(validCliffhangerFuturesOutput))
		]);
		const result = await runUseCase(provider);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.generationMode).toBe('live-ai');
			expect(result.data.mode).toBe('production');
			expect(result.data.requestedAt).toBe(requestedAt);
			expect(result.data.artifacts.map((artifact) => artifact.id)).toEqual([
				'cold-open-lab',
				'binge-debt-ledger',
				'cliffhanger-futures',
				'trope-mutation-lab',
				'council-review'
			]);
			expect(result.data.artifacts[0]?.status).toBe('accepted');
			expect(result.data.artifacts[0]?.result?.output).toMatchObject({
				winnerId: 'court-name-theft'
			});
			expect(result.data.artifacts[1]?.status).toBe('accepted');
			expect(result.data.artifacts[1]?.result?.output).toMatchObject({
				openedDebts: expect.arrayContaining([expect.objectContaining({ id: 'debt-stolen-name' })])
			});
			expect(result.data.artifacts[2]?.status).toBe('accepted');
			expect(result.data.artifacts[2]?.result?.output).toMatchObject({
				recommendationId: 'enemy-knows-name'
			});
			expect(result.data.artifacts.slice(3).every((artifact) => artifact.status === 'locked')).toBe(
				true
			);
			expect(result.data.qualitySummary).toMatchObject({
				accepted: 3,
				failed: 0,
				locked: 2
			});
			expect(result.data.contestFreshness.status).toBe('unknown');
		}
		expect(provider.requests).toHaveLength(3);
		expect(provider.requests[0]?.moduleId).toBe('cold-open-lab');
		expect(provider.requests[1]?.moduleId).toBe('binge-debt-ledger');
		expect(provider.requests[2]?.moduleId).toBe('cliffhanger-futures');
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

	it('returns contest-not-found before calling the provider', async () => {
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

	it('surfaces provider failure as a failed cold-open artifact without fixture fallback', async () => {
		const provider = new FakeStoryModuleProvider(
			providerFailure('PROVIDER_UNAVAILABLE', 'XAI_API_KEY is not configured.')
		);
		const result = await runUseCase(provider);

		expect(result.success).toBe(true);
		if (result.success) {
			const coldOpen = result.data.artifacts[0];

			expect(coldOpen?.status).toBe('failed');
			expect(coldOpen?.result?.output).toBeUndefined();
			expect(coldOpen?.issues.map((issue) => issue.code)).toContain('PROVIDER_UNAVAILABLE');
			expect(result.data.artifacts[1]?.status).toBe('locked');
			expect(result.data.qualitySummary).toMatchObject({
				accepted: 0,
				failed: 1,
				locked: 4
			});
		}
		expect(provider.requests).toHaveLength(1);
	});

	it('surfaces binge-debt provider failure as a failed artifact without fixture fallback', async () => {
		const provider = new FakeStoryModuleProvider([
			providerSuccess(JSON.stringify(validColdOpenOutput)),
			providerFailure('PROVIDER_TIMEOUT', 'The fake provider timed out.')
		]);
		const result = await runUseCase(provider);

		expect(result.success).toBe(true);
		if (result.success) {
			const bingeDebt = result.data.artifacts[1];

			expect(bingeDebt?.status).toBe('failed');
			expect(bingeDebt?.result?.output).toBeUndefined();
			expect(bingeDebt?.issues.map((issue) => issue.code)).toContain('PROVIDER_TIMEOUT');
			expect(result.data.qualitySummary).toMatchObject({
				accepted: 1,
				failed: 1,
				locked: 3
			});
		}
		expect(provider.requests.map((request) => request.moduleId)).toEqual([
			'cold-open-lab',
			'binge-debt-ledger'
		]);
	});

	it('surfaces cliffhanger provider failure as a failed artifact without fixture fallback', async () => {
		const provider = new FakeStoryModuleProvider([
			providerSuccess(JSON.stringify(validColdOpenOutput)),
			providerSuccess(JSON.stringify(validBingeDebtLedgerOutput)),
			providerFailure('PROSE_QUALITY_REJECTION', 'The fake provider produced a fake cliffhanger.')
		]);
		const result = await runUseCase(provider);

		expect(result.success).toBe(true);
		if (result.success) {
			const cliffhanger = result.data.artifacts[2];

			expect(cliffhanger?.status).toBe('failed');
			expect(cliffhanger?.result?.output).toBeUndefined();
			expect(cliffhanger?.issues.map((issue) => issue.code)).toContain('PROSE_QUALITY_REJECTION');
			expect(result.data.qualitySummary).toMatchObject({
				accepted: 2,
				failed: 1,
				locked: 2
			});
		}
		expect(provider.requests.map((request) => request.moduleId)).toEqual([
			'cold-open-lab',
			'binge-debt-ledger',
			'cliffhanger-futures'
		]);
	});

	it('fails when the required cold-open module is not registered', async () => {
		const provider = new FakeStoryModuleProvider(
			providerSuccess(JSON.stringify(validColdOpenOutput))
		);
		const registry = createStoryModuleRegistry(
			defaultStoryModules.filter((module) => module.id !== 'cold-open-lab')
		);
		const result = await new RunLiveStoryStudio(
			new InMemoryContestResearchRepository(),
			provider,
			registry,
			{ now: () => new Date(requestedAt) }
		).run(defaultForgeRequest);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.code).toBe('STUDIO_RUN_FAILED');
		}
		expect(provider.requests).toHaveLength(0);
	});
});

async function runUseCase(
	provider: StoryModuleProvider,
	request = defaultForgeRequest
): Promise<Awaited<ReturnType<RunLiveStoryStudio['run']>>> {
	return new RunLiveStoryStudio(
		new InMemoryContestResearchRepository(),
		provider,
		createStoryModuleRegistry(defaultStoryModules),
		{ now: () => new Date(requestedAt) }
	).run(request);
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

const validBingeDebtLedgerOutput: BingeDebtLedgerOutput = {
	openedDebts: [
		{
			id: 'debt-stolen-name',
			label: 'Who profits when Mara Vey public name is stolen in court?',
			status: 'open',
			openedInEpisode: 1,
			payoffWindow: 'episodes 2-4',
			interest: 'Each public ceremony lets the false heir spend Mara name as a crown debt.'
		},
		{
			id: 'debt-lover-proof',
			label: 'Why does the lover protect Mara Vey after betraying her name?',
			status: 'open',
			openedInEpisode: 1,
			payoffWindow: 'episodes 2-3',
			interest: 'The relationship cost rises whenever the lover hides proof from the court.'
		}
	],
	paidDebts: [],
	staleDebts: [],
	payoffWindows: [
		{
			debtId: 'debt-stolen-name',
			episodeRange: 'episodes 2-4',
			requiredEscalation: 'A court witness uses Mara stolen name to collect a public price.'
		},
		{
			debtId: 'debt-lover-proof',
			episodeRange: 'episodes 2-3',
			requiredEscalation: 'The lover must protect Mara in public while denying trust in private.'
		}
	],
	auditorNote:
		'The ledger works because every open debt carries a public status wound or relationship price.'
};

const validCliffhangerFuturesOutput: CliffhangerFuturesOutput = {
	candidates: [
		{
			id: 'enemy-knows-name',
			text: 'The antagonist speaks Mara Vey old name, and the stolen crown answers him like a bride.',
			unansweredQuestion: 'Why does the enemy know the erased name?',
			futuresScore: 88,
			volatility: 'medium',
			payoffPath:
				'Episode two reveals the antagonist bought a name clue from the lover witness at a public price.',
			payoffWarning:
				'Audience trust risk rises if the name proof is withheld beyond the next court consequence.'
		},
		{
			id: 'lover-signed-order',
			text: 'The lover witness signs the execution order with Mara Vey forgotten childhood signature.',
			unansweredQuestion: 'How did the lover get a signature only Mara should know?',
			futuresScore: 79,
			volatility: 'high',
			payoffPath:
				'The next episode forces a partial confession that prices the lover relationship debt.',
			payoffWarning:
				'Romantic volatility risks frustrating the audience if the crown consequence becomes secondary.'
		},
		{
			id: 'crown-chose-wrong',
			text: 'The crown names Mara Vey heir, then drains the crowd memory of why they should care.',
			unansweredQuestion:
				'Can a rightful claim survive if no listener inside the story remembers it?',
			futuresScore: 74,
			volatility: 'medium',
			payoffPath:
				'Episode two creates one witness clue immune to the memory drain before the debt turns abstract.',
			payoffWarning:
				'Audience frustration rises if the witness arrives after the memory rule becomes lore.'
		}
	],
	recommendationId: 'enemy-knows-name',
	marketRationale:
		'The winning cliffhanger reprices the public name debt and has a clean next-episode proof path.'
};
