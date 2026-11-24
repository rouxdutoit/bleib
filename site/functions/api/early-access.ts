/**
 * Early-access signup (Cloudflare Pages Function).
 * Stores { email, lang, createdAt } in the EARLY_ACCESS KV namespace, one key per email.
 * Abuse protection: honeypot field and a small per-IP rate limit.
 */
interface Env {
  EARLY_ACCESS: KVNamespace;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const LIMIT_PER_MINUTE = 5;

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

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
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

  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const minute = Math.floor(Date.now() / 60000);
  const rlKey = `rl:${ip}:${minute}`;
  const count = Number((await env.EARLY_ACCESS.get(rlKey)) ?? '0');
  if (count >= LIMIT_PER_MINUTE) return json({ ok: false, error: 'rate_limited' }, 429);
  await env.EARLY_ACCESS.put(rlKey, String(count + 1), { expirationTtl: 120 });

  const key = `email:${email}`;
  const existing = await env.EARLY_ACCESS.get(key);
  if (!existing) {
    await env.EARLY_ACCESS.put(key, JSON.stringify({ email, lang, createdAt: new Date().toISOString() }));
  }
  return json({ ok: true });
};

export const onRequest: PagesFunction<Env> = async () =>
  new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST' } });
