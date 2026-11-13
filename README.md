# kikugo.github.io

Source for my personal site. Static HTML, with a voice assistant that answers questions about my work and scrolls the page to whatever it is talking about.

## What is in it

| Path | What it is |
| --- | --- |
| `index.html` | The site itself. |
| `assistant/` | The voice concierge widget: audio capture, playback, and the Gemini Live session logic. |
| `worker/` | A Cloudflare Worker that mints short-lived Gemini tokens so the browser never holds the API key. |
| `images/` | Site images. |
| `archive/` | Older material kept for reference. |

## How the voice concierge works

The browser never holds the API key. When the widget opens, it asks the Worker for a token, and the Worker mints a single-use one (`gemini-3.1-flash-live-preview`) that expires after 5 minutes, which also ends the voice session. The system instruction and tools are pinned in the Worker and baked into the token, since the Live API applies the token's locked config and ignores anything the client sends; the Worker ignores the request body, so nobody can mint a token with their own prompt. The prompt text comes from `assistant/knowledge.js` and `assistant/tools.js`, which wrangler bundles into the Worker, so editing them needs a Worker redeploy. The Worker also checks the request's origin (production allows only `https://kikugo.github.io`) and applies a daily rate limit of 10 tokens per IP and 100 overall, counted atomically in a Durable Object. The widget then opens a Gemini Live session directly with that token. An earlier version shipped the API key straight to the browser; that design was abandoned because it left the key exposed to anyone who opened dev tools.

## Running it locally

The site is static: open `index.html` in a browser.

The Worker has its own `package.json`. From `worker/`:

```bash
npm test
```

runs the Vitest suite (`worker/test/`). `npm run dev` runs it locally with `wrangler dev --env dev` on port 8787, where localhost origins are allowed; put a `GEMINI_API_KEY=...` line in `worker/.dev.vars` (gitignored) first. Serve the site on port 8000 (`python3 -m http.server 8000` from the repo root) and the widget on localhost talks to the local Worker instead of the deployed one. `npm run deploy` deploys the production config.
