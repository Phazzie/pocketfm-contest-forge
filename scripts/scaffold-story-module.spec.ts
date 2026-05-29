// Created: 2026-05-26 14:52

import { execFile } from 'node:child_process';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const SCAFFOLD_SUBPROCESS_TIMEOUT_MS = 30_000;

describe('story module scaffold script', () => {
	it(
		'creates the expected module files in a temp directory',
		async () => {
			const root = await mkdtemp(path.join(tmpdir(), 'story-module-scaffold-'));
			const scriptPath = path.resolve('scripts/scaffold-story-module.mjs');

			try {
				await execFileAsync(process.execPath, [
					scriptPath,
					'--root',
					root,
					'--id',
					'villain-protagonist-engine',
					'--category',
					'archetype'
				]);

				const target = path.join(
					root,
					'src',
					'lib',
					'story-modules',
					'modules',
					'villain-protagonist-engine'
				);
				const files = await readdir(target);
				const moduleSource = await readFile(path.join(target, 'module.ts'), 'utf8');

				expect(files.sort()).toEqual([
					'README.md',
					'contract.ts',
					'fixtures.ts',
					'module.spec.ts',
					'module.ts',
					'prompts.ts'
				]);
				expect(moduleSource).toContain("id: 'villain-protagonist-engine'");
				expect(moduleSource).toContain("category: 'archetype'");
			} finally {
				await rm(root, { recursive: true, force: true });
			}
		},
		SCAFFOLD_SUBPROCESS_TIMEOUT_MS
	);
});
