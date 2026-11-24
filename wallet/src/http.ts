import type { IncomingMessage, ServerResponse } from 'node:http';
import { UserError } from './domain.js';

const defaultLimit = 32 * 1024;

export async function body(req: IncomingMessage, limit = defaultLimit) {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) {
      req.destroy();
      throw new UserError('This request is too large.');
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

export function typeIs(req: IncomingMessage, mediaType: string) {
  return req.headers['content-type']?.split(';')[0]?.trim().toLowerCase() === mediaType;
}

export async function jsonBody(req: IncomingMessage, limit?: number) {
  if (!typeIs(req, 'application/json')) throw new UserError('Expected a JSON request.');
  const raw = await body(req, limit);
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new UserError('The request could not be read.');
  }
}

export function json(res: ServerResponse, status: number, value: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(value));
}

export function text(res: ServerResponse, status: number, data: string) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(data);
}

export function redirect(res: ServerResponse, target: string) {
  res.writeHead(303, { Location: target });
  res.end();
}
