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
import {
	tropeMutationLabInputSchema,
	tropeMutationLabOutputSchema
} from '$lib/story-modules/modules/trope-mutation-lab/contract';

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
	],
	[
		'trope-mutation-lab',
		{
			buildReview: buildTropeMutationLabQualityReview,
			qualityGate: evaluateTropeMutationLabQuality
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

function buildTropeMutationLabQualityReview(
	request: LiveModuleQualityReviewRequest
): ProseQualityReview {
	return {
		moduleId: request.moduleId,
		input: request.input,
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

function evaluateTropeMutationLabQuality(review: ProseQualityReview): ProseQualityResult {
	const parsedOutput = tropeMutationLabOutputSchema.safeParse(review.output);
	const parsedInput = tropeMutationLabInputSchema.safeParse(review.input);
	const issues: ProseQualityIssue[] = [];

	if (!parsedOutput.success) {
		return evaluateModuleProseQuality(review);
	}

	const output = parsedOutput.data;
	const proseText = [
		output.expectedTrope,
		output.mutationRule,
		output.preservedPromise,
		output.confusionGuardrail,
		output.serialEngine,
		output.sceneProof,
		...output.episodePressure,
		output.rejectionNote
	].join(' ');
	const lowerProse = proseText.toLowerCase();
	const lowerTrope = output.expectedTrope.toLowerCase();
	const lowerMutation = output.mutationRule.toLowerCase();

	const genericPhrase = GENERIC_WRITING_ADVICE_PHRASES.find((phrase) =>
		lowerProse.includes(phrase)
	);

	if (genericPhrase) {
		issues.push({
			code: 'GENERIC_WRITING_ADVICE',
			field: `${review.moduleId}.output`,
			message: `Trope Mutation Lab used generic writing-advice phrasing: "${genericPhrase}".`,
			severity: 'error'
		});
	}

	if (!hasAny(lowerTrope, familiarTropeTerms)) {
		issues.push({
			code: 'NO_PROSE_CANDIDATES',
			field: `${review.moduleId}.expectedTrope`,
			message: 'Trope Mutation Lab must start from a recognizable genre doorway.',
			severity: 'error'
		});
	}

	if (!hasAny(lowerMutation, mutationTerms) || lowerMutation === lowerTrope) {
		issues.push({
			code: 'ABSTRACT_SCENE_PRESSURE',
			field: `${review.moduleId}.mutationRule`,
			message: 'Trope Mutation Lab must name a specific inversion, subversion, or rule change.',
			severity: 'error'
		});
	}

	if (!hasAny(output.serialEngine.toLowerCase(), serialEngineTerms)) {
		issues.push({
			code: 'ABSTRACT_SCENE_PRESSURE',
			field: `${review.moduleId}.serialEngine`,
			message: 'Trope Mutation Lab must describe a repeatable episode engine.',
			severity: 'error'
		});
	}

	if (
		!hasAny(output.sceneProof.toLowerCase(), tropeSceneTerms) ||
		!hasAny(output.sceneProof.toLowerCase(), debtCostTerms)
	) {
		issues.push({
			code: 'MISSING_SPECIFIC_COST',
			field: `${review.moduleId}.sceneProof`,
			message:
				'Trope Mutation Lab needs one concrete scene proof with a place, action, and relationship or status cost.',
			severity: 'error'
		});
	}

	const contestTerms = parsedInput.success
		? contestPromiseTerms([
				parsedInput.data.contestGenre,
				parsedInput.data.contestName,
				...parsedInput.data.mandatoryElements,
				parsedInput.data.emotionalPromise,
				parsedInput.data.tabooLever
			])
		: [];

	if (contestTerms.length > 0 && !hasAny(lowerProse, contestTerms)) {
		issues.push({
			code: 'MISSING_SPECIFIC_COST',
			field: `${review.moduleId}.preservedPromise`,
			message:
				'Trope Mutation Lab must preserve at least one concrete contest lane or mandatory element.',
			severity: 'error'
		});
	}

	const weakEpisodePressure = output.episodePressure.filter(
		(pressure) =>
			!hasAny(pressure.toLowerCase(), serialEngineTerms) ||
			!hasAny(pressure.toLowerCase(), debtCostTerms)
	);

	if (weakEpisodePressure.length > 0) {
		issues.push({
			code: 'ABSTRACT_SCENE_PRESSURE',
			field: `${review.moduleId}.episodePressure`,
			message: 'Trope Mutation Lab episode pressure must be repeatable and carry a concrete cost.',
			severity: 'error'
		});
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

function contestPromiseTerms(values: string[]): string[] {
	const terms = values
		.flatMap((value) => value.toLowerCase().split(/[^a-z0-9]+/))
		.map((term) => term.trim())
		.filter((term) => term.length >= 4 && !contestStopWords.has(term));

	return [...new Set(terms)];
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

const familiarTropeTerms = [
	'arranged',
	'betrayal',
	'chosen',
	'curse',
	'cursed',
	'enemies',
	'forbidden',
	'heir',
	'identity',
	'marriage',
	'power',
	'prophecy',
	'revenge',
	'rightful',
	'secret',
	'throne',
	'vampire',
	'werewolf'
];

const mutationTerms = [
	'but',
	'except',
	'instead',
	'invert',
	'inverts',
	'mutation',
	'only',
	'reverse',
	'reverses',
	'rule',
	'subvert',
	'subverts',
	'twist',
	'while'
];

const serialEngineTerms = [
	'each',
	'episode',
	'every',
	'payoff',
	'recur',
	'recurring',
	'repeat',
	'repeatable',
	'serial',
	'whenever'
];

const tropeSceneTerms = [
	'accusation',
	'altar',
	'court',
	'crowd',
	'crown',
	'execution',
	'lover',
	'name',
	'public',
	'room',
	'throne',
	'trial',
	'witness'
];

const contestStopWords = new Set([
	'and',
	'contest',
	'every',
	'from',
	'genre',
	'into',
	'makes',
	'promise',
	'story',
	'that',
	'with'
]);

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
