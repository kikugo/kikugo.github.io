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

The browser never holds the API key. When the widget opens, it asks the Worker for a token, and the Worker mints a short-lived one (`gemini-3.1-flash-live-preview`) with the session's system instruction and tools baked into the token itself, since the Live API applies the token's locked config and ignores anything the client sends separately. The Worker also checks the request's origin and applies a KV-backed rate limit, per IP and globally, before it hands a token back. The widget then opens a Gemini Live session directly with that token. An earlier version shipped the API key straight to the browser; that design was abandoned because it left the key exposed to anyone who opened dev tools.

## Running it locally

The site is static: open `index.html` in a browser.

The Worker has its own `package.json`. From `worker/`:

```bash
npm test
```

runs the Vitest suite (`worker/test/`). `npm run dev` runs it locally with `wrangler dev`.
