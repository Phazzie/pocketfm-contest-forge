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
		const comment = eslintDisableComment(line);
		if (!comment) return;

		if (comment.includes(' -- ') && comment.split(' -- ')[1]?.trim()) return;

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

function eslintDisableComment(line) {
	let searchFrom = 0;

	while (searchFrom < line.length) {
		const disableIndex = line.indexOf('eslint-disable', searchFrom);
		if (disableIndex === -1) return undefined;

		const comment = commentContainingIndex(line, disableIndex);
		if (comment) return comment;

		searchFrom = disableIndex + 'eslint-disable'.length;
	}

	return undefined;
}

function commentContainingIndex(line, targetIndex) {
	const beforeDisable = line.slice(0, targetIndex);
	const lineCommentIndex = beforeDisable.lastIndexOf('//');
	const blockCommentIndex = beforeDisable.lastIndexOf('/*');
	const blockContinuationMatch = beforeDisable.match(/(^|\s)\*/);
	const commentStarts = [lineCommentIndex, blockCommentIndex].filter((start) => start >= 0);

	if (blockContinuationMatch?.index !== undefined) {
		commentStarts.push(blockContinuationMatch.index + blockContinuationMatch[1].length);
	}

	if (commentStarts.length === 0) return undefined;

	return line.slice(Math.max(...commentStarts)).trim();
}

function git(args) {
	const result = spawnSync('git', args, { cwd: process.cwd(), encoding: 'utf8' });

	if (result.status !== 0) {
		throw new Error(result.stderr || `git ${args.join(' ')} failed`);
	}

	return result.stdout;
}
