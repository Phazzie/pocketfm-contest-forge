// Created: 2026-05-29 03:18

import { describe, expect, it } from 'vitest';
import { liveActionRequest, liveActionUrl } from './live-ai-smoke.mjs';

describe('live AI smoke script', () => {
	it('builds the SvelteKit action URL from the deployed target', () => {
		expect(liveActionUrl('https://pocketfm-contest-forge.vercel.app').href).toBe(
			'https://pocketfm-contest-forge.vercel.app/?/runLiveColdOpen'
		);
	});

	it('posts with a same-origin Origin header for SvelteKit CSRF protection', () => {
		const request = liveActionRequest('https://pocketfm-contest-forge.vercel.app', 'demo-code');
		const body = request.init.body;

		expect(request.url.href).toBe('https://pocketfm-contest-forge.vercel.app/?/runLiveColdOpen');
		expect(request.init.method).toBe('POST');
		expect(request.init.headers).toMatchObject({
			'Content-Type': 'application/x-www-form-urlencoded',
			Origin: 'https://pocketfm-contest-forge.vercel.app',
			'x-sveltekit-action': 'true'
		});
		expect(body).toBeInstanceOf(URLSearchParams);
		expect(body.get('accessCode')).toBe('demo-code');
	});

	it('rejects empty target URLs before building the action URL', () => {
		expect(() => liveActionUrl('')).toThrow('Target URL must be a non-empty string.');
	});

	it('rejects empty access codes before building the request body', () => {
		expect(() => liveActionRequest('https://pocketfm-contest-forge.vercel.app', ' ')).toThrow(
			'Access code must be a non-empty string.'
		);
	});
});
