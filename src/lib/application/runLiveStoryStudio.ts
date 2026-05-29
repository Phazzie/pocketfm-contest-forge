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
	StoryModulePlanResult
} from '$lib/core/contracts/contestForgeContract';
import {
	createLockedStoryStudioArtifact,
	createUnknownContestFreshness,
	storyModuleResultToStudioArtifact,
	summarizeStoryStudioArtifacts,
	type StoryStudioArtifact,
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
	executorConfig?: LiveModuleExecutorConfig;
}

export class RunLiveStoryStudio {
	private readonly now: () => Date;

	constructor(
		private readonly research: ContestResearchPort,
		private readonly provider: StoryModuleProvider,
		private readonly moduleRegistry: StoryModuleRegistry,
		private readonly config: RunLiveStoryStudioConfig = {}
	) {
		this.now = config.now ?? (() => new Date());
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

		const coldOpenModule = this.moduleRegistry.find('cold-open-lab');

		if (!coldOpenModule) {
			return {
				success: false,
				error: {
					code: 'STUDIO_RUN_FAILED',
					message: 'Cold Open Lab is not registered, so Story Studio cannot run.'
				}
			};
		}

		const requestedAt = this.now();
		const coldOpenInput = buildColdOpenLabInput(request, brief);
		const storyState = createStoryStateFromForgeRequest(request, brief, undefined, {
			generationMode: 'live-ai'
		});
		const executor = new LiveModuleExecutor(this.provider, this.config.executorConfig);
		const coldOpenResult = await executor.run({
			module: coldOpenModule,
			context: {
				input: coldOpenInput,
				storyState,
				contestBrief: brief,
				mode: 'live',
				now: requestedAt
			},
			messages: buildColdOpenLabProviderMessages(coldOpenInput),
			providerInput: buildColdOpenLabProviderInput(coldOpenInput)
		});
		const coldOpenPlanResult = toStoryModulePlanResult(coldOpenModule, coldOpenResult);
		const coldOpenArtifact = storyModuleResultToStudioArtifact('cold-open-lab', coldOpenPlanResult);
		const bingeDebtArtifact = await this.runBingeDebtLedger({
			executor,
			coldOpenPlanResult,
			storyState,
			brief,
			requestedAt
		});
		const cliffhangerArtifact = await this.runCliffhangerFutures({
			request,
			executor,
			coldOpenPlanResult,
			bingeDebtArtifact,
			storyState,
			brief,
			requestedAt
		});
		const tropeArtifact = await this.runTropeMutationLab({
			request,
			executor,
			coldOpenPlanResult,
			bingeDebtArtifact,
			cliffhangerArtifact,
			storyState,
			brief,
			requestedAt
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
			requestedAt
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
				contestFreshness: createUnknownContestFreshness(),
				trackingEvents: artifacts.flatMap((artifact) => artifact.result?.trackingEvents ?? [])
			}
		};
	}

	private async runBingeDebtLedger(input: {
		executor: LiveModuleExecutor;
		coldOpenPlanResult: ReturnType<typeof toStoryModulePlanResult>;
		storyState: ReturnType<typeof createStoryStateFromForgeRequest>;
		brief: ContestBrief;
		requestedAt: Date;
	}): Promise<StoryStudioArtifact> {
		const parsedColdOpen = coldOpenLabOutputSchema.safeParse(input.coldOpenPlanResult.output);

		if (input.coldOpenPlanResult.status !== 'success' || !parsedColdOpen.success) {
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
		coldOpenPlanResult: StoryModulePlanResult;
		bingeDebtArtifact: StoryStudioArtifact;
		storyState: ReturnType<typeof createStoryStateFromForgeRequest>;
		brief: ContestBrief;
		requestedAt: Date;
	}): Promise<StoryStudioArtifact> {
		const parsedColdOpen = coldOpenLabOutputSchema.safeParse(input.coldOpenPlanResult.output);
		const parsedBingeDebt = bingeDebtLedgerOutputSchema.safeParse(
			input.bingeDebtArtifact.result?.output
		);

		if (input.coldOpenPlanResult.status !== 'success' || !parsedColdOpen.success) {
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
		coldOpenPlanResult: StoryModulePlanResult;
		bingeDebtArtifact: StoryStudioArtifact;
		cliffhangerArtifact: StoryStudioArtifact;
		storyState: ReturnType<typeof createStoryStateFromForgeRequest>;
		brief: ContestBrief;
		requestedAt: Date;
	}): Promise<StoryStudioArtifact> {
		const parsedColdOpen = coldOpenLabOutputSchema.safeParse(input.coldOpenPlanResult.output);
		const parsedBingeDebt = bingeDebtLedgerOutputSchema.safeParse(
			input.bingeDebtArtifact.result?.output
		);
		const parsedCliffhanger = cliffhangerFuturesOutputSchema.safeParse(
			input.cliffhangerArtifact.result?.output
		);

		if (
			input.coldOpenPlanResult.status !== 'success' ||
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
