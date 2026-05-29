// Created: 2026-05-26 13:48

import type { CliffhangerFuturesInput, CliffhangerFuturesOutput } from './contract';

export const cliffhangerFuturesFixtureInput: CliffhangerFuturesInput = {
	episodeNumber: 1,
	episodeTitle: 'The Crown That Eats Names: The Name That Should Not Answer',
	contestLane: 'medieval-fantasy',
	emotionalPromise: 'Every victory makes desire more dangerous.',
	unresolvedDebts: [
		'the stolen name',
		'the witness who needs the lead alive',
		'the memory erased by the magic object'
	],
	beats: [
		{
			id: 'b1',
			minute: 0,
			function: 'cold-open',
			text: 'Mara Vey wakes to a crowd chanting a name that used to belong to her.',
			unansweredQuestion: 'Who stole Mara identity before the story began?'
		},
		{
			id: 'b3',
			minute: 3,
			function: 'choice-trap',
			text: 'Mara uses the crown in front of the witness who can expose her desire.',
			unansweredQuestion: 'Will Mara protect the secret or the person who can destroy her?'
		},
		{
			id: 'b6',
			minute: 9,
			function: 'cliffhanger',
			text: 'The antagonist speaks Mara old name and the crowd kneels to the wrong heir.',
			unansweredQuestion: 'Why does the enemy know the erased name?'
		}
	]
};

export const cliffhangerFuturesFixtureOutput: CliffhangerFuturesOutput = {
	candidates: [
		{
			id: 'enemy-knows-name',
			text: 'The antagonist speaks Mara Vey old name, and the stolen crown answers him like a bride.',
			unansweredQuestion: 'Why does the enemy know the erased name?',
			futuresScore: 88,
			volatility: 'medium',
			payoffPath: 'Episode two can reveal the antagonist bought one memory from the lover witness.',
			payoffWarning:
				'Audience trust risk: the full erasure conspiracy feels fake if withheld past the third public humiliation.'
		},
		{
			id: 'lover-signed-order',
			text: 'The lover witness signs the execution order with Mara Vey forgotten childhood signature.',
			unansweredQuestion: 'How did the lover get a signature only Mara should know?',
			futuresScore: 79,
			volatility: 'high',
			payoffPath: 'Pay with a partial confession and a new lie by episode three.',
			payoffWarning:
				'Audience frustration risk: romantic volatility can hide the crown rule before the name price is clear.'
		},
		{
			id: 'crown-chose-wrong',
			text: 'The crown names Mara Vey heir, then drains the crowd memory of why they should care.',
			unansweredQuestion:
				'Can a rightful claim survive if no listener inside the story remembers it?',
			futuresScore: 74,
			volatility: 'medium',
			payoffPath: 'Use episode two to create one witness immune to the memory drain.',
			payoffWarning:
				'Audience frustration risk: the immune witness arriving late turns the memory drain into abstract lore.'
		}
	],
	recommendationId: 'enemy-knows-name',
	marketRationale:
		'The winning cliffhanger reprices the central debt without resolving it and has a clean episode-two payoff path.'
};
