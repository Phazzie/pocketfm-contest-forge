// Created: 2026-05-26 13:48

import type { CliffhangerBeat, CliffhangerFuturesInput } from './contract';
import type {
	SerializableProviderInput,
	SerializableProviderValue,
	StoryModuleProviderMessage
} from '$lib/core/ports/storyModuleProviderPort';

export const CLIFFHANGER_FUTURES_PROMPT_VERSION = 'cliffhanger-futures.v2';

export const cliffhangerFuturesPrompt = {
	system:
		'Price episode-ending cliffhangers like a futures market. Reward listener questions with playable payoff paths and punish fake shock.',
	user: 'Given episode beats, unresolved debts, contest lane, and emotional promise, return candidate cliffhangers with futures score, volatility, payoff path, payoff warning, and one recommendation.'
};

export function buildCliffhangerFuturesProviderInput(
	input: CliffhangerFuturesInput
): SerializableProviderInput {
	return {
		episodeNumber: input.episodeNumber,
		episodeTitle: input.episodeTitle,
		beats: input.beats.map(cliffhangerBeatToProviderValue),
		unresolvedDebts: input.unresolvedDebts,
		contestLane: input.contestLane,
		emotionalPromise: input.emotionalPromise
	};
}

export function buildCliffhangerFuturesProviderMessages(
	input: CliffhangerFuturesInput
): StoryModuleProviderMessage[] {
	return [
		{
			role: 'system',
			content: [
				cliffhangerFuturesPrompt.system,
				`Prompt version: ${CLIFFHANGER_FUTURES_PROMPT_VERSION}.`,
				'Return only valid JSON. Do not wrap the JSON in markdown.',
				'Do not include comments, markdown, bullets outside JSON, or extra prose.',
				'Return 3 to 5 candidates.',
				'Each candidate must include id, text, unansweredQuestion, futuresScore, volatility, payoffPath, and payoffWarning.',
				'The recommendationId must exactly match one candidate id.',
				'Every payoffPath must name the next episode movement, concrete clue or proof, and relationship, public status, secret, trust, name, or price cost.',
				'Every payoffWarning must start with "Audience frustration risk:" or "Audience trust risk:".',
				'Every payoffWarning must name the specific listener frustration, trust break, confusion, delayed payoff, fake cliffhanger, abstract lore, or hidden-proof risk.',
				'Do not generate payoffWarning items that only describe volatility, tone, romance, theme, or general stakes without audience risk.',
				'Do not use generic craft phrases such as strong hook, raise the stakes, emotional stakes, or build suspense.'
			].join('\n')
		},
		{
			role: 'user',
			content: [
				cliffhangerFuturesPrompt.user,
				'Output shape:',
				JSON.stringify(
					{
						candidates: [
							{
								id: 'specific-cliffhanger-slug',
								text: 'The exact episode-ending line or action the listener hears.',
								unansweredQuestion: 'The specific listener question created by the ending.',
								futuresScore: 88,
								volatility: 'medium',
								payoffPath:
									'The next episode clue, proof, cost, or consequence that moves the debt.',
								payoffWarning:
									'Audience frustration risk: delaying the proof past episode two makes the cliffhanger feel fake.'
							}
						],
						recommendationId: 'specific-cliffhanger-slug',
						marketRationale:
							'Why this ending best converts the unresolved debts into next-episode pull.'
					},
					null,
					2
				),
				'Input:',
				JSON.stringify(buildCliffhangerFuturesProviderInput(input), null, 2)
			].join('\n')
		}
	];
}

function cliffhangerBeatToProviderValue(
	beat: CliffhangerBeat
): Record<string, SerializableProviderValue> {
	return {
		id: beat.id,
		minute: beat.minute,
		function: beat.function,
		text: beat.text,
		unansweredQuestion: beat.unansweredQuestion
	};
}
