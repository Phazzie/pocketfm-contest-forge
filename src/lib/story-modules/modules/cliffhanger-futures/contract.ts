// Created: 2026-05-26 13:48

import { z } from 'zod';

export const cliffhangerBeatSchema = z.object({
	id: z.string().min(1),
	minute: z.number().int().nonnegative(),
	function: z.string().min(1),
	text: z.string().min(1),
	unansweredQuestion: z.string().min(1)
});

export const cliffhangerFuturesInputSchema = z.object({
	episodeNumber: z.number().int().positive(),
	episodeTitle: z.string().min(1),
	beats: z.array(cliffhangerBeatSchema).min(3),
	unresolvedDebts: z.array(z.string().min(1)).min(1),
	contestLane: z.string().min(1),
	emotionalPromise: z.string().min(1)
});

export const cliffhangerCandidateSchema = z.object({
	id: z.string().min(1),
	text: z.string().min(20),
	unansweredQuestion: z.string().min(1),
	futuresScore: z.number().int().min(0).max(100),
	volatility: z.enum(['low', 'medium', 'high']),
	payoffPath: z.string().min(1),
	payoffWarning: z.string().min(1)
});

export const cliffhangerFuturesOutputSchema = z.object({
	candidates: z.array(cliffhangerCandidateSchema).min(3).max(5),
	recommendationId: z.string().min(1),
	marketRationale: z.string().min(1)
});

export type CliffhangerFuturesInput = z.infer<typeof cliffhangerFuturesInputSchema>;
export type CliffhangerBeat = z.infer<typeof cliffhangerBeatSchema>;
export type CliffhangerCandidate = z.infer<typeof cliffhangerCandidateSchema>;
export type CliffhangerFuturesOutput = z.infer<typeof cliffhangerFuturesOutputSchema>;
