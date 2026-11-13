import { describe, it, expect } from 'vitest';
import { applyHit, RateLimiter, checkLimit, type DayState } from '../src/ratelimit';
import { PER_IP_DAILY_LIMIT, GLOBAL_DAILY_LIMIT } from '../src/config';

const LIMITS = { perIp: 2, global: 3 };

describe('applyHit', () => {
  it('allows and counts requests under the limits', () => {
    let s: DayState | undefined;
    ({ state: s } = applyHit(s, 'a', 'd1', LIMITS));
    const r = applyHit(s, 'a', 'd1', LIMITS);
    expect(r.result.allowed).toBe(true);
    expect(r.state.ips.a).toBe(2);
    expect(r.state.global).toBe(2);
  });

  it('blocks an IP over its limit without counting it', () => {
    let s: DayState | undefined;
    for (let i = 0; i < 2; i++) s = applyHit(s, 'a', 'd1', LIMITS).state;
    const r = applyHit(s, 'a', 'd1', LIMITS);
    expect(r.result).toEqual({ allowed: false, reason: 'ip' });
    expect(r.state.global).toBe(2);
  });

  it('blocks everyone once the global limit is reached', () => {
    let s: DayState | undefined;
    for (const ip of ['a', 'b', 'c']) s = applyHit(s, ip, 'd1', LIMITS).state;
    const r = applyHit(s, 'z', 'd1', LIMITS);
    expect(r.result).toEqual({ allowed: false, reason: 'global' });
    expect(r.state.ips.z).toBeUndefined();
  });

  it('resets on a new day', () => {
    let s: DayState | undefined;
    for (const ip of ['a', 'b', 'c']) s = applyHit(s, ip, 'd1', LIMITS).state;
    const r = applyHit(s, 'a', 'd2', LIMITS);
    expect(r.result.allowed).toBe(true);
    expect(r.state).toEqual({ day: 'd2', global: 1, ips: { a: 1 } });
  });
});

function fakeNamespace() {
  const store = new Map<string, unknown>();
  const limiter = new RateLimiter({
    storage: {
      async get<T>(k: string) { return store.get(k) as T | undefined; },
      async put<T>(k: string, v: T) { store.set(k, v); },
    },
  });
  return {
    idFromName: () => 'global',
    get: () => ({ fetch: (url: string, init: RequestInit) => limiter.fetch(new Request(url, init)) }),
  } as unknown as DurableObjectNamespace;
}

describe('RateLimiter Durable Object', () => {
  it('enforces the per-IP daily limit', async () => {
    const ns = fakeNamespace();
    for (let i = 0; i < PER_IP_DAILY_LIMIT; i++) {
      expect((await checkLimit(ns, '1.1.1.1', 'd1')).allowed).toBe(true);
    }
    expect(await checkLimit(ns, '1.1.1.1', 'd1')).toEqual({ allowed: false, reason: 'ip' });
    expect((await checkLimit(ns, '2.2.2.2', 'd1')).allowed).toBe(true);
  });

  it('enforces the global daily limit under concurrent requests', async () => {
    const ns = fakeNamespace();
    const ips = Array.from({ length: GLOBAL_DAILY_LIMIT + 20 }, (_, i) => `10.0.0.${i}`);
    const results = await Promise.all(ips.map((ip) => checkLimit(ns, ip, 'd1')));
    expect(results.filter((r) => r.allowed).length).toBeLessThanOrEqual(GLOBAL_DAILY_LIMIT);
  });
});
