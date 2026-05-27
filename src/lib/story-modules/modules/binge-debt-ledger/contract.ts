// Created: 2026-05-26 13:50

import { z } from 'zod';

export const ledgerDebtSchema = z.object({
	id: z.string().min(1),
	label: z.string().min(1),
	status: z.enum(['open', 'paid', 'stale']),
	openedInEpisode: z.number().int().positive(),
	payoffWindow: z.string().min(1),
	interest: z.string().min(1)
});

export const bingeDebtLedgerInputSchema = z.object({
	episodeNumber: z.number().int().positive(),
	episodeBeats: z.array(z.string().min(1)).min(3),
	secrets: z.array(z.string().min(1)),
	promises: z.array(z.string().min(1)),
	priorLedger: z.object({
		open: z.array(ledgerDebtSchema),
		paid: z.array(ledgerDebtSchema),
		stale: z.array(ledgerDebtSchema)
	})
});

export const payoffWindowSchema = z.object({
	debtId: z.string().min(1),
	episodeRange: z.string().min(1),
	requiredEscalation: z.string().min(1)
});

export const bingeDebtLedgerOutputSchema = z.object({
	openedDebts: z.array(ledgerDebtSchema),
	paidDebts: z.array(ledgerDebtSchema),
	staleDebts: z.array(ledgerDebtSchema),
	payoffWindows: z.array(payoffWindowSchema).min(1),
	auditorNote: z.string().min(1)
});

export type LedgerDebt = z.infer<typeof ledgerDebtSchema>;
export type BingeDebtLedgerInput = z.infer<typeof bingeDebtLedgerInputSchema>;
export type PayoffWindow = z.infer<typeof payoffWindowSchema>;
export type BingeDebtLedgerOutput = z.infer<typeof bingeDebtLedgerOutputSchema>;
