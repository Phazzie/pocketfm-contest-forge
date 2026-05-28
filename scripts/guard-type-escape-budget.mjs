// Created: 2026-05-28 01:15

import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const allowedAnyLines = new Set([
	'src/lib/story-modules/types.ts::export type AnyStoryModule = StoryModule<any, any>;'
]);
const trackedFiles = git(['ls-files'])
	.split('\n')
	.filter((filePath) => /^(src|scripts)\/|^(eslint|svelte|vite)\.config\./.test(filePath))
	.filter((filePath) => filePath !== 'scripts/guard-type-escape-budget.mjs')
	.filter(Boolean);
const issues = [];

for (const filePath of trackedFiles) {
	const source = await readFile(filePath, 'utf8');
	const lines = source.split('\n');

	lines.forEach((line, index) => {
		if (!/\bany\b/.test(line)) return;
		if (line.includes('no-explicit-any')) return;
		if (allowedAnyLines.has(`${filePath}::${line.trim()}`)) return;

		issues.push(`${filePath}:${index + 1}: explicit any is outside the approved budget.`);
	});
}

if (issues.length > 0) {
	console.error('Type escape budget guard failed:');
	for (const issue of issues) {
		console.error(`- ${issue}`);
	}
	process.exit(1);
}

console.log(`Type escape budget guard passed with ${allowedAnyLines.size} approved any line.`);

function git(args) {
	const result = spawnSync('git', args, { cwd: process.cwd(), encoding: 'utf8' });

	if (result.status !== 0) {
		throw new Error(result.stderr || `git ${args.join(' ')} failed`);
	}

	return result.stdout;
}
