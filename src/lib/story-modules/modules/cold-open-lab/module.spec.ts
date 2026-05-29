// Created: 2026-05-26 13:56

import { describe, expect, it } from 'vitest';
import { ModuleRunner } from '$lib/application/moduleRunner';
import { GENERIC_WRITING_ADVICE_PHRASES } from '$lib/core/domain/proseQuality';
import { coldOpenLabFixtureInput } from '$lib/story-modules/modules/cold-open-lab/fixtures';
import { coldOpenLabModule } from '$lib/story-modules/modules/cold-open-lab/module';
import {
	COLD_OPEN_LAB_PROMPT_VERSION,
	buildColdOpenLabProviderMessages
} from '$lib/story-modules/modules/cold-open-lab/prompts';
import { createModuleFixtureContext } from '$lib/story-modules/testSupport';

describe('cold open lab module', () => {
	it('returns provenance-capable cold open variants in fixture mode', async () => {
		const result = await new ModuleRunner().run(
			coldOpenLabModule,
			createModuleFixtureContext(coldOpenLabFixtureInput)
		);

		expect(result.status).toBe('success');
		expect(result.output?.variants.length).toBeGreaterThanOrEqual(3);
		expect(result.output?.winnerId).toBe('public-name-theft');
		expect(result.provenance.promptVersion).toBe('cold-open-lab.v2');
		expect(result.issues).toEqual([]);
	});

	it('builds provider prompts with prose-gate constraints', () => {
		const messages = buildColdOpenLabProviderMessages(coldOpenLabFixtureInput);
		const promptText = messages.map((message) => message.content).join('\n');

		expect(promptText).toContain(`Prompt version: ${COLD_OPEN_LAB_PROMPT_VERSION}.`);
		expect(promptText).toContain('12-20 words');
		expect(promptText).toContain('payoff path');
		expect(promptText).toContain('proof');
		for (const phrase of GENERIC_WRITING_ADVICE_PHRASES) {
			expect(promptText).toContain(`"${phrase}"`);
		}
	});

	it('keeps provider prompts readable when the protagonist name is blank', () => {
		const messages = buildColdOpenLabProviderMessages({
			...coldOpenLabFixtureInput,
			protagonistName: ' '
		});
		const promptText = messages.map((message) => message.content).join('\n');

		expect(promptText).toContain('must name the protagonist or another concrete subject');
	});

	it('fails closed in live mode while no provider exists', async () => {
		const context = {
			...createModuleFixtureContext(coldOpenLabFixtureInput),
			mode: 'live' as const
		};
		const result = await new ModuleRunner().run(coldOpenLabModule, context);

		expect(result.status).toBe('failed');
		expect(result.issues.map((issue) => issue.code)).toContain('PROVIDER_UNAVAILABLE');
	});
});
