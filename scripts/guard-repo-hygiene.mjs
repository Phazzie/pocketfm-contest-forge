// Created: 2026-05-27 14:08

import { spawnSync } from 'node:child_process';

const appDirName = 'pocketfm-contest-forge';
const gitRoot = runGit(['rev-parse', '--show-toplevel']).trim();
const appRoot = process.cwd();
const isStandaloneAppRepo = gitRoot === appRoot;
const status = runGit(['status', '--porcelain=v1', '-z']);
const changedPaths = parsePorcelain(status);

const disallowed = [];

for (const filePath of changedPaths) {
	if (filePath === 'node_modules/.package-lock.json') {
		disallowed.push(`${filePath}: installed-tree npm metadata must not be changed.`);
	}

	if (
		!isStandaloneAppRepo &&
		filePath === 'package-lock.json' &&
		process.env.ALLOW_ROOT_LOCKFILE_CHURN !== '1'
	) {
		disallowed.push(
			`${filePath}: root package-lock churn needs explicit intent; set ALLOW_ROOT_LOCKFILE_CHURN=1 only for deliberate root dependency work.`
		);
	}

	if (
		filePath.startsWith('.svelte-kit/') ||
		filePath.startsWith('build/') ||
		filePath.startsWith('.output/') ||
		filePath.startsWith('node_modules/') ||
		filePath.startsWith(`${appDirName}/.svelte-kit/`) ||
		filePath.startsWith(`${appDirName}/build/`) ||
		filePath.startsWith(`${appDirName}/.output/`) ||
		filePath.startsWith(`${appDirName}/node_modules/`)
	) {
		disallowed.push(`${filePath}: generated app output must not be committed.`);
	}

	if (filePath.endsWith('.DS_Store') || filePath.endsWith('Thumbs.db')) {
		disallowed.push(`${filePath}: OS metadata must not be committed.`);
	}
}

if (disallowed.length > 0) {
	console.error('Repository hygiene guard failed:');
	for (const issue of disallowed) {
		console.error(`- ${issue}`);
	}
	process.exit(1);
}

console.log(`Repository hygiene guard passed for ${gitRoot}.`);

function runGit(args) {
	const result = spawnSync('git', args, { cwd: process.cwd(), encoding: 'utf8' });

	if (result.status !== 0) {
		throw new Error(result.stderr || `git ${args.join(' ')} failed`);
	}

	return result.stdout;
}

function parsePorcelain(raw) {
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
