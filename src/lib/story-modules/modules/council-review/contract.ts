// Created: 2026-05-26 14:50

import { z } from 'zod';

export const councilRoleIds = [
	'listener-saboteur',
	'trope-criminal',
	'debt-auditor',
	'voice-actor-ghost',
	'contest-judge',
	'continuity-keeper'
] as const;

export const councilRoleSchema = z.enum(councilRoleIds);

export const councilRoleLabels: Record<CouncilRoleId, string> = {
	'listener-saboteur': 'Listener Saboteur',
	'trope-criminal': 'Trope Criminal',
	'debt-auditor': 'Debt Auditor',
	'voice-actor-ghost': 'Voice Actor Ghost',
	'contest-judge': 'Contest Judge',
	'continuity-keeper': 'Continuity Keeper'
};

export const councilReviewSeedSchema = z.object({
	workingTitle: z.string().min(1),
	protagonistName: z.string().min(1),
	genre: z.string().min(1),
	logline: z.string().min(1),
	emotionalPromise: z.string().min(1),
	tabooLever: z.string().min(1)
});

export const councilReviewContestBriefSchema = z.object({
	id: z.string().min(1),
	contestName: z.string().min(1),
	formatSignal: z.string().min(1),
	promptPressure: z.string().min(1),
	mandatoryElements: z.array(z.string().min(1)).min(1)
});

export const councilAcceptedArtifactSchema = z.object({
	artifactId: z.string().min(1),
	label: z.string().min(1),
	summary: z.string().min(1),
	evidence: z.array(z.string().min(1)).min(1)
});

export const councilArtifactIssueSchema = z.object({
	artifactId: z.string().min(1),
	code: z.string().min(1),
	message: z.string().min(1),
	severity: z.enum(['warning', 'error'])
});

export const councilRejectedArtifactSchema = z.object({
	artifactId: z.string().min(1),
	label: z.string().min(1),
	status: z.enum(['rejected', 'failed', 'locked', 'stale']),
	summary: z.string().min(1),
	issues: z.array(councilArtifactIssueSchema)
});

export const councilReviewInputSchema = z.object({
	seed: councilReviewSeedSchema,
	contestBrief: councilReviewContestBriefSchema,
	acceptedArtifacts: z.array(councilAcceptedArtifactSchema),
	rejectedArtifacts: z.array(councilRejectedArtifactSchema),
	priorQualityIssues: z.array(councilArtifactIssueSchema)
});

export const councilRoleFindingSchema = z.object({
	role: councilRoleSchema,
	finding: z.string().min(20),
	evidence: z.string().min(20),
	revisionMove: z.string().min(20),
	riskIfIgnored: z.string().min(20),
	confidence: z.number().min(0).max(1)
});

export const councilReviewOutputSchema = z.object({
	roles: z.array(councilRoleFindingSchema).length(councilRoleIds.length),
	consensus: z.string().min(20),
	topRevisionMove: z.string().min(20),
	greenlight: z.enum(['ready-for-demo', 'revise-before-submitting', 'blocked'])
});

export type CouncilRoleId = (typeof councilRoleIds)[number];
export type CouncilReviewSeed = z.infer<typeof councilReviewSeedSchema>;
export type CouncilReviewContestBrief = z.infer<typeof councilReviewContestBriefSchema>;
export type CouncilAcceptedArtifact = z.infer<typeof councilAcceptedArtifactSchema>;
export type CouncilArtifactIssue = z.infer<typeof councilArtifactIssueSchema>;
export type CouncilRejectedArtifact = z.infer<typeof councilRejectedArtifactSchema>;
export type CouncilReviewInput = z.infer<typeof councilReviewInputSchema>;
export type CouncilRoleFinding = z.infer<typeof councilRoleFindingSchema>;
export type CouncilReviewOutput = z.infer<typeof councilReviewOutputSchema>;
