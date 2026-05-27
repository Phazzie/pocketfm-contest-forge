// Created: 2026-05-26 13:46

import { z } from 'zod';

export const coldOpenLabInputSchema = z.object({
	workingTitle: z.string().min(1),
	protagonistName: z.string().min(1),
	logline: z.string().min(35),
	emotionalPromise: z.string().min(1),
	tabooLever: z.string().min(1),
	contestName: z.string().min(1),
	contestLane: z.string().min(1),
	mandatoryElements: z.array(z.string().min(1)).min(1),
	riskTolerance: z.number().int().min(1).max(5)
});

export const coldOpenVariantSchema = z.object({
	id: z.string().min(1),
	text: z.string().min(20),
	acquisitionStrategy: z.string().min(1),
	firstMinuteQuestion: z.string().min(1),
	audioNote: z.string().min(1),
	rejectionRisk: z.enum(['low', 'medium', 'high'])
});

export const coldOpenLabOutputSchema = z.object({
	variants: z.array(coldOpenVariantSchema).min(3).max(5),
	winnerId: z.string().min(1),
	winnerRationale: z.string().min(1),
	rejectionNotes: z.array(z.string().min(1))
});

export type ColdOpenLabInput = z.infer<typeof coldOpenLabInputSchema>;
export type ColdOpenVariant = z.infer<typeof coldOpenVariantSchema>;
export type ColdOpenLabOutput = z.infer<typeof coldOpenLabOutputSchema>;
