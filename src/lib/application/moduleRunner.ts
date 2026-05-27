// Created: 2026-05-26 13:45

import { validateStoryState } from '$lib/core/story-state/storyStateValidation';
import type {
	ModuleIssue,
	ModuleRunContext,
	ModuleRunResult,
	StoryModule
} from '$lib/story-modules/types';
import { createFixtureProvenance } from '$lib/story-modules/types';

export type ModuleRunnerContext<TInput> = Omit<ModuleRunContext<TInput>, 'input'> & {
	input: unknown;
};

export class ModuleRunner {
	async run<TInput, TOutput>(
		module: StoryModule<TInput, TOutput>,
		context: ModuleRunnerContext<TInput>
	): Promise<ModuleRunResult<TOutput>> {
		const startedAt = performance.now();
		const stateValidation = validateStoryState(context.storyState);

		if (!stateValidation.success) {
			return this.failed(module, context, startedAt, [
				{
					code: 'MISSING_STORY_STATE',
					field: 'storyState',
					message: stateValidation.issues.join('; '),
					severity: 'error'
				}
			]);
		}

		const missing = module.requiredState.filter(
			(requirement) => !hasStoryStateValue(stateValidation.data, requirement)
		);

		if (missing.length > 0) {
			return this.failed(module, context, startedAt, [
				{
					code: 'MISSING_STORY_STATE',
					field: missing.join(', '),
					message: `Missing story state required by ${module.id}: ${missing.join(', ')}.`,
					severity: 'error'
				}
			]);
		}

		const parsedInput = module.inputSchema.safeParse(context.input);

		if (!parsedInput.success) {
			return this.failed(
				module,
				context,
				startedAt,
				parsedInput.error.issues.map((issue) => ({
					code: 'INVALID_INPUT',
					field: issue.path.join('.'),
					message: issue.message,
					severity: 'error'
				}))
			);
		}

		try {
			const result = await module.run({
				...context,
				input: parsedInput.data,
				storyState: stateValidation.data
			});

			if (result.status !== 'failed') {
				const parsedOutput = module.outputSchema.safeParse(result.output);

				if (!parsedOutput.success) {
					return this.failed(
						module,
						context,
						startedAt,
						parsedOutput.error.issues.map((issue) => ({
							code: 'SCHEMA_VALIDATION_FAILED',
							field: issue.path.join('.'),
							message: issue.message,
							severity: 'error'
						}))
					);
				}

				return {
					...result,
					output: parsedOutput.data,
					issues: result.issues,
					trackingEvents: result.trackingEvents
				};
			}

			return result;
		} catch (error) {
			return this.failed(module, context, startedAt, [
				{
					code: 'UNEXPECTED_EXCEPTION',
					message: error instanceof Error ? error.message : 'Module execution failed unexpectedly.',
					severity: 'error'
				}
			]);
		}
	}

	private failed<TInput, TOutput>(
		module: StoryModule<TInput, TOutput>,
		context: ModuleRunnerContext<TInput>,
		startedAt: number,
		issues: ModuleIssue[]
	): ModuleRunResult<TOutput> {
		return {
			status: 'failed',
			summary: `${module.label} did not produce accepted output.`,
			issues,
			provenance: createFixtureProvenance(
				module,
				{
					contestBrief: context.contestBrief,
					mode: context.mode,
					now: context.now
				},
				Math.max(0, Math.round(performance.now() - startedAt))
			),
			trackingEvents: [
				{
					type: 'quality-rejection',
					moduleId: module.id,
					subjectId: module.id,
					summary: issues.map((issue) => issue.message).join('; ')
				}
			]
		};
	}
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
