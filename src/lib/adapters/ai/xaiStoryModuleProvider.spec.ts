// Created: 2026-05-28 05:01

import { describe, expect, it } from 'vitest';
import type { StoryModuleProviderRequest } from '$lib/core/ports/storyModuleProviderPort';
import {
	XAI_DEFAULT_MODEL,
	XAI_DEFAULT_REASONING_EFFORT,
	XAI_RESPONSES_ENDPOINT,
	XaiStoryModuleProvider,
	createXaiStoryModuleProviderFromEnv,
	resolveXaiStoryModuleProviderEnv,
	type XaiFetch
} from './xaiStoryModuleProvider';

const requestedAt = '2026-05-28T05:01:00.000Z';
const generatedAt = '2026-05-28T05:01:01.000Z';

describe('xAI story module provider', () => {
	it('resolves default env configuration for the Grok multi-agent Responses API', () => {
		const config = resolveXaiStoryModuleProviderEnv({
			XAI_API_KEY: 'test-key'
		});

		expect(config).toEqual({
			apiKey: 'test-key',
			model: XAI_DEFAULT_MODEL,
			reasoningEffort: XAI_DEFAULT_REASONING_EFFORT,
			configurationIssues: []
		});
	});

	it('records configuration issues for unsupported provider and reasoning effort values', async () => {
		const provider = createXaiStoryModuleProviderFromEnv(
			{
				XAI_API_KEY: 'test-key',
				STORY_AI_PROVIDER: 'openai',
				STORY_AI_REASONING_EFFORT: 'extreme'
			},
			{
				fetch: async () => jsonResponse({ output_text: '{}' }),
				now: fixedNow
			}
		);

		const result = await provider.generateModuleJson(providerRequest);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe('PROVIDER_UNAVAILABLE');
			expect(result.message).toContain('STORY_AI_PROVIDER');
			expect(result.message).toContain('STORY_AI_REASONING_EFFORT');
		}
	});

	it('fails closed without an API key and does not call fetch', async () => {
		let calls = 0;
		const provider = new XaiStoryModuleProvider({
			fetch: async () => {
				calls += 1;
				return jsonResponse({ output_text: '{}' });
			},
			now: fixedNow
		});

		const result = await provider.generateModuleJson(providerRequest);

		expect(calls).toBe(0);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe('PROVIDER_UNAVAILABLE');
			expect(result.message).toContain('XAI_API_KEY');
			expect(result.provider).toBe('xai');
			expect(result.model).toBe(XAI_DEFAULT_MODEL);
			expect(result.generatedAt).toBe(generatedAt);
		}
	});

	it('posts module prompt messages to the xAI Responses endpoint and returns raw output text', async () => {
		const fetchSpy = createFetchSpy(jsonResponse({ output_text: '{"variants":[]}' }));
		const provider = new XaiStoryModuleProvider({
			apiKey: 'test-key',
			model: 'grok-4.20-multi-agent',
			reasoningEffort: 'high',
			fetch: fetchSpy.fetch,
			now: fixedNow
		});

		const result = await provider.generateModuleJson(providerRequest);

		expect(result).toMatchObject({
			success: true,
			rawText: '{"variants":[]}',
			provider: 'xai',
			model: 'grok-4.20-multi-agent',
			generatedAt
		});
		expect(fetchSpy.calls).toHaveLength(1);
		const call = fetchSpy.calls[0];
		expect(call?.input).toBe(XAI_RESPONSES_ENDPOINT);
		expect(call?.init.method).toBe('POST');
		expect(call?.init.headers).toEqual({
			'Content-Type': 'application/json',
			Authorization: 'Bearer test-key'
		});
		expect(parseRequestBody(call?.init.body)).toEqual({
			model: 'grok-4.20-multi-agent',
			reasoning: {
				effort: 'high'
			},
			input: providerRequest.messages
		});
	});

	it('extracts nested Responses API output content when output_text is absent', async () => {
		const provider = new XaiStoryModuleProvider({
			apiKey: 'test-key',
			fetch: async () =>
				jsonResponse({
					output: [
						{
							type: 'message',
							content: [
								{ type: 'output_text', text: '{"first":true}' },
								{ type: 'output_text', text: '{"second":true}' }
							]
						}
					]
				}),
			now: fixedNow
		});

		const result = await provider.generateModuleJson(providerRequest);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.rawText).toBe('{"first":true}\n{"second":true}');
		}
	});

	it.each([401, 403])('maps auth HTTP %i responses to provider unavailable', async (status) => {
		const provider = new XaiStoryModuleProvider({
			apiKey: 'test-key',
			fetch: async () => new Response('denied', { status }),
			now: fixedNow
		});

		const result = await provider.generateModuleJson(providerRequest);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe('PROVIDER_UNAVAILABLE');
			expect(result.rawText).toBeUndefined();
		}
	});

	it('maps non-auth provider HTTP failures to unexpected exception', async () => {
		const provider = new XaiStoryModuleProvider({
			apiKey: 'test-key',
			fetch: async () => new Response('server failed', { status: 500 }),
			now: fixedNow
		});

		const result = await provider.generateModuleJson(providerRequest);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe('UNEXPECTED_EXCEPTION');
			expect(result.message).toContain('HTTP 500');
		}
	});

	it('fails closed on non-JSON provider responses', async () => {
		const provider = new XaiStoryModuleProvider({
			apiKey: 'test-key',
			fetch: async () => new Response('not json', { status: 200 }),
			now: fixedNow
		});

		const result = await provider.generateModuleJson(providerRequest);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe('SCHEMA_VALIDATION_FAILED');
		}
	});

	it('fails closed when a provider response has no output text', async () => {
		const provider = new XaiStoryModuleProvider({
			apiKey: 'test-key',
			fetch: async () => jsonResponse({ output: [{ type: 'message', content: [] }] }),
			now: fixedNow
		});

		const result = await provider.generateModuleJson(providerRequest);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe('SCHEMA_VALIDATION_FAILED');
		}
	});

	it('fails closed when the provider request times out', async () => {
		const provider = new XaiStoryModuleProvider({
			apiKey: 'test-key',
			timeoutMs: 1,
			fetch: abortableNeverFetch(),
			now: fixedNow
		});

		const result = await provider.generateModuleJson(providerRequest);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe('PROVIDER_TIMEOUT');
			expect(result.message).toContain('timed out');
		}
	});

	it('fails closed when fetch throws a network error', async () => {
		const provider = new XaiStoryModuleProvider({
			apiKey: 'test-key',
			fetch: async () => {
				throw new Error('network unavailable');
			},
			now: fixedNow
		});

		const result = await provider.generateModuleJson(providerRequest);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe('UNEXPECTED_EXCEPTION');
			expect(result.message).toContain('network unavailable');
		}
	});
});

const providerRequest: StoryModuleProviderRequest = {
	moduleId: 'cold-open-lab',
	moduleVersion: 'cold-open-lab.v1',
	promptVersion: 'cold-open-lab.prompt.v1',
	mode: 'live',
	messages: [
		{
			role: 'system',
			content: 'Return strict JSON.'
		},
		{
			role: 'user',
			content: 'Generate cold-open variants.'
		}
	],
	input: {
		workingTitle: 'The Crown That Eats Names',
		protagonistName: 'Mara Vey'
	},
	requestedAt
};

interface FetchCall {
	input: string | URL;
	init: RequestInit & {
		method: 'POST';
		body: BodyInit;
	};
}

function createFetchSpy(response: Response): { fetch: XaiFetch; calls: FetchCall[] } {
	const calls: FetchCall[] = [];
	const fetch: XaiFetch = async (input, init) => {
		if (!init || init.method !== 'POST' || !init.body) {
			throw new Error('Expected a POST request with a body.');
		}

		calls.push({
			input,
			init: {
				...init,
				method: 'POST',
				body: init.body
			}
		});

		return response;
	};

	return { fetch, calls };
}

function jsonResponse(body: unknown): Response {
	return new Response(JSON.stringify(body), {
		status: 200,
		headers: {
			'Content-Type': 'application/json'
		}
	});
}

function parseRequestBody(body: BodyInit | undefined): unknown {
	if (typeof body !== 'string') {
		throw new Error('Expected request body to be a JSON string.');
	}

	return JSON.parse(body) as unknown;
}

function abortableNeverFetch(): XaiFetch {
	return (_input, init) =>
		new Promise<Response>((_resolve, reject) => {
			const signal = init?.signal;

			if (!signal) {
				throw new Error('Expected timeout test to receive an AbortSignal.');
			}

			signal.addEventListener(
				'abort',
				() => {
					const error = new Error('aborted');
					error.name = 'AbortError';
					reject(error);
				},
				{ once: true }
			);
		});
}

function fixedNow(): Date {
	return new Date(generatedAt);
}
