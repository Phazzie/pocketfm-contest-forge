// Created: 2026-05-27 14:08

import { spawn } from 'node:child_process';
import { createServer } from 'node:net';

const host = '127.0.0.1';
const port = await findOpenPort(Number(process.env.VERIFY_UI_PORT ?? 5173));
const timeoutMs = positiveIntegerFromEnv(process.env.VERIFY_UI_TIMEOUT_MS, 180_000);
const probeTimeoutMs = positiveIntegerFromEnv(process.env.VERIFY_UI_PROBE_TIMEOUT_MS, 2_000);
const browserTimeoutMs = positiveIntegerFromEnv(process.env.VERIFY_UI_BROWSER_TIMEOUT_MS, 240_000);
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
		env: { ...process.env, BROWSER_SMOKE_URL: url },
		timeoutMs: browserTimeoutMs
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
		if (devServerProcess.exitCode !== null || devServerProcess.signalCode) {
			const reason = devServerProcess.signalCode
				? `signal ${devServerProcess.signalCode}`
				: `exit code ${devServerProcess.exitCode}`;
			throw new Error(`Dev server exited with ${reason} before ${targetUrl} became available.`);
		}

		try {
			const response = await fetchWithTimeout(targetUrl, probeTimeoutMs);
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

async function fetchWithTimeout(targetUrl, timeoutMs) {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), timeoutMs);

	try {
		return await fetch(targetUrl, { signal: controller.signal });
	} finally {
		clearTimeout(timeout);
	}
}

function run(command, args, options = {}) {
	return new Promise((resolve, reject) => {
		let settled = false;
		const child = spawn(command, args, {
			stdio: 'inherit',
			env: options.env ?? process.env,
			detached: process.platform !== 'win32'
		});
		const timeout =
			options.timeoutMs === undefined
				? undefined
				: setTimeout(() => {
						terminate(child);
						settle(
							reject,
							new Error(`${command} ${args.join(' ')} timed out after ${options.timeoutMs}ms`)
						);
					}, options.timeoutMs);

		child.on('error', (error) => settle(reject, error));
		child.on('close', (code) => {
			if (code === 0) {
				settle(resolve);
				return;
			}

			settle(reject, new Error(`${command} ${args.join(' ')} exited with ${code}`));
		});

		function settle(done, value) {
			if (settled) return;
			settled = true;
			if (timeout) clearTimeout(timeout);
			done(value);
		}
	});
}

function positiveIntegerFromEnv(value, fallback) {
	const parsed = Number.parseInt(value ?? '', 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function terminate(child) {
	if (!child.pid) return;

	if (process.platform === 'win32') {
		child.kill('SIGTERM');
		return;
	}

	try {
		process.kill(-child.pid, 'SIGTERM');
	} catch (error) {
		if (error?.code !== 'ESRCH') throw error;
	}
}
