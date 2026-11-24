import { constants } from 'node:fs';
import { lstat, open, readdir, realpath, stat } from 'node:fs/promises';
import { basename, join, relative } from 'node:path';
import { parse, stringify } from 'yaml';
import { z } from 'zod';
import { kindSchema, normalize, sensitiveKind, sha256, UserError } from './domain.js';
import type { Ask, Entry, Kind, Preview } from './domain.js';
import { missing, type Store } from './store.js';

export const maxMemoryBytes = 128 * 1024;
type Metadata = Record<string, unknown>;

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

const pcpDate = z.string().regex(/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/)
  .refine(value => Number.isFinite(Date.parse(value)));
const weight = z.number().min(0).max(1);
const pcpFields: Readonly<Record<string, z.ZodType | undefined>> = {
  type: z.enum(['episodic', 'semantic', 'procedural']),
  tags: z.array(z.string()),
  lifecycle: z.enum(['active', 'validated', 'stale', 'archived']),
  confidence: weight, importance: weight,
  valid_from: pcpDate, valid_until: pcpDate, expires: z.iso.datetime(),
  partition: z.string().regex(/^[a-z0-9][a-z0-9_-]{0,63}$/),
  derived_from: z.array(z.string()),
  relations: z.array(z.object({ rel: z.string(), target: z.string(), confidence: weight.optional() }).strict()),
};
const pcpSource = z.object({
  origin: z.enum(['chat', 'agent', 'connector', 'import', 'user', 'consolidation']).optional(),
  basis: z.enum(['provided', 'observed', 'inferred']).optional(),
  at: pcpDate.optional(),
});

export function formatMemory(body: string, metadata: Metadata, options: {
  id: string; title: string; kind: Kind; sensitive: boolean; updated: string; created: string;
  importedFrom?: { format: ImportDialect; file: string; digest: string };
}) {
  if (Buffer.byteLength(body) > maxMemoryBytes) throw new UserError('This note is too large.');
  const { id, title, kind, sensitive, updated, created, importedFrom } = options;
  const source = object(metadata.source);
  const basis = pcpSource.shape.basis.safeParse(source.basis).data;
  const origin = pcpSource.shape.origin.safeParse(source.origin).data;
  const at = pcpSource.shape.at.safeParse(source.at).data;
  const attributes: Metadata = Object.fromEntries(Object.entries(metadata).filter(([key, value]) =>
    /^x[_-]/.test(key) || (Object.hasOwn(pcpFields, key) && pcpFields[key]?.safeParse(value).success)));
  // An unrecognized validity limit should never make a note eligible for sharing.
  if (['valid_from', 'valid_until', 'expires'].some(key => Object.hasOwn(metadata, key) && !Object.hasOwn(attributes, key))) {
    attributes.lifecycle = 'archived';
  }
  const provenance = importedFrom ? { ...importedFrom, original: metadata } : attributes.x_import;
  const frontmatter = {
    ...attributes,
    id, title, updated, recorded_at: created, x_category: kind, x_created: created,
    sensitivity: sensitive || sensitiveKind(kind) ? 'sensitive' : 'normal',
    source: {
      origin: importedFrom ? 'import' : origin ?? 'user',
      basis: basis ?? 'provided',
      ...(at ? { at } : {}),
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
      let size = 0;
      while (size < buffer.length) {
        const { bytesRead } = await file.read(buffer, size, buffer.length - size);
        if (!bytesRead) break;
        size += bytesRead;
      }
      if (size > maxMemoryBytes) throw new UserError('A workspace note is larger than 128 KiB.');
      try {
        return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(buffer.subarray(0, size));
      } catch {
        throw new UserError('Workspace notes must use UTF-8.');
      }
    } finally {
      await file.close();
    }
  } catch (error) {
    if (missing(error) || (error as NodeJS.ErrnoException).code === 'ELOOP') return;
    if (error instanceof UserError) throw error;
    throw new UserError('A workspace note could not be read.');
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
  if (!(await stat(root)).isDirectory()) throw new UserError('Choose a workspace directory.');
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

const stopWords = new Set([
  'a', 'an', 'and', 'are', 'about', 'be', 'can', 'could', 'does', 'for', 'from', 'have', 'how',
  'in', 'is', 'it', 'my', 'of', 'on', 'or', 'please', 'that', 'the', 'this', 'to', 'was', 'what',
  'when', 'where', 'which', 'with', 'you', 'your',
  'das', 'der', 'die', 'ein', 'eine', 'für', 'ist', 'mein', 'mit', 'und', 'von', 'was', 'welche',
]);
const words = (text: string) => normalize(text).match(/[\p{L}\p{N}]+/gu) ?? [];
const eligibleLine = (line: string) => line.length >= 2 && line.length <= 240 &&
  /[\p{L}\p{N}]/u.test(line) && !/[\p{Cc}\p{Cf}]/u.test(line) &&
  !/^(?:[#><`~]|(?:\+|-){3}|\|)/.test(line);
const dateExpired = (input: unknown, now: number, endOfDay = false) => {
  if (input === undefined) return false;
  if (typeof input !== 'string') return true;
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(input);
  const parsed = Date.parse(endOfDay && dateOnly ? `${input}T23:59:59.999Z` : input);
  return !Number.isFinite(parsed) || parsed < now;
};

export async function project(store: Store, ask: Ask, now: number): Promise<Preview> {
  const query = words(ask.question || ask.purpose);
  const terms = [...new Set(query.filter(word => word.length > 1 && !stopWords.has(word)))];
  const matching = new Map<Kind, { entry: Entry; line: string; score: number }>();
  for (const entry of store.entries.values()) {
    if (entry.ownerOnly || !ask.kinds.includes(entry.kind)) continue;
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
      const score = terms.filter(term => tokens.has(term)).length + (ask.question ? 0 : 1);
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
