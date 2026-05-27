// Created: 2026-05-26 13:46

import type { ColdOpenLabInput, ColdOpenLabOutput } from './contract';

export const coldOpenLabFixtureInput: ColdOpenLabInput = {
	workingTitle: 'The Crown That Eats Names',
	protagonistName: 'Mara Vey',
	logline:
		'A disgraced royal poisoner discovers the kingdom crown rewrites memory, then uses it to rescue the lover who helped erase them.',
	emotionalPromise: 'Every victory makes desire more dangerous.',
	tabooLever: 'loving the person who benefited from your erasure',
	contestName: 'Medieval Fantasy Power Hook',
	contestLane: 'medieval-fantasy',
	mandatoryElements: ['cursed crown', 'court betrayal'],
	riskTolerance: 4
};

export const coldOpenLabFixtureOutput: ColdOpenLabOutput = {
	variants: [
		{
			id: 'execution-voice',
			text: 'Mara Vey hears her execution announced in the lover voice she trained herself to trust.',
			acquisitionStrategy: 'betrayal shock before lore',
			firstMinuteQuestion: 'Why would the lover who erased Mara also preserve her execution hour?',
			audioNote: 'Lead with the name, sentence, and lover voice before naming the crown.',
			rejectionRisk: 'low'
		},
		{
			id: 'public-name-theft',
			text: 'Mara Vey wakes under a balcony where the crowd cheers her stolen name on a stranger face.',
			acquisitionStrategy: 'status rupture with a visible crowd',
			firstMinuteQuestion: 'Who is wearing Mara public life, and why is the crowd grateful?',
			audioNote:
				'The image is playable by ear because the balcony, crowd, and wrong face are immediate.',
			rejectionRisk: 'low'
		},
		{
			id: 'crown-obeys',
			text: 'The cursed crown saves Mara Vey perfectly, which is how every witness learns she is lying.',
			acquisitionStrategy: 'magic success that becomes accusation',
			firstMinuteQuestion: 'Why does correct magic prove the protagonist guilt?',
			audioNote: 'Keep the sentence short and let the reversal carry the hook.',
			rejectionRisk: 'medium'
		}
	],
	winnerId: 'public-name-theft',
	winnerRationale:
		'It states Mara, the social wound, and the central identity theft in one speakable image.',
	rejectionNotes: [
		'Do not open with crown lore before Mara loses public status.',
		'Do not hide the taboo relationship behind abstract betrayal language.'
	]
};
