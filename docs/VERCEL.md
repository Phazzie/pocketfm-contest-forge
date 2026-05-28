<!-- Created: 2026-05-28 03:28 -->

# Vercel Deployment

This repo deploys as a SvelteKit app on Vercel with explicit adapter support.

## Runtime

- Adapter: `@sveltejs/adapter-vercel`
- Function runtime: `nodejs22.x`
- Node version: `.nvmrc` and `package.json` both require Node 22
- Install command: `npm ci`
- Build command: `npm run build`

Do not commit `.vercel/`; project linking belongs to the local machine or Vercel Git integration.

Deployment currently needs one of:

- an authenticated local Vercel CLI session from `vercel login`;
- a `VERCEL_TOKEN` passed to the CLI;
- Git integration configured from the Vercel dashboard.

## Environment

Current fixture-demo mode requires no secrets. Live AI work must keep secrets server-side only.

Planned production variables:

- `XAI_API_KEY`
- `STORY_AI_PROVIDER=xai`
- `STORY_AI_MODEL=grok-4.20-multi-agent`
- `STORY_AI_REASONING_EFFORT=medium`
- `STORY_AI_ACCESS_CODE`

Do not expose provider credentials through `PUBLIC_` variables.

## Verification

Before merging deployment changes:

1. Run `npm run verify`.
2. Run `npm run build`.
3. Run `VERIFY_UI_SERVER_SCRIPT=preview npm run verify:ui`.
4. Confirm the Vercel preview deployment loads the app.

CI runs the same production-preview UI smoke after `npm run verify` so deployment regressions are caught
before merge.
