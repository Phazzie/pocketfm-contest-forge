// Created: 2026-05-26 14:50

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const args = parseArgs(process.argv.slice(2));
const id = required(args.id, '--id');
const category = args.category ?? 'strategy';
const root = path.resolve(args.root ?? process.cwd());
const allowedCategories = new Set([
	'acquisition',
	'retention',
	'continuity',
	'trope',
	'archetype',
	'voice',
	'strategy'
]);

if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(id)) {
	throw new Error('--id must be kebab-case, for example villain-protagonist-engine.');
}

if (!allowedCategories.has(category)) {
	throw new Error(`--category must be one of: ${[...allowedCategories].join(', ')}.`);
}

const targetDir = path.join(root, 'src', 'lib', 'story-modules', 'modules', id);
const names = deriveNames(id);

await mkdir(targetDir, { recursive: true });

await Promise.all(
	Object.entries(createFiles(id, category, names)).map(([filename, contents]) =>
		writeFile(path.join(targetDir, filename), contents, { flag: 'wx' })
	)
);

console.log(`Created story module scaffold at ${path.relative(process.cwd(), targetDir)}`);

function parseArgs(values) {
	const parsed = {};

	for (let index = 0; index < values.length; index += 1) {
		const value = values[index];

		if (!value.startsWith('--')) continue;

		const key = value.slice(2);
		const next = values[index + 1];

		if (!next || next.startsWith('--')) {
			parsed[key] = 'true';
			continue;
		}

		parsed[key] = next;
		index += 1;
	}

	return parsed;
}

function required(value, name) {
	if (!value) {
		throw new Error(`${name} is required.`);
	}

	return value;
}

function deriveNames(id) {
	const parts = id.split('-');
	const pascal = parts.map((part) => part[0].toUpperCase() + part.slice(1)).join('');
	const camel = pascal[0].toLowerCase() + pascal.slice(1);
	const screaming = parts.map((part) => part.toUpperCase()).join('_');

	return { pascal, camel, screaming };
}

function createFiles(id, category, names) {
	return {
		'contract.ts': `// Created: 2026-05-26 14:50

import { z } from 'zod';

export const ${names.camel}InputSchema = z.object({
\tseedPremise: z.string().min(1)
});

export const ${names.camel}OutputSchema = z.object({
\tsummary: z.string().min(1)
});

export type ${names.pascal}Input = z.infer<typeof ${names.camel}InputSchema>;
export type ${names.pascal}Output = z.infer<typeof ${names.camel}OutputSchema>;
`,
		'prompts.ts': `// Created: 2026-05-26 14:50

export const ${names.screaming}_PROMPT_VERSION = '${id}.v1';

export const ${names.camel}Prompt = {
\tsystem: 'Define the module-specific story task here.',
\tuser: 'Return output that satisfies the module runtime schema and prose quality gates.'
};
`,
		'fixtures.ts': `// Created: 2026-05-26 14:50

import type { ${names.pascal}Input, ${names.pascal}Output } from './contract';

export const ${names.camel}FixtureInput: ${names.pascal}Input = {
\tseedPremise: 'Replace with a specific serial premise before shipping this module.'
};

export const ${names.camel}FixtureOutput: ${names.pascal}Output = {
\tsummary: 'Replace with a useful fixture output before shipping this module.'
};
`,
		'module.ts': `// Created: 2026-05-26 14:50

import {
\t${names.camel}InputSchema,
\t${names.camel}OutputSchema,
\ttype ${names.pascal}Input,
\ttype ${names.pascal}Output
} from './contract';
import { ${names.camel}FixtureOutput } from './fixtures';
import { ${names.screaming}_PROMPT_VERSION } from './prompts';
import type { StoryModule } from '$lib/story-modules/types';
import { createFixtureProvenance, moduleCompletedEvent } from '$lib/story-modules/types';

export const ${names.camel}Module: StoryModule<${names.pascal}Input, ${names.pascal}Output> = {
\tid: '${id}',
\tversion: '0.1.0',
\tlabel: '${names.pascal}',
\tcategory: '${category}',
\tinputSchema: ${names.camel}InputSchema,
\toutputSchema: ${names.camel}OutputSchema,
\trequiredState: ['contestBrief'],
\tpromptVersion: ${names.screaming}_PROMPT_VERSION,
\tqualityGates: ['genre-promise'],
\tasync run(context) {
\t\tif (context.mode === 'live') {
\t\t\treturn {
\t\t\t\tstatus: 'failed',
\t\t\t\tsummary: '${names.pascal} requires a live AI provider before production generation.',
\t\t\t\tissues: [
\t\t\t\t\t{
\t\t\t\t\t\tcode: 'PROVIDER_UNAVAILABLE',
\t\t\t\t\t\tmessage: 'No live AI adapter is wired for ${names.pascal}.',
\t\t\t\t\t\tseverity: 'error'
\t\t\t\t\t}
\t\t\t\t],
\t\t\t\tprovenance: createFixtureProvenance(${names.camel}Module, context),
\t\t\t\ttrackingEvents: [
\t\t\t\t\t{
\t\t\t\t\t\ttype: 'quality-rejection',
\t\t\t\t\t\tmoduleId: '${id}',
\t\t\t\t\t\tsubjectId: '${id}',
\t\t\t\t\t\tsummary: 'Failed closed instead of substituting fixture output in live mode.'
\t\t\t\t\t}
\t\t\t\t]
\t\t\t};
\t\t}

\t\treturn {
\t\t\tstatus: 'success',
\t\t\toutput: ${names.camel}FixtureOutput,
\t\t\tsummary: ${names.camel}FixtureOutput.summary,
\t\t\tissues: [],
\t\t\tprovenance: createFixtureProvenance(${names.camel}Module, context),
\t\t\ttrackingEvents: [moduleCompletedEvent('${id}', '${names.pascal} fixture output accepted.')]
\t\t};
\t}
};
`,
		'module.spec.ts': `// Created: 2026-05-26 14:50

import { describe, expect, it } from 'vitest';
import { ${names.camel}FixtureInput } from './fixtures';
import { ${names.camel}Module } from './module';

describe('${id} module scaffold', () => {
\tit('has a valid smoke-testable contract', () => {
\t\texpect(${names.camel}Module.inputSchema.safeParse(${names.camel}FixtureInput).success).toBe(true);
\t\texpect(${names.camel}Module.id).toBe('${id}');
\t\texpect(${names.camel}Module.promptVersion).toBe('${id}.v1');
\t});
});
`,
		'README.md': `<!-- Created: 2026-05-26 14:50 -->

# ${names.pascal}

Scaffolded story module. Replace the placeholder contract, prompts, fixtures, quality gates, and tests before registering it.

Registration TODO:

- import \`${names.camel}Module\` in \`src/lib/story-modules/registry.ts\`;
- add it to \`defaultStoryModules\`;
- update docs and tracking when the module becomes product behavior.
`
	};
}
