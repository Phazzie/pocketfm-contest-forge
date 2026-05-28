// Created: 2026-05-28 06:04

import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const liveSmokeUrl = optionValue('--url') ?? process.env.LIVE_AI_SMOKE_URL ?? '';
const repo = process.env.GITHUB_REPOSITORY ?? detectGitHubRepository();
const checks = [
	checkGitMainClean,
	checkLatestMainCi,
	checkOpenPullRequests,
	checkLiveSmokeWorkflow,
	checkLiveSmokeSecret,
	checkVercelLinkOrToken,
	checkLiveSmokeUrl,
	checkLiveSmokeScript
].map((check) => check());
const failed = checks.filter((result) => result.status === 'fail');

console.log('Deployment readiness audit');
console.log(`Repository: ${repo}`);
console.log('');

for (const result of checks) {
	console.log(`${statusLabel(result.status)} ${result.label}`);
	console.log(`   ${result.detail}`);
}

console.log('');

if (failed.length > 0) {
	console.error(`Deployment readiness failed: ${failed.length} required item(s) are not proven.`);
	process.exit(1);
}

console.log('Deployment readiness passed.');

function checkGitMainClean() {
	return check('Git worktree is clean on main', () => {
		const branch = command('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
		const status = command('git', ['status', '--porcelain=v1']).trim();

		if (branch !== 'main') {
			return fail(`Current branch is ${branch}; deploy proof should run from main.`);
		}

		if (status) {
			return fail('Worktree has uncommitted changes.');
		}

		return pass('Current branch is main and the worktree is clean.');
	});
}

function checkLatestMainCi() {
	return check('Latest main CI completed successfully', () => {
		const runs = parseJson(
			command('gh', [
				'run',
				'list',
				'--repo',
				repo,
				'--branch',
				'main',
				'--limit',
				'1',
				'--json',
				'databaseId,headSha,status,conclusion,workflowName,displayTitle,url'
			])
		);
		const latest = Array.isArray(runs) ? runs[0] : undefined;

		if (!latest) return fail('No main CI run was found.');
		if (latest.status !== 'completed' || latest.conclusion !== 'success') {
			return fail(
				`Latest main run is ${latest.status}/${latest.conclusion || 'no conclusion'}: ${latest.url}`
			);
		}

		return pass(
			`Latest main ${latest.workflowName} run passed for ${latest.headSha}: ${latest.url}`
		);
	});
}

function checkOpenPullRequests() {
	return check('No open pull requests remain', () => {
		const prs = parseJson(
			command('gh', ['pr', 'list', '--repo', repo, '--state', 'open', '--json', 'number,title,url'])
		);

		if (!Array.isArray(prs)) return fail('Could not parse open pull request list.');
		if (prs.length > 0) {
			const summary = prs.map((pr) => `#${pr.number} ${pr.title}`).join('; ');
			return fail(`Open pull requests remain: ${summary}.`);
		}

		return pass('No open pull requests found.');
	});
}

function checkLiveSmokeWorkflow() {
	return check('Live AI Smoke workflow is active', () => {
		const workflowList = command('gh', ['workflow', 'list', '--repo', repo]);
		const liveSmokeLine = workflowList
			.split('\n')
			.find((line) => line.startsWith('Live AI Smoke\t'));

		if (!liveSmokeLine) return fail('Live AI Smoke workflow is not visible to GitHub.');
		if (!/\tactive\t/.test(liveSmokeLine)) {
			return fail(`Live AI Smoke workflow is not active: ${liveSmokeLine}`);
		}

		return pass('Live AI Smoke workflow is active.');
	});
}

function checkLiveSmokeSecret() {
	return check('GitHub live smoke access-code secret exists', () => {
		const secrets = command('gh', ['secret', 'list', '--repo', repo]);
		const hasSecret = secrets
			.split('\n')
			.some((line) => line.split(/\s+/)[0] === 'LIVE_AI_SMOKE_ACCESS_CODE');

		if (!hasSecret) {
			return fail('Missing repository secret LIVE_AI_SMOKE_ACCESS_CODE.');
		}

		return pass('Repository secret LIVE_AI_SMOKE_ACCESS_CODE is configured.');
	});
}

function checkVercelLinkOrToken() {
	return check('Vercel project linkage or deploy token is available', () => {
		if (existsSync('.vercel/project.json')) {
			const project = parseJson(readFileSync('.vercel/project.json', 'utf8'));
			const projectId = typeof project.projectId === 'string' ? project.projectId : '';
			const orgId = typeof project.orgId === 'string' ? project.orgId : '';

			if (projectId && orgId) return pass(`Local Vercel project link found: ${projectId}.`);
			return fail('.vercel/project.json exists but is missing projectId or orgId.');
		}

		if (process.env.VERCEL_TOKEN?.trim()) {
			return pass('VERCEL_TOKEN is present for CLI/API deployment.');
		}

		if (process.env.VERCEL_PROJECT_ID?.trim() && process.env.VERCEL_ORG_ID?.trim()) {
			return pass('VERCEL_PROJECT_ID and VERCEL_ORG_ID are present.');
		}

		return fail(
			'No local .vercel/project.json, VERCEL_TOKEN, or VERCEL_PROJECT_ID/VERCEL_ORG_ID pair is available.'
		);
	});
}

function checkLiveSmokeUrl() {
	return check('Deployed HTTPS URL is supplied for live smoke', () => {
		if (!liveSmokeUrl.trim()) {
			return fail('Set LIVE_AI_SMOKE_URL or pass --url https://your-app.vercel.app.');
		}

		let parsed;
		try {
			parsed = new URL(liveSmokeUrl);
		} catch {
			return fail(`LIVE_AI_SMOKE_URL is not a valid URL: ${liveSmokeUrl}`);
		}

		if (parsed.protocol !== 'https:') {
			return fail(`Live deployment URL must use https, received ${parsed.protocol}.`);
		}

		return pass(`Live smoke URL is ${parsed.href}.`);
	});
}

function checkLiveSmokeScript() {
	return check('Local live smoke command is available', () => {
		const packageJson = parseJson(readFileSync('package.json', 'utf8'));
		const script = packageJson.scripts?.['ai:smoke'];

		if (script !== 'node scripts/live-ai-smoke.mjs') {
			return fail('package.json script ai:smoke is missing or unexpected.');
		}

		if (!existsSync('scripts/live-ai-smoke.mjs')) {
			return fail('scripts/live-ai-smoke.mjs is missing.');
		}

		return pass('npm run ai:smoke is available.');
	});
}

function check(label, run) {
	try {
		return { label, ...run() };
	} catch (error) {
		return failForLabel(label, errorMessage(error));
	}
}

function pass(detail) {
	return { status: 'pass', detail };
}

function fail(detail) {
	return { status: 'fail', detail };
}

function failForLabel(label, detail) {
	return { label, status: 'fail', detail };
}

function statusLabel(status) {
	return status === 'pass' ? 'PASS' : 'FAIL';
}

function optionValue(name) {
	const inline = process.argv.find((value) => value.startsWith(`${name}=`));
	if (inline) return inline.slice(name.length + 1);

	const index = process.argv.indexOf(name);
	if (index >= 0) return process.argv[index + 1];

	return undefined;
}

function detectGitHubRepository() {
	const remoteUrl = command('git', ['remote', 'get-url', 'origin']);
	const match = remoteUrl.match(/github\.com[:/](?<owner>[^/]+)\/(?<name>[^/.]+)(?:\.git)?$/);

	if (!match?.groups) {
		throw new Error(`Could not infer GitHub repository from origin remote: ${remoteUrl}`);
	}

	return `${match.groups.owner}/${match.groups.name}`;
}

function command(name, args) {
	const result = spawnSync(name, args, { cwd: process.cwd(), encoding: 'utf8' });

	if (result.status !== 0) {
		throw new Error(
			result.stderr.trim() || result.stdout.trim() || `${name} ${args.join(' ')} failed`
		);
	}

	return result.stdout.trim();
}

function parseJson(value) {
	try {
		return JSON.parse(value);
	} catch (error) {
		throw new Error(`Could not parse JSON: ${errorMessage(error)}`, { cause: error });
	}
}

function errorMessage(error) {
	return error instanceof Error ? error.message : String(error);
}
