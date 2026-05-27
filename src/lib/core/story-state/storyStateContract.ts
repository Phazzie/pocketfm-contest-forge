// Created: 2026-05-26 13:42

import { z } from 'zod';

export const storyCharacterSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	role: z.enum(['protagonist', 'antagonist', 'supporting', 'love-interest', 'rival', 'mentor']),
	publicStatus: z.string().min(1),
	privateWant: z.string().min(1),
	tabooPressure: z.string().min(1),
	relationshipToProtagonist: z.string().min(1)
});

export const desireTabooSchema = z.object({
	coreDesire: z.string().min(1),
	tabooLever: z.string().min(1),
	emotionalPromise: z.string().min(1),
	statusCost: z.string().min(1)
});

export const storySecretSchema = z.object({
	id: z.string().min(1),
	holderId: z.string().min(1),
	description: z.string().min(1),
	exposureCost: z.string().min(1),
	status: z.enum(['hidden', 'hinted', 'revealed'])
});

export const storyRuleSchema = z.object({
	id: z.string().min(1),
	label: z.string().min(1),
	mechanic: z.string().min(1),
	cost: z.string().min(1),
	source: z.enum(['seed', 'contest-brief', 'module', 'writer'])
});

export const episodeHistorySchema = z.object({
	episodeNumber: z.number().int().positive(),
	title: z.string().min(1),
	beatIds: z.array(z.string().min(1)),
	cliffhanger: z.string().min(1),
	debtsOpened: z.array(z.string().min(1)),
	debtsPaid: z.array(z.string().min(1))
});

export const storyDebtSchema = z.object({
	id: z.string().min(1),
	label: z.string().min(1),
	status: z.enum(['open', 'paid', 'stale']),
	openedInEpisode: z.number().int().positive(),
	payoffWindow: z.string().min(1),
	sourceModuleId: z.string().min(1).optional(),
	notes: z.string().min(1).optional()
});

export const continuityFactSchema = z.object({
	id: z.string().min(1),
	fact: z.string().min(1),
	lockedBy: z.enum(['seed', 'episode', 'module', 'writer']),
	episodeNumber: z.number().int().positive().optional()
});

export const writerDecisionSchema = z.object({
	id: z.string().min(1),
	decision: z.string().min(1),
	rationale: z.string().min(1),
	madeAt: z.string().min(1)
});

export const aiSuggestionSchema = z.object({
	id: z.string().min(1),
	moduleId: z.string().min(1),
	suggestion: z.string().min(1),
	status: z.enum(['accepted', 'rejected']),
	reason: z.string().min(1)
});

export const storyStateSchema = z.object({
	contestBrief: z.object({
		id: z.string().min(1),
		contestName: z.string().min(1),
		version: z.string().min(1),
		promptPressure: z.string().min(1)
	}),
	protagonist: storyCharacterSchema,
	antagonist: storyCharacterSchema.nullable(),
	supportingCast: z.array(storyCharacterSchema),
	desireTaboo: desireTabooSchema,
	secrets: z.array(storySecretSchema),
	rules: z.array(storyRuleSchema),
	episodeHistory: z.array(episodeHistorySchema),
	debts: z.object({
		open: z.array(storyDebtSchema),
		paid: z.array(storyDebtSchema),
		stale: z.array(storyDebtSchema)
	}),
	continuityFacts: z.array(continuityFactSchema),
	writerDecisions: z.array(writerDecisionSchema),
	aiSuggestions: z.array(aiSuggestionSchema)
});

export type StoryCharacter = z.infer<typeof storyCharacterSchema>;
export type DesireTaboo = z.infer<typeof desireTabooSchema>;
export type StorySecret = z.infer<typeof storySecretSchema>;
export type StoryRule = z.infer<typeof storyRuleSchema>;
export type EpisodeHistory = z.infer<typeof episodeHistorySchema>;
export type StoryDebt = z.infer<typeof storyDebtSchema>;
export type ContinuityFact = z.infer<typeof continuityFactSchema>;
export type WriterDecision = z.infer<typeof writerDecisionSchema>;
export type AiSuggestion = z.infer<typeof aiSuggestionSchema>;
export type StoryState = z.infer<typeof storyStateSchema>;

export type StoryStateRequirement =
	| 'contestBrief'
	| 'protagonist'
	| 'antagonist'
	| 'supportingCast'
	| 'desireTaboo'
	| 'secrets'
	| 'rules'
	| 'episodeHistory'
	| 'debts.open'
	| 'debts.paid'
	| 'debts.stale'
	| 'continuityFacts'
	| 'writerDecisions'
	| 'aiSuggestions';
