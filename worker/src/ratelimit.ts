import { PER_IP_DAILY_LIMIT, GLOBAL_DAILY_LIMIT } from './config';

export interface Limits {
  perIp: number;
  global: number;
}

/** One UTC day of counters. Only IPs that were granted a token are stored. */
export interface DayState {
  day: string;
  global: number;
  ips: Record<string, number>;
}

export type HitResult =
  | { allowed: true }
  | { allowed: false; reason: 'ip' | 'global' };

/**
 * Pure: decide one request against the day's counters and return the new
 * state. Rejected requests do not change the counters, so the stored IP map is
 * never larger than the global limit.
 */
export function applyHit(
  prev: DayState | undefined,
  ip: string,
  day: string,
  limits: Limits
): { state: DayState; result: HitResult } {
  const state: DayState =
    prev && prev.day === day ? prev : { day, global: 0, ips: {} };
  const used = state.ips[ip] ?? 0;
  if (used >= limits.perIp) return { state, result: { allowed: false, reason: 'ip' } };
  if (state.global >= limits.global) {
    return { state, result: { allowed: false, reason: 'global' } };
  }
  return {
    state: { day, global: state.global + 1, ips: { ...state.ips, [ip]: used + 1 } },
    result: { allowed: true },
  };
}

/** UTC day bucket, e.g. "2026-06-06", for daily reset. */
export function dayBucket(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

interface LimiterStorage {
  get<T>(key: string): Promise<T | undefined>;
  put<T>(key: string, value: T): Promise<void>;
}

/**
 * A single Durable Object instance holds every counter, and it chains each
 * read-check-write behind the previous one, so concurrent requests can never
 * both read the same count. (The runtime's input gates give the same ordering,
 * the explicit queue just makes it hold without relying on them.) KV could not
 * do this: two requests in different places could both read the same value.
 */
export class RateLimiter {
  private storage: LimiterStorage;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(state: { storage: LimiterStorage }, _env?: unknown) {
    this.storage = state.storage;
  }

  async fetch(request: Request): Promise<Response> {
    const { ip, day } = (await request.json()) as { ip: string; day: string };
    const run = this.queue.then(() => this.hit(ip, day));
    this.queue = run.catch(() => undefined);
    return Response.json(await run);
  }

  private async hit(ip: string, day: string): Promise<HitResult> {
    const prev = await this.storage.get<DayState>('state');
    const { state, result } = applyHit(prev, ip, day, {
      perIp: PER_IP_DAILY_LIMIT,
      global: GLOBAL_DAILY_LIMIT,
    });
    if (result.allowed) await this.storage.put('state', state);
    return result;
  }
}

/** Ask the single limiter instance whether this IP may have a token now. */
export async function checkLimit(
  ns: DurableObjectNamespace,
  ip: string,
  day: string = dayBucket()
): Promise<HitResult> {
  const stub = ns.get(ns.idFromName('global'));
  const res = await stub.fetch('https://limiter/hit', {
    method: 'POST',
    body: JSON.stringify({ ip, day }),
  });
  return (await res.json()) as HitResult;
}
