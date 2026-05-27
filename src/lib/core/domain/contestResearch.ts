// Created: 2026-05-26 01:22

import type { ContestBrief } from '$lib/core/contracts/contestForgeContract';

export const contestBriefs: ContestBrief[] = [
	{
		id: 'medieval-fantasy',
		contestName: 'Medieval Fantasy Audio Serial',
		formatSignal: 'High-concept genre prompt built for many short audio episodes.',
		prizeSignal: 'Public contest listings reported a USD 10,000 pool with a USD 5,000 top award.',
		promptPressure:
			'The premise must sound instantly medieval while still mutating the expected royal quest shape.',
		mandatoryElements: [
			'kingdom-scale stakes',
			'forbidden power',
			'repeatable court conflict',
			'episode-end reversals'
		],
		judgingSignals: [
			'clear fantasy object or curse',
			'fast cold open',
			'serial conflict that can survive 100+ episodes',
			'audio-friendly character motives'
		],
		evidence: [
			{
				sourceName: 'Winning Writers via Reddit contest listing',
				url: 'https://www.reddit.com/r/literarycontests/comments/1p4qazr/fictionfantasy_jan_20_2026_pocket_fm_medieval/',
				insight:
					'A Pocket FM Medieval Fantasy contest was publicly listed with a USD 10,000 prize pool.',
				confidence: 'reported'
			},
			{
				sourceName: 'Pocket FM writers site',
				url: 'https://www.pocket-fm-writers.com/',
				insight:
					'Pocket FM positions fantasy, romance, thriller, horror, and drama as core audio library categories.',
				confidence: 'direct'
			}
		]
	},
	{
		id: 'werewolf-saga',
		contestName: 'Werewolf Saga Contest',
		formatSignal:
			'Paranormal romance and pack-politics engine with escalating social status traps.',
		prizeSignal: 'Public contest listings reported a USD 4,000 award pool.',
		promptPressure:
			'The alpha bond premise is saturated, so the tool should invert mating, pack law, and status proof.',
		mandatoryElements: ['pack hierarchy', 'forbidden bond', 'body-change stakes', 'betrayal loop'],
		judgingSignals: [
			'visceral transformation hooks',
			'desire against social law',
			'repeatable rival pressure',
			'episode endings with identity shocks'
		],
		evidence: [
			{
				sourceName: 'Winning Writers via Reddit contest listing',
				url: 'https://www.reddit.com/r/literarycontests/comments/1ohidbo',
				insight:
					'A Pocket FM Werewolf Saga contest was publicly listed in fantasy, fiction, and romance.',
				confidence: 'reported'
			},
			{
				sourceName: 'Pocket FM writers site',
				url: 'https://www.pocket-fm-writers.com/',
				insight:
					'Pocket FM actively recruits novice and experienced writers for audio storytelling.',
				confidence: 'direct'
			}
		]
	},
	{
		id: 'romantasy',
		contestName: 'Romantasy Power-Bond Serial',
		formatSignal: 'Romance desire engine fused with magic rules and long-running status reversals.',
		prizeSignal: 'Aligned with Pocket FM app writing contests and creator reward programs.',
		promptPressure: 'The relationship must generate plot, not decorate it.',
		mandatoryElements: [
			'impossible bond',
			'magical cost',
			'public status risk',
			'private vulnerability'
		],
		judgingSignals: [
			'desire clarity',
			'clean power fantasy',
			'repeatable emotional bargain',
			'strong cliffhanger cadence'
		],
		evidence: [
			{
				sourceName: 'Business Source report on Pocket FM at JLF 2026',
				url: 'https://businesssource.in/2026/01/13/pocket-fm-joins-jaipur-literature-festival-2026-as-official-storytelling-partner-puts-writers-at-the-centre-of-indias-next-storytelling-wave/',
				insight:
					'Pocket FM writing contests are described as high-concept universes with cash prizes up to INR 1 lakh per contest.',
				confidence: 'reported'
			}
		]
	},
	{
		id: 'thriller-system',
		contestName: 'System Thriller Audio Serial',
		formatSignal:
			'Game-like progression loop where every episode buys one answer and opens two threats.',
		prizeSignal: 'Aligned with Pocket FM retention economics and long serial listening.',
		promptPressure: 'Mechanics must be legible by ear without turning into exposition.',
		mandatoryElements: ['countdown', 'rule discovery', 'moral wager', 'visible progression'],
		judgingSignals: [
			'tight question ladder',
			'rapid reversals',
			'clear listener math',
			'high end-of-episode compulsion'
		],
		evidence: [
			{
				sourceName: 'Yahoo Finance republication of TechCrunch report',
				url: 'https://finance.yahoo.com/news/pocket-fm-gives-writers-ai-164849455.html',
				insight:
					'Pocket FM focuses on hundreds-of-episode audio series matched to listener taste and rapid production.',
				confidence: 'reported'
			}
		]
	},
	{
		id: 'dark-academy',
		contestName: 'Dark Academy Secrets Serial',
		formatSignal:
			'Closed institution, secret hierarchy, prestige hunger, and irreversible initiation rites.',
		prizeSignal: 'Aligned with app-native genre contests that reward high-concept universes.',
		promptPressure: 'The school must be an episode machine, not a setting.',
		mandatoryElements: [
			'elite gatekeeping',
			'secret society',
			'forbidden mentor',
			'public humiliation stakes'
		],
		judgingSignals: [
			'social pressure',
			'clear mystery economy',
			'voice-forward scenes',
			'ritualized episode hooks'
		],
		evidence: [
			{
				sourceName: 'Business Source report on Pocket FM at JLF 2026',
				url: 'https://businesssource.in/2026/01/13/pocket-fm-joins-jaipur-literature-festival-2026-as-official-storytelling-partner-puts-writers-at-the-centre-of-indias-next-storytelling-wave/',
				insight:
					'Reported contest examples include named high-concept universes such as Magical Beasts Academy.',
				confidence: 'reported'
			}
		]
	}
];
