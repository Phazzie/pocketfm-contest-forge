// Created: 2026-05-27 14:08

import { spawnSync } from 'node:child_process';

const appPrefix = 'pocketfm-contest-forge/';
await run('npm', ['run', 'verify']);

if (changedFiles().some((filePath) => isRoutePath(filePath))) {
	await run('npm', ['run', 'verify:ui']);
}

function isRoutePath(filePath) {
	return filePath.startsWith('src/routes/') || filePath.startsWith(`${appPrefix}src/routes/`);
}

function changedFiles() {
	const upstream = spawnSync('git', ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'], {
		encoding: 'utf8'
	});

	if (upstream.status === 0) {
		return git(['diff', '--name-only', `${upstream.stdout.trim()}...HEAD`]);
	}

	const previous = spawnSync('git', ['rev-parse', '--verify', 'HEAD~1'], { encoding: 'utf8' });

	if (previous.status === 0) {
		return git(['diff', '--name-only', 'HEAD~1...HEAD']);
	}

	return [];
}

function git(args) {
	const result = spawnSync('git', args, { encoding: 'utf8' });

	if (result.status !== 0) {
		throw new Error(result.stderr || `git ${args.join(' ')} failed`);
	}

	return result.stdout.split('\n').filter(Boolean);
}

function run(command, args) {
	return new Promise((resolve, reject) => {
		const child = spawnSync(
			process.platform === 'win32' && command === 'npm' ? 'npm.cmd' : command,
			args,
			{
				stdio: 'inherit',
				cwd: process.cwd()
			}
		);

		if (child.status === 0) {
			resolve();
			return;
		}

		reject(new Error(`${command} ${args.join(' ')} exited with ${child.status}`));
	});
}
