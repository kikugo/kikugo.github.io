// Public client config. No secrets here.
export const WORKER_URL = 'https://REPLACE_WITH_WORKER_URL/token';
export const MODEL = 'gemini-3.1-flash-live-preview';
export const SDK_URL = 'https://esm.run/@google/genai@1.29.0';

// Client-side guardrails (server token also enforces its own limits).
export const MAX_SESSION_MS = 4 * 60 * 1000; // hard stop after 4 min

// Audio
export const INPUT_SAMPLE_RATE = 16000;
export const OUTPUT_SAMPLE_RATE = 24000;
