// Created: 2026-05-27 14:08

import { chmod, copyFile, mkdir, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const appRoot = process.cwd();
const gitRoot = git(['rev-parse', '--show-toplevel']).trim();
const hookSourceDir = path.join(appRoot, '.githooks');
const hookTargetDir = path.join(gitRoot, '.git', 'hooks');
const hookFiles = await readdir(hookSourceDir);

await mkdir(hookTargetDir, { recursive: true });

for (const hookFile of hookFiles) {
	const source = path.join(hookSourceDir, hookFile);
	const target = path.join(hookTargetDir, hookFile);

	await copyFile(source, target);
	await chmod(target, 0o755);
	console.log(`Installed ${hookFile} -> ${path.relative(gitRoot, target)}`);
}

function git(args) {
	const result = spawnSync('git', args, { cwd: appRoot, encoding: 'utf8' });

	if (result.status !== 0) {
		throw new Error(result.stderr || `git ${args.join(' ')} failed`);
	}

	return result.stdout;
}
