// Created: 2026-05-26 06:16

import { spawn } from 'node:child_process';

const commands = [
	['npm', ['run', 'lint']],
	['npm', ['run', 'verify:guards']],
	['npm', ['run', 'test']],
	['npm', ['run', 'check']],
	['npm', ['run', 'build']]
];

for (const [command, args] of commands) {
	await run(command, args);
}

function run(command, args) {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, { stdio: 'inherit' });

		child.on('error', reject);
		child.on('close', (code) => {
			if (code === 0) {
				resolve();
				return;
			}

			reject(new Error(`${command} ${args.join(' ')} exited with ${code}`));
		});
	});
}
