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

Live xAI variables:

- `XAI_API_KEY`
- `STORY_AI_PROVIDER=xai`
- `STORY_AI_MODEL=grok-4.20-multi-agent`
- `STORY_AI_REASONING_EFFORT=medium`
- `STORY_AI_ACCESS_CODE`

Do not expose provider credentials through `PUBLIC_` variables.

The xAI adapter calls `https://api.x.ai/v1/responses` from server-side code and returns raw model
text plus provider diagnostics. Client components must not import provider creation helpers or read
private env values.

`STORY_AI_ACCESS_CODE` is enforced before paid provider calls. Without it, the live cold-open action
returns an unavailable state and does not call xAI. The current per-client limiter is in-memory and
intended only for MVP demo protection; it is not durable auth.

## Verification

Before merging deployment changes:

1. Run `npm run verify`.
2. Run `npm run build`.
3. Run `VERIFY_UI_SERVER_SCRIPT=preview npm run verify:ui`.
4. Confirm the Vercel preview deployment loads the app.
5. After `XAI_API_KEY` and `STORY_AI_ACCESS_CODE` are set in Vercel, run:

```sh
RUN_LIVE_AI_SMOKE=1 LIVE_AI_SMOKE_URL=https://your-preview-or-production-url.vercel.app LIVE_AI_SMOKE_ACCESS_CODE=<your-access-code> npm run ai:smoke
```

The smoke submits the server-side `runLiveColdOpen` action, expects an accepted `live-ai`
`cold-open-lab` result from provider `xai`, and fails if the action falls back to fixture output or
returns a provider/schema/prose rejection.

The same proof can be run from GitHub after adding the repository secret
`LIVE_AI_SMOKE_ACCESS_CODE`. Open the `Live AI Smoke` workflow, choose "Run workflow", and provide
the deployed Vercel URL as `live_ai_smoke_url`. The workflow does not store provider credentials; it
only submits the access code to the deployed server-side action.

CI runs the same production-preview UI smoke after `npm run verify` so deployment regressions are caught
before merge.
