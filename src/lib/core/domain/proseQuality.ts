// Created: 2026-05-28 03:55

export type ProseQualityIssueCode =
	| 'NO_PROSE_CANDIDATES'
	| 'MISSING_NAMED_SUBJECT'
	| 'ABSTRACT_SCENE_PRESSURE'
	| 'AUDIO_READABILITY_WARNING'
	| 'GENERIC_WRITING_ADVICE'
	| 'FAKE_CLIFFHANGER'
	| 'MISSING_SPECIFIC_COST';

export interface ProseQualityIssue {
	code: ProseQualityIssueCode;
	field?: string;
	message: string;
	severity: 'warning' | 'error';
}

export interface ProseQualityResult {
	accepted: boolean;
	issues: ProseQualityIssue[];
}

export interface ProseQualityReview {
	moduleId: string;
	protagonistName?: string;
	output: unknown;
}

interface ProseCandidate {
	id: string;
	text: string;
	firstMinuteQuestion?: string;
	audioNote?: string;
	acquisitionStrategy?: string;
}

const genericAdvicePhrases = [
	'add tension',
	'build suspense',
	'compelling hook',
	'dramatic tension',
	'emotional stakes',
	'engage the audience',
	'genre promise',
	'hook the audience',
	'keep readers engaged',
	'make it compelling',
	'raise the stakes',
	"show don't tell",
	'strong character arc',
	'strong hook'
];

const concreteSceneTerms = [
	'accusation',
	'altar',
	'balcony',
	'blood',
	'camera',
	'court',
	'crowd',
	'crown',
	'door',
	'execution',
	'face',
	'family',
	'grave',
	'knife',
	'lover',
	'name',
	'phone',
	'public',
	'room',
	'sentence',
	'stranger',
	'throne',
	'trial',
	'voice',
	'witness'
];

const pressureTerms = [
	'accused',
	'bargain',
	'betrayal',
	'betrays',
	'choice',
	'consequence',
	'debt',
	'erased',
	'erases',
	'execution',
	'exile',
	'exposed',
	'forbidden',
	'forced',
	'lying',
	'preserve',
	'price',
	'public',
	'shame',
	'stolen',
	'steals',
	'threatens',
	'trap',
	'wrong'
];

const cliffhangerSignals = [
	'cliffhanger',
	'mystery',
	'question',
	'secret',
	'unanswered',
	'what ',
	'who ',
	'why '
];

const payoffPathTerms = [
	'because',
	'choice',
	'clue',
	'consequence',
	'cost',
	'debt',
	'discovers',
	'episode',
	'forces',
	'learns',
	'next',
	'payoff',
	'price',
	'proof',
	'reveals',
	'so that',
	'which'
];

const specificCostTerms = [
	'betrayal',
	'bond',
	'cost',
	'debt',
	'execution',
	'exile',
	'family',
	'lover',
	'loses',
	'name',
	'price',
	'public',
	'reputation',
	'secret',
	'shame',
	'status',
	'stolen',
	'throne',
	'trust',
	'vow'
];

const weakSentenceStarters = new Set([
	'A',
	'An',
	'Do',
	'Does',
	'Did',
	'Every',
	'How',
	'It',
	'One',
	'That',
	'The',
	'These',
	'This',
	'Those',
	'What',
	'When',
	'Where',
	'Who',
	'Why'
]);

export function evaluateModuleProseQuality(review: ProseQualityReview): ProseQualityResult {
	const candidates = extractCandidates(review.output);
	const issues: ProseQualityIssue[] = [];
	const proseText = buildProseText(review.output, candidates);
	const spokenVariantText = candidates.map((candidate) => candidate.text).join(' ');
	const lowerProse = proseText.toLowerCase();

	if (candidates.length === 0) {
		issues.push({
			code: 'NO_PROSE_CANDIDATES',
			field: `${review.moduleId}.output`,
			message: 'Provider output did not include any reviewable prose candidates.',
			severity: 'error'
		});
	}

	if (!hasNamedSubject(spokenVariantText, review.protagonistName)) {
		issues.push({
			code: 'MISSING_NAMED_SUBJECT',
			field: `${review.moduleId}.output`,
			message: 'Provider output must name the protagonist or another concrete subject.',
			severity: 'error'
		});
	}

	if (!hasAny(lowerProse, concreteSceneTerms) || !hasAny(lowerProse, pressureTerms)) {
		issues.push({
			code: 'ABSTRACT_SCENE_PRESSURE',
			field: `${review.moduleId}.output`,
			message: 'Provider output needs concrete first-minute scene pressure, not abstract stakes.',
			severity: 'error'
		});
	}

	const averageSentenceWords = averageSentenceLength(spokenVariantText);

	if (averageSentenceWords > 24) {
		issues.push({
			code: 'AUDIO_READABILITY_WARNING',
			field: `${review.moduleId}.output`,
			message: `Average sentence length is ${averageSentenceWords} words; tighten for audio readability.`,
			severity: 'warning'
		});
	}

	const genericPhrase = genericAdvicePhrases.find((phrase) => lowerProse.includes(phrase));

	if (genericPhrase) {
		issues.push({
			code: 'GENERIC_WRITING_ADVICE',
			field: `${review.moduleId}.output`,
			message: `Provider output used generic writing-advice phrasing: "${genericPhrase}".`,
			severity: 'error'
		});
	}

	if (hasAny(lowerProse, cliffhangerSignals) && !hasAny(lowerProse, payoffPathTerms)) {
		issues.push({
			code: 'FAKE_CLIFFHANGER',
			field: `${review.moduleId}.output`,
			message: 'Cliffhanger or question language needs a visible payoff path.',
			severity: 'error'
		});
	}

	if (!hasAny(lowerProse, specificCostTerms)) {
		issues.push({
			code: 'MISSING_SPECIFIC_COST',
			field: `${review.moduleId}.output`,
			message:
				'Provider output needs a specific cost, debt, status wound, or relationship pressure.',
			severity: 'error'
		});
	}

	return {
		accepted: issues.every((issue) => issue.severity !== 'error'),
		issues
	};
}

function extractCandidates(output: unknown): ProseCandidate[] {
	const root = asRecord(output);
	const variants = root ? root['variants'] : undefined;

	if (!Array.isArray(variants)) return [];

	return variants.flatMap((variant, index) => {
		const candidate = asRecord(variant);
		const text = candidate ? readString(candidate, 'text') : undefined;

		if (!candidate || !text) return [];

		return [
			{
				id: readString(candidate, 'id') ?? `variant-${index + 1}`,
				text,
				...optionalStringProperty(candidate, 'firstMinuteQuestion'),
				...optionalStringProperty(candidate, 'audioNote'),
				...optionalStringProperty(candidate, 'acquisitionStrategy')
			}
		];
	});
}

function buildProseText(output: unknown, candidates: ProseCandidate[]): string {
	const root = asRecord(output);
	const winnerRationale = root ? readString(root, 'winnerRationale') : undefined;
	const rejectionNotes = root ? root['rejectionNotes'] : undefined;
	const noteText = Array.isArray(rejectionNotes)
		? rejectionNotes.filter((note): note is string => typeof note === 'string')
		: [];
	const candidateText = candidates.flatMap((candidate) => [
		candidate.text,
		candidate.firstMinuteQuestion ?? '',
		candidate.audioNote ?? '',
		candidate.acquisitionStrategy ?? ''
	]);

	return [...candidateText, winnerRationale ?? '', ...noteText].join(' ').trim();
}

function hasNamedSubject(text: string, protagonistName: string | undefined): boolean {
	if (protagonistName && text.toLowerCase().includes(protagonistName.toLowerCase())) {
		return true;
	}

	return [...text.matchAll(/\b[A-Z][a-z]{2,}\b/g)].some(
		(match) => !weakSentenceStarters.has(match[0])
	);
}

function averageSentenceLength(text: string): number {
	const sentences = text
		.split(/[.!?]+/)
		.map((sentence) => sentence.trim())
		.filter(Boolean);
	const wordCounts = sentences
		.map((sentence) => sentence.split(/\s+/).filter(Boolean).length)
		.filter((count) => count > 0);

	if (wordCounts.length === 0) return 0;

	const total = wordCounts.reduce((sum, count) => sum + count, 0);
	return Math.round(total / wordCounts.length);
}

function hasAny(text: string, terms: string[]): boolean {
	return terms.some((term) => text.includes(term));
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
	return value as Record<string, unknown>;
}

function readString(source: Record<string, unknown>, key: string): string | undefined {
	const value = source[key];
	return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function optionalStringProperty(
	source: Record<string, unknown>,
	key: 'firstMinuteQuestion' | 'audioNote' | 'acquisitionStrategy'
): Partial<Pick<ProseCandidate, typeof key>> {
	const value = readString(source, key);
	return value ? { [key]: value } : {};
}
