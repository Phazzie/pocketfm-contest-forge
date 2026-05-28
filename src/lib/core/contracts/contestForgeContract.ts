// Created: 2026-05-26 01:22

export type ContestGenre =
	| 'medieval-fantasy'
	| 'werewolf-saga'
	| 'romantasy'
	| 'thriller-system'
	| 'dark-academy';

export type MechanismId =
	| 'retention-black-box'
	| 'cliffhanger-futures'
	| 'desire-lattice'
	| 'binge-debt-ledger'
	| 'audio-mouthfeel'
	| 'trope-mutation-lab'
	| 'cold-open-split-test'
	| 'serial-dna';

export type RiskTolerance = 1 | 2 | 3 | 4 | 5;

export interface ContestEvidence {
	sourceName: string;
	url: string;
	insight: string;
	confidence: 'direct' | 'reported' | 'inferred';
}

export interface ContestBrief {
	id: ContestGenre;
	contestName: string;
	formatSignal: string;
	prizeSignal: string;
	promptPressure: string;
	mandatoryElements: string[];
	judgingSignals: string[];
	evidence: ContestEvidence[];
}

export interface StorySeedInput {
	workingTitle: string;
	protagonistName: string;
	logline: string;
	genre: ContestGenre;
	targetAudience: string;
	emotionalPromise: string;
	tabooLever: string;
	episodeCountTarget: number;
	minutesPerEpisode: number;
	compTitles: string[];
	constraints: string[];
}

export interface ForgeRequest {
	contestId: ContestGenre;
	seed: StorySeedInput;
	riskTolerance: RiskTolerance;
	selectedMechanisms: MechanismId[];
}

export interface ContractIssue {
	field: string;
	message: string;
	severity: 'error' | 'warning';
}

export type UseCaseResponse<T> =
	| { success: true; data: T }
	| {
			success: false;
			error: {
				code: 'CONTRACT_INVALID' | 'CONTEST_NOT_FOUND' | 'AI_PROVIDER_UNAVAILABLE';
				message: string;
				issues?: ContractIssue[];
			};
	  };

export type LiveColdOpenErrorCode =
	| 'ACCESS_DENIED'
	| 'ACCESS_NOT_CONFIGURED'
	| 'RATE_LIMITED'
	| 'CONTRACT_INVALID'
	| 'CONTEST_NOT_FOUND';

export interface LiveColdOpenResult {
	generationMode: 'live-ai';
	brief: ContestBrief;
	moduleResult: StoryModulePlanResult;
	requestedAt: string;
}

export type LiveColdOpenResponse =
	| { success: true; data: LiveColdOpenResult }
	| {
			success: false;
			error: {
				code: LiveColdOpenErrorCode;
				message: string;
				issues?: ContractIssue[];
				retryAfterSeconds?: number;
			};
	  };

export interface EpisodeBeat {
	id: string;
	minute: number;
	function:
		| 'cold-open'
		| 'status-rupture'
		| 'choice-trap'
		| 'intimacy-charge'
		| 'reversal'
		| 'price-reveal'
		| 'cliffhanger';
	text: string;
	unansweredQuestion: string;
	retentionRisk: 'low' | 'medium' | 'high';
}

export interface EpisodeBlueprint {
	episodeNumber: number;
	title: string;
	coldOpenVariants: string[];
	beats: EpisodeBeat[];
	cliffhanger: string;
	bingeDebtAdded: string[];
	payoffMoved: string[];
}

export interface MechanismOutput {
	id: MechanismId;
	label: string;
	unconventionalMove: string;
	artifact: string;
	risk: string;
	rationale: string;
}

export interface RetentionHeatPoint {
	minute: number;
	intensity: number;
	reason: string;
}

export interface RetentionSimulation {
	score: number;
	firstMinuteGrip: number;
	cliffhangerPull: number;
	audioFlow: number;
	novelty: number;
	risks: string[];
	heatmap: RetentionHeatPoint[];
}

export interface AiCouncilPrompt {
	role: string;
	job: string;
	prompt: string;
	expectedArtifact: string;
}

export interface StoryModulePlanIssue {
	code: string;
	field?: string;
	message: string;
	severity: 'warning' | 'error';
}

export interface StoryModulePlanProvenance {
	moduleId: string;
	moduleVersion: string;
	promptVersion: string;
	provider: string;
	model: string;
	mode: string;
	latencyMs: number;
	sourceContestBriefId: string;
	sourceContestBriefVersion: string;
	generatedAt: string;
	repairAttempts?: number;
}

export interface StoryModulePlanTrackingEvent {
	type: string;
	moduleId: string;
	subjectId: string;
	summary: string;
	episodeNumber?: number;
	metadata?: Record<string, string | number | boolean>;
}

export interface StoryModulePlanResult {
	moduleId: string;
	label: string;
	category: string;
	status: 'success' | 'partial' | 'failed';
	summary: string;
	issues: StoryModulePlanIssue[];
	provenance: StoryModulePlanProvenance;
	trackingEvents: StoryModulePlanTrackingEvent[];
	output?: unknown;
}

export interface ForgePlan {
	brief: ContestBrief;
	generationMode: 'fixture-demo' | 'live-ai';
	oneSentencePremise: string;
	strategicThesis: string;
	mechanisms: MechanismOutput[];
	moduleResults: StoryModulePlanResult[];
	pilot: EpisodeBlueprint;
	aiCouncil: AiCouncilPrompt[];
	seriesRules: string[];
	score: RetentionSimulation;
	submissionChecklist: string[];
	selfReview: string[];
}

const mechanismIds: MechanismId[] = [
	'retention-black-box',
	'cliffhanger-futures',
	'desire-lattice',
	'binge-debt-ledger',
	'audio-mouthfeel',
	'trope-mutation-lab',
	'cold-open-split-test',
	'serial-dna'
];

const contestGenres: ContestGenre[] = [
	'medieval-fantasy',
	'werewolf-saga',
	'romantasy',
	'thriller-system',
	'dark-academy'
];

export function isContestGenre(value: string): value is ContestGenre {
	return contestGenres.includes(value as ContestGenre);
}

export function isMechanismId(value: string): value is MechanismId {
	return mechanismIds.includes(value as MechanismId);
}

export function allMechanismIds(): MechanismId[] {
	return [...mechanismIds];
}

export function validateForgeRequest(request: ForgeRequest): ContractIssue[] {
	const issues: ContractIssue[] = [];
	const title = request.seed.workingTitle.trim();
	const protagonistName = request.seed.protagonistName.trim();
	const logline = request.seed.logline.trim();
	const uniqueMechanisms = new Set(request.selectedMechanisms);

	if (!title) {
		issues.push({
			field: 'seed.workingTitle',
			message: 'A contest submission needs a working title.',
			severity: 'error'
		});
	}

	if (!protagonistName) {
		issues.push({
			field: 'seed.protagonistName',
			message: 'A contest submission needs an explicit protagonist name.',
			severity: 'error'
		});
	}

	if (logline.length < 35) {
		issues.push({
			field: 'seed.logline',
			message:
				'The logline must be specific enough to test hook, promise, and repeatable conflict.',
			severity: 'error'
		});
	}

	if (request.seed.episodeCountTarget < 30) {
		issues.push({
			field: 'seed.episodeCountTarget',
			message: 'Pocket FM style serials need a long engine. Target at least 30 episodes.',
			severity: 'warning'
		});
	}

	if (request.seed.minutesPerEpisode < 5 || request.seed.minutesPerEpisode > 15) {
		issues.push({
			field: 'seed.minutesPerEpisode',
			message: 'Episode minutes should stay close to mobile audio snack length.',
			severity: 'warning'
		});
	}

	if (uniqueMechanisms.size < 4) {
		issues.push({
			field: 'selectedMechanisms',
			message: 'Use at least four unique mechanisms so the output is a system, not a prompt.',
			severity: 'error'
		});
	}

	if (uniqueMechanisms.size !== request.selectedMechanisms.length) {
		issues.push({
			field: 'selectedMechanisms',
			message:
				'Duplicate mechanisms are not allowed because each module should add distinct pressure.',
			severity: 'error'
		});
	}

	for (const mechanism of request.selectedMechanisms) {
		if (!isMechanismId(mechanism)) {
			issues.push({
				field: 'selectedMechanisms',
				message: `Unknown mechanism: ${mechanism}`,
				severity: 'error'
			});
		}
	}

	return issues;
}
