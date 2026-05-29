// Created: 2026-05-29 11:08

import { LiveModuleExecutor } from '$lib/application/liveModuleExecutor';
import { toStoryModulePlanResult } from '$lib/application/storyModulePlanResult';
import {
	buildBingeDebtLedgerInputFromColdOpen,
	buildColdOpenLabInput
} from '$lib/application/storyModuleInputs';
import type { LiveModuleExecutorConfig } from '$lib/application/liveModuleExecutor';
import type { ForgeRequest } from '$lib/core/contracts/contestForgeContract';
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
		const bingeDebtArtifact = await this.runBingeDebtLedger({
			executor,
			coldOpenPlanResult,
			storyState,
			brief,
			requestedAt
		});
		const artifacts: StoryStudioArtifact[] = [
			storyModuleResultToStudioArtifact('cold-open-lab', coldOpenPlanResult),
			bingeDebtArtifact,
			...lockedFutureArtifacts()
		];

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
				trackingEvents: coldOpenPlanResult.trackingEvents
			}
		};
	}

	private async runBingeDebtLedger(input: {
		executor: LiveModuleExecutor;
		coldOpenPlanResult: ReturnType<typeof toStoryModulePlanResult>;
		storyState: ReturnType<typeof createStoryStateFromForgeRequest>;
		brief: NonNullable<ReturnType<ContestResearchPort['findById']>>;
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
}

function lockedFutureArtifacts(): StoryStudioArtifact[] {
	return [
		createLockedStoryStudioArtifact({
			id: 'cliffhanger-futures',
			nextAction: liveGateNextAction('cliffhanger-futures')
		}),
		createLockedStoryStudioArtifact({
			id: 'trope-mutation-lab',
			nextAction: liveGateNextAction('trope-mutation-lab')
		}),
		createLockedStoryStudioArtifact({
			id: 'council-review',
			summary: 'Council review is locked until live story artifacts exist for critique.',
			nextAction: {
				label: 'Implement council-review module',
				reason:
					'Council review must be a registered story module with its own schema, prompt, fixture, provenance, and quality gate.',
				retryable: false
			}
		})
	];
}

function liveGateNextAction(moduleId: string) {
	return {
		label: 'Implement live quality gate',
		reason: `${moduleId} needs a module-specific prompt, provider input, prose extraction, and acceptance gate before it can run live.`,
		retryable: false
	};
}
