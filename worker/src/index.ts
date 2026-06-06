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
