// Created: 2026-05-26 13:50

export const BINGE_DEBT_LEDGER_PROMPT_VERSION = 'binge-debt-ledger.v1';

export const bingeDebtLedgerPrompt = {
	system:
		'Audit serial story promises like debts. Every opened question needs a payoff window or an escalation reason.',
	user: 'Given episode beats, secrets, promises, and a prior ledger, return opened debts, paid debts, stale debts, payoff windows, and an auditor note. Reject debts that have no playable future scene.'
};
