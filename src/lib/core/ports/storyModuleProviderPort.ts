// Created: 2026-05-28 03:48

import { z } from 'zod';

export const storyModuleProviderNameSchema = z.enum([
	'fixture',
	'demo-deterministic',
	'xai',
	'openai',
	'anthropic',
	'google',
	'none'
]);

export const storyModuleProviderFailureCodeSchema = z.enum([
	'PROVIDER_UNAVAILABLE',
	'PROVIDER_QUOTA_EXCEEDED',
	'PROVIDER_TIMEOUT',
	'MALFORMED_JSON',
	'SCHEMA_VALIDATION_FAILED',
	'PROSE_QUALITY_REJECTION',
	'PARTIAL_MODULE_RESULT',
	'UNEXPECTED_EXCEPTION'
]);

export const storyModuleProviderMessageSchema = z.object({
	role: z.enum(['system', 'user', 'assistant']),
	content: z.string().min(1)
});

export type SerializableProviderValue =
	| string
	| number
	| boolean
	| null
	| SerializableProviderValue[]
	| { [key: string]: SerializableProviderValue };

export type SerializableProviderInput = Record<string, SerializableProviderValue>;

export const serializableProviderValueSchema: z.ZodType<SerializableProviderValue> = z.lazy(() =>
	z.union([
		z.string(),
		z.number().finite(),
		z.boolean(),
		z.null(),
		z.array(serializableProviderValueSchema),
		z.record(z.string(), serializableProviderValueSchema)
	])
);

export const serializableProviderInputSchema: z.ZodType<SerializableProviderInput> = z.record(
	z.string(),
	serializableProviderValueSchema
);

export const storyModuleProviderRequestSchema = z.object({
	moduleId: z.string().min(1),
	moduleVersion: z.string().min(1),
	promptVersion: z.string().min(1),
	mode: z.literal('live'),
	messages: z.array(storyModuleProviderMessageSchema).min(1),
	input: serializableProviderInputSchema,
	requestedAt: z.string().datetime()
});

export const storyModuleProviderSuccessSchema = z.object({
	success: z.literal(true),
	rawText: z.string().min(1),
	provider: storyModuleProviderNameSchema,
	model: z.string().min(1),
	latencyMs: z.number().int().min(0),
	generatedAt: z.string().datetime()
});

export const storyModuleProviderFailureSchema = z.object({
	success: z.literal(false),
	code: storyModuleProviderFailureCodeSchema,
	message: z.string().min(1),
	provider: storyModuleProviderNameSchema,
	model: z.string().min(1),
	latencyMs: z.number().int().min(0),
	generatedAt: z.string().datetime(),
	rawText: z.string().optional()
});

export const storyModuleProviderResultSchema = z.discriminatedUnion('success', [
	storyModuleProviderSuccessSchema,
	storyModuleProviderFailureSchema
]);

export type StoryModuleProviderName = z.infer<typeof storyModuleProviderNameSchema>;
export type StoryModuleProviderFailureCode = z.infer<typeof storyModuleProviderFailureCodeSchema>;
export type StoryModuleProviderMessage = z.infer<typeof storyModuleProviderMessageSchema>;
export type StoryModuleProviderRequest = z.infer<typeof storyModuleProviderRequestSchema>;
export type StoryModuleProviderSuccess = z.infer<typeof storyModuleProviderSuccessSchema>;
export type StoryModuleProviderFailure = z.infer<typeof storyModuleProviderFailureSchema>;
export type StoryModuleProviderResult = z.infer<typeof storyModuleProviderResultSchema>;

export interface StoryModuleProvider {
	generateModuleJson(request: StoryModuleProviderRequest): Promise<StoryModuleProviderResult>;
}
