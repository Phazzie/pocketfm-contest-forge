// Created: 2026-05-26 01:22

import type { ContestResearchPort } from '$lib/core/ports/contestResearchPort';
import type { StoryIntelligencePort } from '$lib/core/ports/storyIntelligencePort';
import type {
	ContestBrief,
	EpisodeBlueprint,
	ForgePlan,
	ForgeRequest,
	UseCaseResponse
} from '$lib/core/contracts/contestForgeContract';
import { validateForgeRequest } from '$lib/core/contracts/contestForgeContract';
import { createStoryStateFromForgeRequest } from '$lib/core/story-state/storyStateValidation';
import { ModuleRunner } from '$lib/application/moduleRunner';
import { toStoryModulePlanResult } from '$lib/application/storyModulePlanResult';
import type { StoryModuleRegistry } from '$lib/story-modules/registry';
import type { ModuleExecutionMode } from '$lib/story-modules/types';

export class ForgeContestStory {
	constructor(
		private readonly research: ContestResearchPort,
		private readonly intelligence: StoryIntelligencePort,
		private readonly moduleRegistry: StoryModuleRegistry,
		private readonly moduleRunner = new ModuleRunner()
	) {}

	async forge(
		request: ForgeRequest,
		mode: ModuleExecutionMode = 'demo'
	): Promise<UseCaseResponse<ForgePlan>> {
		const issues = validateForgeRequest(request);
		const errors = issues.filter((issue) => issue.severity === 'error');

		if (errors.length > 0) {
			return {
				success: false,
				error: {
					code: 'CONTRACT_INVALID',
					message: 'Forge request failed contract validation.',
					issues
				}
			};
		}

		if (mode === 'live') {
			return {
				success: false,
				error: {
					code: 'AI_PROVIDER_UNAVAILABLE',
					message:
						'Live AI generation is not wired yet. The forge will not substitute deterministic prose for production output.'
				}
			};
		}

		const brief = this.research.findById(request.contestId);

		if (!brief) {
			return {
				success: false,
				error: {
					code: 'CONTEST_NOT_FOUND',
					message: `No contest brief found for ${request.contestId}.`
				}
			};
		}

		const mechanisms = this.intelligence.mechanisms(request, brief);
		const pilot = this.intelligence.pilot(request, brief);
		const score = this.intelligence.score(request, pilot, mechanisms);
		const storyState = createStoryStateFromForgeRequest(request, brief, pilot);
		const premise = this.intelligence.premise(request, brief);
		const now = new Date();
		const moduleResults = await Promise.all(
			this.moduleRegistry.list().map(async (module) => {
				const result = await this.moduleRunner.run(module, {
					input: buildModuleInput(module.id, request, brief, pilot, storyState, premise),
					storyState,
					contestBrief: brief,
					mode,
					now
				});

				return toStoryModulePlanResult(module, result);
			})
		);

		return {
			success: true,
			data: {
				brief,
				generationMode: 'fixture-demo',
				oneSentencePremise: premise,
				strategicThesis: this.intelligence.thesis(request, brief),
				mechanisms,
				moduleResults,
				pilot,
				aiCouncil: [
					{
						role: 'Listener Saboteur',
						job: 'Attack the draft like a distracted audio listener with one thumb on skip.',
						prompt: `Find the exact minute where "${request.seed.workingTitle}" loses curiosity. Return the preceding sentence, the reason for drop-off, and a replacement beat that creates a question without adding lore.`,
						expectedArtifact: 'Minute-level abandonment memo'
					},
					{
						role: 'Trope Criminal',
						job: 'Break one genre trope while preserving the listener promise.',
						prompt: `For ${brief.contestName}, mutate one mandatory element from ${brief.mandatoryElements.join(', ')} into a rule that creates desire, status damage, and repeatable episode conflict.`,
						expectedArtifact: 'Trope mutation warrant'
					},
					{
						role: 'Debt Auditor',
						job: 'Price every unresolved promise and punish fake cliffhangers.',
						prompt: `Audit the binge debt in episode ${pilot.episodeNumber}. Mark each debt as collectible, stale, or fraudulent. Schedule the next three payoffs without resolving the central mystery.`,
						expectedArtifact: 'Three-episode payoff calendar'
					},
					{
						role: 'Voice Actor Ghost',
						job: 'Judge whether the script survives being heard with no visual context.',
						prompt:
							'Rewrite the cold open variants so a voice actor can perform them with clean breath, obvious stakes, and a repeatable sonic signature. Preserve the cliffhanger question.',
						expectedArtifact: 'Performed first-minute rewrite'
					}
				],
				seriesRules: [
					'Every episode must open with a status rupture before explanation.',
					'Every supernatural or system rule must cost a relationship, not just energy.',
					'Pay one small debt every episode while opening one larger debt.',
					'End scenes on a choice, accusation, or irreversible public reveal.',
					'Keep signature phrases short enough for listeners to repeat.'
				],
				score,
				submissionChecklist: [
					'First minute contains premise, wound, and question.',
					'Contest genre promise is obvious without reading the prompt.',
					'Pilot creates at least three unresolved binge debts.',
					'The serial engine can plausibly run past 50 episodes.',
					'Dialogue can be performed without visual context.',
					'One trope is familiar, one rule mutates it, and one consequence makes it hurt.'
				],
				selfReview: [
					'Core use case has no Svelte dependency.',
					'Research evidence is attached to each contest brief.',
					'AI behavior is behind StoryIntelligencePort and story modules are behind runtime schemas.',
					'The current implementation is explicitly fixture-demo mode; live AI generation fails closed until adapters exist.'
				]
			}
		};
	}
}

function buildModuleInput(
	moduleId: string,
	request: ForgeRequest,
	brief: ContestBrief,
	pilot: EpisodeBlueprint,
	storyState: ReturnType<typeof createStoryStateFromForgeRequest>,
	premise: string
): unknown {
	const builders: Record<string, () => unknown> = {
		'cold-open-lab': () => ({
			workingTitle: request.seed.workingTitle,
			protagonistName: request.seed.protagonistName,
			logline: request.seed.logline,
			emotionalPromise: request.seed.emotionalPromise,
			tabooLever: request.seed.tabooLever,
			contestName: brief.contestName,
			contestLane: brief.id,
			mandatoryElements: brief.mandatoryElements,
			riskTolerance: request.riskTolerance
		}),
		'cliffhanger-futures': () => ({
			episodeNumber: pilot.episodeNumber,
			episodeTitle: pilot.title,
			beats: pilot.beats.map((beat) => ({
				id: beat.id,
				minute: beat.minute,
				function: beat.function,
				text: beat.text,
				unansweredQuestion: beat.unansweredQuestion
			})),
			unresolvedDebts: pilot.bingeDebtAdded,
			contestLane: brief.id,
			emotionalPromise: request.seed.emotionalPromise
		}),
		'binge-debt-ledger': () => ({
			episodeNumber: pilot.episodeNumber,
			episodeBeats: pilot.beats.map((beat) => beat.text),
			secrets: storyState.secrets.map((secret) => secret.description),
			promises: pilot.bingeDebtAdded,
			priorLedger: {
				open: storyState.debts.open.map(toLedgerDebt),
				paid: storyState.debts.paid.map(toLedgerDebt),
				stale: storyState.debts.stale.map(toLedgerDebt)
			}
		}),
		'trope-mutation-lab': () => ({
			contestGenre: request.seed.genre,
			contestName: brief.contestName,
			mandatoryElements: brief.mandatoryElements,
			seedPremise: premise,
			emotionalPromise: request.seed.emotionalPromise,
			tabooLever: request.seed.tabooLever,
			riskTolerance: request.riskTolerance
		})
	};

	return builders[moduleId]?.() ?? {};
}

function toLedgerDebt(
	debt: ReturnType<typeof createStoryStateFromForgeRequest>['debts']['open'][number]
) {
	return {
		id: debt.id,
		label: debt.label,
		status: debt.status,
		openedInEpisode: debt.openedInEpisode,
		payoffWindow: debt.payoffWindow,
		interest: debt.notes ?? `Debt pressure carries into ${debt.payoffWindow}.`
	};
}
