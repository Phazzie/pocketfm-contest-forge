// Created: 2026-05-26 13:50

import type { BingeDebtLedgerInput, LedgerDebt } from './contract';
import type {
	SerializableProviderInput,
	SerializableProviderValue,
	StoryModuleProviderMessage
} from '$lib/core/ports/storyModuleProviderPort';

export const BINGE_DEBT_LEDGER_PROMPT_VERSION = 'binge-debt-ledger.v1';

export const bingeDebtLedgerPrompt = {
	system:
		'Audit serial story promises like debts. Return concrete continuity records, not writing advice.',
	user: 'Given episode beats, secrets, promises, and a prior ledger, return opened debts, paid debts, stale debts, payoff windows, and an auditor note. Every open or stale debt must have a matching payoff window and a public, relationship, secret, trust, name, or price cost.'
};

export function buildBingeDebtLedgerProviderInput(
	input: BingeDebtLedgerInput
): SerializableProviderInput {
	return {
		episodeNumber: input.episodeNumber,
		episodeBeats: input.episodeBeats,
		secrets: input.secrets,
		promises: input.promises,
		priorLedger: {
			open: input.priorLedger.open.map(ledgerDebtToProviderValue),
			paid: input.priorLedger.paid.map(ledgerDebtToProviderValue),
			stale: input.priorLedger.stale.map(ledgerDebtToProviderValue)
		}
	};
}

export function buildBingeDebtLedgerProviderMessages(
	input: BingeDebtLedgerInput
): StoryModuleProviderMessage[] {
	return [
		{
			role: 'system',
			content: [
				bingeDebtLedgerPrompt.system,
				`Prompt version: ${BINGE_DEBT_LEDGER_PROMPT_VERSION}.`,
				'Return only valid JSON. Do not wrap the JSON in markdown.',
				'Do not include comments, markdown, bullets outside JSON, or extra prose.',
				'Each openedDebts, paidDebts, and staleDebts item must include id, label, status, openedInEpisode, payoffWindow, and interest.',
				'Every open or stale debt id must appear exactly once in payoffWindows.',
				'Every payoff window must include debtId, episodeRange, and requiredEscalation.',
				'Use status values only from open, paid, stale.',
				'Every interest and requiredEscalation must name a specific relationship, public status wound, secret, trust fracture, name theft, or price.',
				'Do not use generic craft phrases such as strong hook, raise the stakes, emotional stakes, or build suspense.'
			].join('\n')
		},
		{
			role: 'user',
			content: [
				bingeDebtLedgerPrompt.user,
				'Output shape:',
				JSON.stringify(
					{
						openedDebts: [
							{
								id: 'debt-specific-slug',
								label: 'Specific listener question from the episode.',
								status: 'open',
								openedInEpisode: input.episodeNumber,
								payoffWindow: 'episodes 2-4',
								interest: 'Why this debt gains pressure through a concrete cost.'
							}
						],
						paidDebts: [],
						staleDebts: [],
						payoffWindows: [
							{
								debtId: 'debt-specific-slug',
								episodeRange: 'episodes 2-4',
								requiredEscalation: 'The public or relationship event that must happen.'
							}
						],
						auditorNote: 'How these debts pull the next binge decision.'
					},
					null,
					2
				),
				'Input:',
				JSON.stringify(buildBingeDebtLedgerProviderInput(input), null, 2)
			].join('\n')
		}
	];
}

function ledgerDebtToProviderValue(debt: LedgerDebt): Record<string, SerializableProviderValue> {
	return {
		id: debt.id,
		label: debt.label,
		status: debt.status,
		openedInEpisode: debt.openedInEpisode,
		payoffWindow: debt.payoffWindow,
		interest: debt.interest
	};
}
