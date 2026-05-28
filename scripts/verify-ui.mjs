// Created: 2026-05-27 14:08

import { spawn } from 'node:child_process';
import { createServer } from 'node:net';

const host = '127.0.0.1';
const port = await findOpenPort(Number(process.env.VERIFY_UI_PORT ?? 5173));
const timeoutMs = Number(process.env.VERIFY_UI_TIMEOUT_MS ?? 180_000);
const url = `http://${host}:${port}/`;
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const devServer = spawn(
	npmCommand,
	['run', 'dev', '--', '--host', host, '--port', String(port), '--strictPort'],
	{
		stdio: ['ignore', 'pipe', 'pipe'],
		env: process.env
	}
);

devServer.stdout.on('data', (chunk) => process.stdout.write(chunk));
devServer.stderr.on('data', (chunk) => process.stderr.write(chunk));

try {
	await waitForHttp(url, timeoutMs, devServer);
	await run(npmCommand, ['run', 'test:browser'], {
		env: { ...process.env, BROWSER_SMOKE_URL: url }
	});
	console.log(`UI verification passed at ${url}`);
} finally {
	devServer.kill('SIGTERM');
}

function findOpenPort(startPort) {
	return new Promise((resolve, reject) => {
		const server = createServer();

		server.once('error', (error) => {
			if (error.code === 'EADDRINUSE') {
				resolve(findOpenPort(startPort + 1));
				return;
			}

			reject(error);
		});

		server.listen(startPort, host, () => {
			const address = server.address();
			const selectedPort = typeof address === 'object' && address ? address.port : startPort;
			server.close(() => resolve(selectedPort));
		});
	});
}

async function waitForHttp(targetUrl, timeoutMs, devServerProcess) {
	const startedAt = Date.now();
	let lastError;

	while (Date.now() - startedAt < timeoutMs) {
		if (devServerProcess.exitCode !== null) {
			throw new Error(`Dev server exited before ${targetUrl} became available.`);
		}

		try {
			const response = await fetch(targetUrl);
			if (response.ok) return;
		} catch (error) {
			lastError = error;
		}

		await new Promise((resolve) => setTimeout(resolve, 500));
	}

	throw new Error(
		`Timed out waiting for ${targetUrl}${lastError instanceof Error ? `: ${lastError.message}` : ''}`
	);
}

function run(command, args, options = {}) {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, {
			stdio: 'inherit',
			env: options.env ?? process.env
		});

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
