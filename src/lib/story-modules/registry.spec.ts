// Created: 2026-05-26 13:55

import { describe, expect, it } from 'vitest';
import {
	createStoryModuleRegistry,
	defaultStoryModuleRegistry,
	defaultStoryModules
} from '$lib/story-modules/registry';

describe('story module registry', () => {
	it('can find each initial story module', () => {
		const ids = defaultStoryModuleRegistry.list().map((module) => module.id);

		expect(ids).toEqual([
			'cold-open-lab',
			'cliffhanger-futures',
			'binge-debt-ledger',
			'trope-mutation-lab'
		]);
		expect(defaultStoryModuleRegistry.get('cold-open-lab').label).toBe('Cold Open Lab');
		expect(defaultStoryModuleRegistry.find('missing-module')).toBeUndefined();
	});

	it('rejects duplicate module ids', () => {
		const firstModule = defaultStoryModules[0];

		if (!firstModule) {
			throw new Error('Expected default story modules to include at least one module.');
		}

		expect(() => createStoryModuleRegistry([firstModule, firstModule])).toThrow(
			'Duplicate story module id: cold-open-lab'
		);
	});
});
