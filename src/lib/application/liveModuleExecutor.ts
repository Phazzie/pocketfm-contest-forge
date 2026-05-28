// Created: 2026-05-28 04:04

import {
	evaluateModuleProseQuality,
	type ProseQualityIssue,
	type ProseQualityResult,
	type ProseQualityReview
} from '$lib/core/domain/proseQuality';
import {
	storyModuleProviderRequestSchema,
	storyModuleProviderResultSchema,
	type SerializableProviderInput,
	type StoryModuleProvider,
	type StoryModuleProviderFailure,
	type StoryModuleProviderFailureCode,
	type StoryModuleProviderMessage,
	type StoryModuleProviderName,
	type StoryModuleProviderSuccess
} from '$lib/core/ports/storyModuleProviderPort';
import { validateStoryState } from '$lib/core/story-state/storyStateValidation';
import type {
	ModuleIssue,
	ModuleIssueCode,
	ModuleProvenance,
	ModuleRunContext,
	ModuleRunResult,
	StoryModule
} from '$lib/story-modules/types';
import { moduleCompletedEvent } from '$lib/story-modules/types';

export type LiveModuleExecutorContext<TInput> = Omit<ModuleRunContext<TInput>, 'input' | 'mode'> & {
	input: unknown;
	mode: 'live';
};

export interface LiveModuleExecutorRequest<TInput, TOutput> {
	module: StoryModule<TInput, TOutput>;
	context: LiveModuleExecutorContext<TInput>;
	messages: StoryModuleProviderMessage[];
	providerInput: SerializableProviderInput;
}

export type LiveModuleQualityGate = (review: ProseQualityReview) => ProseQualityResult;

export interface LiveModuleExecutorConfig {
	qualityGate?: LiveModuleQualityGate;
	providerTimeoutMs?: number;
	supportedModuleIds?: ReadonlySet<string>;
}

interface ProviderDiagnostics {
	provider: StoryModuleProviderName;
	model: string;
	latencyMs: number;
	generatedAt: string;
	repairAttempts: number;
}

type JsonParseResult =
	| {
			success: true;
			value: unknown;
			repairAttempts: number;
	  }
	| {
			success: false;
			message: string;
			repairAttempts: number;
	  };

export class LiveModuleExecutor {
	private readonly providerTimeoutMs: number;
	private readonly qualityGate: LiveModuleQualityGate;
	private readonly supportedModuleIds: ReadonlySet<string>;

	constructor(
		private readonly provider: StoryModuleProvider,
		config: LiveModuleExecutorConfig = {}
	) {
		this.providerTimeoutMs = Math.max(1, config.providerTimeoutMs ?? 120_000);
		this.qualityGate = config.qualityGate ?? evaluateModuleProseQuality;
		this.supportedModuleIds = config.supportedModuleIds ?? new Set(['cold-open-lab']);
	}

	async run<TInput, TOutput>(
		request: LiveModuleExecutorRequest<TInput, TOutput>
	): Promise<ModuleRunResult<TOutput>> {
		const startedAt = performance.now();

		if (!this.supportedModuleIds.has(request.module.id)) {
			return this.failed(request, startedAt, [
				{
					code: 'INVALID_INPUT',
					field: 'module.id',
					message: `No live prose quality gate is configured for ${request.module.id}.`,
					severity: 'error'
				}
			]);
		}

		const stateValidation = validateStoryState(request.context.storyState);

		if (!stateValidation.success) {
			return this.failed(request, startedAt, [
				{
					code: 'MISSING_STORY_STATE',
					field: 'storyState',
					message: stateValidation.issues.join('; '),
					severity: 'error'
				}
			]);
		}

		const missing = request.module.requiredState.filter(
			(requirement) => !hasStoryStateValue(stateValidation.data, requirement)
		);

		if (missing.length > 0) {
			return this.failed(request, startedAt, [
				{
					code: 'MISSING_STORY_STATE',
					field: missing.join(', '),
					message: `Missing story state required by ${request.module.id}: ${missing.join(', ')}.`,
					severity: 'error'
				}
			]);
		}

		const parsedInput = request.module.inputSchema.safeParse(request.context.input);

		if (!parsedInput.success) {
			return this.failed(
				request,
				startedAt,
				parsedInput.error.issues.map((issue) => ({
					code: 'INVALID_INPUT',
					field: issue.path.join('.'),
					message: issue.message,
					severity: 'error'
				}))
			);
		}

		const providerRequest = storyModuleProviderRequestSchema.safeParse({
			moduleId: request.module.id,
			moduleVersion: request.module.version,
			promptVersion: request.module.promptVersion,
			mode: 'live',
			messages: request.messages,
			input: request.providerInput,
			requestedAt: request.context.now.toISOString()
		});

		if (!providerRequest.success) {
			return this.failed(
				request,
				startedAt,
				providerRequest.error.issues.map((issue) => ({
					code: 'INVALID_INPUT',
					field: issue.path.join('.'),
					message: issue.message,
					severity: 'error'
				}))
			);
		}

		let untrustedProviderResult: unknown;

		try {
			untrustedProviderResult = await withTimeout(
				this.provider.generateModuleJson(providerRequest.data),
				this.providerTimeoutMs
			);
		} catch (error) {
			if (error instanceof ProviderTimeoutError) {
				return this.failed(request, startedAt, [
					{
						code: 'PROVIDER_TIMEOUT',
						message: `Story module provider timed out after ${this.providerTimeoutMs}ms.`,
						severity: 'error'
					}
				]);
			}

			return this.failed(request, startedAt, [
				{
					code: 'UNEXPECTED_EXCEPTION',
					message:
						error instanceof Error ? error.message : 'Story module provider failed unexpectedly.',
					severity: 'error'
				}
			]);
		}

		const parsedProviderResult = storyModuleProviderResultSchema.safeParse(untrustedProviderResult);

		if (!parsedProviderResult.success) {
			return this.failed(
				request,
				startedAt,
				parsedProviderResult.error.issues.map((issue) => ({
					code: 'SCHEMA_VALIDATION_FAILED',
					field: issue.path.join('.'),
					message: issue.message,
					severity: 'error'
				}))
			);
		}

		const providerResult = parsedProviderResult.data;

		if (!providerResult.success) {
			return this.failed(
				request,
				startedAt,
				[
					{
						code: mapProviderFailureCode(providerResult.code),
						message: providerResult.message,
						severity: 'error'
					}
				],
				diagnosticsFromFailure(providerResult)
			);
		}

		if (!isLiveProviderName(providerResult.provider)) {
			return this.failed(
				request,
				startedAt,
				[
					{
						code: 'PROVIDER_UNAVAILABLE',
						message: `Live execution cannot accept successful output from provider "${providerResult.provider}".`,
						severity: 'error'
					}
				],
				diagnosticsFromSuccess(providerResult, 0)
			);
		}

		const parsedJson = parseProviderJson(providerResult.rawText);
		const diagnostics = diagnosticsFromSuccess(providerResult, parsedJson.repairAttempts);

		if (!parsedJson.success) {
			return this.failed(
				request,
				startedAt,
				[
					{
						code: 'SCHEMA_VALIDATION_FAILED',
						message: parsedJson.message,
						severity: 'error'
					}
				],
				diagnostics
			);
		}

		const parsedOutput = request.module.outputSchema.safeParse(parsedJson.value);

		if (!parsedOutput.success) {
			return this.failed(
				request,
				startedAt,
				parsedOutput.error.issues.map((issue) => ({
					code: 'SCHEMA_VALIDATION_FAILED',
					field: issue.path.join('.'),
					message: issue.message,
					severity: 'error'
				})),
				diagnostics
			);
		}

		const protagonistName = readStringProperty(parsedInput.data, 'protagonistName');
		const qualityReview: ProseQualityReview = protagonistName
			? {
					moduleId: request.module.id,
					protagonistName,
					output: parsedOutput.data
				}
			: {
					moduleId: request.module.id,
					output: parsedOutput.data
				};
		const qualityResult = this.qualityGate(qualityReview);
		const qualityIssues = qualityResult.issues.map(moduleIssueFromProseIssue);

		if (!qualityResult.accepted) {
			return this.failed(request, startedAt, qualityIssues, diagnostics);
		}

		return {
			status: 'success',
			output: parsedOutput.data,
			summary: `${request.module.label} accepted live provider output.`,
			issues: qualityIssues,
			provenance: createLiveProvenance(request, diagnostics),
			trackingEvents: [
				{
					...moduleCompletedEvent(
						request.module.id,
						`${request.module.label} live provider output passed schema and prose gates.`
					),
					metadata: trackingMetadata(diagnostics, {
						qualityWarnings: qualityIssues.filter((issue) => issue.severity === 'warning').length
					})
				}
			]
		};
	}

	private failed<TInput, TOutput>(
		request: LiveModuleExecutorRequest<TInput, TOutput>,
		startedAt: number,
		issues: ModuleIssue[],
		diagnostics = fallbackDiagnostics(startedAt, request.context.now.toISOString())
	): ModuleRunResult<TOutput> {
		return {
			status: 'failed',
			summary: `${request.module.label} did not produce accepted live output.`,
			issues,
			provenance: createLiveProvenance(request, diagnostics),
			trackingEvents: [
				{
					type: 'quality-rejection',
					moduleId: request.module.id,
					subjectId: request.module.id,
					summary: issues.map((issue) => issue.message).join('; '),
					metadata: trackingMetadata(diagnostics, {
						failureCode: issues[0]?.code ?? 'UNEXPECTED_EXCEPTION'
					})
				}
			]
		};
	}
}

class ProviderTimeoutError extends Error {
	constructor(timeoutMs: number) {
		super(`Story module provider timed out after ${timeoutMs}ms.`);
		this.name = 'ProviderTimeoutError';
	}
}

async function withTimeout<TValue>(promise: Promise<TValue>, timeoutMs: number): Promise<TValue> {
	let timeoutId: ReturnType<typeof setTimeout> | undefined;
	const timeout = new Promise<never>((_, reject) => {
		timeoutId = setTimeout(() => reject(new ProviderTimeoutError(timeoutMs)), timeoutMs);
	});

	try {
		return await Promise.race([promise, timeout]);
	} finally {
		if (timeoutId) clearTimeout(timeoutId);
	}
}

function diagnosticsFromSuccess(
	result: StoryModuleProviderSuccess,
	repairAttempts: number
): ProviderDiagnostics {
	return {
		provider: result.provider,
		model: result.model,
		latencyMs: result.latencyMs,
		generatedAt: result.generatedAt,
		repairAttempts
	};
}

function diagnosticsFromFailure(result: StoryModuleProviderFailure): ProviderDiagnostics {
	return {
		provider: result.provider,
		model: result.model,
		latencyMs: result.latencyMs,
		generatedAt: result.generatedAt,
		repairAttempts: 0
	};
}

function fallbackDiagnostics(startedAt: number, generatedAt: string): ProviderDiagnostics {
	return {
		provider: 'none',
		model: 'not-called',
		latencyMs: Math.max(0, Math.round(performance.now() - startedAt)),
		generatedAt,
		repairAttempts: 0
	};
}

function createLiveProvenance<TInput, TOutput>(
	request: LiveModuleExecutorRequest<TInput, TOutput>,
	diagnostics: ProviderDiagnostics
): ModuleProvenance {
	return {
		moduleId: request.module.id,
		moduleVersion: request.module.version,
		promptVersion: request.module.promptVersion,
		provider: diagnostics.provider,
		model: diagnostics.model,
		mode: 'live',
		latencyMs: diagnostics.latencyMs,
		sourceContestBriefId: request.context.contestBrief.id,
		sourceContestBriefVersion: request.context.contestBrief.formatSignal,
		generatedAt: diagnostics.generatedAt,
		repairAttempts: diagnostics.repairAttempts
	};
}

function trackingMetadata(
	diagnostics: ProviderDiagnostics,
	extra: Record<string, string | number | boolean>
): Record<string, string | number | boolean> {
	return {
		provider: diagnostics.provider,
		model: diagnostics.model,
		latencyMs: diagnostics.latencyMs,
		repairAttempts: diagnostics.repairAttempts,
		...extra
	};
}

function parseProviderJson(rawText: string): JsonParseResult {
	try {
		return {
			success: true,
			value: JSON.parse(rawText),
			repairAttempts: 0
		};
	} catch {
		const repairCandidates = [
			extractMarkdownJsonObject(rawText),
			extractFirstBalancedJsonObject(rawText)
		].filter((candidate): candidate is string => Boolean(candidate));

		if (repairCandidates.length === 0) {
			return {
				success: false,
				message:
					'Provider output was not valid JSON and no balanced JSON object could be repaired.',
				repairAttempts: 1
			};
		}

		for (const repairCandidate of new Set(repairCandidates)) {
			try {
				return {
					success: true,
					value: JSON.parse(repairCandidate),
					repairAttempts: 1
				};
			} catch {
				// Continue through the single repair strategy's extraction candidates.
			}
		}

		return {
			success: false,
			message: 'Provider output was not valid JSON after one repair attempt.',
			repairAttempts: 1
		};
	}
}

function extractMarkdownJsonObject(rawText: string): string | undefined {
	const match = /```(?:json)?\s*([\s\S]*?)\s*```/i.exec(rawText);
	const candidate = match?.[1]?.trim();

	return candidate && candidate.length > 0 ? candidate : undefined;
}

function extractFirstBalancedJsonObject(rawText: string): string | undefined {
	let startIndex = -1;
	let depth = 0;
	let isInString = false;
	let isEscaped = false;

	for (let index = 0; index < rawText.length; index += 1) {
		const character = rawText[index];

		if (startIndex === -1) {
			if (character === '{') {
				startIndex = index;
				depth = 1;
			}
			continue;
		}

		if (isEscaped) {
			isEscaped = false;
			continue;
		}

		if (character === '\\') {
			isEscaped = true;
			continue;
		}

		if (character === '"') {
			isInString = !isInString;
			continue;
		}

		if (isInString) continue;

		if (character === '{') depth += 1;
		if (character === '}') depth -= 1;

		if (depth === 0) return rawText.slice(startIndex, index + 1);
	}

	return undefined;
}

function mapProviderFailureCode(code: StoryModuleProviderFailureCode): ModuleIssueCode {
	switch (code) {
		case 'PROVIDER_UNAVAILABLE':
			return 'PROVIDER_UNAVAILABLE';
		case 'PROVIDER_TIMEOUT':
			return 'PROVIDER_TIMEOUT';
		case 'MALFORMED_JSON':
		case 'SCHEMA_VALIDATION_FAILED':
			return 'SCHEMA_VALIDATION_FAILED';
		case 'PROSE_QUALITY_REJECTION':
			return 'PROSE_QUALITY_REJECTION';
		case 'PARTIAL_MODULE_RESULT':
			return 'PARTIAL_MODULE_RESULT';
		case 'UNEXPECTED_EXCEPTION':
			return 'UNEXPECTED_EXCEPTION';
	}
}

function isLiveProviderName(provider: StoryModuleProviderName): boolean {
	return (
		provider === 'xai' || provider === 'openai' || provider === 'anthropic' || provider === 'google'
	);
}

function moduleIssueFromProseIssue(issue: ProseQualityIssue): ModuleIssue {
	const moduleIssue: ModuleIssue = {
		code: issue.severity === 'warning' ? 'PARTIAL_MODULE_RESULT' : 'PROSE_QUALITY_REJECTION',
		message: issue.message,
		severity: issue.severity
	};

	return issue.field ? { ...moduleIssue, field: issue.field } : moduleIssue;
}

function hasStoryStateValue(value: unknown, path: string): boolean {
	const target = path.split('.').reduce<unknown>((current, key) => {
		if (!current || typeof current !== 'object') return undefined;
		return (current as Record<string, unknown>)[key];
	}, value);

	if (Array.isArray(target)) return target.length > 0;
	if (typeof target === 'string') return target.trim().length > 0;
	return target !== null && target !== undefined;
}

function readStringProperty(value: unknown, key: string): string | undefined {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
	const property = (value as Record<string, unknown>)[key];
	return typeof property === 'string' && property.trim().length > 0 ? property : undefined;
}
