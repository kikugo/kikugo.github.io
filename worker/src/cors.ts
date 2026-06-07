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
