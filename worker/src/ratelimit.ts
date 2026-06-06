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
