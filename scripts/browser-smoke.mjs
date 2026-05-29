// Created: 2026-05-26 01:45

import { chromium } from 'playwright';

const url = process.env.BROWSER_SMOKE_URL ?? 'http://127.0.0.1:5173/';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
const errors = [];

page.on('console', (message) => {
	if (message.type() === 'error') {
		errors.push(message.text());
	}
});

page.on('pageerror', (error) => {
	errors.push(error.message);
});

try {
	await page.goto(url, { waitUntil: 'domcontentloaded' });
	await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => undefined);

	const bodyLength = await page
		.locator('body')
		.innerText()
		.then((text) => text.trim().length);
	const overlay = await page
		.locator('.vite-error-overlay, #webpack-dev-server-client-overlay, [data-nextjs-dialog]')
		.count();
	const controls = await page.locator('select, input, textarea, button').count();
	const requiredText = await page.getByText('Pocket FM Contest Forge').count();
	const storyStudioAction = await page.getByText('Run Story Studio').count();

	const result = { url, bodyLength, overlay, controls, requiredText, storyStudioAction, errors };
	console.log(JSON.stringify(result, null, 2));

	if (
		bodyLength < 200 ||
		overlay > 0 ||
		controls < 10 ||
		requiredText < 1 ||
		storyStudioAction < 1 ||
		errors.length > 0
	) {
		process.exitCode = 1;
	}
} finally {
	await browser.close();
}
