// Created: 2026-05-28 04:29

import { z } from 'zod';
import type {
	StoryModuleProvider,
	StoryModuleProviderFailure,
	StoryModuleProviderRequest,
	StoryModuleProviderResult
} from '$lib/core/ports/storyModuleProviderPort';

export const XAI_RESPONSES_ENDPOINT = 'https://api.x.ai/v1/responses';
export const XAI_DEFAULT_MODEL = 'grok-4.20-multi-agent';
export const XAI_DEFAULT_REASONING_EFFORT = 'medium';
export const XAI_DEFAULT_TIMEOUT_MS = 120_000;

const xaiReasoningEffortSchema = z.enum(['low', 'medium', 'high', 'xhigh']);

const xaiResponseContentSchema = z
	.object({
		type: z.string().optional(),
		text: z.string().optional()
	})
	.passthrough();

const xaiOutputItemSchema = z
	.object({
		type: z.string().optional(),
		content: z.array(xaiResponseContentSchema).optional()
	})
	.passthrough();

const xaiResponsesSchema = z
	.object({
		output_text: z.string().optional(),
		output: z.array(xaiOutputItemSchema).optional()
	})
	.passthrough();

export type XaiReasoningEffort = z.infer<typeof xaiReasoningEffortSchema>;

export type XaiFetch = (input: string | URL, init?: RequestInit) => Promise<Response>;

export interface XaiStoryModuleProviderConfig {
	apiKey?: string | undefined;
	model?: string | undefined;
	reasoningEffort?: XaiReasoningEffort | undefined;
	endpoint?: string | undefined;
	timeoutMs?: number | undefined;
	fetch?: XaiFetch | undefined;
	now?: (() => Date) | undefined;
	configurationIssues?: string[] | undefined;
}

type XaiResponsePayload = z.infer<typeof xaiResponsesSchema>;

interface XaiResponsesRequestBody {
	model: string;
	reasoning: {
		effort: XaiReasoningEffort;
	};
	input: {
		role: StoryModuleProviderRequest['messages'][number]['role'];
		content: string;
	}[];
}

export class XaiStoryModuleProvider implements StoryModuleProvider {
	private readonly apiKey: string | undefined;
	private readonly model: string;
	private readonly reasoningEffort: XaiReasoningEffort;
	private readonly endpoint: string;
	private readonly timeoutMs: number;
	private readonly fetchImpl: XaiFetch | undefined;
	private readonly now: () => Date;
	private readonly configurationIssues: string[];

	constructor(config: XaiStoryModuleProviderConfig = {}) {
		this.apiKey = normalizeOptionalString(config.apiKey);
		this.model = normalizeOptionalString(config.model) ?? XAI_DEFAULT_MODEL;
		this.reasoningEffort = config.reasoningEffort ?? XAI_DEFAULT_REASONING_EFFORT;
		this.endpoint = normalizeOptionalString(config.endpoint) ?? XAI_RESPONSES_ENDPOINT;
		this.timeoutMs = Math.max(1, config.timeoutMs ?? XAI_DEFAULT_TIMEOUT_MS);
		this.fetchImpl = config.fetch ?? globalThis.fetch?.bind(globalThis);
		this.now = config.now ?? (() => new Date());
		this.configurationIssues = config.configurationIssues ?? [];
	}

	async generateModuleJson(
		request: StoryModuleProviderRequest
	): Promise<StoryModuleProviderResult> {
		const startedAt = performance.now();

		if (this.configurationIssues.length > 0) {
			return this.failure(
				'PROVIDER_UNAVAILABLE',
				`xAI provider configuration is invalid: ${this.configurationIssues.join('; ')}`,
				startedAt
			);
		}

		if (!this.apiKey) {
			return this.failure('PROVIDER_UNAVAILABLE', 'XAI_API_KEY is not configured.', startedAt);
		}

		if (!this.fetchImpl) {
			return this.failure(
				'PROVIDER_UNAVAILABLE',
				'Fetch is unavailable in this runtime.',
				startedAt
			);
		}

		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

		try {
			const response = await this.fetchImpl(this.endpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${this.apiKey}`
				},
				body: JSON.stringify(this.requestBody(request)),
				signal: controller.signal
			});
			const bodyText = await safeResponseText(response);

			if (!response.ok) {
				return this.failure(
					response.status === 401 || response.status === 403
						? 'PROVIDER_UNAVAILABLE'
						: 'UNEXPECTED_EXCEPTION',
					`xAI Responses API returned HTTP ${response.status}: ${truncate(bodyText)}`,
					startedAt
				);
			}

			const bodyJson = parseJson(bodyText);

			if (!bodyJson.success) {
				return this.failure(
					'SCHEMA_VALIDATION_FAILED',
					'xAI Responses API returned non-JSON content.',
					startedAt
				);
			}

			const parsed = xaiResponsesSchema.safeParse(bodyJson.value);

			if (!parsed.success) {
				return this.failure(
					'SCHEMA_VALIDATION_FAILED',
					`xAI Responses API shape was invalid: ${parsed.error.issues
						.map((issue) => issue.message)
						.join('; ')}`,
					startedAt
				);
			}

			const rawText = extractResponseText(parsed.data);

			if (!rawText) {
				return this.failure(
					'SCHEMA_VALIDATION_FAILED',
					'xAI Responses API did not include output text.',
					startedAt
				);
			}

			return {
				success: true,
				rawText,
				provider: 'xai',
				model: this.model,
				latencyMs: elapsedMs(startedAt),
				generatedAt: this.now().toISOString()
			};
		} catch (error) {
			if (isAbortError(error)) {
				return this.failure(
					'PROVIDER_TIMEOUT',
					`xAI Responses API timed out after ${this.timeoutMs}ms.`,
					startedAt
				);
			}

			return this.failure(
				'UNEXPECTED_EXCEPTION',
				error instanceof Error ? error.message : 'xAI Responses API request failed.',
				startedAt
			);
		} finally {
			clearTimeout(timeout);
		}
	}

	private requestBody(request: StoryModuleProviderRequest): XaiResponsesRequestBody {
		return {
			model: this.model,
			reasoning: {
				effort: this.reasoningEffort
			},
			input: request.messages.map((message) => ({
				role: message.role,
				content: message.content
			}))
		};
	}

	private failure(
		code: StoryModuleProviderFailure['code'],
		message: string,
		startedAt: number
	): StoryModuleProviderFailure {
		return {
			success: false,
			code,
			message,
			provider: 'xai',
			model: this.model,
			latencyMs: elapsedMs(startedAt),
			generatedAt: this.now().toISOString()
		};
	}
}

export function createXaiStoryModuleProviderFromEnv(
	env: Record<string, string | undefined>,
	overrides: Omit<XaiStoryModuleProviderConfig, 'apiKey' | 'model' | 'reasoningEffort'> = {}
): XaiStoryModuleProvider {
	return new XaiStoryModuleProvider({
		...resolveXaiStoryModuleProviderEnv(env),
		...overrides
	});
}

export function resolveXaiStoryModuleProviderEnv(
	env: Record<string, string | undefined>
): Pick<
	XaiStoryModuleProviderConfig,
	'apiKey' | 'model' | 'reasoningEffort' | 'configurationIssues'
> {
	const configurationIssues: string[] = [];
	const provider = normalizeOptionalString(env['STORY_AI_PROVIDER']);
	const model = normalizeOptionalString(env['STORY_AI_MODEL']) ?? XAI_DEFAULT_MODEL;
	const reasoningEffortValue =
		normalizeOptionalString(env['STORY_AI_REASONING_EFFORT']) ?? XAI_DEFAULT_REASONING_EFFORT;
	const reasoningEffort = xaiReasoningEffortSchema.safeParse(reasoningEffortValue);

	if (provider && provider !== 'xai') {
		configurationIssues.push(`STORY_AI_PROVIDER must be "xai" when using the xAI adapter.`);
	}

	if (!reasoningEffort.success) {
		configurationIssues.push(
			'STORY_AI_REASONING_EFFORT must be one of low, medium, high, or xhigh.'
		);
	}

	return {
		apiKey: normalizeOptionalString(env['XAI_API_KEY']),
		model,
		reasoningEffort: reasoningEffort.success ? reasoningEffort.data : XAI_DEFAULT_REASONING_EFFORT,
		configurationIssues
	};
}

function extractResponseText(payload: XaiResponsePayload): string | undefined {
	const directText = normalizeOptionalString(payload.output_text);

	if (directText) return directText;

	const outputText = payload.output
		?.flatMap((item) => item.content ?? [])
		.map((content) => normalizeOptionalString(content.text))
		.filter((content): content is string => Boolean(content))
		.join('\n')
		.trim();

	return outputText && outputText.length > 0 ? outputText : undefined;
}

async function safeResponseText(response: Response): Promise<string> {
	try {
		return await response.text();
	} catch {
		return '';
	}
}

function parseJson(text: string): { success: true; value: unknown } | { success: false } {
	try {
		return {
			success: true,
			value: JSON.parse(text)
		};
	} catch {
		return {
			success: false
		};
	}
}

function elapsedMs(startedAt: number): number {
	return Math.max(0, Math.round(performance.now() - startedAt));
}

function normalizeOptionalString(value: string | undefined): string | undefined {
	const normalized = value?.trim();
	return normalized && normalized.length > 0 ? normalized : undefined;
}

function truncate(value: string): string {
	const normalized = value.trim().replace(/\s+/g, ' ');
	return normalized.length > 300 ? `${normalized.slice(0, 300)}...` : normalized;
}

function isAbortError(error: unknown): boolean {
	return error instanceof Error && error.name === 'AbortError';
}
