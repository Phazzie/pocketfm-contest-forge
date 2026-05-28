// Created: 2026-05-28 09:20

import { parse as parseDevalue } from 'devalue';

if (process.env.RUN_LIVE_AI_SMOKE !== '1') {
	console.log('SKIP: Set RUN_LIVE_AI_SMOKE=1, LIVE_AI_SMOKE_URL, and STORY_AI_ACCESS_CODE.');
	process.exit(0);
}

const targetUrl = requiredEnv('LIVE_AI_SMOKE_URL');
const accessCode = process.env.LIVE_AI_SMOKE_ACCESS_CODE ?? requiredEnv('STORY_AI_ACCESS_CODE');
const response = await fetch(liveActionUrl(targetUrl), {
	method: 'POST',
	headers: {
		'Content-Type': 'application/x-www-form-urlencoded'
	},
	body: defaultLiveActionBody(accessCode)
});
const responseText = await response.text();
const envelope = parseActionEnvelope(responseText);
const actionData = parseActionData(envelope);
const liveColdOpen = actionData?.liveColdOpen;

if (!response.ok || envelope.type === 'failure') {
	throw new Error(
		`Live AI smoke action failed with HTTP ${response.status}: ${failureMessage(liveColdOpen)}`
	);
}

if (!liveColdOpen?.success) {
	throw new Error(`Live AI smoke did not return success: ${failureMessage(liveColdOpen)}`);
}

const { moduleResult } = liveColdOpen.data;
const output = moduleResult.output;

if (liveColdOpen.data.generationMode !== 'live-ai') {
	throw new Error(
		`Expected live-ai generation mode, received ${liveColdOpen.data.generationMode}.`
	);
}

if (moduleResult.status !== 'success') {
	throw new Error(
		`Expected accepted live module output, received ${moduleResult.status}: ${issueMessages(moduleResult)}`
	);
}

if (moduleResult.provenance.provider !== 'xai') {
	throw new Error(`Expected xai provider, received ${moduleResult.provenance.provider}.`);
}

if (!output || !Array.isArray(output.variants) || output.variants.length < 3) {
	throw new Error('Expected at least three accepted cold-open variants.');
}

console.log(
	JSON.stringify(
		{
			url: targetUrl,
			generationMode: liveColdOpen.data.generationMode,
			status: moduleResult.status,
			provider: moduleResult.provenance.provider,
			model: moduleResult.provenance.model,
			promptVersion: moduleResult.provenance.promptVersion,
			latencyMs: moduleResult.provenance.latencyMs,
			variantCount: output.variants.length,
			winnerId: output.winnerId
		},
		null,
		2
	)
);

function liveActionUrl(value) {
	const normalized = value.endsWith('/') ? value : `${value}/`;
	return new URL('?/runLiveColdOpen', normalized);
}

function defaultLiveActionBody(accessCode) {
	const body = new URLSearchParams({
		accessCode,
		contestId: 'medieval-fantasy',
		workingTitle: 'The Crown That Eats Names',
		protagonistName: 'Mara Vey',
		logline:
			'A disgraced royal poisoner discovers the kingdom crown rewrites memory, then uses it to rescue the lover who helped erase them.',
		emotionalPromise: 'Every victory makes desire more dangerous.',
		tabooLever: 'loving the person who benefited from your erasure',
		episodeCountTarget: '120',
		minutesPerEpisode: '9',
		riskTolerance: '4'
	});

	for (const mechanism of [
		'retention-black-box',
		'cliffhanger-futures',
		'desire-lattice',
		'binge-debt-ledger',
		'audio-mouthfeel',
		'trope-mutation-lab',
		'cold-open-split-test',
		'serial-dna'
	]) {
		body.append('selectedMechanisms', mechanism);
	}

	return body;
}

function parseActionEnvelope(responseText) {
	try {
		return JSON.parse(responseText);
	} catch (error) {
		throw new Error(
			`Live AI smoke expected a SvelteKit action JSON response: ${errorMessage(error)}`,
			{ cause: error }
		);
	}
}

function parseActionData(envelope) {
	if (typeof envelope?.data !== 'string') return undefined;

	try {
		return parseDevalue(envelope.data);
	} catch (error) {
		throw new Error(`Live AI smoke could not parse action data: ${errorMessage(error)}`, {
			cause: error
		});
	}
}

function failureMessage(liveColdOpen) {
	if (!liveColdOpen) return 'No liveColdOpen payload returned.';
	if (liveColdOpen.success) return 'Action succeeded but HTTP status indicated failure.';
	return `${liveColdOpen.error.code}: ${liveColdOpen.error.message}`;
}

function issueMessages(moduleResult) {
	return moduleResult.issues.map((issue) => `${issue.code}: ${issue.message}`).join('; ');
}

function requiredEnv(name) {
	const value = process.env[name]?.trim();

	if (!value) {
		throw new Error(`${name} is required for RUN_LIVE_AI_SMOKE=1.`);
	}

	return value;
}

function errorMessage(error) {
	return error instanceof Error ? error.message : String(error);
}
