// Created: 2026-05-29 16:14

import type { ForgeRequest, MechanismId } from '$lib/core/contracts/contestForgeContract';

export function mechanismsMatch(
	currentMechanisms: MechanismId[],
	submittedMechanisms: MechanismId[]
) {
	return (
		currentMechanisms.length === submittedMechanisms.length &&
		currentMechanisms.every((mechanism, index) => mechanism === submittedMechanisms[index])
	);
}

export function requestsMatch(currentRequest: ForgeRequest, submittedRequest: ForgeRequest) {
	return (
		currentRequest.contestId === submittedRequest.contestId &&
		currentRequest.riskTolerance === submittedRequest.riskTolerance &&
		currentRequest.seed.workingTitle === submittedRequest.seed.workingTitle &&
		currentRequest.seed.protagonistName === submittedRequest.seed.protagonistName &&
		currentRequest.seed.logline === submittedRequest.seed.logline &&
		currentRequest.seed.emotionalPromise === submittedRequest.seed.emotionalPromise &&
		currentRequest.seed.tabooLever === submittedRequest.seed.tabooLever &&
		currentRequest.seed.episodeCountTarget === submittedRequest.seed.episodeCountTarget &&
		currentRequest.seed.minutesPerEpisode === submittedRequest.seed.minutesPerEpisode &&
		mechanismsMatch(currentRequest.selectedMechanisms, submittedRequest.selectedMechanisms)
	);
}
