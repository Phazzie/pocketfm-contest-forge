// Created: 2026-05-26 14:50

import { councilRoleIds, councilRoleLabels, type CouncilReviewInput } from './contract';
import type {
	SerializableProviderInput,
	SerializableProviderValue,
	StoryModuleProviderMessage
} from '$lib/core/ports/storyModuleProviderPort';

export const COUNCIL_REVIEW_PROMPT_VERSION = 'council-review.v2';

export const councilReviewPrompt = {
	system:
		'Run a six-role serial story council. Critique accepted artifacts with evidence and concrete revision moves. Do not invent missing artifacts.',
	user: 'Given the story seed, contest brief, accepted artifacts, rejected artifact summaries, and prior quality issues, return one finding for each required council role.'
};

export function buildCouncilReviewProviderInput(
	input: CouncilReviewInput
): SerializableProviderInput {
	return {
		seed: {
			workingTitle: input.seed.workingTitle,
			protagonistName: input.seed.protagonistName,
			genre: input.seed.genre,
			logline: input.seed.logline,
			emotionalPromise: input.seed.emotionalPromise,
			tabooLever: input.seed.tabooLever
		},
		contestBrief: {
			id: input.contestBrief.id,
			contestName: input.contestBrief.contestName,
			formatSignal: input.contestBrief.formatSignal,
			promptPressure: input.contestBrief.promptPressure,
			mandatoryElements: input.contestBrief.mandatoryElements
		},
		acceptedArtifacts: input.acceptedArtifacts.map((artifact) => ({
			artifactId: artifact.artifactId,
			label: artifact.label,
			summary: artifact.summary,
			evidence: artifact.evidence
		})),
		rejectedArtifacts: input.rejectedArtifacts.map((artifact) => ({
			artifactId: artifact.artifactId,
			label: artifact.label,
			status: artifact.status,
			summary: artifact.summary,
			issues: artifact.issues.map(issueToProviderValue)
		})),
		priorQualityIssues: input.priorQualityIssues.map(issueToProviderValue)
	};
}

export function buildCouncilReviewProviderMessages(
	input: CouncilReviewInput
): StoryModuleProviderMessage[] {
	return [
		{
			role: 'system',
			content: [
				councilReviewPrompt.system,
				`Prompt version: ${COUNCIL_REVIEW_PROMPT_VERSION}.`,
				'Return only valid JSON. Do not wrap the JSON in markdown.',
				'Do not include comments, markdown, bullets outside JSON, or extra prose.',
				`Return exactly these roles once each: ${councilRoleIds
					.map((role) => `${role} (${councilRoleLabels[role]})`)
					.join(', ')}.`,
				'Each role must include finding, evidence, revisionMove, riskIfIgnored, and confidence.',
				'Evidence must cite a concrete accepted artifact, rejected artifact issue, contest requirement, or seed detail.',
				'Every revisionMove must include at least one action cue: add, cut, delay, force, keep, lock, make, mark, move, pay, put, rebuild, reveal, rewrite, save, or track.',
				'Every revisionMove must include at least one concrete cost word: betrayal, cost, court, debt, family, lover, name, price, public, relationship, reputation, secret, shame, status, or trust.',
				'Every riskIfIgnored must start with "Specific risk:" or "Audience risk:" and name a concrete drop, trust, confusion, fake-payoff, stale-debt, generic-lane, or rejection risk.',
				'Revision moves must be playable story changes, not abstract writing advice.',
				'Do not use generic craft phrases such as strong hook, raise the stakes, emotional stakes, or build suspense.',
				'If a prior artifact is missing or rejected, critique that absence directly instead of inventing the missing artifact.'
			].join('\n')
		},
		{
			role: 'user',
			content: [
				councilReviewPrompt.user,
				'Output shape:',
				JSON.stringify(
					{
						roles: councilRoleIds.map((role) => ({
							role,
							finding: 'Specific role finding grounded in the provided artifacts.',
							evidence: 'Concrete artifact, issue, contest, or seed evidence.',
							revisionMove:
								'Add one public witness choice, then make that choice cost the protagonist a lover trust debt.',
							riskIfIgnored:
								'Specific risk: listeners lose trust because the unpaid name debt feels fake.',
							confidence: 0.82
						})),
						consensus: 'The shared council judgment across roles.',
						topRevisionMove:
							'Rebuild the next public scene around one name debt that costs status and relationship trust.',
						greenlight: 'revise-before-submitting'
					},
					null,
					2
				),
				'Input:',
				JSON.stringify(buildCouncilReviewProviderInput(input), null, 2)
			].join('\n')
		}
	];
}

function issueToProviderValue(issue: {
	artifactId: string;
	code: string;
	message: string;
	severity: 'warning' | 'error';
}): Record<string, SerializableProviderValue> {
	return {
		artifactId: issue.artifactId,
		code: issue.code,
		message: issue.message,
		severity: issue.severity
	};
}
