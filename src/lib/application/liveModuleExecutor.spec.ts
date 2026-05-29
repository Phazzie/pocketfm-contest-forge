// Created: 2026-05-28 04:21

import { describe, expect, it } from 'vitest';
import { LiveModuleExecutor, type LiveModuleExecutorConfig } from './liveModuleExecutor';
import type {
	StoryModuleProvider,
	StoryModuleProviderRequest,
	StoryModuleProviderResult
} from '$lib/core/ports/storyModuleProviderPort';
import type { BingeDebtLedgerOutput } from '$lib/story-modules/modules/binge-debt-ledger/contract';
import { bingeDebtLedgerFixtureInput } from '$lib/story-modules/modules/binge-debt-ledger/fixtures';
import { bingeDebtLedgerModule } from '$lib/story-modules/modules/binge-debt-ledger/module';
import {
	buildBingeDebtLedgerProviderInput,
	buildBingeDebtLedgerProviderMessages
} from '$lib/story-modules/modules/binge-debt-ledger/prompts';
import type { CliffhangerFuturesOutput } from '$lib/story-modules/modules/cliffhanger-futures/contract';
import {
	cliffhangerFuturesFixtureInput,
	cliffhangerFuturesFixtureOutput
} from '$lib/story-modules/modules/cliffhanger-futures/fixtures';
import type { ColdOpenLabOutput } from '$lib/story-modules/modules/cold-open-lab/contract';
import { coldOpenLabFixtureInput } from '$lib/story-modules/modules/cold-open-lab/fixtures';
import { coldOpenLabModule } from '$lib/story-modules/modules/cold-open-lab/module';
import {
	buildColdOpenLabProviderInput,
	buildColdOpenLabProviderMessages
} from '$lib/story-modules/modules/cold-open-lab/prompts';
import { cliffhangerFuturesModule } from '$lib/story-modules/modules/cliffhanger-futures/module';
import {
	buildCliffhangerFuturesProviderInput,
	buildCliffhangerFuturesProviderMessages,
	CLIFFHANGER_FUTURES_PROMPT_VERSION
} from '$lib/story-modules/modules/cliffhanger-futures/prompts';
import type { CouncilReviewOutput } from '$lib/story-modules/modules/council-review/contract';
import {
	councilReviewFixtureInput,
	councilReviewFixtureOutput
} from '$lib/story-modules/modules/council-review/fixtures';
import { councilReviewModule } from '$lib/story-modules/modules/council-review/module';
import {
	buildCouncilReviewProviderInput,
	buildCouncilReviewProviderMessages
} from '$lib/story-modules/modules/council-review/prompts';
import type { TropeMutationLabOutput } from '$lib/story-modules/modules/trope-mutation-lab/contract';
import {
	tropeMutationLabFixtureInput,
	tropeMutationLabFixtureOutput
} from '$lib/story-modules/modules/trope-mutation-lab/fixtures';
import { tropeMutationLabModule } from '$lib/story-modules/modules/trope-mutation-lab/module';
import {
	buildTropeMutationLabProviderInput,
	buildTropeMutationLabProviderMessages,
	TROPE_MUTATION_LAB_PROMPT_VERSION
} from '$lib/story-modules/modules/trope-mutation-lab/prompts';
import { createModuleFixtureContext } from '$lib/story-modules/testSupport';

const generatedAt = '2026-05-28T04:21:00.000Z';

class FakeStoryModuleProvider implements StoryModuleProvider {
	readonly requests: StoryModuleProviderRequest[] = [];

	constructor(private readonly behavior: StoryModuleProviderResult | Error) {}

	async generateModuleJson(
		request: StoryModuleProviderRequest
	): Promise<StoryModuleProviderResult> {
		this.requests.push(request);

		if (this.behavior instanceof Error) {
			throw this.behavior;
		}

		return this.behavior;
	}
}

describe('live module executor', () => {
	it('accepts valid fake-provider JSON with provenance and tracking', async () => {
		const provider = new FakeStoryModuleProvider(
			providerSuccess(JSON.stringify(validColdOpenOutput))
		);
		const result = await runColdOpen(provider);

		expect(result.status).toBe('success');
		expect(result.output?.winnerId).toBe('court-name-theft');
		expect(result.provenance.provider).toBe('xai');
		expect(result.provenance.model).toBe('fake-grok-4.2');
		expect(result.provenance.promptVersion).toBe('cold-open-lab.v2');
		expect(result.provenance.repairAttempts).toBe(0);
		expect(result.trackingEvents.map((event) => event.type)).toContain('module-completed');
		expect(provider.requests[0]?.promptVersion).toBe('cold-open-lab.v2');
	});

	it('fails closed when the provider is unavailable', async () => {
		const provider = new FakeStoryModuleProvider(
			providerFailure('PROVIDER_UNAVAILABLE', 'No test provider is configured.')
		);
		const result = await runColdOpen(provider);

		expect(result.status).toBe('failed');
		expect(result.output).toBeUndefined();
		expect(result.issues.map((issue) => issue.code)).toContain('PROVIDER_UNAVAILABLE');
		expect(result.provenance.provider).toBe('xai');
	});

	it('fails closed on provider timeout', async () => {
		const provider = new FakeStoryModuleProvider(
			providerFailure('PROVIDER_TIMEOUT', 'The fake provider exceeded its deadline.')
		);
		const result = await runColdOpen(provider);

		expect(result.status).toBe('failed');
		expect(result.issues.map((issue) => issue.code)).toContain('PROVIDER_TIMEOUT');
	});

	it('fails closed when provider invocation hangs past the executor timeout', async () => {
		const provider: StoryModuleProvider = {
			generateModuleJson: () => new Promise<StoryModuleProviderResult>(() => {})
		};
		const result = await runColdOpen(provider, { providerTimeoutMs: 1 });

		expect(result.status).toBe('failed');
		expect(result.issues.map((issue) => issue.code)).toContain('PROVIDER_TIMEOUT');
	});

	it('repairs malformed provider text exactly once when a balanced JSON object exists', async () => {
		const provider = new FakeStoryModuleProvider(
			providerSuccess(`Here is the JSON:\n${JSON.stringify(validColdOpenOutput)}\nDone.`)
		);
		const result = await runColdOpen(provider);

		expect(result.status).toBe('success');
		expect(result.provenance.repairAttempts).toBe(1);
		expect(result.output?.winnerId).toBe('court-name-theft');
	});

	it('repairs markdown-fenced provider JSON exactly once', async () => {
		const provider = new FakeStoryModuleProvider(
			providerSuccess(`\`\`\`json\n${JSON.stringify(validColdOpenOutput)}\n\`\`\``)
		);
		const result = await runColdOpen(provider);

		expect(result.status).toBe('success');
		expect(result.provenance.repairAttempts).toBe(1);
		expect(result.output?.winnerId).toBe('court-name-theft');
	});

	it.each(['fixture', 'demo-deterministic', 'none'] as const)(
		'rejects successful output that claims blocked provider provenance: %s',
		async (blockedProvider) => {
			const provider = new FakeStoryModuleProvider(
				providerSuccess(JSON.stringify(validColdOpenOutput), blockedProvider)
			);
			const result = await runColdOpen(provider);

			expect(result.status).toBe('failed');
			expect(result.issues.map((issue) => issue.code)).toContain('PROVIDER_UNAVAILABLE');
			expect(result.output).toBeUndefined();
		}
	);

	it('fails closed when malformed provider text cannot be repaired', async () => {
		const provider = new FakeStoryModuleProvider(providerSuccess('not json { "variants": ['));
		const result = await runColdOpen(provider);

		expect(result.status).toBe('failed');
		expect(result.provenance.repairAttempts).toBe(1);
		expect(result.issues.map((issue) => issue.code)).toContain('SCHEMA_VALIDATION_FAILED');
	});

	it('rejects schema-invalid provider JSON', async () => {
		const provider = new FakeStoryModuleProvider(
			providerSuccess(
				JSON.stringify({
					variants: [],
					winnerId: '',
					winnerRationale: '',
					rejectionNotes: []
				})
			)
		);
		const result = await runColdOpen(provider);

		expect(result.status).toBe('failed');
		expect(result.issues.map((issue) => issue.code)).toContain('SCHEMA_VALIDATION_FAILED');
	});

	it('rejects schema-valid but weak prose', async () => {
		const provider = new FakeStoryModuleProvider(
			providerSuccess(JSON.stringify(weakColdOpenOutput))
		);
		const result = await runColdOpen(provider);

		expect(result.status).toBe('failed');
		expect(result.issues.map((issue) => issue.code)).toContain('PROSE_QUALITY_REJECTION');
		expect(result.trackingEvents.map((event) => event.type)).toContain('quality-rejection');
	});

	it('accepts valid binge-debt ledger JSON through its module-specific quality gate', async () => {
		const provider = new FakeStoryModuleProvider(
			providerSuccess(JSON.stringify(validBingeDebtLedgerOutput))
		);
		const result = await runBingeDebtLedger(provider);

		expect(result.status).toBe('success');
		expect(result.output?.openedDebts.map((debt) => debt.id)).toContain('debt-stolen-name');
		expect(result.provenance.promptVersion).toBe('binge-debt-ledger.v1');
		expect(provider.requests[0]?.moduleId).toBe('binge-debt-ledger');
	});

	it('rejects weak binge-debt ledger JSON without fixture fallback', async () => {
		const provider = new FakeStoryModuleProvider(
			providerSuccess(JSON.stringify(weakBingeDebtLedgerOutput))
		);
		const result = await runBingeDebtLedger(provider);

		expect(result.status).toBe('failed');
		expect(result.output).toBeUndefined();
		expect(result.issues.map((issue) => issue.code)).toContain('PROSE_QUALITY_REJECTION');
		expect(result.issues.map((issue) => issue.message).join(' ')).toContain('payoff window');
	});

	it('accepts valid cliffhanger-futures JSON through its module-specific quality gate', async () => {
		const provider = new FakeStoryModuleProvider(
			providerSuccess(JSON.stringify(cliffhangerFuturesFixtureOutput))
		);
		const result = await runCliffhangerFutures(provider);

		expect(result.status).toBe('success');
		expect(result.output?.recommendationId).toBe('enemy-knows-name');
		expect(result.provenance.promptVersion).toBe(CLIFFHANGER_FUTURES_PROMPT_VERSION);
		expect(provider.requests[0]?.moduleId).toBe('cliffhanger-futures');
	});

	it('instructs cliffhanger provider output to include audience-risk payoff warnings', () => {
		const promptText = buildCliffhangerFuturesProviderMessages(cliffhangerFuturesFixtureInput)
			.map((message) => message.content)
			.join('\n');

		expect(promptText).toContain(`Prompt version: ${CLIFFHANGER_FUTURES_PROMPT_VERSION}.`);
		expect(promptText).toContain(
			'Every payoffWarning must start with "Audience frustration risk:" or "Audience trust risk:".'
		);
		expect(promptText).toContain('specific listener frustration, trust break, confusion');
		expect(promptText).toContain(
			'Do not generate payoffWarning items that only describe volatility'
		);
	});

	it('rejects cliffhanger payoff warnings that name volatility but omit audience risk', async () => {
		const provider = new FakeStoryModuleProvider(
			providerSuccess(
				JSON.stringify({
					...cliffhangerFuturesFixtureOutput,
					candidates: cliffhangerFuturesFixtureOutput.candidates.map((candidate) => ({
						...candidate,
						payoffWarning:
							'Romantic volatility can hide the crown rule before the name price is clear.'
					}))
				} satisfies CliffhangerFuturesOutput)
			)
		);
		const result = await runCliffhangerFutures(provider);

		expect(result.status).toBe('failed');
		expect(result.output).toBeUndefined();
		expect(result.issues.map((issue) => issue.code)).toContain('PROSE_QUALITY_REJECTION');
		expect(result.issues.map((issue) => issue.message).join(' ')).toContain(
			'audience-frustration risk'
		);
	});

	it('rejects weak cliffhanger-futures JSON without fixture fallback', async () => {
		const provider = new FakeStoryModuleProvider(
			providerSuccess(JSON.stringify(weakCliffhangerFuturesOutput))
		);
		const result = await runCliffhangerFutures(provider);

		expect(result.status).toBe('failed');
		expect(result.output).toBeUndefined();
		expect(result.issues.map((issue) => issue.code)).toContain('PROSE_QUALITY_REJECTION');
		expect(result.issues.map((issue) => issue.message).join(' ')).toContain(
			'next episode movement'
		);
	});

	it('accepts valid trope-mutation JSON through its module-specific quality gate', async () => {
		const provider = new FakeStoryModuleProvider(
			providerSuccess(JSON.stringify(tropeMutationLabFixtureOutput))
		);
		const result = await runTropeMutationLab(provider);

		expect(result.status).toBe('success');
		expect(result.output?.sceneProof).toContain('court trial');
		expect(result.provenance.promptVersion).toBe(TROPE_MUTATION_LAB_PROMPT_VERSION);
		expect(provider.requests[0]?.moduleId).toBe('trope-mutation-lab');
	});

	it('instructs trope-mutation provider output to include repeatable cost-bearing episode pressure', () => {
		const promptText = buildTropeMutationLabProviderMessages(tropeMutationLabFixtureInput)
			.map((message) => message.content)
			.join('\n');

		expect(promptText).toContain(`Prompt version: ${TROPE_MUTATION_LAB_PROMPT_VERSION}.`);
		expect(promptText).toContain(
			'Every episodePressure item must start with "Every episode", "Each episode", or "Whenever".'
		);
		expect(promptText).toContain(
			'Every episodePressure item must include at least one concrete cost word'
		);
		expect(promptText).toContain('Do not generate episodePressure items that only describe tone');
		expect(promptText).toContain('betrayal, cost, debt, family, lover, name');
		expect(promptText).toContain('Every episode victory costs the protagonist public status');
	});

	it('rejects trope-mutation episode pressure that carries cost but omits the v2 repeat cue', async () => {
		const provider = new FakeStoryModuleProvider(
			providerSuccess(
				JSON.stringify({
					...tropeMutationLabFixtureOutput,
					episodePressure: [
						'Every victory must cost Mara a witness, name, or intimate memory.',
						'Every public proof must create a private accusation and family debt.',
						'Every romantic advance must strengthen the antagonist claim and cost Mara public trust.'
					]
				} satisfies TropeMutationLabOutput)
			)
		);
		const result = await runTropeMutationLab(provider);

		expect(result.status).toBe('failed');
		expect(result.output).toBeUndefined();
		expect(result.issues.map((issue) => issue.code)).toContain('PROSE_QUALITY_REJECTION');
		expect(result.issues.map((issue) => issue.message).join(' ')).toContain(
			'start with a repeat cue'
		);
	});

	it('accepts non-medieval trope scene proof through genre-aware quality terms', async () => {
		const provider = new FakeStoryModuleProvider(
			providerSuccess(
				JSON.stringify({
					...tropeMutationLabFixtureOutput,
					expectedTrope: 'the forbidden werewolf bond chooses the rightful alpha',
					mutationRule:
						'the bond only works while the pack publicly believes the lovers betrayed each other',
					preservedPromise:
						'the listener still gets pack hierarchy, forbidden bond, and body-change stakes.',
					sceneProof:
						'Mara exposes her lover in the pack den, then loses public alpha status and family trust when the bond answers.',
					episodePressure: [
						'Every episode forces a pack ritual to repeat while costing Mara family trust.',
						'Each episode public alpha challenge must create a relationship debt.',
						'Whenever the forbidden bond advances, Mara must pay public status inside the pack.'
					]
				} satisfies TropeMutationLabOutput)
			)
		);
		const result = await runTropeMutationLab(provider, undefined, {
			...tropeMutationLabFixtureInput,
			contestGenre: 'werewolf-saga',
			contestName: 'Werewolf Saga Contest',
			mandatoryElements: ['pack hierarchy', 'forbidden bond', 'body-change stakes']
		});

		expect(result.status).toBe('success');
		expect(result.output?.sceneProof).toContain('pack den');
	});

	it('rejects weak trope-mutation JSON without fixture fallback', async () => {
		const provider = new FakeStoryModuleProvider(
			providerSuccess(JSON.stringify(weakTropeMutationLabOutput))
		);
		const result = await runTropeMutationLab(provider);

		expect(result.status).toBe('failed');
		expect(result.output).toBeUndefined();
		expect(result.issues.map((issue) => issue.code)).toContain('PROSE_QUALITY_REJECTION');
		expect(result.issues.map((issue) => issue.message).join(' ')).toContain(
			'repeatable episode engine'
		);
	});

	it('accepts valid council-review JSON through its module-specific quality gate', async () => {
		const provider = new FakeStoryModuleProvider(
			providerSuccess(JSON.stringify(councilReviewFixtureOutput))
		);
		const result = await runCouncilReview(provider);

		expect(result.status).toBe('success');
		expect(result.output?.roles).toHaveLength(6);
		expect(result.output?.greenlight).toBe('ready-for-demo');
		expect(result.provenance.promptVersion).toBe('council-review.v1');
		expect(provider.requests[0]?.moduleId).toBe('council-review');
	});

	it('rejects weak council-review JSON without fixture fallback', async () => {
		const provider = new FakeStoryModuleProvider(
			providerSuccess(JSON.stringify(weakCouncilReviewOutput))
		);
		const result = await runCouncilReview(provider);

		expect(result.status).toBe('failed');
		expect(result.output).toBeUndefined();
		expect(result.issues.map((issue) => issue.code)).toContain('PROSE_QUALITY_REJECTION');
		expect(result.issues.map((issue) => issue.message).join(' ')).toContain(
			'each required council role'
		);
	});

	it('uses the configured module-specific review builder before quality evaluation', async () => {
		let reviewedProtagonistName: string | undefined;
		const provider = new FakeStoryModuleProvider(
			providerSuccess(JSON.stringify(validColdOpenOutput))
		);
		const result = await runColdOpen(provider, {
			qualityGate: (review) => {
				reviewedProtagonistName = review.protagonistName;
				return { accepted: true, issues: [] };
			},
			qualityGateRegistry: new Map([
				[
					'cold-open-lab',
					{
						buildReview: ({ moduleId, output }) => ({
							moduleId,
							protagonistName: 'Custom Gate Lead',
							output
						})
					}
				]
			])
		});

		expect(result.status).toBe('success');
		expect(reviewedProtagonistName).toBe('Custom Gate Lead');
	});

	it('rejects modules without a configured live prose gate before calling the provider', async () => {
		const provider = new FakeStoryModuleProvider(
			providerSuccess(JSON.stringify(validColdOpenOutput))
		);
		const context = {
			...createModuleFixtureContext(coldOpenLabFixtureInput),
			mode: 'live' as const
		};
		const result = await new LiveModuleExecutor(provider).run({
			module: {
				...coldOpenLabModule,
				id: 'unsupported-live-module',
				label: 'Unsupported Live Module'
			},
			context,
			messages: buildColdOpenLabProviderMessages(coldOpenLabFixtureInput),
			providerInput: buildColdOpenLabProviderInput(coldOpenLabFixtureInput)
		});

		expect(result.status).toBe('failed');
		expect(result.issues.map((issue) => issue.code)).toContain('INVALID_INPUT');
		expect(provider.requests).toEqual([]);
	});

	it('fails closed when the provider throws unexpectedly', async () => {
		const provider = new FakeStoryModuleProvider(new Error('socket closed'));
		const result = await runColdOpen(provider);

		expect(result.status).toBe('failed');
		expect(result.issues.map((issue) => issue.code)).toContain('UNEXPECTED_EXCEPTION');
		expect(result.provenance.provider).toBe('none');
	});
});

async function runColdOpen(provider: StoryModuleProvider, config?: LiveModuleExecutorConfig) {
	const context = {
		...createModuleFixtureContext(coldOpenLabFixtureInput),
		mode: 'live' as const
	};

	return new LiveModuleExecutor(provider, config).run({
		module: coldOpenLabModule,
		context,
		messages: buildColdOpenLabProviderMessages(coldOpenLabFixtureInput),
		providerInput: buildColdOpenLabProviderInput(coldOpenLabFixtureInput)
	});
}

async function runBingeDebtLedger(
	provider: StoryModuleProvider,
	config?: LiveModuleExecutorConfig
) {
	const context = {
		...createModuleFixtureContext(bingeDebtLedgerFixtureInput),
		mode: 'live' as const
	};

	return new LiveModuleExecutor(provider, config).run({
		module: bingeDebtLedgerModule,
		context,
		messages: buildBingeDebtLedgerProviderMessages(bingeDebtLedgerFixtureInput),
		providerInput: buildBingeDebtLedgerProviderInput(bingeDebtLedgerFixtureInput)
	});
}

async function runCliffhangerFutures(
	provider: StoryModuleProvider,
	config?: LiveModuleExecutorConfig
) {
	const context = {
		...createModuleFixtureContext(cliffhangerFuturesFixtureInput),
		mode: 'live' as const
	};

	return new LiveModuleExecutor(provider, config).run({
		module: cliffhangerFuturesModule,
		context,
		messages: buildCliffhangerFuturesProviderMessages(cliffhangerFuturesFixtureInput),
		providerInput: buildCliffhangerFuturesProviderInput(cliffhangerFuturesFixtureInput)
	});
}

async function runTropeMutationLab(
	provider: StoryModuleProvider,
	config?: LiveModuleExecutorConfig,
	input = tropeMutationLabFixtureInput
) {
	const context = {
		...createModuleFixtureContext(input),
		mode: 'live' as const
	};

	return new LiveModuleExecutor(provider, config).run({
		module: tropeMutationLabModule,
		context,
		messages: buildTropeMutationLabProviderMessages(input),
		providerInput: buildTropeMutationLabProviderInput(input)
	});
}

async function runCouncilReview(provider: StoryModuleProvider, config?: LiveModuleExecutorConfig) {
	const context = {
		...createModuleFixtureContext(councilReviewFixtureInput),
		mode: 'live' as const
	};

	return new LiveModuleExecutor(provider, config).run({
		module: councilReviewModule,
		context,
		messages: buildCouncilReviewProviderMessages(councilReviewFixtureInput),
		providerInput: buildCouncilReviewProviderInput(councilReviewFixtureInput)
	});
}

function providerSuccess(
	rawText: string,
	provider: Extract<StoryModuleProviderResult, { success: true }>['provider'] = 'xai'
): StoryModuleProviderResult {
	return {
		success: true,
		rawText,
		provider,
		model: 'fake-grok-4.2',
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
		model: 'fake-grok-4.2',
		latencyMs: 1500,
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

const weakColdOpenOutput: ColdOpenLabOutput = {
	variants: [
		{
			id: 'advice-one',
			text: 'Mara Vey should raise the stakes in court so the scene has a strong hook.',
			acquisitionStrategy: 'Make it compelling.',
			firstMinuteQuestion: 'What proof exposes the debt?',
			audioNote: 'Keep the public shame audible.',
			rejectionRisk: 'low'
		},
		{
			id: 'advice-two',
			text: 'Mara Vey should build suspense near the throne with the stolen crown.',
			acquisitionStrategy: 'Create dramatic tension.',
			firstMinuteQuestion: 'What proof forces the price?',
			audioNote: 'Keep the betrayal clear.',
			rejectionRisk: 'medium'
		},
		{
			id: 'advice-three',
			text: 'Mara Vey should make the opening more compelling with public shame.',
			acquisitionStrategy: 'Use emotional stakes.',
			firstMinuteQuestion: 'What proof exposes the lover?',
			audioNote: 'Mention the court and the debt.',
			rejectionRisk: 'medium'
		}
	],
	winnerId: 'advice-one',
	winnerRationale: 'This has a strong hook and clear genre promise.',
	rejectionNotes: ['Avoid weak setup.']
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

const weakBingeDebtLedgerOutput: BingeDebtLedgerOutput = {
	openedDebts: [
		{
			id: 'debt-generic',
			label: 'What happens next?',
			status: 'open',
			openedInEpisode: 1,
			payoffWindow: 'episodes 2-4',
			interest: 'This creates a strong hook and emotional stakes.'
		}
	],
	paidDebts: [],
	staleDebts: [],
	payoffWindows: [
		{
			debtId: 'different-debt',
			episodeRange: 'episodes 2-4',
			requiredEscalation: 'Build suspense before the reveal.'
		}
	],
	auditorNote: 'Raise the stakes for the audience.'
};

const weakCliffhangerFuturesOutput: CliffhangerFuturesOutput = {
	candidates: [
		{
			id: 'vague-mystery-one',
			text: 'Mara Vey finds a vague mystery in the palace that makes everyone wonder what happens later.',
			unansweredQuestion: 'What is the mystery?',
			futuresScore: 84,
			volatility: 'low',
			payoffPath: 'Build suspense later.',
			payoffWarning: 'Keep it intriguing.'
		},
		{
			id: 'vague-mystery-two',
			text: 'Mara Vey sees an unclear shadow near the throne and the scene creates emotional stakes.',
			unansweredQuestion: 'Who is hiding?',
			futuresScore: 77,
			volatility: 'medium',
			payoffPath: 'Raise the stakes in a later chapter.',
			payoffWarning: 'Make the audience curious.'
		},
		{
			id: 'vague-mystery-three',
			text: 'Mara Vey hears a secret phrase that creates a strong hook for the next scene.',
			unansweredQuestion: 'What does the phrase mean?',
			futuresScore: 73,
			volatility: 'medium',
			payoffPath: 'Reveal something surprising eventually.',
			payoffWarning: 'Avoid weak setup.'
		}
	],
	recommendationId: 'vague-mystery-one',
	marketRationale: 'This has a compelling hook and can engage the audience.'
};

const weakTropeMutationLabOutput: TropeMutationLabOutput = {
	expectedTrope: 'a story idea',
	mutationRule: 'make it more interesting',
	preservedPromise: 'keep the genre promise and emotional stakes',
	confusionGuardrail: 'avoid confusing the audience',
	serialEngine: 'make chapters compelling',
	sceneProof: 'a scene happens and things change',
	episodePressure: [
		'Every episode should raise the stakes.',
		'Every episode should build suspense.',
		'Every episode should keep readers engaged.'
	],
	rejectionNote: 'This might not have a strong hook.'
};

const weakCouncilReviewOutput: CouncilReviewOutput = {
	roles: [
		{
			role: 'listener-saboteur',
			finding: 'This should be more exciting for the audience.',
			evidence: 'The story needs a stronger hook and emotional stakes.',
			revisionMove: 'Raise the stakes in the scene.',
			riskIfIgnored: 'It may be too weak for the audience.',
			confidence: 1
		},
		{
			role: 'listener-saboteur',
			finding: 'This repeats the same role instead of using the full council.',
			evidence: 'The advice is generic and not tied to an artifact.',
			revisionMove: 'Make it compelling with more energy.',
			riskIfIgnored: 'Readers may not engage with the story.',
			confidence: 0
		},
		{
			role: 'listener-saboteur',
			finding: 'This still avoids a specific role finding.',
			evidence: 'The evidence does not cite court, crown, name, debt, or witness proof.',
			revisionMove: 'Build suspense before the reveal.',
			riskIfIgnored: 'The output remains generic.',
			confidence: 0.5
		},
		{
			role: 'listener-saboteur',
			finding: 'This gives shallow notes instead of a playable revision.',
			evidence: 'There is no concrete accepted artifact citation.',
			revisionMove: 'Improve the scene with clearer tension.',
			riskIfIgnored: 'It could fail without more specificity.',
			confidence: 0.4
		},
		{
			role: 'listener-saboteur',
			finding: 'This finding lacks a useful council distinction.',
			evidence: 'It says nothing about the contest or story evidence.',
			revisionMove: 'Strengthen the hook for the audience.',
			riskIfIgnored: 'The audience may be bored.',
			confidence: 0.3
		},
		{
			role: 'listener-saboteur',
			finding: 'This finding is not grounded enough to use.',
			evidence: 'It does not cite specific artifact details.',
			revisionMove: 'Add tension before the next moment.',
			riskIfIgnored: 'It may not work for the audience.',
			confidence: 0.2
		}
	],
	consensus: 'The concept needs stronger craft work and better hooks.',
	topRevisionMove: 'Raise the stakes in the scene.',
	greenlight: 'revise-before-submitting'
};
