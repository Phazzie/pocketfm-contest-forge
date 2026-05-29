// Created: 2026-05-26 13:42

import type {
	ContestBrief,
	EpisodeBlueprint,
	ForgeRequest
} from '$lib/core/contracts/contestForgeContract';
import {
	storyStateSchema,
	type StoryDebt,
	type WriterDecision,
	type StoryState
} from '$lib/core/story-state/storyStateContract';

export type StoryStateGenerationMode = 'fixture-demo' | 'live-ai';

export interface StoryStateCreationOptions {
	generationMode?: StoryStateGenerationMode;
}

export type StoryStateValidationResult =
	| { success: true; data: StoryState }
	| { success: false; issues: string[] };

export function validateStoryState(value: unknown): StoryStateValidationResult {
	const parsed = storyStateSchema.safeParse(value);

	if (parsed.success) {
		return { success: true, data: parsed.data };
	}

	return {
		success: false,
		issues: parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
	};
}

export function createStoryStateFromForgeRequest(
	request: ForgeRequest,
	brief: ContestBrief,
	pilot?: EpisodeBlueprint,
	options: StoryStateCreationOptions = {}
): StoryState {
	const leadName = request.seed.protagonistName.trim();
	const antagonistName = 'the false heir';
	const openedDebts = pilot ? toOpenDebts(pilot.bingeDebtAdded) : [];
	const paidDebts = pilot ? toPaidDebts(pilot.payoffMoved) : [];

	return {
		contestBrief: {
			id: brief.id,
			contestName: brief.contestName,
			version: brief.formatSignal,
			promptPressure: brief.promptPressure
		},
		protagonist: {
			id: 'protagonist',
			name: leadName,
			role: 'protagonist',
			publicStatus: 'disgraced claimant with a stolen name',
			privateWant: request.seed.emotionalPromise,
			tabooPressure: request.seed.tabooLever,
			relationshipToProtagonist: 'self'
		},
		antagonist: {
			id: 'antagonist',
			name: antagonistName,
			role: 'antagonist',
			publicStatus: 'recognized ruler of the wrong memory',
			privateWant: 'keep the crown loyal to a lie',
			tabooPressure: 'needing the protagonist alive to preserve the fraud',
			relationshipToProtagonist: 'public enemy and private proof'
		},
		supportingCast: [
			{
				id: 'lover-witness',
				name: 'the witness lover',
				role: 'love-interest',
				publicStatus: 'trusted witness whose signature can erase a life',
				privateWant: 'control the truth without admitting desire',
				tabooPressure: request.seed.tabooLever,
				relationshipToProtagonist: 'beneficiary of the protagonist erasure'
			}
		],
		desireTaboo: {
			coreDesire: request.seed.emotionalPromise,
			tabooLever: request.seed.tabooLever,
			emotionalPromise: request.seed.emotionalPromise,
			statusCost: 'every intimate victory creates public evidence against the lead'
		},
		secrets: [
			{
				id: 'stolen-name',
				holderId: 'antagonist',
				description: 'The antagonist knows the name that should have been erased.',
				exposureCost: 'the court learns the crown has crowned a fraud',
				status: 'hinted'
			}
		],
		rules: [
			{
				id: 'names-are-debts',
				label: 'Names are debts',
				mechanic: 'A spoken true name can restore status or erase a witness memory.',
				cost: 'the speaker loses leverage over someone they desire',
				source: 'seed'
			},
			{
				id: 'contest-pressure',
				label: brief.mandatoryElements[0] ?? 'contest pressure',
				mechanic: brief.promptPressure,
				cost: 'each episode must make the prompt visible before lore expands',
				source: 'contest-brief'
			}
		],
		episodeHistory: pilot
			? [
					{
						episodeNumber: pilot.episodeNumber,
						title: pilot.title,
						beatIds: pilot.beats.map((beat) => beat.id),
						cliffhanger: pilot.cliffhanger,
						debtsOpened: openedDebts.map((debt) => debt.id),
						debtsPaid: paidDebts.map((debt) => debt.id)
					}
				]
			: [],
		debts: {
			open: openedDebts,
			paid: paidDebts,
			stale: []
		},
		continuityFacts: [
			{
				id: 'lead-name',
				fact: `${leadName} is the explicit protagonist and must not be inferred from the title.`,
				lockedBy: 'seed'
			}
		],
		writerDecisions: [writerDecisionForGenerationMode(options.generationMode ?? 'fixture-demo')],
		aiSuggestions: []
	};
}

function writerDecisionForGenerationMode(mode: StoryStateGenerationMode): WriterDecision {
	if (mode === 'live-ai') {
		return {
			id: 'live-story-studio-chain',
			decision: 'Run live-capable Story Studio modules through the provider-backed AI boundary.',
			rationale:
				'Modules stay locked until they have provider prompts, runtime schemas, and prose gates.',
			madeAt: '2026-05-28'
		};
	}

	return {
		id: 'demo-mode',
		decision: 'Use fixture-backed modules until live AI adapters are wired.',
		rationale: 'The app must not pretend deterministic prose is production AI.',
		madeAt: '2026-05-26'
	};
}

function toOpenDebts(labels: string[]): StoryDebt[] {
	return labels.map((label, index) => ({
		id: `open-debt-${index + 1}`,
		label,
		status: 'open',
		openedInEpisode: 1,
		payoffWindow: `episode ${index + 2}-${index + 4}`,
		sourceModuleId: 'binge-debt-ledger'
	}));
}

function toPaidDebts(labels: string[]): StoryDebt[] {
	return labels.map((label, index) => ({
		id: `paid-debt-${index + 1}`,
		label,
		status: 'paid',
		openedInEpisode: 1,
		payoffWindow: 'pilot partial payoff',
		sourceModuleId: 'binge-debt-ledger'
	}));
}
