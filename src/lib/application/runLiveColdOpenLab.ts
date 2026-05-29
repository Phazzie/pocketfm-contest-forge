// Created: 2026-05-28 05:44

import { LiveModuleExecutor } from '$lib/application/liveModuleExecutor';
import { toStoryModulePlanResult } from '$lib/application/storyModulePlanResult';
import type { LiveModuleExecutorConfig } from '$lib/application/liveModuleExecutor';
import type { ContestResearchPort } from '$lib/core/ports/contestResearchPort';
import type { StoryModuleProvider } from '$lib/core/ports/storyModuleProviderPort';
import type { ForgeRequest, LiveColdOpenResponse } from '$lib/core/contracts/contestForgeContract';
import { validateForgeRequest } from '$lib/core/contracts/contestForgeContract';
import { createStoryStateFromForgeRequest } from '$lib/core/story-state/storyStateValidation';
import { buildColdOpenLabInput } from '$lib/application/storyModuleInputs';
import { coldOpenLabModule } from '$lib/story-modules/modules/cold-open-lab/module';
import {
	buildColdOpenLabProviderInput,
	buildColdOpenLabProviderMessages
} from '$lib/story-modules/modules/cold-open-lab/prompts';

export interface RunLiveColdOpenLabConfig {
	now?: () => Date;
	executorConfig?: LiveModuleExecutorConfig;
}

export class RunLiveColdOpenLab {
	private readonly now: () => Date;

	constructor(
		private readonly research: ContestResearchPort,
		private readonly provider: StoryModuleProvider,
		private readonly config: RunLiveColdOpenLabConfig = {}
	) {
		this.now = config.now ?? (() => new Date());
	}

	async run(request: ForgeRequest): Promise<LiveColdOpenResponse> {
		const issues = validateForgeRequest(request);
		const errors = issues.filter((issue) => issue.severity === 'error');

		if (errors.length > 0) {
			return {
				success: false,
				error: {
					code: 'CONTRACT_INVALID',
					message: 'Live cold open request failed contract validation.',
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

		const now = this.now();
		const input = buildColdOpenLabInput(request, brief);
		const storyState = createStoryStateFromForgeRequest(request, brief, undefined, {
			generationMode: 'live-ai'
		});
		const executor = new LiveModuleExecutor(this.provider, this.config.executorConfig);
		const moduleResult = await executor.run({
			module: coldOpenLabModule,
			context: {
				input,
				storyState,
				contestBrief: brief,
				mode: 'live',
				now
			},
			messages: buildColdOpenLabProviderMessages(input),
			providerInput: buildColdOpenLabProviderInput(input)
		});

		return {
			success: true,
			data: {
				generationMode: 'live-ai',
				brief,
				moduleResult: toStoryModulePlanResult(coldOpenLabModule, moduleResult),
				requestedAt: now.toISOString()
			}
		};
	}
}
