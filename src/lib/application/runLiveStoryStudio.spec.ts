// Created: 2026-05-29 11:08

import { describe, expect, it } from 'vitest';
import { defaultForgeRequest } from '$lib/application/defaultForgeRequest';
import { RunLiveStoryStudio } from '$lib/application/runLiveStoryStudio';
import type { RunLiveStoryStudioConfig } from '$lib/application/runLiveStoryStudio';
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
import type { CouncilReviewOutput } from '$lib/story-modules/modules/council-review/contract';
import type { TropeMutationLabOutput } from '$lib/story-modules/modules/trope-mutation-lab/contract';

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
	it('returns accepted cold-open, debt-ledger, cliffhanger, and trope artifacts', async () => {
		const provider = new FakeStoryModuleProvider([
			providerSuccess(JSON.stringify(validColdOpenOutput)),
			providerSuccess(JSON.stringify(validBingeDebtLedgerOutput)),
			providerSuccess(JSON.stringify(validCliffhangerFuturesOutput)),
			providerSuccess(JSON.stringify(validTropeMutationLabOutput)),
			providerSuccess(JSON.stringify(validCouncilReviewOutput))
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
			expect(result.data.artifacts[3]?.status).toBe('accepted');
			expect(result.data.artifacts[3]?.result?.output).toMatchObject({
				sceneProof: expect.stringContaining('court trial')
			});
			expect(result.data.artifacts[4]?.status).toBe('accepted');
			expect(result.data.artifacts[4]?.result?.output).toMatchObject({
				greenlight: 'ready-for-demo'
			});
			expect(result.data.qualitySummary).toMatchObject({
				accepted: 5,
				failed: 0,
				locked: 0
			});
			expect(result.data.contestFreshness).toMatchObject({
				source: 'curated',
				status: 'fresh',
				retrievedAt: '2026-05-29T16:00:00.000Z',
				staleAfter: '2026-06-05T16:00:00.000Z'
			});
		}
		expect(provider.requests).toHaveLength(5);
		expect(provider.requests[0]?.moduleId).toBe('cold-open-lab');
		expect(provider.requests[1]?.moduleId).toBe('binge-debt-ledger');
		expect(provider.requests[2]?.moduleId).toBe('cliffhanger-futures');
		expect(provider.requests[3]?.moduleId).toBe('trope-mutation-lab');
		expect(provider.requests[4]?.moduleId).toBe('council-review');
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

	it('locks deselected live mechanisms before spending provider calls', async () => {
		const provider = new FakeStoryModuleProvider(
			providerSuccess(JSON.stringify(validColdOpenOutput))
		);
		const result = await runUseCase(provider, {
			...defaultForgeRequest,
			selectedMechanisms: [
				'retention-black-box',
				'desire-lattice',
				'audio-mouthfeel',
				'cold-open-split-test'
			]
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.artifacts[0]?.status).toBe('accepted');
			expect(result.data.artifacts[1]?.status).toBe('locked');
			expect(result.data.artifacts[1]?.nextAction).toMatchObject({
				label: 'Select binge debt ledger'
			});
			expect(result.data.artifacts[2]?.status).toBe('locked');
			expect(result.data.artifacts[2]?.nextAction).toMatchObject({
				label: 'Select cliffhanger futures'
			});
			expect(result.data.artifacts[3]?.status).toBe('locked');
			expect(result.data.artifacts[3]?.nextAction).toMatchObject({
				label: 'Select trope mutation lab'
			});
			expect(result.data.artifacts[4]?.status).toBe('locked');
			expect(result.data.qualitySummary).toMatchObject({
				accepted: 1,
				failed: 0,
				locked: 4
			});
		}
		expect(provider.requests.map((request) => request.moduleId)).toEqual(['cold-open-lab']);
	});

	it('locks all live modules without provider calls when no live mechanisms are selected', async () => {
		const provider = new FakeStoryModuleProvider(
			providerSuccess(JSON.stringify(validColdOpenOutput))
		);
		const result = await runUseCase(provider, {
			...defaultForgeRequest,
			selectedMechanisms: ['retention-black-box', 'desire-lattice', 'audio-mouthfeel', 'serial-dna']
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.artifacts.map((artifact) => artifact.status)).toEqual([
				'locked',
				'locked',
				'locked',
				'locked',
				'locked'
			]);
			expect(result.data.artifacts[0]?.nextAction).toMatchObject({
				label: 'Select cold-open split test'
			});
			expect(result.data.qualitySummary).toMatchObject({
				accepted: 0,
				failed: 0,
				locked: 5
			});
		}
		expect(provider.requests).toHaveLength(0);
	});

	it('locks the next artifact before provider execution when request budget is low', async () => {
		const provider = new FakeStoryModuleProvider(
			providerSuccess(JSON.stringify(validColdOpenOutput))
		);
		let clockCalls = 0;
		const result = await runUseCase(provider, defaultForgeRequest, {
			maxRunDurationMs: 285_000,
			minimumRemainingMsBeforeProviderCall: 70_000,
			nowMs: () => {
				clockCalls += 1;
				return clockCalls <= 2 ? 0 : 250_000;
			}
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.artifacts[0]?.status).toBe('accepted');
			expect(result.data.artifacts[1]).toMatchObject({
				id: 'binge-debt-ledger',
				status: 'locked',
				nextAction: {
					label: 'Retry Story Studio',
					retryable: true
				}
			});
			expect(result.data.artifacts[1]?.summary).toContain('live request budget');
			expect(result.data.qualitySummary).toMatchObject({
				accepted: 1,
				failed: 0,
				locked: 4
			});
		}
		expect(provider.requests.map((request) => request.moduleId)).toEqual(['cold-open-lab']);
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

	it('surfaces trope provider failure as a failed artifact without fixture fallback', async () => {
		const provider = new FakeStoryModuleProvider([
			providerSuccess(JSON.stringify(validColdOpenOutput)),
			providerSuccess(JSON.stringify(validBingeDebtLedgerOutput)),
			providerSuccess(JSON.stringify(validCliffhangerFuturesOutput)),
			providerFailure('SCHEMA_VALIDATION_FAILED', 'The fake provider returned a weak trope.')
		]);
		const result = await runUseCase(provider);

		expect(result.success).toBe(true);
		if (result.success) {
			const trope = result.data.artifacts[3];

			expect(trope?.status).toBe('failed');
			expect(trope?.result?.output).toBeUndefined();
			expect(trope?.issues.map((issue) => issue.code)).toContain('SCHEMA_VALIDATION_FAILED');
			expect(result.data.qualitySummary).toMatchObject({
				accepted: 3,
				failed: 1,
				locked: 1
			});
		}
		expect(provider.requests.map((request) => request.moduleId)).toEqual([
			'cold-open-lab',
			'binge-debt-ledger',
			'cliffhanger-futures',
			'trope-mutation-lab'
		]);
	});

	it('surfaces council provider failure as a failed artifact without fixture fallback', async () => {
		const provider = new FakeStoryModuleProvider([
			providerSuccess(JSON.stringify(validColdOpenOutput)),
			providerSuccess(JSON.stringify(validBingeDebtLedgerOutput)),
			providerSuccess(JSON.stringify(validCliffhangerFuturesOutput)),
			providerSuccess(JSON.stringify(validTropeMutationLabOutput)),
			providerFailure('PROVIDER_TIMEOUT', 'The fake council provider timed out.')
		]);
		const result = await runUseCase(provider);

		expect(result.success).toBe(true);
		if (result.success) {
			const council = result.data.artifacts[4];

			expect(council?.status).toBe('failed');
			expect(council?.result?.output).toBeUndefined();
			expect(council?.issues.map((issue) => issue.code)).toContain('PROVIDER_TIMEOUT');
			expect(result.data.qualitySummary).toMatchObject({
				accepted: 4,
				failed: 1,
				locked: 0
			});
		}
		expect(provider.requests.map((request) => request.moduleId)).toEqual([
			'cold-open-lab',
			'binge-debt-ledger',
			'cliffhanger-futures',
			'trope-mutation-lab',
			'council-review'
		]);
	});

	it('surfaces a missing cold-open module as a failed artifact without provider calls', async () => {
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

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.artifacts[0]).toMatchObject({
				id: 'cold-open-lab',
				status: 'failed',
				summary: 'Cold Open Lab is not registered, so Story Studio cannot run it.'
			});
			expect(result.data.artifacts[0]?.issues.map((issue) => issue.code)).toContain(
				'MODULE_NOT_REGISTERED'
			);
			expect(result.data.qualitySummary).toMatchObject({
				accepted: 0,
				failed: 1,
				locked: 4
			});
		}
		expect(provider.requests).toHaveLength(0);
	});
});

async function runUseCase(
	provider: StoryModuleProvider,
	request = defaultForgeRequest,
	config: RunLiveStoryStudioConfig = {}
): Promise<Awaited<ReturnType<RunLiveStoryStudio['run']>>> {
	return new RunLiveStoryStudio(
		new InMemoryContestResearchRepository(),
		provider,
		createStoryModuleRegistry(defaultStoryModules),
		{ now: () => new Date(requestedAt), ...config }
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
				'Audience trust risk: withholding the name proof beyond the next court consequence makes the debt feel fake.'
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
				'Audience frustration risk: romantic volatility can make the crown consequence feel secondary.'
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
				'Audience frustration risk: late witness proof turns the memory rule into abstract lore.'
		}
	],
	recommendationId: 'enemy-knows-name',
	marketRationale:
		'The winning cliffhanger reprices the public name debt and has a clean next-episode proof path.'
};

const validTropeMutationLabOutput: TropeMutationLabOutput = {
	expectedTrope: 'the rightful heir proves identity and reclaims the throne',
	mutationRule:
		'the crown only recognizes whoever can make the public believe the cruelest version of the truth',
	preservedPromise: 'the listener still gets court betrayal, cursed power, and public revenge.',
	confusionGuardrail:
		'State the rule through trial, punishment, and witness memory before adding royal history.',
	serialEngine:
		'Each episode forces Mara to win public belief while losing a witness, name, or private memory.',
	sceneProof:
		'Mara wins a court trial by making the crowd believe her lover lied, then the crown erases the witness name from every public record.',
	episodePressure: [
		'Every episode victory must cost Mara a witness, name, or intimate memory.',
		'Each episode public proof must create a private accusation and family debt.',
		'Whenever romantic advance helps Mara, it strengthens the antagonist claim and costs public trust.'
	],
	rejectionNote:
		'Do not invert the trope so far that the throne no longer matters; the familiar power fantasy must remain legible.'
};

const validCouncilReviewOutput: CouncilReviewOutput = {
	roles: [
		{
			role: 'listener-saboteur',
			finding:
				'The strongest listener pull is Mara losing her public name before the crown rule is explained.',
			evidence:
				'Cold-open evidence puts Mara, the court, the lover proof, and the stolen name debt in one audible event.',
			revisionMove:
				'Keep the first revision inside the court scene and make the lover hand over the proof before any lore.',
			riskIfIgnored:
				'Specific risk: if the opening moves into history first, listeners may miss the public status wound and drop before the debt appears.',
			confidence: 0.88
		},
		{
			role: 'trope-criminal',
			finding:
				'The rightful-heir trope stays familiar because the throne still matters, but public belief now crowns power.',
			evidence:
				'Trope mutation evidence keeps the crown, court betrayal, public belief, and Mara private cost visible.',
			revisionMove:
				'Add one public witness who changes allegiance after the crowd believes the crueler truth about Mara.',
			riskIfIgnored:
				'Audience risk: if the mutation becomes abstract philosophy, the audience loses the familiar throne revenge doorway.',
			confidence: 0.82
		},
		{
			role: 'debt-auditor',
			finding:
				'The name debt and lover-proof debt have useful early payoff windows but must not both pay in episode two.',
			evidence:
				'The ledger schedules stolen-name pressure for episodes 2-4 and lover-proof pressure for episodes 2-3.',
			revisionMove:
				'Pay only one public clue in episode two, then make the unpaid lover proof cost Mara trust in episode three.',
			riskIfIgnored:
				'Specific risk: paying both debts at once would drain the binge engine and leave the next court consequence weak.',
			confidence: 0.86
		},
		{
			role: 'voice-actor-ghost',
			finding:
				'The audio spine works when every scene names Mara, the court, the lover, and the crown price aloud.',
			evidence:
				'Accepted artifacts repeatedly use court, lover proof, public name loss, and crown response as spoken anchors.',
			revisionMove:
				'Rewrite the ending line so the antagonist says Mara old name once and the crowd repeats the wrong title.',
			riskIfIgnored:
				'Audience risk: if the magic rule is only visual, audio listeners may miss who paid the name price.',
			confidence: 0.8
		},
		{
			role: 'contest-judge',
			finding:
				'The concept fits the medieval fantasy power lane because the cursed crown changes public authority fast.',
			evidence:
				'The contest brief asks for cursed-object pressure before lore, and the accepted artifacts show court betrayal.',
			revisionMove:
				'Put the cursed crown consequence in the first two minutes and make the court price public before royal history.',
			riskIfIgnored:
				'Specific risk: if the submission waits too long on crown mechanics, it may read like generic palace intrigue.',
			confidence: 0.84
		},
		{
			role: 'continuity-keeper',
			finding:
				'Mara erased name, the lover witness, and the crown belief rule must stay locked as continuity facts.',
			evidence:
				'Cold-open, debt, cliffhanger, and trope artifacts all depend on the same name theft and witness proof.',
			revisionMove:
				'Track who knows Mara old name after every public ceremony and mark each witness memory as paid or stolen.',
			riskIfIgnored:
				'Specific risk: loose name continuity would make the antagonist proof feel fake and weaken every later payoff.',
			confidence: 0.9
		}
	],
	consensus:
		'The story is demo-ready as a concept if public name theft, lover proof, and cursed crown cost stay in one audible chain.',
	topRevisionMove:
		'Rebuild episode two around one court witness using Mara stolen name to collect a public price while the lover withholds proof.',
	greenlight: 'ready-for-demo'
};
