import { constants } from 'node:fs';
import { lstat, open, readdir, realpath } from 'node:fs/promises';
import { basename, join, relative } from 'node:path';
import { parse, stringify } from 'yaml';
import { kindSchema, normalize, sensitiveKind, sha256, UserError } from './domain.js';
import type { Ask, Entry, Kind, Preview } from './domain.js';
import { missing, type Store } from './store.js';

export const maxMemoryBytes = 128 * 1024;
type Metadata = Record<string, unknown>;
const basisValues = ['provided', 'observed', 'inferred'];

function object(value: unknown): Metadata {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Metadata : {};
}

export function splitMarkdown(markdown: string) {
  const match = /^\uFEFF?---[ \t]*\r?\n([\s\S]*?)^---[ \t]*(?:\r?\n|$)/m.exec(markdown);
  if (match?.index !== 0) return { body: markdown, metadata: {} as Metadata };
  return { body: markdown.slice(match[0].length), metadata: object(parse(match[1] ?? '', {
    maxAliasCount: 0, logLevel: 'error',
  })) };
}

const pcpKeys = new Set([
  'type', 'tags', 'lifecycle', 'confidence', 'importance', 'valid_from', 'valid_until', 'expires',
  'partition', 'derived_from', 'relations',
]);

export function formatMemory(body: string, metadata: Metadata, options: {
  id: string; title: string; kind: Kind; sensitive: boolean; updated: string; created: string;
  origin?: 'import'; importedFrom?: string;
}) {
  if (Buffer.byteLength(body) > maxMemoryBytes) throw new UserError('This note is too large.');
  const { id, title, kind, sensitive, updated, created, origin, importedFrom } = options;
  const source = object(metadata.source);
  const inputBasis = typeof source.basis === 'string' ? source.basis : '';
  const attributes: Metadata = Object.fromEntries(Object.entries(metadata).filter(([key]) =>
    pcpKeys.has(key) || /^x[_-]/.test(key)));
  const provenance = origin ? { file: importedFrom, original: metadata } : attributes.x_import;
  const frontmatter = {
    ...attributes,
    id, title, updated, recorded_at: created, x_category: kind, x_created: created,
    sensitivity: sensitive || sensitiveKind(kind) ? 'sensitive' : 'normal',
    source: {
      ...source,
      origin: origin ?? source.origin ?? 'user',
      basis: basisValues.includes(inputBasis) ? inputBasis : 'provided',
    },
    ...(provenance === undefined ? {} : { x_import: provenance }),
  };
  return `---\n${stringify(frontmatter, { aliasDuplicateObjects: false })}---\n${body}`;
}

export type ImportDialect = 'openclaw' | 'hermes';

async function safeImportFile(path: string) {
  try {
    const info = await lstat(path);
    if (!info.isFile()) return;
    const file = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
    try {
      const details = await file.stat();
      if (!details.isFile() || details.size > maxMemoryBytes) {
        throw new UserError('A workspace note is larger than 128 KiB or is not a regular file.');
      }
      const buffer = Buffer.alloc(maxMemoryBytes + 1);
      const { bytesRead } = await file.read(buffer);
      if (bytesRead > maxMemoryBytes) throw new UserError('A workspace note is larger than 128 KiB.');
      return new TextDecoder('utf-8', { fatal: true }).decode(buffer.subarray(0, bytesRead));
    } finally {
      await file.close();
    }
  } catch (error) {
    if (missing(error)) return;
    throw error;
  }
}

async function workspaceFiles(root: string, dialect: ImportDialect) {
  const paths = [join(root, 'USER.md'), join(root, 'MEMORY.md')];
  for (const subdir of dialect === 'hermes' ? ['memories', 'memory'] : ['memory']) {
    const directory = join(root, subdir);
    if (!await lstat(directory).then(info => info.isDirectory(), error => {
      if (missing(error)) return false;
      throw error;
    })) continue;
    if (subdir === 'memories') paths.push(join(directory, 'USER.md'), join(directory, 'MEMORY.md'));
    const daily = (await readdir(directory)).filter(name => /^\d{4}-\d{2}-\d{2}\.md$/.test(name)).sort();
    if (daily.length > 366) throw new UserError('Import up to 366 daily notes at a time.');
    paths.push(...daily.map(file => join(directory, file)));
  }
  return paths;
}

export async function readWorkspace(path: string, dialect: ImportDialect) {
  const root = await realpath(path).catch(() => { throw new UserError('That workspace could not be opened.'); });
  const files = [];
  for (const file of await workspaceFiles(root, dialect)) {
    const markdown = await safeImportFile(file);
    if (!markdown?.trim()) continue;
    let parsed;
    try {
      parsed = splitMarkdown(markdown);
    } catch {
      throw new UserError(`The frontmatter in ${basename(file)} is invalid.`);
    }
    const { body, metadata } = parsed;
    const category = kindSchema.safeParse(metadata.x_category ?? metadata.category);
    const kind = category.data ?? 'private';
    const name = relative(root, file).replaceAll('\\', '/');
    files.push({
      body, metadata, kind,
      sensitive: sensitiveKind(kind) || metadata.sensitivity === 'sensitive',
      sourceId: sha256(`${dialect}\0${root}\0${name}`), sourceDigest: sha256(markdown),
      title: typeof metadata.title === 'string' && metadata.title.trim() ? metadata.title.trim().slice(0, 120) : name,
      name,
    });
  }
  if (!files.length) throw new UserError('No supported workspace notes were found.');
  return files;
}

const stopWords = new Set(['what', 'which', 'where', 'when', 'please', 'with', 'from', 'about', 'this', 'that', 'does']);
const words = (text: string) => normalize(text).match(/[\p{L}\p{N}]+/gu) ?? [];
const eligibleLine = (line: string) => line.length >= 2 && line.length <= 240 &&
  /[\p{L}\p{N}]/u.test(line) && !/[\p{Cc}\p{Cf}]/u.test(line) &&
  !/^(?:[#>`~]|(?:\+|-){3}|\|)/.test(line);
const dateExpired = (input: unknown, now: number, endOfDay = false) => {
  if (input === undefined) return false;
  if (typeof input !== 'string') return true;
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(input);
  const parsed = Date.parse(endOfDay && dateOnly ? `${input}T23:59:59.999Z` : input);
  return !Number.isFinite(parsed) || parsed < now;
};

export async function project(store: Store, ask: Ask, now: number): Promise<Preview> {
  const terms = [...new Set(words(ask.question || '').filter(word => word.length > 2 && !stopWords.has(word)))];
  const matching = new Map<Kind, { entry: Entry; line: string; score: number }>();
  for (const entry of store.entries.values()) {
    if (!ask.kinds.includes(entry.kind)) continue;
    const { body, metadata } = splitMarkdown(await store.readEntry(entry));
    if (metadata.lifecycle === 'archived' || metadata.lifecycle === 'stale' ||
        dateExpired(metadata.valid_until, now, true) || dateExpired(metadata.expires, now) ||
        (metadata.valid_from !== undefined &&
         (!Number.isFinite(Date.parse(String(metadata.valid_from))) || Date.parse(String(metadata.valid_from)) > now))) continue;
    let fence = '';
    for (const raw of body.split(/\r?\n/)) {
      const trimmed = raw.trim();
      const marker = /^(?:`{3,}|~{3,})/.exec(trimmed)?.[0];
      if (marker) {
        if (!fence) fence = marker;
        else if (marker[0] === fence[0] && marker.length >= fence.length) fence = '';
        continue;
      }
      if (fence || !eligibleLine(trimmed)) continue;
      const line = trimmed.replace(/^(?:[-*+] |\d+\. )/, '');
      const tokens = new Set(words(line));
      const score = terms.length ? terms.filter(term => tokens.has(term)).length : 1;
      if (score > (matching.get(entry.kind)?.score ?? 0)) matching.set(entry.kind, { entry, line, score });
    }
  }
  const selected = ask.kinds.flatMap(kind => {
    const match = matching.get(kind);
    return match ? [match] : [];
  });
  return {
    content: selected.map(item => item.line).join('\n'),
    entries: selected.map(({ entry: { id, version } }) => ({ id, version })),
    releasedKinds: selected.map(item => item.entry.kind),
    sensitiveKinds: ask.kinds.filter(kind => sensitiveKind(kind) || matching.get(kind)?.entry.sensitive),
  };
}
