// Created: 2026-05-26 13:50

import {
	bingeDebtLedgerInputSchema,
	bingeDebtLedgerOutputSchema,
	type BingeDebtLedgerInput,
	type BingeDebtLedgerOutput
} from './contract';
import { bingeDebtLedgerFixtureOutput } from './fixtures';
import { BINGE_DEBT_LEDGER_PROMPT_VERSION } from './prompts';
import type { StoryModule } from '$lib/story-modules/types';
import { createFixtureProvenance, moduleCompletedEvent } from '$lib/story-modules/types';

export const bingeDebtLedgerModule: StoryModule<BingeDebtLedgerInput, BingeDebtLedgerOutput> = {
	id: 'binge-debt-ledger',
	version: '1.0.0',
	label: 'Binge Debt Ledger',
	category: 'continuity',
	inputSchema: bingeDebtLedgerInputSchema,
	outputSchema: bingeDebtLedgerOutputSchema,
	requiredState: ['episodeHistory', 'debts.open', 'secrets'],
	promptVersion: BINGE_DEBT_LEDGER_PROMPT_VERSION,
	qualityGates: ['no-debt-without-payoff', 'stale-debt-escalates'],
	async run(context) {
		if (context.mode === 'live') {
			return {
				status: 'failed',
				summary: 'Binge Debt Ledger requires a live AI provider before production generation.',
				issues: [
					{
						code: 'PROVIDER_UNAVAILABLE',
						message: 'No live AI adapter is wired for Binge Debt Ledger.',
						severity: 'error'
					}
				],
				provenance: createFixtureProvenance(bingeDebtLedgerModule, context),
				trackingEvents: [
					{
						type: 'quality-rejection',
						moduleId: 'binge-debt-ledger',
						subjectId: 'binge-debt-ledger',
						summary: 'Failed closed instead of fabricating continuity debt.'
					}
				]
			};
		}

		return {
			status: 'success',
			output: bingeDebtLedgerFixtureOutput,
			summary: 'Opened three collectible debts and scheduled early payoff windows.',
			issues: [],
			provenance: createFixtureProvenance(bingeDebtLedgerModule, context),
			trackingEvents: [
				...bingeDebtLedgerFixtureOutput.openedDebts.map((debt) => ({
					type: 'story-debt-opened' as const,
					moduleId: 'binge-debt-ledger' as const,
					subjectId: debt.id,
					summary: debt.label,
					episodeNumber: context.input.episodeNumber
				})),
				...bingeDebtLedgerFixtureOutput.paidDebts.map((debt) => ({
					type: 'story-debt-paid' as const,
					moduleId: 'binge-debt-ledger' as const,
					subjectId: debt.id,
					summary: debt.label,
					episodeNumber: context.input.episodeNumber
				})),
				moduleCompletedEvent(
					'binge-debt-ledger',
					'Binge debt ledger fixture output accepted in demo mode.'
				)
			]
		};
	}
};
