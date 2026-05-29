// Created: 2026-05-29 11:03

import type {
	ContestBrief,
	EpisodeBlueprint,
	ForgeRequest
} from '$lib/core/contracts/contestForgeContract';
import type { StoryState, StoryDebt } from '$lib/core/story-state/storyStateContract';
import type {
	BingeDebtLedgerInput,
	BingeDebtLedgerOutput,
	LedgerDebt
} from '$lib/story-modules/modules/binge-debt-ledger/contract';
import type {
	CliffhangerFuturesInput,
	CliffhangerFuturesOutput
} from '$lib/story-modules/modules/cliffhanger-futures/contract';
import type {
	ColdOpenLabInput,
	ColdOpenLabOutput
} from '$lib/story-modules/modules/cold-open-lab/contract';
import type { TropeMutationLabInput } from '$lib/story-modules/modules/trope-mutation-lab/contract';

export function buildColdOpenLabInput(
	request: ForgeRequest,
	brief: ContestBrief
): ColdOpenLabInput {
	return {
		workingTitle: request.seed.workingTitle,
		protagonistName: request.seed.protagonistName,
		logline: request.seed.logline,
		emotionalPromise: request.seed.emotionalPromise,
		tabooLever: request.seed.tabooLever,
		contestName: brief.contestName,
		contestLane: brief.id,
		mandatoryElements: brief.mandatoryElements,
		riskTolerance: request.riskTolerance
	};
}

export function buildCliffhangerFuturesInput(
	request: ForgeRequest,
	brief: ContestBrief,
	pilot: EpisodeBlueprint
): CliffhangerFuturesInput {
	return {
		episodeNumber: pilot.episodeNumber,
		episodeTitle: pilot.title,
		beats: pilot.beats.map((beat) => ({
			id: beat.id,
			minute: beat.minute,
			function: beat.function,
			text: beat.text,
			unansweredQuestion: beat.unansweredQuestion
		})),
		unresolvedDebts: pilot.bingeDebtAdded,
		contestLane: brief.id,
		emotionalPromise: request.seed.emotionalPromise
	};
}

export function buildCliffhangerFuturesInputFromLiveArtifacts(
	request: ForgeRequest,
	brief: ContestBrief,
	coldOpenOutput: ColdOpenLabOutput,
	bingeDebtOutput: BingeDebtLedgerOutput
): CliffhangerFuturesInput {
	return {
		episodeNumber: 1,
		episodeTitle: `${request.seed.workingTitle}: Live Story Studio Pilot`,
		beats: coldOpenOutput.variants.map((variant, index) => ({
			id: variant.id,
			minute: index * 2,
			function: liveCliffhangerBeatFunction(index),
			text: variant.text,
			unansweredQuestion: variant.firstMinuteQuestion
		})),
		unresolvedDebts: [...bingeDebtOutput.openedDebts, ...bingeDebtOutput.staleDebts].map(
			(debt) => debt.label
		),
		contestLane: brief.id,
		emotionalPromise: request.seed.emotionalPromise
	};
}

export function buildBingeDebtLedgerInput(
	storyState: StoryState,
	pilot: EpisodeBlueprint
): BingeDebtLedgerInput {
	return {
		episodeNumber: pilot.episodeNumber,
		episodeBeats: pilot.beats.map((beat) => beat.text),
		secrets: storyState.secrets.map((secret) => secret.description),
		promises: pilot.bingeDebtAdded,
		priorLedger: {
			open: storyState.debts.open.map(toLedgerDebt),
			paid: storyState.debts.paid.map(toLedgerDebt),
			stale: storyState.debts.stale.map(toLedgerDebt)
		}
	};
}

export function buildBingeDebtLedgerInputFromColdOpen(
	storyState: StoryState,
	coldOpenOutput: ColdOpenLabOutput
): BingeDebtLedgerInput {
	return {
		episodeNumber: 1,
		episodeBeats: coldOpenOutput.variants.map((variant) => variant.text),
		secrets: storyState.secrets.map((secret) => secret.description),
		promises: coldOpenOutput.variants.map((variant) => variant.firstMinuteQuestion),
		priorLedger: {
			open: storyState.debts.open.map(toLedgerDebt),
			paid: storyState.debts.paid.map(toLedgerDebt),
			stale: storyState.debts.stale.map(toLedgerDebt)
		}
	};
}

export function buildTropeMutationLabInput(
	request: ForgeRequest,
	brief: ContestBrief,
	premise: string
): TropeMutationLabInput {
	return {
		contestGenre: request.seed.genre,
		contestName: brief.contestName,
		mandatoryElements: brief.mandatoryElements,
		seedPremise: premise,
		emotionalPromise: request.seed.emotionalPromise,
		tabooLever: request.seed.tabooLever,
		riskTolerance: request.riskTolerance
	};
}

export function buildTropeMutationLabInputFromLiveArtifacts(
	request: ForgeRequest,
	brief: ContestBrief,
	coldOpenOutput: ColdOpenLabOutput,
	bingeDebtOutput: BingeDebtLedgerOutput,
	cliffhangerOutput: CliffhangerFuturesOutput
): TropeMutationLabInput {
	const winningColdOpen =
		coldOpenOutput.variants.find((variant) => variant.id === coldOpenOutput.winnerId) ??
		coldOpenOutput.variants[0];
	const recommendedCliffhanger =
		cliffhangerOutput.candidates.find(
			(candidate) => candidate.id === cliffhangerOutput.recommendationId
		) ?? cliffhangerOutput.candidates[0];
	const debtLabels = [...bingeDebtOutput.openedDebts, ...bingeDebtOutput.staleDebts].map(
		(debt) => debt.label
	);
	const livePremiseParts = [
		request.seed.logline,
		winningColdOpen ? `Accepted cold open: ${winningColdOpen.text}` : '',
		debtLabels.length > 0 ? `Accepted debts: ${debtLabels.join('; ')}` : '',
		recommendedCliffhanger
			? `Recommended cliffhanger: ${recommendedCliffhanger.text} Payoff path: ${recommendedCliffhanger.payoffPath}`
			: ''
	].filter((part) => part.trim().length > 0);

	return buildTropeMutationLabInput(request, brief, livePremiseParts.join(' '));
}

export function buildModuleInput(
	moduleId: string,
	request: ForgeRequest,
	brief: ContestBrief,
	pilot: EpisodeBlueprint,
	storyState: StoryState,
	premise: string
): unknown {
	switch (moduleId) {
		case 'cold-open-lab':
			return buildColdOpenLabInput(request, brief);
		case 'cliffhanger-futures':
			return buildCliffhangerFuturesInput(request, brief, pilot);
		case 'binge-debt-ledger':
			return buildBingeDebtLedgerInput(storyState, pilot);
		case 'trope-mutation-lab':
			return buildTropeMutationLabInput(request, brief, premise);
		default:
			return {};
	}
}

function toLedgerDebt(debt: StoryDebt): LedgerDebt {
	return {
		id: debt.id,
		label: debt.label,
		status: debt.status,
		openedInEpisode: debt.openedInEpisode,
		payoffWindow: debt.payoffWindow,
		interest: debt.notes ?? `Debt pressure carries into ${debt.payoffWindow}.`
	};
}

function liveCliffhangerBeatFunction(index: number): string {
	if (index === 0) return 'live-cold-open-pressure';
	if (index === 1) return 'listener-question-pressure';
	return 'unresolved-debt-pressure';
}
