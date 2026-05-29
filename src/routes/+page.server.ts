// Created: 2026-05-26 01:35

import { env } from '$env/dynamic/private';
import { fail, type Actions } from '@sveltejs/kit';
import { createInitialStoryStudioRun } from '$lib/application/createInitialStoryStudioRun';
import { defaultForgeRequest } from '$lib/application/defaultForgeRequest';
import { RunLiveStoryStudio } from '$lib/application/runLiveStoryStudio';
import { createXaiStoryModuleProviderFromEnv } from '$lib/adapters/ai/xaiStoryModuleProvider';
import { InMemoryContestResearchRepository } from '$lib/adapters/research/inMemoryContestResearchRepository';
import type { ForgeRequest, RiskTolerance } from '$lib/core/contracts/contestForgeContract';
import {
	isContestGenre,
	isMechanismId,
	validateForgeRequest
} from '$lib/core/contracts/contestForgeContract';
import type { StoryStudioResponse } from '$lib/core/contracts/storyStudioContract';
import { mechanismCatalog } from '$lib/core/domain/mechanisms';
import { consumeLiveAiQuota, verifyLiveAiAccessCode } from '$lib/server/liveAiAccess';
import { defaultStoryModuleRegistry } from '$lib/story-modules/registry';

const LIVE_STORY_STUDIO_PROVIDER_TIMEOUT_MS = 45_000;
const LIVE_STORY_STUDIO_EXECUTOR_TIMEOUT_MS = 46_000;

export async function load() {
	const research = new InMemoryContestResearchRepository();
	const brief = research.findById(defaultForgeRequest.contestId);
	const initialStudioRuns = Object.fromEntries(
		research.list().map((candidate) => [candidate.id, createInitialStoryStudioRun(candidate)])
	);

	if (!brief) {
		throw new Error(`Default contest brief missing: ${defaultForgeRequest.contestId}.`);
	}

	return {
		initialStudioRun: createInitialStoryStudioRun(brief),
		initialStudioRuns,
		defaultRequest: defaultForgeRequest,
		briefs: research.list(),
		mechanisms: mechanismCatalog
	};
}

export const actions: Actions = {
	runLiveStudio: async ({ request, getClientAddress }) => {
		const formData = await request.formData();
		const submittedRequest = parseForgeRequest(formData);
		const clientKey = safeClientAddress(getClientAddress);
		const accessFailure = verifyLiveAiAccessCode({
			configuredAccessCode: env['STORY_AI_ACCESS_CODE'],
			submittedAccessCode: stringValue(formData, 'accessCode'),
			clientKey
		});

		if (accessFailure) {
			const storyStudio = storyStudioFailureFromAccessFailure(accessFailure);

			return fail(statusForStoryStudioFailure(storyStudio), {
				submittedRequest,
				storyStudio
			});
		}

		const research = new InMemoryContestResearchRepository();
		const requestFailure = validateLiveStudioRequest(submittedRequest, research);

		if (requestFailure) {
			return fail(statusForStoryStudioFailure(requestFailure), {
				submittedRequest,
				storyStudio: requestFailure
			});
		}

		const quotaFailure = consumeLiveAiQuota({ clientKey });

		if (quotaFailure) {
			const storyStudio = storyStudioFailureFromAccessFailure(quotaFailure);

			return fail(statusForStoryStudioFailure(storyStudio), {
				submittedRequest,
				storyStudio
			});
		}

		const provider = createXaiStoryModuleProviderFromEnv(env, {
			timeoutMs: LIVE_STORY_STUDIO_PROVIDER_TIMEOUT_MS
		});
		const storyStudio = await new RunLiveStoryStudio(
			research,
			provider,
			defaultStoryModuleRegistry,
			{
				executorConfig: {
					providerTimeoutMs: LIVE_STORY_STUDIO_EXECUTOR_TIMEOUT_MS
				}
			}
		).run(submittedRequest);

		if (!storyStudio.success) {
			return fail(statusForStoryStudioFailure(storyStudio), {
				submittedRequest,
				storyStudio
			});
		}

		return {
			submittedRequest,
			storyStudio
		};
	}
};

function validateLiveStudioRequest(
	request: ForgeRequest,
	research: InMemoryContestResearchRepository
): Extract<StoryStudioResponse, { success: false }> | undefined {
	const issues = validateForgeRequest(request);
	const errors = issues.filter((issue) => issue.severity === 'error');

	if (errors.length > 0) {
		return {
			success: false,
			error: {
				code: 'CONTRACT_INVALID',
				message: 'Live Story Studio request failed contract validation.',
				issues
			}
		};
	}

	if (!research.findById(request.contestId)) {
		return {
			success: false,
			error: {
				code: 'CONTEST_NOT_FOUND',
				message: `No contest brief found for ${request.contestId}.`
			}
		};
	}

	return undefined;
}

function storyStudioFailureFromAccessFailure(
	response: Extract<ReturnType<typeof verifyLiveAiAccessCode>, { success: false }>
): Extract<StoryStudioResponse, { success: false }> {
	return {
		success: false,
		error: response.error
	};
}

function parseForgeRequest(formData: FormData): ForgeRequest {
	const contestIdValue = stringValue(formData, 'contestId');
	const contestId = isContestGenre(contestIdValue) ? contestIdValue : defaultForgeRequest.contestId;
	const selectedMechanisms = formData
		.getAll('selectedMechanisms')
		.map((value) => String(value))
		.filter(isMechanismId);

	return {
		...defaultForgeRequest,
		contestId,
		riskTolerance: riskToleranceValue(formData, 'riskTolerance'),
		selectedMechanisms,
		seed: {
			...defaultForgeRequest.seed,
			workingTitle: stringValue(formData, 'workingTitle', defaultForgeRequest.seed.workingTitle),
			protagonistName: stringValue(
				formData,
				'protagonistName',
				defaultForgeRequest.seed.protagonistName
			),
			logline: stringValue(formData, 'logline', defaultForgeRequest.seed.logline),
			genre: contestId,
			emotionalPromise: stringValue(
				formData,
				'emotionalPromise',
				defaultForgeRequest.seed.emotionalPromise
			),
			tabooLever: stringValue(formData, 'tabooLever', defaultForgeRequest.seed.tabooLever),
			episodeCountTarget: numberValue(
				formData,
				'episodeCountTarget',
				defaultForgeRequest.seed.episodeCountTarget
			),
			minutesPerEpisode: numberValue(
				formData,
				'minutesPerEpisode',
				defaultForgeRequest.seed.minutesPerEpisode
			)
		}
	};
}

function statusForStoryStudioFailure(response: Extract<StoryStudioResponse, { success: false }>) {
	switch (response.error.code) {
		case 'ACCESS_DENIED':
			return 403;
		case 'ACCESS_NOT_CONFIGURED':
			return 503;
		case 'RATE_LIMITED':
			return 429;
		case 'CONTEST_NOT_FOUND':
			return 404;
		case 'CONTRACT_INVALID':
			return 400;
		case 'PROVIDER_UNAVAILABLE':
			return 503;
		case 'STUDIO_RUN_FAILED':
			return 500;
	}
}

function stringValue(formData: FormData, name: string, fallback = ''): string {
	const value = formData.get(name);
	return typeof value === 'string' ? value : fallback;
}

function numberValue(formData: FormData, name: string, fallback: number): number {
	const parsed = Number(stringValue(formData, name));
	return Number.isFinite(parsed) ? parsed : fallback;
}

function riskToleranceValue(formData: FormData, name: string): RiskTolerance {
	const parsed = Math.round(numberValue(formData, name, defaultForgeRequest.riskTolerance));

	if (parsed === 1 || parsed === 2 || parsed === 3 || parsed === 4 || parsed === 5) {
		return parsed;
	}

	return defaultForgeRequest.riskTolerance;
}

function safeClientAddress(getClientAddress: () => string): string {
	try {
		return getClientAddress();
	} catch {
		return 'unknown-client';
	}
}
