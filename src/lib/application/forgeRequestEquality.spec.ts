// Created: 2026-05-29 16:14

import { describe, expect, it } from 'vitest';
import { defaultForgeRequest } from '$lib/application/defaultForgeRequest';
import type { ForgeRequest } from '$lib/core/contracts/contestForgeContract';
import { mechanismsMatch, requestsMatch } from './forgeRequestEquality';

interface ForgeRequestOverrides extends Omit<Partial<ForgeRequest>, 'seed'> {
	seed?: Partial<ForgeRequest['seed']>;
}

function cloneDefaultRequest(overrides: ForgeRequestOverrides = {}): ForgeRequest {
	return {
		...defaultForgeRequest,
		...overrides,
		seed: {
			...defaultForgeRequest.seed,
			...(overrides.seed ?? {})
		},
		selectedMechanisms: overrides.selectedMechanisms ?? [...defaultForgeRequest.selectedMechanisms]
	};
}

describe('forge request equality', () => {
	it('matches identical requests', () => {
		const request = cloneDefaultRequest();

		expect(requestsMatch(request, cloneDefaultRequest())).toBe(true);
	});

	it('detects changed seed fields', () => {
		const current = cloneDefaultRequest();
		const submitted = cloneDefaultRequest({
			seed: {
				logline: 'A different contest seed.'
			}
		});

		expect(requestsMatch(current, submitted)).toBe(false);
	});

	it('keeps selected mechanism order significant', () => {
		const current = cloneDefaultRequest({
			selectedMechanisms: ['retention-black-box', 'binge-debt-ledger']
		});
		const submitted = cloneDefaultRequest({
			selectedMechanisms: ['binge-debt-ledger', 'retention-black-box']
		});

		expect(requestsMatch(current, submitted)).toBe(false);
	});

	it('matches mechanism selections by length and order', () => {
		expect(mechanismsMatch(['retention-black-box'], ['retention-black-box'])).toBe(true);
		expect(
			mechanismsMatch(['retention-black-box'], ['retention-black-box', 'binge-debt-ledger'])
		).toBe(false);
		expect(
			mechanismsMatch(['retention-black-box', 'binge-debt-ledger'], ['binge-debt-ledger'])
		).toBe(false);
	});
});
