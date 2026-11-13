import { corsHeaders, isAllowedOrigin } from './cors';
import { checkLimit } from './ratelimit';
import { mintToken } from './token';

export { RateLimiter } from './ratelimit';

export interface Env {
  GEMINI_API_KEY: string;
  ALLOWED_ORIGINS: string;
  LIMITER: DurableObjectNamespace;
}

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
    // The Origin header can be forged outside a browser, so this only stops
    // other websites from using the Worker. The pinned session config and the
    // daily limits are what bound the cost.
    if (!isAllowedOrigin(origin, env.ALLOWED_ORIGINS)) {
      return json({ error: 'forbidden origin' }, 403, cors);
    }

    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
    const limit = await checkLimit(env.LIMITER, ip);
    if (!limit.allowed) return json({ error: 'rate limited' }, 429, cors);

    // The request body is never read: the client cannot change the prompt,
    // tools or model baked into the token.
    try {
      const minted = await mintToken(env.GEMINI_API_KEY);
      return json(minted, 200, cors);
    } catch (err) {
      console.error('mint failed', err);
      return json({ error: 'token mint failed' }, 502, cors);
    }
  },
};
