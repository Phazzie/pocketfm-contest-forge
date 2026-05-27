// Created: 2026-05-26 13:56

import { describe, expect, it } from 'vitest';
import { ModuleRunner } from '$lib/application/moduleRunner';
import { bingeDebtLedgerFixtureInput } from '$lib/story-modules/modules/binge-debt-ledger/fixtures';
import { bingeDebtLedgerModule } from '$lib/story-modules/modules/binge-debt-ledger/module';
import { createModuleFixtureContext } from '$lib/story-modules/testSupport';

describe('binge debt ledger module', () => {
	it('returns opened, paid, and payoff-window debt records in fixture mode', async () => {
		const result = await new ModuleRunner().run(
			bingeDebtLedgerModule,
			createModuleFixtureContext(bingeDebtLedgerFixtureInput)
		);

		expect(result.status).toBe('success');
		expect(result.output?.openedDebts.length).toBeGreaterThanOrEqual(3);
		expect(result.output?.paidDebts.length).toBeGreaterThanOrEqual(1);
		expect(result.output?.payoffWindows.length).toBeGreaterThanOrEqual(1);
		expect(result.trackingEvents.map((event) => event.type)).toContain('story-debt-opened');
	});
});
