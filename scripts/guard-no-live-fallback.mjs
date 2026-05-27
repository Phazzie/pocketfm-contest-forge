// Created: 2026-05-27 14:08

import { readFile } from 'node:fs/promises';
import path from 'node:path';

const appRoot = process.cwd();
const registryPath = path.join(appRoot, 'src', 'lib', 'story-modules', 'registry.ts');
const modulesRoot = path.join(appRoot, 'src', 'lib', 'story-modules', 'modules');
const useCasePath = path.join(appRoot, 'src', 'lib', 'application', 'forgeContestStory.ts');
const registrySource = await readFile(registryPath, 'utf8');
const moduleIds = [
	...new Set(
		[...registrySource.matchAll(/story-modules\/modules\/([^/]+)\/module/g)].map(
			(match) => match[1]
		)
	)
];
const issues = [];

for (const moduleId of moduleIds) {
	const moduleSource = await readFile(path.join(modulesRoot, moduleId, 'module.ts'), 'utf8');
	const liveIndex = moduleSource.indexOf("context.mode === 'live'");

	if (liveIndex === -1) {
		issues.push(`${moduleId}: module has no explicit live-mode branch.`);
		continue;
	}

	const liveSegment = extractBlock(moduleSource, liveIndex);

	if (!liveSegment.includes("status: 'failed'")) {
		issues.push(`${moduleId}: live-mode branch must fail closed.`);
	}

	if (!liveSegment.includes('PROVIDER_UNAVAILABLE')) {
		issues.push(`${moduleId}: live-mode branch must report provider unavailability.`);
	}

	if (!liveSegment.includes('quality-rejection')) {
		issues.push(`${moduleId}: live-mode failure should emit a quality-rejection event.`);
	}

	if (liveSegment.includes('FixtureOutput') || liveSegment.includes("status: 'success'")) {
		issues.push(`${moduleId}: live-mode branch appears to return fixture or success output.`);
	}
}

const useCaseSource = await readFile(useCasePath, 'utf8');

if (
	!useCaseSource.includes("mode === 'live'") ||
	!useCaseSource.includes('AI_PROVIDER_UNAVAILABLE')
) {
	issues.push('Forge use case must fail closed for live mode until a provider adapter exists.');
}

if (issues.length > 0) {
	console.error('No-live-fallback guard failed:');
	for (const issue of issues) {
		console.error(`- ${issue}`);
	}
	process.exit(1);
}

console.log(`No-live-fallback guard passed for ${moduleIds.length} registered modules.`);

function extractBlock(source, startIndex) {
	const openIndex = source.indexOf('{', startIndex);
	let depth = 0;

	for (let index = openIndex; index < source.length; index += 1) {
		const character = source[index];

		if (character === '{') depth += 1;
		if (character === '}') depth -= 1;
		if (depth === 0) return source.slice(openIndex, index + 1);
	}

	return source.slice(startIndex);
}
