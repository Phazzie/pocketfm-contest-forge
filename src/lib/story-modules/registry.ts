// Created: 2026-05-26 13:54

import { bingeDebtLedgerModule } from '$lib/story-modules/modules/binge-debt-ledger/module';
import { cliffhangerFuturesModule } from '$lib/story-modules/modules/cliffhanger-futures/module';
import { coldOpenLabModule } from '$lib/story-modules/modules/cold-open-lab/module';
import { councilReviewModule } from '$lib/story-modules/modules/council-review/module';
import { tropeMutationLabModule } from '$lib/story-modules/modules/trope-mutation-lab/module';
import type { AnyStoryModule, StoryModuleId } from '$lib/story-modules/types';

export class StoryModuleRegistry {
	private readonly modulesById: Map<StoryModuleId, AnyStoryModule>;

	constructor(modules: AnyStoryModule[]) {
		this.modulesById = new Map();

		for (const module of modules) {
			if (this.modulesById.has(module.id)) {
				throw new Error(`Duplicate story module id: ${module.id}`);
			}

			this.modulesById.set(module.id, module);
		}
	}

	list(): AnyStoryModule[] {
		return [...this.modulesById.values()];
	}

	find(id: StoryModuleId): AnyStoryModule | undefined {
		return this.modulesById.get(id);
	}

	get(id: StoryModuleId): AnyStoryModule {
		const module = this.find(id);

		if (!module) {
			throw new Error(`Story module not found: ${id}`);
		}

		return module;
	}
}

export function createStoryModuleRegistry(modules: AnyStoryModule[]): StoryModuleRegistry {
	return new StoryModuleRegistry(modules);
}

export const defaultStoryModules: AnyStoryModule[] = [
	coldOpenLabModule,
	cliffhangerFuturesModule,
	bingeDebtLedgerModule,
	tropeMutationLabModule,
	councilReviewModule
];

export const defaultStoryModuleRegistry = createStoryModuleRegistry(defaultStoryModules);
