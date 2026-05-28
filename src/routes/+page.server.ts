// Created: 2026-05-26 01:35

import { env } from '$env/dynamic/private';
import { fail, type Actions } from '@sveltejs/kit';
import { createDefaultForge, defaultForgeRequest } from '$lib/application/createDefaultForge';
import { RunLiveColdOpenLab } from '$lib/application/runLiveColdOpenLab';
import { createXaiStoryModuleProviderFromEnv } from '$lib/adapters/ai/xaiStoryModuleProvider';
import { InMemoryContestResearchRepository } from '$lib/adapters/research/inMemoryContestResearchRepository';
import type {
	ForgeRequest,
	LiveColdOpenResponse,
	RiskTolerance
} from '$lib/core/contracts/contestForgeContract';
import {
	isContestGenre,
	isMechanismId,
	validateForgeRequest
} from '$lib/core/contracts/contestForgeContract';
import { mechanismCatalog } from '$lib/core/domain/mechanisms';
import { consumeLiveAiQuota, verifyLiveAiAccessCode } from '$lib/server/liveAiAccess';

export async function load() {
	const forge = createDefaultForge();
	const initial = await forge.forge(defaultForgeRequest);
	const research = new InMemoryContestResearchRepository();

	if (!initial.success) {
		throw new Error(initial.error.message);
	}

	return {
		initialPlan: initial.data,
		defaultRequest: defaultForgeRequest,
		briefs: research.list(),
		mechanisms: mechanismCatalog
	};
}

export const actions: Actions = {
	runLiveColdOpen: async ({ request, getClientAddress }) => {
		const formData = await request.formData();
		const submittedRequest = parseForgeRequest(formData);
		const clientKey = safeClientAddress(getClientAddress);
		const accessFailure = verifyLiveAiAccessCode({
			configuredAccessCode: env['STORY_AI_ACCESS_CODE'],
			submittedAccessCode: stringValue(formData, 'accessCode'),
			clientKey
		});

		if (accessFailure) {
			return fail(statusForLiveColdOpenFailure(accessFailure), {
				submittedRequest,
				liveColdOpen: accessFailure
			});
		}

		const research = new InMemoryContestResearchRepository();
		const requestFailure = validateLiveColdOpenRequest(submittedRequest, research);

		if (requestFailure) {
			return fail(statusForLiveColdOpenFailure(requestFailure), {
				submittedRequest,
				liveColdOpen: requestFailure
			});
		}

		const quotaFailure = consumeLiveAiQuota({ clientKey });

		if (quotaFailure) {
			return fail(statusForLiveColdOpenFailure(quotaFailure), {
				submittedRequest,
				liveColdOpen: quotaFailure
			});
		}

		const provider = createXaiStoryModuleProviderFromEnv(env);
		const liveColdOpen = await new RunLiveColdOpenLab(research, provider).run(submittedRequest);

		if (!liveColdOpen.success) {
			return fail(statusForLiveColdOpenFailure(liveColdOpen), {
				submittedRequest,
				liveColdOpen
			});
		}

		return {
			submittedRequest,
			liveColdOpen
		};
	}
};

function validateLiveColdOpenRequest(
	request: ForgeRequest,
	research: InMemoryContestResearchRepository
): Extract<LiveColdOpenResponse, { success: false }> | undefined {
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

function statusForLiveColdOpenFailure(response: Extract<LiveColdOpenResponse, { success: false }>) {
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
