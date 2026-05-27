// Created: 2026-05-27 14:08

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const appRoot = process.cwd();
const registryPath = path.join(appRoot, 'src', 'lib', 'story-modules', 'registry.ts');
const modulesRoot = path.join(appRoot, 'src', 'lib', 'story-modules', 'modules');
const requiredFiles = [
	'contract.ts',
	'prompts.ts',
	'fixtures.ts',
	'module.ts',
	'module.spec.ts',
	'README.md'
];
const registrySource = await readFile(registryPath, 'utf8');
const moduleIds = [
	...new Set(
		[...registrySource.matchAll(/story-modules\/modules\/([^/]+)\/module/g)].map(
			(match) => match[1]
		)
	)
];

const issues = [];

if (moduleIds.length === 0) {
	issues.push('No story modules are imported by the registry.');
}

for (const moduleId of moduleIds) {
	const moduleDir = path.join(modulesRoot, moduleId);
	const files = new Set(await safeReaddir(moduleDir));

	for (const filename of requiredFiles) {
		if (!files.has(filename)) {
			issues.push(`${moduleId}: missing ${filename}.`);
		}
	}

	const contract = await safeRead(path.join(moduleDir, 'contract.ts'));
	const prompts = await safeRead(path.join(moduleDir, 'prompts.ts'));
	const moduleSource = await safeRead(path.join(moduleDir, 'module.ts'));
	const readme = await safeRead(path.join(moduleDir, 'README.md'));

	expectIncludes(contract, "from 'zod'", `${moduleId}: contract.ts must use Zod.`);
	expectIncludes(contract, 'InputSchema', `${moduleId}: contract.ts must export an input schema.`);
	expectIncludes(
		contract,
		'OutputSchema',
		`${moduleId}: contract.ts must export an output schema.`
	);
	expectIncludes(prompts, 'PROMPT_VERSION', `${moduleId}: prompts.ts must version prompt text.`);
	expectIncludes(moduleSource, 'inputSchema:', `${moduleId}: module.ts must wire inputSchema.`);
	expectIncludes(moduleSource, 'outputSchema:', `${moduleId}: module.ts must wire outputSchema.`);
	expectIncludes(
		moduleSource,
		'requiredState:',
		`${moduleId}: module.ts must declare requiredState.`
	);
	expectIncludes(moduleSource, 'promptVersion:', `${moduleId}: module.ts must wire promptVersion.`);
	expectIncludes(
		moduleSource,
		'qualityGates:',
		`${moduleId}: module.ts must declare qualityGates.`
	);
	expectIncludes(moduleSource, 'status:', `${moduleId}: module results must include status.`);
	expectIncludes(moduleSource, 'issues:', `${moduleId}: module results must include issues.`);
	expectIncludes(
		moduleSource,
		'provenance:',
		`${moduleId}: module results must include provenance.`
	);
	expectIncludes(
		moduleSource,
		'trackingEvents:',
		`${moduleId}: module results must include tracking events.`
	);
	expectIncludes(readme, '<!-- Created:', `${moduleId}: README.md must include a created header.`);

	if (moduleSource.includes('Replace with') || contract.includes('Replace with')) {
		issues.push(`${moduleId}: registered module still contains scaffold placeholder text.`);
	}
}

if (issues.length > 0) {
	console.error('Story module shape guard failed:');
	for (const issue of issues) {
		console.error(`- ${issue}`);
	}
	process.exit(1);
}

console.log(`Story module shape guard passed for ${moduleIds.length} registered modules.`);

async function safeReaddir(directory) {
	try {
		return await readdir(directory);
	} catch {
		issues.push(`${path.relative(appRoot, directory)}: module directory is missing.`);
		return [];
	}
}

async function safeRead(filePath) {
	try {
		return await readFile(filePath, 'utf8');
	} catch {
		return '';
	}
}

function expectIncludes(source, pattern, message) {
	if (!source.includes(pattern)) {
		issues.push(message);
	}
}
