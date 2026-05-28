// Created: 2026-05-28 05:47

import type { LiveColdOpenResponse } from '$lib/core/contracts/contestForgeContract';

export interface LiveAiAccessConfig {
	configuredAccessCode?: string | undefined;
	submittedAccessCode?: string | undefined;
	clientKey: string;
	nowMs?: number | undefined;
	limit?: {
		maxRequests: number;
		windowMs: number;
	};
}

export interface LiveAiQuotaConfig {
	clientKey: string;
	nowMs?: number | undefined;
	limit?: {
		maxRequests: number;
		windowMs: number;
	};
}

type LiveAiAccessFailure = Extract<LiveColdOpenResponse, { success: false }>;

interface RateBucket {
	windowStartedAtMs: number;
	count: number;
}

const defaultLimit = {
	maxRequests: 3,
	windowMs: 60 * 60 * 1000
};
const deniedAccessLimit = {
	maxRequests: 10,
	windowMs: 15 * 60 * 1000
};
const maxTrackedClientsBeforePrune = 1000;

const buckets = new Map<string, RateBucket>();

export function authorizeLiveAiAccess(config: LiveAiAccessConfig): LiveAiAccessFailure | undefined {
	const accessFailure = verifyLiveAiAccessCode(config);

	if (accessFailure) return accessFailure;

	return consumeLiveAiQuota(config);
}

export function verifyLiveAiAccessCode(
	config: LiveAiAccessConfig
): LiveAiAccessFailure | undefined {
	const configuredAccessCode = normalize(config.configuredAccessCode);
	const submittedAccessCode = normalize(config.submittedAccessCode);
	const nowMs = config.nowMs ?? Date.now();

	pruneExpiredBuckets(nowMs, Math.max(config.limit?.windowMs ?? 0, deniedAccessLimit.windowMs));

	if (!configuredAccessCode) {
		return liveAiAccessFailure(
			'ACCESS_NOT_CONFIGURED',
			'Live AI access is not configured on this deployment.'
		);
	}

	if (!submittedAccessCode || submittedAccessCode !== configuredAccessCode) {
		const failedAttemptLimit = consumeBucket(
			`denied:${config.clientKey}`,
			nowMs,
			deniedAccessLimit,
			'Too many failed live AI access-code attempts.'
		);

		return (
			failedAttemptLimit ??
			liveAiAccessFailure('ACCESS_DENIED', 'Enter the live AI access code to run Grok.')
		);
	}

	return undefined;
}

export function consumeLiveAiQuota(config: LiveAiQuotaConfig): LiveAiAccessFailure | undefined {
	const limit = config.limit ?? defaultLimit;
	const nowMs = config.nowMs ?? Date.now();

	pruneExpiredBuckets(nowMs, limit.windowMs);

	return consumeBucket(
		`quota:${config.clientKey}`,
		nowMs,
		limit,
		'Live AI request limit reached for this demo window.'
	);
}

export function resetLiveAiAccessBuckets(): void {
	buckets.clear();
}

export function liveAiAccessBucketCount(): number {
	return buckets.size;
}

function nextBucket(clientKey: string, nowMs: number, windowMs: number): RateBucket {
	const existing = buckets.get(clientKey);

	if (!existing || nowMs - existing.windowStartedAtMs >= windowMs) {
		return {
			windowStartedAtMs: nowMs,
			count: 0
		};
	}

	return existing;
}

function consumeBucket(
	clientKey: string,
	nowMs: number,
	limit: NonNullable<LiveAiQuotaConfig['limit']>,
	message: string
): LiveAiAccessFailure | undefined {
	const bucket = nextBucket(clientKey, nowMs, limit.windowMs);

	if (bucket.count >= limit.maxRequests) {
		const retryAfterSeconds = Math.max(
			1,
			Math.ceil((bucket.windowStartedAtMs + limit.windowMs - nowMs) / 1000)
		);

		return liveAiAccessFailure('RATE_LIMITED', message, retryAfterSeconds);
	}

	bucket.count += 1;
	buckets.set(clientKey, bucket);

	return undefined;
}

function pruneExpiredBuckets(nowMs: number, windowMs: number): void {
	if (buckets.size <= maxTrackedClientsBeforePrune) return;

	for (const [clientKey, bucket] of buckets.entries()) {
		if (nowMs - bucket.windowStartedAtMs >= windowMs) {
			buckets.delete(clientKey);
		}
	}
}

function liveAiAccessFailure(
	code: LiveAiAccessFailure['error']['code'],
	message: string,
	retryAfterSeconds?: number
): LiveAiAccessFailure {
	const error: LiveAiAccessFailure['error'] = retryAfterSeconds
		? { code, message, retryAfterSeconds }
		: { code, message };

	return {
		success: false,
		error
	};
}

function normalize(value: string | undefined): string | undefined {
	const normalized = value?.trim();
	return normalized && normalized.length > 0 ? normalized : undefined;
}
