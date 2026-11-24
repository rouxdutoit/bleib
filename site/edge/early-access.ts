/**
 * Early-access signup, as a Bunny Edge Script (middleware on the `bleib` pull zone).
 *
 * POST /api/early-access stores { email, lang, createdAt } as one file per address in the private
 * `bleib-signups` storage zone (Frankfurt, no replication); the file name is a SHA-256 hash of the
 * address. Every other request passes through to the static site in the `bleib-site` zone.
 *
 * Abuse protection: a honeypot field and a small per-IP rate limit kept only in memory. The IP
 * address is never stored or logged; the counter is keyed by a truncated hash and dropped after
 * two minutes.
 *
 * Needs the script secret SIGNUPS_STORAGE_KEY (the bleib-signups zone password). Mode
 * "Run script before cache" must be on so POSTs always reach the script.
 */
import * as BunnySDK from 'npm:@bunny.net/edgescript-sdk@0.13.0';
import process from 'node:process';

const PATH = '/api/early-access';
const STORAGE = 'https://storage.bunnycdn.com/bleib-signups/';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const LIMIT_PER_MINUTE = 5;
const counters = new Map<string, number>();

const hex = (buf: ArrayBuffer, bytes?: number) =>
  [...new Uint8Array(buf).slice(0, bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
const sha256 = (s: string) => crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

async function readBody(request: Request): Promise<Record<string, string>> {
  const type = request.headers.get('content-type') ?? '';
  if (type.includes('application/json')) {
    const data = (await request.json()) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v ?? '')]));
  }
  const form = await request.formData();
  return Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)]));
}

async function rateLimited(ip: string): Promise<boolean> {
  const minute = Math.floor(Date.now() / 60000);
  for (const key of counters.keys()) if (Number(key.split(':')[1]) < minute - 1) counters.delete(key);
  const key = `${hex(await sha256(`bleib-rl:${ip}`), 8)}:${minute}`;
  const count = counters.get(key) ?? 0;
  if (count >= LIMIT_PER_MINUTE) return true;
  counters.set(key, count + 1);
  return false;
}

async function signup(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST' } });
  }
  let body: Record<string, string>;
  try {
    body = await readBody(request);
  } catch {
    return json({ ok: false, error: 'bad_request' }, 400);
  }

  // Bots fill the hidden field; pretend success and store nothing.
  if (body.company) return json({ ok: true });

  const email = (body.email ?? '').trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 254) return json({ ok: false, error: 'invalid_email' }, 400);
  const lang = body.lang === 'de' ? 'de' : 'en';

  const ip = request.headers.get('x-real-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  if (await rateLimited(ip.trim())) return json({ ok: false, error: 'rate_limited' }, 429);

  const key = process.env.SIGNUPS_STORAGE_KEY;
  if (!key) {
    console.error('signup storage failed: SIGNUPS_STORAGE_KEY is not set');
    return json({ ok: false, error: 'unavailable' }, 503);
  }
  const url = STORAGE + hex(await sha256(email)) + '.json';
  const headers = { AccessKey: key };

  const existing = await fetch(url, { headers });
  if (existing.ok) return json({ ok: true });
  const saved = await fetch(url, {
    method: 'PUT',
    headers: { ...headers, 'content-type': 'application/octet-stream' },
    body: JSON.stringify({ email, lang, createdAt: new Date().toISOString() }),
  });
  if (saved.ok) return json({ ok: true });
  // Log only the storage status codes: never the address, the key or the IP.
  console.error(`signup storage failed: lookup ${existing.status}, write ${saved.status}`);
  return json({ ok: false, error: 'unavailable' }, 503);
}

BunnySDK.net.http
  .servePullZone()
  .onClientRequest(async (ctx) => {
    const path = new URL(ctx.request.url).pathname.replace(/\/+$/, '');
    if (path === PATH) return signup(ctx.request);
    return ctx.request;
  });
