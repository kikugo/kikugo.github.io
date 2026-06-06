# AI Voice Concierge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a self-contained AI voice concierge to the existing static portfolio that answers visitor questions by voice (Gemini Live API) while auto-scrolling/highlighting the relevant section, with a typed-text fallback.

**Architecture:** A Cloudflare Worker holds the real Gemini key and mints short-lived, model-locked ephemeral tokens. The browser widget (vanilla ESM, no build) fetches a token, connects directly to the Live API over WebSocket, streams mic audio (16 kHz PCM) up and plays 24 kHz audio back, and executes a `scrollToSection` function-calling tool. The widget is additive: if anything fails, the existing site is untouched.

**Tech Stack:** Vanilla JS ES modules + Web Audio (AudioWorklet) + `@google/genai` via `https://esm.run` (client), Cloudflare Worker + KV + `@google/genai` with `nodejs_compat` (backend). Tests: Node built-in test runner (`node --test`) for widget pure modules, vitest for the Worker.

**Conventions:**
- Model id lives in one place (`assistant/config.js` and `worker/src/config.ts`): `gemini-3.1-flash-live-preview`. Verify availability for the key/region during Task 5; swapping it is a one-line change.
- SDK pinned to `@google/genai@1.29.0` on the CDN; the smoke test (Task 8) confirms it works browser-side before the full widget is built.
- Git: stage **named files only**, never `git add .` (private files live in `update/`).
- Branch: `feat/ai-voice-concierge` (already created; the design spec is committed there).

---

## File Structure

```
portfolio/
  index.html                      # MODIFY: project-card ids, widget <link>+<script>, dock trigger
  assistant/
    package.json                  # {"type":"module"} — enables `node --test`, zero deps, harmless in browser
    config.js                     # WORKER_URL, MODEL, SDK_URL, session caps
    knowledge.js                  # MOVED from repo root (Karthik's file)
    tools.js                      # tool declarations + pure dispatcher (id->DOM id)
    audio.js                      # pure PCM encode/decode/resample helpers
    pcm-worklet.js                # AudioWorkletProcessor: mic -> Float32 frames
    player.js                     # AudioPlayer: queue/schedule 24kHz playback, flush on barge-in
    session.js                    # LiveSession: token fetch, connect, message routing, tool dispatch
    ui.js                         # ConciergeUI: DOM panel/button/captions/state
    assistant.js                  # entry: feature-detect, wire UI<->session<->audio, caps
    assistant.css                 # styles, reuse site tokens
    test/
      tools.test.js               # node --test
      audio.test.js               # node --test
  worker/                         # separate Cloudflare deploy (NOT GitHub Pages)
    package.json
    tsconfig.json
    wrangler.toml
    src/
      config.ts                   # MODEL, token lifetimes
      cors.ts                     # origin allowlist + CORS headers (pure)
      ratelimit.ts                # KV-backed mint cap (logic over an injected KV)
      token.ts                    # buildTokenConfig (pure) + mintToken (SDK call)
      index.ts                    # fetch handler wiring
    test/
      cors.test.ts                # vitest
      ratelimit.test.ts           # vitest
      token.test.ts               # vitest
      index.test.ts               # vitest
    README.md                     # deploy + secrets steps
  docs/superpowers/
    specs/2026-06-06-ai-voice-concierge-design.md   # already committed
    plans/2026-06-06-ai-voice-concierge.md          # this file
```

---

## Task 1: Add project IDs to index.html + relocate knowledge.js

**Files:**
- Modify: `index.html` (10 project cards in the `#projects` section, lines ~629-758)
- Move: `knowledge.js` → `assistant/knowledge.js`
- Create: `assistant/package.json`
- Create: `assistant/test/structure.test.js`

- [ ] **Step 1: Create `assistant/package.json`**

```json
{
  "type": "module",
  "private": true
}
```

- [ ] **Step 2: Move the knowledge file**

```bash
mkdir -p assistant/test
git mv knowledge.js assistant/knowledge.js 2>/dev/null || mv knowledge.js assistant/knowledge.js
```

(If `knowledge.js` is untracked, `git mv` fails; the `||` falls back to plain `mv`.)

- [ ] **Step 3: Add `id="proj-<id>"` to each project card in `index.html`**

Each project card opening tag in the `#projects` section gets an id matching `proj-` + the project's `id` from `assistant/knowledge.js`. The 10 ids in order: `unified-rag, nutrilive, menu-vision, cli-tower-defense, videosense, voice-agent, career-compass, strava-run-analyzer, similarity-api, go-ffmpeg`.

For a card that is a `<div ... class="project-card">`, change it to include the id, e.g.:

```html
<div id="proj-unified-rag" class="project-card">
```

For a card that is an `<a href="..." class="project-card">`, add the id likewise:

```html
<a id="proj-nutrilive" href="https://github.com/kikugo/NutriLive" target="_blank" rel="noopener noreferrer" class="project-card">
```

Map each card to its id by matching the `<h3>` title to the knowledge title:
`Unified RAG→unified-rag`, `NutriLive→nutrilive`, `Menu Vision→menu-vision`, `CLI Tower Defense→cli-tower-defense`, `VideoSense→videosense`, `Voice Agent→voice-agent`, `Career Compass→career-compass`, `Strava Run Analyzer→strava-run-analyzer`, `Similarity API→similarity-api`, `Streaming Audio Converter→go-ffmpeg`.

- [ ] **Step 4: Write the failing test** (`assistant/test/structure.test.js`)

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PROFILE, SECTION_IDS } from '../knowledge.js';

const html = readFileSync(
  fileURLToPath(new URL('../../index.html', import.meta.url)),
  'utf8'
);

test('every section id from knowledge exists in index.html', () => {
  for (const id of SECTION_IDS) {
    assert.ok(html.includes(`id="${id}"`), `missing section id="${id}"`);
  }
});

test('every project has a matching proj-<id> anchor in index.html', () => {
  assert.equal(PROFILE.projects.length, 10);
  for (const p of PROFILE.projects) {
    assert.ok(
      html.includes(`id="proj-${p.id}"`),
      `missing anchor id="proj-${p.id}" for ${p.title}`
    );
  }
});
```

- [ ] **Step 5: Run the test**

Run: `node --test assistant/test/structure.test.js`
Expected: PASS (both tests). If a project anchor is reported missing, fix that card's id in `index.html` and re-run.

- [ ] **Step 6: Commit**

```bash
git add index.html assistant/package.json assistant/knowledge.js assistant/test/structure.test.js
git commit -m "Add project anchors and relocate knowledge.js for the voice concierge"
```

---

## Task 2: Worker scaffolding + CORS/origin allowlist (TDD)

**Files:**
- Create: `worker/package.json`, `worker/tsconfig.json`, `worker/wrangler.toml`, `worker/src/config.ts`
- Create: `worker/src/cors.ts`
- Test: `worker/test/cors.test.ts`

- [ ] **Step 1: Create `worker/package.json`**

```json
{
  "name": "portfolio-token-worker",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "test": "vitest run"
  },
  "dependencies": {
    "@google/genai": "1.29.0"
  },
  "devDependencies": {
    "vitest": "^2.1.0",
    "wrangler": "^3.90.0",
    "typescript": "^5.6.0",
    "@cloudflare/workers-types": "^4.20240909.0"
  }
}
```

- [ ] **Step 2: Create `worker/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"],
    "types": ["@cloudflare/workers-types"],
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["src", "test"]
}
```

- [ ] **Step 3: Create `worker/wrangler.toml`**

```toml
name = "portfolio-token-worker"
main = "src/index.ts"
compatibility_date = "2025-01-01"
compatibility_flags = ["nodejs_compat"]

# Created in Task 5: `wrangler kv namespace create RATE_LIMIT`
kv_namespaces = [
  { binding = "RATE_LIMIT", id = "REPLACE_WITH_KV_ID" }
]

[vars]
ALLOWED_ORIGINS = "https://kikugo.github.io,http://localhost:8000,http://127.0.0.1:8000"

# GEMINI_API_KEY is a secret, set via: wrangler secret put GEMINI_API_KEY
```

- [ ] **Step 4: Create `worker/src/config.ts`**

```ts
export const MODEL = 'gemini-3.1-flash-live-preview';

// Token lifetimes
export const TOKEN_LIFETIME_MS = 30 * 60 * 1000; // 30 min total
export const SESSION_START_WINDOW_MS = 2 * 60 * 1000; // 2 min to start a session

// Rate limiting (per UTC day)
export const PER_IP_DAILY_LIMIT = 25;
export const GLOBAL_DAILY_LIMIT = 500;
```

- [ ] **Step 5: Write the failing test** (`worker/test/cors.test.ts`)

```ts
import { describe, it, expect } from 'vitest';
import { isAllowedOrigin, corsHeaders } from '../src/cors';

const ALLOW = 'https://kikugo.github.io,http://localhost:8000';

describe('isAllowedOrigin', () => {
  it('accepts an allowlisted origin', () => {
    expect(isAllowedOrigin('https://kikugo.github.io', ALLOW)).toBe(true);
  });
  it('rejects an unknown origin', () => {
    expect(isAllowedOrigin('https://evil.example', ALLOW)).toBe(false);
  });
  it('rejects a missing origin', () => {
    expect(isAllowedOrigin(null, ALLOW)).toBe(false);
  });
});

describe('corsHeaders', () => {
  it('echoes an allowed origin', () => {
    const h = corsHeaders('https://kikugo.github.io', ALLOW);
    expect(h['Access-Control-Allow-Origin']).toBe('https://kikugo.github.io');
    expect(h['Vary']).toBe('Origin');
  });
  it('omits the allow-origin header for a disallowed origin', () => {
    const h = corsHeaders('https://evil.example', ALLOW);
    expect(h['Access-Control-Allow-Origin']).toBeUndefined();
  });
});
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `cd worker && npm install && npm test -- cors`
Expected: FAIL ("Cannot find module '../src/cors'").

- [ ] **Step 7: Implement `worker/src/cors.ts`**

```ts
export function parseAllowlist(allowed: string): string[] {
  return allowed.split(',').map((s) => s.trim()).filter(Boolean);
}

export function isAllowedOrigin(origin: string | null, allowed: string): boolean {
  if (!origin) return false;
  return parseAllowlist(allowed).includes(origin);
}

export function corsHeaders(
  origin: string | null,
  allowed: string
): Record<string, string> {
  const headers: Record<string, string> = {
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
  if (isAllowedOrigin(origin, allowed)) {
    headers['Access-Control-Allow-Origin'] = origin as string;
  }
  return headers;
}
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `cd worker && npm test -- cors`
Expected: PASS (all cors tests).

- [ ] **Step 9: Commit**

```bash
git add worker/package.json worker/tsconfig.json worker/wrangler.toml worker/src/config.ts worker/src/cors.ts worker/test/cors.test.ts
git commit -m "Add token Worker scaffolding and CORS allowlist"
```

---

## Task 3: Worker rate limiter (TDD)

**Files:**
- Create: `worker/src/ratelimit.ts`
- Test: `worker/test/ratelimit.test.ts`

- [ ] **Step 1: Write the failing test** (`worker/test/ratelimit.test.ts`)

```ts
import { describe, it, expect } from 'vitest';
import { checkAndIncrement } from '../src/ratelimit';

// Minimal in-memory stand-in for Cloudflare KV.
function fakeKV() {
  const store = new Map<string, string>();
  return {
    async get(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    async put(key: string, value: string) {
      store.set(key, value);
    },
  } as unknown as KVNamespace;
}

describe('checkAndIncrement', () => {
  it('allows requests under the limit and increments', async () => {
    const kv = fakeKV();
    const r1 = await checkAndIncrement(kv, 'ip:1.2.3.4', 2, 86400);
    const r2 = await checkAndIncrement(kv, 'ip:1.2.3.4', 2, 86400);
    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
    expect(r2.count).toBe(2);
  });

  it('blocks once the limit is exceeded', async () => {
    const kv = fakeKV();
    await checkAndIncrement(kv, 'ip:9', 1, 86400);
    const blocked = await checkAndIncrement(kv, 'ip:9', 1, 86400);
    expect(blocked.allowed).toBe(false);
  });

  it('keeps counters independent per key', async () => {
    const kv = fakeKV();
    await checkAndIncrement(kv, 'ip:a', 1, 86400);
    const other = await checkAndIncrement(kv, 'ip:b', 1, 86400);
    expect(other.allowed).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd worker && npm test -- ratelimit`
Expected: FAIL ("Cannot find module '../src/ratelimit'").

- [ ] **Step 3: Implement `worker/src/ratelimit.ts`**

```ts
export interface RateResult {
  allowed: boolean;
  count: number;
}

/**
 * Increment a counter at `key` and report whether it is within `limit`.
 * Counters expire after `windowSeconds` so they reset (KV TTL).
 * Note: KV is eventually consistent; this is a soft cap to protect quota,
 * not a hard security boundary.
 */
export async function checkAndIncrement(
  kv: KVNamespace,
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateResult> {
  const current = parseInt((await kv.get(key)) ?? '0', 10) || 0;
  const next = current + 1;
  await kv.put(key, String(next), { expirationTtl: windowSeconds });
  return { allowed: next <= limit, count: next };
}

/** UTC day bucket, e.g. "2026-06-06", for daily reset keys. */
export function dayBucket(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd worker && npm test -- ratelimit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add worker/src/ratelimit.ts worker/test/ratelimit.test.ts
git commit -m "Add KV-backed rate limiter for token minting"
```

---

## Task 4: Worker token builder + request handler (TDD)

**Files:**
- Create: `worker/src/token.ts`
- Create: `worker/src/index.ts`
- Test: `worker/test/token.test.ts`, `worker/test/index.test.ts`

- [ ] **Step 1: Write the failing test for the config builder** (`worker/test/token.test.ts`)

```ts
import { describe, it, expect } from 'vitest';
import { buildTokenConfig } from '../src/token';
import { MODEL } from '../src/config';

describe('buildTokenConfig', () => {
  it('locks the token to the live model and audio modality', () => {
    const cfg = buildTokenConfig(new Date('2026-06-06T00:00:00Z'));
    expect(cfg.uses).toBe(1);
    expect(cfg.liveConnectConstraints.model).toBe(MODEL);
    expect(cfg.liveConnectConstraints.config.responseModalities).toContain('AUDIO');
    expect(cfg.httpOptions.apiVersion).toBe('v1alpha');
  });

  it('sets future expiry timestamps', () => {
    const now = new Date('2026-06-06T00:00:00Z');
    const cfg = buildTokenConfig(now);
    expect(new Date(cfg.expireTime).getTime()).toBeGreaterThan(now.getTime());
    expect(new Date(cfg.newSessionExpireTime).getTime()).toBeGreaterThan(now.getTime());
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd worker && npm test -- token`
Expected: FAIL ("Cannot find module '../src/token'").

- [ ] **Step 3: Implement `worker/src/token.ts`**

```ts
import { GoogleGenAI } from '@google/genai';
import {
  MODEL,
  TOKEN_LIFETIME_MS,
  SESSION_START_WINDOW_MS,
} from './config';

export interface TokenConfig {
  uses: number;
  expireTime: string;
  newSessionExpireTime: string;
  liveConnectConstraints: {
    model: string;
    config: { responseModalities: string[] };
  };
  httpOptions: { apiVersion: string };
}

/** Pure: build the locked-down ephemeral-token config. */
export function buildTokenConfig(now: Date = new Date()): TokenConfig {
  return {
    uses: 1,
    expireTime: new Date(now.getTime() + TOKEN_LIFETIME_MS).toISOString(),
    newSessionExpireTime: new Date(
      now.getTime() + SESSION_START_WINDOW_MS
    ).toISOString(),
    liveConnectConstraints: {
      model: MODEL,
      config: { responseModalities: ['AUDIO'] },
    },
    httpOptions: { apiVersion: 'v1alpha' },
  };
}

export interface MintedToken {
  token: string;
  expiresAt: string;
}

/** Call Gemini to mint the ephemeral token. */
export async function mintToken(apiKey: string): Promise<MintedToken> {
  const ai = new GoogleGenAI({ apiKey });
  const cfg = buildTokenConfig();
  const created = await ai.authTokens.create({ config: cfg });
  return { token: created.name as string, expiresAt: cfg.expireTime };
}
```

- [ ] **Step 4: Run to verify the builder test passes**

Run: `cd worker && npm test -- token`
Expected: PASS.

- [ ] **Step 5: Write the failing handler test** (`worker/test/index.test.ts`)

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the SDK so no network call happens.
vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    authTokens = {
      create: vi.fn(async () => ({ name: 'ephemeral-abc123' })),
    };
  },
}));

import worker from '../src/index';

function fakeKV() {
  const store = new Map<string, string>();
  return {
    async get(k: string) {
      return store.has(k) ? store.get(k)! : null;
    },
    async put(k: string, v: string) {
      store.set(k, v);
    },
  } as unknown as KVNamespace;
}

function env() {
  return {
    GEMINI_API_KEY: 'test-key',
    ALLOWED_ORIGINS: 'https://kikugo.github.io',
    RATE_LIMIT: fakeKV(),
  };
}

function tokenRequest(origin: string | null) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (origin) headers['Origin'] = origin;
  headers['CF-Connecting-IP'] = '1.2.3.4';
  return new Request('https://worker.dev/token', { method: 'POST', headers });
}

describe('worker fetch handler', () => {
  let e: ReturnType<typeof env>;
  beforeEach(() => {
    e = env();
  });

  it('returns a token for an allowed origin', async () => {
    const res = await worker.fetch(tokenRequest('https://kikugo.github.io'), e);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.token).toBe('ephemeral-abc123');
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(
      'https://kikugo.github.io'
    );
  });

  it('rejects a disallowed origin with 403', async () => {
    const res = await worker.fetch(tokenRequest('https://evil.example'), e);
    expect(res.status).toBe(403);
  });

  it('answers CORS preflight (OPTIONS) with 204', async () => {
    const req = new Request('https://worker.dev/token', {
      method: 'OPTIONS',
      headers: { Origin: 'https://kikugo.github.io' },
    });
    const res = await worker.fetch(req, e);
    expect(res.status).toBe(204);
  });

  it('429s once the per-IP daily limit is exceeded', async () => {
    for (let i = 0; i < 25; i++) {
      await worker.fetch(tokenRequest('https://kikugo.github.io'), e);
    }
    const res = await worker.fetch(tokenRequest('https://kikugo.github.io'), e);
    expect(res.status).toBe(429);
  });
});
```

- [ ] **Step 6: Run to verify it fails**

Run: `cd worker && npm test -- index`
Expected: FAIL ("Cannot find module '../src/index'").

- [ ] **Step 7: Implement `worker/src/index.ts`**

```ts
import { corsHeaders, isAllowedOrigin } from './cors';
import { checkAndIncrement, dayBucket } from './ratelimit';
import { mintToken } from './token';
import { PER_IP_DAILY_LIMIT, GLOBAL_DAILY_LIMIT } from './config';

export interface Env {
  GEMINI_API_KEY: string;
  ALLOWED_ORIGINS: string;
  RATE_LIMIT: KVNamespace;
}

const DAY_SECONDS = 86400;

function json(body: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');
    const cors = corsHeaders(origin, env.ALLOWED_ORIGINS);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method !== 'POST' || new URL(request.url).pathname !== '/token') {
      return json({ error: 'not found' }, 404, cors);
    }
    if (!isAllowedOrigin(origin, env.ALLOWED_ORIGINS)) {
      return json({ error: 'forbidden origin' }, 403, cors);
    }

    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
    const day = dayBucket();
    const perIp = await checkAndIncrement(
      env.RATE_LIMIT, `ip:${day}:${ip}`, PER_IP_DAILY_LIMIT, DAY_SECONDS
    );
    if (!perIp.allowed) return json({ error: 'rate limited' }, 429, cors);

    const global = await checkAndIncrement(
      env.RATE_LIMIT, `global:${day}`, GLOBAL_DAILY_LIMIT, DAY_SECONDS
    );
    if (!global.allowed) return json({ error: 'rate limited' }, 429, cors);

    try {
      const minted = await mintToken(env.GEMINI_API_KEY);
      return json(minted, 200, cors);
    } catch (err) {
      console.error('mint failed', err);
      return json({ error: 'token mint failed' }, 502, cors);
    }
  },
};
```

- [ ] **Step 8: Run the full Worker suite to verify it passes**

Run: `cd worker && npm test`
Expected: PASS (cors, ratelimit, token, index — all green).

- [ ] **Step 9: Commit**

```bash
git add worker/src/token.ts worker/src/index.ts worker/test/token.test.ts worker/test/index.test.ts
git commit -m "Add token-mint handler with origin checks and rate limiting"
```

---

## Task 5: Worker README + deploy to Cloudflare (manual)

**Files:**
- Create: `worker/README.md`
- Modify: `worker/wrangler.toml` (real KV id)

- [ ] **Step 1: Write `worker/README.md`**

````markdown
# Portfolio Token Worker

Mints short-lived, model-locked Gemini Live API ephemeral tokens for the
portfolio voice concierge. The real `GEMINI_API_KEY` lives only here.

## One-time setup

```bash
cd worker
npm install
npx wrangler login

# Create the KV namespace, then paste the printed id into wrangler.toml
npx wrangler kv namespace create RATE_LIMIT

# Store the real Gemini key as a secret (NOT in any file)
npx wrangler secret put GEMINI_API_KEY
```

## Local development

```bash
npm run dev   # serves on http://localhost:8787
# For local secret, create worker/.dev.vars with:  GEMINI_API_KEY="..."
```

## Deploy

```bash
npm run deploy
# Note the deployed URL, e.g. https://portfolio-token-worker.<subdomain>.workers.dev
# Put that URL (with /token) into ../assistant/config.js as WORKER_URL.
```

## Notes
- `ALLOWED_ORIGINS` in `wrangler.toml` controls who may mint tokens. Add your
  custom domain there if you add one later.
- `.dev.vars` is gitignored. Never commit secrets.
````

- [ ] **Step 2: Create `worker/.gitignore`**

```
node_modules/
.dev.vars
.wrangler/
```

- [ ] **Step 3: Deploy (manual)**

Run, in order:
```bash
cd worker
npm install
npx wrangler login
npx wrangler kv namespace create RATE_LIMIT   # paste id into wrangler.toml
npx wrangler secret put GEMINI_API_KEY        # paste the real key
npm run deploy
```
Expected: a deployed URL is printed. Record it for Task 6/8.

- [ ] **Step 4: Smoke-test the endpoint (manual)**

```bash
curl -i -X POST https://<your-worker-url>/token -H "Origin: https://kikugo.github.io"
```
Expected: `200` with JSON `{"token":"...","expiresAt":"..."}`. A request with a
bad Origin should return `403`.

- [ ] **Step 5: Commit**

```bash
git add worker/README.md worker/.gitignore worker/wrangler.toml
git commit -m "Add Worker deploy docs; wire real KV namespace id"
```

---

## Task 6: Widget config + tool declarations & dispatcher (TDD)

**Files:**
- Create: `assistant/config.js`
- Create: `assistant/tools.js`
- Test: `assistant/test/tools.test.js`

- [ ] **Step 1: Create `assistant/config.js`**

```js
// Public client config. No secrets here.
export const WORKER_URL = 'https://REPLACE_WITH_WORKER_URL/token';
export const MODEL = 'gemini-3.1-flash-live-preview';
export const SDK_URL = 'https://esm.run/@google/genai@1.29.0';

// Client-side guardrails (server token also enforces its own limits).
export const MAX_SESSION_MS = 4 * 60 * 1000; // hard stop after 4 min
export const IDLE_TIMEOUT_MS = 30 * 1000;    // end after 30s of silence

// Audio
export const INPUT_SAMPLE_RATE = 16000;
export const OUTPUT_SAMPLE_RATE = 24000;
```

- [ ] **Step 2: Write the failing test** (`assistant/test/tools.test.js`)

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TOOL_DECLARATIONS, dispatchTool } from '../tools.js';

test('declares the scrollToSection tool', () => {
  const names = TOOL_DECLARATIONS.map((d) => d.name);
  assert.ok(names.includes('scrollToSection'));
  assert.ok(names.includes('downloadCV'));
});

test('scrollToSection resolves a valid section id', () => {
  const r = dispatchTool('scrollToSection', { sectionId: 'projects' });
  assert.equal(r.action, 'scroll');
  assert.equal(r.domId, 'projects');
  assert.equal(r.ok, true);
});

test('scrollToSection maps a project id to its proj- DOM id', () => {
  const r = dispatchTool('scrollToSection', { sectionId: 'videosense' });
  assert.equal(r.domId, 'proj-videosense');
  assert.equal(r.ok, true);
});

test('scrollToSection rejects an unknown id without throwing', () => {
  const r = dispatchTool('scrollToSection', { sectionId: 'pricing' });
  assert.equal(r.ok, false);
});

test('downloadCV returns the cv action', () => {
  const r = dispatchTool('downloadCV', {});
  assert.equal(r.action, 'downloadCV');
  assert.equal(r.ok, true);
});

test('unknown tool returns ok:false', () => {
  const r = dispatchTool('launchRockets', {});
  assert.equal(r.ok, false);
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `node --test assistant/test/tools.test.js`
Expected: FAIL ("Cannot find module '../tools.js'").

- [ ] **Step 4: Implement `assistant/tools.js`**

```js
import { PROFILE, SECTION_IDS } from './knowledge.js';

const PROJECT_IDS = new Set(PROFILE.projects.map((p) => p.id));
const SECTION_SET = new Set(SECTION_IDS);

export const TOOL_DECLARATIONS = [
  {
    name: 'scrollToSection',
    description:
      'Scroll the page to a section or a specific project and highlight it. ' +
      'Call this whenever you start talking about a part of the portfolio.',
    parameters: {
      type: 'OBJECT',
      properties: {
        sectionId: {
          type: 'STRING',
          description:
            'A section id (about, work, education, skills, projects, contact) ' +
            'or a project id (e.g. videosense, unified-rag).',
        },
      },
      required: ['sectionId'],
    },
  },
  {
    name: 'downloadCV',
    description: "Trigger a download of Karthik's CV / resume.",
    parameters: { type: 'OBJECT', properties: {} },
  },
];

/**
 * Pure dispatcher: validate a tool call and return a descriptor of the action
 * the UI layer should perform. Never throws; returns { ok:false } on bad input.
 */
export function dispatchTool(name, args = {}) {
  if (name === 'downloadCV') {
    return { ok: true, action: 'downloadCV' };
  }
  if (name === 'scrollToSection') {
    const id = String(args.sectionId ?? '').trim();
    if (SECTION_SET.has(id)) return { ok: true, action: 'scroll', domId: id };
    if (PROJECT_IDS.has(id)) return { ok: true, action: 'scroll', domId: `proj-${id}` };
    return { ok: false, action: 'scroll', error: `unknown section: ${id}` };
  }
  return { ok: false, error: `unknown tool: ${name}` };
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `node --test assistant/test/tools.test.js`
Expected: PASS (all tool tests).

- [ ] **Step 6: Commit**

```bash
git add assistant/config.js assistant/tools.js assistant/test/tools.test.js
git commit -m "Add widget config and function-calling tool dispatcher"
```

---

## Task 7: Audio utility functions (TDD)

**Files:**
- Create: `assistant/audio.js`
- Test: `assistant/test/audio.test.js`

- [ ] **Step 1: Write the failing test** (`assistant/test/audio.test.js`)

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  floatTo16BitPCM,
  int16ToBase64,
  base64ToInt16,
  downsampleFloat32,
} from '../audio.js';

test('floatTo16BitPCM clamps and scales', () => {
  const out = floatTo16BitPCM(Float32Array.from([0, 1, -1, 2]));
  assert.equal(out[0], 0);
  assert.equal(out[1], 32767);
  assert.equal(out[2], -32768);
  assert.equal(out[3], 32767); // clamped from 2.0
});

test('int16 <-> base64 round-trips', () => {
  const pcm = Int16Array.from([0, 1234, -5678, 32767, -32768]);
  const b64 = int16ToBase64(pcm);
  const back = base64ToInt16(b64);
  assert.deepEqual(Array.from(back), Array.from(pcm));
});

test('downsampleFloat32 reduces length by the ratio', () => {
  const input = new Float32Array(480); // 0.01s @ 48kHz
  const out = downsampleFloat32(input, 48000, 16000);
  assert.equal(out.length, 160); // -> 0.01s @ 16kHz
});

test('downsampleFloat32 is a no-op when rates match', () => {
  const input = Float32Array.from([0.1, 0.2, 0.3]);
  const out = downsampleFloat32(input, 16000, 16000);
  assert.deepEqual(Array.from(out), [0.1, 0.2, 0.3]);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test assistant/test/audio.test.js`
Expected: FAIL ("Cannot find module '../audio.js'").

- [ ] **Step 3: Implement `assistant/audio.js`**

```js
/** Convert Float32 [-1,1] samples to Int16 PCM, clamping out-of-range values. */
export function floatTo16BitPCM(float32) {
  const out = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

/** Base64-encode an Int16Array's bytes (browser- and Node-safe). */
export function int16ToBase64(int16) {
  const bytes = new Uint8Array(int16.buffer, int16.byteOffset, int16.byteLength);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return typeof btoa === 'function'
    ? btoa(binary)
    : Buffer.from(binary, 'binary').toString('base64');
}

/** Decode base64 PCM16 back into an Int16Array. */
export function base64ToInt16(b64) {
  const binary =
    typeof atob === 'function'
      ? atob(b64)
      : Buffer.from(b64, 'base64').toString('binary');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Int16Array(bytes.buffer);
}

/** Decode base64 PCM16 into Float32 [-1,1] for Web Audio playback buffers. */
export function base64ToFloat32(b64) {
  const int16 = base64ToInt16(b64);
  const out = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) out[i] = int16[i] / 0x8000;
  return out;
}

/** Linear-interpolation downsample from inRate to outRate. */
export function downsampleFloat32(input, inRate, outRate) {
  if (outRate === inRate) return input;
  const ratio = inRate / outRate;
  const outLength = Math.floor(input.length / ratio);
  const out = new Float32Array(outLength);
  for (let i = 0; i < outLength; i++) {
    out[i] = input[Math.floor(i * ratio)];
  }
  return out;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `node --test assistant/test/audio.test.js`
Expected: PASS.

- [ ] **Step 5: Run the whole widget suite**

Run: `node --test assistant/test/`
Expected: PASS (structure, tools, audio).

- [ ] **Step 6: Commit**

```bash
git add assistant/audio.js assistant/test/audio.test.js
git commit -m "Add PCM audio encode/decode/resample helpers"
```

---

## Task 8: SDK + token smoke test (manual de-risk)

Goal: prove the CDN SDK import + ephemeral token + Live connect path works in a
real browser **before** building the full widget. Uses a throwaway page.

**Files:**
- Create: `assistant/smoke.html` (temporary; deleted in Task 12)

- [ ] **Step 1: Set the real Worker URL in `assistant/config.js`**

Replace `WORKER_URL`'s `REPLACE_WITH_WORKER_URL` with the deployed Worker URL
from Task 5 (keep the trailing `/token`).

- [ ] **Step 2: Create `assistant/smoke.html`**

```html
<!doctype html>
<html>
  <head><meta charset="utf-8" /><title>concierge smoke test</title></head>
  <body>
    <button id="go">connect + say hi</button>
    <pre id="log"></pre>
    <script type="module">
      import { GoogleGenAI, Modality } from 'https://esm.run/@google/genai@1.29.0';
      import { WORKER_URL, MODEL } from './config.js';
      import { SYSTEM_PROMPT } from './knowledge.js';
      const log = (m) => (document.getElementById('log').textContent += m + '\n');

      document.getElementById('go').onclick = async () => {
        log('fetching token...');
        const res = await fetch(WORKER_URL, { method: 'POST' });
        const { token } = await res.json();
        log('got token: ' + token.slice(0, 12) + '...');

        const ai = new GoogleGenAI({
          apiKey: token,
          httpOptions: { apiVersion: 'v1alpha' },
        });
        const session = await ai.live.connect({
          model: MODEL,
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: SYSTEM_PROMPT,
            outputAudioTranscription: {},
          },
          callbacks: {
            onopen: () => log('OPEN'),
            onmessage: (msg) => {
              if (msg.serverContent?.outputTranscription?.text)
                log('AI: ' + msg.serverContent.outputTranscription.text);
              const parts = msg.serverContent?.modelTurn?.parts || [];
              for (const p of parts)
                if (p.inlineData?.data) log('[audio chunk ' + p.inlineData.data.length + 'b]');
            },
            onerror: (e) => log('ERROR ' + (e.message || e)),
            onclose: () => log('CLOSED'),
          },
        });
        session.sendClientContent({
          turns: [{ role: 'user', parts: [{ text: 'say hello in one short sentence' }] }],
          turnComplete: true,
        });
      };
    </script>
  </body>
</html>
```

- [ ] **Step 3: Serve and test (manual)**

```bash
# from repo root, on a port that is in ALLOWED_ORIGINS
python3 -m http.server 8000
```
Open `http://localhost:8000/assistant/smoke.html`, click the button.
Expected log: `got token...`, `OPEN`, one or more `AI: ...` transcription lines,
and `[audio chunk ...]` lines. This confirms token + connect + audio + transcription.

If the CDN import fails or the API shape differs, resolve here (e.g. bump the
pinned `@google/genai` version in `config.js`/`smoke.html`) before continuing.

- [ ] **Step 4: Commit the verified config (not the smoke file yet)**

```bash
git add assistant/config.js
git commit -m "Point widget at deployed Worker; verify Live connect path"
```

---

## Task 9: Audio player (24 kHz playback queue with barge-in)

**Files:**
- Create: `assistant/player.js`

(No automated test — Web Audio scheduling requires a real AudioContext. Verified
in Task 11's manual run. Provide complete code now.)

- [ ] **Step 1: Implement `assistant/player.js`**

```js
import { base64ToFloat32 } from './audio.js';
import { OUTPUT_SAMPLE_RATE } from './config.js';

/** Schedules base64 PCM16 chunks for gapless playback; flush() enables barge-in. */
export class AudioPlayer {
  constructor() {
    this.ctx = null;
    this.nextStartTime = 0;
    this.sources = new Set();
    this.onStateChange = () => {};
  }

  ensureContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: OUTPUT_SAMPLE_RATE,
      });
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  enqueue(base64Pcm) {
    this.ensureContext();
    const float = base64ToFloat32(base64Pcm);
    if (!float.length) return;

    const buffer = this.ctx.createBuffer(1, float.length, OUTPUT_SAMPLE_RATE);
    buffer.getChannelData(0).set(float);

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(this.ctx.destination);

    const now = this.ctx.currentTime;
    const startAt = Math.max(now, this.nextStartTime);
    src.start(startAt);
    this.nextStartTime = startAt + buffer.duration;

    this.sources.add(src);
    this.onStateChange('speaking');
    src.onended = () => {
      this.sources.delete(src);
      if (this.sources.size === 0) this.onStateChange('idle');
    };
  }

  /** Stop all queued audio immediately (called on interruption / end). */
  flush() {
    for (const src of this.sources) {
      try { src.stop(); } catch { /* already stopped */ }
    }
    this.sources.clear();
    this.nextStartTime = this.ctx ? this.ctx.currentTime : 0;
    this.onStateChange('idle');
  }

  close() {
    this.flush();
    if (this.ctx) { this.ctx.close(); this.ctx = null; }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add assistant/player.js
git commit -m "Add 24kHz audio playback queue with barge-in flush"
```

---

## Task 10: Mic capture worklet + Live session manager

**Files:**
- Create: `assistant/pcm-worklet.js`
- Create: `assistant/session.js`

(Integration code; verified in Task 11. Complete code below.)

- [ ] **Step 1: Implement `assistant/pcm-worklet.js`**

```js
// AudioWorkletProcessor: forwards mono Float32 frames to the main thread.
class PCMProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (input && input[0]) {
      // Copy: the underlying buffer is reused by the engine.
      this.port.postMessage(input[0].slice(0));
    }
    return true;
  }
}
registerProcessor('pcm-processor', PCMProcessor);
```

- [ ] **Step 2: Implement `assistant/session.js`**

```js
import { GoogleGenAI, Modality } from './sdk.js';
import { WORKER_URL, MODEL, INPUT_SAMPLE_RATE } from './config.js';
import { SYSTEM_PROMPT } from './knowledge.js';
import { TOOL_DECLARATIONS, dispatchTool } from './tools.js';
import { floatTo16BitPCM, int16ToBase64, downsampleFloat32 } from './audio.js';
import { AudioPlayer } from './player.js';

/**
 * Owns one Live API conversation: token fetch, connect, mic streaming,
 * audio playback, transcription, and tool dispatch.
 *
 * Callbacks (all optional):
 *   onState(state)        'connecting'|'listening'|'thinking'|'speaking'|'idle'|'closed'
 *   onCaption(who, text)  who = 'user' | 'ai'
 *   onToolAction(action)  { action:'scroll', domId } | { action:'downloadCV' }
 *   onError(message)
 */
export class LiveSession {
  constructor(callbacks = {}) {
    this.cb = callbacks;
    this.session = null;
    this.player = new AudioPlayer();
    this.player.onStateChange = (s) => this._setState(s);
    this.micCtx = null;
    this.micStream = null;
    this.workletNode = null;
    this.closed = false;
  }

  _setState(state) { this.cb.onState?.(state); }

  async _fetchToken() {
    const res = await fetch(WORKER_URL, { method: 'POST' });
    if (!res.ok) throw new Error(`token request failed: ${res.status}`);
    const { token } = await res.json();
    return token;
  }

  async connect() {
    this._setState('connecting');
    const token = await this._fetchToken();
    const ai = new GoogleGenAI({
      apiKey: token,
      httpOptions: { apiVersion: 'v1alpha' },
    });

    this.session = await ai.live.connect({
      model: MODEL,
      config: {
        responseModalities: [Modality.AUDIO],
        systemInstruction: SYSTEM_PROMPT,
        tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
        inputAudioTranscription: {},
        outputAudioTranscription: {},
      },
      callbacks: {
        onopen: () => this._setState('listening'),
        onmessage: (msg) => this._onMessage(msg),
        onerror: (e) => this.cb.onError?.(e.message || String(e)),
        onclose: () => { if (!this.closed) this._setState('idle'); },
      },
    });
  }

  _onMessage(msg) {
    const sc = msg.serverContent;
    if (sc?.interrupted) this.player.flush();

    const parts = sc?.modelTurn?.parts || [];
    for (const p of parts) {
      if (p.inlineData?.data) this.player.enqueue(p.inlineData.data);
    }
    if (sc?.outputTranscription?.text) this.cb.onCaption?.('ai', sc.outputTranscription.text);
    if (sc?.inputTranscription?.text) this.cb.onCaption?.('user', sc.inputTranscription.text);

    if (msg.toolCall?.functionCalls?.length) {
      this._setState('thinking');
      const responses = [];
      for (const call of msg.toolCall.functionCalls) {
        const result = dispatchTool(call.name, call.args || {});
        if (result.ok && result.action) this.cb.onToolAction?.(result);
        responses.push({ id: call.id, name: call.name, response: { result: result.ok ? 'ok' : 'ignored' } });
      }
      this.session.sendToolResponse({ functionResponses: responses });
    }
  }

  /** Start streaming mic audio. Throws if mic permission is denied. */
  async startMic() {
    this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.micCtx = new (window.AudioContext || window.webkitAudioContext)();
    await this.micCtx.audioWorklet.addModule(new URL('./pcm-worklet.js', import.meta.url));

    const source = this.micCtx.createMediaStreamSource(this.micStream);
    this.workletNode = new AudioWorkletNode(this.micCtx, 'pcm-processor');
    const inRate = this.micCtx.sampleRate;

    this.workletNode.port.onmessage = (e) => {
      if (!this.session || this.closed) return;
      const down = downsampleFloat32(e.data, inRate, INPUT_SAMPLE_RATE);
      const b64 = int16ToBase64(floatTo16BitPCM(down));
      this.session.sendRealtimeInput({
        media: { data: b64, mimeType: `audio/pcm;rate=${INPUT_SAMPLE_RATE}` },
      });
    };
    source.connect(this.workletNode);
    // Worklet has no audible output; do not connect to destination.
    this._setState('listening');
  }

  /** Text-mode input (no mic). */
  sendText(text) {
    if (!this.session) return;
    this._setState('thinking');
    this.session.sendClientContent({
      turns: [{ role: 'user', parts: [{ text }] }],
      turnComplete: true,
    });
  }

  close() {
    this.closed = true;
    try { this.workletNode?.port?.close(); } catch {}
    try { this.micStream?.getTracks().forEach((t) => t.stop()); } catch {}
    try { this.micCtx?.close(); } catch {}
    try { this.session?.close(); } catch {}
    this.player.close();
    this._setState('closed');
  }
}
```

- [ ] **Step 3: Create `assistant/sdk.js`** (single place that imports the CDN SDK)

```js
// Re-export the SDK from the CDN so the rest of the widget imports locally.
// Keeping the CDN URL in one file makes version bumps and testing easy.
export { GoogleGenAI, Modality } from 'https://esm.run/@google/genai@1.29.0';
```

- [ ] **Step 4: Commit**

```bash
git add assistant/pcm-worklet.js assistant/session.js assistant/sdk.js
git commit -m "Add mic capture worklet and Live session manager"
```

---

## Task 11: UI module, entry point, and index.html wiring

**Files:**
- Create: `assistant/ui.js`
- Create: `assistant/assistant.js`
- Create: `assistant/assistant.css`
- Modify: `index.html` (head: css link; body end: module script; dock: trigger button)

- [ ] **Step 1: Implement `assistant/assistant.css`**

```css
:root {
  --concierge-accent: #6366f1;
}
.concierge-trigger {
  display: inline-flex; align-items: center; gap: 0.5rem;
  cursor: pointer; border: 1px solid var(--border, #262626);
  background: var(--surface, #141414); color: var(--text, #fafafa);
  border-radius: 999px; padding: 0.5rem 1rem; font: inherit;
}
.concierge-overlay {
  position: fixed; inset: 0; z-index: 60; display: none;
  align-items: center; justify-content: center;
  background: rgba(0,0,0,0.6); backdrop-filter: blur(6px);
}
.concierge-overlay[data-open="true"] { display: flex; }
.concierge-panel {
  width: min(92%, 480px); background: var(--surface, #141414);
  color: var(--text, #fafafa); border: 1px solid var(--border, #262626);
  border-radius: 1.25rem; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem;
}
.concierge-orb {
  width: 72px; height: 72px; border-radius: 50%; margin: 0 auto;
  background: radial-gradient(circle at 30% 30%, var(--concierge-accent), #1e1b4b);
  transition: transform 0.2s ease; }
.concierge-panel[data-state="speaking"] .concierge-orb { transform: scale(1.12); }
.concierge-panel[data-state="listening"] .concierge-orb { transform: scale(1.04); }
.concierge-status { text-align: center; color: var(--muted, #a3a3a3); font-size: 0.85rem; }
.concierge-caption { min-height: 3.5rem; text-align: center; line-height: 1.5; }
.concierge-controls { display: flex; gap: 0.75rem; justify-content: center; }
.concierge-controls button {
  border: 1px solid var(--border, #262626); background: transparent;
  color: var(--text, #fafafa); border-radius: 999px; padding: 0.6rem 1.1rem; cursor: pointer; font: inherit;
}
.concierge-controls .end { background: #ef4444; border-color: #ef4444; color: #fff; }
.concierge-textbar { display: flex; gap: 0.5rem; }
.concierge-textbar input {
  flex: 1; background: var(--bg, #0a0a0a); color: var(--text, #fafafa);
  border: 1px solid var(--border, #262626); border-radius: 999px; padding: 0.5rem 0.9rem; font: inherit; }
```

- [ ] **Step 2: Implement `assistant/ui.js`**

```js
const STATUS = {
  connecting: 'connecting...', listening: 'listening', thinking: 'thinking...',
  speaking: 'speaking', idle: 'tap the mic or type', closed: '',
};

/** Builds and controls the concierge DOM. Pure view layer; emits events via handlers. */
export class ConciergeUI {
  constructor(handlers = {}) {
    this.h = handlers;
    this._build();
  }

  _build() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'concierge-overlay';
    this.overlay.innerHTML = `
      <div class="concierge-panel" data-state="idle" role="dialog" aria-label="AI portfolio guide">
        <div class="concierge-orb"></div>
        <div class="concierge-status"></div>
        <div class="concierge-caption"></div>
        <div class="concierge-controls">
          <button class="mic" type="button">🎙 start</button>
          <button class="end" type="button">end</button>
        </div>
        <div class="concierge-textbar">
          <input type="text" placeholder="or type a question..." aria-label="Type a question" />
          <button class="send" type="button">send</button>
        </div>
      </div>`;
    document.body.appendChild(this.overlay);

    this.panel = this.overlay.querySelector('.concierge-panel');
    this.statusEl = this.overlay.querySelector('.concierge-status');
    this.captionEl = this.overlay.querySelector('.concierge-caption');
    this.micBtn = this.overlay.querySelector('.mic');
    this.input = this.overlay.querySelector('input');

    this.micBtn.onclick = () => this.h.onMic?.();
    this.overlay.querySelector('.end').onclick = () => this.h.onEnd?.();
    const send = () => {
      const v = this.input.value.trim();
      if (v) { this.h.onText?.(v); this.input.value = ''; }
    };
    this.overlay.querySelector('.send').onclick = send;
    this.input.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.h.onEnd?.();
    });
  }

  open() { this.overlay.dataset.open = 'true'; }
  close() { this.overlay.dataset.open = 'false'; }
  setState(state) {
    this.panel.dataset.state = state;
    this.statusEl.textContent = STATUS[state] ?? '';
  }
  setCaption(who, text) {
    this.captionEl.textContent = text;
    this.captionEl.style.color = who === 'user' ? 'var(--muted,#a3a3a3)' : 'var(--text,#fafafa)';
  }
  setMicMode(active) { this.micBtn.textContent = active ? '🎙 listening' : '🎙 start'; }
}
```

- [ ] **Step 3: Implement `assistant/assistant.js`** (entry + feature detection + glue)

```js
import { ConciergeUI } from './ui.js';
import { LiveSession } from './session.js';
import { PROFILE } from './knowledge.js';
import { MAX_SESSION_MS } from './config.js';

function supported() {
  return (
    typeof WebSocket !== 'undefined' &&
    (window.AudioContext || window.webkitAudioContext) &&
    typeof navigator !== 'undefined'
  );
}

function highlight(domId) {
  const el = document.getElementById(domId);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.add('concierge-highlight');
  setTimeout(() => el.classList.remove('concierge-highlight'), 2200);
}

function init() {
  if (!supported()) return; // leave the static site untouched

  let session = null;
  let sessionTimer = null;

  const ui = new ConciergeUI({
    onMic: () => startMic(),
    onText: (t) => session?.sendText(t),
    onEnd: () => end(),
  });

  async function start() {
    ui.open();
    ui.setState('connecting');
    session = new LiveSession({
      onState: (s) => ui.setState(s),
      onCaption: (who, text) => ui.setCaption(who, text),
      onToolAction: (a) => {
        if (a.action === 'scroll') highlight(a.domId);
        if (a.action === 'downloadCV') window.open(PROFILE.cvUrl, '_blank');
      },
      onError: (m) => ui.setCaption('ai', 'sorry, something went wrong: ' + m),
    });
    try {
      await session.connect();
      sessionTimer = setTimeout(() => end(), MAX_SESSION_MS);
    } catch (e) {
      ui.setCaption('ai', 'could not connect right now. try again later.');
    }
  }

  async function startMic() {
    try {
      await session.startMic();
      ui.setMicMode(true);
    } catch {
      ui.setCaption('ai', "mic is blocked — you can still type your question below.");
      ui.setMicMode(false);
    }
  }

  function end() {
    clearTimeout(sessionTimer);
    session?.close();
    session = null;
    ui.setMicMode(false);
    ui.close();
  }

  // Trigger: use an existing dock button if present, else inject a floating one.
  const existing = document.getElementById('concierge-trigger');
  if (existing) {
    existing.addEventListener('click', start);
  } else {
    const btn = document.createElement('button');
    btn.className = 'concierge-trigger';
    btn.style.cssText = 'position:fixed;bottom:1.25rem;right:1.25rem;z-index:55;';
    btn.textContent = '🤖 talk to my portfolio';
    btn.onclick = start;
    document.body.appendChild(btn);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
```

- [ ] **Step 4: Add the highlight style to `assistant/assistant.css`**

```css
.concierge-highlight {
  outline: 3px solid var(--concierge-accent);
  outline-offset: 4px; border-radius: 0.75rem;
  transition: outline-color 0.4s ease;
}
```

- [ ] **Step 5: Wire into `index.html`**

In `<head>` (near the existing styles):
```html
<link rel="stylesheet" href="assistant/assistant.css" />
```
Just before `</body>`:
```html
<script type="module" src="assistant/assistant.js"></script>
```
Optional: if there is a dock element, add a trigger the script will hook:
```html
<button id="concierge-trigger" class="dock-item" title="Talk to my portfolio">🤖</button>
```
(If you skip the dock button, the script injects a floating trigger automatically.)

- [ ] **Step 6: Manual end-to-end verification (local)**

Run two terminals:
```bash
# 1) Worker locally (needs worker/.dev.vars with GEMINI_API_KEY)
cd worker && npm run dev
# 2) Static site on an allowed origin
cd .. && python3 -m http.server 8000
```
If running the Worker locally, temporarily set `WORKER_URL` in `assistant/config.js`
to `http://localhost:8787/token` (revert before deploy).

Open `http://localhost:8000/`, click the trigger, then verify each:
- [ ] Voice: click start, allow mic, ask "what are his projects?" → hears a spoken answer, page scrolls to and highlights `#projects`.
- [ ] Project scroll: ask "tell me about VideoSense" → scrolls to `#proj-videosense`.
- [ ] CV: ask "can I get his resume?" → CV opens/downloads.
- [ ] Barge-in: talk while it is speaking → playback stops and it listens.
- [ ] Text fallback: type a question, press enter → answer comes back (audio + caption).
- [ ] Denied mic: block the mic permission → caption tells the user to type; text mode still works.
- [ ] End: click end / click backdrop → audio stops, panel closes, no console errors.

- [ ] **Step 7: Commit**

```bash
git add assistant/ui.js assistant/assistant.js assistant/assistant.css index.html
git commit -m "Add concierge UI, entry point, and wire widget into index.html"
```

---

## Task 12: Cross-browser pass, cleanup, deploy

**Files:**
- Delete: `assistant/smoke.html`
- Modify: `assistant/config.js` (ensure `WORKER_URL` points at the deployed Worker, not localhost)

- [ ] **Step 1: Restore production Worker URL**

Confirm `WORKER_URL` in `assistant/config.js` is the deployed `*.workers.dev/token`
(not `localhost`).

- [ ] **Step 2: Remove the smoke-test page**

```bash
rm assistant/smoke.html
```

- [ ] **Step 3: Cross-browser manual check**

Repeat the Task 11 Step 6 checklist in: Chrome (primary), plus Safari and Firefox.
Note: voice needs a user gesture (the start button covers it); on Firefox confirm
AudioWorklet + getUserMedia path. If a browser cannot do voice, confirm it falls
back to text mode cleanly.

- [ ] **Step 4: Commit cleanup**

```bash
git add assistant/config.js
git rm assistant/smoke.html
git commit -m "Finalize concierge config and remove smoke-test page"
```

- [ ] **Step 5: Push the branch and open a PR (do not merge without sign-off)**

```bash
git push -u origin feat/ai-voice-concierge
gh pr create --title "AI voice concierge" --body "Adds the Gemini Live voice guide widget + token Worker. See docs/superpowers/specs and plans."
```

Then invoke **superpowers:finishing-a-development-branch** to decide on merge.

---

## Self-Review

**Spec coverage:**
- Ephemeral-token Worker, model/config-locked → Tasks 2-5. ✅
- Origin allowlist + CORS + KV rate cap → Tasks 2-4. ✅
- Widget: token fetch + direct Live connect → Tasks 8, 10. ✅
- Mic 16 kHz PCM up / 24 kHz down + barge-in → Tasks 7, 9, 10. ✅
- scrollToSection function tool incl. `proj-<id>` mapping → Tasks 1, 6, 10, 11. ✅
- Text fallback + transcription captions → Tasks 10, 11. ✅
- Graceful degradation (mic denied / unsupported) → Task 11. ✅
- Third-person grounded persona via knowledge.js → Task 1 (relocate), used in 8/10. ✅
- index.html additive changes (ids, link, script, trigger) → Tasks 1, 11. ✅
- Tests: worker vitest + widget node:test → Tasks 1-7. ✅

**Placeholder scan:** `REPLACE_WITH_WORKER_URL` (config) and `REPLACE_WITH_KV_ID` (wrangler) are intentional, filled by manual Tasks 5/8 with real deployed values — not code placeholders.

**Type/name consistency:** `LiveSession` callbacks (`onState/onCaption/onToolAction/onError`) match `assistant.js` usage; `dispatchTool` returns `{ok, action, domId}` consumed identically in `session.js` and tested in `tools.test.js`; `AudioPlayer.enqueue/flush/close` match `session.js`; SDK import centralized in `sdk.js` (prod) with the smoke test importing the same pinned URL.
