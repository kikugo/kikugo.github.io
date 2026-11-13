export const MODEL = 'gemini-3.1-flash-live-preview';

// Token lifetimes. expireTime is also the window in which the client may send
// messages on the Live connection, so it caps the whole voice session. The
// token config does not enable sessionResumption, so it cannot be stretched.
export const TOKEN_LIFETIME_MS = 5 * 60 * 1000; // 5 min total
export const SESSION_START_WINDOW_MS = 60 * 1000; // 1 min to open the session

// Rate limiting (per UTC day). Counted atomically in the RateLimiter Durable
// Object. Worst case per day is GLOBAL_DAILY_LIMIT sessions of 5 minutes.
export const PER_IP_DAILY_LIMIT = 10;
export const GLOBAL_DAILY_LIMIT = 100;
