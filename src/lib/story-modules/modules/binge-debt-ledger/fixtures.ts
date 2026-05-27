// Created: 2026-05-26 13:50

import type { BingeDebtLedgerInput, BingeDebtLedgerOutput } from './contract';

export const bingeDebtLedgerFixtureInput: BingeDebtLedgerInput = {
	episodeNumber: 1,
	episodeBeats: [
		'Mara Vey wakes to a crowd chanting a stolen name.',
		'The witness lover recognizes Mara only as a criminal.',
		'The crown saves Mara and erases one dangerous memory.'
	],
	secrets: ['the antagonist knows Mara erased name'],
	promises: [
		'the stolen name',
		'the witness who needs Mara alive',
		'the memory erased by the crown'
	],
	priorLedger: {
		open: [],
		paid: [],
		stale: []
	}
};

export const bingeDebtLedgerFixtureOutput: BingeDebtLedgerOutput = {
	openedDebts: [
		{
			id: 'debt-stolen-name',
			label: 'Who stole Mara Vey public name?',
			status: 'open',
			openedInEpisode: 1,
			payoffWindow: 'episodes 2-4',
			interest: 'Each false ceremony makes the theft harder to reverse.'
		},
		{
			id: 'debt-lover-witness',
			label: 'Why does the witness lover need Mara alive but disgraced?',
			status: 'open',
			openedInEpisode: 1,
			payoffWindow: 'episodes 2-3',
			interest: 'Romantic trust decays unless the witness pays a small truth quickly.'
		},
		{
			id: 'debt-erased-memory',
			label: 'Which memory did the crown erase, and who benefits?',
			status: 'open',
			openedInEpisode: 1,
			payoffWindow: 'episodes 3-5',
			interest: 'The absent memory can damage every alliance until partially restored.'
		}
	],
	paidDebts: [
		{
			id: 'paid-former-power',
			label: 'Mara once held enough power for the court to fear her name.',
			status: 'paid',
			openedInEpisode: 1,
			payoffWindow: 'pilot partial payoff',
			interest: 'A partial answer gives the listener trust without solving the erasure.'
		}
	],
	staleDebts: [],
	payoffWindows: [
		{
			debtId: 'debt-lover-witness',
			episodeRange: 'episodes 2-3',
			requiredEscalation: 'The lover must protect Mara publicly while denying her privately.'
		},
		{
			debtId: 'debt-stolen-name',
			episodeRange: 'episodes 2-4',
			requiredEscalation: 'A second claimant uses the stolen name to collect a crown debt.'
		}
	],
	auditorNote:
		'The pilot opens enough debt for binge pull because each question has a specific social or romantic cost.'
};
