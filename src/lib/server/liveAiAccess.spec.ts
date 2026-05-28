// Created: 2026-05-28 05:59

import { beforeEach, describe, expect, it } from 'vitest';
import {
	authorizeLiveAiAccess,
	consumeLiveAiQuota,
	liveAiAccessBucketCount,
	resetLiveAiAccessBuckets,
	verifyLiveAiAccessCode
} from './liveAiAccess';

describe('live AI access gate', () => {
	beforeEach(() => {
		resetLiveAiAccessBuckets();
	});

	it('fails closed when the deployment has no configured access code', () => {
		const result = authorizeLiveAiAccess({
			clientKey: 'local',
			submittedAccessCode: 'demo'
		});

		expect(result?.success).toBe(false);
		expect(result?.error.code).toBe('ACCESS_NOT_CONFIGURED');
	});

	it('rejects missing or incorrect submitted access codes', () => {
		const result = authorizeLiveAiAccess({
			clientKey: 'local',
			configuredAccessCode: 'demo',
			submittedAccessCode: 'wrong'
		});

		expect(result?.success).toBe(false);
		expect(result?.error.code).toBe('ACCESS_DENIED');
	});

	it('allows matching access codes and tracks requests per client window', () => {
		const result = authorizeLiveAiAccess({
			clientKey: 'local',
			configuredAccessCode: 'demo',
			submittedAccessCode: 'demo',
			nowMs: 1000,
			limit: {
				maxRequests: 2,
				windowMs: 60_000
			}
		});

		expect(result).toBeUndefined();
	});

	it('does not consume paid-call quota while only checking a valid access code', () => {
		const accessResult = verifyLiveAiAccessCode({
			clientKey: 'local',
			configuredAccessCode: 'demo',
			submittedAccessCode: 'demo',
			nowMs: 1000
		});

		expect(accessResult).toBeUndefined();
		expect(liveAiAccessBucketCount()).toBe(0);

		expect(
			consumeLiveAiQuota({
				clientKey: 'local',
				nowMs: 1000
			})
		).toBeUndefined();
		expect(liveAiAccessBucketCount()).toBe(1);
	});

	it('rate limits repeated failed access-code attempts', () => {
		for (let attempt = 0; attempt < 10; attempt += 1) {
			const result = verifyLiveAiAccessCode({
				clientKey: 'local',
				configuredAccessCode: 'demo',
				submittedAccessCode: 'wrong',
				nowMs: 1000
			});

			expect(result?.success).toBe(false);
			expect(result?.error.code).toBe('ACCESS_DENIED');
		}

		const result = verifyLiveAiAccessCode({
			clientKey: 'local',
			configuredAccessCode: 'demo',
			submittedAccessCode: 'wrong',
			nowMs: 1000
		});

		expect(result?.success).toBe(false);
		expect(result?.error.code).toBe('RATE_LIMITED');
		expect(result?.error.retryAfterSeconds).toBe(900);
	});

	it('rate limits after the configured number of accepted requests', () => {
		const config = {
			clientKey: 'local',
			configuredAccessCode: 'demo',
			submittedAccessCode: 'demo',
			nowMs: 1000,
			limit: {
				maxRequests: 1,
				windowMs: 60_000
			}
		};

		expect(authorizeLiveAiAccess(config)).toBeUndefined();
		const result = authorizeLiveAiAccess(config);

		expect(result?.success).toBe(false);
		expect(result?.error.code).toBe('RATE_LIMITED');
		expect(result?.error.retryAfterSeconds).toBe(60);
	});

	it('starts a new bucket after the rate window expires', () => {
		const limit = {
			maxRequests: 1,
			windowMs: 60_000
		};

		expect(
			authorizeLiveAiAccess({
				clientKey: 'local',
				configuredAccessCode: 'demo',
				submittedAccessCode: 'demo',
				nowMs: 1000,
				limit
			})
		).toBeUndefined();

		const result = authorizeLiveAiAccess({
			clientKey: 'local',
			configuredAccessCode: 'demo',
			submittedAccessCode: 'demo',
			nowMs: 61_000,
			limit
		});

		expect(result).toBeUndefined();
	});

	it('prunes expired buckets when tracked clients exceed the demo threshold', () => {
		const limit = {
			maxRequests: 1,
			windowMs: 60_000
		};

		for (let index = 0; index < 1001; index += 1) {
			authorizeLiveAiAccess({
				clientKey: `client-${index}`,
				configuredAccessCode: 'demo',
				submittedAccessCode: 'demo',
				nowMs: 1000,
				limit
			});
		}

		expect(liveAiAccessBucketCount()).toBe(1001);

		authorizeLiveAiAccess({
			clientKey: 'fresh-client',
			configuredAccessCode: 'demo',
			submittedAccessCode: 'demo',
			nowMs: 61_000,
			limit
		});

		expect(liveAiAccessBucketCount()).toBe(1);
	});
});
