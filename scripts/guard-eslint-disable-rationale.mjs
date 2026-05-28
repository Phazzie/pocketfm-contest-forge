// Created: 2026-05-28 01:09

import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const trackedFiles = git(['ls-files'])
	.split('\n')
	.filter((filePath) => /^(src|scripts)\/|^(eslint|svelte|vite)\.config\./.test(filePath))
	.filter(Boolean);
const issues = [];

for (const filePath of trackedFiles) {
	const source = await readFile(filePath, 'utf8');
	const lines = source.split('\n');

	lines.forEach((line, index) => {
		const trimmed = line.trim();

		if (!trimmed.startsWith('//') && !trimmed.startsWith('/*') && !trimmed.startsWith('*')) {
			return;
		}

		if (!trimmed.includes('eslint-disable')) return;
		if (line.includes(' -- ') && line.split(' -- ')[1]?.trim()) return;

		issues.push(
			`${filePath}:${index + 1}: eslint-disable comments require a rationale after " -- ".`
		);
	});
}

if (issues.length > 0) {
	console.error('ESLint disable rationale guard failed:');
	for (const issue of issues) {
		console.error(`- ${issue}`);
	}
	process.exit(1);
}

console.log(`ESLint disable rationale guard passed for ${trackedFiles.length} tracked files.`);

function git(args) {
	const result = spawnSync('git', args, { cwd: process.cwd(), encoding: 'utf8' });

	if (result.status !== 0) {
		throw new Error(result.stderr || `git ${args.join(' ')} failed`);
	}

	return result.stdout;
}
