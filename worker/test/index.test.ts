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
