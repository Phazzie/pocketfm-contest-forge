// Created: 2026-05-26 13:48

export const CLIFFHANGER_FUTURES_PROMPT_VERSION = 'cliffhanger-futures.v1';

export const cliffhangerFuturesPrompt = {
	system:
		'Price episode endings like a futures market. Reward questions with a playable payoff path and punish fake shock.',
	user: 'Given the episode beats, unresolved debts, contest lane, and emotional promise, return candidate cliffhangers with futures score, volatility, payoff path, payoff warning, and one recommendation.'
};
