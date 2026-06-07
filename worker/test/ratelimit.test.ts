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
