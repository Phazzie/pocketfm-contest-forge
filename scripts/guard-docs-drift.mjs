// Created: 2026-05-27 14:08

import { spawnSync } from 'node:child_process';
import path from 'node:path';

const staged = process.argv.includes('--staged');
const appRoot = process.cwd();
const gitRoot = git(['rev-parse', '--show-toplevel']).trim();
const appPrefix = `${path.relative(gitRoot, appRoot).replaceAll(path.sep, '/')}/`;
const changed = staged
	? git(['diff', '--cached', '--name-only']).split('\n').filter(Boolean)
	: parseStatus(git(['status', '--porcelain=v1', '-z']));
const appPaths = changed
	.map((filePath) => normalizeAppPath(filePath))
	.filter((filePath) => filePath && !filePath.startsWith('node_modules/'));
const docsChanged = new Set(appPaths.filter((filePath) => filePath.startsWith('docs/')));
const codePaths = appPaths.filter((filePath) => /^src\/|^scripts\//.test(filePath));
const storyModuleChanged = codePaths.some((filePath) =>
	filePath.startsWith('src/lib/story-modules/')
);
const storyStateChanged = codePaths.some((filePath) =>
	filePath.startsWith('src/lib/core/story-state/')
);
const aiChanged = codePaths.some(
	(filePath) =>
		filePath.startsWith('src/lib/adapters/ai/') ||
		filePath.startsWith('src/lib/application/') ||
		filePath.startsWith('src/lib/core/ports/')
);
const uiChanged = codePaths.some((filePath) => filePath.startsWith('src/routes/'));
const issues = [];

if (codePaths.length > 0 && !docsChanged.has('docs/CHANGELOG.md')) {
	issues.push('Code changed without docs/CHANGELOG.md.');
}

if ((storyModuleChanged || aiChanged) && !docsChanged.has('docs/AI_ORCHESTRATION.md')) {
	issues.push('Story module or AI boundary changed without docs/AI_ORCHESTRATION.md.');
}

if (
	(storyModuleChanged || storyStateChanged || uiChanged) &&
	!docsChanged.has('docs/TRACKING.md')
) {
	issues.push('Story/state/UI behavior changed without docs/TRACKING.md.');
}

if (issues.length > 0) {
	console.error('Docs drift guard failed:');
	for (const issue of issues) {
		console.error(`- ${issue}`);
	}
	console.error('Update the relevant docs or rerun with a narrower staged set.');
	process.exit(1);
}

console.log(
	`Docs drift guard passed for ${codePaths.length} changed app code/script files${staged ? ' (staged)' : ''}.`
);

function git(args) {
	const result = spawnSync('git', args, { cwd: appRoot, encoding: 'utf8' });

	if (result.status !== 0) {
		throw new Error(result.stderr || `git ${args.join(' ')} failed`);
	}

	return result.stdout;
}

function normalizeAppPath(filePath) {
	const normalized = filePath.replaceAll(path.sep, '/');

	if (gitRoot === appRoot) return normalized;
	if (normalized === appPrefix.slice(0, -1)) return '';
	if (normalized.startsWith(appPrefix)) return normalized.slice(appPrefix.length);
	if (!normalized.includes('/')) return normalized;
	return '';
}

function parseStatus(raw) {
	const entries = raw.split('\0').filter(Boolean);
	const paths = [];

	for (let index = 0; index < entries.length; index += 1) {
		const entry = entries[index];
		const statusCode = entry.slice(0, 2);
		const filePath = entry.slice(3);

		paths.push(filePath);

		if (statusCode.includes('R') || statusCode.includes('C')) {
			index += 1;
		}
	}

	return paths;
}
