import { randomUUID } from 'node:crypto';
import {
  askSchema, canonical, credentialPattern, destination, equal, kinds, kindSchema, normalize,
  proposeSchema, secret, sensitiveKind, sha256, UserError,
} from './domain.js';
import type { Agent, Approval, Ask, Destination, Grant, Kind, ObservedDestination, Preview, ProxyProtocol, Receipt, Scope, ToolReply } from './domain.js';
import { formatMemory, maxMemoryBytes, project, readWorkspace, splitMarkdown, type ImportDialect } from './memory.js';
import { recover, Store } from './store.js';
import { blocked, constraints, parseRule } from './policy.js';
import { summarize } from './summary.js';

const tenMinutes = 10 * 60 * 1000;
const grantLifetime = 90 * 24 * 60 * 60 * 1000;
const maxPendingPerAgent = 20;

const scopeFor = (agent: Agent, kind: Kind, purpose: string): Scope => ({
  agentId: agent.id, kind, destination: agent.destination.value, purpose: normalize(purpose),
});
const sameScope = (grant: Grant, scope: Scope) =>
  grant.agentId === scope.agentId && grant.kind === scope.kind &&
  grant.destination === scope.destination;
const requestKey = (ask: Ask) => sha256(canonical({
  purpose: normalize(ask.purpose), kinds: ask.kinds, question: normalize(ask.question ?? ''),
}));
const previewKey = (preview: Preview) => sha256(canonical({
  content: preview.content, entries: preview.entries, sensitiveKinds: preview.sensitiveKinds,
  releasedKinds: preview.releasedKinds,
}));

function currentGrant(store: Store, scope: Scope, now: number, sensitive: boolean, request: string, fingerprint: string) {
  let allowed: Grant | undefined;
  for (const grant of store.grants.values()) {
    if (!sameScope(grant, scope) || grant.revoked) continue;
    if (grant.duration === 'denied') {
      if (!grant.purpose || grant.purpose === scope.purpose) return grant;
      continue;
    }
    if (grant.duration === 'always' && now - grant.lastUsed >= grantLifetime) continue;
    if (sensitive && !grant.sensitive) continue;
    const preview = grant.consumePreview;
    if (grant.duration === 'once' && (!preview || preview.expires <= now ||
        preview.request !== request || preview.fingerprint !== fingerprint)) continue;
    if (!allowed || grant.duration === 'once') allowed = grant;
  }
  return allowed;
}

interface Reference {
  agentId: string; ask: Ask; fingerprint: string; grants: string[]; expires: number;
}
export const referencePrefix = 'bleib-projection:';
export const referencePattern = /^bleib-projection:[A-Za-z0-9_-]{43}$/;

type OwnerGuard = () => boolean;

type CommitHook = NonNullable<Parameters<typeof Store.unlock>[2]>;

export class Wallet {
  #state?: Store;
  #references = new Map<string, Reference>();
  #queue = Promise.resolve();
  #deadline = 0;
  #timer?: NodeJS.Timeout;
  #failedUnlockUntil = 0;

  constructor(readonly home: string, private readonly origin: string, private readonly options: {
    idleMs: number;
    now?: () => number;
    beforeCommit?: CommitHook;
    onLock?: () => void;
    routes?: Partial<Record<ProxyProtocol, Omit<ObservedDestination, 'model'>>>;
  }) {}

  private now() {
    return (this.options.now ?? Date.now)();
  }

  private serial<T>(action: () => Promise<T> | T): Promise<T> {
    const work = this.#queue.then(async () => {
      if (this.#state && this.#deadline <= this.now()) this.close();
      try {
        return await action();
      } catch (error) {
        if (!(error instanceof UserError)) this.close();
        throw error;
      }
    });
    this.#queue = work.then(() => {}, () => {});
    return work;
  }

  private touch() {
    clearTimeout(this.#timer);
    this.#deadline = this.now() + this.options.idleMs;
    this.#timer = setTimeout(() => {
      void this.serial(() => {});
    }, this.options.idleMs).unref();
  }

  private close() {
    clearTimeout(this.#timer);
    this.#state?.close();
    this.#state = undefined;
    this.#references.clear();
    this.options.onLock?.();
  }

  unlock(passphrase: string) {
    return this.serial(async () => {
      if (this.now() < this.#failedUnlockUntil) throw new UserError('Wait a moment before trying again.');
      try {
        const state = await Store.unlock(this.home, passphrase, this.options.beforeCommit);
        this.close();
        this.#state = state;
        this.touch();
      } catch (error) {
        this.#failedUnlockUntil = this.now() + 1000;
        throw error;
      }
    });
  }

  lock(authorize?: OwnerGuard) {
    return this.serial(() => {
      if (authorize && !authorize()) throw new UserError('Unlock the wallet first.');
      this.close();
    });
  }

  recover(identity: string, passphrase: string) {
    return this.serial(async () => {
      await recover(this.home, identity, passphrase);
      this.close();
    });
  }

  private owner<T>(action: (state: Store, now: number) => Promise<T> | T, authorize?: OwnerGuard) {
    return this.serial(() => {
      if (!this.#state || (authorize && !authorize())) throw new UserError('Unlock the wallet first.');
      this.touch();
      return action(this.#state, this.now());
    });
  }

  ownerStatus() {
    return this.serial(() => ({ unlocked: Boolean(this.#state) }));
  }

  importWorkspace(path: string, dialect: ImportDialect) {
    return this.owner(async (state, now) => {
      const files = await readWorkspace(path, dialect);
      const entries = [];
      const updated = new Date(now).toISOString();
      for (const { body, metadata, name, sourceDigest, ...entry } of files) {
        const existing = Array.from(state.entries.values()).find(current => current.sourceId === entry.sourceId);
        // Import is additive. The local editor owns existing notes, including recategorization.
        if (existing) continue;
        const id = randomUUID();
        const markdown = formatMemory(body, metadata, {
          id, title: entry.title, kind: entry.kind, sensitive: entry.sensitive,
          updated, created: updated, importedFrom: { format: dialect, file: name, digest: sourceDigest },
        });
        entries.push(await state.putEntry({ ...entry, id, version: 1 }, markdown));
      }
      if (entries.length) await state.commit({ entries });
      return { imported: entries.length, skipped: files.length - entries.length };
    });
  }

  pair(name: string, place: string, model?: string, protocol?: ProxyProtocol) {
    return this.owner(async (state, now) => {
      const cleanName = name.trim();
      if (!cleanName || cleanName.length > 100 || /[\p{Cc}\p{Cf}]/u.test(cleanName)) {
        throw new UserError('Enter an agent name of 1 to 100 characters.');
      }
      const target = destination(place, model);
      if (protocol) {
        const route = this.options.routes?.[protocol];
        if (!route || !this.matchesRoute(target, route)) throw new UserError('The configured proxy does not match this destination.');
        target.proxy = { protocol, origin: route.origin };
      }
      const code = secret(18);
      await state.commit({ pairings: [{
        id: randomUUID(), name: cleanName, destination: target, codeHash: sha256(code),
        expires: now + tenMinutes, used: false,
      }] });
      return { code, name: cleanName, expiresInMinutes: 10 };
    });
  }

  redeem(code: string) {
    return this.serial(async () => {
      if (!this.#state) throw new UserError('Unlock the wallet first.');
      const store = this.#state;
      const digest = sha256(code.trim());
      const pairing = Array.from(store.pairings.values()).find(item =>
        item.expires > this.now() && !item.used && equal(item.codeHash, digest));
      if (!pairing) throw new UserError('That pairing code is invalid, expired or already used.');
      const credential = secret();
      const agent: Agent = {
        id: pairing.id, name: pairing.name, destination: pairing.destination,
        credentialHash: sha256(credential), revoked: false,
      };
      await store.commit({ pairings: [{ ...pairing, used: true }], agents: [agent] });
      return { credential, agent: agent.name, destination: agent.destination.value, proxy: agent.destination.proxy?.protocol };
    });
  }

  private withAgent<T>(credential: string, action: (state: Store, agent: Agent) => Promise<T> | T) {
    return this.serial<T | { state: 'denied' | 'locked' }>(() => {
      if (!credentialPattern.test(credential)) return { state: 'denied' };
      const state = this.#state;
      if (!state) return { state: 'locked' };
      const digest = sha256(credential);
      const agent = Array.from(state.agents.values()).find(item => equal(item.credentialHash, digest));
      if (!agent || agent.revoked) return { state: 'denied' };
      return action(state, agent);
    });
  }

  status(credential: string) {
    return this.withAgent<ToolReply>(credential, (_state, agent) => ({
      state: 'ready', agent: agent.name, destination: agent.destination.value, kinds,
    }));
  }

  ask(credential: string, input: Ask) {
    return this.withAgent<ToolReply>(credential, async (store, agent) => {
      const parsed = askSchema.parse(input);
      const ask = { ...parsed, kinds: [...new Set(parsed.kinds)].sort() };
      const now = this.now();
      if (blocked(store.rules.values(), agent, ask)) return { state: 'denied' };
      const projection = await project(store, ask, now);
      const request = requestKey(ask);
      const fingerprint = previewKey(projection);
      const grants = new Map<Kind, Grant>();
      const needed: Kind[] = [];
      for (const kind of ask.kinds) {
        const grant = currentGrant(store, scopeFor(agent, kind, ask.purpose), now,
          projection.sensitiveKinds.includes(kind), request, fingerprint);
        if (grant?.duration === 'denied') return { state: 'denied' };
        if (grant) grants.set(kind, grant);
        else needed.push(kind);
      }
      if (needed.length) {
        const pending = Array.from(store.approvals.values()).filter(item =>
          item.agentId === agent.id && !item.decided && item.expires > now);
        const prior = pending.find(item => item.request === request && item.fingerprint === fingerprint &&
          canonical(item.needed) === canonical(needed));
        if (prior) return this.approvalReply(prior.id);
        if (pending.length >= maxPendingPerAgent) return { state: 'unavailable' };
        const approval: Approval = {
          ...projection, id: randomUUID(), agentId: agent.id, agentName: agent.name, destination: agent.destination,
          ask, needed, request, fingerprint, expires: now + tenMinutes, decided: false,
        };
        await store.commit({ approvals: [approval] });
        return this.approvalReply(approval.id, true);
      }
      if (!projection.content) {
        // A once decision covers one attempt, even when the attempt had no matching excerpt.
        const used = Array.from(grants.values()).filter(grant => grant.consumePreview);
        if (used.length) await store.commit({ grants: used.map(grant => this.usedGrant(grant, now, false)) });
        return { state: 'no_match' };
      }
      const limits = constraints(store.rules.values(), ask);
      if (agent.destination.proxy) {
        return this.prepareReference(agent, ask, fingerprint, grants, now, limits);
      }
      const receipt = this.makeReceipt(agent, ask, projection, grants, now, store.lastReceipt);
      await store.commit({ receipts: [receipt], grants: this.usedGrants(grants, projection, now) });
      return { state: 'released', receipt_id: receipt.receipt_id, content: receipt.content,
        ...(limits.length ? { constraints: limits } : {}) };
    });
  }

  private approvalReply(id: string, fresh = false): ToolReply {
    return { state: 'approval_required', grant_request_id: id, approve_url: `${this.origin}/approvals/${id}`, fresh };
  }

  private usedGrant(grant: Grant, now: number, disclosed = true): Grant {
    return { ...grant, lastUsed: disclosed ? now : grant.lastUsed, revoked: grant.duration === 'once', consumePreview: undefined };
  }

  private usedGrants(grants: Map<Kind, Grant>, projection: Preview, now: number) {
    return [...grants.values()].filter(grant => grant.consumePreview || projection.releasedKinds.includes(grant.kind))
      .map(grant => this.usedGrant(grant, now, projection.releasedKinds.includes(grant.kind)));
  }

  private makeReceipt(agent: Agent, ask: Ask, projection: Preview, grants: Map<Kind, Grant>, now: number,
    previous: string | null, observed?: ObservedDestination, outboundDigest?: string): Receipt {
    const grantIds = projection.releasedKinds.map(kind => grants.get(kind)!.id);
    const body: Omit<Receipt, 'hash'> = {
      receipt_id: randomUUID(), time: new Date(now).toISOString(), agent: agent.name, agent_id: agent.id,
      destination: agent.destination.value, destination_basis: observed ? 'observed' : 'declared',
      provider: observed?.provider ?? agent.destination.provider, model: observed?.model ?? agent.destination.model,
      ...(observed ? { destination_host: new URL(observed.origin).host, outbound_digest: outboundDigest } : {}),
      purpose: ask.purpose, kinds: projection.releasedKinds, grant_id: grantIds[0]!,
      grant_ids: grantIds, content: projection.content, content_digest: sha256(projection.content),
      decisions: projection.releasedKinds.map(kind => {
        const { id, duration, decidedAt } = grants.get(kind)!;
        return { kind, grant_id: id, mode: duration === 'once' ? 'once' : 'always', decided_at: decidedAt };
      }),
      entries: projection.entries, prev_hash: previous,
    };
    return { ...body, hash: sha256(canonical(body)) };
  }

  private prepareReference(agent: Agent, ask: Ask, fingerprint: string, grants: Map<Kind, Grant>, now: number, limits: string[]): ToolReply {
    for (const [key, saved] of this.#references) {
      if (saved.expires <= now) this.#references.delete(key);
    }
    if (this.#references.size >= 256 ||
        [...this.#references.values()].filter(saved => saved.agentId === agent.id).length >= maxPendingPerAgent) {
      return { state: 'unavailable' };
    }
    const reference = referencePrefix + secret();
    this.#references.set(reference, { agentId: agent.id, ask, fingerprint,
      grants: [...grants.values()].map(grant => grant.id), expires: now + tenMinutes });
    return { state: 'proxy_ready', reference, ...(limits.length ? { constraints: limits } : {}) };
  }

  private matchesRoute(target: Destination, route: Omit<ObservedDestination, 'model'>) {
    return (target.value !== 'local') === route.hosted &&
      (!route.hosted || normalize(target.provider ?? '') === normalize(route.provider));
  }

  forward<T>(credential: string, observed: ObservedDestination, references: string[],
    encode: (replacements: string[]) => Uint8Array, dispatch: (payload: Uint8Array) => T) {
    return this.withAgent(credential, async (store, agent) => {
      const now = this.now();
      const target = agent.destination;
      if (!target.proxy) return { state: 'denied' } as const;
      if (target.proxy.protocol !== observed.protocol || target.proxy.origin !== observed.origin ||
          !this.matchesRoute(target, observed) || (target.model !== null && target.model !== observed.model)) {
        if (!store.destinationBlocks.has(agent.id)) {
          await store.commit({ destinationBlocks: [{ agentId: agent.id, time: new Date(now).toISOString() }] });
        }
        return { state: 'destination_conflict' } as const;
      }

      const releases = [];
      const consumed = new Set<string>();
      for (const key of references) {
        const reference = this.#references.get(key);
        if (!reference || reference.agentId !== agent.id || reference.expires <= now ||
            blocked(store.rules.values(), agent, reference.ask)) return { state: 'reference_unavailable' } as const;
        const { ask } = reference;
        const projection = await project(store, ask, now);
        const fingerprint = previewKey(projection);
        if (fingerprint !== reference.fingerprint) return { state: 'reference_unavailable' } as const;
        const grants = new Map<Kind, Grant>();
        for (const [index, kind] of ask.kinds.entries()) {
          const grant = currentGrant(store, scopeFor(agent, kind, ask.purpose), now, projection.sensitiveKinds.includes(kind),
            requestKey(ask), fingerprint);
          if (!grant || grant.duration === 'denied' || grant.id !== reference.grants[index] ||
              (grant.duration === 'once' && consumed.has(grant.id))) return { state: 'reference_unavailable' } as const;
          if (grant.duration === 'once') consumed.add(grant.id);
          grants.set(kind, grant);
        }
        releases.push({ ask, projection, grants });
      }

      const payload = encode(releases.map(item => item.projection.content));
      if (releases.length) {
        const digest = sha256(payload);
        const receipts = [];
        const grants = new Map<string, Grant>();
        let previous = store.lastReceipt;
        for (const item of releases) {
          const receipt = this.makeReceipt(agent, item.ask, item.projection, item.grants, now, previous, observed, digest);
          receipts.push(receipt);
          previous = receipt.hash;
          for (const grant of this.usedGrants(item.grants, item.projection, now)) {
            if (!grants.has(grant.id) || grants.get(grant.id)!.lastUsed < grant.lastUsed) grants.set(grant.id, grant);
          }
        }
        await store.commit({ receipts, grants: [...grants.values()] });
        for (const key of references) this.#references.delete(key);
      }
      return { state: 'forwarded', dispatch: dispatch(payload) } as const;
    });
  }

  rules(authorize?: OwnerGuard) {
    return this.owner(store => [...store.rules.values()], authorize);
  }

  previewRule(text: string, authorize?: OwnerGuard) {
    return this.owner(store => parseRule(text, store.agents.values()), authorize);
  }

  saveRule(text: string, fingerprint: string, authorize?: OwnerGuard) {
    return this.owner(async store => {
      const preview = parseRule(text, store.agents.values());
      if (!equal(preview.fingerprint, fingerprint)) throw new UserError('The rule changed. Review it again.');
      if (store.rules.size >= 100) throw new UserError('Remove a rule before saving another one.');
      await store.commit({ rules: [{ id: randomUUID(), text: preview.text, policy: preview.policy }] });
    }, authorize);
  }

  removeRule(id: string, authorize?: OwnerGuard) {
    return this.owner(async store => {
      if (!store.rules.has(id)) throw new UserError('That rule was not found.');
      await store.commit({ removedRules: [id] });
    }, authorize);
  }

  destinationAlerts(authorize?: OwnerGuard) {
    return this.owner(store => [...store.destinationBlocks].map(([id, time]) =>
      ({ name: store.agents.get(id)?.name ?? 'An agent', time })), authorize);
  }

  clearDestinationAlerts(authorize?: OwnerGuard) {
    return this.owner(store => store.commit({ clearedDestinationBlocks: [...store.destinationBlocks.keys()] }), authorize);
  }

  summary(authorize?: OwnerGuard) {
    return this.owner((store, now) => summarize(store.receipts.values(), now), authorize);
  }

  approve(id: string, choice: 'once' | 'always' | 'no', confirmed: boolean, authorize?: OwnerGuard) {
    return this.owner(async (store, now) => {
      const approval = store.approvals.get(id);
      const agent = approval && store.agents.get(approval.agentId);
      if (!approval || approval.decided || approval.expires <= now || !agent || agent.revoked) {
        throw new UserError('This request is no longer active.');
      }
      if (blocked(store.rules.values(), agent, approval.ask)) throw new UserError('A wallet rule blocks this request.');
      const projection = await project(store, approval.ask, now);
      if (previewKey(projection) !== approval.fingerprint) {
        throw new UserError('The notes changed. Ask the agent to send a new request.');
      }
      if (choice === 'always' && approval.needed.some(kind => approval.sensitiveKinds.includes(kind)) && !confirmed) {
        throw new UserError('Confirm ongoing access to sensitive information, or choose Allow once.');
      }
      const grants = [];
      for (const kind of approval.needed) {
        const scope = scopeFor(agent, kind, approval.ask.purpose);
        const sensitive = approval.sensitiveKinds.includes(kind);
        if (currentGrant(store, scope, now, sensitive, approval.request, approval.fingerprint)) {
          throw new UserError('A decision already covers this request. Ask the agent to try again.');
        }
        if (choice === 'always') {
          for (const grant of store.grants.values()) {
            if (sameScope(grant, scope) && grant.duration === 'always' && !grant.revoked) {
              grants.push({ ...grant, revoked: true });
            }
          }
        }
        grants.push({
          ...scope, purpose: choice === 'no' ? scope.purpose : undefined, id: randomUUID(), duration: choice === 'no' ? 'denied' : choice,
          lastUsed: now, decidedAt: new Date(now).toISOString(), revoked: false, sensitive,
          ...(choice !== 'once' ? {} : { consumePreview: {
            request: approval.request, fingerprint: approval.fingerprint,
            expires: approval.expires,
          } }),
        } satisfies Grant);
      }
      await store.commit({ grants, approvals: [{ ...approval, decided: true }] });
    }, authorize);
  }

  propose(credential: string, input: unknown) {
    return this.withAgent<ToolReply>(credential, async (store, agent) => {
      const proposal = proposeSchema.parse(input);
      const id = randomUUID();
      await store.commit({ proposals: [{ ...proposal, id, agent: agent.name, time: new Date(this.now()).toISOString() }] });
      return { state: 'proposal_pending', proposal_id: id };
    });
  }

  revoke(idOrName: string, authorize?: OwnerGuard) {
    return this.owner(async (store, now) => {
      const grant = store.grants.get(idOrName);
      const exactAgent = store.agents.get(idOrName);
      const agents = exactAgent ? [exactAgent] : [...store.agents.values()].filter(agent =>
        !agent.revoked && agent.name === idOrName);
      if (agents.length > 1 && !grant) throw new UserError('More than one agent has this name. Use its ID.');
      const agent = agents[0];
      if ((!grant || grant.revoked) && (!agent || agent.revoked)) throw new UserError('No active agent or decision matched.');
      const approvals = [...store.approvals.values()].filter(item => !item.decided && item.expires > now &&
        (agent && !grant ? item.agentId === agent.id : grant && item.agentId === grant.agentId &&
          item.ask.kinds.includes(grant.kind) &&
          (grant.duration !== 'denied' || !grant.purpose || normalize(item.ask.purpose) === grant.purpose)));
      await store.commit({
        ...(grant ? { grants: [{ ...grant, revoked: true }] } : agent ? { agents: [{ ...agent, revoked: true }] } : {}),
        approvals: approvals.map(item => ({ ...item, decided: true })),
      });
    }, authorize);
  }

  entries(authorize?: OwnerGuard) {
    return this.owner(store => Array.from(store.entries.values()), authorize);
  }

  entry(id: string, authorize?: OwnerGuard) {
    return this.owner(async store => {
      const entry = store.entries.get(id);
      if (!entry) throw new UserError('That note was not found.');
      return { ...entry, body: splitMarkdown(await store.readEntry(entry)).body };
    }, authorize);
  }

  edit(id: string, version: number, input: { title: string; body: string; kind: Kind; sensitive: boolean }, authorize?: OwnerGuard) {
    return this.owner(async (store, now) => {
      const entry = store.entries.get(id);
      if (!entry || entry.version !== version) throw new UserError('This note changed. Open it again before saving.');
      const title = input.title.trim();
      if (!title || title.length > 120 || Buffer.byteLength(input.body) > maxMemoryBytes) {
        throw new UserError('Enter a title and keep the note at or below 128 KiB.');
      }
      const kind = kindSchema.parse(input.kind);
      const { metadata } = splitMarkdown(await store.readEntry(entry));
      const updated = new Date(now).toISOString();
      const sensitive = input.sensitive || sensitiveKind(kind);
      const markdown = formatMemory(input.body, metadata, {
        id, title, kind, sensitive, updated, created: String(metadata.recorded_at ?? updated),
      });
      const saved = await store.putEntry({ ...entry, title, kind, sensitive, version: version + 1 }, markdown);
      await store.commit({ entries: [saved] });
    }, authorize);
  }

  approvals(authorize?: OwnerGuard) {
    return this.owner((store, now) => Array.from(store.approvals.values()).filter(item =>
      !item.decided && item.expires > now && !store.agents.get(item.agentId)?.revoked), authorize);
  }

  grants(authorize?: OwnerGuard) {
    return this.owner((store, now) => ({
      agents: [...store.agents.values()].filter(agent => !agent.revoked).map(({ id, name, destination }) =>
        ({ id, name, destination })),
      grants: [...store.grants.values()].filter(grant => !grant.revoked && !store.agents.get(grant.agentId)?.revoked &&
        (grant.duration !== 'always' || now - grant.lastUsed < grantLifetime) &&
        (grant.duration !== 'once' || (grant.consumePreview?.expires ?? 0) > now)),
    }), authorize);
  }

  proposals(authorize?: OwnerGuard) {
    return this.owner(store => Array.from(store.proposals.values()).reverse(), authorize);
  }

  receipts(id?: string, authorize?: OwnerGuard) {
    return this.owner(store => {
      if (!id) return Array.from(store.receipts.values()).reverse();
      const receipt = store.receipts.get(id);
      if (!receipt) throw new UserError('That receipt was not found.');
      return [receipt];
    }, authorize);
  }
}
