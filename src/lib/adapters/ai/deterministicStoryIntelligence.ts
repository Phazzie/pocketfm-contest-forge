// Created: 2026-05-26 01:22

import type {
	ContestBrief,
	EpisodeBeat,
	EpisodeBlueprint,
	ForgeRequest,
	MechanismOutput,
	RetentionSimulation
} from '$lib/core/contracts/contestForgeContract';
import type { StoryIntelligencePort } from '$lib/core/ports/storyIntelligencePort';
import { findMechanism } from '$lib/core/domain/mechanisms';
import { scoreContestReadiness } from '$lib/core/domain/scoring';

const genreObject: Record<string, string> = {
	'medieval-fantasy': 'a crown that devours the name of every ruler who lies',
	'werewolf-saga': 'a moon-bond that activates only when the destined pair betrays each other',
	romantasy: 'a marriage contract that transfers magic through confessed jealousy',
	'thriller-system': 'a survival app that pays secrets as currency',
	'dark-academy': 'an academy bell that rings only for students marked to vanish'
};

function protagonist(seed: ForgeRequest['seed']): string {
	return seed.protagonistName.trim() || 'the outlaw heir';
}

function coreObject(brief: ContestBrief): string {
	return genreObject[brief.id] ?? 'a forbidden promise';
}

function compact(value: string): string {
	return value.trim().replace(/\s+/g, ' ');
}

export class DeterministicStoryIntelligence implements StoryIntelligencePort {
	premise(request: ForgeRequest, brief: ContestBrief): string {
		const lead = protagonist(request.seed);
		const object = coreObject(brief);
		return compact(
			`${lead} weaponizes ${object}, but every victory makes the person they desire remember a different version of them.`
		);
	}

	thesis(_request: ForgeRequest, brief: ContestBrief): string {
		return compact(
			`Win by sounding familiar in the first ten seconds, then turning ${brief.mandatoryElements[0]} into a repeatable addiction loop: each episode grants one intimate answer, creates one public status wound, and ends on a choice the listener can argue with.`
		);
	}

	mechanisms(request: ForgeRequest, brief: ContestBrief): MechanismOutput[] {
		return request.selectedMechanisms.map((id) => {
			const definition = findMechanism(id);

			return {
				id,
				label: definition.label,
				unconventionalMove: definition.unconventionalMove,
				artifact: definition.defaultArtifact,
				risk: definition.risk,
				rationale: `${definition.purpose} This directly pressures ${brief.promptPressure.toLowerCase()}`
			};
		});
	}

	pilot(request: ForgeRequest, brief: ContestBrief): EpisodeBlueprint {
		const lead = protagonist(request.seed);
		const object = coreObject(brief);
		const taboo = request.seed.tabooLever || 'a desire nobody is allowed to name';
		const minutes = Math.max(6, Math.min(14, request.seed.minutesPerEpisode));
		const beats: EpisodeBeat[] = [
			{
				id: 'b1',
				minute: 0,
				function: 'cold-open',
				text: `${lead} wakes to a crowd chanting a name that used to belong to them.`,
				unansweredQuestion: 'Who stole the lead identity before the story began?',
				retentionRisk: 'low'
			},
			{
				id: 'b2',
				minute: 1,
				function: 'status-rupture',
				text: `The most powerful witness recognizes the lead only as a criminal owed one public punishment.`,
				unansweredQuestion: 'Why does the witness want the lead alive but disgraced?',
				retentionRisk: 'low'
			},
			{
				id: 'b3',
				minute: Math.floor(minutes * 0.33),
				function: 'choice-trap',
				text: `To survive, the lead must use ${object} in front of the one person who can expose ${taboo}.`,
				unansweredQuestion: 'Will the lead protect the secret or the person who can destroy them?',
				retentionRisk: 'medium'
			},
			{
				id: 'b4',
				minute: Math.floor(minutes * 0.55),
				function: 'intimacy-charge',
				text: `A private confession lands inside a public threat, making desire look like strategy.`,
				unansweredQuestion: 'Was the confession real, bait, or both?',
				retentionRisk: 'medium'
			},
			{
				id: 'b5',
				minute: Math.floor(minutes * 0.78),
				function: 'price-reveal',
				text: `The object saves the lead, but erases one memory from the person they most need to convince.`,
				unansweredQuestion: 'Which memory disappeared, and who benefits from the absence?',
				retentionRisk: 'low'
			},
			{
				id: 'b6',
				minute: minutes,
				function: 'cliffhanger',
				text: `The episode ends when the antagonist speaks the lead old name and the crowd kneels to the wrong heir.`,
				unansweredQuestion: 'Why does the enemy know the erased name?',
				retentionRisk: 'low'
			}
		];
		const finalBeat = beats.at(-1);

		if (!finalBeat) {
			throw new Error('Pilot blueprint requires at least one beat.');
		}

		return {
			episodeNumber: 1,
			title: `${request.seed.workingTitle}: The Name That Should Not Answer`,
			coldOpenVariants: [
				`${lead} hears their own execution announced in a voice they trust.`,
				`A lover says "I remember you" while signing the order to erase them.`,
				`The magic object works perfectly, which is how everyone learns the lead is lying.`
			],
			beats,
			cliffhanger: finalBeat.text,
			bingeDebtAdded: [
				'the stolen name',
				'the witness who needs the lead alive',
				'the memory erased by the magic object',
				'the antagonist who knows too much'
			],
			payoffMoved: ['partial proof that the lead once held power']
		};
	}

	score(
		request: ForgeRequest,
		pilot: EpisodeBlueprint,
		mechanisms: MechanismOutput[]
	): RetentionSimulation {
		return scoreContestReadiness(request, pilot, mechanisms);
	}
}
