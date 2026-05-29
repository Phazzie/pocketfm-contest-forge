// Created: 2026-05-29 11:25

import {
	evaluateModuleProseQuality,
	GENERIC_WRITING_ADVICE_PHRASES,
	type ProseQualityIssue,
	type ProseQualityResult,
	type ProseQualityReview
} from '$lib/core/domain/proseQuality';
import { bingeDebtLedgerOutputSchema } from '$lib/story-modules/modules/binge-debt-ledger/contract';
import { cliffhangerFuturesOutputSchema } from '$lib/story-modules/modules/cliffhanger-futures/contract';

export type LiveModuleQualityGate = (review: ProseQualityReview) => ProseQualityResult;

export interface LiveModuleQualityReviewRequest {
	moduleId: string;
	input: unknown;
	output: unknown;
}

export type LiveModuleQualityReviewBuilder = (
	request: LiveModuleQualityReviewRequest
) => ProseQualityReview;

export interface LiveModuleQualityGateConfig {
	buildReview: LiveModuleQualityReviewBuilder;
	qualityGate?: LiveModuleQualityGate;
}

export type LiveModuleQualityGateRegistry = ReadonlyMap<string, LiveModuleQualityGateConfig>;

export const defaultLiveModuleQualityGateRegistry: LiveModuleQualityGateRegistry = new Map([
	[
		'cold-open-lab',
		{
			buildReview: buildColdOpenQualityReview
		}
	],
	[
		'binge-debt-ledger',
		{
			buildReview: buildBingeDebtLedgerQualityReview,
			qualityGate: evaluateBingeDebtLedgerQuality
		}
	],
	[
		'cliffhanger-futures',
		{
			buildReview: buildCliffhangerFuturesQualityReview,
			qualityGate: evaluateCliffhangerFuturesQuality
		}
	]
]);

function buildColdOpenQualityReview(request: LiveModuleQualityReviewRequest): ProseQualityReview {
	const protagonistName = readStringProperty(request.input, 'protagonistName');

	if (protagonistName) {
		return {
			moduleId: request.moduleId,
			protagonistName,
			output: request.output
		};
	}

	return {
		moduleId: request.moduleId,
		output: request.output
	};
}

function buildBingeDebtLedgerQualityReview(
	request: LiveModuleQualityReviewRequest
): ProseQualityReview {
	return {
		moduleId: request.moduleId,
		output: request.output
	};
}

function buildCliffhangerFuturesQualityReview(
	request: LiveModuleQualityReviewRequest
): ProseQualityReview {
	return {
		moduleId: request.moduleId,
		output: request.output
	};
}

function evaluateBingeDebtLedgerQuality(review: ProseQualityReview): ProseQualityResult {
	const parsed = bingeDebtLedgerOutputSchema.safeParse(review.output);
	const issues: ProseQualityIssue[] = [];

	if (!parsed.success) {
		return evaluateModuleProseQuality(review);
	}

	const output = parsed.data;
	const collectibleDebts = [...output.openedDebts, ...output.staleDebts];
	const payoffDebtIds = new Set(output.payoffWindows.map((window) => window.debtId));
	const proseText = [
		...output.openedDebts.flatMap((debt) => [debt.label, debt.payoffWindow, debt.interest]),
		...output.paidDebts.flatMap((debt) => [debt.label, debt.payoffWindow, debt.interest]),
		...output.staleDebts.flatMap((debt) => [debt.label, debt.payoffWindow, debt.interest]),
		...output.payoffWindows.flatMap((window) => [
			window.debtId,
			window.episodeRange,
			window.requiredEscalation
		]),
		output.auditorNote
	].join(' ');
	const lowerProse = proseText.toLowerCase();

	if (collectibleDebts.length === 0) {
		issues.push({
			code: 'NO_PROSE_CANDIDATES',
			field: `${review.moduleId}.openedDebts`,
			message: 'Binge Debt Ledger must open or escalate at least one collectible debt.',
			severity: 'error'
		});
	}

	const debtsWithoutPayoff = collectibleDebts.filter((debt) => !payoffDebtIds.has(debt.id));

	if (debtsWithoutPayoff.length > 0) {
		issues.push({
			code: 'FAKE_CLIFFHANGER',
			field: `${review.moduleId}.payoffWindows`,
			message: `Every open or stale debt needs a matching payoff window: ${debtsWithoutPayoff
				.map((debt) => debt.id)
				.join(', ')}.`,
			severity: 'error'
		});
	}

	const genericPhrase = GENERIC_WRITING_ADVICE_PHRASES.find((phrase) =>
		lowerProse.includes(phrase)
	);

	if (genericPhrase) {
		issues.push({
			code: 'GENERIC_WRITING_ADVICE',
			field: `${review.moduleId}.output`,
			message: `Binge Debt Ledger used generic writing-advice phrasing: "${genericPhrase}".`,
			severity: 'error'
		});
	}

	if (!hasAny(lowerProse, debtCostTerms)) {
		issues.push({
			code: 'MISSING_SPECIFIC_COST',
			field: `${review.moduleId}.output`,
			message:
				'Binge Debt Ledger needs a relationship, public status, secret, trust, name, or price cost.',
			severity: 'error'
		});
	}

	return {
		accepted: issues.every((issue) => issue.severity !== 'error'),
		issues
	};
}

function evaluateCliffhangerFuturesQuality(review: ProseQualityReview): ProseQualityResult {
	const parsed = cliffhangerFuturesOutputSchema.safeParse(review.output);
	const issues: ProseQualityIssue[] = [];

	if (!parsed.success) {
		return evaluateModuleProseQuality(review);
	}

	const output = parsed.data;
	const recommendationIds = new Set(output.candidates.map((candidate) => candidate.id));
	const proseText = [
		...output.candidates.flatMap((candidate) => [
			candidate.text,
			candidate.unansweredQuestion,
			candidate.payoffPath,
			candidate.payoffWarning
		]),
		output.marketRationale
	].join(' ');
	const lowerProse = proseText.toLowerCase();

	if (!recommendationIds.has(output.recommendationId)) {
		issues.push({
			code: 'FAKE_CLIFFHANGER',
			field: `${review.moduleId}.recommendationId`,
			message: `Cliffhanger Futures recommendationId must match one candidate id: ${output.recommendationId}.`,
			severity: 'error'
		});
	}

	const genericPhrase = GENERIC_WRITING_ADVICE_PHRASES.find((phrase) =>
		lowerProse.includes(phrase)
	);

	if (genericPhrase) {
		issues.push({
			code: 'GENERIC_WRITING_ADVICE',
			field: `${review.moduleId}.output`,
			message: `Cliffhanger Futures used generic writing-advice phrasing: "${genericPhrase}".`,
			severity: 'error'
		});
	}

	if (!hasAny(lowerProse, debtCostTerms)) {
		issues.push({
			code: 'MISSING_SPECIFIC_COST',
			field: `${review.moduleId}.output`,
			message:
				'Cliffhanger Futures needs a relationship, public status, secret, trust, name, or price cost.',
			severity: 'error'
		});
	}

	for (const candidate of output.candidates) {
		const lowerPayoffPath = candidate.payoffPath.toLowerCase();
		const lowerWarning = candidate.payoffWarning.toLowerCase();

		if (!hasAny(lowerPayoffPath, cliffhangerPayoffTerms)) {
			issues.push({
				code: 'FAKE_CLIFFHANGER',
				field: `${review.moduleId}.candidates.${candidate.id}.payoffPath`,
				message: `Cliffhanger ${candidate.id} needs a playable next-episode payoff path, not only withheld information.`,
				severity: 'error'
			});
		}

		if (!hasAny(lowerPayoffPath, cliffhangerNextEpisodeTerms)) {
			issues.push({
				code: 'FAKE_CLIFFHANGER',
				field: `${review.moduleId}.candidates.${candidate.id}.payoffPath`,
				message: `Cliffhanger ${candidate.id} must name the next episode movement or consequence.`,
				severity: 'error'
			});
		}

		if (!hasAny(lowerWarning, cliffhangerWarningTerms)) {
			issues.push({
				code: 'FAKE_CLIFFHANGER',
				field: `${review.moduleId}.candidates.${candidate.id}.payoffWarning`,
				message: `Cliffhanger ${candidate.id} must name the audience-frustration risk if payoff is delayed.`,
				severity: 'error'
			});
		}
	}

	return {
		accepted: issues.every((issue) => issue.severity !== 'error'),
		issues
	};
}

function readStringProperty(value: unknown, key: string): string | undefined {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
	const property = (value as Record<string, unknown>)[key];
	return typeof property === 'string' && property.trim().length > 0 ? property : undefined;
}

function hasAny(text: string, terms: string[]): boolean {
	return terms.some((term) => text.includes(term));
}

const debtCostTerms = [
	'betrayal',
	'cost',
	'court',
	'debt',
	'family',
	'lover',
	'name',
	'price',
	'public',
	'relationship',
	'reputation',
	'secret',
	'shame',
	'status',
	'trust'
];

const cliffhangerPayoffTerms = [
	'because',
	'choice',
	'clue',
	'confession',
	'consequence',
	'cost',
	'debt',
	'episode',
	'forces',
	'learns',
	'moves',
	'pay',
	'payoff',
	'price',
	'proof',
	'reveal',
	'reveals',
	'witness'
];

const cliffhangerNextEpisodeTerms = [
	'episode',
	'next',
	'consequence',
	'clue',
	'proof',
	'reveal',
	'reveals',
	'witness'
];

const cliffhangerWarningTerms = [
	'audience',
	'abstract',
	'confuse',
	'delayed',
	'fake',
	'frustrate',
	'frustrating',
	'lore',
	'risks',
	'risk',
	'secondary',
	'trust',
	'withhold'
];
