// Created: 2026-05-28 09:20

import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseDevalue } from 'devalue';

const SMOKE_REQUEST_TIMEOUT_MS = 720_000;
const REQUIRED_ARTIFACT_IDS = [
	'cold-open-lab',
	'binge-debt-ledger',
	'cliffhanger-futures',
	'trope-mutation-lab',
	'council-review'
];

if (isMainModule()) {
	try {
		await run();
	} catch (error) {
		console.error(`FAILED: ${errorMessage(error)}`);
		process.exit(1);
	}
}

export async function run() {
	if (process.env.RUN_LIVE_AI_SMOKE !== '1') {
		console.log(
			'SKIP: Set RUN_LIVE_AI_SMOKE=1, LIVE_AI_SMOKE_URL, and STORY_AI_ACCESS_CODE or LIVE_AI_SMOKE_ACCESS_CODE.'
		);
		return;
	}

	const targetUrl = requiredEnv('LIVE_AI_SMOKE_URL');
	const accessCode = process.env.LIVE_AI_SMOKE_ACCESS_CODE ?? requiredEnv('STORY_AI_ACCESS_CODE');
	const response = await fetchLiveAction(targetUrl, accessCode);
	const responseText = await response.text();

	if (!response.ok) {
		throw new Error(
			`Live AI smoke action failed with HTTP ${response.status}: ${httpFailureMessage(responseText)}`
		);
	}

	const envelope = parseActionEnvelope(responseText);
	const actionData = parseActionData(envelope);
	const storyStudio = actionData?.storyStudio;

	if (envelope.type === 'failure') {
		throw new Error(
			`Live AI smoke action failed with action status ${actionStatus(envelope, response.status)}: ${failureMessage(storyStudio)}`
		);
	}

	if (!storyStudio?.success) {
		throw new Error(`Live AI smoke did not return success: ${failureMessage(storyStudio)}`);
	}

	const { artifacts, generationMode, qualitySummary } = storyStudio.data;

	if (generationMode !== 'live-ai') {
		throw new Error(`Expected live-ai generation mode, received ${generationMode}.`);
	}

	if (!Array.isArray(artifacts)) {
		throw new Error('Expected Story Studio artifacts array in live smoke result.');
	}

	for (const artifactId of REQUIRED_ARTIFACT_IDS) {
		const artifact = artifacts.find((candidate) => candidate.id === artifactId);

		if (!artifact) {
			throw new Error(`Expected Story Studio artifact ${artifactId} in live smoke result.`);
		}

		if (artifact.status !== 'accepted') {
			throw new Error(
				`Expected accepted ${artifactId}, received ${artifact.status}: ${issueMessages(artifact.result)}`
			);
		}

		if (artifact.provenance?.provider !== 'xai') {
			throw new Error(
				`Expected xai provider for ${artifactId}, received ${artifact.provenance?.provider ?? 'none'}.`
			);
		}
	}

	const coldOpenArtifact = artifacts.find((artifact) => artifact.id === 'cold-open-lab');
	const coldOpenOutput = coldOpenArtifact?.result?.output;

	if (!coldOpenArtifact?.provenance) {
		throw new Error('Expected cold-open artifact provenance in live smoke result.');
	}

	if (
		!coldOpenOutput ||
		!Array.isArray(coldOpenOutput.variants) ||
		coldOpenOutput.variants.length < 3
	) {
		throw new Error('Expected at least three accepted cold-open variants.');
	}

	console.log(
		JSON.stringify(
			{
				url: targetUrl,
				generationMode,
				acceptedArtifacts: qualitySummary.accepted,
				failedArtifacts: qualitySummary.failed,
				lockedArtifacts: qualitySummary.locked,
				provider: coldOpenArtifact.provenance.provider,
				model: coldOpenArtifact.provenance.model,
				promptVersion: coldOpenArtifact.provenance.promptVersion,
				latencyMs: artifacts.reduce(
					(total, artifact) => total + (artifact.provenance?.latencyMs ?? 0),
					0
				),
				variantCount: coldOpenOutput.variants.length,
				winnerId: coldOpenOutput.winnerId
			},
			null,
			2
		)
	);
}

export async function fetchLiveAction(targetUrl, accessCode) {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), SMOKE_REQUEST_TIMEOUT_MS);
	timeout.unref?.();
	const request = liveActionRequest(targetUrl, accessCode);

	try {
		return await fetch(request.url, {
			...request.init,
			signal: controller.signal
		});
	} catch (error) {
		if (isAbortError(error)) {
			throw new Error(`Live AI smoke request timed out after ${SMOKE_REQUEST_TIMEOUT_MS}ms.`, {
				cause: error
			});
		}

		throw error;
	} finally {
		clearTimeout(timeout);
	}
}

export function liveActionRequest(targetUrl, accessCode) {
	const normalizedAccessCode = requiredNonEmptyString(accessCode, 'Access code');
	const url = liveActionUrl(targetUrl);

	return {
		url,
		init: {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Origin: url.origin,
				'x-sveltekit-action': 'true'
			},
			body: defaultLiveActionBody(normalizedAccessCode)
		}
	};
}

export function liveActionUrl(value) {
	const targetUrl = requiredNonEmptyString(value, 'Target URL');
	const normalized = targetUrl.endsWith('/') ? targetUrl : `${targetUrl}/`;
	return new URL('?/runLiveStudio', normalized);
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

function httpFailureMessage(responseText) {
	const envelope = parseOptionalActionEnvelope(responseText);
	const storyStudio = parseOptionalActionData(envelope)?.storyStudio;

	if (storyStudio) return failureMessage(storyStudio);

	return responseExcerpt(responseText);
}

function parseOptionalActionEnvelope(responseText) {
	try {
		return JSON.parse(responseText);
	} catch {
		return undefined;
	}
}

function parseOptionalActionData(envelope) {
	try {
		return parseActionData(envelope);
	} catch {
		return undefined;
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

function failureMessage(storyStudio) {
	if (!storyStudio) return 'No storyStudio payload returned.';
	if (storyStudio.success) return 'Action succeeded but HTTP status indicated failure.';
	return `${storyStudio.error.code}: ${storyStudio.error.message}`;
}

function actionStatus(envelope, fallbackStatus) {
	return typeof envelope?.status === 'number' ? envelope.status : fallbackStatus;
}

function issueMessages(moduleResult) {
	if (!Array.isArray(moduleResult?.issues)) {
		return `No issue list returned for module result: ${safeJson(moduleResult)}`;
	}

	const messages = moduleResult.issues.map((issue) => `${issue.code}: ${issue.message}`).join('; ');
	return messages || 'No module issues returned.';
}

function responseExcerpt(responseText) {
	const excerpt = responseText.replace(/\s+/g, ' ').trim().slice(0, 240);
	return excerpt || 'Empty response body.';
}

function isAbortError(error) {
	return error instanceof Error && error.name === 'AbortError';
}

function safeJson(value) {
	try {
		return JSON.stringify(value);
	} catch {
		return String(value);
	}
}

function requiredEnv(name) {
	const value = process.env[name]?.trim();

	if (!value) {
		throw new Error(`${name} is required for RUN_LIVE_AI_SMOKE=1.`);
	}

	return value;
}

function requiredNonEmptyString(value, name) {
	if (typeof value !== 'string' || !value.trim()) {
		throw new Error(`${name} must be a non-empty string.`);
	}

	return value.trim();
}

function errorMessage(error) {
	return error instanceof Error ? error.message : String(error);
}

export function isMainModule(meta = import.meta, argv = globalThis.process?.argv) {
	if (meta?.main === true) return true;

	const entrypoint = argv?.[1];
	if (typeof entrypoint !== 'string' || typeof meta?.url !== 'string') return false;

	try {
		return fileURLToPath(meta.url) === resolve(entrypoint);
	} catch {
		return false;
	}
}
