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
		if (hasNoExplicitAnyDisable(line)) return;

		if (!/\bany\b/.test(codeOnly(line))) return;
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

function hasNoExplicitAnyDisable(line) {
	const directiveSearchRegex =
		/eslint-(?:disable|disable-next-line|disable-line).*(?:@typescript-eslint\/no-explicit-any|no-explicit-any)/gi;
	const directiveCommentRegex =
		/eslint-(?:disable|disable-next-line|disable-line).*(?:@typescript-eslint\/no-explicit-any|no-explicit-any)/i;
	let match;

	while ((match = directiveSearchRegex.exec(line))) {
		const comment = commentContainingIndex(line, match.index);
		if (comment && directiveCommentRegex.test(comment)) return true;
	}

	return false;
}

function commentContainingIndex(line, targetIndex) {
	const beforeTarget = line.slice(0, targetIndex);
	const lineCommentIndex = beforeTarget.lastIndexOf('//');
	const blockCommentIndex = beforeTarget.lastIndexOf('/*');
	const blockContinuationMatch = beforeTarget.match(/(^|\s)\*/);
	const commentStarts = [lineCommentIndex, blockCommentIndex].filter((start) => start >= 0);

	if (blockContinuationMatch?.index !== undefined) {
		commentStarts.push(blockContinuationMatch.index + blockContinuationMatch[1].length);
	}

	if (commentStarts.length === 0) return undefined;

	return line.slice(Math.max(...commentStarts)).trim();
}

function codeOnly(line) {
	let code = '';
	let quote;
	let escaped = false;

	for (let index = 0; index < line.length; index += 1) {
		const char = line[index];
		const nextChar = line[index + 1];

		if (quote) {
			if (escaped) {
				escaped = false;
				continue;
			}

			if (char === '\\') {
				escaped = true;
				continue;
			}

			if (char === quote) {
				quote = undefined;
			}

			continue;
		}

		if (char === '/' && nextChar === '/') break;

		if (char === '/' && nextChar === '*') {
			const commentEnd = line.indexOf('*/', index + 2);
			if (commentEnd === -1) break;
			index = commentEnd + 1;
			continue;
		}

		if (char === '"' || char === "'" || char === '`') {
			quote = char;
			continue;
		}

		code += char;
	}

	return code;
}

function git(args) {
	const result = spawnSync('git', args, { cwd: process.cwd(), encoding: 'utf8' });

	if (result.status !== 0) {
		throw new Error(result.stderr || `git ${args.join(' ')} failed`);
	}

	return result.stdout;
}
