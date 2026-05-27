// Created: 2026-05-27 14:53

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const lintTargets = ['src', 'scripts', 'eslint.config.js', 'svelte.config.js', 'vite.config.ts'];

runLocalBin('prettier', ['--check', '.']);
runLocalBin('eslint', lintTargets, {
	NODE_DISABLE_COMPILE_CACHE: '1'
});

function runLocalBin(command, args, env = {}) {
	const executable = path.join(
		process.cwd(),
		'node_modules',
		'.bin',
		process.platform === 'win32' ? `${command}.cmd` : command
	);

	const child = spawnSync(executable, args, {
		cwd: process.cwd(),
		env: {
			...process.env,
			...env
		},
		stdio: ['ignore', 'inherit', 'inherit']
	});

	if (child.error) {
		throw child.error;
	}

	if (child.status !== 0) {
		process.exit(child.status ?? 1);
	}
}
