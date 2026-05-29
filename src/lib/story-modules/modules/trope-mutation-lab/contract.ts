// Created: 2026-05-26 13:52

import { z } from 'zod';

export const tropeMutationLabInputSchema = z.object({
	contestGenre: z.string().min(1),
	contestName: z.string().min(1),
	mandatoryElements: z.array(z.string().min(1)).min(1),
	seedPremise: z.string().min(35),
	emotionalPromise: z.string().min(1),
	tabooLever: z.string().min(1),
	riskTolerance: z.number().int().min(1).max(5)
});

export const tropeMutationLabOutputSchema = z.object({
	expectedTrope: z.string().min(1),
	mutationRule: z.string().min(1),
	preservedPromise: z.string().min(1),
	confusionGuardrail: z.string().min(1),
	serialEngine: z.string().min(1),
	sceneProof: z.string().min(1),
	episodePressure: z.array(z.string().min(1)).min(3),
	rejectionNote: z.string().min(1)
});

export type TropeMutationLabInput = z.infer<typeof tropeMutationLabInputSchema>;
export type TropeMutationLabOutput = z.infer<typeof tropeMutationLabOutputSchema>;
