// Created: 2026-05-29 11:08

import { LiveModuleExecutor } from '$lib/application/liveModuleExecutor';
import { toStoryModulePlanResult } from '$lib/application/storyModulePlanResult';
import {
	buildBingeDebtLedgerInputFromColdOpen,
	buildCouncilReviewInput,
	buildCliffhangerFuturesInputFromLiveArtifacts,
	buildColdOpenLabInput,
	buildTropeMutationLabInputFromLiveArtifacts
} from '$lib/application/storyModuleInputs';
import type { LiveModuleExecutorConfig } from '$lib/application/liveModuleExecutor';
import type {
	ContestBrief,
	ForgeRequest,
	MechanismId
} from '$lib/core/contracts/contestForgeContract';
import {
	createContestFreshnessFromBrief,
	createLockedStoryStudioArtifact,
	storyStudioArtifactLabels,
	storyModuleResultToStudioArtifact,
	summarizeStoryStudioArtifacts,
	type StoryStudioArtifact,
	type StoryStudioArtifactId,
	type StoryStudioResponse
} from '$lib/core/contracts/storyStudioContract';
import { validateForgeRequest } from '$lib/core/contracts/contestForgeContract';
import type { ContestResearchPort } from '$lib/core/ports/contestResearchPort';
import type { StoryModuleProvider } from '$lib/core/ports/storyModuleProviderPort';
import { createStoryStateFromForgeRequest } from '$lib/core/story-state/storyStateValidation';
import type { StoryModuleRegistry } from '$lib/story-modules/registry';
import {
	buildColdOpenLabProviderInput,
	buildColdOpenLabProviderMessages
} from '$lib/story-modules/modules/cold-open-lab/prompts';
import { coldOpenLabOutputSchema } from '$lib/story-modules/modules/cold-open-lab/contract';
import {
	buildBingeDebtLedgerProviderInput,
	buildBingeDebtLedgerProviderMessages
} from '$lib/story-modules/modules/binge-debt-ledger/prompts';
import { bingeDebtLedgerOutputSchema } from '$lib/story-modules/modules/binge-debt-ledger/contract';
import {
	buildCliffhangerFuturesProviderInput,
	buildCliffhangerFuturesProviderMessages
} from '$lib/story-modules/modules/cliffhanger-futures/prompts';
import { cliffhangerFuturesOutputSchema } from '$lib/story-modules/modules/cliffhanger-futures/contract';
import {
	buildTropeMutationLabProviderInput,
	buildTropeMutationLabProviderMessages
} from '$lib/story-modules/modules/trope-mutation-lab/prompts';
import {
	buildCouncilReviewProviderInput,
	buildCouncilReviewProviderMessages
} from '$lib/story-modules/modules/council-review/prompts';

export interface RunLiveStoryStudioConfig {
	now?: () => Date;
	nowMs?: () => number;
	maxRunDurationMs?: number;
	minimumRemainingMsBeforeProviderCall?: number;
	executorConfig?: LiveModuleExecutorConfig;
}

interface RunLiveStoryStudioBudget {
	startedAtMs: number;
	maxRunDurationMs: number;
	minimumRemainingMsBeforeProviderCall: number;
}

export class RunLiveStoryStudio {
	private readonly now: () => Date;
	private readonly nowMs: () => number;

	constructor(
		private readonly research: ContestResearchPort,
		private readonly provider: StoryModuleProvider,
		private readonly moduleRegistry: StoryModuleRegistry,
		private readonly config: RunLiveStoryStudioConfig = {}
	) {
		this.now = config.now ?? (() => new Date());
		this.nowMs = config.nowMs ?? (() => Date.now());
	}

	async run(request: ForgeRequest): Promise<StoryStudioResponse> {
		const issues = validateForgeRequest(request);
		const errors = issues.filter((issue) => issue.severity === 'error');

		if (errors.length > 0) {
			return {
				success: false,
				error: {
					code: 'CONTRACT_INVALID',
					message: 'Story Studio request failed contract validation.',
					issues
				}
			};
		}

		const brief = this.research.findById(request.contestId);

		if (!brief) {
			return {
				success: false,
				error: {
					code: 'CONTEST_NOT_FOUND',
					message: `No contest brief found for ${request.contestId}.`
				}
			};
		}

		const requestedAt = this.now();
		const budget = this.createBudget();
		const storyState = createStoryStateFromForgeRequest(request, brief, undefined, {
			generationMode: 'live-ai'
		});
		const executor = new LiveModuleExecutor(this.provider, this.config.executorConfig);
		const coldOpenArtifact = await this.runColdOpenLab({
			request,
			executor,
			storyState,
			brief,
			requestedAt,
			budget
		});
		const bingeDebtArtifact = await this.runBingeDebtLedger({
			request,
			executor,
			coldOpenArtifact,
			storyState,
			brief,
			requestedAt,
			budget
		});
		const cliffhangerArtifact = await this.runCliffhangerFutures({
			request,
			executor,
			coldOpenArtifact,
			bingeDebtArtifact,
			storyState,
			brief,
			requestedAt,
			budget
		});
		const tropeArtifact = await this.runTropeMutationLab({
			request,
			executor,
			coldOpenArtifact,
			bingeDebtArtifact,
			cliffhangerArtifact,
			storyState,
			brief,
			requestedAt,
			budget
		});
		const priorArtifacts: StoryStudioArtifact[] = [
			coldOpenArtifact,
			bingeDebtArtifact,
			cliffhangerArtifact,
			tropeArtifact
		];
		const councilArtifact = await this.runCouncilReview({
			request,
			executor,
			priorArtifacts,
			storyState,
			brief,
			requestedAt,
			budget
		});
		const artifacts: StoryStudioArtifact[] = [...priorArtifacts, councilArtifact];

		return {
			success: true,
			data: {
				generationMode: 'live-ai',
				mode: 'production',
				brief,
				requestedAt: requestedAt.toISOString(),
				artifacts,
				qualitySummary: summarizeStoryStudioArtifacts(artifacts),
				contestFreshness: createContestFreshnessFromBrief(brief, requestedAt),
				trackingEvents: artifacts.flatMap((artifact) => artifact.result?.trackingEvents ?? [])
			}
		};
	}

	private async runColdOpenLab(input: {
		request: ForgeRequest;
		executor: LiveModuleExecutor;
		storyState: ReturnType<typeof createStoryStateFromForgeRequest>;
		brief: ContestBrief;
		requestedAt: Date;
		budget: RunLiveStoryStudioBudget;
	}): Promise<StoryStudioArtifact> {
		if (!hasSelectedMechanism(input.request, 'cold-open-split-test')) {
			return lockedForUnselectedMechanism({
				id: 'cold-open-lab',
				label: 'Select cold-open split test',
				reason: 'Cold Open Lab only runs when the Cold Open Split Test mechanism is selected.'
			});
		}

		const module = this.moduleRegistry.find('cold-open-lab');

		if (!module) {
			return {
				id: 'cold-open-lab',
				label: 'Cold open lab',
				status: 'failed',
				summary: 'Cold Open Lab is not registered, so Story Studio cannot run it.',
				issues: [
					{
						code: 'MODULE_NOT_REGISTERED',
						message: 'Cold Open Lab is not registered in the story module registry.',
						severity: 'error'
					}
				]
			};
		}

		if (!this.hasBudgetForProviderCall(input.budget)) {
			return lockedForInsufficientRunBudget('cold-open-lab');
		}

		const coldOpenInput = buildColdOpenLabInput(input.request, input.brief);
		const result = await input.executor.run({
			module,
			context: {
				input: coldOpenInput,
				storyState: input.storyState,
				contestBrief: input.brief,
				mode: 'live',
				now: input.requestedAt
			},
			messages: buildColdOpenLabProviderMessages(coldOpenInput),
			providerInput: buildColdOpenLabProviderInput(coldOpenInput)
		});

		return storyModuleResultToStudioArtifact(
			'cold-open-lab',
			toStoryModulePlanResult(module, result)
		);
	}

	private async runBingeDebtLedger(input: {
		request: ForgeRequest;
		executor: LiveModuleExecutor;
		coldOpenArtifact: StoryStudioArtifact;
		storyState: ReturnType<typeof createStoryStateFromForgeRequest>;
		brief: ContestBrief;
		requestedAt: Date;
		budget: RunLiveStoryStudioBudget;
	}): Promise<StoryStudioArtifact> {
		if (!hasSelectedMechanism(input.request, 'binge-debt-ledger')) {
			return lockedForUnselectedMechanism({
				id: 'binge-debt-ledger',
				label: 'Select binge debt ledger',
				reason: 'Binge Debt Ledger only runs when the Binge Debt Ledger mechanism is selected.'
			});
		}

		const parsedColdOpen = coldOpenLabOutputSchema.safeParse(input.coldOpenArtifact.result?.output);

		if (input.coldOpenArtifact.status !== 'accepted' || !parsedColdOpen.success) {
			return createLockedStoryStudioArtifact({
				id: 'binge-debt-ledger',
				summary: 'Binge debt ledger is locked until a cold-open artifact is accepted.',
				nextAction: {
					label: 'Accept cold open first',
					reason:
						'Binge debt ledger needs accepted live cold-open variants so it can price actual listener promises.',
					retryable: true
				}
			});
		}

		const module = this.moduleRegistry.find('binge-debt-ledger');

		if (!module) {
			return createLockedStoryStudioArtifact({
				id: 'binge-debt-ledger',
				nextAction: {
					label: 'Register binge-debt-ledger',
					reason: 'Binge Debt Ledger is not registered in the story module registry.',
					retryable: false
				}
			});
		}

		if (!this.hasBudgetForProviderCall(input.budget)) {
			return lockedForInsufficientRunBudget('binge-debt-ledger');
		}

		const ledgerInput = buildBingeDebtLedgerInputFromColdOpen(
			input.storyState,
			parsedColdOpen.data
		);
		const result = await input.executor.run({
			module,
			context: {
				input: ledgerInput,
				storyState: input.storyState,
				contestBrief: input.brief,
				mode: 'live',
				now: input.requestedAt
			},
			messages: buildBingeDebtLedgerProviderMessages(ledgerInput),
			providerInput: buildBingeDebtLedgerProviderInput(ledgerInput)
		});

		return storyModuleResultToStudioArtifact(
			'binge-debt-ledger',
			toStoryModulePlanResult(module, result)
		);
	}

	private async runCliffhangerFutures(input: {
		request: ForgeRequest;
		executor: LiveModuleExecutor;
		coldOpenArtifact: StoryStudioArtifact;
		bingeDebtArtifact: StoryStudioArtifact;
		storyState: ReturnType<typeof createStoryStateFromForgeRequest>;
		brief: ContestBrief;
		requestedAt: Date;
		budget: RunLiveStoryStudioBudget;
	}): Promise<StoryStudioArtifact> {
		if (!hasSelectedMechanism(input.request, 'cliffhanger-futures')) {
			return lockedForUnselectedMechanism({
				id: 'cliffhanger-futures',
				label: 'Select cliffhanger futures',
				reason:
					'Cliffhanger Futures only runs when the Cliffhanger Futures Market mechanism is selected.'
			});
		}

		const parsedColdOpen = coldOpenLabOutputSchema.safeParse(input.coldOpenArtifact.result?.output);
		const parsedBingeDebt = bingeDebtLedgerOutputSchema.safeParse(
			input.bingeDebtArtifact.result?.output
		);

		if (input.coldOpenArtifact.status !== 'accepted' || !parsedColdOpen.success) {
			return createLockedStoryStudioArtifact({
				id: 'cliffhanger-futures',
				summary: 'Cliffhanger futures is locked until a cold-open artifact is accepted.',
				nextAction: {
					label: 'Accept cold open first',
					reason:
						'Cliffhanger Futures needs accepted live cold-open variants before it can price episode-ending listener questions.',
					retryable: true
				}
			});
		}

		if (input.bingeDebtArtifact.status !== 'accepted' || !parsedBingeDebt.success) {
			return createLockedStoryStudioArtifact({
				id: 'cliffhanger-futures',
				summary: 'Cliffhanger futures is locked until the debt ledger is accepted.',
				nextAction: {
					label: 'Accept debt ledger first',
					reason:
						'Cliffhanger Futures needs accepted live debts and payoff windows so it can reject fake unanswered questions.',
					retryable: true
				}
			});
		}

		const module = this.moduleRegistry.find('cliffhanger-futures');

		if (!module) {
			return createLockedStoryStudioArtifact({
				id: 'cliffhanger-futures',
				nextAction: {
					label: 'Register cliffhanger-futures',
					reason: 'Cliffhanger Futures is not registered in the story module registry.',
					retryable: false
				}
			});
		}

		if (!this.hasBudgetForProviderCall(input.budget)) {
			return lockedForInsufficientRunBudget('cliffhanger-futures');
		}

		const cliffhangerInput = buildCliffhangerFuturesInputFromLiveArtifacts(
			input.request,
			input.brief,
			parsedColdOpen.data,
			parsedBingeDebt.data
		);
		const result = await input.executor.run({
			module,
			context: {
				input: cliffhangerInput,
				storyState: input.storyState,
				contestBrief: input.brief,
				mode: 'live',
				now: input.requestedAt
			},
			messages: buildCliffhangerFuturesProviderMessages(cliffhangerInput),
			providerInput: buildCliffhangerFuturesProviderInput(cliffhangerInput)
		});

		return storyModuleResultToStudioArtifact(
			'cliffhanger-futures',
			toStoryModulePlanResult(module, result)
		);
	}

	private async runTropeMutationLab(input: {
		request: ForgeRequest;
		executor: LiveModuleExecutor;
		coldOpenArtifact: StoryStudioArtifact;
		bingeDebtArtifact: StoryStudioArtifact;
		cliffhangerArtifact: StoryStudioArtifact;
		storyState: ReturnType<typeof createStoryStateFromForgeRequest>;
		brief: ContestBrief;
		requestedAt: Date;
		budget: RunLiveStoryStudioBudget;
	}): Promise<StoryStudioArtifact> {
		if (!hasSelectedMechanism(input.request, 'trope-mutation-lab')) {
			return lockedForUnselectedMechanism({
				id: 'trope-mutation-lab',
				label: 'Select trope mutation lab',
				reason: 'Trope Mutation Lab only runs when the Trope Mutation Lab mechanism is selected.'
			});
		}

		const parsedColdOpen = coldOpenLabOutputSchema.safeParse(input.coldOpenArtifact.result?.output);
		const parsedBingeDebt = bingeDebtLedgerOutputSchema.safeParse(
			input.bingeDebtArtifact.result?.output
		);
		const parsedCliffhanger = cliffhangerFuturesOutputSchema.safeParse(
			input.cliffhangerArtifact.result?.output
		);

		if (
			input.coldOpenArtifact.status !== 'accepted' ||
			!parsedColdOpen.success ||
			input.bingeDebtArtifact.status !== 'accepted' ||
			!parsedBingeDebt.success ||
			input.cliffhangerArtifact.status !== 'accepted' ||
			!parsedCliffhanger.success
		) {
			return createLockedStoryStudioArtifact({
				id: 'trope-mutation-lab',
				summary:
					'Trope mutation lab is locked until cold-open, debt-ledger, and cliffhanger artifacts are accepted.',
				nextAction: {
					label: 'Accept prior artifacts first',
					reason:
						'Trope Mutation Lab needs accepted live story artifacts so it can mutate the actual contest premise instead of generic genre advice.',
					retryable: true
				}
			});
		}

		const module = this.moduleRegistry.find('trope-mutation-lab');

		if (!module) {
			return createLockedStoryStudioArtifact({
				id: 'trope-mutation-lab',
				nextAction: {
					label: 'Register trope-mutation-lab',
					reason: 'Trope Mutation Lab is not registered in the story module registry.',
					retryable: false
				}
			});
		}

		if (!this.hasBudgetForProviderCall(input.budget)) {
			return lockedForInsufficientRunBudget('trope-mutation-lab');
		}

		const tropeInput = buildTropeMutationLabInputFromLiveArtifacts(
			input.request,
			input.brief,
			parsedColdOpen.data,
			parsedBingeDebt.data,
			parsedCliffhanger.data
		);
		const result = await input.executor.run({
			module,
			context: {
				input: tropeInput,
				storyState: input.storyState,
				contestBrief: input.brief,
				mode: 'live',
				now: input.requestedAt
			},
			messages: buildTropeMutationLabProviderMessages(tropeInput),
			providerInput: buildTropeMutationLabProviderInput(tropeInput)
		});

		return storyModuleResultToStudioArtifact(
			'trope-mutation-lab',
			toStoryModulePlanResult(module, result)
		);
	}

	private async runCouncilReview(input: {
		request: ForgeRequest;
		executor: LiveModuleExecutor;
		priorArtifacts: StoryStudioArtifact[];
		storyState: ReturnType<typeof createStoryStateFromForgeRequest>;
		brief: ContestBrief;
		requestedAt: Date;
		budget: RunLiveStoryStudioBudget;
	}): Promise<StoryStudioArtifact> {
		if (!input.priorArtifacts.every((artifact) => artifact.status === 'accepted')) {
			return lockedCouncilArtifact({
				label: 'Accept prior artifacts first',
				reason:
					'Council Review needs accepted live story artifacts before it can critique the full production Story Studio chain.',
				retryable: true
			});
		}

		const module = this.moduleRegistry.find('council-review');

		if (!module) {
			return lockedCouncilArtifact({
				label: 'Register council-review',
				reason: 'Council Review is not registered in the story module registry.',
				retryable: false
			});
		}

		if (!this.hasBudgetForProviderCall(input.budget)) {
			return lockedForInsufficientRunBudget('council-review');
		}

		const councilInput = buildCouncilReviewInput(input.request, input.brief, input.priorArtifacts);
		const result = await input.executor.run({
			module,
			context: {
				input: councilInput,
				storyState: input.storyState,
				contestBrief: input.brief,
				mode: 'live',
				now: input.requestedAt
			},
			messages: buildCouncilReviewProviderMessages(councilInput),
			providerInput: buildCouncilReviewProviderInput(councilInput)
		});

		return storyModuleResultToStudioArtifact(
			'council-review',
			toStoryModulePlanResult(module, result)
		);
	}

	private createBudget(): RunLiveStoryStudioBudget {
		return {
			startedAtMs: this.nowMs(),
			maxRunDurationMs: Math.max(1, this.config.maxRunDurationMs ?? 285_000),
			minimumRemainingMsBeforeProviderCall: Math.max(
				1,
				this.config.minimumRemainingMsBeforeProviderCall ?? 70_000
			)
		};
	}

	private hasBudgetForProviderCall(budget: RunLiveStoryStudioBudget): boolean {
		const elapsedMs = Math.max(0, this.nowMs() - budget.startedAtMs);
		const remainingMs = budget.maxRunDurationMs - elapsedMs;
		return remainingMs >= budget.minimumRemainingMsBeforeProviderCall;
	}
}

function lockedCouncilArtifact(nextAction: {
	label: string;
	reason: string;
	retryable: boolean;
}): StoryStudioArtifact {
	return createLockedStoryStudioArtifact({
		id: 'council-review',
		summary: 'Council review is locked until live story artifacts exist for critique.',
		nextAction
	});
}

function hasSelectedMechanism(request: ForgeRequest, mechanismId: MechanismId): boolean {
	return request.selectedMechanisms.includes(mechanismId);
}

function lockedForUnselectedMechanism(input: {
	id: StoryStudioArtifactId;
	label: string;
	reason: string;
}): StoryStudioArtifact {
	return createLockedStoryStudioArtifact({
		id: input.id,
		summary: `${input.label} is locked because its mechanism is not selected.`,
		nextAction: {
			label: input.label,
			reason: input.reason,
			retryable: true
		}
	});
}

function lockedForInsufficientRunBudget(id: StoryStudioArtifactId): StoryStudioArtifact {
	return createLockedStoryStudioArtifact({
		id,
		summary: `${storyStudioArtifactLabels[id]} is locked because the live request budget is nearly exhausted.`,
		nextAction: {
			label: 'Retry Story Studio',
			reason:
				'Story Studio stopped before starting this provider call so Vercel can return a controlled locked state instead of a platform timeout.',
			retryable: true
		}
	});
}
