// Created: 2026-05-26 01:22

import type {
	EpisodeBlueprint,
	ForgeRequest,
	MechanismOutput,
	RetentionHeatPoint,
	RetentionSimulation
} from '$lib/core/contracts/contestForgeContract';

function clamp(value: number): number {
	return Math.max(0, Math.min(100, Math.round(value)));
}

function uniqueCount(values: string[]): number {
	return new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean)).size;
}

export function buildRetentionHeatmap(pilot: EpisodeBlueprint): RetentionHeatPoint[] {
	return pilot.beats.map((beat, index) => {
		const riskPenalty =
			beat.retentionRisk === 'high' ? -18 : beat.retentionRisk === 'medium' ? -7 : 8;
		const cliffhangerBoost = beat.function === 'cliffhanger' ? 22 : 0;
		const ruptureBoost = index < 2 && beat.unansweredQuestion ? 15 : 0;

		return {
			minute: beat.minute,
			intensity: clamp(54 + riskPenalty + cliffhangerBoost + ruptureBoost + index * 3),
			reason: `${beat.function}: ${beat.unansweredQuestion}`
		};
	});
}

export function scoreContestReadiness(
	request: ForgeRequest,
	pilot: EpisodeBlueprint,
	mechanisms: MechanismOutput[]
): RetentionSimulation {
	const mechanismDiversity = uniqueCount(mechanisms.map((mechanism) => mechanism.id));
	const firstBeat = pilot.beats[0];
	const lastBeat = pilot.beats[pilot.beats.length - 1];
	const debtCount = pilot.bingeDebtAdded.length;
	const payoffCount = pilot.payoffMoved.length;
	const coldOpenCount = pilot.coldOpenVariants.length;

	const firstMinuteGrip = clamp(
		55 +
			(firstBeat?.unansweredQuestion ? 18 : 0) +
			(coldOpenCount - 1) * 8 +
			(request.seed.logline.length > 80 ? 7 : 0)
	);
	const cliffhangerPull = clamp(
		50 + (lastBeat?.function === 'cliffhanger' ? 20 : 0) + debtCount * 5 - payoffCount * 2
	);
	const audioFlow = clamp(
		62 + request.seed.minutesPerEpisode * 2 + (request.seed.minutesPerEpisode > 12 ? -12 : 0)
	);
	const novelty = clamp(
		48 + mechanismDiversity * 7 + request.riskTolerance * 5 + request.seed.constraints.length * 2
	);
	const score = clamp(
		firstMinuteGrip * 0.28 + cliffhangerPull * 0.28 + audioFlow * 0.18 + novelty * 0.26
	);

	const risks = [
		...(request.riskTolerance >= 5
			? ['Risk level is aggressive. Add one trust-building payoff in episode one.']
			: []),
		...(debtCount > payoffCount + 3
			? ['Binge debt is high. Schedule an early partial reveal before episode three.']
			: []),
		...(audioFlow < 72
			? ['Audio flow is below target. Shorten exposition and add performer-friendly dialogue.']
			: [])
	];

	return {
		score,
		firstMinuteGrip,
		cliffhangerPull,
		audioFlow,
		novelty,
		risks,
		heatmap: buildRetentionHeatmap(pilot)
	};
}
