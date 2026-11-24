import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';

export const kinds = [
  'identity', 'contact', 'preferences', 'work', 'education', 'location', 'schedule',
  'activities', 'health', 'finances', 'relationships', 'credentials', 'private',
] as const;
export type Kind = (typeof kinds)[number];
export const labels: Record<Kind, string> = {
  identity: 'About you', contact: 'Contact details', preferences: 'Preferences',
  work: 'Work and projects', education: 'Education and skills', location: 'Places',
  schedule: 'Plans and appointments', activities: 'Activities and interests',
  health: 'Health', finances: 'Finances', relationships: "Other people’s private details",
  credentials: 'Credentials', private: 'Unsorted private notes',
};
export const sensitiveKind = (kind: Kind) =>
  ['health', 'finances', 'relationships', 'credentials', 'private'].includes(kind);

export const kindSchema = z.enum(kinds);
export const askSchema = z.object({
  purpose: z.string().trim().min(1).max(240).regex(/^[^\p{Cc}\p{Cf}]+$/u),
  kinds: z.array(kindSchema).min(1).max(kinds.length),
  question: z.string().trim().max(500).optional(),
}).strict();
export const proposeSchema = z.object({
  content: z.string().trim().min(1).max(8000),
  kind: kindSchema,
  reason: z.string().trim().min(1).max(500),
}).strict();
export type Ask = z.infer<typeof askSchema>;
export type Proposed = z.infer<typeof proposeSchema>;

export type ProxyProtocol = 'openai' | 'anthropic';
export type Destination = {
  value: string; provider: string | null; model: string | null;
  proxy?: { protocol: ProxyProtocol; origin: string };
};
export interface ObservedDestination {
  protocol: ProxyProtocol; origin: string; provider: string; model: string; hosted: boolean;
}

export function destination(value: string, model?: string): Destination {
  if (model !== undefined && (!model.trim() || model.length > 100 || /[\p{Cc}\p{Cf}]/u.test(model))) {
    throw new UserError('Enter a model name of 1 to 100 characters.');
  }
  if (value === 'local') return { value, provider: null, model: model?.trim() ?? null };
  const match = /^(provider|third-party):([^\p{Cc}\p{Cf}]{1,100})$/u.exec(value);
  const provider = match?.[2]?.trim();
  if (!provider) throw new UserError('Use local, provider:<name> or third-party:<name>.');
  return { value: `${match?.[1]}:${provider}`, provider, model: model?.trim() ?? null };
}

export interface EntryRef { id: string; version: number }
export interface Entry extends EntryRef {
  file: string;
  digest: string;
  title: string;
  kind: Kind;
  sensitive: boolean;
  sourceId?: string;
}

export interface Pairing {
  id: string;
  name: string;
  destination: Destination;
  codeHash: string;
  expires: number;
  used: boolean;
}
export interface Agent {
  id: string;
  name: string;
  destination: Destination;
  credentialHash: string;
  revoked: boolean;
}
export interface Scope { agentId: string; kind: Kind; destination: string; purpose?: string }
export interface Grant extends Scope {
  id: string;
  duration: 'once' | 'always' | 'denied';
  sensitive: boolean;
  lastUsed: number;
  decidedAt?: string;
  revoked: boolean;
  consumePreview?: { request: string; fingerprint: string; expires: number };
}
export interface Preview {
  content: string;
  entries: EntryRef[];
  sensitiveKinds: Kind[];
  releasedKinds: Kind[];
}
export interface Approval extends Preview {
  id: string;
  agentId: string;
  agentName: string;
  destination: Destination;
  ask: Ask;
  needed: Kind[];
  request: string;
  fingerprint: string;
  expires: number;
  decided: boolean;
}
export interface Proposal extends Proposed { id: string; agent: string; time: string }
export interface Receipt {
  receipt_id: string;
  time: string;
  agent: string;
  agent_id: string;
  destination: string;
  destination_basis: 'declared' | 'observed';
  destination_host?: string;
  outbound_digest?: string;
  decisions?: { kind: Kind; grant_id: string; mode: 'once' | 'always'; decided_at?: string }[];
  provider: string | null;
  model: string | null;
  purpose: string;
  kinds: Kind[];
  grant_id: string;
  grant_ids: string[];
  content: string;
  content_digest: string;
  entries: EntryRef[];
  prev_hash: string | null;
  hash: string;
}
export type ToolReply =
  | { state: 'locked' | 'denied' | 'unavailable' | 'no_match' }
  | { state: 'ready'; agent: string; destination: string; kinds: readonly Kind[] }
  | { state: 'approval_required'; grant_request_id: string; approve_url: string; fresh?: boolean }
  | { state: 'released'; receipt_id: string; content: string; constraints?: string[] }
  | { state: 'proxy_ready'; reference: string; constraints?: string[] }
  | { state: 'proposal_pending'; proposal_id: string };

export class UserError extends Error {}
export const secret = (bytes = 32) => randomBytes(bytes).toString('base64url');
export const sha256 = (bytes: string | Uint8Array) => createHash('sha256').update(bytes).digest('hex');
export const equal = (a: string, b: string) =>
  Buffer.byteLength(a) === Buffer.byteLength(b) && timingSafeEqual(Buffer.from(a), Buffer.from(b));
export const credentialPattern = /^[A-Za-z0-9_-]{43}$/;
export const normalize = (s: string) => s.normalize('NFKC').trim().replace(/\s+/gu, ' ').toLowerCase();

export function canonical(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().filter(key => record[key] !== undefined)
    .map(key => `${JSON.stringify(key)}:${canonical(record[key])}`).join(',')}}`;
}
