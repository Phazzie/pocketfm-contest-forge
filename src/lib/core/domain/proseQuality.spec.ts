// Created: 2026-05-28 04:18

import { describe, expect, it } from 'vitest';
import { evaluateModuleProseQuality } from './proseQuality';

describe('module prose quality', () => {
	it('accepts concrete, speakable output with named pressure and payoff path', () => {
		const result = evaluateModuleProseQuality({
			moduleId: 'cold-open-lab',
			protagonistName: 'Mara Vey',
			output: {
				variants: [
					{
						id: 'court-name-theft',
						text: 'Mara Vey loses her public name in court because her lover brings proof of the stolen crown debt.',
						firstMinuteQuestion: 'What proof can force Mara to pay a debt everyone hears?',
						audioNote: 'Lead with the court, the lover, and the name loss.',
						acquisitionStrategy: 'Public status wound before crown rules.'
					}
				],
				winnerRationale:
					'Mara, the public shame, and the relationship betrayal are audible at once.',
				rejectionNotes: ['Do not explain crown lore before the court hears the accusation.']
			}
		});

		expect(result.accepted).toBe(true);
		expect(result.issues).toEqual([]);
	});

	it('warns when sentences are too long for clean audio', () => {
		const result = evaluateModuleProseQuality({
			moduleId: 'cold-open-lab',
			protagonistName: 'Mara Vey',
			output: {
				variants: [
					{
						id: 'long-court-breath',
						text: 'Mara Vey loses her public name in court because her lover brings proof of the stolen crown debt while every witness chants the sentence she wrote in secret and the throne demands a price before anyone can breathe or understand which vow has turned the whole room against her.',
						firstMinuteQuestion:
							'What proof forces Mara to choose the lover or the throne before the next price lands?',
						audioNote:
							'The court, lover, witness, stolen crown, public shame, and relationship cost are concrete but the breath is overloaded.',
						acquisitionStrategy:
							'Public shame before rules, with the debt and lover betrayal audible in one crowded sentence.'
					}
				],
				winnerRationale: 'Mara has a public status wound and a relationship cost.',
				rejectionNotes: ['Keep the court pressure immediate.']
			}
		});

		expect(result.accepted).toBe(true);
		expect(result.issues.map((issue) => issue.code)).toContain('AUDIO_READABILITY_WARNING');
	});

	it('rejects generic writing advice phrasing', () => {
		const result = evaluateModuleProseQuality({
			moduleId: 'cold-open-lab',
			protagonistName: 'Mara Vey',
			output: {
				variants: [
					{
						id: 'advice',
						text: 'Mara Vey stands in court with a stolen crown and should raise the stakes for a strong hook.',
						firstMinuteQuestion: 'What proof exposes the debt?',
						audioNote: 'Keep the public shame audible.',
						acquisitionStrategy: 'Use betrayal.'
					}
				],
				winnerRationale: 'Mara faces public shame and relationship pressure.',
				rejectionNotes: ['Avoid abstract advice.']
			}
		});

		expect(result.accepted).toBe(false);
		expect(result.issues.map((issue) => issue.code)).toContain('GENERIC_WRITING_ADVICE');
	});

	it('rejects cliffhanger language without a payoff path', () => {
		const result = evaluateModuleProseQuality({
			moduleId: 'cold-open-lab',
			protagonistName: 'Mara Vey',
			output: {
				variants: [
					{
						id: 'fake-question',
						text: 'Mara Vey loses her public name in court while her lover holds the stolen crown.',
						firstMinuteQuestion: 'Why is this mysterious?',
						audioNote: 'The public court pressure is audible.',
						acquisitionStrategy: 'Start with betrayal.'
					}
				],
				winnerRationale: 'Mara has public shame and lover betrayal.',
				rejectionNotes: ['Do not answer the question yet.']
			}
		});

		expect(result.accepted).toBe(false);
		expect(result.issues.map((issue) => issue.code)).toContain('FAKE_CLIFFHANGER');
	});

	it('rejects output whose spoken variants omit the named protagonist', () => {
		const result = evaluateModuleProseQuality({
			moduleId: 'cold-open-lab',
			protagonistName: 'Mara Vey',
			output: {
				variants: [
					{
						id: 'mara-public-debt',
						text: 'The crown loses public trust in court because the debt exposes a stolen vow.',
						firstMinuteQuestion: 'What proof forces the price?',
						audioNote: 'Court pressure before rules.',
						acquisitionStrategy: 'Public shame first.'
					}
				],
				winnerRationale: 'Mara Vey has a public debt in the metadata, not the spoken variant.',
				rejectionNotes: ['Avoid lore first.']
			}
		});

		expect(result.accepted).toBe(false);
		expect(result.issues.map((issue) => issue.code)).toContain('MISSING_NAMED_SUBJECT');
	});

	it('accepts a single-word concrete subject when no protagonist name is supplied', () => {
		const result = evaluateModuleProseQuality({
			moduleId: 'cold-open-lab',
			output: {
				variants: [
					{
						id: 'single-name',
						text: 'Mara loses her public name in court because the lover brings proof of the stolen crown debt.',
						firstMinuteQuestion: 'What proof forces the debt into the next episode?',
						audioNote: 'Lead with Mara, the court, and the lover.',
						acquisitionStrategy: 'Public shame before crown rules.'
					}
				],
				winnerRationale: 'The public shame and relationship pressure are immediate.',
				rejectionNotes: ['Do not hide the cost in lore.']
			}
		});

		expect(result.accepted).toBe(true);
		expect(result.issues).toEqual([]);
	});
});
