// Public client config. No secrets here.
// On localhost the page talks to `npm run dev` in worker/ (wrangler dev on
// :8787), because the deployed worker only accepts the production origin.
const LOCAL = ['localhost', '127.0.0.1'].includes(globalThis.location?.hostname);
export const WORKER_URL = LOCAL
  ? 'http://localhost:8787/token'
  : 'https://portfolio-token-worker.karthikchangal39.workers.dev/token';
export const MODEL = 'gemini-3.1-flash-live-preview';
export const SDK_URL = 'https://esm.run/@google/genai@1.29.0';

// Client-side guardrails (server token also enforces its own limits).
export const MAX_SESSION_MS = 4 * 60 * 1000; // hard stop after 4 min (the token expires at 5)

// Audio
export const INPUT_SAMPLE_RATE = 16000;
export const OUTPUT_SAMPLE_RATE = 24000;
