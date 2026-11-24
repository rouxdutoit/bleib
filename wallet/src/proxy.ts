import type { IncomingMessage, ServerResponse } from 'node:http';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { credentialPattern, UserError } from './domain.js';
import type { ObservedDestination, ProxyProtocol } from './domain.js';
import { json, jsonBody } from './http.js';
import { referencePattern, referencePrefix, type Wallet } from './wallet.js';

const paths: Record<ProxyProtocol, string> = {
  openai: '/v1/chat/completions',
  anthropic: '/v1/messages',
};

interface Route extends Omit<ObservedDestination, 'model'> { url: string; key?: string }
export type ProxyRoutes = Partial<Record<ProxyProtocol, Route>>;

export function proxyRoutes(env: NodeJS.ProcessEnv): ProxyRoutes {
  const routes: ProxyRoutes = {};
  for (const protocol of ['openai', 'anthropic'] as const) {
    const prefix = `BLEIB_${protocol.toUpperCase()}`;
    const input = env[`${prefix}_UPSTREAM`];
    if (!input) continue;
    const url = URL.canParse(input) ? new URL(input) : undefined;
    const local = url?.hostname === '127.0.0.1' || url?.hostname === '[::1]';
    if (!url || (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) ||
        url.username || url.password || url.search || url.hash || url.pathname !== paths[protocol]) {
      throw new UserError(`Set ${prefix}_UPSTREAM to a full HTTPS endpoint or a loopback endpoint ending in ${paths[protocol]}.`);
    }
    const provider = (env[`${prefix}_PROVIDER`] ?? (protocol === 'openai' ? 'OpenAI' : 'Anthropic')).trim();
    const key = env[`${prefix}_API_KEY`];
    if (!provider || provider.length > 100 || /[\p{Cc}\p{Cf}]/u.test(provider) ||
        (key && !/^[!-~]+$/.test(key))) throw new UserError(`Check the ${prefix} provider and API key settings.`);
    routes[protocol] = { protocol, provider, hosted: !local, origin: url.origin, url: url.href, key };
  }
  return routes;
}

type JsonObject = Record<string, unknown>;
function object(value: unknown): JsonObject | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonObject : undefined;
}

function projectionSlots(protocol: ProxyProtocol, messages: unknown[]) {
  const references: string[] = [];
  const slots: { target: JsonObject; key: string }[] = [];
  function textSlot(target: JsonObject, key: string) {
    const value = target[key];
    if (typeof value !== 'string' || !value.includes(referencePrefix)) return;
    if (!referencePattern.test(value) || references.includes(value) || references.length >= 20) {
      throw new UserError('Keep each bleib reference unchanged and use it once per request.');
    }
    references.push(value);
    slots.push({ target, key });
    target[key] = null;
  }
  function contentSlots(container: JsonObject) {
    textSlot(container, 'content');
    if (!Array.isArray(container.content)) return;
    for (const rawBlock of container.content) {
      const block = object(rawBlock);
      if (block?.type === 'text') textSlot(block, 'text');
    }
  }
  for (const raw of messages) {
    const message = object(raw);
    if (!message) continue;
    if (protocol === 'openai' && message.role === 'tool') contentSlots(message);
    if (protocol === 'anthropic' && message.role === 'user' && Array.isArray(message.content)) {
      for (const rawBlock of message.content) {
        const block = object(rawBlock);
        if (block?.type === 'tool_result') contentSlots(block);
      }
    }
  }
  return { references, slots };
}

function modelCredential(protocol: ProxyProtocol, req: IncomingMessage) {
  const bearer = /^Bearer (.+)$/i.exec(req.headers.authorization ?? '')?.[1];
  const apiKey = protocol === 'anthropic' ? req.headers['x-api-key'] : undefined;
  if (Array.isArray(apiKey) || (bearer && apiKey && bearer !== apiKey)) return undefined;
  const credential = bearer ?? apiKey;
  return credential && credentialPattern.test(credential) ? credential : undefined;
}

export async function handleProxy(wallet: Wallet, routes: ProxyRoutes, req: IncomingMessage, res: ServerResponse, path: string) {
  const protocol = path === paths.openai ? 'openai' : 'anthropic';
  const error = (status: number, message: string) => json(res, status, { error: { message } });
  if (req.method !== 'POST' || req.url !== path) return error(405, 'Use POST at the model endpoint.');
  const token = modelCredential(protocol, req);
  if (!token) return error(401, 'Use the paired agent credential.');
  const route = routes[protocol];
  if (!route) return error(404, 'The wallet has no upstream for this endpoint.');
  const request = object(await jsonBody(req, 8 * 1024 * 1024));
  const model = request?.model;
  if (typeof model !== 'string' || model.length > 240 || !model.trim() || /[\p{Cc}\p{Cf}]/u.test(model) ||
      !Array.isArray(request?.messages)) return error(400, 'Include a model and messages.');

  const { references, slots } = projectionSlots(protocol, request.messages);
  if (JSON.stringify(request).includes(referencePrefix)) return error(400, 'Put each bleib reference in its own tool result.');
  if (route.origin === `http://${req.headers.host}`) return error(409, 'The upstream points back to this wallet.');
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (protocol === 'anthropic') {
    headers.set('anthropic-version', '2023-06-01');
    if (route.key) headers.set('x-api-key', route.key);
  } else if (route.key) headers.set('authorization', `Bearer ${route.key}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000).unref();
  res.once('close', () => {
    clearTimeout(timeout);
    controller.abort();
  });
  const result = await wallet.forward(token, { ...route, model }, references, replacements => {
    if (controller.signal.aborted || res.destroyed) throw new UserError('The model request ended.');
    for (const [index, { target, key }] of slots.entries()) target[key] = replacements[index];
    // Re-encode even without replacements so the upstream sees the same model we validated.
    return Buffer.from(JSON.stringify(request));
  }, payload => fetch(route.url, {
    method: 'POST', headers, body: Buffer.from(payload), redirect: 'error',
    signal: controller.signal,
  }).catch(() => undefined));

  if (result.state === 'destination_conflict') return error(409, 'This model destination differs from the paired destination. Open the wallet to review.');
  if (result.state === 'reference_unavailable') return error(409, 'A bleib reference is no longer available. Remove it and request context again.');
  if (result.state !== 'forwarded') return error(result.state === 'locked' ? 423 : 403, 'Check the wallet lock and pairing.');
  const upstream = await result.dispatch;
  if (!upstream) return error(502, 'The model endpoint could not be reached.');
  if (!upstream.ok) {
    await upstream.body?.cancel();
    return error(upstream.status, 'The model endpoint declined the request.');
  }
  const type = upstream.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase();
  if (type !== 'application/json' && type !== 'text/event-stream') {
    await upstream.body?.cancel();
    return error(502, 'The model endpoint returned an unsupported response.');
  }
  res.writeHead(upstream.status, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  if (upstream.body) await pipeline(Readable.fromWeb(upstream.body as Parameters<typeof Readable.fromWeb>[0]), res);
  else res.end();
}

export const isProxyPath = (path: string) => path === paths.openai || path === paths.anthropic;
